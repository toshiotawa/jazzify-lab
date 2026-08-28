import Foundation
import Combine
import QuartzCore
import CoreGraphics
import os.log

/// アドリブ C&R バトル: MusicXML voice 1 のオクターブ等価 1 音一致で判定する耳コピバトル。
/// 楽譜表示・remainingCounts 消化型の和音判定は行わない（Web `earTrainingAdlibCallResponse.ts` 相当）。
@MainActor
final class EarTrainingAdlibCallResponseBattleController: ObservableObject {
    /// 精密モードと同じ対称 ±250ms 判定窓。
    private static let judgmentWindowEarlySec: Double = EarTrainingChordOsmdTiming.judgmentWindowEarlySec
    /// 精密モードと同じ対称 ±250ms 判定窓。
    private static let judgmentWindowLateSec: Double = EarTrainingChordOsmdTiming.judgmentWindowLateSec
    /// 正解パリィ成立時は timing offset に関わらずオレンジ精密リングを表示する
    static let parryPreciseRingOnSuccess = true
    /// ターゲット時刻からこの秒数後にハンマー着弾・被ダメ演出
    private static let hammerImpactOffsetSec: Double = 0.3
    /// 正解連打時の statusText 更新間隔（SwiftUI 再描画抑制）
    private static let statusTextThrottleSec: Double = 0.4
    /// フレーズ終了検知のセーフティパディング。
    private static let phraseEndPaddingSec: Double = 0.08
    /// WEB `INPUT_COOLDOWN_MS` 相当（MIDI ノート単位）。
    private static let inputCooldownMs: Double = 20

    private enum Log {
        private static let subsystem = Bundle.main.bundleIdentifier ?? "Jazzify"
        static let battle = Logger(subsystem: subsystem, category: "EarTrainingAdlibCallResponseBattle")
    }

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var phraseRunId: Int = 0
    private var phraseIntroSeq: Int = 0
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int = 0
    @Published private(set) var countInValue: Int
    @Published private(set) var completedTargetCount: Int = 0
    @Published private(set) var failedTargetCount: Int = 0
    @Published private(set) var activeChordSlotIndex: Int = 0
    @Published private(set) var phraseAccuracy: Double = 0
    @Published private(set) var statusText: String
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool
    @Published var practiceTransposeOffset: Int = 0
    @Published var practiceSpeedPercent: Int = 100
    @Published var timingAdjustmentMs: Int = EarTrainingOsmdTimingAdjustment.timingAdjustmentMsDefault
    @Published private(set) var practiceOriginalKeyFifths: Int = 0
    @Published private(set) var practiceOriginalKeyName: String = "—"

    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    /// 設定で有効なとき、判定窓内の未押下ターゲット音（距離で濃さが変わるマリーゴールド）。
    @Published private(set) var voicingHintIntensities: [Int: VoicingHintIntensity] = [:]
    /// MusicXML voice1 由来の鍵盤スクロールアンカー（白鍵 MIDI）。無いときは C4 中央へフォールバック。
    @Published private(set) var keyboardScrollAnchorMidi: Int?
    @Published private(set) var keyboardDisplayRange: PianoStagePitchRange

    let stage: EarTrainingStageDetail
    let phrases: [EarTrainingPhraseDetail]
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy
    let enemyId: String
    let enemyName: String

    var tutorialNoCombat: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    private var tutorialOsmdLoopCount: Int = 0
    private var tutorialOsmdTimedLineWorks: [DispatchWorkItem] = []

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared
    private weak var scene: EarTrainingBattleSceneHandle?

    private var targets: [RuntimeTarget] = []
    private var chordSlots: [AdlibCallResponseChordSlot] = []
    /// `hudModel` は SwiftUI の body 評価ごとに参照されるため、アクティブ index 変化時のみ作り直す。
    private var chordChipsCache: [EarTrainingChordChip] = []
    private var hintGroups: [EarTrainingAdlibCallResponseTargets.HintGroup] = []
    private var nextMissTargetIndex: Int = 0
    private var nextHammerTargetIndex: Int = 0
    private var nextApproachTargetIndex: Int = 0
    private var parryChainAnchor: EarTrainingChordOsmdParrySpanAnchor?
    private var lastInputAtByNote: [Int: Double] = [:]
    private var phraseEnding: Bool = false
    private var progressSaveStarted: Bool = false
    private var totalCompletedTargets: Int = 0
    private var totalJudgedTargets: Int = 0
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var lastEmittedEffectId: Int = -1
    private static let musicXmlCacheSchemaVersion = 1

    private static func musicXmlCacheKey(phraseId: UUID) -> String {
        "\(phraseId.uuidString)|adlibCallResponseXml|v\(musicXmlCacheSchemaVersion)"
    }

