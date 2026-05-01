import Foundation
import Combine
import QuartzCore

/// SpriteKit シーンへエフェクトを橋渡しするためのプロトコル。
/// `EarTrainingBattleScene` 側で実装する。
@MainActor
protocol EarTrainingBattleSceneHandle: AnyObject {
    /// 現在の描画用スナップショットを更新する。
    func applySnapshot(_ snapshot: EarTrainingBattleSceneSnapshot)
    /// 攻撃 / 完了 / 被弾 / Fail のエフェクトを発火する。
    /// 着弾タイミングで `EarTrainingBattleController.handleEffectImpact(_:)` を呼ぶ実装にする。
    func runEffect(_ command: EarTrainingBattleEffectCommand)
}

/// 耳コピバトル ゲーム画面の状態ハブ。Web 版 `EarTrainingGameScreen.tsx` と同等の状態機械を保持する。
/// SwiftUI からは `@ObservedObject` で購読され、SpriteKit シーンへは `EarTrainingBattleSceneHandle` 経由で橋渡しする。
@MainActor
final class EarTrainingBattleController: ObservableObject {
    // MARK: - Constants (Web `EarTrainingGameScreen.tsx` から)

    private static let inputCooldownMs: Double = 20
    private static let audioEndEpsilonSec: Double = 0.03
    private static let battleEffectDurationMs: Double = 1_600
    private static let attackGaugeTargetLoops: Int = 6
    private static let zeroDamage = EarTrainingDamageConfig.zero

    // MARK: - 公開状態 (SwiftUI 反映用)

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var attempt: EarTrainingPhraseAttempt?
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int
    @Published private(set) var countInValue: Int
    @Published private(set) var activeLoop: Int = 1
    @Published private(set) var activeChord: EarTrainingPhraseChordDetail?
    @Published private(set) var lastRank: EarTrainingRank?
    @Published private(set) var statusText: String
    @Published private(set) var enemyAttackGaugePercent: Double = 0
    @Published private(set) var demoBubbleVisible: Bool = false
    @Published private(set) var feedback: Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false

    enum Feedback: String, Sendable {
        case correct
        case miss
        case clear
    }

    // MARK: - 不変 / コンフィグ

    let stage: EarTrainingStageDetail
    let phrases: [EarTrainingPhraseDetail]
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy
    let enemyId: String
    let enemyName: String

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared
    private weak var scene: EarTrainingBattleSceneHandle?

    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var failTimerTask: Task<Void, Never>?
    private var transitionTimerTask: Task<Void, Never>?
    private var countdownTask: Task<Void, Never>?
    private var timeLimitTask: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private var battleEffectClearTask: Task<Void, Never>?
    private var lastInputAt: TimeInterval = 0
    private var progressSaveStarted: Bool = false
    private var lastEmittedEffectId: Int = -1

    // MARK: - 派生プロパティ

    var resultState: EarTrainingResultState? {
        switch gameState {
        case .stageClear: return .win
        case .gameOver:
            return statusText == copy.timeOver ? .timeOver : .lose
        default: return nil
        }
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
        return Self.formatTime(seconds: timeRemaining)
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
        return "\(hudLabels.rankPrefix) \(rank.rawValue)"
    }

