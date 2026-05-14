import Foundation
import QuartzCore
import CoreGraphics

/// Web `EarTrainingChordQuizScreen.tsx` と同等のコードクイズ状態機械（敵ゲージ無し・クイズ専用）。
@MainActor
final class EarTrainingChordQuizBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let zeroDamage = EarTrainingDamageConfig.zero
    private static let kBattleEffectMs: Double = 1_600
    private static let kAwesomeBattleEffectMs: Double = 4_500

    private static let chordVoicingSelfPacedDrumLoopURL =
        URL(string: "https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3")!

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseRunId: Int = 0
    @Published private(set) var attempt: EarTrainingChordVoicingAttempt?
    @Published private(set) var correctCount: Int = 0
    @Published private(set) var timeRemaining: Int
    @Published private(set) var statusText: String
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool = false
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var quizPhraseDetail: EarTrainingPhraseDetail?
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

    private let quizItems: [EarTrainingChordQuizItem]
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
    private var quizTickerTask: Task<Void, Never>?
    private var drumPrepareTask: Task<Void, Never>?
    private var battleEffectClearTask: Task<Void, Never>?
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var lastEmittedEffectId: Int = -1
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    private var feedbackTask: Task<Void, Never>?

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared
    private weak var scene: EarTrainingBattleSceneHandle?

    private func randomUnit() -> Double {
        Double.random(in: 0..<1)
    }

    var currentActiveItem: EarTrainingChordQuizItem? {
        guard activeQuizIndex >= 0 && activeQuizIndex < quizItems.count else { return nil }
        return quizItems[activeQuizIndex]
    }

    private var previewItem: EarTrainingChordQuizItem? {
        guard previewQuizIndex >= 0 && previewQuizIndex < quizItems.count else { return nil }
        return quizItems[previewQuizIndex]
    }

    /// HUD / スタッフレイアウト用プレビュー出題。
    var currentPreviewQuizItem: EarTrainingChordQuizItem? {
        previewItem
    }

    var activeChord: EarTrainingPhraseChordDetail? {
        quizPhraseDetail?.chords?.first
    }

    init(
        stage: EarTrainingStageDetail,
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        enemyId: String,
        audio: EarTrainingAudio,
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
        self.quizItems = stage.sortedChordQuizItems()
        self.questionOrder = EarTrainingChordQuiz.QuestionOrder(sequential: stage.resolvedQuizQuestionOrderSequential)
        self.requiredCorrectCount = stage.resolvedQuizRequiredCorrectCount
        self.quizDurationSec = stage.resolvedQuizDurationSeconds
        self.timeRemaining = stage.resolvedQuizDurationSeconds
        self.statusText = copy.idlePrompt
        self.practiceMode = false
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
        audio.stopDrumLoop()
        onExitCallback()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        publishSnapshot()
    }

    func startBattle() {
        guard !quizItems.isEmpty else {
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
        lastEmittedEffectId = -1

        drumPrepareTask?.cancel()
        drumPrepareTask = Task { @MainActor [weak self] in
            guard let self else { return }
            let ok = await self.audio.prepareDrumLoop(url: Self.chordVoicingSelfPacedDrumLoopURL)
            guard ok else { return }
            self.audio.startDrumLoop()
        }

        let firstActive = EarTrainingChordQuiz.pickNextQuizIndex(
            items: quizItems,
            order: questionOrder,
            prevIndex: nil,
            rand: randomUnit
        )
        let firstPreview = EarTrainingChordQuiz.pickNextQuizIndex(
            items: quizItems,
            order: questionOrder,
            prevIndex: firstActive,
            rand: randomUnit
        )
        activeQuizIndex = firstActive
        previewQuizIndex = firstPreview
        bootstrapPhraseAndAttempt()

        statusText = isEnglishCopy ? "Go!" : "スタート!"
        gameState = .playingPhrase

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
        guard let item = currentActiveItem else {
            quizPhraseDetail = nil
            attempt = nil
            return
        }
        let phraseId = UUID()
        let chord = EarTrainingPhraseChordDetail(
            id: item.id,
            phraseId: phraseId,
            orderIndex: item.orderIndex,
            chordName: item.chordName,
            measureNumber: nil,
            beatOffset: nil,
            durationBeats: nil,
            startTimeSec: nil,
            endTimeSec: nil,
            voicing: item.voicing,
            voicingStaves: item.voicingStaves,
            quote: nil
        )
        let phraseDetail = EarTrainingPhraseDetail(
            id: phraseId,
            stageId: stage.id,
            orderIndex: 0,
            keyFifths: nil,
            title: nil,
            titleEn: nil,
            audioUrl: Self.chordVoicingSelfPacedDrumLoopURL.absoluteString,
            loopDurationSec: 2,
            audioDurationSec: 2,
            noteCount: 0,
            notes: [],
            chords: [chord],
            demoLoops: []
        )
        quizPhraseDetail = phraseDetail
        attempt = EarTrainingChordVoicingEngine.createAttempt(for: phraseDetail)
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
            suppressMissRecording: true
        )

        if result.attempt != currentAttempt {
            attempt = result.attempt
        }

        guard result.chordJustCompleted else {
            return
        }

        attempt = result.attempt
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
            _ = triggerBattleEffect(
                kind: .complete,
                label: label,
                damage: 0,
                phraseNoteCount: phraseNoteCount,
                originPoint: origin
            )
        } else {
            _ = triggerBattleEffect(
                kind: .correct,
                label: nil,
                damage: 0,
                phraseNoteCount: nil,
                originPoint: origin
            )
        }

        advanceAfterCorrect()
        publishSnapshot()
        updatePlayerQuoteBubble()
    }

    private func advanceAfterCorrect() {
        phraseRunId &+= 1
        activeQuizIndex = previewQuizIndex
        previewQuizIndex = EarTrainingChordQuiz.pickNextQuizIndex(
            items: quizItems,
            order: questionOrder,
            prevIndex: activeQuizIndex,
            rand: randomUnit
        )
        bootstrapPhraseAndAttempt()
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
        gameState = .gameOver
        statusText = isEnglishCopy ? "Try again" : "残念…"
        audio.stopDrumLoop()
    }

    private func cancelQuizTicker() {
        quizTickerTask?.cancel()
        quizTickerTask = nil
    }

    private func publishSnapshot() {
        let phraseIntroLine = phraseIntroSummary()
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: gameState,
            stageId: stage.id,
            stageTitle: stage.localizedTitle(isEnglishCopy ? .en : .ja),
            phraseIndex: 0,
            phraseRunId: phraseRunId,
            phraseIntroSeq: phraseIntroSeq,
            phraseIntroEmphasis: true,
            totalPhrases: 1,
            phraseIntroLine: phraseIntroLine,
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: enemyAvatarAssetName(),
            enemyAvatarFlipX: EarTrainingBattleController.shouldFlipEnemyAvatar(name: enemyAvatarAssetName()),
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
        if let a = currentActiveItem, gameState == .playingPhrase, !quizEnded {
            chips.append(EarTrainingChordChip(id: a.id, name: a.chordName, active: resolvedShowVoicingHints))
        }
        if let p = previewItem {
            let dup = !(currentActiveItem.map { $0.id == p.id } ?? false)
            if dup {
                chips.append(EarTrainingChordChip(id: p.id, name: p.chordName, active: false))
            }
        }
        let slotCompleted = quizItems.indices.map { _ in false }
        return EarTrainingHudModel(
            playerHp: stage.playerHp,
            playerMaxHp: stage.playerHp,
            enemyHp: stage.enemyHp,
            enemyMaxHp: stage.enemyHp,
            practiceMode: practiceMode,
            timeRemaining: timeRemaining,
            timeLabel: timeLabel,
            enemyAttackGaugePercent: 0,
            hideEnemyAttackGauge: true,
            hudLabels: hudLabels,
            gameState: gameState,
            phraseRunId: phraseRunId,
            chordChips: chips,
            slotRow: .chordVoicing(slotCount: 1, completed: slotCompleted, currentIndex: 0)
        )
    }

    /// コード名ラベルを譜側で「ターゲット」として強調できるよう、ヒント状態を返す。
    private var resolvedShowVoicingHints: Bool {
        if practiceMode { return gameState == .playingPhrase && !quizEnded }
        /// 音符を隠す本番レイアウトではコードラベルをアクティブ表示しない（見た目のブレ回避）。
        if stage.resolvedQuizHideUnpressedNotationInBattle(practiceMode: practiceMode) {
            return false
        }
        return gameState == .playingPhrase && !quizEnded
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
        guard practiceMode else { return [:] }
        guard gameState == .playingPhrase, !quizEnded,
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
}