    private var musicXMLCache: [String: String] = [:]
    private var rhythmAttacks: [ChordOsmdMusicXmlAttack] = []
    private let stageFallbackKeyboardScrollAnchorMidi: Int?

    private var countdownTask: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private var phrasePrepareTask: Task<Void, Never>?
    private var capturePhraseSuspendedObserver: NSObjectProtocol?
    private var lastRankStorage: EarTrainingRank?
    private var runtimeCompletedTargetCount: Int = 0
    private var runtimeFailedTargetCount: Int = 0
    private var lastStatusUpdateAt: TimeInterval = 0
    private var phraseLoopEndSecCache: Double = 0

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
            ? "Press START to begin rhythm battle."
            : "STARTでリズムバトルを開始します"
        self.practiceMode = initialPracticeMode
        self.timingAdjustmentMs = EarTrainingOsmdTimingAdjustment.loadTimingAdjustmentMs()
        self.stageFallbackKeyboardScrollAnchorMidi = EarTrainingKeyboardScroll.scrollAnchorMidi(for: stage)
        self.keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
        self.keyboardDisplayRange = EarTrainingKeyboardScroll.resolvedDisplayRange(for: stage)
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
        syncActiveOsuApproachCircleTimings()
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

    private func phraseTimelineSecNow() -> Double? {
        audio.phraseWallClockTimelineSecNowOrNil()
    }

    private func resolveEffectivePracticeBpm() -> Int {
        EarTrainingPracticeSpeed.effectivePracticeBpm(
            stage.bpm,
            speedPercent: effectivePracticeSpeedPercent()
        )
    }

    /// ターゲット拍の hammer_lead_measures 小節前にハンマー投擲を開始する秒数
    private func hammerLeadSec() -> Double {
        EarTrainingChordOsmdTiming.hammerLeadSec(
            bpm: Double(resolveEffectivePracticeBpm()),
            beatsPerMeasure: stage.beatsPerMeasure,
            leadMeasures: stage.resolvedHammerLeadMeasures
        )
    }

