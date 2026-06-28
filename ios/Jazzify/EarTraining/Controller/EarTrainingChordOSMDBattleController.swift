import Foundation
import Combine
import QuartzCore
import CoreGraphics
import os.log

/// OSMD でリズム譜を表示し、Swift 側でオクターブ込みのコード同時タイミング判定を行う耳コピバトル。
@MainActor
final class EarTrainingChordOSMDBattleController: ObservableObject {
    /// ターゲット時刻を中心に前後これだけ秒（±250ms）
    private static let judgmentWindowSec: Double = 0.25
    /// 正解報酬: |Δ|≤100ms で追加パリィリング
    private static let preciseWindowSec: Double = 0.1
    private static let osmdVoicingHintStrongSec: Double = 0.03
    private static let osmdVoicingHintMediumSec: Double = 0.07
    private static let hammerLeadSec: Double = 2.4
    private static let hammerImpactOffsetSec: Double = 0.2
    private static let effectClearPaddingMs: Double = 420
    /// 正解連打時の statusText 更新間隔（SwiftUI 再描画抑制）
    private static let statusTextThrottleSec: Double = 0.4
    /// フレーズ終了検知のセーフティパディング。`loop_duration_sec` の直後ではなく、
    /// 最後のノーツの判定窓と被ダメージ用ハンマーが着弾し終わるまで待つ（WEB の `PHRASE_END_PADDING_SEC` 相当）。
    private static let phraseEndPaddingSec: Double = 0.08
    /// WEB `INPUT_COOLDOWN_MS` 相当（MIDI ノート単位）。
    private static let inputCooldownMs: Double = 20

    private enum Log {
        private static let subsystem = Bundle.main.bundleIdentifier ?? "Jazzify"
        static let battle = Logger(subsystem: subsystem, category: "EarTrainingChordOSMDBattle")
    }

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var phraseRunId: Int = 0
    private var phraseIntroSeq: Int = 0
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int = 0
    @Published private(set) var countInValue: Int
    @Published private(set) var activeMeasureNumber: Int = 1
    /// 音源 prepare 成功後にのみ true。譜面スクロール／プレイヘッド表示の開始条件。
    @Published private(set) var scoreTimelineArmed: Bool = false
    @Published private(set) var musicXMLText: String?
    /// MusicXML 上の段数の目安（`<staves>` と note 直下 `<staff>` の最大）。OSMD 初期 zoom に使用。
    @Published private(set) var musicXMLMaxStaffLayers: Int = 1
    @Published private(set) var scoreErrorText: String?
    @Published private(set) var completedTargetCount: Int = 0
    @Published private(set) var failedTargetCount: Int = 0
    @Published private(set) var phraseAccuracy: Double = 0
    @Published private(set) var statusText: String
    @Published private(set) var enemyAttackGaugePercent: Double = 0
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool
    @Published var practiceTransposeOffset: Int = 0
    @Published var practiceSpeedPercent: Int = 100
    @Published var timingAdjustmentMs: Int = EarTrainingOsmdTimingAdjustment.timingAdjustmentMsDefault
    @Published private(set) var practiceOriginalKeyFifths: Int = 0
    @Published private(set) var practiceOriginalKeyName: String = "—"
    /// チュートリアル時は敵攻撃・ミス/Fail ダメージを無効化する。
    var tutorialNoCombat: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    private var tutorialOsmdLoopCount: Int = 0
    /// Web `scheduleOsmdTimedLinesForLoop` 相当の `DispatchWorkItem`（フレーズ再開時・終了時にキャンセル）。
    private var tutorialOsmdTimedLineWorks: [DispatchWorkItem] = []

    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    /// 設定で有効なとき、判定窓内の未押下構成音（OSMD: 距離で濃さが変わるマリーゴールド）。
    @Published private(set) var voicingHintIntensities: [Int: VoicingHintIntensity] = [:]
    /// MusicXML / 判定ターゲット由来の鍵盤スクロールアンカー（白鍵 MIDI）。無いときは C4 中央へフォールバック。
    @Published private(set) var keyboardScrollAnchorMidi: Int?

    var scoreScrollActive: Bool {
        scoreTimelineArmed && (gameState == .countIn || gameState == .playingPhrase)
    }

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

    private var targets: [RhythmTarget] = []
    private var activeTargetIndices: [Int] = []
    private var nextActiveTargetIndex: Int = 0
    private var nextMissTargetIndex: Int = 0
    private var nextHammerTargetIndex: Int = 0
    private var lastInputAtByNote: [Int: Double] = [:]
    private var phraseEnding: Bool = false
    private var progressSaveStarted: Bool = false
    private var totalCompletedTargets: Int = 0
    private var totalJudgedTargets: Int = 0
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var lastEmittedEffectId: Int = -1
    private static let musicXmlCacheSchemaVersion = 6

    private static func musicXmlCacheKey(phraseId: UUID) -> String {
        "\(phraseId.uuidString)|osmdXml|v\(musicXmlCacheSchemaVersion)"
    }

    private struct MusicXmlPrepared {
        let baseRhythmXml: String
        let baseDisplayXml: String
        let maxStaffLayers: Int
        let lyricEvents: [ChordOsmdLyricEvent]
    }

    private var musicXMLCache: [String: MusicXmlPrepared] = [:]
    /// 正規化済み・歌詞付き。表示は `musicXMLText` の歌詞除去版。
    private var rhythmMusicXmlForAttacks: String?
    private var rhythmAttacks: [ChordOsmdMusicXmlAttack] = []
    private var phraseLyricEvents: [ChordOsmdLyricEvent] = []
    private var nextLyricQuoteIndex: Int = 0
    private let stageFallbackKeyboardScrollAnchorMidi: Int?

