import Foundation
import QuartzCore
import CoreGraphics

/// Web `EarTrainingChordQuizScreen.tsx` と同等のコードクイズ状態機械（HP・敵アタックゲージ・カウントイン対応）。
@MainActor
final class EarTrainingChordQuizBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let zeroDamage = EarTrainingDamageConfig.zero
    private static let kBattleEffectMs: Double = 1_600
    private static let kAwesomeBattleEffectMs: Double = 4_500

    /// コードクイズ本番の敵 HP（DB の enemyHp とは独立）。
    private static let quizEnemyHpFixed: Int = 10_000
    /// アタックゲージが満タンになるまでの秒数（満了ごとに敵が `quizStrikeDamage`）。
    private static let quizAttackGaugeSeconds: TimeInterval = 5
    private static let quizStrikeDamage: Int = 5
    /// Web `MEASURE_SHIFT_DELAY_MS`：正解直後に譜面の左右スロット更新を遅らせる。
    private static let measureShiftDelayNs: UInt64 = 100_000_000

    private static let chordVoicingSelfPacedDrumLoopURL =
        URL(string: "https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3")!

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseRunId: Int = 0
    @Published private(set) var attempt: EarTrainingChordVoicingAttempt?
    @Published private(set) var correctCount: Int = 0
    @Published private(set) var timeRemaining: Int
    @Published private(set) var statusText: String
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published private(set) var enemyHp: Int = 10_000
    @Published private(set) var playerHp: Int = 0
    @Published private(set) var enemyAttackGaugePercent: Double = 0
    @Published private(set) var countInValue: Int = 0
    @Published var practiceMode: Bool = false
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var quizPhraseDetail: EarTrainingPhraseDetail?
    /// 譜面の左右スロット表示用（論理の `activeQuizIndex` / `previewQuizIndex` より遅れて更新）。
    @Published private(set) var displayedStaffActiveQuizIndex: Int = 0
    @Published private(set) var displayedStaffPreviewQuizIndex: Int = 0
    /// Web `completionPulse` 相当。現在小節（左）の完成ハイライト。
    @Published private(set) var staffCompletionPulse: ChordVoicingCompletionPulse?
    /// 五線コード名フレーム（エフェクト起点）。親ビューが Preference で供給する。
    var activeChordLabelGlobalFrame: CGRect?
    /// SpriteKit のグローバルフレーム。親ビューが Preference で供給する。
    var battleSceneGlobalFrame: CGRect?

    let stage: EarTrainingStageDetail
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy
    /// アバター選択用の論理 ID。
    let enemyId: String

    private let quizQuestions: [EarTrainingChordQuiz.Question]
    private let questionOrder: EarTrainingChordQuiz.QuestionOrder
    private let requiredCorrectCount: Int
    private let quizDurationSec: Int

    private var activeQuizIndex: Int = 0
    private var previewQuizIndex: Int = 0
    private var quizEnded: Bool = false
    private var progressSaveStarted: Bool = false
    private var quizStartDate: Date?
    private var lastInputAt: TimeInterval = 0
    private var phraseIntroSeq: Int = 0
    private var quotaCelebrationFired: Bool = false
    private var staffShiftQueue: [(Int, Int)] = []
    private var staffShiftConsumerTask: Task<Void, Never>?
    private var staffCompletionPulseEventKey: Int = 0
    private var quizTickerTask: Task<Void, Never>?
    private var countdownTask: Task<Void, Never>?
    private var drumPrepareTask: Task<Void, Never>?
    private var battleEffectClearTask: Task<Void, Never>?
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var lastEmittedEffectId: Int = -1
    /// `quizAttackGaugeSeconds` 周期の開始時刻（Mono）。
    private var attackGaugeStartMono: TimeInterval?
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    private var feedbackTask: Task<Void, Never>?

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared
    private weak var scene: EarTrainingBattleSceneHandle?

    private func randomUnit() -> Double {
        Double.random(in: 0..<1)
    }

    var currentActiveQuestion: EarTrainingChordQuiz.Question? {
        guard activeQuizIndex >= 0 && activeQuizIndex < quizQuestions.count else { return nil }
        return quizQuestions[activeQuizIndex]
    }

    private var previewQuestion: EarTrainingChordQuiz.Question? {
        guard previewQuizIndex >= 0 && previewQuizIndex < quizQuestions.count else { return nil }
        return quizQuestions[previewQuizIndex]
    }

    /// HUD / スタッフレイアウト用プレビュー出題。
    var currentPreviewQuestion: EarTrainingChordQuiz.Question? {
        previewQuestion
    }

    /// 譜面オーバーレイ用（表示は論理より遅れることがある）。
    var displayedStaffActiveQuestion: EarTrainingChordQuiz.Question? {
        guard displayedStaffActiveQuizIndex >= 0 && displayedStaffActiveQuizIndex < quizQuestions.count else { return nil }
        return quizQuestions[displayedStaffActiveQuizIndex]
    }

    var displayedStaffPreviewQuestion: EarTrainingChordQuiz.Question? {
        guard displayedStaffPreviewQuizIndex >= 0 && displayedStaffPreviewQuizIndex < quizQuestions.count else { return nil }
        return quizQuestions[displayedStaffPreviewQuizIndex]
    }

    var activeChord: EarTrainingPhraseChordDetail? {
        EarTrainingChordQuiz.activeChord(
            in: currentActiveQuestion,
            completedChordIds: attempt?.completedChordIds
        )
    }

    init(
        stage: EarTrainingStageDetail,
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        enemyId: String,
        audio: EarTrainingAudio,
        initialPracticeMode: Bool = false,
        onExit: @escaping () -> Void
    ) {
        self.stage = stage
        self.lessonContext = lessonContext
        self.isEnglishCopy = isEnglishCopy
        self.enemyId = enemyId
        self.audio = audio
        self.onExitCallback = onExit
        self.hudLabels = EarTrainingBattleHudLabels.make(isEnglish: isEnglishCopy)
        self.copy = EarTrainingGameCopy.make(isEnglish: isEnglishCopy)
        self.quizQuestions = EarTrainingChordQuiz.buildQuestions(stage: stage)
        self.questionOrder = EarTrainingChordQuiz.QuestionOrder(sequential: stage.resolvedQuizQuestionOrderSequential)
        self.requiredCorrectCount = stage.resolvedQuizRequiredCorrectCount
        self.quizDurationSec = stage.resolvedQuizDurationSeconds
        self.timeRemaining = stage.resolvedQuizDurationSeconds
        self.statusText = copy.idlePrompt
        self.practiceMode = initialPracticeMode
        self.playerHp = stage.playerHp
        self.enemyHp = Self.quizEnemyHpFixed
    }

    // MARK: - Scene bridge

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishSnapshot()
        updatePlayerQuoteBubble()
    }

    func detachScene() {
        scene = nil
    }

    func handleEffectImpact(effectId: Int) {
        guard let handler = pendingImpactHandlers.removeValue(forKey: effectId) else { return }
        handler()
    }

    func start() {
        audio.start()
        publishSnapshot()
    }

    func tearDown() {
        cancelQuizTicker()
        cancelCountdownTask()
        clearStaffShiftQueue()
        drumPrepareTask?.cancel()
        drumPrepareTask = nil
        feedbackTask?.cancel()
        feedbackTask = nil
        battleEffectClearTask?.cancel()
        battleEffectClearTask = nil
        midiHeldKeys.removeAll()
        audio.stopDrumLoop()
        scene = nil
    }

    func registerMidiKeyDown(_ midi: Int) { midiHeldKeys.insert(midi) }
    func registerMidiKeyUp(_ midi: Int) { midiHeldKeys.remove(midi) }

    func handleBack() {
        cancelQuizTicker()
        cancelCountdownTask()
        clearStaffShiftQueue()
        audio.stopDrumLoop()
        onExitCallback()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    private func clearStaffShiftQueue() {
        staffShiftConsumerTask?.cancel()
        staffShiftConsumerTask = nil
        staffShiftQueue.removeAll()
    }

    private func syncDisplayedStaffToLogical() {
        displayedStaffActiveQuizIndex = activeQuizIndex
        displayedStaffPreviewQuizIndex = previewQuizIndex
    }

    private func enqueueStaffDisplayShift(active: Int, preview: Int) {
        staffShiftQueue.append((active, preview))
        guard staffShiftConsumerTask == nil else { return }
        staffShiftConsumerTask = Task { @MainActor [weak self] in
            while true {
                try? await Task.sleep(nanoseconds: Self.measureShiftDelayNs)
                guard let self else { return }
                if Task.isCancelled {
                    self.staffShiftConsumerTask = nil
                    return
                }
                guard !self.staffShiftQueue.isEmpty else {
                    self.staffShiftConsumerTask = nil
                    return
                }
                let pair = self.staffShiftQueue.removeFirst()
                self.displayedStaffActiveQuizIndex = pair.0
                self.displayedStaffPreviewQuizIndex = pair.1
                if self.staffShiftQueue.isEmpty {
                    self.staffShiftConsumerTask = nil
                    return
                }
            }
        }
    }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        publishSnapshot()
    }

    func applyPracticeModeAndRestart(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        startBattle()
    }

    /// CADisplayLink などから毎フレーム呼ぶ。ゲージ進行と満了時の敵攻撃。
    func tickQuizAttackGauge(now: TimeInterval) {
        guard gameState == .playingPhrase, !practiceMode, !quizEnded else {
            if enemyAttackGaugePercent != 0 {
                enemyAttackGaugePercent = 0
            }
            attackGaugeStartMono = nil
            return
        }
        var start = attackGaugeStartMono
        if start == nil {
            attackGaugeStartMono = now
            start = now
        }
        guard let startSafe = start else { return }
        let elapsed = now - startSafe
        let pct = min(1, elapsed / Self.quizAttackGaugeSeconds)
        if abs(pct - enemyAttackGaugePercent) > 0.004 || pct <= 0.002 || pct >= 1 - 0.000_001 {
            enemyAttackGaugePercent = pct
        }
        if pct >= 1 - 0.000_001 {
            attackGaugeStartMono = now
            enemyAttackGaugePercent = 0
            scheduleEnemyStrikeFromGauge()
        }
    }

    func startBattle() {
        guard !quizQuestions.isEmpty else {
            statusText = isEnglishCopy ? "No quiz items in stage." : "出題がありません。"
            publishSnapshot()
            return
        }
        lessonProgressStatus = nil
        progressSaveStarted = false
        quizEnded = false
        correctCount = 0
        phraseRunId = 0
        phraseIntroSeq += 1
        quotaCelebrationFired = false
        pendingImpactHandlers.removeAll()
        clearStaffShiftQueue()
        lastEmittedEffectId = -1

        enemyHp = Self.quizEnemyHpFixed
        playerHp = stage.playerHp
        enemyAttackGaugePercent = 0
        attackGaugeStartMono = nil

        cancelQuizTicker()
        cancelCountdownTask()

        let firstActive = EarTrainingChordQuiz.pickNextQuizIndex(
            items: quizQuestions,
            order: questionOrder,
            prevIndex: nil,
            rand: randomUnit
        )
        let firstPreview = EarTrainingChordQuiz.pickNextQuizIndex(
            items: quizQuestions,
            order: questionOrder,
            prevIndex: firstActive,
            rand: randomUnit
        )
        activeQuizIndex = firstActive
        previewQuizIndex = firstPreview
        bootstrapPhraseAndAttempt()
        syncDisplayedStaffToLogical()

        let beats = max(0, min(32, stage.countInBeats))
        let bpm = max(30, stage.bpm)
        let beatSec = max(0.1, 60.0 / Double(bpm))

        if beats > 0 {
            gameState = .countIn
            countInValue = beats
            statusText = copy.countIn
            countdownTask = Task { @MainActor [weak self] in
                guard let self else { return }
                var remaining = beats
                while remaining > 0 {
                    let delayNs = UInt64(beatSec * 1_000_000_000)
                    try? await Task.sleep(nanoseconds: delayNs)
                    if Task.isCancelled { return }
                    remaining -= 1
                    self.countInValue = max(0, remaining)
                    self.publishSnapshot()
                }
                if Task.isCancelled { return }
                self.beginQuizPlayingPhrase()
            }
        } else {
            beginQuizPlayingPhrase()
        }

        publishSnapshot()
        updatePlayerQuoteBubble()
    }

    private func cancelCountdownTask() {
        countdownTask?.cancel()
        countdownTask = nil
    }

    private func beginQuizPlayingPhrase() {
        cancelCountdownTask()
        gameState = .playingPhrase
        statusText = isEnglishCopy ? "Go!" : "スタート!"
        attackGaugeStartMono = CACurrentMediaTime()
        enemyAttackGaugePercent = 0

        drumPrepareTask?.cancel()
        drumPrepareTask = Task { @MainActor [weak self] in
            guard let self else { return }
            let ok = await self.audio.prepareDrumLoop(url: Self.chordVoicingSelfPacedDrumLoopURL)
            guard ok else { return }
            self.audio.startDrumLoop()
        }

        if practiceMode {
            timeRemaining = quizDurationSec
        } else {
            quizStartDate = Date()
            timeRemaining = quizDurationSec
            cancelQuizTicker()
            quizTickerTask = Task { @MainActor [weak self] in
                guard let self else { return }
                while !Task.isCancelled {
                    try? await Task.sleep(nanoseconds: 250_000_000)
                    self.tickQuizClock()
                }
            }
        }
        publishSnapshot()
        updatePlayerQuoteBubble()
    }

    private func bootstrapPhraseAndAttempt() {
        guard let question = currentActiveQuestion else {
            quizPhraseDetail = nil
            attempt = nil
            return
        }
        let phraseId = UUID()
        let chords = question.chords.map { chord in
            EarTrainingPhraseChordDetail(
                id: chord.id,
                phraseId: phraseId,
                orderIndex: chord.orderIndex,
                chordName: chord.chordName,
                measureNumber: chord.measureNumber,
                beatOffset: chord.beatOffset,
                durationBeats: chord.durationBeats,
                startTimeSec: chord.startTimeSec,
                endTimeSec: chord.endTimeSec,
                voicing: chord.voicing,
                voicingStaves: chord.voicingStaves,
                quote: chord.quote
            )
        }
        let phraseDetail = EarTrainingPhraseDetail(
            id: phraseId,
            stageId: stage.id,
            orderIndex: 0,
            keyFifths: question.keyFifths,
            title: nil,
            titleEn: nil,
            musicXmlUrl: nil,
            audioUrl: Self.chordVoicingSelfPacedDrumLoopURL.absoluteString,
            loopDurationSec: 2,
            audioDurationSec: 2,
            noteCount: 0,
            notes: [],
            chords: chords,
            demoLoops: []
        )
        quizPhraseDetail = phraseDetail
        attempt = EarTrainingChordVoicingEngine.createAttempt(for: phraseDetail)
        resetAttackGaugeEpochForCurrentQuestion()
    }

    private func resetAttackGaugeEpochForCurrentQuestion() {
        attackGaugeStartMono = CACurrentMediaTime()
        enemyAttackGaugePercent = 0
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
        let now = CACurrentMediaTime()
        if (now - lastInputAt) * 1000 < Self.inputCooldownMs {
            return
        }
        lastInputAt = now
        guard gameState == .playingPhrase,
              quizEnded != true else { return }
        guard let currentAttempt = attempt, let chord = activeChord else { return }

        guard let judged = EarTrainingChordVoicingEngine.selectJudgmentChord(
            attempt: currentAttempt,
            primaryChord: chord,
            overlapChord: nil,
            midiNote: midi
        ) else { return }

        let result = EarTrainingChordVoicingEngine.handleNoteOn(
            attempt: currentAttempt,
            activeChord: judged,
            midiNote: midi,
            damage: Self.zeroDamage,
            suppressMissRecording: false,
            wrongNotesPolicy: .firstOnlyPerChord
        )

        if !practiceMode, result.firstWrongJustHappened {
            let wrongEffectId = triggerBattleEffect(
                kind: .miss,
                label: nil,
                damage: Self.quizStrikeDamage,
                phraseNoteCount: nil,
                originPoint: nil
            )
            registerBattleEffectImpact(effectId: wrongEffectId) { [weak self] in
                guard let self else { return }
                let nextPlayer = max(0, self.playerHp - Self.quizStrikeDamage)
                self.playerHp = nextPlayer
                self.applyQuizHpOutcome(nextEnemyHp: self.enemyHp, nextPlayerHp: nextPlayer)
            }
        }

        if result.attempt != currentAttempt {
            attempt = result.attempt
        }

        guard result.chordJustCompleted else {
            publishSnapshot()
            return
        }

        attempt = result.attempt
        let questionCompleted = EarTrainingChordQuiz.isQuestionCompleted(
            currentActiveQuestion,
            completedChordIds: result.attempt.completedChordIds
        )

        staffCompletionPulseEventKey &+= 1
        staffCompletionPulse = ChordVoicingCompletionPulse(
            groupId: judged.id,
            kind: questionCompleted ? .harmonyComplete : .voicingPartial,
            eventKey: staffCompletionPulseEventKey
        )

        guard questionCompleted else {
            _ = triggerBattleEffect(
                kind: .voicingCast,
                label: nil,
                damage: nil,
                phraseNoteCount: nil,
                originPoint: nil
            )
            publishSnapshot()
            updatePlayerQuoteBubble()
            return
        }

        correctCount += 1

        if correctCount >= requiredCorrectCount, !quotaCelebrationFired {
            quotaCelebrationFired = true
            _ = triggerBattleEffect(
                kind: .quotaReached,
                label: nil,
                damage: nil,
                phraseNoteCount: nil,
                originPoint: nil
            )
        }

        let origin = chordLabelOriginInScene()
        let completionDamage = practiceMode ? 0 : Int.random(in: 40...50)

        if practiceMode {
            emitChordCompletionVisualEffects(origin: origin)
        } else {
            emitChordCompletionVisualEffects(origin: origin, completionDamage: completionDamage)
        }

        advanceAfterCorrect()
        publishSnapshot()
        updatePlayerQuoteBubble()
    }

    private func emitChordCompletionVisualEffects(origin: CGPoint?, completionDamage: Int = 0) {
        if correctCount % 5 == 0 && correctCount > 0 {
            let cycle = (correctCount / 5 - 1) % 3
            let label: String?
            let phraseNoteCount: Int?
            switch cycle {
            case 0:
                label = "Great"
                phraseNoteCount = nil
            case 1:
                label = "Perfect"
                phraseNoteCount = nil
            default:
                label = "Perfect"
                phraseNoteCount = 6
            }
            let effectId = triggerBattleEffect(
                kind: .complete,
                label: label,
                damage: completionDamage,
                phraseNoteCount: phraseNoteCount,
                originPoint: origin
            )
            if completionDamage > 0 {
                registerBattleEffectImpact(effectId: effectId) { [weak self] in
                    guard let self else { return }
                    let nextEnemy = max(0, self.enemyHp - completionDamage)
                    self.enemyHp = nextEnemy
                    self.applyQuizHpOutcome(nextEnemyHp: nextEnemy, nextPlayerHp: self.playerHp)
                }
            }
        } else {
            let effectId = triggerBattleEffect(
                kind: .correct,
                label: nil,
                damage: completionDamage,
                phraseNoteCount: nil,
                originPoint: origin
            )
            if completionDamage > 0 {
                registerBattleEffectImpact(effectId: effectId) { [weak self] in
                    guard let self else { return }
                    let nextEnemy = max(0, self.enemyHp - completionDamage)
                    self.enemyHp = nextEnemy
                    self.applyQuizHpOutcome(nextEnemyHp: nextEnemy, nextPlayerHp: self.playerHp)
                }
            }
        }
    }

    private func scheduleEnemyStrikeFromGauge() {
        guard !practiceMode, !quizEnded else { return }
        let effectId = triggerBattleEffect(
            kind: .miss,
            label: nil,
            damage: Self.quizStrikeDamage,
            phraseNoteCount: nil,
            originPoint: nil
        )
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            guard let self else { return }
            let nextPlayer = max(0, self.playerHp - Self.quizStrikeDamage)
            self.playerHp = nextPlayer
            self.applyQuizHpOutcome(nextEnemyHp: self.enemyHp, nextPlayerHp: nextPlayer)
        }
    }

    private func applyQuizHpOutcome(nextEnemyHp: Int, nextPlayerHp: Int) {
        guard !practiceMode, !quizEnded else { return }
        let outcome = EarTrainingEngine.resolveOutcome(
            enemyHp: nextEnemyHp,
            playerHp: nextPlayerHp,
            timeRemainingSec: max(0, timeRemaining),
            phraseCompleted: false,
            phraseFailed: false
        )
        switch outcome {
        case .stageClear:
            quizEnded = true
            cancelQuizTicker()
            cancelCountdownTask()
            pendingImpactHandlers.removeAll()
            clearStaffShiftQueue()
            finishQuizSuccess()
        case .gameOver:
            quizEnded = true
            cancelQuizTicker()
            cancelCountdownTask()
            pendingImpactHandlers.removeAll()
            clearStaffShiftQueue()
            finishQuizFail()
        default:
            break
        }
    }

    private func advanceAfterCorrect() {
        phraseRunId &+= 1
        activeQuizIndex = previewQuizIndex
        previewQuizIndex = EarTrainingChordQuiz.pickNextQuizIndex(
            items: quizQuestions,
            order: questionOrder,
            prevIndex: activeQuizIndex,
            rand: randomUnit
        )
        bootstrapPhraseAndAttempt()
        enqueueStaffDisplayShift(active: activeQuizIndex, preview: previewQuizIndex)
    }

    private func tickQuizClock() {
        guard !practiceMode, let start = quizStartDate, gameState == .playingPhrase, !quizEnded else { return }
        let elapsed = Date().timeIntervalSince(start)
        let rem = Int(ceil(Double(quizDurationSec) - elapsed))
        let safe = max(0, rem)
        if safe != timeRemaining {
            timeRemaining = safe
        }
        guard safe <= 0 else {
            publishSnapshot()
            return
        }
        cancelQuizTicker()
        evaluateTimeUp()
    }

    private func evaluateTimeUp() {
        guard !practiceMode, !quizEnded else { return }
        quizEnded = true
        pendingImpactHandlers.removeAll()
        clearStaffShiftQueue()
        let ok = EarTrainingChordQuiz.isQuizClear(correct: correctCount, required: requiredCorrectCount)
        if ok {
            finishQuizSuccess()
        } else {
            finishQuizFail()
        }
        publishSnapshot()
        updatePlayerQuoteBubble()
    }

    private func finishQuizSuccess() {
        cancelCountdownTask()
        clearStaffShiftQueue()
        gameState = .stageClear
        statusText = isEnglishCopy ? "CLEAR!" : "クリア!"
        audio.stopDrumLoop()
        triggerFeedbackFlash(.clear)
        guard let lessonContext, !practiceMode, !progressSaveStarted else {
            return
        }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        let lessonRank = EarTrainingEngine.lessonRank(from: .perfect)
        Task { @MainActor in
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
    }

    private func finishQuizFail() {
        cancelCountdownTask()
        clearStaffShiftQueue()
        gameState = .gameOver
        statusText = isEnglishCopy ? "Try again" : "残念…"
        audio.stopDrumLoop()
    }

    private func cancelQuizTicker() {
        quizTickerTask?.cancel()
        quizTickerTask = nil
    }

    private func publishSnapshot() {
        let phraseIntroLine: String
        let phraseIntroEmphasis: Bool
        if gameState == .countIn {
            phraseIntroLine = phraseIntroSummary()
            phraseIntroEmphasis = true
        } else {
            phraseIntroLine = ""
            phraseIntroEmphasis = false
        }
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: gameState,
            stageId: stage.id,
            stageTitle: stage.localizedTitle(isEnglishCopy ? .en : .ja),
            phraseIndex: 0,
            phraseRunId: phraseRunId,
            phraseIntroSeq: phraseIntroSeq,
            phraseIntroEmphasis: phraseIntroEmphasis,
            totalPhrases: 1,
            phraseIntroLine: phraseIntroLine,
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: enemyAvatarAssetName(),
            enemyAvatarFlipX: EarTrainingBattleController.shouldFlipEnemyAvatar(name: enemyAvatarAssetName()),
            fixedCharacterPositions: false,
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
        updatePlayerQuoteBubble()
    }

    private func phraseIntroSummary() -> String {
        let n = requiredCorrectCount
        let sec = quizDurationSec
        if isEnglishCopy {
            return "Get \(n)+ correct in \(sec)s to clear!"
        }
        return "\(sec)秒で\(n)問正解でクリア！"
    }

    private func enemyAvatarAssetName() -> String {
        EarTrainingBattleController.avatarAssetName(stageId: stage.id, enemyId: enemyId)
    }

    private func chordLabelOriginInScene() -> CGPoint? {
        guard let labelFrame = activeChordLabelGlobalFrame, let sceneFrame = battleSceneGlobalFrame else {
            return nil
        }
        guard sceneFrame.height > 0 else { return nil }
        let centerX = labelFrame.midX - sceneFrame.minX
        let topDownY = labelFrame.midY - sceneFrame.minY
        let sceneY = sceneFrame.height - topDownY
        if !centerX.isFinite || !sceneY.isFinite {
            return nil
        }
        return CGPoint(x: centerX, y: sceneY)
    }

    private func updatePlayerQuoteBubble() {
        if gameState == .playingPhrase, !quizEnded {
            scene?.setPlayerQuote("\(correctCount)/\(requiredCorrectCount)")
        } else {
            scene?.setPlayerQuote(nil)
        }
    }

    private func registerBattleEffectImpact(effectId: Int, handler: @escaping () -> Void) {
        pendingImpactHandlers[effectId] = handler
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
        battleEffectClearTask?.cancel()
        battleEffectClearTask = Task { [weak self] in
            let ms = Self.effectDurationMs(kind: kind, label: label, phraseNoteCount: phraseNoteCount)
            try? await Task.sleep(nanoseconds: UInt64(ms * 1_000_000))
            await MainActor.run {
                self?.pendingImpactHandlers[id] = nil
            }
        }
        return id
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

    private func triggerFeedbackFlash(_ value: EarTrainingBattleController.Feedback) {
        feedback = value
        feedbackTask?.cancel()
        feedbackTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 220_000_000)
            await MainActor.run {
                if self?.feedback == value {
                    self?.feedback = nil
                }
            }
        }
    }

    // MARK: - HUD snapshot

    var timeLabel: String {
        if practiceMode { return "∞" }
        let safe = max(0, timeRemaining)
        let minutes = safe / 60
        let rest = safe % 60
        return String(format: "%d:%02d", minutes, rest)
    }

    var hudModel: EarTrainingHudModel {
        var chips: [EarTrainingChordChip] = []
        let chipActive = (gameState == .playingPhrase || gameState == .countIn) && !quizEnded
        let activeChordId = activeChord?.id
        if let question = currentActiveQuestion, chipActive {
            for chord in question.chords {
                chips.append(
                    EarTrainingChordChip(
                        id: chord.id,
                        name: chord.chordName,
                        active: resolvedShowVoicingHints && chord.id == activeChordId
                    )
                )
            }
        }
        if let preview = previewQuestion, preview.id != currentActiveQuestion?.id {
            for chord in preview.chords {
                chips.append(EarTrainingChordChip(id: chord.id, name: chord.chordName, active: false))
            }
        }
        let questionCompleted = EarTrainingChordQuiz.isQuestionCompleted(
            currentActiveQuestion,
            completedChordIds: attempt?.completedChordIds ?? []
        )
        return EarTrainingHudModel(
            playerHp: practiceMode ? stage.playerHp : playerHp,
            playerMaxHp: stage.playerHp,
            enemyHp: practiceMode ? Self.quizEnemyHpFixed : enemyHp,
            enemyMaxHp: Self.quizEnemyHpFixed,
            practiceMode: practiceMode,
            timeRemaining: timeRemaining,
            timeLabel: timeLabel,
            hideTimeLabel: false,
            enemyAttackGaugePercent: practiceMode ? 0 : enemyAttackGaugePercent,
            hideEnemyAttackGauge: practiceMode,
            hideChordChips: false,
            hideSlotsRow: false,
            hudLabels: hudLabels,
            gameState: gameState,
            phraseRunId: phraseRunId,
            chordChips: chips,
            slotRow: .chordVoicing(slotCount: 1, completed: [questionCompleted], currentIndex: 0)
        )
    }

    /// コード名ラベルを譜側で「ターゲット」として強調できるよう、ヒント状態を返す。
    private var resolvedShowVoicingHints: Bool {
        if practiceMode {
            return (gameState == .playingPhrase || gameState == .countIn) && !quizEnded
        }
        if stage.resolvedQuizHideUnpressedNotationInBattle(practiceMode: practiceMode) {
            return false
        }
        return (gameState == .playingPhrase || gameState == .countIn) && !quizEnded
    }

    var canChangePracticeMode: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var showLobbyControls: Bool {
        canChangePracticeMode
    }

    var startButtonLabel: String {
        gameState == .idle ? "START" : "RETRY"
    }

    private var summaryLineForResult: String {
        let correctLabel = isEnglishCopy ? "Correct" : "正解"
        let needLabel = isEnglishCopy ? "Need" : "必要"
        return "\(correctLabel) \(correctCount) / \(needLabel) \(requiredCorrectCount)"
    }
}