    private func approachLeadSec() -> Double {
        EarTrainingChordOsmdTiming.approachLeadSec(bpm: Double(resolveEffectivePracticeBpm()))
    }

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishSnapshot()
    }

    func detachScene() {
        scene = nil
    }

    func handleEffectImpact(effectId: Int) {
        guard let handler = pendingImpactHandlers.removeValue(forKey: effectId) else {
            Log.battle.debug("EarTrainingAdlibCallResponse effectImpact no handler effectId=\(effectId)")
            return
        }
        handler()
    }

    func start() {
        audio.stopDrumLoop()
        audio.stopPhrase()
        audio.start()
        audio.onTimeUpdate = { [weak self] currentTime in
            MainActor.assumeIsolated {
                self?.handleAudioTimeUpdate(currentTime: currentTime)
            }
        }
        audio.onEnded = { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                let phraseTime = self.phraseTimelineSecNow() ?? self.audio.currentTimeSec
                if phraseTime + 1e-9 >= self.phraseLoopEndSecCache {
                    self.finishCurrentPhraseIfNeeded()
                }
            }
        }
        capturePhraseSuspendedObserver = NotificationCenter.default.addObserver(
            forName: EarTrainingAudio.phrasePlaybackSuspendedAfterCaptureNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.handlePhraseSuspendedAfterScreenCapture()
            }
        }
        publishSnapshot()
        guard tutorialHooks?.ui.hideLobby == true else { return }
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 120_000_000)
            guard let self, self.gameState == .idle else { return }
            self.startBattle()
        }
    }

    func tearDown(stopSharedAudio: Bool = true) {
        cancelAllTasks()
        if let capturePhraseSuspendedObserver {
            NotificationCenter.default.removeObserver(capturePhraseSuspendedObserver)
            self.capturePhraseSuspendedObserver = nil
        }
        audio.onTimeUpdate = nil
        audio.onEnded = nil
        if stopSharedAudio {
            audio.stop()
        } else {
            audio.stopPhraseEngine()
        }
        midiHeldKeys.removeAll()
        voicingHintIntensities = [:]
        rhythmAttacks = []
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
        audio.ensureBattlePianoReady()
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
        lastEmittedEffectId = -1
        enemyHp = stage.enemyHp
        playerHp = stage.playerHp
        phraseIndex = 0
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
        handleNoteOn(midi: midi, velocity: velocity, playAudio: playAudio, midiHostTime: nil)
    }

    func handleNoteOn(midi: Int, velocity: Int, playAudio: Bool, midiHostTime: UInt64?) {
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
        }
        let nowMs = CACurrentMediaTime() * 1000
        if nowMs - (lastInputAtByNote[midi] ?? 0) < Self.inputCooldownMs { return }
        lastInputAtByNote[midi] = nowMs
        guard gameState == .playingPhrase || gameState == .countIn else { return }
        let phraseTime: Double
        if let midiHostTime, let fromMidi = audio.phraseTimelineSecFromMidiHostTime(midiHostTime) {
            phraseTime = fromMidi
        } else {
            guard let wall = phraseTimelineSecNow() else { return }
            phraseTime = wall
        }

        let judgmentWindowEarly = resolveEffectiveTimingWindowSec(Self.judgmentWindowEarlySec)
        let judgmentWindowLate = resolveEffectiveTimingWindowSec(Self.judgmentWindowLateSec)
        let matchedIndex = EarTrainingChordOsmdTiming.pickNearestTargetIndex(
            targetCount: targets.count,
            phraseTimeSec: phraseTime,
            judgedTargetTimeSec: { [self] index in
                resolveCalibratedTargetTimeSec(targets[index].base.targetTimeSec)
            },
            canMatchTarget: { [self] index in
                guard targets[index].completed == false, targets[index].failed == false else { return false }
                return EarTrainingAdlibCallResponseTargets.matches(targets[index].base, midi: midi)
            },
            earlySec: judgmentWindowEarly,
            lateSec: judgmentWindowLate
        )
        guard let matchedIndex else {
            refreshPracticeVoicingHints()
            return
        }
        completeTarget(at: matchedIndex, hitPhraseTimeSec: phraseTime)
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
        audio.stopDrumLoop()
        audio.stopPhrase()

        phraseIndex = index
        phraseRunId += 1
        phraseIntroSeq += 1
        let runId = phraseRunId
        targets = []
        hintGroups = []
        chordSlots = []
        activeChordSlotIndex = 0
        chordChipsCache = []
        resetPhraseRuntimeState()
        countInValue = 0
        gameState = .countIn
        statusText = copy.countIn
        publishSnapshot()

        let baseXml = await loadMusicXML(for: phrase)
        if Task.isCancelled { return }

        let offset = effectivePracticeTransposeOffset()
        let rhythmXml = baseXml.map {
            EarTrainingMusicXmlTransposer.applyPracticeTransposeToMusicXml($0, offset: offset)
        }
        let attacks = rhythmXml.map {
            EarTrainingAdlibCallResponseTargets.collectAttacks(from: $0)
        } ?? []
        rhythmAttacks = attacks
        chordSlots = rhythmXml.map {
            EarTrainingAdlibCallResponseTargets.buildChordSlots(
                from: $0,
                bpm: Double(stage.bpm),
                beatsPerMeasure: stage.beatsPerMeasure,
                isSwing: stage.resolvedIsSwing
            )
        } ?? []
        activeChordSlotIndex = 0
        rebuildChordChipsCache()

        let preparedTargets = EarTrainingAdlibCallResponseTargets.buildTargets(
            attacks: attacks,
            bpm: Double(stage.bpm),
            beatsPerMeasure: stage.beatsPerMeasure,
            isSwing: stage.resolvedIsSwing
        )
        guard !preparedTargets.isEmpty else {
            finishGameOver(message: isEnglishCopy ? "No chord timings are registered." : "判定用コードタイミングが登録されていません")
            return
        }

        targets = preparedTargets.map(RuntimeTarget.init(base:))
        hintGroups = EarTrainingAdlibCallResponseTargets.buildHintGroups(from: preparedTargets)
        applyKeyboardScrollAnchor(maxMidi: Self.maxMidiFromAttacks(attacks), attacks: attacks)
        resetPhraseRuntimeState()

        let prepared = await audio.preparePhraseForImmediatePlayback(url: audioURL)
        if Task.isCancelled { return }
        guard prepared else {
            audio.emitNegativePhraseTimelineBeforeAnchor = false
            finishGameOver(message: copy.audioFailed)
            return
        }
        audio.phrasePitchSemitones = Float(effectivePracticeTransposeOffset())
        audio.phrasePlaybackSpeedPercent = Float(effectivePracticeSpeedPercent())

        phraseLoopEndSecCache = resolvePhraseLoopEndSec(phrase: phrase)
        if tutorialHooks != nil {
            scheduleTutorialOsmdTimedDialogue(loopIndex: tutorialOsmdLoopCount, runId: runId)
            startTutorialDrumIfNeeded(phraseAudioUrl: phrase.audioUrl)
        }
        publishSnapshot()

        let onStarted: () -> Void = { [weak self] in
            guard let self else { return }
            guard self.phraseRunId == runId else { return }
            self.audio.emitNegativePhraseTimelineBeforeAnchor = false
            self.countInValue = 0
            self.gameState = .playingPhrase
            self.statusText = self.copy.phraseLabel(indexOneBased: index + 1)
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

    private func resolvePhraseLoopEndSec(phrase: EarTrainingPhraseDetail) -> Double {
        let lastTargetEnd = resolveCalibratedTargetTimeSec(targets.last?.base.targetTimeSec ?? 0)
            + resolveEffectiveTimingWindowSec(Self.judgmentWindowLateSec) + Self.hammerImpactOffsetSec
        let scaledLoopDuration = EarTrainingPracticeSpeed.scalePracticePhraseLoopEndSec(
            phrase.loopDurationSec,
            speedPercent: effectivePracticeSpeedPercent()
        )
        return max(scaledLoopDuration, lastTargetEnd) + Self.phraseEndPaddingSec
    }

    private func resetPhraseRuntimeState() {
        lastInputAtByNote.removeAll(keepingCapacity: true)
        nextMissTargetIndex = 0
        nextHammerTargetIndex = 0
        nextApproachTargetIndex = 0
        parryChainAnchor = nil
        completedTargetCount = 0
        failedTargetCount = 0
        runtimeCompletedTargetCount = 0
        runtimeFailedTargetCount = 0
        phraseAccuracy = 0
        phraseEnding = false
        activeChordSlotIndex = 0
        rebuildChordChipsCache()
    }

    private func syncActiveChordSlotIndex(at phraseTimeSec: Double) {
        guard !chordSlots.isEmpty else { return }
        let activeIdx = EarTrainingAdlibCallResponseTargets.activeChordSlotIndex(
            slots: chordSlots,
            phraseTimeSec: phraseTimeSec,
            fromIndex: activeChordSlotIndex,
            resolveStartTimeSec: { [weak self] in
                self?.resolveEffectiveTargetTimeSec($0) ?? $0
            }
        )
        guard activeIdx != activeChordSlotIndex else { return }
        activeChordSlotIndex = activeIdx
        rebuildChordChipsCache()
    }

    private func rebuildChordChipsCache() {
        guard !chordSlots.isEmpty else {
            chordChipsCache = []
            return
        }
        chordChipsCache = chordSlots.enumerated().map { index, slot in
            EarTrainingChordChip(
                id: Self.chordChipId(orderIndex: index),
                name: slot.name,
                active: index == activeChordSlotIndex
            )
        }
    }

    private static func chordChipId(orderIndex: Int) -> UUID {
        let idString = String(format: "ac100000-0000-4000-8000-%012x", orderIndex & 0x0000FFFFFFFFFFFF)
        return UUID(uuidString: idString) ?? UUID()
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

    /// MusicXML を取得・正規化して voice1 の元 (未移調) XML を返す。未登録・失敗時は nil。
    private func loadMusicXML(for phrase: EarTrainingPhraseDetail) async -> String? {
        let cacheKey = Self.musicXmlCacheKey(phraseId: phrase.id)
        if let cached = musicXMLCache[cacheKey] {
            applyBaseMusicXml(cached)
            return cached
        }
        guard let rawURL = phrase.musicXmlUrl, let url = URL(string: rawURL) else {
            practiceOriginalKeyFifths = 0
            practiceOriginalKeyName = "—"
            keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
            return nil
        }
        do {
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                practiceOriginalKeyFifths = 0
                practiceOriginalKeyName = "—"
                keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
                return nil
            }
            guard let text = String(data: data, encoding: .utf8), text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
                practiceOriginalKeyFifths = 0
                practiceOriginalKeyName = "—"
                keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
                return nil
            }
            let normalizedXml = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXmlWithMeta(text).xml
            musicXMLCache[cacheKey] = normalizedXml
            applyBaseMusicXml(normalizedXml)
            return normalizedXml
        } catch {
            practiceOriginalKeyFifths = 0
            practiceOriginalKeyName = "—"
            keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
            return nil
        }
    }

    private func applyBaseMusicXml(_ baseXml: String) {
        let originalFifths = EarTrainingMusicXmlTransposer.readKeyFifths(fromMusicXml: baseXml)
        practiceOriginalKeyFifths = originalFifths
        practiceOriginalKeyName = EarTrainingMusicXmlTransposer.preferredKeyName(fifths: originalFifths)
    }

    private func applyKeyboardScrollAnchor(maxMidi: Int?, attacks: [ChordOsmdMusicXmlAttack] = []) {
        if let maxMidi {
            keyboardScrollAnchorMidi = SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: maxMidi)
        } else {
            keyboardScrollAnchorMidi = stageFallbackKeyboardScrollAnchorMidi
        }
        refreshKeyboardDisplayRange(attacks: attacks)
    }

    func refreshKeyboardDisplayRangeForPreferencesChange() {
        refreshKeyboardDisplayRange(attacks: rhythmAttacks)
    }

    private func refreshKeyboardDisplayRange(attacks: [ChordOsmdMusicXmlAttack] = []) {
        let effectiveAttacks = attacks.isEmpty ? rhythmAttacks : attacks
        var midis = EarTrainingKeyboardScroll.allPitchMidis(in: stage)
        for attack in effectiveAttacks {
            midis.append(contentsOf: attack.midis)
        }
        keyboardDisplayRange = PianoKeyboardScrollGeometry.resolveDisplayKeyboardRange(
            noteMidis: midis,
            displayMode: PianoKeyboardDisplayPreferences.load()
        )
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

    private func handleAudioTimeUpdate(currentTime: Double) {
        guard !phraseEnding else { return }
        guard gameState == .countIn || gameState == .playingPhrase else { return }

        let phraseTime: Double
        if let wallClock = phraseTimelineSecNow() {
            phraseTime = gameState == .countIn ? wallClock : max(0, wallClock)
        } else {
            phraseTime = gameState == .countIn ? currentTime : max(0, currentTime)
        }

        throwDueHammers(at: phraseTime)
        spawnDueApproachCircles(at: phraseTime)
        failExpiredTargets(at: phraseTime)
        refreshPracticeVoicingHints()
        syncActiveChordSlotIndex(at: phraseTime)

        guard gameState == .playingPhrase else { return }
        if phraseTime >= phraseLoopEndSecCache {
            finishCurrentPhraseIfNeeded()
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
        if let wallClock = phraseTimelineSecNow() {
            phraseTime = gameState == .countIn ? wallClock : max(0, wallClock)
        } else {
            phraseTime = gameState == .countIn ? audio.phraseJudgmentTimelineSecNow() : max(0, audio.phraseJudgmentTimelineSecNow())
        }
        let lateW = resolveEffectiveTimingWindowSec(Self.judgmentWindowLateSec)
        let leadSec = hammerLeadSec()
        let baseTargets = targets.map(\.base)
        let guideMidis = EarTrainingAdlibCallResponseTargets.resolveActiveHintGuideMidis(
            targets: baseTargets,
            groups: hintGroups,
            phraseTimeSec: phraseTime,
            hammerLeadSec: leadSec,
            lateWindowSec: lateW,
            resolveJudgedTargetTimeSec: { [weak self] targetTimeSec in
                self?.resolveCalibratedTargetTimeSec(targetTimeSec) ?? targetTimeSec
            },
            isLastTargetSettled: { [weak self] targetId in
                guard let self else { return false }
                guard let index = self.targets.firstIndex(where: { $0.base.id == targetId }) else {
                    return false
                }
                let target = self.targets[index]
                return target.completed || target.failed
            }
        )
        var next: [Int: VoicingHintIntensity] = [:]
        if let guideMidis, !guideMidis.isEmpty {
            next.reserveCapacity(guideMidis.count)
            for midi in guideMidis {
                next[midi] = .strong
            }
        }
        if next != voicingHintIntensities {
            voicingHintIntensities = next
        }
    }

    private func throwDueHammers(at time: Double) {
        while nextHammerTargetIndex < targets.count {
            let target = targets[nextHammerTargetIndex]
            let throwTime = resolveCalibratedTargetTimeSec(target.base.targetTimeSec) - hammerLeadSec()
            guard time >= throwTime else { break }
            if target.completed || target.failed {
                nextHammerTargetIndex += 1
                continue
            }
            let impactTime = resolveCalibratedTargetTimeSec(target.base.targetTimeSec) + Self.hammerImpactOffsetSec
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

    private func spawnDueApproachCircles(at time: Double) {
        let leadSec = approachLeadSec()
        let wallNowMs = CACurrentMediaTime() * 1000
        while nextApproachTargetIndex < targets.count {
            let target = targets[nextApproachTargetIndex]
            let judged = resolveCalibratedTargetTimeSec(target.base.targetTimeSec)
            let spawnTime = judged - leadSec
            guard time >= spawnTime else { break }
            if targets[nextApproachTargetIndex].completed || targets[nextApproachTargetIndex].failed {
                nextApproachTargetIndex += 1
                continue
            }
            let timing = EarTrainingBattleOsuCircleTiming.resolvePerfTiming(
                judgedPhraseTimeSec: judged,
                phraseTimeSec: time,
                approachLeadSec: leadSec,
                wallNowMs: wallNowMs
            )
            let effectId = triggerBattleEffect(
                kind: .osmdApproachCircle,
                label: nil,
                damage: nil,
                phraseNoteCount: nil,
                approachStartMs: timing.approachStartMs,
                judgedMs: timing.judgedMs,
                osuCircleLayoutIndex: nextApproachTargetIndex,
                osuCircleNoteLabels: [],
                osuCircleColorIndex: EarTrainingBattleOsuCircleColors.resolveColorIndex(
                    measureNumber: target.base.measureNumber,
                    loopMeasures: stage.loopMeasures
                )
            )
            targets[nextApproachTargetIndex].osuCircleEffectId = effectId
            nextApproachTargetIndex += 1
        }
    }

    private func syncActiveOsuApproachCircleTimings() {
        guard let phraseTime = phraseTimelineSecNow() else { return }
        let leadSec = approachLeadSec()
        let wallNowMs = CACurrentMediaTime() * 1000
        var updates: [(commandId: Int, approachStartMs: Double, judgedMs: Double)] = []
        for target in targets where !target.completed && !target.failed {
            guard let effectId = target.osuCircleEffectId else { continue }
            let judged = resolveCalibratedTargetTimeSec(target.base.targetTimeSec)
            let timing = EarTrainingBattleOsuCircleTiming.resolvePerfTiming(
                judgedPhraseTimeSec: judged,
                phraseTimeSec: phraseTime,
                approachLeadSec: leadSec,
                wallNowMs: wallNowMs
            )
            updates.append((effectId, timing.approachStartMs, timing.judgedMs))
        }
        if !updates.isEmpty {
            scene?.resyncOsuApproachCircles(updates: updates)
        }
    }

    private func dismissOsuCircle(for targetIndex: Int) {
        guard targets.indices.contains(targetIndex),
              let effectId = targets[targetIndex].osuCircleEffectId else { return }
        triggerBattleEffect(
            kind: .osmdApproachCircleDismiss,
            label: nil,
            damage: nil,
            phraseNoteCount: nil,
            relatedEffectId: effectId
        )
        targets[targetIndex].osuCircleEffectId = nil
    }

    private func clearParryVisualSlowEffect() {
        triggerBattleEffect(kind: .clearParryVisualSlow, label: nil, damage: nil, phraseNoteCount: nil)
    }

    private func resetParryChainState() {
        parryChainAnchor = nil
        clearParryVisualSlowEffect()
    }

    private func failExpiredTargets(at time: Double) {
        let judgmentWindowLate = resolveEffectiveTimingWindowSec(Self.judgmentWindowLateSec)
        let arrivalGraceSec = NoteInputPreferences.inputMethod == .voice
            ? EarTrainingChordOsmdTiming.voiceJudgmentArrivalGraceSec
            : 0
        var changed = false
        while nextMissTargetIndex < targets.count {
            let target = targets[nextMissTargetIndex]
            guard time > resolveCalibratedTargetTimeSec(target.base.targetTimeSec) + judgmentWindowLate + arrivalGraceSec else { break }
            if targets[nextMissTargetIndex].completed == false, targets[nextMissTargetIndex].failed == false {
                dismissOsuCircle(for: nextMissTargetIndex)
                targets[nextMissTargetIndex].failed = true
                changed = true
                resetParryChainState()
                triggerFeedback(.miss)
                statusText = isEnglishCopy ? "Miss" : "ミス"
            }
            nextMissTargetIndex += 1
        }
        if changed {
            updateTargetCounters(publish: false)
        }
    }

    private func completeTarget(at index: Int, hitPhraseTimeSec: Double) {
        guard targets.indices.contains(index) else { return }
        guard targets[index].completed == false, targets[index].failed == false else { return }
        targets[index].completed = true
        let incomingHammerEffectId = targets[index].hammerEffectId
        if let incomingHammerEffectId {
            pendingImpactHandlers[incomingHammerEffectId] = nil
        }
        if let circleEffectId = targets[index].osuCircleEffectId {
            triggerBattleEffect(
                kind: .osmdApproachCircleBurst,
                label: nil,
                damage: nil,
                phraseNoteCount: nil,
                relatedEffectId: circleEffectId
            )
            targets[index].osuCircleEffectId = nil
        }
        let target = targets[index]
        let chordName = "M\(target.base.measureNumber)"
        let damage = practiceMode ? 0 : stage.perCorrectNoteDamage
        let reflectRelatedId = incomingHammerEffectId
        let parryTargets = targets.map {
            EarTrainingChordOsmdParryTarget(
                id: $0.parryId,
                measureNumber: $0.base.measureNumber,
                targetTimeSec: $0.base.targetTimeSec,
                orderIndex: $0.base.orderIndex
            )
        }
        let parryTarget = EarTrainingChordOsmdParryTarget(
            id: target.parryId,
            measureNumber: target.base.measureNumber,
            targetTimeSec: target.base.targetTimeSec,
            orderIndex: target.base.orderIndex
        )
        let spanState = EarTrainingChordOsmdParrySpan.resolveSpanState(
            targets: parryTargets,
            target: parryTarget,
            chainAnchor: parryChainAnchor,
            spanMeasures: stage.resolvedHammerLeadMeasures,
            bpm: Double(resolveEffectivePracticeBpm()),
            beatsPerMeasure: stage.beatsPerMeasure,
            isSwing: stage.resolvedIsSwing
        )
        parryChainAnchor = spanState.anchor
        let nextTarget = targets.first(where: { !$0.completed && !$0.failed })
        var visualSlowSustainMs: Double?
        if let finishTarget = spanState.finishTarget, hitPhraseTimeSec.isFinite {
            let sustainPhraseSec = resolveCalibratedTargetTimeSec(finishTarget.targetTimeSec)
                + resolveEffectiveTimingWindowSec(Self.judgmentWindowLateSec)
                + Self.hammerImpactOffsetSec
            visualSlowSustainMs = max(0, ceil((sustainPhraseSec - hitPhraseTimeSec) * 1000))
        }
        let effectId = triggerBattleEffect(
            kind: .osmdHammerReflect,
            label: chordName,
            damage: damage,
            phraseNoteCount: nil,
            relatedEffectId: reflectRelatedId,
            precise: Self.parryPreciseRingOnSuccess,
            parryFinishOnly: spanState.isFinish,
            hitPhraseTimeSec: hitPhraseTimeSec,
            effectiveBpm: Double(resolveEffectivePracticeBpm()),
            isSwing: stage.resolvedIsSwing,
            nextTargetPhraseTimeSec: nextTarget.map { resolveCalibratedTargetTimeSec($0.base.targetTimeSec) },
            extendParryVisualSlow: spanState.extendVisualSlow,
            clearParryVisualSlow: false,
            visualSlowSustainMs: visualSlowSustainMs
        )
        if spanState.isFinish {
            parryChainAnchor = nil
        }
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            self?.applyEnemyDamage(damage)
        }
        let statusNow = CACurrentMediaTime()
        if statusNow - lastStatusUpdateAt >= Self.statusTextThrottleSec {
            lastStatusUpdateAt = statusNow
            statusText = copy.chordCompleted(chordName: chordName)
        }
        updateTargetCounters(publish: false)
    }

    private func handleHammerImpact(targetIndex: Int) {
        guard targets.indices.contains(targetIndex) else { return }
        guard targets[targetIndex].completed == false else { return }
        dismissOsuCircle(for: targetIndex)
        if targets[targetIndex].failed == false {
            targets[targetIndex].failed = true
            updateTargetCounters(publish: false)
        }
        resetParryChainState()
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
                failRemainingTargets()
                let noteHitPercent = Int(round(
                    EarTrainingAdlibCallResponseTargets.hitRatio(
                        targetCount: targets.count,
                        completedCount: runtimeCompletedTargetCount
                    ) * 100
                ))
                hooks.onSceneComplete(
                    EarTrainingTutorialOsmdSceneResult(noteHitPercent: noteHitPercent)
                )
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
        let accuracy = EarTrainingAdlibCallResponseTargets.hitRatio(
            targetCount: targets.count,
            completedCount: runtimeCompletedTargetCount
        )
        phraseAccuracy = accuracy
        totalCompletedTargets += runtimeCompletedTargetCount
        totalJudgedTargets += targets.count

        let rank = rank(for: accuracy)
        let completionDamageAmount = practiceMode ? 0 : completionDamage(for: rank)
        let playerFailDamage = (!practiceMode && !tutorialNoCombat && rank == .fail) ? stage.failDamage : 0

        gameState = .phraseComplete
        statusText = isEnglishCopy
            ? "Phrase accuracy \(Int(round(accuracy * 100)))%"
            : "フレーズ正解率 \(Int(round(accuracy * 100)))%"
        publishSnapshot()

        if completionDamageAmount > 0 {
            let effectKind: EarTrainingBattleEffectKind = rank == .perfect ? .osmdMeteor : .complete
            let effectId = triggerBattleEffect(
                kind: effectKind,
                label: rank.rawValue,
                damage: completionDamageAmount,
                phraseNoteCount: targets.count
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
                dismissOsuCircle(for: index)
                targets[index].failed = true
                changed = true
            }
        }
        if changed {
            resetParryChainState()
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
        guard gameState != .gameOver else { return }
        pendingImpactHandlers.removeAll()
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
        precise: Bool = false,
        parryFinishOnly: Bool = false,
        approachStartMs: Double? = nil,
        judgedMs: Double? = nil,
        hitPhraseTimeSec: Double? = nil,
        effectiveBpm: Double? = nil,
        isSwing: Bool? = nil,
        nextTargetPhraseTimeSec: Double? = nil,
        extendParryVisualSlow: Bool = false,
        clearParryVisualSlow: Bool = false,
        visualSlowSustainMs: Double? = nil,
        osuCircleLayoutIndex: Int? = nil,
        osuCircleNoteLabels: [String]? = nil,
        osuCircleColorIndex: Int? = nil
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
            precise: precise,
            parryFinishOnly: parryFinishOnly,
            approachStartMs: approachStartMs,
            judgedMs: judgedMs,
            hitPhraseTimeSec: hitPhraseTimeSec,
            effectiveBpm: effectiveBpm,
            isSwing: isSwing,
            nextTargetPhraseTimeSec: nextTargetPhraseTimeSec,
            extendParryVisualSlow: extendParryVisualSlow,
            clearParryVisualSlow: clearParryVisualSlow,
            visualSlowSustainMs: visualSlowSustainMs,
            osuCircleLayoutIndex: osuCircleLayoutIndex,
            osuCircleNoteLabels: osuCircleNoteLabels,
            osuCircleColorIndex: osuCircleColorIndex
        )
        if lastEmittedEffectId != id {
            lastEmittedEffectId = id
            scene?.runEffect(command)
        }
        return id
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
        phrasePrepareTask?.cancel(); phrasePrepareTask = nil
        if !keepsAudio {
            audio.stopPhrase()
        }
    }

    /// 画面録画再構成でフレーズ即時再開に失敗したとき。キャッシュから再 prepare してオフセット再開を試みる。
    private func handlePhraseSuspendedAfterScreenCapture() {
        guard gameState == .countIn || gameState == .playingPhrase else { return }
        guard phrases.indices.contains(phraseIndex) else { return }
        let phrase = phrases[phraseIndex]
        guard let audioURL = URL(string: phrase.audioUrl.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            audio.stopPhrase()
            return
        }
        let resumeOffset = phraseTimelineSecNow() ?? max(0, audio.currentTimeSec)
        phrasePrepareTask?.cancel()
        phrasePrepareTask = Task { @MainActor [weak self] in
            guard let self else { return }
            let prepared = await self.audio.preparePhraseForImmediatePlayback(url: audioURL)
            guard !Task.isCancelled, prepared else {
                self.audio.stopPhrase()
                return
            }
            let resumed = self.audio.playPreparedPhraseFromTimelineOffset(
                url: audioURL,
                timelineOffsetSec: resumeOffset
            )
            if !resumed {
                self.audio.stopPhrase()
            }
        }
    }

    var hudModel: EarTrainingHudModel {
        let currentIndex = firstUnresolvedTargetIndex()
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
            hideChordChips: chordSlots.isEmpty,
            hideSlotsRow: true,
            hudLabels: hudLabels,
            gameState: gameState,
            phraseRunId: phraseRunId,
            chordChips: chordChipsCache,
            slotRow: .chordVoicing(
                slotCount: max(1, targets.count),
                completed: targets.map(\.completed),
                currentIndex: currentIndex
            )
        )
        if let ui = tutorialHooks?.ui {
            return ui.apply(to: base, timingCalibrationMode: false)
        }
        return base
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
            mainQueue.asyncAfter(deadline: .now() + delayMs / 1000, execute: work)
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

    private func firstUnresolvedTargetIndex() -> Int {
        guard let index = targets.firstIndex(where: { !$0.completed && !$0.failed }) else {
            return max(0, targets.count - 1)
        }
        return index
    }

    /// アドリブ C&R の判定ターゲットに、パリィ連鎖判定用の決定論的 UUID を付与するランタイム状態。
    private struct RuntimeTarget {
        let base: AdlibCallResponseTarget
        let parryId: UUID
        var completed: Bool = false
        var failed: Bool = false
        var hammerEffectId: Int?
        var osuCircleEffectId: Int?

        init(base: AdlibCallResponseTarget) {
            self.base = base
            self.parryId = Self.makeParryId(orderIndex: base.orderIndex)
        }

        private static func makeParryId(orderIndex: Int) -> UUID {
            let idString = String(format: "ac000000-0000-4000-8000-%012x", orderIndex & 0x0000FFFFFFFFFFFF)
            return UUID(uuidString: idString) ?? UUID()
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

extension EarTrainingAdlibCallResponseBattleController: EarTrainingBattleSceneDriving {}

extension EarTrainingAdlibCallResponseBattleController: EarTrainingPianoPlayable {
    var voicingHintsByMidi: [Int: VoicingHintState] { [:] }

    var voicingHintIntensitiesByMidi: [Int: VoicingHintIntensity]? {
        guard practiceMode || stage.resolvedShowKeyboardHintsInBattle else { return nil }
        return voicingHintIntensities
    }
}

extension EarTrainingAdlibCallResponseBattleController: EarTrainingLobbyPresentable {
    var canChangePracticeMode: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var showLobbyControls: Bool {
        canChangePracticeMode
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
        stage.battleClearConditionText(isEnglish: isEnglishCopy)
    }
}
