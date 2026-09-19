import Combine
import Foundation
import QuartzCore
import SpriteKit

/// レッスン課題としての起動コンテキスト（本番クリア時に進捗を記録する）。
struct DefenseLessonContext: Sendable {
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}

/// SwiftUI が購読する低頻度 HUD 状態。毎フレームではなく値が変わったときだけ publish する。
struct DefenseHudState: Equatable {
    var playerHp: Int
    var playerMaxHp: Int
    var remainSec: Int
    /// 1-based wave number; 0 hides wave UI (practice mode).
    var wave: Int
    var elapsedInt: Int
    var result: DefenseGameResult
}

@MainActor
final class DefenseGameSession: ObservableObject {
    /// 毎フレーム更新される実行時状態。SpriteKit の `update` から直接参照し、publish しない。
    private(set) var runtime: DefenseRuntimeState
    @Published private(set) var judgeState: DefensePhraseJudgeState
    @Published private(set) var hud: DefenseHudState
    @Published private(set) var phase: DefenseGamePhase = .loading
    @Published private(set) var countdownSec = DefenseStartCountdown.displaySec(
        remaining: DefenseStartCountdown.durationSec
    )
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var practiceSpeedPercent = 100

    let stage: DefenseStageDefinition
    let difficulty: DefenseDifficultyDefinition
    let practiceMode: Bool
    let tutorialOptions: DefenseTutorialOptions?
    let tutorialConcertMidis: [Int]?
    private let lessonContext: DefenseLessonContext?

    private var lastSwitchGeneration: UInt64 = 0
    private var pendingSwitchPhraseIndex: Int?
    private var lastFrameTime: TimeInterval?
    private var resultHandled = false
    var isPaused = false {
        didSet {
            if oldValue, !isPaused {
                resumePauseWaiters()
            }
        }
    }
    private var startGeneration: UInt64 = 0
    private var pauseWaiters: [CheckedContinuation<Void, Never>] = []
    private var countdownTask: Task<Void, Never>?
    private let midiSubscriptionHolder = MIDISubscriptionHolder()
    private var lastVoicePcAtMs: [Int: Double] = [:]
    private static let voiceSamePcDebounceMs: Double = 120

    init(
        stage: DefenseStageDefinition,
        difficulty: DefenseDifficultyDefinition,
        practiceMode: Bool,
        lessonContext: DefenseLessonContext?,
        tutorialOptions: DefenseTutorialOptions? = nil,
        tutorialConcertMidis: [Int]? = nil
    ) {
        self.stage = stage
        self.difficulty = difficulty
        self.practiceMode = practiceMode
        self.tutorialOptions = tutorialOptions
        self.tutorialConcertMidis = tutorialConcertMidis
        self.lessonContext = lessonContext
        let maxEnemies = tutorialOptions?.maxEnemies ?? difficulty.maxEnemies
        let runtime = DefenseRuntimeState(
            playerHp: stage.playerHp,
            surviveSeconds: TimeInterval(stage.surviveSeconds),
            maxEnemies: maxEnemies,
            practiceMode: practiceMode,
            tutorial: tutorialOptions,
            attackTrigger: stage.attackTrigger,
            initialSpGauge: tutorialOptions?.initialSpGauge ?? 0
        )
        self.runtime = runtime
        self.judgeState = DefensePhraseJudge.createInitialState(phrases: stage.phrases)
        self.hud = DefenseHudState(
            playerHp: runtime.playerHp,
            playerMaxHp: runtime.playerMaxHp,
            remainSec: Int(runtime.surviveSeconds),
            wave: practiceMode ? 0 : 1,
            elapsedInt: 0,
            result: .playing
        )
    }

    func start() async {
        startGeneration += 1
        let generation = startGeneration
        countdownTask?.cancel()
        countdownTask = nil
        phase = .loading
        countdownSec = DefenseStartCountdown.displaySec(remaining: DefenseStartCountdown.durationSec)
        subscribeMidi()
        await Task.yield()
        guard generation == startGeneration, !Task.isCancelled else { return }

        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
        let speedRatio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
        DefenseBackingAudio.shared.setTransportConfig(
            bpm: stage.bpm * speedRatio,
            beatsPerBar: stage.beatsPerBar
        )
        DefenseBackingAudio.shared.setPlaybackRate(Float(speedRatio))
        if tutorialOptions == nil {
            let preloadIndices: [Int]
            if practiceMode {
                preloadIndices = Array(stage.phrases.indices)
            } else {
                preloadIndices = [0, 1].filter { stage.phrases.indices.contains($0) }
            }
            let preloadUrls = DefensePhraseBacking.preloadUrls(for: stage, phraseIndices: preloadIndices)
            let stageSnapshot = stage
            try? await Task.detached(priority: .userInitiated) {
                try await DefenseBackingAudio.shared.preload(urls: preloadUrls)
                try await DefenseBackingAudio.shared.preparePhraseBuffers(
                    stage: stageSnapshot,
                    phraseIndices: preloadIndices
                )
            }.value
        }
        guard generation == startGeneration, !Task.isCancelled else { return }
        startCountdown(generation: generation)
    }