extension EarTrainingChordQuizBattleController: EarTrainingBattleSceneDriving {}
extension EarTrainingChordQuizBattleController: EarTrainingPianoPlayable {
    var voicingHintsByMidi: [Int: VoicingHintState] {
        guard practiceMode || stage.resolvedShowKeyboardHintsInBattle else { return [:] }
        guard gameState == .playingPhrase || gameState == .countIn, !quizEnded,
              let chord = activeChord,
              !(attempt?.completedChordIds.contains(chord.id) ?? false) else { return [:] }
        let pressed = attempt?.pressedByChord[chord.id] ?? []
        return EarTrainingChordVoicingEngine.voicingKeyboardHints(
            voicing: chord.voicing,
            pressedPitchClasses: pressed
        )
    }
}
extension EarTrainingChordQuizBattleController: EarTrainingLobbyPresentable {
    var lessonProgressText: String? {
        guard lessonContext != nil, gameState == .stageClear else { return nil }
        switch lessonProgressStatus {
        case .saved: return copy.lessonSaved
        case .saving: return copy.lessonSaving
        case nil: return copy.lessonSaving
        }
    }

    var resultState: EarTrainingResultState? {
        switch gameState {
        case .stageClear:
            return .win
        case .gameOver:
            return .lose
        default:
            return nil
        }
    }

    /// 評価色は使わないがプロトコル互換で `fail` に寄せる。
    var lastRank: EarTrainingRank? {
        nil
    }

    var resultRankLine: String? {
        guard resultState != nil else { return nil }
        return summaryLineForResult
    }

    var stageTitleForLobby: String {
        stage.localizedTitle(isEnglishCopy ? .en : .ja)
    }

    var quizRulesLine: String? {
        stage.battleClearConditionText(isEnglish: isEnglishCopy)
    }
}
