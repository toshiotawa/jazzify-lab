import Foundation
import Combine
import QuartzCore

/// 耳コピ「アドリブ」モード（Web `EarTrainingAdlibScreen` 相当）。
@MainActor
final class EarTrainingAdlibBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let audioSyncEpsilonSec: Double = 0.012
    private static let kBattleEffectMs: Double = 1_600
    private static let emptyCompletedChordIds = Set<UUID>()

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var phraseRunId: Int = 0
    private var phraseIntroSeq: Int = 0
    @Published private(set) var adlibWindow = EarTrainingAdlibEngine.createWindow()
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int
    @Published private(set) var countInValue: Int
    @Published private(set) var activeChord: EarTrainingPhraseChordDetail? {
        didSet { recomputeVoicingHints() }
    }
    @Published private(set) var countInEarlyInputActive = false {
        didSet { recomputeVoicingHints() }
    }
    @Published private(set) var statusText: String
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool { didSet { recomputeVoicingHints() } }
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var voicingHintsByMidi: [Int: VoicingHintState] = [:]

    let stage: EarTrainingStageDetail
    let phrases: [EarTrainingPhraseDetail]
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy
    private let enemyId: String
    private let enemyName: String
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared
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
        (practiceMode || tutorialNoCombat) ? EarTrainingDamageConfig.zero : EarTrainingDamageConfig(
            perCorrectNote: stage.perCorrectNoteDamage,
            good: stage.goodCompletionDamage,
            great: stage.greatCompletionDamage,
            perfect: stage.perfectCompletionDamage,
            miss: stage.missDamage,
            fail: stage.failDamage
        )
    }

    var currentPhrase: EarTrainingPhraseDetail? {
        guard phraseIndex >= 0, phraseIndex < phrases.count else { return nil }
        return phrases[phraseIndex]
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
        phrases: [EarTrainingPhraseDetail],
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        enemyId: String,
        enemyName: String,
        audio: EarTrainingAudio,
        initialPracticeMode: Bool = false,
        onExit: @escaping () -> Void
    ) {
        self.stage = stage
        self.phrases = phrases
        self.lessonContext = lessonContext
        self.isEnglishCopy = isEnglishCopy
        self.enemyId = enemyId
        self.enemyName = enemyName
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
                self?.syncAdlibTimeline(scheduleNext: true)
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
        audio.stopPhrase()
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
            syncAdlibTimeline(scheduleNext: false)
            guard gameState == .playingPhrase else { return }
        }

        guard let phrase = currentPhrase,
              let chord = activeChord,
              let row = EarTrainingAdlibEngine.harmonyRow(containingChordId: chord.id, phrase: phrase)
        else { return }

        if chord.inputDisabled {
            return
        }

        let loopDurationSec = phrase.loopDurationSec
        var loopTimeSafe: Double = 0
        if !allowEarlyCountIn, loopDurationSec > 0 {
            let currentTime = audio.phraseJudgmentTimelineSecNow()
            let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
            loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime
        }

        let targets = EarTrainingChordVoicingEngine.judgmentTargetsAt(
            phrase: phrase,
            loopTime: loopTimeSafe,
            bpm: stage.bpm,
            completedChordIds: Self.emptyCompletedChordIds,
            displayChord: chord,
            loopDurationSec: loopDurationSec > 0 ? loopDurationSec : nil
        )

        var union = EarTrainingAdlibEngine.unionPitchClasses(phrase: phrase, row: row)
        if let overlap = targets.overlap, !overlap.inputDisabled,
           let overlapRow = EarTrainingAdlibEngine.harmonyRow(containingChordId: overlap.id, phrase: phrase) {
            union.formUnion(EarTrainingAdlibEngine.unionPitchClasses(phrase: phrase, row: overlapRow))
        }

        let result = EarTrainingAdlibEngine.handleNoteOn(
            window: adlibWindow,
            unionPitchClasses: union,
            midiNote: midi,
            damage: damageConfig
        )
        if result.nextWindow != adlibWindow {
            adlibWindow = result.nextWindow
        }

        if result.kind == .miss {
            triggerFeedback(.miss)
            statusText = copy.tryAgain
            guard result.playerDamage > 0 else { return }
            let effectId = triggerBattleEffect(kind: .miss, label: "MISS", damage: result.playerDamage, phraseNoteCount: nil)
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
        guard result.shouldFire, result.enemyDamage > 0 else { return }

        let effectId = triggerBattleEffect(kind: .correct, label: nil, damage: result.enemyDamage, phraseNoteCount: nil)
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
        guard let phrase = phrases.first else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        progressSaveStarted = false
        lessonProgressStatus = nil
        enemyHp = stage.enemyHp
        playerHp = stage.playerHp
        timeRemaining = stage.timeLimitSec
        phraseIndex = 0
        phraseRunId += 1
        phraseIntroSeq += 1
        let beats = max(0, min(32, stage.countInBeats))
        countInValue = 0
        pendingImpactHandlers.removeAll()
        adlibWindow = EarTrainingAdlibEngine.createWindow()
        activeChord = nil
        drumLoopStarted = false
        cancelAllTimers()
        audio.stopDrumLoop()
        audio.stopPhrase()

        let runId = phraseRunId

        let onPhraseBodyStarted: () -> Void = { [weak self] in
            guard let self, self.phraseRunId == runId else { return }
            self.countInEarlyInputActive = false
            self.gameState = .playingPhrase
            if !self.drumLoopStarted {
                self.drumLoopStarted = true
                self.audio.startDrumLoop()
            }
            if self.tutorialHooks == nil {
                self.startTimeLimit()
            } else if let phrase = self.currentPhrase {
                self.scheduleTutorialSession(phrase: phrase, runId: runId)
            }
            self.syncAdlibTimeline(scheduleNext: true)
            self.publishSnapshot()
        }

        if beats <= 0 {
            gameState = .playingPhrase
            statusText = ""
            countdownTask = Task { @MainActor [weak self] in
                guard let self else { return }
                guard let url = URL(string: phrase.audioUrl.trimmingCharacters(in: .whitespacesAndNewlines)),
                      url.scheme != nil else {
                    self.finishGameOver(message: self.copy.audioFailed)
                    return
                }
                guard await self.audio.prepareDrumLoop(url: url) else {
                    self.finishGameOver(message: self.copy.audioFailed)
                    return
                }
                if Task.isCancelled { return }
                onPhraseBodyStarted()
            }
            publishSnapshot()
            return
        }

        gameState = .countIn
        statusText = copy.countIn
        countInEarlyInputActive = true
        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            guard let url = URL(string: phrase.audioUrl.trimmingCharacters(in: .whitespacesAndNewlines)),
                  url.scheme != nil else {
                self.finishGameOver(message: self.copy.audioFailed)
                return
            }
            guard await self.audio.prepareDrumLoop(url: url) else {
                self.finishGameOver(message: self.copy.audioFailed)
                return
            }
            if Task.isCancelled { return }
            guard self.phraseRunId == runId else { return }
            let beatMs = max(1, Int(60_000 / max(1, self.stage.bpm)))
            for remaining in stride(from: beats, through: 1, by: -1) {
                if Task.isCancelled { return }
                self.countInValue = remaining
                self.publishSnapshot()
                try? await Task.sleep(nanoseconds: UInt64(beatMs) * 1_000_000)
            }
            if Task.isCancelled { return }
            self.countInValue = 0
            onPhraseBodyStarted()
        }
        publishSnapshot()
    }

    private func syncAdlibTimeline(scheduleNext: Bool) {
        guard gameState == .playingPhrase else { return }
        guard let phrase = currentPhrase else { return }
        let loopDurationSec = phrase.loopDurationSec
        guard loopDurationSec > 0 else { return }

        let currentTime = audio.phraseJudgmentTimelineSecNow()
        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime

        let nextChord = EarTrainingChordVoicingEngine.chordDisplayAt(
            phrase: phrase,
            loopTime: loopTimeSafe,
            bpm: stage.bpm,
            completedChordIds: Self.emptyCompletedChordIds,
            loopDurationSec: loopDurationSec
        )

        if let chord = nextChord,
           let row = EarTrainingAdlibEngine.harmonyRow(containingChordId: chord.id, phrase: phrase) {
            let repChanged = adlibWindow.harmonyRepresentativeId != row.representativeId
            if chord.inputDisabled || repChanged {
                adlibWindow = EarTrainingAdlibEngine.createWindow(harmonyRepresentativeId: row.representativeId)
            } else {
                let transitioned = EarTrainingAdlibEngine.applyHarmonyTransition(
                    adlibWindow,
                    harmonyRepresentativeId: row.representativeId
                )
                if transitioned != adlibWindow {
                    adlibWindow = transitioned
                }
            }
        }

        if nextChord?.id != activeChord?.id {
            activeChord = nextChord
            updatePlayerQuoteBubble()
        }

        if scheduleNext {
            scheduleNextChordSync(phrase: phrase, currentTime: currentTime, loopDurationSec: loopDurationSec)
        }
    }

    private func scheduleNextChordSync(
        phrase: EarTrainingPhraseDetail,
        currentTime: Double,
        loopDurationSec: Double
    ) {
        chordSyncTask?.cancel()
        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime
        let nextBoundary = EarTrainingChordVoicingEngine.nextChordDisplayBoundarySec(
            phrase: phrase,
            loopTimeSec: loopTimeSafe,
            bpm: stage.bpm,
            completedChordIds: Self.emptyCompletedChordIds,
            loopDurationSec: loopDurationSec
        )

        let loopIndex = max(0, Int(floor(currentTime / loopDurationSec)))
        var nextAudioSyncTimeSec = (Double(loopIndex) + 1) * loopDurationSec
        if let boundary = nextBoundary {
            nextAudioSyncTimeSec = (Double(loopIndex) * loopDurationSec) + boundary
        }
        if nextAudioSyncTimeSec <= currentTime + Self.audioSyncEpsilonSec {
            nextAudioSyncTimeSec = currentTime + Self.audioSyncEpsilonSec
        }
        let delaySec = nextAudioSyncTimeSec - currentTime - Self.audioSyncEpsilonSec
        let delayNs = UInt64(max(Self.audioSyncEpsilonSec, delaySec) * 1_000_000_000)
        chordSyncTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: delayNs)
            guard let self, !Task.isCancelled else { return }
            self.syncAdlibTimeline(scheduleNext: true)
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
        audio.stopPhrase()
        statusText = copy.stageClear
        triggerFeedback(.clear)
        publishSnapshot()
        guard !practiceMode, let lessonContext, !progressSaveStarted else { return }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        publishSnapshot()
        do {
            _ = try await supabase.recordEarTrainingLessonProgress(
                lessonId: lessonContext.lessonId,
                lessonSongId: lessonContext.lessonSongId,
                rank: "B",
                clearConditions: lessonContext.clearConditions
            )
            lessonProgressStatus = .saved
        } catch {
            lessonProgressStatus = .saving
        }
        publishSnapshot()
    }

    private func finishGameOver(message: String) {
        cancelAllTimers()
        gameState = .gameOver
        audio.stopDrumLoop()
        audio.stopPhrase()
        statusText = message
        publishSnapshot()
    }

    private func triggerBattleEffect(
        kind: EarTrainingBattleEffectKind,
        label: String?,
        damage: Int?,
        phraseNoteCount: Int?
    ) -> Int {
        battleEffectIdCounter += 1
        let id = battleEffectIdCounter
        let command = EarTrainingBattleEffectCommand(
            id: id,
            kind: kind,
            label: label,
            damage: damage,
            phraseNoteCount: phraseNoteCount,
            originPoint: nil
        )
        if lastEmittedEffectId != id {
            lastEmittedEffectId = id
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
        timeLimitTask?.cancel()
        timeLimitTask = nil
        chordSyncTask?.cancel()
        chordSyncTask = nil
        feedbackTask?.cancel()
        feedbackTask = nil
        battleEffectClearTask?.cancel()
        battleEffectClearTask = nil
        cancelTutorialTimers()
        countInEarlyInputActive = false
    }

    private func cancelTutorialTimers() {
        EarTrainingTutorialOsmdTimedDialogue.cancel(&tutorialTimedLineWorks)
        tutorialClearWork?.cancel()
        tutorialClearWork = nil
    }

    private func scheduleTutorialSession(phrase: EarTrainingPhraseDetail, runId: Int) {
        guard let hooks = tutorialHooks else { return }
        cancelTutorialTimers()

        if let raw = hooks.tutorialDrumLoopUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           !raw.isEmpty,
           let url = URL(string: raw) {
            Task { @MainActor [weak self] in
                guard let self, self.phraseRunId == runId else { return }
                guard await self.audio.prepareDrumLoop(url: url) else { return }
                self.audio.startDrumLoop()
            }
        }

        let loopDur = phrase.loopDurationSec.isFinite && phrase.loopDurationSec > 0
            ? phrase.loopDurationSec
            : bootstrapLoopDurationFallbackSec()

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

    private func bootstrapLoopDurationFallbackSec() -> Double {
        let beatDuration = 60.0 / Double(max(1, stage.bpm))
        return beatDuration * Double(max(1, stage.loopMeasures))
    }

    private func cancelTimeLimitTimer() {
        timeLimitTask?.cancel()
        timeLimitTask = nil
    }

    private func recomputeVoicingHints() {
        let showTargets = gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive)
        let next: [Int: VoicingHintState]
        if (practiceMode || stage.resolvedShowKeyboardHintsInBattle),
           showTargets,
           let phrase = currentPhrase,
           let chord = activeChord,
           let row = EarTrainingAdlibEngine.harmonyRow(containingChordId: chord.id, phrase: phrase) {
            next = EarTrainingAdlibEngine.voicingKeyboardHints(
                phrase: phrase,
                row: row,
                pressedPitchClasses: adlibWindow.pressedPitchClasses
            )
        } else {
            next = [:]
        }
        if next != voicingHintsByMidi { voicingHintsByMidi = next }
    }

    private func formatTime(_ seconds: Int) -> String {
        let safe = max(0, seconds)
        return String(format: "%d:%02d", safe / 60, safe % 60)
    }

    private func publishSnapshot() {
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: gameState,
            stageId: stage.id,
            stageTitle: stage.localizedTitle(isEnglishCopy ? .en : .ja),
            phraseIndex: phraseIndex,
            phraseRunId: phraseRunId,
            phraseIntroSeq: phraseIntroSeq,
            phraseIntroEmphasis: false,
            totalPhrases: phrases.count,
            phraseIntroLine: phraseIntroLine(),
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: Self.avatarAssetName(stageId: stage.id, enemyId: enemyId),
            enemyAvatarFlipX: Self.shouldFlipEnemyAvatar(name: Self.avatarAssetName(stageId: stage.id, enemyId: enemyId)),
            fixedCharacterPositions: false,
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
    }

    private func phraseIntroLine() -> String {
        ""
    }

    static func avatarAssetName(stageId: UUID, enemyId: String) -> String {
        EarTrainingBattleController.avatarAssetName(stageId: stageId, enemyId: enemyId)
    }

    static func shouldFlipEnemyAvatar(name: String) -> Bool {
        EarTrainingBattleController.shouldFlipEnemyAvatar(name: name)
    }

    var hudModel: EarTrainingHudModel {
        let phrase = currentPhrase
        let rows: [EarTrainingChordVoicingEngine.HarmonyHudRow] = {
            guard let phrase else { return [] }
            let built = EarTrainingChordVoicingEngine.harmonyHudRows(for: phrase)
            if !built.isEmpty { return built }
            return (phrase.chords ?? []).map { chord in
                EarTrainingChordVoicingEngine.HarmonyHudRow(
                    representativeId: chord.id,
                    chordName: chord.chordName,
                    voicingIds: [chord.id]
                )
            }
        }()
        let completed = rows.map { _ in false }
        let slotIndex = rows.firstIndex(where: { $0.representativeId == activeHarmonyRepresentativeId() }) ?? 0
        let chips = rows.map { row in
            let active = (gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive))
                && activeChord.map { row.voicingIds.contains($0.id) } == true
            return EarTrainingChordChip(id: row.representativeId, name: row.chordName, active: active)
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

    private func updatePlayerQuoteBubble() {
        let showTargets = gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive)
        guard showTargets, let chord = activeChord else {
            scene?.setPlayerQuote(nil)
            return
        }
        guard let raw = chord.quote?.text else {
            scene?.setPlayerQuote(nil)
            return
        }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        scene?.setPlayerQuote(trimmed.isEmpty ? nil : trimmed)
    }

    private func activeHarmonyRepresentativeId() -> UUID? {
        guard let phrase = currentPhrase, let chord = activeChord else { return nil }
        return EarTrainingAdlibEngine.harmonyRow(containingChordId: chord.id, phrase: phrase)?.representativeId
    }
}

extension EarTrainingAdlibBattleController: EarTrainingBattleSceneDriving {}
extension EarTrainingAdlibBattleController: EarTrainingPianoPlayable {}
extension EarTrainingAdlibBattleController: EarTrainingLobbyPresentable {
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
