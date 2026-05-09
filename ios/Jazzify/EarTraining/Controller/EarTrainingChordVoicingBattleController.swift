import Foundation
import Combine
import QuartzCore

/// 耳コピ「コード演奏バトル」モード ([src/components/earTraining/EarTrainingChordVoicingScreen.tsx]) と同等の状態機械。
@MainActor
final class EarTrainingChordVoicingBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let audioEndEpsilonSec: Double = 0.03
    private static let audioSyncEpsilonSec: Double = 0.012
    private static let minAudioSyncTimerSec: Double = 0.008
    private static let kBattleEffectMs: Double = 1_600
    private static let kAwesomeBattleEffectMs: Double = 4_500
    private static let attackGaugeTargetLoops: Int = 6
    private static let zeroDamage = EarTrainingDamageConfig.zero

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var phraseRunId: Int = 0
    @Published private(set) var attempt: EarTrainingChordVoicingAttempt? {
        didSet { recomputeVoicingHints() }
    }
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int
    @Published private(set) var countInValue: Int
    @Published private(set) var activeChord: EarTrainingPhraseChordDetail? {
        didSet { recomputeVoicingHints() }
    }
    @Published private(set) var lastRank: EarTrainingRank?
    @Published private(set) var statusText: String
    @Published private(set) var activeLoop: Int = 1
    @Published private(set) var activeMeasureNumber: Int = 1
    @Published private(set) var enemyAttackGaugePercent: Double = 0
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool {
        didSet { recomputeVoicingHints() }
    }
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    /// 練習モード時の鍵盤ヒント。`activeChord` の voicing を MIDI に展開し、
    /// 押下済み PC を含むノートは `.completed`、それ以外は `.pending`。
    /// `activeChord` が既に完成済み（`completedChordIds` に含まれる）のときは
    /// ヒントを表示しない。activeChord または attempt の状態変化に応じて
    /// event-driven に再計算する。
    @Published private(set) var voicingHintsByMidi: [Int: VoicingHintState] = [:]

    let stage: EarTrainingStageDetail
    let phrases: [EarTrainingPhraseDetail]
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy
    let enemyName: String
    let enemyId: String

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared
    private weak var scene: EarTrainingBattleSceneHandle?

    private var lastInputAt: TimeInterval = 0
    private var failTimerTask: Task<Void, Never>?
    private var transitionTimerTask: Task<Void, Never>?
    private var countdownTask: Task<Void, Never>?
    private var timeLimitTask: Task<Void, Never>?
    private var chordSyncTask: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private var battleEffectClearTask: Task<Void, Never>?
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var lastEmittedEffectId: Int = -1
    private var progressSaveStarted: Bool = false
    private var allChordsCompletedFlag: Bool = false
    private var lastLoopAttackApplied: Int = 0

    var damageConfig: EarTrainingDamageConfig {
        if practiceMode { return Self.zeroDamage }
        return EarTrainingDamageConfig(
            perCorrectNote: stage.perCorrectNoteDamage,
            good: stage.goodCompletionDamage,
            great: stage.greatCompletionDamage,
            perfect: stage.perfectCompletionDamage,
            miss: stage.missDamage,
            fail: stage.failDamage
        )
    }

    var rankRule: EarTrainingRankRule {
        EarTrainingRankRule(perfectMaxMisses: stage.perfectMaxMisses, greatMaxMisses: stage.greatMaxMisses)
    }

    var currentPhrase: EarTrainingPhraseDetail? {
        guard phraseIndex >= 0 && phraseIndex < phrases.count else { return nil }
        return phrases[phraseIndex]
    }

    var canChangePracticeMode: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var showLobbyControls: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var startButtonLabel: String {
        gameState == .idle ? "START" : "RETRY"
    }

    var timeLabel: String {
        if practiceMode { return "∞" }
        let safe = max(0, timeRemaining)
        let minutes = safe / 60
        let rest = safe % 60
        return String(format: "%d:%02d", minutes, rest)
    }

    var countInDisplay: String {
        isEnglishCopy ? "Count \(countInValue)" : "カウント \(countInValue)"
    }

    var phraseIntroLine: String {
        let current = phraseIndex + 1
        return isEnglishCopy
            ? "Phrase \(current) / \(phrases.count)"
            : "フレーズ \(current) / \(phrases.count)"
    }

    var stageStatusText: String {
        gameState == .countIn ? countInDisplay : statusText
    }

    var resultRankLine: String? {
        guard gameState == .stageClear, let rank = lastRank else { return nil }
        let letter = EarTrainingEngine.lessonRank(from: rank)
        return "\(hudLabels.clearGradePrefix) \(letter)"
    }

    var lessonProgressText: String? {
        guard lessonContext != nil, gameState == .stageClear else { return nil }
        switch lessonProgressStatus {
        case .saved: return copy.lessonSaved
        case .saving: return copy.lessonSaving
        case nil: return copy.lessonSaving
        }
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
        let completed = rows.map { row in
            row.voicingIds.allSatisfy { id in attempt?.completedChordIds.contains(id) ?? false }
        }
        let firstIncomplete = completed.firstIndex(where: { !$0 }) ?? completed.count
        let slotIndex = firstIncomplete < completed.count ? firstIncomplete : max(0, completed.count - 1)
        let chips = rows.map { row in
            let active = activeChord.map { row.voicingIds.contains($0.id) } ?? false
            return EarTrainingChordChip(id: row.representativeId, name: row.chordName, active: active)
        }
        return EarTrainingHudModel(
            playerHp: playerHp,
            playerMaxHp: stage.playerHp,
            enemyHp: enemyHp,
            enemyMaxHp: stage.enemyHp,
            practiceMode: practiceMode,
            timeRemaining: timeRemaining,
            timeLabel: timeLabel,
            enemyAttackGaugePercent: enemyAttackGaugePercent,
            hudLabels: hudLabels,
            gameState: gameState,
            phraseRunId: phraseRunId,
            chordChips: chips,
            slotRow: .chordVoicing(slotCount: max(1, rows.count), completed: completed, currentIndex: slotIndex)
        )
    }

    init(
        stage: EarTrainingStageDetail,
        phrases: [EarTrainingPhraseDetail],
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        enemyId: String,
        enemyName: String,
        audio: EarTrainingAudio,
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
        self.practiceMode = lessonContext == nil ? false : false
        self.enemyHp = stage.enemyHp
        self.playerHp = stage.playerHp
        self.timeRemaining = stage.timeLimitSec
        self.countInValue = stage.countInBeats
        self.statusText = copy.idlePrompt
    }

    // MARK: - Scene

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishSnapshot()
    }

    func detachScene() {
        scene = nil
    }

    func handleEffectImpact(effectId: Int) {
        guard let handler = pendingImpactHandlers.removeValue(forKey: effectId) else { return }
        handler()
    }

    // MARK: - Lifecycle

    func start() {
        audio.start()
        audio.onTimeUpdate = { [weak self] currentTime in
            Task { @MainActor in
                self?.handleAudioTimeUpdate(currentTime: currentTime)
            }
        }
        audio.onEnded = { [weak self] in
            Task { @MainActor in
                self?.failCurrentPhrase()
            }
        }
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
        audio.stopPhrase()
        onExitCallback()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
    }

    func startBattle() {
        startCountIn()
    }

    func handleNoteOn(midi: Int, velocity: Int = 100, playAudio: Bool = true) {
        if playAudio {
            audio.pianoNoteOn(midi: midi, velocity: velocity)
        }
        handleNoteInput(midi: midi)
    }

    func handleNoteOff(midi: Int, playAudio: Bool = true) {
        if playAudio {
            audio.pianoNoteOff(midi: midi)
        }
    }

    private func handleNoteInput(midi: Int) {
        let now = CACurrentMediaTime() * 1000
        if now - lastInputAt < Self.inputCooldownMs { return }
        lastInputAt = now

        guard gameState == .playingPhrase else { return }
        syncChordTimeline(scheduleNext: false)
        guard gameState == .playingPhrase else { return }
        guard let phrase = currentPhrase, let current = attempt, let chord = activeChord else { return }

        let result = EarTrainingChordVoicingEngine.handleNoteOn(
            attempt: current,
            activeChord: chord,
            midiNote: midi,
            damage: damageConfig
        )

        if result.attempt != current {
            attempt = result.attempt
        }

        if result.evaluationMissAdded {
            triggerFeedback(.miss)
            statusText = copy.tryAgain
            return
        }

        if result.hitPitchClass != nil {
            triggerFeedback(.correct)
        }

        if !result.chordJustCompleted {
            return
        }

        let harmonyRow = EarTrainingChordVoicingEngine.harmonyRow(containingChordId: chord.id, phrase: phrase)
        if let row = harmonyRow,
           !EarTrainingChordVoicingEngine.isHarmonySegmentFullyCompleted(attempt: result.attempt, row: row) {
            attempt = result.attempt
            _ = triggerBattleEffect(kind: .voicingCast, label: nil, damage: nil, phraseNoteCount: nil)
            syncChordTimeline(scheduleNext: true)
            return
        }

        let awardId = harmonyRow?.representativeId ?? chord.id
        let acknowledged = EarTrainingChordVoicingEngine.acknowledgeChordAward(
            attempt: result.attempt,
            chordId: awardId
        )
        attempt = acknowledged

        if let rootName = result.rootNoteName {
            playRootNoteIfPossible(rootName: rootName)
        }

        statusText = copy.chordCompleted(chordName: chord.chordName)
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
                let rank: EarTrainingRank
                let totalMiss = EarTrainingChordVoicingEngine.totalMissCount(acknowledged)
                if totalMiss <= self.rankRule.perfectMaxMisses { rank = .perfect }
                else if totalMiss <= self.rankRule.greatMaxMisses { rank = .great }
                else { rank = .good }
                Task { @MainActor in await self.finishStageClear(rank: rank) }
            }
        }

        if EarTrainingChordVoicingEngine.isAllChordsCompleted(phrase: phrase, attempt: acknowledged) {
            handleAllChordsCompleted(phrase: phrase, attempt: acknowledged)
            return
        }
        syncChordTimeline(scheduleNext: true)
    }

    private func handleAllChordsCompleted(
        phrase: EarTrainingPhraseDetail,
        attempt: EarTrainingChordVoicingAttempt
    ) {
        if allChordsCompletedFlag { return }
        allChordsCompletedFlag = true
        gameState = .phraseComplete
        cancelFailTimer()
        cancelChordSyncTask()

        let totalMiss = EarTrainingChordVoicingEngine.totalMissCount(attempt)
        let rank: EarTrainingRank
        if totalMiss <= rankRule.perfectMaxMisses { rank = .perfect }
        else if totalMiss <= rankRule.greatMaxMisses { rank = .great }
        else { rank = .good }
        lastRank = rank
        let completionDamage = EarTrainingEngine.completionDamage(rank: rank, damage: damageConfig)
        let totalVoicingNotes = (phrase.chords ?? []).reduce(0) { $0 + ($1.voicing?.count ?? 0) }
        let effectId = triggerBattleEffect(
            kind: .complete,
            label: completionDisplayRank(rank: rank, phrase: phrase),
            damage: completionDamage,
            phraseNoteCount: totalVoicingNotes
        )
        let willStageClear = enemyHp - completionDamage <= 0
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            guard let self else { return }
            let nextEnemyHp = max(0, self.enemyHp - completionDamage)
            self.enemyHp = nextEnemyHp
            let outcome = EarTrainingEngine.resolveOutcome(
                enemyHp: nextEnemyHp,
                playerHp: self.playerHp,
                timeRemainingSec: self.timeRemaining,
                phraseCompleted: true,
                phraseFailed: false
            )
            if outcome == .stageClear {
                Task { @MainActor in await self.finishStageClear(rank: rank) }
            }
        }
        if !willStageClear {
            scheduleTransitionToNextPhrase(rank: rank, phrase: phrase)
        }
    }

    private func completionDisplayRank(rank: EarTrainingRank, phrase: EarTrainingPhraseDetail) -> String {
        if rank == .perfect && (phrase.chords ?? []).reduce(0, { $0 + ($1.voicing?.count ?? 0) }) >= 6 {
            return "Awesome!"
        }
        return rank.rawValue
    }

    private func scheduleTransitionToNextPhrase(
        rank: EarTrainingRank,
        phrase: EarTrainingPhraseDetail
    ) {
        cancelTransitionTimer()
        let delaySec = EarTrainingEngine.nextMeasureDelaySec(
            currentAudioTimeSec: audio.currentTimeSec,
            loopDurationSec: phrase.loopDurationSec,
            loopMeasures: stage.loopMeasures
        )
        statusText = copy.transitionNextBar(rank: rank.rawValue)
        transitionTimerTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delaySec * 1_000_000_000))
            guard let self else { return }
            self.audio.stopPhrase()
            try? await Task.sleep(nanoseconds: 420_000_000)
            let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
            self.startPhrase(at: next)
        }
    }

    private func startCountIn() {
        guard !phrases.isEmpty else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        progressSaveStarted = false
        lessonProgressStatus = nil
        enemyHp = stage.enemyHp
        playerHp = stage.playerHp
        timeRemaining = stage.timeLimitSec
        phraseIndex = 0
        phraseRunId = 0
        countInValue = stage.countInBeats
        lastLoopAttackApplied = 0
        pendingImpactHandlers.removeAll()
        enemyAttackGaugePercent = 0
        activeLoop = 1
        activeMeasureNumber = 1
        gameState = .countIn
        statusText = copy.countIn
        cancelAllTimers()
        audio.stopPhrase()

        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            var remaining = self.stage.countInBeats
            let beatDurationNs = UInt64(max(0.1, 60.0 / Double(self.stage.bpm)) * 1_000_000_000)
            while remaining > 0 {
                try? await Task.sleep(nanoseconds: beatDurationNs)
                remaining -= 1
                self.countInValue = max(remaining, 0)
            }
            self.startTimeLimit()
            self.startPhrase(at: 0)
        }
        publishSnapshot()
    }

    private func startPhrase(at nextIndex: Int) {
        guard let phrase = phrases.indices.contains(nextIndex) ? phrases[nextIndex] : nil else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        cancelFailTimer()
        cancelTransitionTimer()
        cancelChordSyncTask()
        phraseIndex = nextIndex
        phraseRunId += 1
        lastLoopAttackApplied = 0
        enemyAttackGaugePercent = 0
        activeLoop = 1
        activeMeasureNumber = 1
        let next = EarTrainingChordVoicingEngine.createAttempt(for: phrase)
        attempt = next
        lastRank = nil
        allChordsCompletedFlag = false
        let initialChord = EarTrainingChordVoicingEngine.chordDisplayAt(
            phrase: phrase,
            loopTime: 0,
            bpm: stage.bpm,
            completedChordIds: next.completedChordIds
        )
        activeChord = initialChord
        statusText = copy.phraseLabel(indexOneBased: nextIndex + 1)
        gameState = .playingPhrase
        if let url = URL(string: phrase.audioUrl) {
            audio.playPhrase(url: url)
        }
        publishSnapshot()
        syncChordTimeline(scheduleNext: true)
    }

    private func startTimeLimit() {
        cancelTimeLimitTimer()
        if practiceMode { return }
        timeLimitTask = Task { @MainActor [weak self] in
            guard let self else { return }
            while self.timeRemaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                let next = max(0, self.timeRemaining - 1)
                self.timeRemaining = next
                if next <= 0 {
                    self.finishGameOver(message: self.copy.timeOver)
                    return
                }
            }
        }
    }

    private func syncChordTimeline(scheduleNext: Bool) {
        guard gameState == .playingPhrase else { return }
        guard let phrase = currentPhrase, let currentAttempt = attempt else { return }
        let loopDurationSec = phrase.loopDurationSec
        guard loopDurationSec > 0 else { return }

        let currentTime = audio.currentTimeSec
        let audioDurationSec = phrase.audioDurationSec
        if audioDurationSec.isFinite, currentTime >= audioDurationSec - Self.audioEndEpsilonSec {
            failCurrentPhrase()
            return
        }

        let loop = Int(floor(currentTime / loopDurationSec)) + 1
        let clampedLoop = max(1, min(stage.maxLoopsPerPhrase, loop))
        if activeLoop != clampedLoop { activeLoop = clampedLoop }

        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime
        let measureNum = measureNumberAtLoopTime(
            loopTimeSec: loopTimeSafe,
            loopDurationSec: loopDurationSec,
            loopMeasures: stage.loopMeasures
        )
        if activeMeasureNumber != measureNum {
            activeMeasureNumber = measureNum
        }

        let gaugeDuration = loopDurationSec * Double(Self.attackGaugeTargetLoops)
        if gaugeDuration > 0 {
            let nextGauge = max(0, min(1, currentTime / gaugeDuration))
            if abs(nextGauge - enemyAttackGaugePercent) > 0.001 {
                enemyAttackGaugePercent = nextGauge
            }
        }

        let completedLoop = min(stage.maxLoopsPerPhrase, max(0, Int(floor(currentTime / loopDurationSec))))
        triggerLoopEnemyAttackIfNeeded(completedLoop: completedLoop)

        let completedSet = currentAttempt.completedChordIds
        let nextChord = EarTrainingChordVoicingEngine.chordDisplayAt(
            phrase: phrase,
            loopTime: loopTimeSafe,
            bpm: stage.bpm,
            completedChordIds: completedSet
        )
        if nextChord?.id != activeChord?.id {
            activeChord = nextChord
        }

        if scheduleNext {
            scheduleNextChordSync(phrase: phrase, currentTime: currentTime, loopDurationSec: loopDurationSec)
        }
    }

    private func measureNumberAtLoopTime(loopTimeSec: Double, loopDurationSec: Double, loopMeasures: Int) -> Int {
        let safeLoopMeasures = max(1, loopMeasures)
        let measureDurationSec = loopDurationSec / Double(safeLoopMeasures)
        guard measureDurationSec.isFinite, measureDurationSec > 0 else { return 1 }
        return min(safeLoopMeasures, Int(floor(loopTimeSec / measureDurationSec)) + 1)
    }

    private func scheduleNextChordSync(phrase: EarTrainingPhraseDetail, currentTime: Double, loopDurationSec: Double) {
        cancelChordSyncTask()
        guard gameState == .playingPhrase else { return }

        let loopIndex = max(0, Int(floor(currentTime / loopDurationSec)))
        let loopTimeSec = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTimeSec < 0 ? loopTimeSec + loopDurationSec : loopTimeSec

        let nextBoundary = EarTrainingChordVoicingEngine.nextChordDisplayBoundarySec(
            phrase: phrase,
            loopTimeSec: loopTimeSafe,
            bpm: stage.bpm,
            completedChordIds: attempt?.completedChordIds ?? []
        )
        var nextSync = (Double(loopIndex) + 1) * loopDurationSec
        if let boundary = nextBoundary {
            nextSync = Double(loopIndex) * loopDurationSec + boundary
        }
        let audioEnd = phrase.audioDurationSec - Self.audioEndEpsilonSec
        if audioEnd.isFinite, audioEnd > 0 {
            nextSync = min(nextSync, audioEnd)
        }
        if nextSync <= currentTime + Self.audioSyncEpsilonSec {
            nextSync = currentTime + Self.minAudioSyncTimerSec
        }
        let delaySec = max(Self.minAudioSyncTimerSec, nextSync - currentTime - Self.audioSyncEpsilonSec)

        chordSyncTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delaySec * 1_000_000_000))
            guard let self else { return }
            self.syncChordTimeline(scheduleNext: true)
        }
    }

    private func triggerLoopEnemyAttackIfNeeded(completedLoop: Int) {
        guard gameState == .playingPhrase else { return }
        guard completedLoop >= 2,
              completedLoop < stage.maxLoopsPerPhrase,
              completedLoop > lastLoopAttackApplied,
              damageConfig.miss > 0
        else { return }

        lastLoopAttackApplied = completedLoop
        let phraseRunAtAttack = phraseRunId
        let missDamage = damageConfig.miss
        let denom = max(1, Self.attackGaugeTargetLoops)
        enemyAttackGaugePercent = max(0, min(1, Double(completedLoop) / Double(denom)))
        triggerFeedback(.miss)
        let attackEffectId = triggerBattleEffect(kind: .miss, label: "ATTACK", damage: missDamage, phraseNoteCount: nil)
        registerBattleEffectImpact(effectId: attackEffectId) { [weak self] in
            guard let self else { return }
            guard self.phraseRunId == phraseRunAtAttack, self.gameState == .playingPhrase else { return }
            let nextPlayerHp = max(0, self.playerHp - missDamage)
            self.playerHp = nextPlayerHp
            let outcome = EarTrainingEngine.resolveOutcome(
                enemyHp: self.enemyHp,
                playerHp: nextPlayerHp,
                timeRemainingSec: self.timeRemaining,
                phraseCompleted: false,
                phraseFailed: false
            )
            if outcome == .gameOver {
                self.finishGameOver(message: self.copy.gameOver)
            }
        }
    }

    private func handleAudioTimeUpdate(currentTime: Double) {
        syncChordTimeline(scheduleNext: false)
    }

    private func failCurrentPhrase() {
        guard let attempt, gameState == .playingPhrase else { return }
        cancelChordSyncTask()
        gameState = .phraseFail
        lastRank = .fail
        enemyAttackGaugePercent = 1
        pendingImpactHandlers.removeAll()
        triggerFeedback(.miss)
        let failDamage = damageConfig.fail
        let effectId = triggerBattleEffect(kind: .fail, label: "Fail", damage: failDamage, phraseNoteCount: nil)
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            guard let self else { return }
            let nextPlayerHp = max(0, self.playerHp - failDamage)
            self.playerHp = nextPlayerHp
            let outcome = EarTrainingEngine.resolveOutcome(
                enemyHp: self.enemyHp,
                playerHp: nextPlayerHp,
                timeRemainingSec: self.timeRemaining,
                phraseCompleted: false,
                phraseFailed: true
            )
            if outcome == .gameOver {
                self.finishGameOver(message: self.copy.gameOver)
                return
            }
            self.gameState = .phraseFail
            self.statusText = self.copy.failAdvance
            self.cancelTransitionTimer()
            self.transitionTimerTask = Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 900_000_000)
                guard let self else { return }
                let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
                self.startPhrase(at: next)
            }
        }
        _ = attempt
    }

    @MainActor
    private func finishStageClear(rank: EarTrainingRank) async {
        cancelAllTimers()
        gameState = .stageClear
        lastRank = rank
        statusText = copy.stageClear
        audio.stopPhrase()
        triggerFeedback(.clear)
        publishSnapshot()

        guard let lessonContext, !practiceMode, !progressSaveStarted else { return }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        let lessonRank = EarTrainingEngine.lessonRank(from: rank)
        do {
            _ = try await supabase.recordEarTrainingLessonProgress(
                lessonId: lessonContext.lessonId,
                lessonSongId: lessonContext.lessonSongId,
                rank: lessonRank,
                clearConditions: lessonContext.clearConditions
            )
            lessonProgressStatus = .saved
        } catch {
            lessonProgressStatus = .saving
        }
    }

    private func finishGameOver(message: String) {
        cancelAllTimers()
        gameState = .gameOver
        statusText = message
        audio.stopPhrase()
        publishSnapshot()
    }

    private func publishSnapshot() {
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: gameState,
            stageId: stage.id,
            stageTitle: stage.localizedTitle(isEnglishCopy ? .en : .ja),
            phraseIndex: phraseIndex,
            phraseRunId: phraseRunId,
            totalPhrases: phrases.count,
            phraseIntroLine: phraseIntroLine,
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: Self.avatarAssetName(stageId: stage.id, enemyId: enemyId),
            enemyAvatarFlipX: Self.shouldFlipEnemyAvatar(name: Self.avatarAssetName(stageId: stage.id, enemyId: enemyId)),
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
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
            phraseNoteCount: phraseNoteCount
        )
        if lastEmittedEffectId != id {
            lastEmittedEffectId = id
            scene?.runEffect(command)
        }
        let effectTimeoutMs = Self.effectDurationMs(kind: kind, label: label, phraseNoteCount: phraseNoteCount)
        battleEffectClearTask?.cancel()
        battleEffectClearTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(effectTimeoutMs * 1_000_000))
            await MainActor.run {
                self?.pendingImpactHandlers[id] = nil
            }
        }
        return id
    }

    private func registerBattleEffectImpact(effectId: Int, handler: @escaping () -> Void) {
        pendingImpactHandlers[effectId] = handler
    }

    private static func effectDurationMs(
        kind: EarTrainingBattleEffectKind,
        label: String?,
        phraseNoteCount: Int?
    ) -> Double {
        let isAwesome = kind == .complete
            && (label == "Awesome!" || (label == "Perfect" && (phraseNoteCount ?? 0) >= 6))
        return isAwesome ? kAwesomeBattleEffectMs : kBattleEffectMs
    }

    private func triggerFeedback(_ value: EarTrainingBattleController.Feedback) {
        feedback = value
        feedbackTask?.cancel()
        feedbackTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 220_000_000)
            await MainActor.run {
                if self?.feedback == value {
                    self?.feedback = nil
                }
            }
        }
    }

    private func cancelAllTimers() {
        cancelFailTimer()
        cancelTransitionTimer()
        cancelCountdownTimer()
        cancelTimeLimitTimer()
        cancelChordSyncTask()
        feedbackTask?.cancel()
        feedbackTask = nil
        battleEffectClearTask?.cancel()
        battleEffectClearTask = nil
    }

    private func cancelFailTimer() { failTimerTask?.cancel(); failTimerTask = nil }
    private func cancelTransitionTimer() { transitionTimerTask?.cancel(); transitionTimerTask = nil }
    private func cancelCountdownTimer() { countdownTask?.cancel(); countdownTask = nil }
    private func cancelTimeLimitTimer() { timeLimitTask?.cancel(); timeLimitTask = nil }
    private func cancelChordSyncTask() { chordSyncTask?.cancel(); chordSyncTask = nil }

    private func recomputeVoicingHints() {
        let next: [Int: VoicingHintState]
        if practiceMode,
           let chord = activeChord,
           !(attempt?.completedChordIds.contains(chord.id) ?? false) {
            let pressed = attempt?.pressedByChord[chord.id] ?? []
            next = EarTrainingChordVoicingEngine.voicingKeyboardHints(
                voicing: chord.voicing,
                pressedPitchClasses: pressed
            )
        } else {
            next = [:]
        }
        if next != voicingHintsByMidi {
            voicingHintsByMidi = next
        }
    }

    private func playRootNoteIfPossible(rootName: String) {
        guard let pc = EarTrainingChordVoicingEngine.noteNameToPitchClass(rootName) else { return }
        let midi = 36 + pc
        SurvivalGameAudio.shared.playSynthBassRoot(midi: midi)
    }

    static func avatarAssetName(stageId: UUID, enemyId: String) -> String {
        EarTrainingBattleController.avatarAssetName(stageId: stageId, enemyId: enemyId)
    }

    static func shouldFlipEnemyAvatar(name: String) -> Bool {
        EarTrainingBattleController.shouldFlipEnemyAvatar(name: name)
    }
}

extension EarTrainingChordVoicingBattleController: EarTrainingBattleSceneDriving {}
extension EarTrainingChordVoicingBattleController: EarTrainingPianoPlayable {}
extension EarTrainingChordVoicingBattleController: EarTrainingLobbyPresentable {
    var resultState: EarTrainingResultState? {
        switch gameState {
        case .stageClear: return .win
        case .gameOver:
            return statusText == copy.timeOver ? .timeOver : .lose
        default: return nil
        }
    }

    var stageTitleForLobby: String {
        stage.localizedTitle(isEnglishCopy ? .en : .ja)
    }
}