    var lessonProgressText: String? {
        guard lessonContext != nil, gameState == .stageClear else { return nil }
        switch lessonProgressStatus {
        case .saved: return copy.lessonSaved
        case .saving: return copy.lessonSaving
        case nil: return copy.lessonSaving
        }
    }

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
        EarTrainingRankRule(
            perfectMaxMisses: stage.perfectMaxMisses,
            greatMaxMisses: stage.greatMaxMisses
        )
    }

    var currentPhrase: EarTrainingPhraseDetail? {
        guard phraseIndex >= 0 && phraseIndex < phrases.count else { return nil }
        return phrases[phraseIndex]
    }

    var chordChips: [EarTrainingChordChip] {
        guard let chords = currentPhrase?.chords else { return [] }
        return chords.map { chord in
            EarTrainingChordChip(id: chord.id, name: chord.chordName, active: activeChord?.id == chord.id)
        }
    }

    var phraseSlots: [String] {
        guard let notes = currentPhrase?.notes else { return [] }
        return notes.map { EarTrainingEngine.displayNoteName(for: $0) }
    }

    var revealedNotes: [String] { attempt?.revealedNotes ?? [] }
    var currentNoteIndex: Int { attempt?.currentNoteIndex ?? 0 }

    var enemyAvatarName: String {
        Self.avatarAssetName(stageId: stage.id, enemyId: enemyId)
    }

    var enemyAvatarFlipX: Bool {
        Self.shouldFlipEnemyAvatar(name: enemyAvatarName)
    }

    static let playerAvatarAssetName: String = "default-avater"

    // MARK: - Init

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
        self.practiceMode = lessonContext == nil // レッスン経由でなければ練習モードを既定にしない（Web 仕様維持）
        self.practiceMode = false
        self.enemyHp = stage.enemyHp
        self.playerHp = stage.playerHp
        self.timeRemaining = stage.timeLimitSec
        self.countInValue = stage.countInBeats
        self.statusText = ""
        self.statusText = self.copy.idlePrompt
    }

    // MARK: - Lifecycle

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishSnapshot()
    }

    func detachScene() {
        scene = nil
    }

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
        pendingImpactHandlers.removeAll()
        audio.onTimeUpdate = nil
        audio.onEnded = nil
        audio.stop()
    }

    // MARK: - Public actions

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

    /// ロビーで START / RETRY をタップしたとき。
    func startBattle() {
        startCountIn()
    }

    // MARK: - Note input

    /// ピアノ / MIDI 入力。`playAudio = true` で発音、false ならロジックのみ。
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
        guard let phrase = currentPhrase, var current = attempt else { return }

        let result = EarTrainingEngine.handleNoteInput(
            phrase: phrase,
            attempt: current,
            inputMidiNote: midi,
            damage: damageConfig
        )
        current = result.attempt
        attempt = current

        if result.correct {
            statusText = copy.correct(revealedNote: result.revealedNote)
            triggerFeedback(.correct)

            if result.completed {
                // クリア完了 (相手 HP を 0 まで削れる可能性あり)
                gameState = .phraseComplete
                cancelFailTimer()
                let rank = EarTrainingEngine.calculateRank(missedNoteCounts: current.missedNoteCounts, rule: rankRule)
                let completionDamage = EarTrainingEngine.completionDamage(rank: rank, damage: damageConfig)
                let totalCompletionDamage = result.enemyDamage + completionDamage
                let completeEffectId = triggerBattleEffect(
                    kind: .complete,
                    label: rank.rawValue,
                    damage: totalCompletionDamage,
                    phraseNoteCount: phrase.notes?.count ?? 0
                )
                let willStageClear = enemyHp - totalCompletionDamage <= 0
                registerBattleEffectImpact(effectId: completeEffectId) { [weak self] in
                    guard let self else { return }
                    let nextEnemyHp = max(0, self.enemyHp - totalCompletionDamage)
                    self.enemyHp = nextEnemyHp
                    let outcome = EarTrainingEngine.resolveOutcome(
                        enemyHp: nextEnemyHp,
                        playerHp: self.playerHp,
                        timeRemainingSec: self.timeRemaining,
                        phraseCompleted: true,
                        phraseFailed: false
                    )
                    if outcome == .stageClear {
                        Task { await self.finishStageClear(rank: rank) }
                    }
                }
                if !willStageClear {
                    transitionToNextPhrase(rank: rank, phrase: phrase)
                }
                return
            }

            // 1 ノート正解 (まだ最終ノートではない)
            let correctEffectId = triggerBattleEffect(
                kind: .correct,
                label: nil,
                damage: result.enemyDamage,
                phraseNoteCount: phrase.notes?.count ?? 0
            )
            registerBattleEffectImpact(effectId: correctEffectId) { [weak self] in
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
                    let rank = EarTrainingEngine.calculateRank(missedNoteCounts: result.attempt.missedNoteCounts, rule: self.rankRule)
                    Task { await self.finishStageClear(rank: rank) }
                }
            }
            return
        }

        if result.playerDamage > 0 {
            triggerFeedback(.miss)
            statusText = copy.missEnemyAttack
            let missEffectId = triggerBattleEffect(
                kind: .miss,
                label: "MISS",
                damage: result.playerDamage,
                phraseNoteCount: phrase.notes?.count ?? 0
            )
            registerBattleEffectImpact(effectId: missEffectId) { [weak self] in
                guard let self else { return }
                let nextPlayerHp = max(0, self.playerHp - result.playerDamage)
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
            return
        }

        statusText = copy.tryAgain
        triggerFeedback(.miss)
        _ = triggerBattleEffect(kind: .miss, label: "MISS", damage: nil, phraseNoteCount: phrase.notes?.count ?? 0)
    }

    // MARK: - Effect plumbing

    /// SpriteKit シーンが「エフェクトの着弾タイミングに到達した」と通知する経路。
    /// 受け取った id に対応する HP 反映ハンドラを実行する。
    func handleEffectImpact(effectId: Int) {
        guard let handler = pendingImpactHandlers.removeValue(forKey: effectId) else { return }
        handler()
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
        // タイムアウト後、未着弾のハンドラは破棄する (Web 同等の挙動)。
        battleEffectClearTask?.cancel()
        battleEffectClearTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(Self.battleEffectDurationMs * 1_000_000))
            await MainActor.run {
                self?.pendingImpactHandlers[id] = nil
            }
        }
        return id
    }

    private func registerBattleEffectImpact(effectId: Int, handler: @escaping () -> Void) {
        pendingImpactHandlers[effectId] = handler
    }

    // MARK: - Feedback flash

    private func triggerFeedback(_ value: Feedback) {
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

    // MARK: - Lifecycle / state transitions

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
        countInValue = stage.countInBeats
        pendingImpactHandlers.removeAll()
        enemyAttackGaugePercent = 0
        demoBubbleVisible = false
        attempt = nil
        activeChord = nil
        lastRank = nil
        statusText = copy.countIn
        gameState = .countIn

        cancelFailTimer()
        cancelTransitionTimer()
        cancelTimeLimitTimer()
        cancelCountdownTimer()
        audio.stopPhrase()

        // 最初のフレーズを無音プライムする
        if let first = phrases.first, let url = URL(string: first.audioUrl) {
            audio.primePhrase(url: url)
        }

        let beatIntervalMs = max(100.0, (60.0 / Double(stage.bpm)) * 1000)
        let initialBeats = stage.countInBeats
        countdownTask = Task { [weak self] in
            var remaining = initialBeats
            while remaining > 0 {
                try? await Task.sleep(nanoseconds: UInt64(beatIntervalMs * 1_000_000))
                if Task.isCancelled { return }
                remaining -= 1
                await MainActor.run {
                    self?.countInValue = max(0, remaining)
                }
            }
            await MainActor.run {
                guard let self else { return }
                self.startTimeLimit()
                self.startPhrase(at: 0)
            }
        }
        publishSnapshot()
    }

    private func startTimeLimit() {
        cancelTimeLimitTimer()
        if practiceMode { return }
        timeLimitTask = Task { [weak self] in
            while true {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                let shouldEnd: Bool = await MainActor.run {
                    guard let self else { return true }
                    let next = max(0, self.timeRemaining - 1)
                    self.timeRemaining = next
                    if next <= 0 {
                        self.finishGameOver(message: self.copy.timeOver)
                        return true
                    }
                    return false
                }
                if shouldEnd { return }
            }
        }
    }

    private func startPhrase(at index: Int) {
        guard index >= 0 && index < phrases.count else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        cancelFailTimer()
        cancelTransitionTimer()

        let phrase = phrases[index]
        phraseIndex = index
        attempt = EarTrainingEngine.createPhraseAttempt(phrase)
        lastRank = nil
        activeLoop = 1
        enemyAttackGaugePercent = 0
        demoBubbleVisible = shouldShowDemoBubble(phrase: phrase, loopNumber: 1, loopTimeSec: 0)
        activeChord = activeChordAt(phrase: phrase, timeSec: 0)
        statusText = copy.phraseLabel(indexOneBased: index + 1)
        gameState = .playingPhrase

        if let url = URL(string: phrase.audioUrl) {
            audio.playPhrase(url: url)
        }
        publishSnapshot()
    }

    private func failCurrentPhrase() {
        guard let current = attempt, !current.completed, gameState == .playingPhrase else { return }
        var failed = current
        failed.failed = true
        attempt = failed
        gameState = .phraseFail
        lastRank = .fail
        enemyAttackGaugePercent = 1
        triggerFeedback(.miss)

        let failDamage = damageConfig.fail
        let effectId = triggerBattleEffect(kind: .fail, label: "Fail", damage: failDamage, phraseNoteCount: currentPhrase?.notes?.count ?? 0)
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
            self.transitionTimerTask = Task { [weak self] in
                try? await Task.sleep(nanoseconds: 900_000_000)
                if Task.isCancelled { return }
                await MainActor.run {
                    guard let self else { return }
                    let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
                    self.startPhrase(at: next)
                }
            }
        }
    }

    private func transitionToNextPhrase(rank: EarTrainingRank, phrase: EarTrainingPhraseDetail) {
        let delaySec = EarTrainingEngine.nextMeasureDelaySec(
            currentAudioTimeSec: audio.currentTimeSec,
            loopDurationSec: phrase.loopDurationSec,
            loopMeasures: stage.loopMeasures
        )
        gameState = .phraseComplete
        lastRank = rank
        statusText = copy.transitionNextBar(rank: rank.rawValue)

        transitionTimerTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delaySec * 1_000_000_000))
            if Task.isCancelled { return }
            await MainActor.run {
                guard let self else { return }
                self.audio.stopPhrase()
                self.gameState = .transitionToNextPhrase
                self.transitionTimerTask = Task { [weak self] in
                    try? await Task.sleep(nanoseconds: 420_000_000)
                    if Task.isCancelled { return }
                    await MainActor.run {
                        guard let self else { return }
                        let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
                        self.startPhrase(at: next)
                    }
                }
            }
        }
    }

    private func finishStageClear(rank: EarTrainingRank) async {
        pendingImpactHandlers.removeAll()
        cancelFailTimer()
        cancelTransitionTimer()
        cancelTimeLimitTimer()
        gameState = .stageClear
        audio.stopPhrase()
        lastRank = rank
        statusText = copy.stageClear
        triggerFeedback(.clear)
        publishSnapshot()

        guard !practiceMode, let lessonContext, !progressSaveStarted else { return }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        let lessonRankString = EarTrainingEngine.lessonRank(from: rank)
        do {
            _ = try await supabase.recordEarTrainingLessonProgress(
                lessonId: lessonContext.lessonId,
                lessonSongId: lessonContext.lessonSongId,
                rank: lessonRankString,
                clearConditions: lessonContext.clearConditions
            )
            lessonProgressStatus = .saved
        } catch {
            // 失敗してもユーザー体験を阻害しないため saving のまま据え置く。
            lessonProgressStatus = .saving
        }
    }

    private func finishGameOver(message: String) {
        pendingImpactHandlers.removeAll()
        cancelFailTimer()
        cancelTransitionTimer()
        cancelTimeLimitTimer()
        gameState = .gameOver
        audio.stopPhrase()
        statusText = message
        publishSnapshot()
    }

    // MARK: - Audio time observer

    private func handleAudioTimeUpdate(currentTime: Double) {
        guard let phrase = currentPhrase else { return }
        let loopDurationSec = phrase.loopDurationSec
        guard loopDurationSec > 0 else { return }

        let loop = Int(floor(currentTime / loopDurationSec)) + 1
        let clampedLoop = max(1, min(stage.maxLoopsPerPhrase, loop))
        if activeLoop != clampedLoop { activeLoop = clampedLoop }

        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let chord = activeChordAt(phrase: phrase, timeSec: loopTime)
        if chord?.id != activeChord?.id { activeChord = chord }

        let demoVisible = shouldShowDemoBubble(phrase: phrase, loopNumber: clampedLoop, loopTimeSec: loopTime)
        if demoVisible != demoBubbleVisible {
            demoBubbleVisible = demoVisible
            publishSnapshot()
        }

        let gaugeDuration = loopDurationSec * Double(Self.attackGaugeTargetLoops)
        if gaugeDuration > 0 {
            let next = max(0, min(1, currentTime / gaugeDuration))
            if abs(next - enemyAttackGaugePercent) > 0.001 { enemyAttackGaugePercent = next }
        }

        let audioDurationSec = phrase.audioDurationSec
        if audioDurationSec.isFinite, currentTime >= audioDurationSec - Self.audioEndEpsilonSec {
            failCurrentPhrase()
        }
    }

    // MARK: - Chord / demo helpers

    private func activeChordAt(phrase: EarTrainingPhraseDetail, timeSec: Double) -> EarTrainingPhraseChordDetail? {
        guard let chords = phrase.chords, !chords.isEmpty else { return nil }
        if let explicit = chords.first(where: { chord in
            guard let start = chord.startTimeSec else { return false }
            let end = chord.endTimeSec ?? .infinity
            return timeSec >= start && timeSec < end
        }) {
            return explicit
        }
        return chords.first
    }

    private func shouldShowDemoBubble(phrase: EarTrainingPhraseDetail, loopNumber: Int, loopTimeSec: Double) -> Bool {
        let isDemoLoop = phrase.demoLoops?.contains(where: { $0.loopNumber == loopNumber }) ?? false
        guard isDemoLoop else { return false }
        guard let window = phraseDemoWindow(phrase: phrase) else { return true }
        return loopTimeSec >= window.startSec && loopTimeSec <= window.endSec
    }

    private func phraseDemoWindow(phrase: EarTrainingPhraseDetail) -> (startSec: Double, endSec: Double)? {
        let times = (phrase.notes ?? []).compactMap { phraseNoteTimeSec($0) }
        guard !times.isEmpty else { return nil }
        let startSec = times.min() ?? 0
        let lastNoteStartSec = times.max() ?? startSec
        let beatDurationSec = 60.0 / Double(stage.bpm)
        let fallbackEndSec = lastNoteStartSec + beatDurationSec
        let endSec = phrase.loopDurationSec.isFinite
            ? min(phrase.loopDurationSec, fallbackEndSec)
            : fallbackEndSec
        return (startSec, max(startSec, endSec))
    }

    private func phraseNoteTimeSec(_ note: EarTrainingPhraseNoteDetail) -> Double? {
        guard let measure = note.measureNumber, let beatOffset = note.beatOffset else { return nil }
        let beatDurationSec = 60.0 / Double(stage.bpm)
        let measureIndex = max(0, measure - 1)
        let offset = max(0, beatOffset)
        return (Double(measureIndex * stage.beatsPerMeasure) + offset) * beatDurationSec
    }

    // MARK: - Snapshot publishing

    private func publishSnapshot() {
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: gameState,
            stageId: stage.id,
            stageTitle: stage.localizedTitle(isEnglishCopy ? .en : .ja),
            phraseIndex: phraseIndex,
            totalPhrases: phrases.count,
            phraseIntroLine: phraseIntroLine,
            demoLoopActive: demoBubbleVisible && gameState == .playingPhrase,
            playerAvatarName: Self.playerAvatarAssetName,
            enemyAvatarName: enemyAvatarName,
            enemyAvatarFlipX: enemyAvatarFlipX,
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
    }

    // MARK: - Timer helpers

    private func cancelAllTimers() {
        cancelFailTimer()
        cancelTransitionTimer()
        cancelCountdownTimer()
        cancelTimeLimitTimer()
        feedbackTask?.cancel(); feedbackTask = nil
        battleEffectClearTask?.cancel(); battleEffectClearTask = nil
    }

    private func cancelFailTimer() {
        failTimerTask?.cancel(); failTimerTask = nil
    }

    private func cancelTransitionTimer() {
        transitionTimerTask?.cancel(); transitionTimerTask = nil
    }

    private func cancelCountdownTimer() {
        countdownTask?.cancel(); countdownTask = nil
    }

    private func cancelTimeLimitTimer() {
        timeLimitTask?.cancel(); timeLimitTask = nil
    }

    // MARK: - Static helpers

    private static func formatTime(seconds: Int) -> String {
        let safe = max(0, seconds)
        let minutes = safe / 60
        let rest = safe % 60
        return String(format: "%d:%02d", minutes, rest)
    }

    /// Web `EAR_TRAINING_ENEMY_AVATAR_URLS` (10 件) に対応する Asset 名を hash で決める。
    static func avatarAssetName(stageId: UUID, enemyId: String) -> String {
        let source = "\(stageId.uuidString):\(enemyId)"
        var hash: Int32 = 0
        for codeUnit in source.unicodeScalars {
            hash = (hash &<< 5) &- hash &+ Int32(codeUnit.value & 0x7FFFFFFF)
        }
        let abs = Int(hash.magnitude)
        let index = abs % EarTrainingAvatarCatalog.enemyAssetNames.count
        return EarTrainingAvatarCatalog.enemyAssetNames[index]
    }

    static func shouldFlipEnemyAvatar(name: String) -> Bool {
        EarTrainingAvatarCatalog.flipXAssetNames.contains(name)
    }
}