    private var countdownTask: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private var battleEffectClearTasks: [Int: Task<Void, Never>] = [:]
    private var phrasePrepareTask: Task<Void, Never>?
    private var lastRankStorage: EarTrainingRank?
    private var runtimeCompletedTargetCount: Int = 0
    private var runtimeFailedTargetCount: Int = 0
    private var lastStatusUpdateAt: TimeInterval = 0

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
        self.enemyHp = stage.enemyHp
        self.playerHp = stage.playerHp
        self.countInValue = max(0, min(32, stage.countInBeats))
        self.statusText = isEnglishCopy
            ? "Press START to begin OSMD rhythm battle."
            : "STARTでOSMDリズムバトルを開始します"
        self.practiceMode = initialPracticeMode
        self.timingAdjustmentMs = EarTrainingOsmdTimingAdjustment.loadTimingAdjustmentMs()
        self.stageFallbackKeyboardScrollAnchorMidi = EarTrainingKeyboardScroll.scrollAnchorMidi(for: stage)
        self.keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
    }

    func applyPracticeModeAndRestart(_ value: Bool) {
        practiceMode = value
        if !value {
            voicingHintIntensities = [:]
            practiceTransposeOffset = 0
            practiceSpeedPercent = 100
            audio.phrasePitchSemitones = 0
            audio.phrasePlaybackSpeedPercent = 100
        }
        startBattle()
    }

    func applyPracticePlaybackAndRestart(offset: Int, speedPercent: Int) {
        guard practiceMode else { return }
        practiceSpeedPercent = EarTrainingPracticeSpeed.clampPracticeSpeedPercent(speedPercent)
        if stage.resolvedPracticeTranspose {
            practiceTransposeOffset = EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(offset)
        }
        audio.phrasePitchSemitones = Float(effectivePracticeTransposeOffset())
        audio.phrasePlaybackSpeedPercent = Float(practiceSpeedPercent)
        isSettingsOpen = false
        startBattle()
    }

    func applyTimingAdjustmentMs(_ ms: Int) {
        let clamped = EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(ms)
        timingAdjustmentMs = clamped
        EarTrainingOsmdTimingAdjustment.saveTimingAdjustmentMs(clamped)
    }

    private func effectivePracticeTransposeOffset() -> Int {
        guard stage.resolvedPracticeTranspose, practiceMode else { return 0 }
        return practiceTransposeOffset
    }

    private func effectivePracticeSpeedPercent() -> Int {
        practiceMode ? practiceSpeedPercent : EarTrainingPracticeSpeed.practiceSpeedMaxPercent
    }

    private func resolveEffectiveTargetTimeSec(_ targetTimeSec: Double) -> Double {
        EarTrainingPracticeSpeed.scalePracticeTargetTimeSec(
            targetTimeSec,
            speedPercent: effectivePracticeSpeedPercent()
        )
    }

    private func resolveCalibratedTargetTimeSec(_ targetTimeSec: Double) -> Double {
        EarTrainingOsmdTimingAdjustment.resolveCalibratedTargetTimeSec(
            speedScaledTargetTimeSec: resolveEffectiveTargetTimeSec(targetTimeSec),
            timingAdjustmentMs: timingAdjustmentMs
        )
    }

    private func resolveEffectiveTimingWindowSec(_ baseSec: Double) -> Double {
        EarTrainingPracticeSpeed.scalePracticeTimingWindowSec(
            baseSec,
            speedPercent: effectivePracticeSpeedPercent()
        )
    }

    private func osmdPhraseTimelineSecNow() -> Double? {
        audio.phraseWallClockTimelineSecNowOrNil()
    }

    private func resolveEffectivePracticeBpm() -> Int {
        EarTrainingPracticeSpeed.effectivePracticeBpm(
            stage.bpm,
            speedPercent: effectivePracticeSpeedPercent()
        )
    }

    /// OSMD プレイヘッドの 1 小節あたり秒数（練習速度を反映）。
    var effectiveMeasureDurationSec: Double {
        let bpm = resolveEffectivePracticeBpm()
        return 60.0 / Double(max(1, bpm)) * Double(max(1, stage.beatsPerMeasure))
    }

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishSnapshot()
    }

    func detachScene() {
        scene = nil
    }

    func handleEffectImpact(effectId: Int) {
        battleEffectClearTasks[effectId]?.cancel()
        battleEffectClearTasks[effectId] = nil
        guard let handler = pendingImpactHandlers.removeValue(forKey: effectId) else {
            Log.battle.debug("EarTrainingChordOSMD effectImpact no handler effectId=\(effectId)")
            return
        }
        Log.battle.debug("EarTrainingChordOSMD effectImpact run effectId=\(effectId)")
        handler()
    }

    func start() {
        audio.stopDrumLoop()
        audio.stopPhrase()
        audio.start()
        audio.onTimeUpdate = { [weak self] currentTime in
            Task { @MainActor in
                self?.handleAudioTimeUpdate(currentTime: currentTime)
            }
        }
        audio.onEnded = { [weak self] in
            Task { @MainActor in
                self?.finishCurrentPhraseIfNeeded()
            }
        }
        publishSnapshot()
        scheduleLobbyMusicXMLPreload()
        guard tutorialHooks?.ui.hideLobby == true else { return }
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 120_000_000)
            guard let self, self.gameState == .idle else { return }
            self.startBattle()
        }
    }

    /// ロビー（`gameState == .idle`）でも OSMD にフレーズ1の譜面を出す。`startBattle` 前は `loadMusicXML` が走らないため、未設定だと楽譜枠に説明テキストのみ表示されていた。
    private func scheduleLobbyMusicXMLPreload() {
        guard gameState == .idle, let first = phrases.first, first.musicXmlUrl != nil else { return }
        Task { @MainActor [weak self] in
            guard let self else { return }
            await self.loadMusicXML(for: first)
        }
    }

    func tearDown() {
        cancelAllTasks()
        audio.onTimeUpdate = nil
        audio.onEnded = nil
        audio.stopDrumLoop()
        audio.stopPhrase()
        audio.stop()
        midiHeldKeys.removeAll()
        voicingHintIntensities = [:]
        musicXMLText = nil
        scoreTimelineArmed = false
        activeMeasureNumber = 1
        rhythmMusicXmlForAttacks = nil
        rhythmAttacks = []
        phraseLyricEvents = []
        nextLyricQuoteIndex = 0
        scene = nil
    }

    func registerMidiKeyDown(_ midi: Int) { midiHeldKeys.insert(midi) }
    func registerMidiKeyUp(_ midi: Int) { midiHeldKeys.remove(midi) }
    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func handleBack() {
        cancelAllTasks()
        audio.stopDrumLoop()
        audio.stopPhrase()
        onExitCallback()
    }

    func startBattle() {
        guard !phrases.isEmpty else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        cancelAllTasks()
        audio.stopDrumLoop()
        audio.stopPhrase()
        progressSaveStarted = false
        lessonProgressStatus = nil
        pendingImpactHandlers.removeAll()
        battleEffectIdCounter = 0
        lastEmittedEffectId = -1
        enemyHp = stage.enemyHp
        playerHp = stage.playerHp
        phraseIndex = 0
        phraseRunId = 0
        phraseIntroSeq = 0
        totalCompletedTargets = 0
        totalJudgedTargets = 0
        lastRankStorage = nil
        if tutorialHooks != nil {
            tutorialOsmdLoopCount = 0
        }
        startPhrase(at: 0)
    }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        if !value {
            voicingHintIntensities = [:]
            practiceTransposeOffset = 0
            practiceSpeedPercent = 100
            audio.phrasePitchSemitones = 0
            audio.phrasePlaybackSpeedPercent = 100
        }
        publishSnapshot()
    }

    func handleNoteOn(midi: Int, velocity: Int = 100, playAudio: Bool = true) {
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
        }
        let nowMs = CACurrentMediaTime() * 1000
        if nowMs - (lastInputAtByNote[midi] ?? 0) < Self.inputCooldownMs { return }
        lastInputAtByNote[midi] = nowMs
        guard gameState == .playingPhrase || gameState == .countIn else { return }
        guard let phraseTime = osmdPhraseTimelineSecNow() else { return }
        handleAudioTimeUpdate(currentTime: phraseTime)
        compactActiveTargets()

        let judgmentWindow = resolveEffectiveTimingWindowSec(Self.judgmentWindowSec)
        var matchedIndex: Int?
        for index in targets.indices {
            guard targets[index].completed == false, targets[index].failed == false else { continue }
            let judged = resolveCalibratedTargetTimeSec(targets[index].targetTimeSec)
            let delta = phraseTime - judged
            guard delta >= -judgmentWindow, delta <= judgmentWindow else { continue }
            if targets[index].consume(midi: midi) {
                matchedIndex = index
                break
            }
        }
        guard let matchedIndex else {
            refreshPracticeVoicingHints()
            return
        }
        if targets[matchedIndex].isComplete {
            let timingOffsetSec = abs(phraseTime - resolveCalibratedTargetTimeSec(targets[matchedIndex].targetTimeSec))
            completeTarget(at: matchedIndex, timingOffsetSec: timingOffsetSec)
        }
        refreshPracticeVoicingHints()
    }

    func handleNoteOff(midi: Int, playAudio: Bool = true) {
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: midi)
        }
    }

    private var sanitizedCountInBeats: Int {
        max(0, min(32, stage.countInBeats))
    }

    private func phraseTutorialLoopDurationSec(_ phrase: EarTrainingPhraseDetail) -> Double {
        let dur = phrase.loopDurationSec
        if dur.isFinite && dur > 0 {
            return EarTrainingPracticeSpeed.scalePracticePhraseLoopEndSec(
                dur,
                speedPercent: effectivePracticeSpeedPercent()
            )
        }
        let beatDuration = 60.0 / Double(max(1, resolveEffectivePracticeBpm()))
        return beatDuration * Double(max(1, stage.loopMeasures))
    }

    private func localizedTutorialOsmdTimedText(_ text: EarTrainingTutorialLocalizedText) -> String {
        isEnglishCopy ? text.en : text.ja
    }

    private func cancelTutorialOsmdTimedLineWorks() {
        for work in tutorialOsmdTimedLineWorks {
            work.cancel()
        }
        tutorialOsmdTimedLineWorks.removeAll()
    }

    private func computeOsmdTimedLineDelayMs(loopIndex: Int, line: EarTrainingTutorialOsmdTimedLine) -> Double? {
        let bpm = max(1, practiceMode ? resolveEffectivePracticeBpm() : stage.bpm)
        let beatDurationSec = 60.0 / Double(bpm)
        let measureDurationSec = beatDurationSec * Double(max(1, stage.beatsPerMeasure))
        let countInBeats = sanitizedCountInBeats
        let countInDurationSec = Double(countInBeats) * beatDurationSec
        let skipCountIn = loopIndex > 0

        switch line {
        case let .countIn(loop: optionalLoop, beat: beat, _):
            if skipCountIn {
                return nil
            }
            let targetLoop = optionalLoop ?? 0
            if targetLoop != loopIndex {
                return nil
            }
            let clampedBeat = max(1, beat)
            if clampedBeat > countInBeats {
                return nil
            }
            return Double(clampedBeat - 1) * beatDurationSec * 1000
        case let .at(loop: atLoop, measure: measure, beat: beat, _):
            if atLoop != loopIndex {
                return nil
            }
            let countInOffsetSec = skipCountIn ? 0 : countInDurationSec
            let measureIndex = max(1, measure) - 1
            let beatIndex = max(1, beat) - 1
            guard phrases.indices.contains(phraseIndex) else { return nil }
            let phrase = phrases[phraseIndex]
            let phraseOffsetSec = Double(measureIndex) * measureDurationSec + Double(beatIndex) * beatDurationSec
            let loopDur = phraseTutorialLoopDurationSec(phrase)
            let loopOffsetSec = Double(loopIndex) * loopDur
            return (loopOffsetSec + countInOffsetSec + phraseOffsetSec) * 1000
        }
    }

    private func scheduleTutorialOsmdTimedDialogue(loopIndex: Int, runId: Int) {
        cancelTutorialOsmdTimedLineWorks()
        guard tutorialHooks != nil, let rows = tutorialHooks?.osmdTimedLines, !rows.isEmpty else { return }

        let mainQueue = DispatchQueue.main
        for line in rows {
            guard let delayMs = computeOsmdTimedLineDelayMs(loopIndex: loopIndex, line: line) else { continue }
            let text: String
            switch line {
            case let .countIn(_, _, loc),
                 let .at(_, _, _, loc):
                text = localizedTutorialOsmdTimedText(loc)
            }
            let capturedRunId = runId
            let work = DispatchWorkItem { [weak self] in
                guard let self else { return }
                guard self.phraseRunId == capturedRunId else { return }
                guard self.gameState == .countIn || self.gameState == .playingPhrase else { return }
                self.scene?.setPlayerQuote(text)
                self.tutorialHooks?.onCharacterText(text)
            }
            tutorialOsmdTimedLineWorks.append(work)
            let delaySeconds = delayMs / 1000
            mainQueue.asyncAfter(deadline: .now() + delaySeconds, execute: work)
        }
    }

    private func resolvedTutorialDrumLoopURL() -> URL? {
        guard let raw = tutorialHooks?.tutorialDrumLoopUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
            return nil
        }
        return URL(string: raw)
    }

    private func startTutorialDrumIfNeeded(phraseAudioUrl: String) {
        guard tutorialHooks != nil else { return }
        guard EarTrainingTutorialOsmdDrumLoopResolver.shouldStartTutorialOsmdDrumLoop(
            phraseAudioUrl: phraseAudioUrl,
            drumLoopUrl: tutorialHooks?.tutorialDrumLoopUrl
        ) else { return }
        guard let url = resolvedTutorialDrumLoopURL() else { return }
        Task { @MainActor [weak self] in
            guard let self else { return }
            let ok = await self.audio.prepareDrumLoop(url: url)
            guard ok else { return }
            self.audio.startDrumLoop()
        }
    }

    private func startPhrase(at index: Int) {
        guard phrases.indices.contains(index) else {
            finishStageClear()
            return
        }
        phrasePrepareTask?.cancel()
        phrasePrepareTask = Task { @MainActor [weak self] in
            await self?.prepareAndSchedulePhrase(at: index)
        }
    }

    private func prepareAndSchedulePhrase(at index: Int) async {
        guard phrases.indices.contains(index) else { return }
        let phrase = phrases[index]
        guard let audioURL = URL(string: phrase.audioUrl) else {
            finishGameOver(message: copy.audioFailed)
            return
        }

        countdownTask?.cancel()
        cancelTutorialOsmdTimedLineWorks()
        if tutorialHooks == nil {
            audio.stopDrumLoop()
        }
        audio.stopPhrase()

        phraseIndex = index
        phraseRunId += 1
        phraseIntroSeq += 1
        let runId = phraseRunId
        targets = []
        resetPhraseRuntimeState()
        scoreTimelineArmed = false
        countInValue = 0
        gameState = .countIn
        statusText = copy.countIn
        publishSnapshot()

        await loadMusicXML(for: phrase)
        if Task.isCancelled { return }

        let xmlAttacks = rhythmAttacks

        let preparedTargets = Self.makeRhythmTargets(
            phrase: phrase,
            bpm: stage.bpm,
            beatsPerMeasure: stage.beatsPerMeasure,
            attacks: xmlAttacks,
            fromScore: stage.resolvedOsmdTargetsFromScore
        )
        guard !preparedTargets.isEmpty else {
            finishGameOver(message: isEnglishCopy ? "No chord timings are registered." : "判定用コードタイミングが登録されていません")
            return
        }

        targets = preparedTargets
        applyKeyboardScrollAnchor(maxMidi: Self.resolveKeyboardScrollMaxMidi(attacks: xmlAttacks, targets: preparedTargets))
        resetPhraseRuntimeState()
        let initialMeasureNumber = max(1, targets.first?.measureNumber ?? 1)

        let prepared = await audio.preparePhraseForImmediatePlayback(url: audioURL)
        if Task.isCancelled { return }
        guard prepared else {
            audio.emitNegativePhraseTimelineBeforeAnchor = false
            finishGameOver(message: copy.audioFailed)
            return
        }
        audio.phrasePitchSemitones = Float(effectivePracticeTransposeOffset())
        audio.phrasePlaybackSpeedPercent = Float(effectivePracticeSpeedPercent())

        scoreTimelineArmed = true
        activeMeasureNumber = initialMeasureNumber
        publishSnapshot()

        if tutorialHooks != nil {
            scheduleTutorialOsmdTimedDialogue(loopIndex: tutorialOsmdLoopCount, runId: runId)
        }

        let onStarted: () -> Void = { [weak self] in
            guard let self else { return }
            guard self.phraseRunId == runId else { return }
            self.audio.emitNegativePhraseTimelineBeforeAnchor = false
            self.countInValue = 0
            self.gameState = .playingPhrase
            self.statusText = self.copy.phraseLabel(indexOneBased: index + 1)
            self.startTutorialDrumIfNeeded(phraseAudioUrl: phrase.audioUrl)
            self.handleAudioTimeUpdate(currentTime: 0)
            self.publishSnapshot()
        }

        let scheduleStart = CACurrentMediaTime()
        audio.emitNegativePhraseTimelineBeforeAnchor = true
        if let meta = audio.schedulePreparedPhraseWithCountIn(
            url: audioURL,
            countInBeats: sanitizedCountInBeats,
            bpm: resolveEffectivePracticeBpm(),
            onPhraseStarted: onStarted
        ) {
            countdownTask = Task { @MainActor [weak self] in
                await self?.runCountInDisplayOnly(scheduleStart: scheduleStart, meta: meta)
            }
        } else if !audio.playPreparedPhrase(url: audioURL, onStarted: onStarted) {
            audio.emitNegativePhraseTimelineBeforeAnchor = false
            finishGameOver(message: copy.audioFailed)
        }
    }

    private func resetPhraseRuntimeState() {
        activeTargetIndices.removeAll(keepingCapacity: true)
        lastInputAtByNote.removeAll(keepingCapacity: true)
        nextActiveTargetIndex = 0
        nextMissTargetIndex = 0
        nextHammerTargetIndex = 0
        completedTargetCount = 0
        failedTargetCount = 0
        runtimeCompletedTargetCount = 0
        runtimeFailedTargetCount = 0
        phraseAccuracy = 0
        phraseEnding = false
        enemyAttackGaugePercent = 0
        nextLyricQuoteIndex = 0
        scene?.setPlayerQuote(nil)
    }

    private func runCountInDisplayOnly(scheduleStart: TimeInterval, meta: EarTrainingScheduledCountInPhrase) async {
        let beats = meta.countInBeats
        guard beats > 0 else {
            countInValue = 0
            publishSnapshot()
            return
        }
        countInValue = 0
        statusText = copy.countIn
        publishSnapshot()
        for beatIndex in 0..<beats {
            let targetClick = scheduleStart + meta.leadInSec + Double(beatIndex) * meta.beatDurationSec
            let sleepSec = targetClick - CACurrentMediaTime()
            if sleepSec > 0 {
                try? await Task.sleep(nanoseconds: UInt64(sleepSec * 1_000_000_000))
            }
            if Task.isCancelled { return }
            countInValue = max(beats - beatIndex, 1)
            statusText = copy.countIn
            publishSnapshot()
        }
    }

    private func loadMusicXML(for phrase: EarTrainingPhraseDetail) async {
        let cacheKey = Self.musicXmlCacheKey(phraseId: phrase.id)
        if let cached = musicXMLCache[cacheKey] {
            applyMusicXmlPrepared(cached)
            return
        }
        guard let rawURL = phrase.musicXmlUrl, let url = URL(string: rawURL) else {
            musicXMLText = nil
            musicXMLMaxStaffLayers = 1
            rhythmMusicXmlForAttacks = nil
            rhythmAttacks = []
            phraseLyricEvents = []
            practiceOriginalKeyFifths = 0
            practiceOriginalKeyName = "—"
            scoreErrorText = isEnglishCopy ? "MusicXML is not registered." : "MusicXMLが登録されていません"
            keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
            return
        }
        do {
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                musicXMLText = nil
                musicXMLMaxStaffLayers = 1
                rhythmMusicXmlForAttacks = nil
                rhythmAttacks = []
                phraseLyricEvents = []
                practiceOriginalKeyFifths = 0
                practiceOriginalKeyName = "—"
                scoreErrorText = isEnglishCopy ? "Could not load MusicXML." : "MusicXMLを読み込めませんでした"
                keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
                return
            }
            guard let text = String(data: data, encoding: .utf8), text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
                musicXMLText = nil
                musicXMLMaxStaffLayers = 1
                rhythmMusicXmlForAttacks = nil
                rhythmAttacks = []
                phraseLyricEvents = []
                practiceOriginalKeyFifths = 0
                practiceOriginalKeyName = "—"
                scoreErrorText = isEnglishCopy ? "MusicXML is empty." : "MusicXMLが空です"
                keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
                return
            }
            let prepared = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXmlWithMeta(text)
            let baseDisplayXml = EarTrainingChordOsmdMusicXmlNormalizer.stripLyricsFromMusicXml(prepared.xml)
            let lyricEvents = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlLyrics(
                prepared.xml,
                bpm: Double(stage.bpm),
                beatsPerMeasure: stage.beatsPerMeasure
            )
            let boxed = MusicXmlPrepared(
                baseRhythmXml: prepared.xml,
                baseDisplayXml: baseDisplayXml,
                maxStaffLayers: prepared.maxStaffLayers,
                lyricEvents: lyricEvents
            )
            musicXMLCache[cacheKey] = boxed
            applyMusicXmlPrepared(boxed)
        } catch {
            musicXMLText = nil
            musicXMLMaxStaffLayers = 1
            rhythmMusicXmlForAttacks = nil
            rhythmAttacks = []
            phraseLyricEvents = []
            practiceOriginalKeyFifths = 0
            practiceOriginalKeyName = "—"
            scoreErrorText = isEnglishCopy ? "Could not load MusicXML." : "MusicXMLを読み込めませんでした"
            keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
        }
    }

    private func applyMusicXmlPrepared(_ cached: MusicXmlPrepared) {
        let offset = effectivePracticeTransposeOffset()
        let rhythmXml = EarTrainingMusicXmlTransposer.applyPracticeTransposeToMusicXml(cached.baseRhythmXml, offset: offset)
        let displayXml = EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(offset) == 0
            ? cached.baseDisplayXml
            : EarTrainingChordOsmdMusicXmlNormalizer.stripLyricsFromMusicXml(rhythmXml)
        let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(rhythmXml)
        let lyricEvents = offset == 0
            ? cached.lyricEvents
            : EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlLyrics(
                rhythmXml,
                bpm: Double(stage.bpm),
                beatsPerMeasure: stage.beatsPerMeasure
            )
        let originalFifths = EarTrainingMusicXmlTransposer.readKeyFifths(fromMusicXml: cached.baseRhythmXml)
        practiceOriginalKeyFifths = originalFifths
        practiceOriginalKeyName = EarTrainingMusicXmlTransposer.preferredKeyName(fifths: originalFifths)
        musicXMLText = displayXml
        musicXMLMaxStaffLayers = cached.maxStaffLayers
        rhythmMusicXmlForAttacks = rhythmXml
        rhythmAttacks = attacks
        phraseLyricEvents = lyricEvents
        scoreErrorText = nil
        applyKeyboardScrollAnchor(maxMidi: Self.maxMidiFromAttacks(attacks))
    }

    private func applyKeyboardScrollAnchor(maxMidi: Int?) {
        if let maxMidi {
            keyboardScrollAnchorMidi = SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: maxMidi)
        } else {
            keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
        }
    }

    /// 鍵盤スクロールは MusicXML 譜面の音域を優先し、パース済みアタックが無いときだけ判定ターゲットへフォールバックする。
    private static func resolveKeyboardScrollMaxMidi(
        attacks: [ChordOsmdMusicXmlAttack],
        targets: [RhythmTarget]
    ) -> Int? {
        if let fromAttacks = maxMidiFromAttacks(attacks), !attacks.isEmpty {
            return fromAttacks
        }
        return maxMidiFromTargets(targets)
    }

    private static func maxMidiFromAttacks(_ attacks: [ChordOsmdMusicXmlAttack]) -> Int? {
        var maxValue: Int?
        for attack in attacks {
            for midi in attack.midis {
                if maxValue == nil || midi > maxValue! {
                    maxValue = midi
                }
            }
        }
        return maxValue
    }

    private static func maxMidiFromTargets(_ targets: [RhythmTarget]) -> Int? {
        var maxValue: Int?
        for target in targets {
            for midi in target.midiCounts.keys {
                if maxValue == nil || midi > maxValue! {
                    maxValue = midi
                }
            }
        }
        return maxValue
    }

    private func handleAudioTimeUpdate(currentTime: Double) {
        guard !phraseEnding else { return }
        guard gameState == .countIn || gameState == .playingPhrase else { return }

        let phraseTime: Double
        if let wallClock = osmdPhraseTimelineSecNow() {
            phraseTime = gameState == .countIn ? wallClock : max(0, wallClock)
        } else {
            phraseTime = gameState == .countIn ? currentTime : max(0, currentTime)
        }

        if phraseTime >= 0 {
            updateActiveMeasure(for: phraseTime)
        }
        openJudgmentWindows(at: phraseTime)
        throwDueHammers(at: phraseTime)
        failExpiredTargets(at: phraseTime)
        refreshPracticeVoicingHints()
        applyMusicXmlLyricQuotesIfNeeded(phraseTime: phraseTime)

        guard gameState == .playingPhrase else { return }
        let phrase = phrases[phraseIndex]
        let lastTargetEnd = resolveCalibratedTargetTimeSec(targets.last?.targetTimeSec ?? 0)
            + resolveEffectiveTimingWindowSec(Self.judgmentWindowSec) + Self.hammerImpactOffsetSec
        let scaledLoopDuration = EarTrainingPracticeSpeed.scalePracticePhraseLoopEndSec(
            phrase.loopDurationSec,
            speedPercent: effectivePracticeSpeedPercent()
        )
        let safeLoopEnd = max(scaledLoopDuration, lastTargetEnd) + Self.phraseEndPaddingSec
        if phraseTime >= safeLoopEnd {
            finishCurrentPhraseIfNeeded()
        }
    }

    private func applyMusicXmlLyricQuotesIfNeeded(phraseTime: Double) {
        guard !phraseLyricEvents.isEmpty else { return }
        while nextLyricQuoteIndex < phraseLyricEvents.count,
              phraseTime + 1e-9 >= resolveCalibratedTargetTimeSec(phraseLyricEvents[nextLyricQuoteIndex].targetTimeSec)
        {
            scene?.setPlayerQuote(phraseLyricEvents[nextLyricQuoteIndex].text)
            nextLyricQuoteIndex += 1
        }
    }

    private func refreshPracticeVoicingHints() {
        guard practiceMode || stage.resolvedShowKeyboardHintsInBattle else {
            if !voicingHintIntensities.isEmpty {
                voicingHintIntensities = [:]
            }
            return
        }
        guard gameState == .countIn || gameState == .playingPhrase else {
            if !voicingHintIntensities.isEmpty {
                voicingHintIntensities = [:]
            }
            return
        }
        let phraseTime: Double
        if let wallClock = osmdPhraseTimelineSecNow() {
            phraseTime = gameState == .countIn ? wallClock : max(0, wallClock)
        } else {
            phraseTime = gameState == .countIn ? audio.phraseJudgmentTimelineSecNow() : max(0, audio.phraseJudgmentTimelineSecNow())
        }
        let w = resolveEffectiveTimingWindowSec(Self.judgmentWindowSec)
        var tierByMidi: [Int: Int] = [:]
        for target in targets {
            if target.completed || target.failed {
                continue
            }
            let dt = abs(phraseTime - resolveCalibratedTargetTimeSec(target.targetTimeSec))
            if dt > w {
                continue
            }
            let tier: Int
            if dt <= resolveEffectiveTimingWindowSec(Self.osmdVoicingHintStrongSec) {
                tier = 0
            } else if dt <= resolveEffectiveTimingWindowSec(Self.osmdVoicingHintMediumSec) {
                tier = 1
            } else {
                tier = 2
            }
            for (midi, count) in target.remainingMidiCounts where count > 0 {
                if let prev = tierByMidi[midi] {
                    if tier < prev {
                        tierByMidi[midi] = tier
                    }
                } else {
                    tierByMidi[midi] = tier
                }
            }
        }
        var next: [Int: VoicingHintIntensity] = [:]
        next.reserveCapacity(tierByMidi.count)
        for (midi, rawTier) in tierByMidi {
            switch rawTier {
            case 0:
                next[midi] = .strong
            case 1:
                next[midi] = .medium
            default:
                next[midi] = .soft
            }
        }
        if next != voicingHintIntensities {
            voicingHintIntensities = next
        }
    }

    private func updateActiveMeasure(for time: Double) {
        let beatDuration = 60.0 / Double(max(1, resolveEffectivePracticeBpm()))
        let measureDuration = beatDuration * Double(max(1, stage.beatsPerMeasure))
        guard measureDuration > 0 else { return }
        let rawMeasure = Int(floor(time / measureDuration)) + 1
        let targetMaxMeasure = targets.map(\.measureNumber).max() ?? 1
        /// Web の `tickerMeasureCount`（phrase.loop_duration_sec から算出）と揃える
        let loopMeasureCapFromPhraseDuration: Int
        if phrases.indices.contains(phraseIndex), phrases[phraseIndex].loopDurationSec > 0 {
            loopMeasureCapFromPhraseDuration = min(
                512,
                max(1, Int(ceil(phrases[phraseIndex].loopDurationSec / measureDuration)))
            )
        } else {
            loopMeasureCapFromPhraseDuration = stage.loopMeasures
        }
        let maxMeasure = max(loopMeasureCapFromPhraseDuration, stage.loopMeasures, targetMaxMeasure)
        let nextMeasure = max(1, min(maxMeasure, rawMeasure))
        if nextMeasure != activeMeasureNumber {
            activeMeasureNumber = nextMeasure
        }
    }

    private func openJudgmentWindows(at time: Double) {
        let judgmentWindow = resolveEffectiveTimingWindowSec(Self.judgmentWindowSec)
        while nextActiveTargetIndex < targets.count {
            let target = targets[nextActiveTargetIndex]
            guard time >= resolveCalibratedTargetTimeSec(target.targetTimeSec) - judgmentWindow else { break }
            activeTargetIndices.append(nextActiveTargetIndex)
            nextActiveTargetIndex += 1
        }
        compactActiveTargets(currentTime: time)
    }

    private func throwDueHammers(at time: Double) {
        while nextHammerTargetIndex < targets.count {
            let target = targets[nextHammerTargetIndex]
            let throwTime = resolveCalibratedTargetTimeSec(target.targetTimeSec) - Self.hammerLeadSec
            guard time >= throwTime else { break }
            let impactTime = resolveCalibratedTargetTimeSec(target.targetTimeSec) + Self.hammerImpactOffsetSec
            let travel = max(0.12, impactTime - time)
            let effectId = triggerBattleEffect(
                kind: .osmdHammer,
                label: nil,
                damage: nil,
                phraseNoteCount: nil,
                travelDurationSec: travel
            )
            let targetIndex = nextHammerTargetIndex
            targets[targetIndex].hammerEffectId = effectId
            registerBattleEffectImpact(effectId: effectId) { [weak self] in
                self?.handleHammerImpact(targetIndex: targetIndex)
            }
            nextHammerTargetIndex += 1
        }
    }

    private func failExpiredTargets(at time: Double) {
        let judgmentWindow = resolveEffectiveTimingWindowSec(Self.judgmentWindowSec)
        var changed = false
        while nextMissTargetIndex < targets.count {
            let target = targets[nextMissTargetIndex]
            guard time > resolveCalibratedTargetTimeSec(target.targetTimeSec) + judgmentWindow else { break }
            if targets[nextMissTargetIndex].completed == false, targets[nextMissTargetIndex].failed == false {
                targets[nextMissTargetIndex].failed = true
                changed = true
                triggerFeedback(.miss)
                statusText = isEnglishCopy ? "Miss" : "ミス"
            }
            nextMissTargetIndex += 1
        }
        if changed {
            updateTargetCounters(publish: false)
            compactActiveTargets(currentTime: time)
        }
    }

    private func completeTarget(at index: Int, timingOffsetSec: Double) {
        guard targets.indices.contains(index) else { return }
        guard targets[index].completed == false, targets[index].failed == false else { return }
        targets[index].completed = true
        targets[index].reflected = true
        let incomingHammerEffectId = targets[index].hammerEffectId
        if let incomingHammerEffectId {
            pendingImpactHandlers[incomingHammerEffectId] = nil
        }
        let chordName = targets[index].label
        let damage = practiceMode ? 0 : stage.perCorrectNoteDamage
        let reflectRelatedId = incomingHammerEffectId
        let effectId = triggerBattleEffect(
            kind: .osmdHammerReflect,
            label: chordName,
            damage: damage,
            phraseNoteCount: nil,
            relatedEffectId: reflectRelatedId,
            precise: timingOffsetSec <= resolveEffectiveTimingWindowSec(Self.preciseWindowSec)
        )
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            self?.applyEnemyDamage(damage)
        }
        let statusNow = CACurrentMediaTime()
        if statusNow - lastStatusUpdateAt >= Self.statusTextThrottleSec {
            lastStatusUpdateAt = statusNow
            statusText = copy.chordCompleted(chordName: chordName)
        }
        updateTargetCounters(publish: false)
        compactActiveTargets(currentTime: osmdPhraseTimelineSecNow() ?? audio.currentTimeSec)
    }

    private func handleHammerImpact(targetIndex: Int) {
        guard targets.indices.contains(targetIndex) else { return }
        guard targets[targetIndex].completed == false, targets[targetIndex].reflected == false else { return }
        if targets[targetIndex].failed == false {
            targets[targetIndex].failed = true
            updateTargetCounters(publish: false)
        }
        guard practiceMode == false, tutorialNoCombat == false else { return }
        let damage = stage.missDamage
        guard damage > 0 else { return }
        playerHp = max(0, playerHp - damage)
        if playerHp <= 0 {
            finishGameOver(message: copy.gameOver)
        }
    }

    private func finishCurrentPhraseIfNeeded() {
        guard gameState == .playingPhrase, !phraseEnding else { return }
        if let hooks = tutorialHooks {
            phraseEnding = true
            tutorialOsmdLoopCount += 1
            if tutorialOsmdLoopCount >= hooks.requiredSuccessfulLoops {
                cancelTutorialOsmdTimedLineWorks()
                audio.stopDrumLoop()
                audio.stopPhrase()
                hooks.onSceneComplete()
                return
            }
            phraseEnding = false
            audio.stopPhrase()
            startPhrase(at: phraseIndex)
            return
        }
        phraseEnding = true
        audio.stopPhrase()
        audio.emitNegativePhraseTimelineBeforeAnchor = false
        failRemainingTargets()
        updateTargetCounters(publish: true)
        let phraseTotal = max(1, targets.count)
        let accuracy = Double(runtimeCompletedTargetCount) / Double(phraseTotal)
        phraseAccuracy = accuracy
        totalCompletedTargets += runtimeCompletedTargetCount
        totalJudgedTargets += phraseTotal

        let rank = rank(for: accuracy)
        let completionDamageAmount = practiceMode ? 0 : completionDamage(for: rank)
        let playerFailDamage = (!practiceMode && !tutorialNoCombat && rank == .fail) ? stage.failDamage : 0

        gameState = .phraseComplete
        statusText = isEnglishCopy
            ? "Phrase accuracy \(Int(round(accuracy * 100)))%"
            : "フレーズ正解率 \(Int(round(accuracy * 100)))%"
        publishSnapshot()

        if completionDamageAmount > 0 {
            let phraseNoteCount = Self.totalChordOsmdNoteCount(targets)
            let effectKind: EarTrainingBattleEffectKind = rank == .perfect ? .osmdMeteor : .complete
            let effectId = triggerBattleEffect(
                kind: effectKind,
                label: rank.rawValue,
                damage: completionDamageAmount,
                phraseNoteCount: phraseNoteCount
            )
            registerBattleEffectImpact(effectId: effectId) { [weak self] in
                self?.applyEnemyDamage(completionDamageAmount)
            }
        }

        if playerFailDamage > 0 {
            let effectId = triggerBattleEffect(
                kind: .fail,
                label: "Fail",
                damage: playerFailDamage,
                phraseNoteCount: nil
            )
            registerBattleEffectImpact(effectId: effectId) { [weak self] in
                self?.applyPlayerDamage(playerFailDamage)
            }
        }

        if !practiceMode && enemyHp - completionDamageAmount <= 0 {
            return
        }
        if !practiceMode && playerHp - playerFailDamage <= 0 {
            return
        }

        let nextIndex = (phraseIndex + 1) % max(1, phrases.count)
        guard enemyHp > 0, playerHp > 0 else { return }
        startPhrase(at: nextIndex)
    }

    private func failRemainingTargets() {
        var changed = false
        for index in targets.indices {
            if targets[index].completed == false, targets[index].failed == false {
                targets[index].failed = true
                changed = true
            }
        }
        if changed {
            updateTargetCounters(publish: true)
        }
    }

    private func applyEnemyDamage(_ damage: Int) {
        guard !practiceMode else { return }
        guard damage > 0 else { return }
        enemyHp = max(0, enemyHp - damage)
        if enemyHp <= 0 {
            finishStageClear()
        }
    }

    private func applyPlayerDamage(_ damage: Int) {
        guard !practiceMode, !tutorialNoCombat else { return }
        guard damage > 0 else { return }
        playerHp = max(0, playerHp - damage)
        if playerHp <= 0 {
            finishGameOver(message: copy.gameOver)
        }
    }

    private func updateTargetCounters(publish: Bool) {
        var completed = 0
        var failed = 0
        for target in targets {
            if target.completed {
                completed += 1
            } else if target.failed {
                failed += 1
            }
        }
        runtimeCompletedTargetCount = completed
        runtimeFailedTargetCount = failed
        guard publish else { return }
        completedTargetCount = completed
        failedTargetCount = failed
        phraseAccuracy = targets.isEmpty ? 0 : Double(completed) / Double(targets.count)
    }

    private func compactActiveTargets(currentTime: Double? = nil) {
        let judgmentWindow = resolveEffectiveTimingWindowSec(Self.judgmentWindowSec)
        var writeIndex = 0
        for index in activeTargetIndices {
            guard targets.indices.contains(index) else { continue }
            let target = targets[index]
            if target.completed || target.failed {
                continue
            }
            if let currentTime, currentTime > resolveCalibratedTargetTimeSec(target.targetTimeSec) + judgmentWindow {
                continue
            }
            activeTargetIndices[writeIndex] = index
            writeIndex += 1
        }
        if writeIndex < activeTargetIndices.count {
            activeTargetIndices.removeSubrange(writeIndex..<activeTargetIndices.count)
        }
    }

    private func finishStageClear() {
        guard gameState != .stageClear else { return }
        cancelAllTasks(keepsAudio: true)
        audio.stopDrumLoop()
        audio.stopPhrase()
        gameState = .stageClear
        QuestJinglePlayer.playComplete()
        let accuracy = totalJudgedTargets == 0 ? phraseAccuracy : Double(totalCompletedTargets) / Double(max(1, totalJudgedTargets))
        lastRankStorage = rank(for: accuracy)
        statusText = copy.stageClear
        publishSnapshot()
        saveLessonProgressIfNeeded(rank: lastRankStorage ?? .good)
    }

    private func finishGameOver(message: String) {
        cancelAllTasks(keepsAudio: true)
        audio.stopDrumLoop()
        audio.stopPhrase()
        gameState = .gameOver
        QuestJinglePlayer.playGameOver()
        statusText = message
        publishSnapshot()
    }

    private func rank(for accuracy: Double) -> EarTrainingRank {
        if accuracy >= 0.98 { return .perfect }
        if accuracy >= 0.8 { return .great }
        if accuracy >= 0.4 { return .good }
        return .fail
    }

    private func completionDamage(for rank: EarTrainingRank) -> Int {
        switch rank {
        case .perfect: return stage.perfectCompletionDamage
        case .great: return stage.greatCompletionDamage
        case .good: return stage.goodCompletionDamage
        case .fail: return 0
        }
    }

    private static func totalChordOsmdNoteCount(_ targets: [RhythmTarget]) -> Int {
        targets.reduce(0) { partial, target in
            partial + target.midiCounts.values.reduce(0, +)
        }
    }

    private func saveLessonProgressIfNeeded(rank: EarTrainingRank) {
        guard let lessonContext, !practiceMode, !progressSaveStarted else { return }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                _ = try await self.supabase.recordEarTrainingLessonProgress(
                    lessonId: lessonContext.lessonId,
                    lessonSongId: lessonContext.lessonSongId,
                    rank: rank.rawValue,
                    clearConditions: lessonContext.clearConditions
                )
                self.lessonProgressStatus = .saved
            } catch {
                self.lessonProgressStatus = .saving
            }
        }
    }

    private func triggerFeedback(_ value: EarTrainingBattleController.Feedback) {
        feedback = value
        feedbackTask?.cancel()
        feedbackTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 220_000_000)
            if self?.feedback == value {
                self?.feedback = nil
            }
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
        relatedEffectId: Int? = nil,
        travelDurationSec: Double? = nil,
        precise: Bool = false
    ) -> Int {
        battleEffectIdCounter += 1
        let id = battleEffectIdCounter
        let command = EarTrainingBattleEffectCommand(
            id: id,
            kind: kind,
            label: label,
            damage: damage,
            phraseNoteCount: phraseNoteCount,
            relatedEffectId: relatedEffectId,
            travelDurationSec: travelDurationSec,
            precise: precise
        )
        if lastEmittedEffectId != id {
            lastEmittedEffectId = id
            scene?.runEffect(command)
        }
        let ms = Self.effectDurationMs(kind: kind, travelDurationSec: travelDurationSec)
        battleEffectClearTasks[id]?.cancel()
        let clearedId = id
        battleEffectClearTasks[id] = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(ms * 1_000_000))
            guard let self else { return }
            self.pendingImpactHandlers.removeValue(forKey: clearedId)
            self.battleEffectClearTasks[clearedId] = nil
        }
        Log.battle.debug("EarTrainingChordOSMD battleEffect id=\(id) kind=\(String(describing: kind))")
        return id
    }

    private static func effectDurationMs(kind: EarTrainingBattleEffectKind, travelDurationSec: Double?) -> Double {
        switch kind {
        case .osmdHammer:
            return ((travelDurationSec ?? 3.2) * 1000) + effectClearPaddingMs
        case .osmdMeteor:
            return 2_100
        case .osmdHammerReflect:
            return 550
        default:
            return 1_600
        }
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
            phraseIntroLine: "",
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: EarTrainingBattleController.avatarAssetName(stageId: stage.id, enemyId: enemyId),
            enemyAvatarFlipX: EarTrainingBattleController.shouldFlipEnemyAvatar(name: EarTrainingBattleController.avatarAssetName(stageId: stage.id, enemyId: enemyId)),
            fixedCharacterPositions: true,
            showLobbyControls: showLobbyControls,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
    }

    private func cancelAllTasks(keepsAudio: Bool = false) {
        cancelTutorialOsmdTimedLineWorks()
        countdownTask?.cancel(); countdownTask = nil
        feedbackTask?.cancel(); feedbackTask = nil
        for (_, task) in battleEffectClearTasks {
            task.cancel()
        }
        battleEffectClearTasks.removeAll()
        phrasePrepareTask?.cancel(); phrasePrepareTask = nil
        if !keepsAudio {
            audio.stopPhrase()
        }
    }

    var hudModel: EarTrainingHudModel {
        let currentIndex = firstUnresolvedTargetIndex()
        let chips = currentChordChips()
        let base = EarTrainingHudModel(
            playerHp: practiceMode ? stage.playerHp : playerHp,
            playerMaxHp: stage.playerHp,
            enemyHp: practiceMode ? stage.enemyHp : enemyHp,
            enemyMaxHp: stage.enemyHp,
            practiceMode: practiceMode,
            timeRemaining: timeRemaining,
            timeLabel: "\(min(phraseIndex + 1, max(1, phrases.count)))/\(max(1, phrases.count))",
            hideTimeLabel: true,
            hidePlayerHpBar: false,
            hideSettingsButton: false,
            hideBackButton: false,
            enemyAttackGaugePercent: 0,
            hideEnemyAttackGauge: true,
            hideChordChips: true,
            hideSlotsRow: true,
            hudLabels: hudLabels,
            gameState: gameState,
            phraseRunId: phraseRunId,
            chordChips: chips,
            slotRow: .chordVoicing(
                slotCount: max(1, targets.count),
                completed: targets.map(\.completed),
                currentIndex: currentIndex
            )
        )
        if let ui = tutorialHooks?.ui {
            return ui.apply(to: base)
        }
        return base
    }

    private func firstUnresolvedTargetIndex() -> Int {
        guard let index = targets.firstIndex(where: { !$0.completed && !$0.failed }) else {
            return max(0, targets.count - 1)
        }
        return index
    }

    private func currentChordChips() -> [EarTrainingChordChip] {
        guard gameState == .playingPhrase || gameState == .countIn else { return [] }
        var chips: [EarTrainingChordChip] = []
        for target in targets where target.measureNumber == activeMeasureNumber {
            chips.append(EarTrainingChordChip(id: target.id, name: target.label, active: !target.completed && !target.failed))
        }
        return chips
    }

    private static func chordOsmdAttackTargetTimeSec(
        measureNumber: Int,
        beatStartInMeasure: Double,
        bpm: Int,
        beatsPerMeasure: Int
    ) -> Double {
        let beatDurationSec = 60.0 / Double(max(1, bpm))
        let bpmSafe = max(1, beatsPerMeasure)
        let measureIndex = max(0, measureNumber - 1)
        let beatIndex = max(0.0, beatStartInMeasure - 1)
        return (Double(measureIndex * bpmSafe) + beatIndex) * beatDurationSec
    }

    /// Web `buildChordOsmdRhythmTargetsFromScore` と同等。
    static func buildRhythmTargetsFromScore(
        chords: [EarTrainingPhraseChordDetail],
        bpm: Int,
        beatsPerMeasure: Int,
        attacks: [ChordOsmdMusicXmlAttack]
    ) -> [(id: UUID, label: String, targetTimeSec: Double, measureNumber: Int, midiCounts: [Int: Int])] {
        var measureLabels: [Int: String] = [:]
        var playableMeasures = Set<Int>()
        var disabledMeasures = Set<Int>()
        for chord in chords {
            guard let measureNumber = chord.measureNumber else { continue }
            let measure = max(1, measureNumber)
            if chord.inputDisabled {
                disabledMeasures.insert(measure)
                continue
            }
            playableMeasures.insert(measure)
            if measureLabels[measure] == nil {
                measureLabels[measure] = chord.chordName
            }
        }
        guard !attacks.isEmpty else { return [] }
        // chords を持たないフレーズ（MusicXML の音符のみで判定）は全アタックを採用する。
        let useAllScoreMeasures = playableMeasures.isEmpty && disabledMeasures.isEmpty

        let sortedAttacks = attacks
            .filter { attack in
                if useAllScoreMeasures { return true }
                if playableMeasures.isEmpty { return false }
                return playableMeasures.contains(attack.measureNumber)
            }
            .sorted { lhs, rhs in
                let lhsTime = chordOsmdAttackTargetTimeSec(
                    measureNumber: lhs.measureNumber,
                    beatStartInMeasure: lhs.beatStartInMeasure,
                    bpm: bpm,
                    beatsPerMeasure: beatsPerMeasure
                )
                let rhsTime = chordOsmdAttackTargetTimeSec(
                    measureNumber: rhs.measureNumber,
                    beatStartInMeasure: rhs.beatStartInMeasure,
                    bpm: bpm,
                    beatsPerMeasure: beatsPerMeasure
                )
                if abs(lhsTime - rhsTime) > 0.0005 { return lhsTime < rhsTime }
                if lhs.measureNumber != rhs.measureNumber { return lhs.measureNumber < rhs.measureNumber }
                return lhs.beatStartInMeasure < rhs.beatStartInMeasure
            }

        return sortedAttacks.map { attack in
            var midiCounts: [Int: Int] = [:]
            for midi in attack.midis {
                midiCounts[midi, default: 0] += 1
            }
            let targetTimeSec = chordOsmdAttackTargetTimeSec(
                measureNumber: attack.measureNumber,
                beatStartInMeasure: attack.beatStartInMeasure,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure
            )
            let beatKey = Int((attack.beatStartInMeasure * 10_000).rounded())
            let lo = UInt64(max(0, attack.measureNumber)) << 32 | UInt64(bitPattern: Int64(beatKey))
            let idString = String(format: "a0000000-0000-4000-8000-%012llx", lo & 0x0000FFFFFFFFFFFF)
            let id = UUID(uuidString: idString) ?? UUID()
            return (
                id: id,
                label: measureLabels[attack.measureNumber] ?? "—",
                targetTimeSec: targetTimeSec,
                measureNumber: attack.measureNumber,
                midiCounts: midiCounts
            )
        }
    }

    private static func makeRhythmTargets(
        phrase: EarTrainingPhraseDetail,
        bpm: Int,
        beatsPerMeasure: Int,
        attacks: [ChordOsmdMusicXmlAttack],
        fromScore: Bool = false
    ) -> [RhythmTarget] {
        if fromScore, !attacks.isEmpty {
            let drafts = Self.buildRhythmTargetsFromScore(
                chords: phrase.chords ?? [],
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                attacks: attacks
            )
            return drafts.map {
                RhythmTarget(
                    id: $0.id,
                    label: $0.label,
                    targetTimeSec: $0.targetTimeSec,
                    measureNumber: $0.measureNumber,
                    midiCounts: $0.midiCounts
                )
            }
        }

        let beatDuration = 60.0 / Double(max(1, bpm))
        let sorted = (phrase.chords ?? []).sorted { lhs, rhs in
            let lhsTime = chordStartTime(lhs, beatDuration: beatDuration, beatsPerMeasure: beatsPerMeasure)
            let rhsTime = chordStartTime(rhs, beatDuration: beatDuration, beatsPerMeasure: beatsPerMeasure)
            if abs(lhsTime - rhsTime) > 0.0005 {
                return lhsTime < rhsTime
            }
            return lhs.orderIndex < rhs.orderIndex
        }
        var result: [RhythmTarget] = []
        for chord in sorted {
            guard let voicing = chord.voicing, !voicing.isEmpty else { continue }
            var midiCounts: [Int: Int] = [:]
            for noteName in voicing {
                guard let midi = EarTrainingChordVoicingEngine.noteNameToMidi(noteName) else { continue }
                midiCounts[midi, default: 0] += 1
            }
            guard !midiCounts.isEmpty else { continue }
            let time = chordStartTime(chord, beatDuration: beatDuration, beatsPerMeasure: beatsPerMeasure)
            let measure = max(1, chord.measureNumber ?? Int(floor(time / (beatDuration * Double(max(1, beatsPerMeasure))))) + 1)

            if !attacks.isEmpty, let beatOff = chord.beatOffset,
               let xmlMerged = EarTrainingChordOsmdMusicXmlNormalizer.mergeMidisFromXmlAttacks(
                   attacks,
                   measureNumber: measure,
                   beatOffset: beatOff
               )
            {
                midiCounts = xmlMerged
            }

            if let lastIndex = result.indices.last,
               abs(result[lastIndex].targetTimeSec - time) <= 0.0005,
               result[lastIndex].measureNumber == measure {
                result[lastIndex].merge(label: chord.chordName, midiCounts: midiCounts)
            } else {
                result.append(
                    RhythmTarget(
                        id: chord.id,
                        label: chord.chordName,
                        targetTimeSec: time,
                        measureNumber: measure,
                        midiCounts: midiCounts
                    )
                )
            }
        }
        return result
    }

    private static func chordStartTime(
        _ chord: EarTrainingPhraseChordDetail,
        beatDuration: Double,
        beatsPerMeasure: Int
    ) -> Double {
        if let start = chord.startTimeSec, start.isFinite {
            return max(0, start)
        }
        if let measure = chord.measureNumber, let beatOffset = chord.beatOffset {
            let beatIndex = max(0, beatOffset - 1)
            return (Double(max(0, measure - 1) * max(1, beatsPerMeasure)) + beatIndex) * beatDuration
        }
        return Double(max(0, chord.orderIndex)) * beatDuration
    }

    private struct RhythmTarget {
        let id: UUID
        var label: String
        let targetTimeSec: Double
        let measureNumber: Int
        var midiCounts: [Int: Int]
        var remainingMidiCounts: [Int: Int]
        var completed: Bool = false
        var failed: Bool = false
        var hammerEffectId: Int?
        var reflected: Bool = false

        init(id: UUID, label: String, targetTimeSec: Double, measureNumber: Int, midiCounts: [Int: Int]) {
            self.id = id
            self.label = label
            self.targetTimeSec = targetTimeSec
            self.measureNumber = measureNumber
            self.midiCounts = midiCounts
            self.remainingMidiCounts = midiCounts
        }

        var isComplete: Bool {
            remainingMidiCounts.values.allSatisfy { $0 <= 0 }
        }

        mutating func consume(midi: Int) -> Bool {
            guard let count = remainingMidiCounts[midi], count > 0 else { return false }
            remainingMidiCounts[midi] = count - 1
            return true
        }

        mutating func merge(label nextLabel: String, midiCounts nextCounts: [Int: Int]) {
            if label != nextLabel, !label.contains(nextLabel) {
                label += " / \(nextLabel)"
            }
            for (midi, count) in nextCounts {
                midiCounts[midi, default: 0] += count
                remainingMidiCounts[midi, default: 0] += count
            }
        }
    }
}

