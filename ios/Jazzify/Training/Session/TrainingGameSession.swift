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
    private let progressionUnits: [TrainingProgressionUnit]?
    private var progressionCursor: TrainingProgressionCursor?
    private let progressionShuffleUnits: Bool
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
        self.progressionShuffleUnits = training.config.shuffleUnits == true
        if training.kind == .progression {
            self.progressionUnits = TrainingProgression.buildUnits(training: training)
        } else {
            self.progressionUnits = nil
        }
        var runtime = TrainingEngine.createInitialRuntime()
        if practiceMode {
            runtime.durationSec = .infinity
        }
        self.runtime = runtime
        self.hud = TrainingHudState(
            remainSec: practiceMode ? 0 : Int(TrainingConstants.gameDurationSec),
            score: 0,
            countdownSec: TrainingConstants.countdownSec,
            phase: .countdown
        )
    }

    func start() async {
        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
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
        SurvivalGameAudio.shared.stop()
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
        if !practiceMode, runtime.durationSec.isFinite {
            let remainSec = max(0, Int(runtime.durationSec - runtime.elapsedSec.rounded(.down)))
            if remainSec != hud.remainSec {
                hud.remainSec = remainSec
            }
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
            if !practiceMode {
                SurvivalGameAudio.shared.playEffect(.stageClear)
            }
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

        let previousCorrectIndices = runtime.correctTargetIndices
        let result = TrainingEngine.evaluateNoteOn(
            question: current,
            correctIndices: previousCorrectIndices,
            midiNote: midiNote,
            sequential: NoteInputManager.shared.isVoiceInputActive
        )
        guard result.accepted else { return }

        runtime.correctTargetIndices = result.newCorrectIndices
        correctIndices = result.newCorrectIndices

        let playRootOnFirstCorrect = current.playRootOnFirstCorrect == true
        if playRootOnFirstCorrect,
           training.playRootOnCorrect,
           let matchedGroupIndex = result.matchedGroupIndex,
           TrainingEngine.isFirstAcceptedInGroup(current, previousCorrectIndices: previousCorrectIndices, groupIndex: matchedGroupIndex),
           let rootMidi = TrainingEngine.rootMidiForGroup(current, groupIndex: matchedGroupIndex) {
            SurvivalGameAudio.shared.playSynthBassRoot(midi: rootMidi)
        }

        if current.scorePerVoicing == true {
            if result.voicingCompleted {
                TrainingEngine.performDefeat(
                    runtime: &runtime,
                    nowSec: runtime.elapsedSec,
                    guardPoseSec: TrainingConstants.guardPoseSec
                )
                runtime.score += 1
                if runtime.score != hud.score {
                    hud.score = runtime.score
                }
            }
            guard result.completed else { return }
            if training.kind == .progression {
                advanceProgressionAfterCorrect()
            }
            spawnQuestion()
            return
        }

        guard result.completed else { return }

        if TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: training.kind,
            playRootOnCorrect: training.playRootOnCorrect,
            completed: result.completed,
            rootMidi: current.rootMidi,
            playRootOnFirstCorrect: playRootOnFirstCorrect
        ), let rootMidi = current.rootMidi {
            SurvivalGameAudio.shared.playSynthBassRoot(midi: rootMidi)
        }

        TrainingEngine.performDefeat(
            runtime: &runtime,
            nowSec: runtime.elapsedSec,
            guardPoseSec: TrainingConstants.guardPoseSec
        )
        runtime.score += 1
        if runtime.score != hud.score {
            hud.score = runtime.score
        }
        if training.kind == .progression {
            advanceProgressionAfterCorrect()
        }
        spawnQuestion()
    }

    private func spawnQuestion() {
        let built: TrainingQuestion
        if training.kind == .progression {
            guard let units = progressionUnits, !units.isEmpty else {
                fatalError("Training \(training.slug): progression units missing")
            }
            if progressionCursor == nil {
                progressionCursor = TrainingProgression.pickInitialCursor(
                    units: units,
                    shuffleUnits: progressionShuffleUnits
                )
            }
            guard let cursor = progressionCursor else {
                fatalError("Training \(training.slug): progression cursor missing")
            }
            built = TrainingProgression.questionAt(units: units, cursor: cursor)
        } else {
            built = TrainingQuestionBuilder.buildQuestion(options: TrainingQuestionBuilderOptions(
                training: training,
                ignoreNotationInstrument: ignoreNotationInstrument,
                lessonRoots: nil,
                lessonOrder: nil,
                lessonItems: nil,
                lessonItemIndex: nil,
                previousQuestionKey: previousQuestionKey
            ))
        }
        previousQuestionKey = built.questionKey
        runtime.question = built
        runtime.correctTargetIndices = []
        question = built
        correctIndices = []
    }

    private func advanceProgressionAfterCorrect() {
        guard let units = progressionUnits, let cursor = progressionCursor else { return }
        progressionCursor = TrainingProgression.advanceCursor(
            units: units,
            cursor: cursor,
            shuffleUnits: progressionShuffleUnits
        )
    }

    private func recordLessonProgressIfNeeded() {
        guard !practiceMode, let lessonContext else { return }
        let requiredRank = TrainingRank.parseLetterRank(lessonContext.clearConditions?.rank ?? "C")
        let score = runtime.score
        guard TrainingRank.meetsRequirement(score: score, requiredRank: requiredRank, kind: training.kind) else { return }
        let rank = TrainingRank.scoreToRank(score, kind: training.kind).rawValue
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