// MARK: - Avatar catalog (Web `EAR_TRAINING_ENEMY_AVATAR_URLS` 相当)

enum EarTrainingAvatarCatalog {
    static let enemyAssetNames: [String] = (1...10).map { "ear-training-enemy-\($0)" }
    static let flipXAssetNames: Set<String> = [
        "ear-training-enemy-1",
        "ear-training-enemy-2",
        "ear-training-enemy-4",
        "ear-training-enemy-7",
        "ear-training-enemy-8",
        "ear-training-enemy-9",
    ]
}

// MARK: - Localized copy (Web `getEarTrainingGameCopy` 相当)

struct EarTrainingGameCopy {
    let idlePrompt: String
    let stageClear: String
    let gameOver: String
    let timeOver: String
    let failAdvance: String
    let noPhrases: String
    let audioFailed: String
    let countIn: String
    let missEnemyAttack: String
    let tryAgain: String
    let lessonSaved: String
    let lessonSaving: String
    private let _transitionNextBar: (String) -> String
    private let _correct: (String?) -> String
    private let _phraseLabel: (Int) -> String

    func transitionNextBar(rank: String) -> String { _transitionNextBar(rank) }
    func correct(revealedNote: String?) -> String { _correct(revealedNote) }
    func phraseLabel(indexOneBased: Int) -> String { _phraseLabel(indexOneBased) }

