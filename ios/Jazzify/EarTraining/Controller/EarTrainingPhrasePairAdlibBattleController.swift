import Foundation
import Combine
import QuartzCore

/// フレーズペアアドリブ（Web `EarTrainingPhrasePairAdlibScreen` 相当）。
@MainActor
final class EarTrainingPhrasePairAdlibBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let audioSyncEpsilonSec: Double = 0.012
    private static let kBattleEffectMs: Double = 1_600

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseRunId: Int = 0
    @Published private(set) var pairWindow = EarTrainingPhrasePairBattleEngine.createWindow()
    @Published private(set) var matcherState = EarTrainingPhrasePairEngine.createInitialState()
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int
    @Published private(set) var countInValue: Int
    @Published private(set) var activeStep: EarTrainingPhrasePairAdlibStep?
    @Published private(set) var countInEarlyInputActive = false
    @Published private(set) var statusText: String
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var voicingHintsByMidi: [Int: VoicingHintState] = [:]

    let stage: EarTrainingStageDetail
    let bootstrap: EarTrainingPhrasePairAdlibBootstrap
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy

    private let audio: EarTrainingAudio
    private let onExitCallback: () -> Void
    private weak var scene: EarTrainingBattleSceneHandle?

    var tutorialHooks: EarTrainingTutorialSceneHooks?
    var tutorialNoCombat = false
    private var tutorialTimedLineWorks: [DispatchWorkItem] = []
    private var tutorialClearWork: DispatchWorkItem?

    private var lastInputAt: Double = 0
    private var battleEffectIdCounter = 0
    private var lastEmittedEffectId: Int?
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var progressSaveStarted = false
    private var countdownTask: Task<Void, Never>?
    private var timeLimitTask: Task<Void, Never>?
    private var chordSyncTask: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private var battleEffectClearTask: Task<Void, Never>?
    private var drumLoopStarted = false

    var damageConfig: EarTrainingDamageConfig {
        (practiceMode || tutorialNoCombat) ? .zero : EarTrainingDamageConfig(
            perCorrectNote: stage.perCorrectNoteDamage,
            good: stage.goodCompletionDamage,
            great: stage.greatCompletionDamage,
            perfect: stage.perfectCompletionDamage,
            miss: stage.missDamage,
            fail: stage.failDamage
        )
    }

    var showLobbyControls: Bool {
        if tutorialHooks?.ui.hideLobby == true { return false }
        return gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var canChangePracticeMode: Bool { showLobbyControls }
    var effectivePracticeMode: Bool { practiceMode }

    var timeLabel: String {
        effectivePracticeMode ? "∞" : formatTime(timeRemaining)
    }

    init(
        stage: EarTrainingStageDetail,
        bootstrap: EarTrainingPhrasePairAdlibBootstrap,
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        audio: EarTrainingAudio,
        initialPracticeMode: Bool = false,
        onExit: @escaping () -> Void
    ) {
        self.stage = stage
        self.bootstrap = bootstrap
        self.lessonContext = lessonContext
        self.isEnglishCopy = isEnglishCopy
        self.audio = audio
        self.onExitCallback = onExit
        self.hudLabels = EarTrainingBattleHudLabels.make(isEnglish: isEnglishCopy)
        self.copy = EarTrainingGameCopy.make(isEnglish: isEnglishCopy)
        self.practiceMode = initialPracticeMode
        self.enemyHp = stage.enemyHp
        self.playerHp = stage.playerHp
        self.timeRemaining = stage.timeLimitSec
        self.countInValue = stage.countInBeats
        self.statusText = copy.idlePrompt
    }

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishSnapshot()
    }

    func detachScene() { scene = nil }

    func handleEffectImpact(effectId: Int) {
        guard let handler = pendingImpactHandlers.removeValue(forKey: effectId) else { return }
        handler()
    }

    func start() {
        audio.start()
        audio.onTimeUpdate = { [weak self] _ in
            Task { @MainActor in
                self?.syncTimeline(scheduleNext: true)
            }
        }
        audio.onEnded = nil
        publishSnapshot()
    }

    func tearDown() {
        cancelAllTimers()
        audio.onTimeUpdate = nil
        audio.onEnded = nil
        audio.stop()
        midiHeldKeys.removeAll()
        scene = nil
    }

    func registerMidiKeyDown(_ midi: Int) { midiHeldKeys.insert(midi) }
    func registerMidiKeyUp(_ midi: Int) { midiHeldKeys.remove(midi) }

    func handleBack() {
        cancelAllTimers()
        audio.stopDrumLoop()
        onExitCallback()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func applyPracticeModeAndRestart(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        startBattle()
    }

    func startBattle() { startCountIn() }

    func handleNoteOn(midi: Int, velocity: Int = 100, playAudio: Bool = true) {
        if playAudio { audio.pianoNoteOn(midi: midi, velocity: velocity) }
        handleNoteInput(midi: midi)
    }

    func handleNoteOff(midi: Int, playAudio: Bool = true) {
        if playAudio { audio.pianoNoteOff(midi: midi) }
    }

    private func handleNoteInput(midi: Int) {
        let now = CACurrentMediaTime() * 1000
        if now - lastInputAt < Self.inputCooldownMs { return }
        lastInputAt = now

        let allowEarlyCountIn = gameState == .countIn && countInEarlyInputActive
        guard gameState == .playingPhrase || allowEarlyCountIn else { return }
        if gameState == .playingPhrase {
            syncTimeline(scheduleNext: false)
            guard gameState == .playingPhrase else { return }
        }

        guard let step = activeStep else { return }

        if step.inputDisabled {
            return
        }

        let patterns = EarTrainingPhrasePairTimeline.patterns(
            for: step,
            patternsByGroupId: bootstrap.patternsByGroupId
        )
        let result = EarTrainingPhrasePairBattleEngine.handleNoteOn(
            matcherState: matcherState,
            window: pairWindow,
            patterns: patterns,
            midiNote: midi,
            damage: damageConfig
        )

        if result.nextMatcherState != matcherState {
            matcherState = result.nextMatcherState
        }
        if result.nextWindow != pairWindow {
            pairWindow = result.nextWindow
        }

        if result.evaluation.result == .miss {
            triggerFeedback(.miss)
            statusText = copy.tryAgain
            guard result.playerDamage > 0 else { return }
            let effectId = triggerBattleEffect(kind: .miss, label: "MISS", damage: result.playerDamage)
            registerBattleEffectImpact(effectId: effectId) { [weak self] in
                guard let self else { return }
                let nextHp = max(0, self.playerHp - result.playerDamage)
                self.playerHp = nextHp
                let outcome = EarTrainingEngine.resolveOutcome(
                    enemyHp: self.enemyHp,
                    playerHp: nextHp,
                    timeRemainingSec: self.timeRemaining,
                    phraseCompleted: false,
                    phraseFailed: false
                )
                if outcome == .gameOver {
                    self.finishGameOver(message: self.copy.gameOver)
                }
            }
            return
        }

        triggerFeedback(.correct)
        if result.evaluation.result == .complete, let pattern = result.evaluation.completedPattern {
            statusText = pattern.label
        }

        guard result.shouldFire, result.enemyDamage > 0 else { return }

        let effectId = triggerBattleEffect(kind: .correct, label: nil, damage: result.enemyDamage)
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            guard let self else { return }
            let nextEnemyHp = max(0, self.enemyHp - result.enemyDamage)
            self.enemyHp = nextEnemyHp
            let outcome = EarTrainingEngine.resolveOutcome(
                enemyHp: nextEnemyHp,
                playerHp: self.playerHp,
                timeRemainingSec: self.timeRemaining,
                phraseCompleted: false,
                phraseFailed: false
            )
            if outcome == .stageClear {
                Task { @MainActor in await self.finishStageClear() }
            }
        }
    }

    private func startCountIn() {
        progressSaveStarted = false
        lessonProgressStatus = nil
        enemyHp = stage.enemyHp
        playerHp = stage.playerHp
        timeRemaining = stage.timeLimitSec
        phraseRunId += 1
        countInValue = max(0, min(32, stage.countInBeats))
        pendingImpactHandlers.removeAll()
        pairWindow = EarTrainingPhrasePairBattleEngine.createWindow()
        matcherState = EarTrainingPhrasePairEngine.createInitialState()
        activeStep = nil
        drumLoopStarted = false
        cancelAllTimers()
        audio.stopDrumLoop()

        let beats = countInValue
        let runId = phraseRunId
        let bgmUrl = bootstrap.bgmUrl.trimmingCharacters(in: .whitespacesAndNewlines)

        let onBodyStarted: () -> Void = { [weak self] in
            guard let self, self.phraseRunId == runId else { return }
            self.countInEarlyInputActive = false
            self.gameState = .playingPhrase
            if !self.drumLoopStarted {
                self.drumLoopStarted = true
                self.audio.startDrumLoop()
            }
            if self.tutorialHooks == nil {
                self.startTimeLimit()
            } else {
                self.scheduleTutorialSession(runId: runId)
            }
            self.syncTimeline(scheduleNext: true)
            self.publishSnapshot()
        }

        if beats <= 0 {
            gameState = .playingPhrase
            statusText = ""
            countdownTask = Task { @MainActor [weak self] in
                guard let self else { return }
                guard let url = URL(string: bgmUrl), url.scheme != nil else {
                    self.finishGameOver(message: self.copy.audioFailed)
                    return
                }
                guard await self.audio.prepareDrumLoop(url: url) else {
                    self.finishGameOver(message: self.copy.audioFailed)
                    return
                }
                if Task.isCancelled { return }
                onBodyStarted()
            }
            publishSnapshot()
            return
        }

        gameState = .countIn
        statusText = copy.countIn
        countInEarlyInputActive = true
        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            guard let url = URL(string: bgmUrl), url.scheme != nil else {
                self.finishGameOver(message: self.copy.audioFailed)
                return
            }
            guard await self.audio.prepareDrumLoop(url: url) else {
                self.finishGameOver(message: self.copy.audioFailed)
                return
            }
            if Task.isCancelled { return }
            let beatMs = max(1, Int(60_000 / max(1, self.stage.bpm)))
            for remaining in stride(from: beats, through: 1, by: -1) {
                if Task.isCancelled { return }
                self.countInValue = remaining
                self.publishSnapshot()
                try? await Task.sleep(nanoseconds: UInt64(beatMs) * 1_000_000)
            }
            if Task.isCancelled { return }
            self.countInValue = 0
            onBodyStarted()
        }
        publishSnapshot()
    }

    private func syncTimeline(scheduleNext: Bool) {
        guard gameState == .playingPhrase else { return }
        let loopDurationSec = bootstrap.loopDurationSec
        guard loopDurationSec > 0 else { return }

        let currentTime = audio.phraseJudgmentTimelineSecNow()
        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime

        let nextStep = EarTrainingPhrasePairTimeline.step(
            at: loopTimeSafe,
            steps: bootstrap.steps,
            loopDurationSec: loopDurationSec
        )

        if let nextStep {
            let prevId = activeStep?.id
            if nextStep.id != prevId {
                if nextStep.inputDisabled {
                    matcherState = EarTrainingPhrasePairEngine.createInitialState()
                } else {
                    let patterns = EarTrainingPhrasePairTimeline.patterns(
                        for: nextStep,
                        patternsByGroupId: bootstrap.patternsByGroupId
                    )
                    matcherState = EarTrainingPhrasePairEngine.handleChordChange(
                        state: matcherState,
                        nextPatterns: patterns
                    )
                }
                pairWindow = EarTrainingPhrasePairBattleEngine.applyStepTransition(
                    pairWindow,
                    stepId: nextStep.id
                )
                activeStep = nextStep
                if let quote = nextStep.quote?.trimmingCharacters(in: .whitespacesAndNewlines), !quote.isEmpty {
                    scene?.setPlayerQuote(quote)
                } else {
                    scene?.setPlayerQuote(nil)
                }
            }
        }

        if scheduleNext {
            scheduleNextStepSync(currentTime: currentTime, loopDurationSec: loopDurationSec, loopTimeSafe: loopTimeSafe)
        }
    }

    private func scheduleNextStepSync(currentTime: Double, loopDurationSec: Double, loopTimeSafe: Double) {
        chordSyncTask?.cancel()
        guard let nextBoundary = EarTrainingPhrasePairTimeline.nextBoundarySec(
            steps: bootstrap.steps,
            loopTimeSec: loopTimeSafe,
            loopDurationSec: loopDurationSec
        ) else { return }

        let loopIndex = max(0, Int(floor(currentTime / loopDurationSec)))
        let nextAudioSyncTimeSec = (Double(loopIndex) * loopDurationSec) + nextBoundary
        let delaySec = max(Self.audioSyncEpsilonSec, nextAudioSyncTimeSec - currentTime)
        let delayNs = UInt64(delaySec * 1_000_000_000)
        chordSyncTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: delayNs)
            guard let self, !Task.isCancelled else { return }
            self.syncTimeline(scheduleNext: true)
        }
    }

    private func startTimeLimit() {
        cancelTimeLimitTimer()
        guard !effectivePracticeMode else { return }
        timeLimitTask = Task { @MainActor [weak self] in
            guard let self else { return }
            while self.timeRemaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                let next = max(0, self.timeRemaining - 1)
                self.timeRemaining = next
                self.publishSnapshot()
                if next <= 0 {
                    self.finishGameOver(message: self.copy.timeOver)
                    return
                }
            }
        }
    }

    private func finishStageClear() async {
        cancelAllTimers()
        gameState = .stageClear
        audio.stopDrumLoop()
        statusText = copy.stageClear
        triggerFeedback(.clear)
        publishSnapshot()
        guard !practiceMode, lessonContext != nil, !progressSaveStarted else { return }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        publishSnapshot()
        lessonProgressStatus = .saved
        publishSnapshot()
    }

    private func finishGameOver(message: String) {
        cancelAllTimers()
        gameState = .gameOver
        audio.stopDrumLoop()
        statusText = message
        publishSnapshot()
    }

    private func triggerBattleEffect(
        kind: EarTrainingBattleEffectKind,
        label: String?,
        damage: Int?
    ) -> Int {
        battleEffectIdCounter += 1
        let id = battleEffectIdCounter
        let command = EarTrainingBattleEffectCommand(
            id: id,
            kind: kind,
            label: label,
            damage: damage,
            phraseNoteCount: nil,
            originPoint: nil
        )
        if lastEmittedEffectId != id {
            lastEmittedEffectId = id
            if kind == .miss {
                audio.playFireMagicSe()
            }
            scene?.runEffect(command)
        }
        battleEffectClearTask?.cancel()
        battleEffectClearTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(Self.kBattleEffectMs * 1_000_000))
            await MainActor.run {
                self?.pendingImpactHandlers[id] = nil
            }
        }
        return id
    }

    private func registerBattleEffectImpact(effectId: Int, handler: @escaping () -> Void) {
        pendingImpactHandlers[effectId] = handler
    }

    private func triggerFeedback(_ value: EarTrainingBattleController.Feedback) {
        feedback = value
        feedbackTask?.cancel()
        feedbackTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 220_000_000)
            await MainActor.run {
                if self?.feedback == value { self?.feedback = nil }
            }
        }
    }

    private func cancelAllTimers() {
        countdownTask?.cancel()
        countdownTask = nil
        cancelTimeLimitTimer()
        chordSyncTask?.cancel()
        chordSyncTask = nil
        feedbackTask?.cancel()
        feedbackTask = nil
        battleEffectClearTask?.cancel()
        battleEffectClearTask = nil
        cancelTutorialTimers()
    }

    private func cancelTutorialTimers() {
        EarTrainingTutorialOsmdTimedDialogue.cancel(&tutorialTimedLineWorks)
        tutorialClearWork?.cancel()
        tutorialClearWork = nil
    }

    private func scheduleTutorialSession(runId: Int) {
        guard let hooks = tutorialHooks else { return }
        cancelTutorialTimers()

        if let raw = hooks.tutorialDrumLoopUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           !raw.isEmpty,
           let url = URL(string: raw) {
            Task { @MainActor [weak self] in
                guard let self, self.phraseRunId == runId else { return }
                guard await self.audio.prepareDrumLoop(url: url) else { return }
                if !self.drumLoopStarted {
                    self.drumLoopStarted = true
                }
                self.audio.startDrumLoop()
            }
        }

        let loopDur = bootstrap.loopDurationSec
        if let lines = hooks.osmdTimedLines, !lines.isEmpty {
            tutorialTimedLineWorks = EarTrainingTutorialOsmdTimedDialogue.schedule(
                lines: lines,
                bpm: stage.bpm,
                beatsPerMeasure: stage.beatsPerMeasure,
                countInBeats: stage.countInBeats,
                loopIndex: 0,
                phraseLoopDurationSec: loopDur,
                locale: isEnglishCopy ? .en : .ja,
                isActive: { [weak self] in
                    guard let self, self.phraseRunId == runId else { return false }
                    return self.gameState == .countIn || self.gameState == .playingPhrase
                },
                onLine: { [weak self] text in
                    self?.scene?.setPlayerQuote(text)
                    hooks.onCharacterText(text)
                }
            )
        }

        if let required = hooks.requiredMeasures {
            let delayMs = EarTrainingTutorialMeasureClear.clearDelayMs(
                bpm: stage.bpm,
                beatsPerMeasure: stage.beatsPerMeasure,
                countInBeats: stage.countInBeats,
                requiredMeasures: required
            )
            let capturedRunId = runId
            let work = DispatchWorkItem { [weak self] in
                guard let self, self.phraseRunId == capturedRunId else { return }
                hooks.onSceneComplete()
            }
            tutorialClearWork = work
            DispatchQueue.main.asyncAfter(deadline: .now() + delayMs / 1000, execute: work)
        }
    }

    private func cancelTimeLimitTimer() {
        timeLimitTask?.cancel()
        timeLimitTask = nil
    }

    private func publishSnapshot() {
        objectWillChange.send()
        let enemyAvatar = EarTrainingBattleController.avatarAssetName(
            stageId: stage.id,
            enemyId: stage.id.uuidString
        )
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: gameState,
            stageId: stage.id,
            stageTitle: stage.localizedTitle(isEnglishCopy ? .en : .ja),
            phraseIndex: 0,
            phraseRunId: phraseRunId,
            phraseIntroSeq: 0,
            phraseIntroEmphasis: false,
            totalPhrases: 1,
            phraseIntroLine: "",
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: enemyAvatar,
            enemyAvatarFlipX: EarTrainingBattleController.shouldFlipEnemyAvatar(name: enemyAvatar),
            fixedCharacterPositions: false,
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
    }

    private func formatTime(_ seconds: Int) -> String {
        let safe = max(0, seconds)
        let minutes = safe / 60
        let rest = safe % 60
        return String(format: "%d:%02d", minutes, rest)
    }

    var hudModel: EarTrainingHudModel {
        let rows = bootstrap.steps
        let completed = rows.map { _ in false }
        let slotIndex = rows.firstIndex(where: { $0.id == activeStep?.id }) ?? 0
        let chips = rows.map { step in
            let active = (gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive))
                && activeStep?.id == step.id
            return EarTrainingChordChip(id: step.id, name: step.chordName, active: active)
        }
        return EarTrainingHudModel(
            playerHp: playerHp,
            playerMaxHp: stage.playerHp,
            enemyHp: enemyHp,
            enemyMaxHp: stage.enemyHp,
            practiceMode: effectivePracticeMode,
            timeRemaining: timeRemaining,
            timeLabel: timeLabel,
            hideTimeLabel: false,
            hidePlayerHpBar: false,
            hideSettingsButton: false,
            hideBackButton: false,
            enemyAttackGaugePercent: 0,
            hideEnemyAttackGauge: true,
            hideChordChips: false,
            hideSlotsRow: false,
            hudLabels: hudLabels,
            gameState: gameState,
            phraseRunId: phraseRunId,
            chordChips: chips,
            slotRow: .chordVoicing(slotCount: max(1, rows.count), completed: completed, currentIndex: slotIndex)
        )
    }
}

extension EarTrainingPhrasePairAdlibBattleController: EarTrainingBattleSceneDriving {}
extension EarTrainingPhrasePairAdlibBattleController: EarTrainingPianoPlayable {}
extension EarTrainingPhrasePairAdlibBattleController: EarTrainingLobbyPresentable {
    var resultState: EarTrainingResultState? {
        switch gameState {
        case .stageClear: return .win
        case .gameOver:
            return statusText == copy.timeOver ? .timeOver : .lose
        default: return nil
        }
    }

    var lastRank: EarTrainingRank? { nil }
    var resultRankLine: String? { nil }
    var stageTitleForLobby: String { stage.localizedTitle(isEnglishCopy ? .en : .ja) }
    var quizRulesLine: String? { nil }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
    }

    var startButtonLabel: String { gameState == .idle ? "START" : "RETRY" }

    var lessonProgressText: String? {
        guard lessonContext != nil, gameState == .stageClear else { return nil }
        switch lessonProgressStatus {
        case .saved: return copy.lessonSaved
        case .saving: return copy.lessonSaving
        case nil: return copy.lessonSaving
        }
    }
}
