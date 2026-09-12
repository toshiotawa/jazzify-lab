import Combine
import Foundation

struct TrainingHudState: Equatable {
    var remainSec: Int
    var score: Int
    var countdownSec: Int
    var phase: TrainingGamePhase
}

@MainActor
final class TrainingGameSession: ObservableObject {
    private(set) var runtime: TrainingRuntime
    @Published private(set) var hud: TrainingHudState
    @Published private(set) var question: TrainingQuestion?
    @Published private(set) var correctIndices: [Int] = []
    @Published private(set) var midiHeldKeys: Set<Int> = []

    let training: TrainingRow
    let practiceMode: Bool
    let ignoreNotationInstrument: Bool
    private let lessonContext: TrainingLessonContext?

    private var lastFrameTime: TimeInterval?
    private var previousQuestionKey: String?
    var isPaused = false
    private var countdownTask: Task<Void, Never>?
    private let midiSubscriptionHolder = MIDISubscriptionHolder()

    init(
        training: TrainingRow,
        practiceMode: Bool,
        lessonContext: TrainingLessonContext?
    ) {
        self.training = training
        self.practiceMode = practiceMode
        self.lessonContext = lessonContext
        self.ignoreNotationInstrument = training.clefMode == .bassConcert || training.clefMode == .grandConcert
        let runtime = TrainingEngine.createInitialRuntime()
        self.runtime = runtime
        self.hud = TrainingHudState(
            remainSec: Int(TrainingConstants.gameDurationSec),
            score: 0,
            countdownSec: TrainingConstants.countdownSec,
            phase: .countdown
        )
    }

    func start() async {
        subscribeMidi()
        spawnQuestion()
        startCountdown()
        if let url = URL(string: training.bgmUrl) {
            try? await DefenseBackingAudio.shared.preload(urls: [url])
        }
    }

    func stop() {
        countdownTask?.cancel()
        countdownTask = nil
        midiSubscriptionHolder.cancel()
        midiHeldKeys.removeAll()
        DefenseBackingAudio.shared.stop()
    }

    func advanceFrame(currentTime: TimeInterval) {
        if isPaused {
            lastFrameTime = currentTime
            return
        }

        let last = lastFrameTime ?? currentTime
        let dt = min(0.05, currentTime - last)
        lastFrameTime = currentTime

        guard hud.phase == .playing else { return }

        let finished = TrainingEngine.tickTimer(runtime: &runtime, dt: dt)
        let remainSec = max(0, Int(runtime.durationSec - runtime.elapsedSec.rounded(.down)))
        if remainSec != hud.remainSec {
            hud.remainSec = remainSec
        }

        TrainingEngine.tickEnemy(
            runtime: &runtime,
            nowSec: runtime.elapsedSec,
            dt: dt
        )

        if finished {
            runtime.result = .finished
            hud.phase = .finished
            DefenseBackingAudio.shared.stop()
            recordLessonProgressIfNeeded()
        }
    }

    private func startCountdown() {
        countdownTask?.cancel()
        countdownTask = Task { @MainActor in
            var remaining = TrainingConstants.countdownSec
            hud.countdownSec = remaining
            while remaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                remaining -= 1
                hud.countdownSec = remaining
            }
            hud.phase = .playing
            runtime.elapsedSec = 0
            if let url = URL(string: training.bgmUrl) {
                try? await DefenseBackingAudio.shared.start(firstUrl: url)
            }
        }
    }

    private func subscribeMidi() {
        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = NoteInputManager.shared.subscribe { [weak self] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            DispatchQueue.main.async {
                guard let self else { return }
                let playPiano = !NoteInputManager.shared.isVoiceInputActive
                if isNoteOn {
                    if playPiano {
                        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: note, velocity: velocity)
                    }
                    self.registerMidiKeyDown(note)
                    self.handleNoteOn(midiNote: note)
                } else if isNoteOff {
                    self.registerMidiKeyUp(note)
                    if playPiano {
                        SurvivalGameAudio.shared.pianoNoteOff(midi: note)
                    }
                }
            }
        }
    }

    func registerMidiKeyDown(_ midi: Int) {
        guard midiHeldKeys.insert(midi).inserted else { return }
    }

    func registerMidiKeyUp(_ midi: Int) {
        guard midiHeldKeys.remove(midi) != nil else { return }
    }

    func handleNoteOn(midiNote: Int) {
        guard !isPaused, hud.phase == .playing, runtime.result == .playing else { return }
        guard let current = runtime.question else { return }

        let result = TrainingEngine.evaluateNoteOn(
            question: current,
            correctIndices: runtime.correctTargetIndices,
            midiNote: midiNote,
            sequential: NoteInputManager.shared.isVoiceInputActive
        )
        guard result.accepted else { return }

        runtime.correctTargetIndices = result.newCorrectIndices
        correctIndices = result.newCorrectIndices

        if training.playRootOnCorrect, let rootMidi = current.rootMidi {
            SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: rootMidi, velocity: 90)
            SurvivalGameAudio.shared.pianoNoteOff(midi: rootMidi)
        }

        guard result.completed else { return }

        TrainingEngine.performDefeat(
            runtime: &runtime,
            nowSec: runtime.elapsedSec,
            guardPoseSec: TrainingConstants.guardPoseSec
        )
        runtime.score += 1
        if runtime.score != hud.score {
            hud.score = runtime.score
        }
        spawnQuestion()
    }

    private func spawnQuestion() {
        let built = TrainingQuestionBuilder.buildQuestion(options: TrainingQuestionBuilderOptions(
            training: training,
            ignoreNotationInstrument: ignoreNotationInstrument,
            lessonRoots: nil,
            lessonOrder: nil,
            lessonItems: nil,
            lessonItemIndex: nil,
            previousQuestionKey: previousQuestionKey
        ))
        previousQuestionKey = built.questionKey
        runtime.question = built
        runtime.correctTargetIndices = []
        question = built
        correctIndices = []
    }

    private func recordLessonProgressIfNeeded() {
        guard !practiceMode, let lessonContext else { return }
        let requiredRank = TrainingRank.parseLetterRank(lessonContext.clearConditions?.rank ?? "C")
        let score = runtime.score
        guard TrainingRank.meetsRequirement(score: score, requiredRank: requiredRank) else { return }
        let rank = TrainingRank.scoreToRank(score).rawValue
        Task {
            _ = try? await SupabaseService.shared.recordTrainingLessonProgress(
                lessonId: lessonContext.lessonId,
                lessonSongId: lessonContext.lessonSongId,
                rank: rank,
                clearConditions: lessonContext.clearConditions
            )
        }
    }
}
