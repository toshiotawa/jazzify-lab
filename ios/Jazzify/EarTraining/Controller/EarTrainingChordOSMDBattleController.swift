import Foundation
import Combine
import QuartzCore
import CoreGraphics
import os.log

/// OSMD でリズム譜を表示し、Swift 側でオクターブ込みのコード同時タイミング判定を行う耳コピバトル。
@MainActor
final class EarTrainingChordOSMDBattleController: ObservableObject {
    private static let judgmentWindowSec: Double = 0.1
    private static let hammerLeadSec: Double = 2.4
    private static let hammerImpactOffsetSec: Double = 0.2
    private static let effectClearPaddingMs: Double = 420
    private static let phraseTransitionDelayNs: UInt64 = 220_000_000
    private static let phraseTransitionDamageExtraNs: UInt64 = 650_000_000
    /// フレーズ終了検知のセーフティパディング。`loop_duration_sec` の直後ではなく、
    /// 最後のノーツの判定窓と被ダメージ用ハンマーが着弾し終わるまで待つ（WEB の `PHRASE_END_PADDING_SEC` 相当）。
    private static let phraseEndPaddingSec: Double = 0.08

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
    @Published private(set) var musicXMLText: String?
    @Published private(set) var scoreErrorText: String?
    @Published private(set) var completedTargetCount: Int = 0
    @Published private(set) var failedTargetCount: Int = 0
    @Published private(set) var phraseAccuracy: Double = 0
    @Published private(set) var statusText: String
    @Published private(set) var enemyAttackGaugePercent: Double = 0
    @Published private(set) var feedback: EarTrainingBattleController.Feedback?
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    /// 練習モード時のみ、判定窓内の未押下構成音（プレビュー用マリーゴールド鍵盤）。
    @Published private(set) var voicingHintMidis: Set<Int> = []

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
    private var phraseEnding: Bool = false
    private var progressSaveStarted: Bool = false
    private var totalCompletedTargets: Int = 0
    private var totalJudgedTargets: Int = 0
    private var pendingImpactHandlers: [Int: () -> Void] = [:]
    private var battleEffectIdCounter: Int = 0
    private var lastEmittedEffectId: Int = -1
    private static let musicXmlCacheSchemaVersion = 3

    private static func musicXmlCacheKey(phraseId: UUID) -> String {
        "\(phraseId.uuidString)|osmdXml|v\(musicXmlCacheSchemaVersion)"
    }

    private var musicXMLCache: [String: String] = [:]