    static func make(isEnglish: Bool) -> EarTrainingGameCopy {
        if isEnglish {
            return EarTrainingGameCopy(
                idlePrompt: "Press START when you are ready.",
                stageClear: "Stage clear!",
                gameOver: "Game over",
                timeOver: "Time over",
                failAdvance: "Fail — moving to the next phrase",
                noPhrases: "No phrases are registered for this stage.",
                audioFailed: "Could not play audio. Please try starting again.",
                countIn: "Count-in",
                missEnemyAttack: "Miss — enemy attack",
                tryAgain: "Try again",
                lessonSaved: "Lesson progress saved",
                lessonSaving: "Saving lesson progress…",
                _transitionNextBar: { rank in "\(rank) — next phrase at the next bar line" },
                _correct: { note in note.map { "Correct: \($0)" } ?? "Correct" },
                _phraseLabel: { index in "Phrase \(index)" }
            )
        }
        return EarTrainingGameCopy(
            idlePrompt: "準備ができたら開始してください",
            stageClear: "ステージクリア！",
            gameOver: "ゲームオーバー",
            timeOver: "タイムオーバー",
            failAdvance: "Fail: 次のフレーズへ進みます",
            noPhrases: "フレーズが登録されていません",
            audioFailed: "音源を再生できませんでした。もう一度開始してください。",
            countIn: "カウントイン",
            missEnemyAttack: "ミス: 敵の攻撃",
            tryAgain: "もう一度",
            lessonSaved: "レッスン進捗を保存しました",
            lessonSaving: "レッスン進捗を保存中…",
            _transitionNextBar: { rank in "\(rank): 次の小節頭で次へ" },
            _correct: { note in note.map { "正解: \($0)" } ?? "正解" },
            _phraseLabel: { index in "フレーズ \(index)" }
        )
    }
}
