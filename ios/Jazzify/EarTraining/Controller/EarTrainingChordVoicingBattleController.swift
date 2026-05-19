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
    /// Web `MEASURE_SHIFT_DELAY_MS`：セルフペース時のみ、譜面の現在小節表示更新を遅らせる。
    private static let measureShiftDelayNs: UInt64 = 100_000_000

    private static let chordVoicingSelfPacedDrumLoopURL =
        URL(string: "https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3")!

    /// カウントイン中に組み立て、終了直後は適用＋再生だけに寄せる。
    private struct PreparedPhraseStart {
        let phraseIndex: Int
        let phrase: EarTrainingPhraseDetail
        let attempt: EarTrainingChordVoicingAttempt
        let initialChord: EarTrainingPhraseChordDetail?
        let activeMeasureNumber: Int
        let url: URL
    }

    @Published private(set) var gameState: EarTrainingGameState = .idle {
        didSet {
            if oldValue != gameState {
                updatePlayerQuoteBubble()
            }
        }
    }
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var phraseRunId: Int = 0
    private var phraseIntroSeq: Int = 0
    @Published private(set) var attempt: EarTrainingChordVoicingAttempt? {
        didSet {
            recomputeVoicingHints()
            if Self.didCompletedChordIdsChange(oldValue, attempt) {
                updatePlayerQuoteBubble()
            }
        }
    }

    /// `attempt` の更新で `completedChordIds` の集合が変わったかを判定する純関数。
    /// 同じインスタンス内 mutate ではなく struct 値型の置き換え前提のため等価比較で十分。
    private static func didCompletedChordIdsChange(
        _ previous: EarTrainingChordVoicingAttempt?,
        _ next: EarTrainingChordVoicingAttempt?
    ) -> Bool {
        previous?.completedChordIds != next?.completedChordIds
    }
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int
    @Published private(set) var countInValue: Int
    @Published private(set) var activeChord: EarTrainingPhraseChordDetail? {
        didSet {
            recomputeVoicingHints()
            if oldValue?.id != activeChord?.id {
                updatePlayerQuoteBubble()
            }
        }
    }
    @Published private(set) var countInEarlyInputActive = false {
        didSet {
            if oldValue != countInEarlyInputActive {
                recomputeVoicingHints()
                updatePlayerQuoteBubble()
            }
        }
    }
    @Published private(set) var lastRank: EarTrainingRank?
    @Published private(set) var statusText: String
    @Published private(set) var activeLoop: Int = 1
    @Published private(set) var activeMeasureNumber: Int = 1
    /// セルフペース時、譜面の 2 小節オーバーレイ用（`activeMeasureNumber` より遅れて更新）。
    @Published private(set) var displayedActiveMeasureNumber: Int = 1
    @Published private(set) var enemyAttackGaugePercent: Double = 0
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool {
        didSet { recomputeVoicingHints() }
    }
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    /// 完成エフェクトのワンショット指示。コード名 → 自キャラのエネルギー演出と五線譜側の発光に利用。
    @Published private(set) var completionPulse: ChordVoicingCompletionPulse?
    /// 五線譜オーバーレイから受け取るアクティブコード名ラベルの Global 座標フレーム。
    var activeChordLabelGlobalFrame: CGRect?
    /// SpriteKit シーンの Global 座標フレーム。SwiftUI 座標 → シーン座標変換に利用。
    var battleSceneGlobalFrame: CGRect?
    private var completionPulseEventKey: Int = 0
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
    /// self-paced でドラム BGM が既に開始済みか（フレーズ遷移で二重開始しない）。
    private var selfPacedDrumLoopPlaybackStarted = false
    private var measureShiftQueue: [Int] = []
    private var measureShiftConsumerTask: Task<Void, Never>?

    /// チュートリアル時は敵攻撃・ミス/Fail ダメージを無効化する。
    var tutorialNoCombat: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    private var tutorialSuccessfulLoopCount: Int = 0

    var damageConfig: EarTrainingDamageConfig {
        if practiceMode || tutorialNoCombat { return Self.zeroDamage }
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
        if gameState == .countIn, countInValue > 0 {
            return countInDisplay
        }
        return statusText
    }

    private var sanitizedCountInBeats: Int {
        max(0, min(32, stage.countInBeats))
    }

    var resultRankLine: String? {
        nil
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
            let activeChordMatches = activeChord.map { row.voicingIds.contains($0.id) } ?? false
            let showTargets = gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive)
            let active = showTargets && activeChordMatches
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
            hideTimeLabel: false,
            enemyAttackGaugePercent: enemyAttackGaugePercent,
            hideEnemyAttackGauge: false,
            hideChordChips: false,
            hideSlotsRow: false,
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
        audio.stopDrumLoop()
        audio.stopPhrase()
        onExitCallback()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
    }

    func applyPracticeModeAndRestart(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        startBattle()
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

        let allowEarlyCountIn = gameState == .countIn && countInEarlyInputActive
        guard gameState == .playingPhrase || allowEarlyCountIn else { return }

        if gameState == .playingPhrase {
            syncChordTimeline(scheduleNext: false)
            guard gameState == .playingPhrase else { return }
        }

        guard let phrase = currentPhrase, let current = attempt else { return }
        let loopDurationSec = phrase.loopDurationSec
        guard loopDurationSec > 0 else { return }

        let loopTimeSafe: Double
        if allowEarlyCountIn {
            loopTimeSafe = 0
        } else {
            let currentTime = audio.phraseJudgmentTimelineSecNow()
            let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
            loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime
        }
        let targets: EarTrainingChordVoicingEngine.JudgmentTargets
        if stage.resolvedChordVoicingSelfPaced {
            let primary = EarTrainingChordVoicingEngine.firstIncompleteVoicingChord(
                phrase: phrase,
                completedChordIds: current.completedChordIds
            )
            targets = EarTrainingChordVoicingEngine.JudgmentTargets(primary: primary, overlap: nil)
        } else {
            targets = EarTrainingChordVoicingEngine.judgmentTargetsAt(
                phrase: phrase,
                loopTime: loopTimeSafe,
                bpm: stage.bpm,
                completedChordIds: current.completedChordIds,
                displayChord: activeChord,
                loopDurationSec: loopDurationSec
            )
        }
        guard let chord = EarTrainingChordVoicingEngine.selectJudgmentChord(
            attempt: current,
            primaryChord: targets.primary,
            overlapChord: targets.overlap,
            midiNote: midi
        ) else { return }

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
            triggerCompletionPulse(groupId: chord.id, kind: .voicingPartial)
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


        statusText = copy.chordCompleted(chordName: chord.chordName)
        triggerCompletionPulse(groupId: chord.id, kind: .harmonyComplete)

        // フレーズ最後のコード完了時は Skill (.complete) 演出のみで完結させる。
        // ここで .correct を発火すると火の玉と Skill 演出が二重に走り、Skill 演出が埋もれてしまう。
        // この回の `result.enemyDamage` は意図的に drop し、completionDamage のみ HP に反映する。
        if EarTrainingChordVoicingEngine.isAllChordsCompleted(phrase: phrase, attempt: acknowledged) {
            handleAllChordsCompleted(phrase: phrase, attempt: acknowledged)
            return
        }

        let correctOrigin = chordLabelOriginInScene()
        let effectId = triggerBattleEffect(
            kind: .correct,
            label: nil,
            damage: result.enemyDamage,
            phraseNoteCount: nil,
            originPoint: correctOrigin
        )
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
        syncChordTimeline(scheduleNext: true)
    }

    private func handleAllChordsCompleted(
        phrase: EarTrainingPhraseDetail,
        attempt: EarTrainingChordVoicingAttempt
    ) {
        if let hooks = tutorialHooks {
            tutorialSuccessfulLoopCount += 1
            hooks.onLoopSuccess?()
            if tutorialSuccessfulLoopCount >= hooks.requiredSuccessfulLoops {
                hooks.onSceneComplete()
                return
            }
            allChordsCompletedFlag = false
            Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 600_000_000)
                guard let self else { return }
                self.startPhrase(at: self.phraseIndex)
            }
            return
        }
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
        if let activeId = activeChord?.id {
            triggerCompletionPulse(groupId: activeId, kind: .harmonyComplete)
        }
        let completeOrigin = chordLabelOriginInScene()
        let effectId = triggerBattleEffect(
            kind: .complete,
            label: completionDisplayRank(rank: rank, phrase: phrase),
            damage: completionDamage,
            phraseNoteCount: totalVoicingNotes,
            originPoint: completeOrigin
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

    private func makePreparedPhraseStart(at index: Int) -> PreparedPhraseStart? {
        guard phrases.indices.contains(index) else { return nil }
        let phrase = phrases[index]
        guard let url = URL(string: phrase.audioUrl) else { return nil }
        let nextAttempt = EarTrainingChordVoicingEngine.createAttempt(for: phrase)
        let initialChord: EarTrainingPhraseChordDetail?
        if stage.resolvedChordVoicingSelfPaced {
            initialChord = EarTrainingChordVoicingEngine.firstIncompleteVoicingChord(
                phrase: phrase,
                completedChordIds: nextAttempt.completedChordIds
            )
        } else {
            initialChord = EarTrainingChordVoicingEngine.chordDisplayAt(
                phrase: phrase,
                loopTime: 0,
                bpm: stage.bpm,
                completedChordIds: nextAttempt.completedChordIds,
                loopDurationSec: phrase.loopDurationSec
            )
        }
        let ld = phrase.loopDurationSec
        let measureNum: Int
        if stage.resolvedChordVoicingSelfPaced {
            if let chord = initialChord {
                measureNum = chordMeasureNumber(chord: chord, loopDurationSec: max(ld, 0.000_001))
            } else {
                measureNum = 1
            }
        } else if ld > 0 {
            if let chord = initialChord {
                measureNum = chordMeasureNumber(chord: chord, loopDurationSec: ld)
            } else {
                measureNum = measureNumberAtLoopTime(
                    loopTimeSec: 0,
                    loopDurationSec: ld,
                    loopMeasures: stage.loopMeasures
                )
            }
        } else {
            measureNum = 1
        }
        return PreparedPhraseStart(
            phraseIndex: index,
            phrase: phrase,
            attempt: nextAttempt,
            initialChord: initialChord,
            activeMeasureNumber: measureNum,
            url: url
        )
    }

    private func scheduleTransitionToNextPhrase(
        rank: EarTrainingRank,
        phrase: EarTrainingPhraseDetail
    ) {
        cancelTransitionTimer()
        if stage.resolvedChordVoicingSelfPaced {
            audio.stopPhrase()
            let next = (phraseIndex + 1) % max(1, phrases.count)
            startPhrase(at: next, playsCountIn: false)
            return
        }
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
            let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
            self.startPhrase(at: next, playsCountIn: true)
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
        phraseIntroSeq = 0
        countInValue = sanitizedCountInBeats
        lastLoopAttackApplied = 0
        pendingImpactHandlers.removeAll()
        enemyAttackGaugePercent = 0
        activeLoop = 1
        activeMeasureNumber = 1
        displayedActiveMeasureNumber = 1
        completionPulse = nil
        cancelAllTimers()
        selfPacedDrumLoopPlaybackStarted = false
        audio.stopDrumLoop()
        audio.stopPhrase()

        if stage.resolvedChordVoicingSelfPaced {
            countInValue = 0
            countInEarlyInputActive = false
            gameState = .playingPhrase
            statusText = copy.phraseLabel(indexOneBased: 1)
            countdownTask = Task { @MainActor [weak self] in
                guard let self else { return }
                guard let prepared = self.makePreparedPhraseStart(at: 0) else {
                    self.finishGameOver(message: self.copy.audioFailed)
                    return
                }
                async let phraseReady = self.audio.preparePhraseForImmediatePlayback(url: prepared.url)
                async let drumReady = self.audio.prepareDrumLoop(url: Self.chordVoicingSelfPacedDrumLoopURL)
                _ = await phraseReady
                _ = await drumReady
                if Task.isCancelled { return }
                self.beginPhrasePlayback(
                    prepared: prepared,
                    startsTimeLimit: true,
                    scheduledCountIn: false,
                    phraseMuted: true
                )
            }
            publishSnapshot()
            return
        }

        gameState = .countIn
        statusText = copy.countIn
        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            guard let prepared = self.makePreparedPhraseStart(at: 0) else {
                self.finishGameOver(message: self.copy.audioFailed)
                return
            }
            _ = await self.audio.preparePhraseForImmediatePlayback(url: prepared.url)
            if Task.isCancelled { return }
            self.beginPhrasePlayback(prepared: prepared, startsTimeLimit: true, scheduledCountIn: true)
        }
        publishSnapshot()
    }

    /// カウントイン表示をオーディオと同じリードイン＋拍間で進める（クリック音は `EarTrainingAudio` がスケジュール）。
    private func runCountInDisplayOnly(scheduleStart: TimeInterval, meta: EarTrainingScheduledCountInPhrase) async {
        let beats = meta.countInBeats
        guard beats > 0 else {
            countInValue = 0
            publishSnapshot()
            return
        }
        let beatDurationSec = meta.beatDurationSec
        let leadInSec = meta.leadInSec
        countInValue = beats
        publishSnapshot()
        for beatIndex in 0..<beats {
            let targetClick = scheduleStart + leadInSec + Double(beatIndex) * beatDurationSec
            let sleepSec = targetClick - CACurrentMediaTime()
            if sleepSec > 0 {
                try? await Task.sleep(nanoseconds: UInt64(sleepSec * 1_000_000_000))
            }
            if Task.isCancelled { return }
            countInValue = max(beats - beatIndex - 1, 0)
            publishSnapshot()
        }
        let measureEnd = scheduleStart + leadInSec + Double(beats) * beatDurationSec
        let tailSec = measureEnd - CACurrentMediaTime()
        if tailSec > 0 {
            try? await Task.sleep(nanoseconds: UInt64(tailSec * 1_000_000_000))
        }
    }

    private func startPhrase(at nextIndex: Int, playsCountIn: Bool = true) {
        guard phrases.indices.contains(nextIndex) else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        cancelFailTimer()
        cancelTransitionTimer()
        cancelChordSyncTask()
        cancelCountdownTimer()
        if playsCountIn && !stage.resolvedChordVoicingSelfPaced {
            countdownTask = Task { @MainActor [weak self] in
                guard let self else { return }
                self.gameState = .countIn
                self.statusText = self.copy.countIn
                self.publishSnapshot()

                guard let prepared = self.makePreparedPhraseStart(at: nextIndex) else {
                    self.finishGameOver(message: self.copy.audioFailed)
                    return
                }
                _ = await self.audio.preparePhraseForImmediatePlayback(url: prepared.url)
                if Task.isCancelled { return }
                self.beginPhrasePlayback(
                    prepared: prepared,
                    startsTimeLimit: false,
                    scheduledCountIn: true,
                    phraseMuted: false
                )
            }
            publishSnapshot()
            return
        }
        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            guard let prepared = self.makePreparedPhraseStart(at: nextIndex) else {
                self.finishGameOver(message: self.copy.audioFailed)
                return
            }
            _ = await self.audio.preparePhraseForImmediatePlayback(url: prepared.url)
            if Task.isCancelled { return }
            self.beginPhrasePlayback(
                prepared: prepared,
                startsTimeLimit: false,
                scheduledCountIn: false,
                phraseMuted: self.stage.resolvedChordVoicingSelfPaced
            )
        }
    }

    private func beginPhrasePlayback(
        prepared: PreparedPhraseStart,
        startsTimeLimit: Bool,
        scheduledCountIn: Bool,
        phraseMuted: Bool = false
    ) {
        cancelFailTimer()
        cancelTransitionTimer()
        cancelChordSyncTask()
        completionPulse = nil
        countInEarlyInputActive = false
        phraseIndex = prepared.phraseIndex
        phraseRunId += 1
        phraseIntroSeq += 1
        let runId = phraseRunId
        lastLoopAttackApplied = 0
        enemyAttackGaugePercent = 0
        activeLoop = 1
        attempt = prepared.attempt
        lastRank = nil
        allChordsCompletedFlag = false
        activeChord = prepared.initialChord
        clearMeasureDisplayShiftQueue()
        activeMeasureNumber = prepared.activeMeasureNumber
        displayedActiveMeasureNumber = prepared.activeMeasureNumber
        statusText = copy.phraseLabel(indexOneBased: prepared.phraseIndex + 1)

        let onStarted: () -> Void = { [weak self] in
            guard let self else { return }
            guard self.phraseRunId == runId else { return }

            self.countInEarlyInputActive = false
            self.gameState = .playingPhrase
            if startsTimeLimit {
                self.startTimeLimit()
            }
            if self.stage.resolvedChordVoicingSelfPaced, !self.selfPacedDrumLoopPlaybackStarted {
                self.selfPacedDrumLoopPlaybackStarted = true
                self.audio.startDrumLoop()
            }
            self.syncChordTimeline(scheduleNext: true)
        }

        if scheduledCountIn {
            let scheduleStart = CACurrentMediaTime()
            if let meta = audio.schedulePreparedPhraseWithCountIn(
                url: prepared.url,
                countInBeats: sanitizedCountInBeats,
                bpm: stage.bpm,
                onInputWindowStarted: { [weak self] in
                    guard let self else { return }
                    guard self.phraseRunId == runId else { return }
                    guard self.gameState == .countIn else { return }
                    self.countInEarlyInputActive = true
                },
                onPhraseStarted: onStarted
            ) {
                Task { @MainActor [weak self] in
                    await self?.runCountInDisplayOnly(scheduleStart: scheduleStart, meta: meta)
                }
            } else {
                if !audio.playPreparedPhrase(url: prepared.url, phraseMuted: phraseMuted, onStarted: onStarted) {
                    audio.playPhrase(url: prepared.url, onStarted: onStarted)
                }
            }
        } else {
            if !audio.playPreparedPhrase(url: prepared.url, phraseMuted: phraseMuted, onStarted: onStarted) {
                audio.playPhrase(url: prepared.url, onStarted: onStarted)
            }
        }

        publishSnapshot()
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
        if clampedLoop > activeLoop {
            completionPulse = nil
        }
        if activeLoop != clampedLoop {
            activeLoop = clampedLoop
        }

        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTime < 0 ? loopTime + loopDurationSec : loopTime

        let completedSet = currentAttempt.completedChordIds
        let nextChord: EarTrainingPhraseChordDetail?
        if stage.resolvedChordVoicingSelfPaced {
            nextChord = EarTrainingChordVoicingEngine.firstIncompleteVoicingChord(
                phrase: phrase,
                completedChordIds: completedSet
            )
        } else {
            nextChord = EarTrainingChordVoicingEngine.chordDisplayAt(
                phrase: phrase,
                loopTime: loopTimeSafe,
                bpm: stage.bpm,
                completedChordIds: completedSet,
                loopDurationSec: loopDurationSec
            )
        }
        let measureNum: Int
        if let chord = nextChord {
            measureNum = chordMeasureNumber(chord: chord, loopDurationSec: loopDurationSec)
        } else {
            measureNum = measureNumberAtLoopTime(
                loopTimeSec: loopTimeSafe,
                loopDurationSec: loopDurationSec,
                loopMeasures: stage.loopMeasures
            )
        }
        if activeMeasureNumber != measureNum {
            activeMeasureNumber = measureNum
            if stage.resolvedChordVoicingSelfPaced {
                enqueueMeasureDisplayShift(measureNum)
            } else {
                clearMeasureDisplayShiftQueue()
                displayedActiveMeasureNumber = measureNum
            }
        }

        if !tutorialNoCombat {
            let gaugeDuration = loopDurationSec * Double(Self.attackGaugeTargetLoops)
            if gaugeDuration > 0 {
                let nextGauge = max(0, min(1, currentTime / gaugeDuration))
                if abs(nextGauge - enemyAttackGaugePercent) > 0.001 {
                    enemyAttackGaugePercent = nextGauge
                }
            }
        }

        let completedLoop = min(stage.maxLoopsPerPhrase, max(0, Int(floor(currentTime / loopDurationSec))))
        triggerLoopEnemyAttackIfNeeded(completedLoop: completedLoop)

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

    private func normalizedMeasureNumber(_ measureNumber: Int, loopMeasures: Int) -> Int {
        let safeLoopMeasures = max(1, loopMeasures)
        let base = max(1, measureNumber)
        return ((base - 1) % safeLoopMeasures) + 1
    }

    private func chordMeasureNumber(chord: EarTrainingPhraseChordDetail, loopDurationSec: Double) -> Int {
        if let explicit = chord.measureNumber {
            return normalizedMeasureNumber(explicit, loopMeasures: stage.loopMeasures)
        }
        if let start = chord.startTimeSec, start.isFinite {
            return measureNumberAtLoopTime(
                loopTimeSec: start,
                loopDurationSec: loopDurationSec,
                loopMeasures: stage.loopMeasures
            )
        }
        return 1
    }

    private func scheduleNextChordSync(phrase: EarTrainingPhraseDetail, currentTime: Double, loopDurationSec: Double) {
        cancelChordSyncTask()
        guard gameState == .playingPhrase else { return }

        if stage.resolvedChordVoicingSelfPaced {
            chordSyncTask = Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 200_000_000)
                guard let self else { return }
                self.syncChordTimeline(scheduleNext: true)
            }
            return
        }

        let loopIndex = max(0, Int(floor(currentTime / loopDurationSec)))
        let loopTimeSec = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let loopTimeSafe = loopTimeSec < 0 ? loopTimeSec + loopDurationSec : loopTimeSec

        let nextBoundary = EarTrainingChordVoicingEngine.nextChordDisplayBoundarySec(
            phrase: phrase,
            loopTimeSec: loopTimeSafe,
            bpm: stage.bpm,
            completedChordIds: attempt?.completedChordIds ?? [],
            loopDurationSec: loopDurationSec
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
        guard !tutorialNoCombat else { return }
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
        if tutorialNoCombat {
            statusText = copy.failAdvance
            cancelTransitionTimer()
            transitionTimerTask = Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 900_000_000)
                guard let self else { return }
                let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
                self.startPhrase(at: next)
            }
            _ = attempt
            return
        }
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
        audio.stopDrumLoop()
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
        audio.stopDrumLoop()
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
            phraseIntroSeq: phraseIntroSeq,
            phraseIntroEmphasis: false,
            totalPhrases: phrases.count,
            phraseIntroLine: phraseIntroLine,
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: Self.avatarAssetName(stageId: stage.id, enemyId: enemyId),
            enemyAvatarFlipX: Self.shouldFlipEnemyAvatar(name: Self.avatarAssetName(stageId: stage.id, enemyId: enemyId)),
            fixedCharacterPositions: false,
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
        updatePlayerQuoteBubble()
    }

    /// `activeChord` / `gameState` / `countInEarlyInputActive` のいずれかが変わるたびに
    /// シーンの吹き出しを最新化する。
    /// 既に `attempt.completedChordIds` に含まれているヴォイシング（次ループで戻ってきた小節など、
    /// もう判定対象でないもの）の場合は表示しない。
    private func updatePlayerQuoteBubble() {
        scene?.setPlayerQuote(Self.playerQuoteBubbleTextForScene(
            gameState: gameState,
            activeChord: activeChord,
            countInEarlyInputActive: countInEarlyInputActive,
            completedChordIds: attempt?.completedChordIds ?? []
        ))
    }

    private static func playerQuoteBubbleTextForScene(
        gameState: EarTrainingGameState,
        activeChord: EarTrainingPhraseChordDetail?,
        countInEarlyInputActive: Bool,
        completedChordIds: Set<UUID>
    ) -> String? {
        let showTargets = gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive)
        guard showTargets else { return nil }
        guard let chord = activeChord else { return nil }
        if completedChordIds.contains(chord.id) { return nil }
        guard let raw = chord.quote?.text else { return nil }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func triggerBattleEffect(
        kind: EarTrainingBattleEffectKind,
        label: String?,
        damage: Int?,
        phraseNoteCount: Int?,
        originPoint: CGPoint? = nil
    ) -> Int {
        battleEffectIdCounter += 1
        let id = battleEffectIdCounter
        let command = EarTrainingBattleEffectCommand(
            id: id,
            kind: kind,
            label: label,
            damage: damage,
            phraseNoteCount: phraseNoteCount,
            originPoint: originPoint
        )
        if lastEmittedEffectId != id {
            lastEmittedEffectId = id
            if kind == .correct || kind == .voicingCast || kind == .complete {
                audio.playFireMagicSe()
            }
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

    private func triggerCompletionPulse(groupId: UUID, kind: ChordVoicingCompletionPulse.Kind) {
        completionPulseEventKey += 1
        completionPulse = ChordVoicingCompletionPulse(
            groupId: groupId,
            kind: kind,
            eventKey: completionPulseEventKey
        )
    }

    /// アクティブコード名の Global 座標フレーム中心 → SpriteKit シーン座標へ変換する。
    /// SwiftUI/UIKit の Y 軸（top-down）と SKScene の Y 軸（bottom-up）の差を補正する。
    private func chordLabelOriginInScene() -> CGPoint? {
        guard let labelFrame = activeChordLabelGlobalFrame, let sceneFrame = battleSceneGlobalFrame else {
            return nil
        }
        guard sceneFrame.height > 0 else { return nil }
        let centerX = labelFrame.midX - sceneFrame.minX
        let topDownY = labelFrame.midY - sceneFrame.minY
        // SKScene 既定座標は bottomLeft origin。`scaleMode = .resizeFill` のため scene.size = view.bounds.size。
        let sceneY = sceneFrame.height - topDownY
        if !centerX.isFinite || !sceneY.isFinite {
            return nil
        }
        return CGPoint(x: centerX, y: sceneY)
    }

    private static func effectDurationMs(
        kind: EarTrainingBattleEffectKind,
        label: String?,
        phraseNoteCount: Int?
    ) -> Double {
        if kind == .quotaReached { return 700 }
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
        countInEarlyInputActive = false
        feedbackTask?.cancel()
        feedbackTask = nil
        battleEffectClearTask?.cancel()
        battleEffectClearTask = nil
        clearMeasureDisplayShiftQueue()
    }

    private func clearMeasureDisplayShiftQueue() {
        measureShiftConsumerTask?.cancel()
        measureShiftConsumerTask = nil
        measureShiftQueue.removeAll()
    }

    private func enqueueMeasureDisplayShift(_ targetMeasure: Int) {
        measureShiftQueue.append(targetMeasure)
        guard measureShiftConsumerTask == nil else { return }
        measureShiftConsumerTask = Task { @MainActor [weak self] in
            while true {
                try? await Task.sleep(nanoseconds: Self.measureShiftDelayNs)
                guard let self else { return }
                if Task.isCancelled {
                    self.measureShiftConsumerTask = nil
                    return
                }
                guard !self.measureShiftQueue.isEmpty else {
                    self.measureShiftConsumerTask = nil
                    return
                }
                let next = self.measureShiftQueue.removeFirst()
                self.displayedActiveMeasureNumber = next
                if self.measureShiftQueue.isEmpty {
                    self.measureShiftConsumerTask = nil
                    return
                }
            }
        }
    }

    private func cancelFailTimer() { failTimerTask?.cancel(); failTimerTask = nil }
    private func cancelTransitionTimer() { transitionTimerTask?.cancel(); transitionTimerTask = nil }
    private func cancelCountdownTimer() { countdownTask?.cancel(); countdownTask = nil }
    private func cancelTimeLimitTimer() { timeLimitTask?.cancel(); timeLimitTask = nil }
    private func cancelChordSyncTask() { chordSyncTask?.cancel(); chordSyncTask = nil }

    private func recomputeVoicingHints() {
        let next: [Int: VoicingHintState]
        if (practiceMode || stage.resolvedShowKeyboardHintsInBattle),
           let chord = activeChord,
           !(attempt?.completedChordIds.contains(chord.id) ?? false),
           gameState == .playingPhrase || (gameState == .countIn && countInEarlyInputActive) {
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

    var quizRulesLine: String? {
        stage.battleClearConditionText(isEnglish: isEnglishCopy)
    }
}