    private func startCountdown(generation: UInt64) {
        countdownTask?.cancel()
        phase = .countdown
        countdownSec = DefenseStartCountdown.displaySec(remaining: DefenseStartCountdown.durationSec)
        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            var remaining = DefenseStartCountdown.durationSec
            self.countdownSec = DefenseStartCountdown.displaySec(remaining: remaining)
            while remaining > 0 {
                let stepSec = self.countdownSec == 2
                    ? DefenseStartCountdown.firstStepSec
                    : DefenseStartCountdown.secondStepSec
                try? await Task.sleep(nanoseconds: UInt64(stepSec * 1_000_000_000))
                if Task.isCancelled || generation != self.startGeneration { return }
                await self.waitIfPaused()
                if Task.isCancelled || generation != self.startGeneration { return }
                remaining -= stepSec
                self.countdownSec = DefenseStartCountdown.displaySec(remaining: remaining)
            }
            await self.beginPlay(generation: generation)
        }
    }

    private func waitIfPaused() async {
        guard isPaused, !Task.isCancelled else { return }
        await withCheckedContinuation { continuation in
            if !isPaused || Task.isCancelled {
                continuation.resume()
                return
            }
            pauseWaiters.append(continuation)
        }
    }

    private func resumePauseWaiters() {
        let waiters = pauseWaiters
        pauseWaiters.removeAll(keepingCapacity: false)
        waiters.forEach { $0.resume() }
    }

    private func beginPlay(generation: UInt64) async {
        guard generation == startGeneration, !Task.isCancelled else { return }
        let speedRatio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
        if let tutorialConcertMidis, tutorialOptions != nil {
            try? await DefenseBackingAudio.shared.startSynthesizedTutorial(concertMidis: tutorialConcertMidis)
        } else {
            try? await DefenseBackingAudio.shared.startPhrase(at: 0)
        }
        guard generation == startGeneration, !Task.isCancelled else { return }
        DefenseBackingAudio.shared.setPlaybackRate(Float(speedRatio))
        runtime.elapsedSec = 0
        lastFrameTime = nil
        if tutorialOptions != nil {
            DefenseGameLoop.spawnTutorialInitialEnemies(runtime: &runtime, difficulty: difficulty)
        }
        phase = .playing
    }

    func stepPhrase(_ delta: Int) {
        guard practiceMode, stage.phrases.count > 1 else { return }
        let currentIndex = judgeState.phraseIndex
        let nextIndex = (currentIndex + delta + stage.phrases.count) % stage.phrases.count
        pendingSwitchPhraseIndex = nil
        judgeState = DefensePhraseJudge.resetToPhraseIndex(nextIndex, phrases: stage.phrases)
        Task {
            try? await DefenseBackingAudio.shared.startPhrase(at: nextIndex)
        }
    }

    func stepSpeed(_ delta: Int) {
        let nextSpeed = DefensePracticeSpeed.stepped(practiceSpeedPercent, delta: delta)
        guard nextSpeed != practiceSpeedPercent else { return }
        practiceSpeedPercent = nextSpeed
        let ratio = Float(DefensePracticeSpeed.ratio(nextSpeed))
        pendingSwitchPhraseIndex = nil
        DefenseBackingAudio.shared.invalidatePendingSwitch()
        DefenseBackingAudio.shared.setPlaybackRate(ratio)
        DefenseBackingAudio.shared.setTransportConfig(
            bpm: stage.bpm * DefensePracticeSpeed.ratio(nextSpeed),
            beatsPerBar: stage.beatsPerBar
        )
        let phraseIndex = judgeState.phraseIndex
        Task {
            try? await DefenseBackingAudio.shared.startPhrase(at: phraseIndex)
        }
    }

    func stop() {
        startGeneration += 1
        countdownTask?.cancel()
        countdownTask = nil
        resumePauseWaiters()
        midiSubscriptionHolder.cancel()
        midiHeldKeys.removeAll()
        DefenseBackingAudio.shared.stop()
        SurvivalGameAudio.shared.stop()
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
                    self.handleNoteOn(
                        pitchClass: ((note % 12) + 12) % 12,
                        sequential: NoteInputManager.shared.isVoiceInputActive
                    )
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

    func handleNoteOn(pitchClass: Int, sequential: Bool = false) {
        guard phase == .playing, !isPaused, runtime.result == .playing else { return }
        let normalizedPc = ((pitchClass % 12) + 12) % 12
        if sequential {
            let nowMs = CACurrentMediaTime() * 1000
            if let lastAt = lastVoicePcAtMs[normalizedPc],
               nowMs - lastAt < Self.voiceSamePcDebounceMs {
                return
            }
            lastVoicePcAtMs[normalizedPc] = nowMs
        }
        let evaluation = DefensePhraseJudge.evaluateNoteOn(
            state: judgeState,
            stageRequiredCompletionCount: stage.requiredCompletionCount,
            pitchClass: normalizedPc,
            sequential: sequential,
            attackTrigger: stage.attackTrigger,
            autoAdvance: tutorialOptions?.autoAdvancePhrase ?? !practiceMode
        )
        if evaluation.nextState != judgeState {
            judgeState = evaluation.nextState
        }
        if evaluation.attack {
            let speedRatio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
            let effectiveBpm = stage.bpm > 0 ? stage.bpm * speedRatio : 60
            let guardPoseSec = 60 / effectiveBpm
            _ = DefenseGameLoop.performSlash(runtime: &runtime, guardPoseSec: guardPoseSec)
        }
        if evaluation.measureCompleted, stage.attackTrigger == .note {
            _ = DefenseGameLoop.chargeSp(runtime: &runtime)
        }
        if !practiceMode, evaluation.pendingSwitch, pendingSwitchPhraseIndex == nil {
            let nextIndex = DefensePhraseJudge.nextPhraseIndex(
                phrases: stage.phrases,
                current: judgeState.phraseIndex
            )
            pendingSwitchPhraseIndex = nextIndex
            judgeState = DefensePhraseJudge.resetToPhraseIndex(nextIndex, phrases: stage.phrases)
            Task {
                var scheduledMs: Int64 = 0
                do {
                    scheduledMs = try await DefenseBackingAudio.shared.scheduleSwitchPhrase(at: nextIndex)
                } catch {
                    scheduledMs = 0
                }
                if scheduledMs <= 0, pendingSwitchPhraseIndex == nextIndex {
                    pendingSwitchPhraseIndex = nil
                }
            }
        }
    }

    /// SpriteKit の `update` から毎フレーム呼ばれる。React 相当の publish は値変化時のみ。
    func advanceFrame(currentTime: TimeInterval) {
        if isPaused {
            lastFrameTime = currentTime
            return
        }
        guard phase == .playing, runtime.result == .playing else { return }
        let dt: TimeInterval
        if let last = lastFrameTime {
            dt = min(0.05, currentTime - last)
        } else {
            dt = 0
        }
        lastFrameTime = currentTime

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: dt)

        let switchGen = DefenseBackingAudio.shared.didSwitchGeneration
        if switchGen != lastSwitchGeneration, let switchedToIndex = pendingSwitchPhraseIndex {
            lastSwitchGeneration = switchGen
            pendingSwitchPhraseIndex = nil
            DefenseBackingAudio.shared.commitSwitchFromMainThread()
            let preloadIndex = DefensePhraseJudge.nextPhraseIndex(
                phrases: stage.phrases,
                current: switchedToIndex
            )
            let preloadUrls = DefensePhraseBacking.preloadUrls(for: stage, phraseIndices: [preloadIndex])
            if !preloadUrls.isEmpty {
                Task {
                    try? await DefenseBackingAudio.shared.preload(urls: preloadUrls)
                }
            }
        }

        let elapsedInt = Int(runtime.elapsedSec)
        let nextHud = DefenseHudState(
            playerHp: runtime.playerHp,
            playerMaxHp: runtime.playerMaxHp,
            remainSec: max(0, Int((runtime.surviveSeconds - runtime.elapsedSec).rounded(.up))),
            wave: practiceMode ? 0 : runtime.waveIndex + 1,
            elapsedInt: elapsedInt,
            result: runtime.result
        )
        if nextHud != hud {
            hud = nextHud
        }

        if runtime.result != .playing, !resultHandled {
            resultHandled = true
            handleResult()
        }
    }

    private func handleResult() {
        guard runtime.result == .clear, !practiceMode else { return }
        let surviveSec = Int(runtime.elapsedSec)
        let enemiesDefeated = runtime.enemiesDefeated
        let stageId = stage.id
        let lessonContext = lessonContext
        Task {
            if let userId = try? await SupabaseService.shared.currentUserId() {
                _ = try? await SupabaseService.shared.upsertDefenseStageClear(
                    userId: userId,
                    stageId: stageId,
                    surviveSec: surviveSec,
                    enemiesDefeated: enemiesDefeated
                )
            }
            if let lessonContext {
                _ = try? await SupabaseService.shared.recordEarTrainingLessonProgress(
                    lessonId: lessonContext.lessonId,
                    lessonSongId: lessonContext.lessonSongId,
                    rank: "S",
                    clearConditions: lessonContext.clearConditions
                )
            }
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