    private var countdownTask: Task<Void, Never>?
    private var transitionTask: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private var battleEffectClearTasks: [Int: Task<Void, Never>] = [:]
    private var phrasePrepareTask: Task<Void, Never>?
    private var lastRankStorage: EarTrainingRank?

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
        self.enemyHp = stage.enemyHp
        self.playerHp = stage.playerHp
        self.countInValue = max(0, min(32, stage.countInBeats))
        self.statusText = isEnglishCopy
            ? "Press START to begin OSMD rhythm battle."
            : "STARTでOSMDリズムバトルを開始します"
        self.practiceMode = false
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
        audio.stopPhrase()
        midiHeldKeys.removeAll()
        voicingHintMidis = []
        scene = nil
    }

    func registerMidiKeyDown(_ midi: Int) { midiHeldKeys.insert(midi) }
    func registerMidiKeyUp(_ midi: Int) { midiHeldKeys.remove(midi) }
    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func handleBack() {
        cancelAllTasks()
        audio.stopPhrase()
        onExitCallback()
    }

    func startBattle() {
        guard !phrases.isEmpty else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        cancelAllTasks()
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
        startPhrase(at: 0)
    }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
        if !value {
            voicingHintMidis = []
        }
        publishSnapshot()
    }

    func handleNoteOn(midi: Int, velocity: Int = 100, playAudio: Bool = true) {
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
        }
        guard gameState == .playingPhrase || gameState == .countIn else { return }
        handleAudioTimeUpdate(currentTime: audio.currentTimeSec)
        compactActiveTargets()

        var matchedIndex: Int?
        for index in activeTargetIndices {
            guard targets.indices.contains(index) else { continue }
            guard targets[index].completed == false, targets[index].failed == false else { continue }
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
            completeTarget(at: matchedIndex)
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
        let preparedTargets = Self.makeRhythmTargets(
            phrase: phrase,
            bpm: stage.bpm,
            beatsPerMeasure: stage.beatsPerMeasure
        )
        guard !preparedTargets.isEmpty else {
            finishGameOver(message: isEnglishCopy ? "No chord timings are registered." : "判定用コードタイミングが登録されていません")
            return
        }
        guard let audioURL = URL(string: phrase.audioUrl) else {
            finishGameOver(message: copy.audioFailed)
            return
        }

        phraseIndex = index
        phraseRunId += 1
        phraseIntroSeq += 1
        let runId = phraseRunId
        targets = preparedTargets
        resetPhraseRuntimeState()
        activeMeasureNumber = max(1, targets.first?.measureNumber ?? 1)
        countInValue = sanitizedCountInBeats
        gameState = .countIn
        statusText = copy.countIn
        publishSnapshot()

        await loadMusicXML(for: phrase)
        if Task.isCancelled { return }

        let prepared = await audio.preparePhraseForImmediatePlayback(url: audioURL)
        if Task.isCancelled { return }
        guard prepared else {
            audio.emitNegativePhraseTimelineBeforeAnchor = false
            finishGameOver(message: copy.audioFailed)
            return
        }

        let onStarted: () -> Void = { [weak self] in
            guard let self else { return }
            guard self.phraseRunId == runId else { return }
            self.audio.emitNegativePhraseTimelineBeforeAnchor = false
            self.countInValue = 0
            self.gameState = .playingPhrase
            self.statusText = self.copy.phraseLabel(indexOneBased: index + 1)
            self.handleAudioTimeUpdate(currentTime: 0)
            self.publishSnapshot()
        }

        let scheduleStart = CACurrentMediaTime()
        audio.emitNegativePhraseTimelineBeforeAnchor = true
        if let meta = audio.schedulePreparedPhraseWithCountIn(
            url: audioURL,
            countInBeats: sanitizedCountInBeats,
            bpm: stage.bpm,
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
        nextActiveTargetIndex = 0
        nextMissTargetIndex = 0
        nextHammerTargetIndex = 0
        completedTargetCount = 0
        failedTargetCount = 0
        phraseAccuracy = 0
        phraseEnding = false
        enemyAttackGaugePercent = 0
    }

    private func runCountInDisplayOnly(scheduleStart: TimeInterval, meta: EarTrainingScheduledCountInPhrase) async {
        let beats = meta.countInBeats
        guard beats > 0 else {
            countInValue = 0
            publishSnapshot()
            return
        }
        countInValue = beats
        statusText = copy.countIn
        publishSnapshot()
        for beatIndex in 0..<beats {
            let targetClick = scheduleStart + meta.leadInSec + Double(beatIndex) * meta.beatDurationSec
            let sleepSec = targetClick - CACurrentMediaTime()
            if sleepSec > 0 {
                try? await Task.sleep(nanoseconds: UInt64(sleepSec * 1_000_000_000))
            }
            if Task.isCancelled { return }
            let next = max(beats - beatIndex - 1, 0)
            countInValue = next
            statusText = copy.countIn
            publishSnapshot()
        }
    }

    private func loadMusicXML(for phrase: EarTrainingPhraseDetail) async {
        let cacheKey = Self.musicXmlCacheKey(phraseId: phrase.id)
        if let cached = musicXMLCache[cacheKey] {
            musicXMLText = cached
            scoreErrorText = nil
            return
        }
        guard let rawURL = phrase.musicXmlUrl, let url = URL(string: rawURL) else {
            musicXMLText = nil
            scoreErrorText = isEnglishCopy ? "MusicXML is not registered." : "MusicXMLが登録されていません"
            return
        }
        do {
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                musicXMLText = nil
                scoreErrorText = isEnglishCopy ? "Could not load MusicXML." : "MusicXMLを読み込めませんでした"
                return
            }
            guard let text = String(data: data, encoding: .utf8), text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
                musicXMLText = nil
                scoreErrorText = isEnglishCopy ? "MusicXML is empty." : "MusicXMLが空です"
                return
            }
            let normalized = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXml(text)
            musicXMLCache[cacheKey] = normalized
            musicXMLText = normalized
            scoreErrorText = nil
        } catch {
            musicXMLText = nil
            scoreErrorText = isEnglishCopy ? "Could not load MusicXML." : "MusicXMLを読み込めませんでした"
        }
    }

    private func handleAudioTimeUpdate(currentTime: Double) {
        guard !phraseEnding else { return }
        guard gameState == .countIn || gameState == .playingPhrase else { return }

        let phraseTime: Double
        if gameState == .countIn {
            phraseTime = currentTime
        } else {
            phraseTime = max(0, currentTime)
        }

        if phraseTime >= 0 {
            updateActiveMeasure(for: phraseTime)
        }
        openJudgmentWindows(at: phraseTime)
        throwDueHammers(at: phraseTime)
        failExpiredTargets(at: phraseTime)
        refreshPracticeVoicingHints()

        guard gameState == .playingPhrase else { return }
        let phrase = phrases[phraseIndex]
        let lastTargetEnd = (targets.last?.targetTimeSec ?? 0) + Self.judgmentWindowSec + Self.hammerImpactOffsetSec
        let safeLoopEnd = max(phrase.loopDurationSec, lastTargetEnd) + Self.phraseEndPaddingSec
        if phraseTime >= safeLoopEnd {
            finishCurrentPhraseIfNeeded()
        }
    }

    private func refreshPracticeVoicingHints() {
        guard practiceMode else {
            if !voicingHintMidis.isEmpty {
                voicingHintMidis = []
            }
            return
        }
        guard gameState == .countIn || gameState == .playingPhrase else {
            if !voicingHintMidis.isEmpty {
                voicingHintMidis = []
            }
            return
        }
        let phraseTime: Double
        if gameState == .countIn {
            phraseTime = audio.currentTimeSec
        } else {
            phraseTime = max(0, audio.currentTimeSec)
        }
        var union = Set<Int>()
        for target in targets {
            if target.completed || target.failed {
                continue
            }
            let windowStart = target.targetTimeSec - Self.judgmentWindowSec
            let windowEnd = target.targetTimeSec + Self.judgmentWindowSec
            if phraseTime + 0.0001 < windowStart {
                continue
            }
            if phraseTime > windowEnd {
                continue
            }
            for (midi, count) in target.remainingMidiCounts where count > 0 {
                union.insert(midi)
            }
        }
        if union != voicingHintMidis {
            voicingHintMidis = union
        }
    }

    private func updateActiveMeasure(for time: Double) {
        let beatDuration = 60.0 / Double(max(1, stage.bpm))
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
        while nextActiveTargetIndex < targets.count {
            let target = targets[nextActiveTargetIndex]
            guard time >= target.targetTimeSec - Self.judgmentWindowSec else { break }
            activeTargetIndices.append(nextActiveTargetIndex)
            nextActiveTargetIndex += 1
        }
        compactActiveTargets(currentTime: time)
    }

    private func throwDueHammers(at time: Double) {
        while nextHammerTargetIndex < targets.count {
            let target = targets[nextHammerTargetIndex]
            let throwTime = target.targetTimeSec - Self.hammerLeadSec
            guard time >= throwTime else { break }
            let impactTime = target.targetTimeSec + Self.hammerImpactOffsetSec
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
        var changed = false
        while nextMissTargetIndex < targets.count {
            let target = targets[nextMissTargetIndex]
            guard time > target.targetTimeSec + Self.judgmentWindowSec else { break }
            if targets[nextMissTargetIndex].completed == false, targets[nextMissTargetIndex].failed == false {
                targets[nextMissTargetIndex].failed = true
                changed = true
                triggerFeedback(.miss)
                statusText = isEnglishCopy ? "Miss" : "ミス"
            }
            nextMissTargetIndex += 1
        }
        if changed {
            updateTargetCounters()
            compactActiveTargets(currentTime: time)
        }
    }

    private func completeTarget(at index: Int) {
        guard targets.indices.contains(index) else { return }
        guard targets[index].completed == false, targets[index].failed == false else { return }
        targets[index].completed = true
        targets[index].reflected = true
        if let hammerEffectId = targets[index].hammerEffectId {
            pendingImpactHandlers[hammerEffectId] = nil
        }
        let chordName = targets[index].label
        let damage = practiceMode ? 0 : stage.perCorrectNoteDamage
        let effectId = triggerBattleEffect(
            kind: .osmdHammerReflect,
            label: chordName,
            damage: damage,
            phraseNoteCount: nil,
            relatedEffectId: targets[index].hammerEffectId
        )
        registerBattleEffectImpact(effectId: effectId) { [weak self] in
            self?.applyEnemyDamage(damage)
        }
        triggerFeedback(.correct)
        statusText = copy.chordCompleted(chordName: chordName)
        updateTargetCounters()
        compactActiveTargets(currentTime: audio.currentTimeSec)
    }

    private func handleHammerImpact(targetIndex: Int) {
        guard targets.indices.contains(targetIndex) else { return }
        guard targets[targetIndex].completed == false, targets[targetIndex].reflected == false else { return }
        if targets[targetIndex].failed == false {
            targets[targetIndex].failed = true
            updateTargetCounters()
        }
        guard practiceMode == false else { return }
        let damage = stage.missDamage
        guard damage > 0 else { return }
        playerHp = max(0, playerHp - damage)
        if playerHp <= 0 {
            finishGameOver(message: copy.gameOver)
        }
    }

    private func finishCurrentPhraseIfNeeded() {
        guard gameState == .playingPhrase, !phraseEnding else { return }
        phraseEnding = true
        audio.stopPhrase()
        audio.emitNegativePhraseTimelineBeforeAnchor = false
        failRemainingTargets()
        let phraseTotal = max(1, targets.count)
        let accuracy = Double(completedTargetCount) / Double(phraseTotal)
        phraseAccuracy = accuracy
        totalCompletedTargets += completedTargetCount
        totalJudgedTargets += phraseTotal

        let rank = rank(for: accuracy)
        let completionDamageAmount = practiceMode ? 0 : completionDamage(for: rank)
        let playerFailDamage = (!practiceMode && rank == .fail) ? stage.failDamage : 0

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

        let hasDamageEffect = completionDamageAmount > 0 || playerFailDamage > 0
        let delayNs = hasDamageEffect
            ? Self.phraseTransitionDelayNs + Self.phraseTransitionDamageExtraNs
            : Self.phraseTransitionDelayNs
        gameState = .transitionToNextPhrase
        publishSnapshot()
        transitionTask?.cancel()
        transitionTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: delayNs)
            guard let self else { return }
            guard self.enemyHp > 0, self.playerHp > 0 else { return }
            self.startPhrase(at: nextIndex)
        }
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
            updateTargetCounters()
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
        guard !practiceMode else { return }
        guard damage > 0 else { return }
        playerHp = max(0, playerHp - damage)
        if playerHp <= 0 {
            finishGameOver(message: copy.gameOver)
        }
    }

    private func updateTargetCounters() {
        var completed = 0
        var failed = 0
        for target in targets {
            if target.completed {
                completed += 1
            } else if target.failed {
                failed += 1
            }
        }
        completedTargetCount = completed
        failedTargetCount = failed
        phraseAccuracy = targets.isEmpty ? 0 : Double(completed) / Double(targets.count)
    }

    private func compactActiveTargets(currentTime: Double? = nil) {
        var writeIndex = 0
        for index in activeTargetIndices {
            guard targets.indices.contains(index) else { continue }
            let target = targets[index]
            if target.completed || target.failed {
                continue
            }
            if let currentTime, currentTime > target.targetTimeSec + Self.judgmentWindowSec {
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
        audio.stopPhrase()
        gameState = .stageClear
        let accuracy = totalJudgedTargets == 0 ? phraseAccuracy : Double(totalCompletedTargets) / Double(max(1, totalJudgedTargets))
        lastRankStorage = rank(for: accuracy)
        statusText = copy.stageClear
        publishSnapshot()
        saveLessonProgressIfNeeded(rank: lastRankStorage ?? .good)
    }

    private func finishGameOver(message: String) {
        cancelAllTasks(keepsAudio: true)
        audio.stopPhrase()
        gameState = .gameOver
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
        travelDurationSec: Double? = nil
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
            travelDurationSec: travelDurationSec
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
            return 1_100
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
        scene?.setPlayerQuote(playerQuoteText())
    }

    private func playerQuoteText() -> String? {
        guard gameState == .playingPhrase else { return nil }
        guard targets.isEmpty == false else { return nil }
        return "\(completedTargetCount)/\(targets.count)"
    }

    private func cancelAllTasks(keepsAudio: Bool = false) {
        countdownTask?.cancel(); countdownTask = nil
        transitionTask?.cancel(); transitionTask = nil
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
        return EarTrainingHudModel(
            playerHp: practiceMode ? stage.playerHp : playerHp,
            playerMaxHp: stage.playerHp,
            enemyHp: practiceMode ? stage.enemyHp : enemyHp,
            enemyMaxHp: stage.enemyHp,
            practiceMode: practiceMode,
            timeRemaining: timeRemaining,
            timeLabel: "\(min(phraseIndex + 1, max(1, phrases.count)))/\(max(1, phrases.count))",
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

    private static func makeRhythmTargets(
        phrase: EarTrainingPhraseDetail,
        bpm: Int,
        beatsPerMeasure: Int
    ) -> [RhythmTarget] {
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
    var voicingHintsByMidi: [Int: VoicingHintState] {
        guard practiceMode else { return [:] }
        var dict: [Int: VoicingHintState] = [:]
        for midi in voicingHintMidis {
            dict[midi] = .pending
        }
        return dict
    }
}

extension EarTrainingChordOSMDBattleController: EarTrainingLobbyPresentable {
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
        guard resultState != nil else { return nil }
        let accuracy = totalJudgedTargets == 0 ? phraseAccuracy : Double(totalCompletedTargets) / Double(max(1, totalJudgedTargets))
        let percent = Int(round(accuracy * 100))
        return isEnglishCopy ? "Accuracy \(percent)%" : "正解率 \(percent)%"
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
        isEnglishCopy
            ? "Complete every chord within +/-100ms. Octaves are judged exactly."
            : "±100msで同時和音を完成。オクターブ違いは別判定です。"
    }
}
