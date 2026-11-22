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
    var enemiesDefeated: Int
    var targetEnemiesDefeated: Int
    /// 1-based wave number; 0 hides wave UI (practice mode).
    var wave: Int
    var elapsedInt: Int
    var result: DefenseGameResult
    var endlessMode: Bool
    var awaitingEndlessChoice: Bool
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
    @Published private(set) var progressionActiveIndex = -1
    @Published private(set) var effectiveProgressionChords: [DefenseStageProgressionChord] = []
    private var progressionPhraseIndex = 0
    @Published private(set) var voicingKeyState: DefenseVoicingKeyState?
    @Published private(set) var activePhrases: [DefensePhraseDefinition]

    let stage: DefenseStageDefinition
    let difficulty: DefenseDifficultyDefinition
    private var effectiveDifficulty: DefenseDifficultyDefinition
    private(set) var usesCallResponseTierPath = false
    private let playMapNodeId: UUID?
    let practiceMode: Bool
    let tutorialOptions: DefenseTutorialOptions?
    let tutorialConcertMidis: [Int]?
    private let lessonContext: DefenseLessonContext?

    private var lastSwitchGeneration: UInt64 = 0
    private var pendingSwitchPhraseIndex: Int?
    private var sharedProgressionRequestRevision = 0
    private var separateTracksRequestRevision = 0
    private var isSharedProgressionStage: Bool {
        stage.audioRegistrationMode == .sharedProgression
    }
    private var isSeparateTracksStage: Bool {
        stage.audioRegistrationMode == .sharedProgressionSeparateTracks
    }
    private var isChordVoicingStage: Bool {
        DefenseVoicingKeys.isChordVoicingStage(stage)
    }

    private var usesProgressionHud: Bool {
        !isChordVoicingStage && (isSharedProgressionStage || isSeparateTracksStage)
    }
    private var lastFrameTime: TimeInterval?
    private var resultHandled = false
    @Published private(set) var stageClearStarRank: Int?
    @Published private(set) var performanceRecordId: String?
    @Published private(set) var finishSummary: DefenseFinishSummary?
    private var clearCommitStarted = false
    private var clearCommitTask: Task<String?, Never>?
    private var endlessFinalized = false
    private var callResponseTransitionWaitUntilHostSec: Double?
    private var lastCallResponsePhase: DefenseCallResponsePhase?
    private var lastCallResponseLoopIndex = 0
    private var callResponseConfig: DefenseCallResponseConfig? {
        DefenseCallResponse.config(for: stage)
    }
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
    private var lastVoiceAcceptedAtMs: Double?
    private let midiSubscriptionHolder = MIDISubscriptionHolder()
    init(
        stage: DefenseStageDefinition,
        difficulty: DefenseDifficultyDefinition,
        practiceMode: Bool,
        lessonContext: DefenseLessonContext?,
        playMapNodeId: UUID? = nil,
        tutorialOptions: DefenseTutorialOptions? = nil,
        tutorialConcertMidis: [Int]? = nil
    ) {
        self.stage = stage
        self.difficulty = difficulty
        self.playMapNodeId = playMapNodeId
        let initialVoicingKeyState: DefenseVoicingKeyState?
        let initialActivePhrases: [DefensePhraseDefinition]
        if DefenseVoicingKeys.isChordVoicingStage(stage),
           let mode = stage.voicingKeyMode,
           let startKey = stage.voicingStartKey {
            let keyState = DefenseVoicingKeys.createInitialKeyState(mode: mode, startKey: startKey)
            initialVoicingKeyState = keyState
            initialActivePhrases = DefenseVoicingKeys.buildActivePhrases(stage: stage, keyState: keyState)
        } else {
            initialVoicingKeyState = nil
            initialActivePhrases = stage.phrases
        }
        let marketingVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"
        let resolved = DefenseCallResponseCombat.resolveEffectiveDifficulty(
            stage: stage,
            phrases: initialActivePhrases,
            fetchedDifficulty: difficulty,
            marketingVersion: marketingVersion
        )
        self.effectiveDifficulty = resolved.difficulty
        self.usesCallResponseTierPath = resolved.usesTierPath
        self.practiceMode = practiceMode
        self.tutorialOptions = tutorialOptions
        self.tutorialConcertMidis = tutorialConcertMidis
        self.lessonContext = lessonContext
        let maxEnemies = tutorialOptions?.maxEnemies ?? resolved.difficulty.maxEnemies
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
        self.voicingKeyState = initialVoicingKeyState
        self.activePhrases = initialActivePhrases
        self.judgeState = DefensePhraseJudge.createInitialState(phrases: initialActivePhrases)
        self.hud = DefenseHudState(
            playerHp: runtime.playerHp,
            playerMaxHp: runtime.playerMaxHp,
            remainSec: Int(runtime.surviveSeconds),
            enemiesDefeated: 0,
            targetEnemiesDefeated: 0,
            wave: practiceMode ? 0 : 1,
            elapsedInt: 0,
            result: .playing,
            endlessMode: false,
            awaitingEndlessChoice: false
        )
        syncEffectiveProgressionChords(phraseIndex: judgeState.phraseIndex)
    }

    private func syncEffectiveProgressionChords(phraseIndex: Int) {
        let phrase = stage.phrases[safe: phraseIndex] ?? stage.phrases.first
        let phraseLoopBars: Int = {
            guard let phrase else { return max(1, stage.phraseBars) }
            if let start = phrase.loopStartMeasure, let end = phrase.loopEndMeasure {
                return max(1, end - start + 1)
            }
            return max(1, phrase.chords.count, stage.phraseBars)
        }()
        effectiveProgressionChords = DefenseProgressionTimeline.resolvePhraseProgressionChords(
            params: DefenseProgressionTimeline.PhraseProgressionParams(
                stageProgressionChords: stage.progressionChords,
                usesFullStageProgressionHud: usesProgressionHud,
                phraseLoopStartMeasure: phrase?.loopStartMeasure,
                phraseLoopEndMeasure: phrase?.loopEndMeasure,
                phraseLoopBarCount: phraseLoopBars
            )
        )
        progressionPhraseIndex = phraseIndex
    }

    func start() async {
        startGeneration += 1
        let generation = startGeneration
        countdownTask?.cancel()
        countdownTask = nil
        phase = .loading
        progressionActiveIndex = -1
        countdownSec = DefenseStartCountdown.displaySec(remaining: DefenseStartCountdown.durationSec)
        subscribeMidi()
        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
        let speedRatio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
        async let voiceReady: Bool = NoteInputPreferences.inputMethod == .voice
            ? NoteInputManager.shared.waitUntilVoiceInputReady()
            : true
        async let audioReady: Bool = prepareStartAudio(speedRatio: speedRatio)
        _ = await voiceReady
        guard generation == startGeneration, !Task.isCancelled else { return }
        let audioOk = await audioReady
        guard generation == startGeneration, !Task.isCancelled else { return }
        guard audioOk else {
            phase = .loadError
            PlayLaunchTiming.end("DefensePlay")
            return
        }
        startCountdown(generation: generation)
    }

    private func prepareStartAudio(speedRatio: Double) async -> Bool {
        if isSeparateTracksStage {
            if tutorialOptions == nil {
                let stageSnapshot = stage
                let ratioSnapshot = speedRatio
                do {
                    try await Task.detached(priority: .userInitiated) {
                        try await DefenseSeparateTracksAudio.shared.prepare(
                            stage: stageSnapshot,
                            speedRatio: ratioSnapshot
                        )
                    }.value
                } catch {
                    return false
                }
            }
        } else if isSharedProgressionStage {
            DefenseSharedProgressionAudio.shared.setPlaybackRate(Float(speedRatio))
            if tutorialOptions == nil {
                let stageSnapshot = stage
                let ratioSnapshot = speedRatio
                do {
                    try await Task.detached(priority: .userInitiated) {
                        try await DefenseSharedProgressionAudio.shared.prepare(
                            stage: stageSnapshot,
                            speedRatio: ratioSnapshot
                        )
                    }.value
                } catch {
                    return false
                }
            }
        } else {
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
        }
        return true
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
                if remaining <= 0 {
                    break
                }
                self.countdownSec = DefenseStartCountdown.displaySec(remaining: remaining)
            }
            guard generation == self.startGeneration, !Task.isCancelled else { return }
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
            if let urlString = DefenseTutorialConstants.audioUrl(forConcertMidis: tutorialConcertMidis),
               let url = URL(string: urlString) {
                do {
                    try await DefenseBackingAudio.shared.start(
                        firstUrl: url,
                        barCount: DefenseTutorialConstants.audioLoopBars
                    )
                } catch {
                    try? await DefenseBackingAudio.shared.startSynthesizedTutorial(concertMidis: tutorialConcertMidis)
                }
            } else {
                try? await DefenseBackingAudio.shared.startSynthesizedTutorial(concertMidis: tutorialConcertMidis)
            }
        } else if isSeparateTracksStage {
            DefenseSeparateTracksAudio.shared.start(initialPhraseIndex: judgeState.phraseIndex)
        } else if isSharedProgressionStage {
            DefenseSharedProgressionAudio.shared.start(initialPhraseIndex: judgeState.phraseIndex)
        } else {
            try? await DefenseBackingAudio.shared.startPhrase(at: 0)
            lastSwitchGeneration = DefenseBackingAudio.shared.didSwitchGeneration
            syncEffectiveProgressionChords(phraseIndex: 0)
        }
        guard generation == startGeneration, !Task.isCancelled else { return }
        if isSharedProgressionStage {
            DefenseSharedProgressionAudio.shared.setPlaybackRate(Float(speedRatio))
        } else if !isSeparateTracksStage {
            DefenseBackingAudio.shared.setPlaybackRate(Float(speedRatio))
        }
        runtime.elapsedSec = 0
        lastFrameTime = nil
        callResponseTransitionWaitUntilHostSec = nil
        lastCallResponsePhase = .call
        lastCallResponseLoopIndex = 0

        let killClearTarget: Int
        if !practiceMode, tutorialOptions == nil, callResponseConfig != nil {
            killClearTarget = DefenseCallResponseCombat.clearTarget(
                stage: stage,
                phrases: activePhrases,
                difficulty: effectiveDifficulty
            ) ?? 0
        } else {
            killClearTarget = 0
        }
        runtime.targetEnemiesDefeated = killClearTarget
        runtime.enemiesDefeated = 0
        runtime.callResponseActive = callResponseConfig != nil && tutorialOptions == nil
        runtime.endlessPromptEnabled = usesCallResponseTierPath
            && callResponseConfig != nil
            && !practiceMode
            && tutorialOptions == nil
            && playMapNodeId != nil
        runtime.awaitingEndlessChoice = false
        runtime.endlessMode = false
        runtime.endlessElapsedSec = 0
        runtime.endlessSpeedMult = 1
        runtime.endlessSpawnMult = 1
        runtime.endlessHpMult = 1
        clearCommitStarted = false
        clearCommitTask = nil
        endlessFinalized = false
        stageClearStarRank = nil
        performanceRecordId = nil
        finishSummary = nil

        if callResponseConfig != nil {
            runtime.enemyBehavior = .dance
            runtime.callResponseCue = .listen
            runtime.danceBeatPhase = 0
            if tutorialOptions == nil {
                runtime.spawnTimerSec = effectiveDifficulty.spawnIntervalSec * 0.8
            }
        }
        if tutorialOptions != nil {
            DefenseGameLoop.spawnTutorialInitialEnemies(runtime: &runtime, difficulty: effectiveDifficulty)
        } else if callResponseConfig != nil {
            DefenseGameLoop.spawnCallResponseInitialEnemy(runtime: &runtime, difficulty: effectiveDifficulty)
        }
        phase = .playing
        PlayLaunchTiming.end("DefensePlay")
    }

    func stepPhrase(_ delta: Int) {
        guard practiceMode else { return }
        if isChordVoicingStage, let keyState = voicingKeyState {
            applyVoicingKeyState(DefenseVoicingKeys.stepKeyState(keyState, delta: delta))
            return
        }
        guard stage.phrases.count > 1 else { return }
        let currentIndex = judgeState.phraseIndex
        let nextIndex = (currentIndex + delta + stage.phrases.count) % stage.phrases.count
        pendingSwitchPhraseIndex = nil
        callResponseTransitionWaitUntilHostSec = nil
        lastCallResponsePhase = .call
        judgeState = DefensePhraseJudge.resetToPhraseIndex(
            nextIndex,
            phrases: activePhrases,
            lastAcceptedPitchClass: judgeState.lastAcceptedPitchClass
        )
        if isSeparateTracksStage {
            separateTracksRequestRevision += 1
            DefenseSeparateTracksAudio.shared.requestPhrase(
                at: nextIndex,
                requestRevision: separateTracksRequestRevision
            )
        } else if isSharedProgressionStage {
            let ratio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
            Task {
                try? await DefenseSharedProgressionAudio.shared.prepare(stage: stage, speedRatio: ratio)
                sharedProgressionRequestRevision += 1
                DefenseSharedProgressionAudio.shared.requestPhrase(
                    at: nextIndex,
                    requestRevision: sharedProgressionRequestRevision
                )
            }
        } else {
            pendingSwitchPhraseIndex = nextIndex
            let forceNextBar = callResponseConfig != nil
            Task {
                var scheduledMs: Int64 = 0
                do {
                    scheduledMs = try await DefenseBackingAudio.shared.scheduleSwitchPhrase(
                        at: nextIndex,
                        forceNextBar: forceNextBar
                    )
                } catch {
                    scheduledMs = 0
                }
                if scheduledMs <= 0, pendingSwitchPhraseIndex == nextIndex {
                    pendingSwitchPhraseIndex = nil
                }
            }
        }
    }

    func stepSpeed(_ delta: Int) {
        let nextSpeed = DefensePracticeSpeed.stepped(practiceSpeedPercent, delta: delta)
        guard nextSpeed != practiceSpeedPercent else { return }
        practiceSpeedPercent = nextSpeed
        let ratio = Float(DefensePracticeSpeed.ratio(nextSpeed))
        pendingSwitchPhraseIndex = nil
        callResponseTransitionWaitUntilHostSec = nil
        lastCallResponsePhase = .call
        let phraseIndex = judgeState.phraseIndex
        if isSeparateTracksStage {
            Task {
                await DefenseSeparateTracksAudio.shared.requestTempo(speedPercent: nextSpeed)
            }
        } else if isSharedProgressionStage {
            DefenseSharedProgressionAudio.shared.setPlaybackRate(ratio)
            Task {
                try? await DefenseSharedProgressionAudio.shared.prepare(
                    stage: stage,
                    speedRatio: DefensePracticeSpeed.ratio(nextSpeed)
                )
                DefenseSharedProgressionAudio.shared.restartFromProgressionStart(
                    phraseIndex: phraseIndex,
                    speedRatio: DefensePracticeSpeed.ratio(nextSpeed)
                )
            }
        } else {
            DefenseBackingAudio.shared.invalidatePendingSwitch()
            DefenseBackingAudio.shared.setPlaybackRate(ratio)
            DefenseBackingAudio.shared.setTransportConfig(
                bpm: stage.bpm * DefensePracticeSpeed.ratio(nextSpeed),
                beatsPerBar: stage.beatsPerBar
            )
            Task {
                do {
                    try await DefenseBackingAudio.shared.startPhrase(at: phraseIndex)
                    syncEffectiveProgressionChords(phraseIndex: phraseIndex)
                } catch { return }
            }
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
        DefenseSharedProgressionAudio.shared.stop()
        DefenseSeparateTracksAudio.shared.stop()
        SurvivalGameAudio.shared.stop()
    }

    func setSharedProgressionPaused(_ paused: Bool) {
        if isSeparateTracksStage {
            if paused {
                DefenseSeparateTracksAudio.shared.pauseProgression()
            } else {
                DefenseSeparateTracksAudio.shared.resumeProgression()
            }
            return
        }
        guard isSharedProgressionStage else { return }
        if paused {
            DefenseSharedProgressionAudio.shared.pauseProgression()
        } else {
            DefenseSharedProgressionAudio.shared.resumeProgression()
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
                    self.handleNoteOn(
                        pitchClass: ((note % 12) + 12) % 12,
                        sequential: false,
                        inputTimeMs: CACurrentMediaTime() * 1000
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

    func handleNoteOn(pitchClass: Int, sequential: Bool = false, inputTimeMs: Double? = nil) {
        guard phase == .playing, !isPaused, runtime.result == .playing, !runtime.awaitingEndlessChoice else { return }
        if let crConfig = callResponseConfig,
           !isSharedProgressionStage,
           !isSeparateTracksStage {
            let outputTime = DefenseBackingAudio.shared.currentOutputTime()
            if let waitHostSec = callResponseTransitionWaitUntilHostSec, outputTime >= waitHostSec {
                callResponseTransitionWaitUntilHostSec = nil
            }
            let elapsed = DefenseBackingAudio.shared.elapsedFromTransportStart() ?? runtime.elapsedSec
            let barSec = DefenseBackingAudio.shared.currentBarSec()
            let waitUntilElapsed: Double?
            if let waitHostSec = callResponseTransitionWaitUntilHostSec, outputTime < waitHostSec {
                waitUntilElapsed = waitHostSec - (outputTime - elapsed)
            } else {
                waitUntilElapsed = nil
            }
            let snap = DefenseCallResponse.resolve(
                config: crConfig,
                elapsedFromPhraseStartSec: elapsed,
                barSec: barSec,
                beatsPerBar: stage.beatsPerBar,
                transitionWaitUntilElapsedSec: waitUntilElapsed
            )
            guard snap.judgeActive else { return }
        }
        let normalizedPc = ((pitchClass % 12) + 12) % 12
        if sequential,
           NoteInputManager.shared.isVoiceInputActive,
           DefensePhraseJudge.isWaitingForSamePitchRepeat(state: judgeState, sequential: true) {
            let speedRatio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
            let effectiveBpm = stage.bpm > 0 ? stage.bpm * speedRatio : 60
            let minMs = SamePitchRepeatGate.minIntervalMsForEighthNote(bpm: effectiveBpm)
            let inputMs = inputTimeMs ?? (CACurrentMediaTime() * 1000)
            if SamePitchRepeatGate.isTooSoon(
                inputPitchClass: normalizedPc,
                lastAcceptedPitchClass: judgeState.lastAcceptedPitchClass,
                lastAcceptedAtMs: lastVoiceAcceptedAtMs,
                inputTimeMs: inputMs,
                minIntervalMs: minMs
            ) {
                return
            }
        }
        let evaluation = DefensePhraseJudge.evaluateNoteOn(
            state: judgeState,
            stageRequiredCompletionCount: stage.requiredCompletionCount,
            pitchClass: normalizedPc,
            sequential: sequential,
            attackTrigger: stage.attackTrigger,
            autoAdvance: tutorialOptions?.autoAdvancePhrase ?? !practiceMode,
            playStyle: stage.playStyle,
            playRootOnChordChange: stage.playRootOnChordChange
        )
        if evaluation.nextState != judgeState {
            judgeState = evaluation.nextState
            if sequential, NoteInputManager.shared.isVoiceInputActive {
                lastVoiceAcceptedAtMs = inputTimeMs ?? (CACurrentMediaTime() * 1000)
            }
        }
        if evaluation.attack {
            let speedRatio = DefensePracticeSpeed.ratio(practiceSpeedPercent)
            let effectiveBpm = stage.bpm > 0 ? stage.bpm * speedRatio : 60
            let guardPoseSec = 60 / effectiveBpm
            _ = DefenseGameLoop.performSlash(
                runtime: &runtime,
                guardPoseSec: guardPoseSec,
                difficulty: effectiveDifficulty
            )
        }
        if let rootMidi = evaluation.playRootMidi {
            SurvivalGameAudio.shared.playSynthBassRoot(midi: rootMidi)
        }
        if evaluation.measureCompleted, stage.attackTrigger == .note, !isChordVoicingStage {
            _ = DefenseGameLoop.chargeSp(runtime: &runtime)
        }
        if !practiceMode, evaluation.pendingSwitch {
            if isChordVoicingStage, let keyState = voicingKeyState {
                applyVoicingKeyState(DefenseVoicingKeys.advanceKeyState(keyState))
                return
            }
            let nextIndex = DefensePhraseJudge.nextPhraseIndex(
                phrases: stage.phrases,
                current: judgeState.phraseIndex
            )
            if callResponseConfig != nil, !isSharedProgressionStage, !isSeparateTracksStage {
                guard pendingSwitchPhraseIndex == nil else { return }
                judgeState = DefensePhraseJudge.resetToPhraseIndex(
                    nextIndex,
                    phrases: activePhrases,
                    lastAcceptedPitchClass: judgeState.lastAcceptedPitchClass
                )
                runtime.enemyBehavior = .pause
                runtime.callResponseCue = nil
                if let elapsed = DefenseBackingAudio.shared.elapsedFromTransportStart() {
                    let outputTime = DefenseBackingAudio.shared.currentOutputTime()
                    let transportStart = outputTime - elapsed
                    let barSec = DefenseBackingAudio.shared.currentBarSec()
                    let endBar = DefenseCallResponse.transitionEndBarIndex(
                        elapsedFromPhraseStartSec: elapsed,
                        barSec: barSec
                    )
                    callResponseTransitionWaitUntilHostSec = transportStart + Double(endBar) * barSec
                } else {
                    callResponseTransitionWaitUntilHostSec = nil
                }
                pendingSwitchPhraseIndex = nextIndex
                Task {
                    var scheduledMs: Int64 = 0
                    do {
                        scheduledMs = try await DefenseBackingAudio.shared.scheduleSwitchPhrase(
                            at: nextIndex,
                            forceNextBar: true
                        )
                    } catch {
                        scheduledMs = 0
                    }
                    if pendingSwitchPhraseIndex == nextIndex {
                        if scheduledMs > 0 {
                            callResponseTransitionWaitUntilHostSec = Double(scheduledMs) / 1_000.0
                        } else {
                            pendingSwitchPhraseIndex = nil
                            callResponseTransitionWaitUntilHostSec = nil
                        }
                    }
                }
                return
            }
            if isSeparateTracksStage {
                judgeState = DefensePhraseJudge.resetToPhraseIndex(
                    nextIndex,
                    phrases: activePhrases,
                    lastAcceptedPitchClass: judgeState.lastAcceptedPitchClass
                )
                separateTracksRequestRevision += 1
                DefenseSeparateTracksAudio.shared.requestPhrase(
                    at: nextIndex,
                    requestRevision: separateTracksRequestRevision
                )
            } else if isSharedProgressionStage {
                judgeState = DefensePhraseJudge.resetToPhraseIndex(
                    nextIndex,
                    phrases: activePhrases,
                    lastAcceptedPitchClass: judgeState.lastAcceptedPitchClass
                )
                sharedProgressionRequestRevision += 1
                DefenseSharedProgressionAudio.shared.requestPhrase(
                    at: nextIndex,
                    requestRevision: sharedProgressionRequestRevision
                )
            } else if pendingSwitchPhraseIndex == nil {
                pendingSwitchPhraseIndex = nextIndex
                judgeState = DefensePhraseJudge.resetToPhraseIndex(
                    nextIndex,
                    phrases: activePhrases,
                    lastAcceptedPitchClass: judgeState.lastAcceptedPitchClass
                )
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

        if !isSharedProgressionStage && !isSeparateTracksStage {
            let switchGen = DefenseBackingAudio.shared.didSwitchGeneration
            if switchGen != lastSwitchGeneration {
                let switchedToIndex = DefenseBackingAudio.shared.audiblePhraseIndex
                lastSwitchGeneration = switchGen
                if pendingSwitchPhraseIndex == switchedToIndex {
                    pendingSwitchPhraseIndex = nil
                }
                callResponseTransitionWaitUntilHostSec = nil
                syncEffectiveProgressionChords(phraseIndex: switchedToIndex)
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
        }

        if let crConfig = callResponseConfig, !isSharedProgressionStage, !isSeparateTracksStage, !runtime.awaitingEndlessChoice {
            syncCallResponseRuntime(config: crConfig, deltaTime: dt)
        }

        if !runtime.awaitingEndlessChoice {
            DefenseGameLoop.tick(runtime: &runtime, difficulty: effectiveDifficulty, deltaTime: dt)
        }

        let elapsedInt = Int(runtime.elapsedSec)
        if runtime.awaitingEndlessChoice, !clearCommitStarted, !practiceMode, usesCallResponseTierPath {
            clearCommitStarted = true
            let starRank = DefenseCallResponseTier.starRank(
                playerHp: runtime.playerHp,
                playerMaxHp: runtime.playerMaxHp
            )
            stageClearStarRank = starRank
            pauseAllBackingAudio()
            let surviveSecAtClear = Int(runtime.elapsedSec.rounded(.down))
            let enemiesAtClear = runtime.enemiesDefeated
            clearCommitTask = Task { [weak self] () -> String? in
                guard let self else { return nil }
                return await self.recordPerformanceClearV2(
                    starRank: starRank,
                    surviveSec: surviveSecAtClear,
                    enemiesDefeated: enemiesAtClear
                )
            }
        }

        let nextHud = DefenseHudState(
            playerHp: runtime.playerHp,
            playerMaxHp: runtime.playerMaxHp,
            remainSec: max(0, Int((runtime.surviveSeconds - runtime.elapsedSec).rounded(.up))),
            enemiesDefeated: runtime.enemiesDefeated,
            targetEnemiesDefeated: !practiceMode ? runtime.targetEnemiesDefeated : 0,
            wave: practiceMode ? 0 : runtime.waveIndex + 1,
            elapsedInt: elapsedInt,
            result: runtime.result,
            endlessMode: runtime.endlessMode,
            awaitingEndlessChoice: runtime.awaitingEndlessChoice
        )
        if nextHud != hud {
            hud = nextHud
        }

        if DefenseProgressionTimeline.shouldSyncProgressionHud(
            isChordVoicingStage: isChordVoicingStage,
            progressionChordCount: effectiveProgressionChords.count
        ), phase == .playing {
            let phrase = stage.phrases[safe: progressionPhraseIndex]
            let phraseLoopBars: Int = {
                guard let phrase else { return max(1, stage.phraseBars) }
                if let start = phrase.loopStartMeasure, let end = phrase.loopEndMeasure {
                    return max(1, end - start + 1)
                }
                return max(1, phrase.chords.count, stage.phraseBars)
            }()
            let formBarCount = DefenseProgressionTimeline.resolveFormBarCount(
                progressionBars: usesProgressionHud ? stage.progressionBars : nil,
                phraseLoopBarCount: phraseLoopBars
            )
            let beatInForm: Double?
            if isSeparateTracksStage {
                beatInForm = DefenseSeparateTracksAudio.shared.beatInForm()
            } else if isSharedProgressionStage {
                beatInForm = DefenseSharedProgressionAudio.shared.beatInForm()
            } else {
                beatInForm = DefenseBackingAudio.shared.beatInLoop()
            }
            let nextActive = DefenseProgressionTimeline.resolveActiveIndex(
                chords: effectiveProgressionChords,
                beatInForm: beatInForm,
                formBarCount: formBarCount,
                beatsPerBar: stage.beatsPerBar
            )
            if nextActive != progressionActiveIndex {
                progressionActiveIndex = nextActive
            }
        }

        if runtime.result != .playing, !resultHandled {
            resultHandled = true
            handleResult()
        }
    }

    private func syncCallResponseRuntime(config: DefenseCallResponseConfig, deltaTime: TimeInterval) {
        let outputTime = DefenseBackingAudio.shared.currentOutputTime()
        if let waitHostSec = callResponseTransitionWaitUntilHostSec, outputTime >= waitHostSec {
            callResponseTransitionWaitUntilHostSec = nil
        }
        let barSec = DefenseBackingAudio.shared.currentBarSec()
        let elapsed = DefenseBackingAudio.shared.elapsedFromTransportStart() ?? runtime.elapsedSec
        let waitUntilElapsed: Double?
        if let waitHostSec = callResponseTransitionWaitUntilHostSec, outputTime < waitHostSec {
            waitUntilElapsed = waitHostSec - (outputTime - elapsed)
        } else {
            waitUntilElapsed = nil
        }
        let snapshot = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: elapsed,
            barSec: barSec,
            beatsPerBar: stage.beatsPerBar,
            transitionWaitUntilElapsedSec: waitUntilElapsed
        )
        runtime.enemyBehavior = snapshot.enemyBehavior
        runtime.callResponseCue = snapshot.cue
        runtime.danceBeatPhase = snapshot.danceBeatPhase

        if snapshot.loopIndex > lastCallResponseLoopIndex,
           !judgeState.pendingSwitch,
           callResponseTransitionWaitUntilHostSec == nil {
            let reset = DefensePhraseJudge.resetProgressForNextCycle(judgeState)
            if reset != judgeState {
                judgeState = reset
            }
            lastCallResponseLoopIndex = snapshot.loopIndex
        }
        lastCallResponsePhase = snapshot.phase

        if runtime.endlessMode, snapshot.phase == .response {
            runtime.endlessElapsedSec += deltaTime
            let accel = DefenseCallResponseTier.endlessAccel(elapsedSec: runtime.endlessElapsedSec)
            runtime.endlessSpeedMult = accel.speedMult
            runtime.endlessSpawnMult = accel.spawnMult
            runtime.endlessHpMult = accel.hpMult
        }
    }

    private func pauseAllBackingAudio() {
        if isSeparateTracksStage {
            DefenseSeparateTracksAudio.shared.pauseProgression()
        } else if isSharedProgressionStage {
            DefenseSharedProgressionAudio.shared.pauseProgression()
        } else {
            DefenseBackingAudio.shared.pausePlayback()
        }
    }

    private func resumeAllBackingAudio() {
        if isSeparateTracksStage {
            DefenseSeparateTracksAudio.shared.resumeProgression()
        } else if isSharedProgressionStage {
            DefenseSharedProgressionAudio.shared.resumeProgression()
        } else {
            DefenseBackingAudio.shared.resumePlayback()
        }
    }

    func respondToEndlessChoice(continueEndless: Bool) {
        guard runtime.awaitingEndlessChoice, !practiceMode, usesCallResponseTierPath else { return }
        runtime.awaitingEndlessChoice = false
        if continueEndless {
            runtime.endlessMode = true
            runtime.waveIndex = DefenseCallResponseCombat.endlessWaveIndex
            runtime.waveSpawnCount = 0
            runtime.endlessElapsedSec = 0
            resumeAllBackingAudio()
        } else {
            runtime.result = .clear
            if !resultHandled {
                resultHandled = true
                handleResult()
            }
        }
    }

    private func recordPerformanceClearV2(
        starRank: Int,
        surviveSec: Int,
        enemiesDefeated: Int
    ) async -> String? {
        guard let nodeId = playMapNodeId, usesCallResponseTierPath, !practiceMode else { return nil }
        guard let result = try? await SupabaseService.shared.recordDefenseClearV2(
            nodeId: nodeId,
            stageId: stage.id,
            starRank: starRank,
            surviveSec: surviveSec,
            enemiesDefeated: enemiesDefeated
        ) else { return nil }
        performanceRecordId = result.recordId
        return result.recordId
    }

    private func finalizeEndlessIfNeeded(
        enemiesDefeated: Int,
        surviveSec: Int
    ) async -> Bool {
        guard !endlessFinalized else { return false }
        endlessFinalized = true
        let recordId: String?
        if let existing = performanceRecordId {
            recordId = existing
        } else if let task = clearCommitTask {
            recordId = await task.value
        } else {
            recordId = nil
        }
        guard let recordId else { return false }
        let res = try? await SupabaseService.shared.finalizeDefenseEndlessRecord(
            recordId: recordId,
            enemiesDefeated: enemiesDefeated,
            surviveSec: surviveSec
        )
        return res?.improvedEndlessBest ?? false
    }

    private func applyVoicingKeyState(_ keyState: DefenseVoicingKeyState) {
        voicingKeyState = keyState
        activePhrases = DefenseVoicingKeys.buildActivePhrases(stage: stage, keyState: keyState)
        pendingSwitchPhraseIndex = nil
        judgeState = DefensePhraseJudge.createInitialState(phrases: activePhrases)
    }

    private func handleResult() {
        let finalResult = runtime.result
        let surviveSec = Int(runtime.elapsedSec.rounded(.down))
        let enemiesDefeated = runtime.enemiesDefeated
        let enteredEndless = runtime.endlessMode
        let starRank = stageClearStarRank
        let stageId = stage.id
        let lessonContext = lessonContext
        Task {
            var improvedEndlessBest = false
            if enteredEndless, finalResult == .gameOver {
                improvedEndlessBest = await finalizeEndlessIfNeeded(
                    enemiesDefeated: enemiesDefeated,
                    surviveSec: surviveSec
                )
            }
            finishSummary = DefenseFinishSummary(
                result: finalResult,
                surviveSec: surviveSec,
                enemiesDefeated: enemiesDefeated,
                starRank: starRank,
                endlessMode: enteredEndless,
                improvedEndlessBest: improvedEndlessBest
            )
            guard finalResult == .clear, !practiceMode else { return }
            if usesCallResponseTierPath { return }
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