private extension EarTrainingPhraseDetail {
    func localizedTitle(isEnglish: Bool) -> String? {
        let raw = isEnglish ? (titleEn ?? title) : title
        let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed?.isEmpty == false ? trimmed : nil
    }
}

extension EarTrainingChordOSMDBattleController: EarTrainingBattleSceneDriving {}

extension EarTrainingChordOSMDBattleController: EarTrainingPianoPlayable {
    var voicingHintsByMidi: [Int: VoicingHintState] { [:] }

    var voicingHintIntensitiesByMidi: [Int: VoicingHintIntensity]? {
        guard practiceMode || stage.resolvedShowKeyboardHintsInBattle else { return nil }
        return voicingHintIntensities
    }
}

extension EarTrainingChordOSMDBattleController: EarTrainingLobbyPresentable {
    var canChangePracticeMode: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var showLobbyControls: Bool {
        if tutorialHooks?.ui.hideLobby == true {
            return false
        }
        return canChangePracticeMode
    }

    var startButtonLabel: String {
        gameState == .idle ? "START" : "RETRY"
    }

    var resultState: EarTrainingResultState? {
        switch gameState {
        case .stageClear: return .win
        case .gameOver: return .lose
        default: return nil
        }
    }

    var lastRank: EarTrainingRank? {
        lastRankStorage
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

    var stageTitleForLobby: String {
        stage.localizedTitle(isEnglishCopy ? .en : .ja)
    }

    var quizRulesLine: String? {
        if tutorialHooks != nil { return nil }
        return stage.battleClearConditionText(isEnglish: isEnglishCopy)
    }
}
