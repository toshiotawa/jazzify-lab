import Foundation
import Combine

@MainActor
final class EarTrainingPrecisionBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let seekSliderUiUpdateIntervalSec: Double = 0.2

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseRunId: Int = 0
    @Published private(set) var musicXMLText: String?
    @Published private(set) var scoreErrorText: String?
    @Published private(set) var activeMeasureNumber: Int = 1
    @Published private(set) var scoreTimelineArmed: Bool = false
    @Published private(set) var precisionNotes: [EarTrainingPrecisionNote] = []
    @Published private(set) var keyboardRange = EarTrainingPrecisionKeyboardRange(minMidi: 60, maxMidi: 83)
    @Published private(set) var runtimeStates: [String: EarTrainingPrecisionJudge.NoteRuntimeState] = [:]
    @Published private(set) var activeLyricText: String = ""
    @Published private(set) var seekSliderSec: Double = 0
    @Published private(set) var phraseDurationSec: Double = 1
    @Published private(set) var statusText: String
    @Published private(set) var lessonProgressStatus: EarTrainingLessonProgressStatus?
    @Published var practiceMode: Bool
    @Published var practiceTransposeOffset: Int = 0
    @Published var practiceSpeedPercent: Int = 100
    @Published var timingAdjustmentMs: Int = EarTrainingOsmdTimingAdjustment.timingAdjustmentMsDefault
    @Published private(set) var practiceOriginalKeyFifths: Int = 0
    @Published private(set) var practiceOriginalKeyName: String = "—"
    @Published var isSettingsOpen: Bool = false
    @Published var isMidiConnected: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []

    let stage: EarTrainingStageDetail
    let phrases: [EarTrainingPhraseDetail]
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let copy: EarTrainingGameCopy

    var scoreScrollActive: Bool {
        scoreTimelineArmed && (gameState == .countIn || gameState == .playingPhrase)
    }

    var effectiveMeasureDurationSec: Double {
        let bpm = resolveEffectivePracticeBpm()
        return 60.0 / Double(max(1, bpm)) * Double(max(1, stage.beatsPerMeasure))
    }

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared

    private var phraseIndex = 0
    private var phraseLyricEvents: [ChordOsmdLyricEvent] = []
    private var nextLyricIndex = 0
    private var baseMusicXmlText: String?
    private var baseMidiData: Data?
    private var phraseLoopEndSec: Double = 0
    private var phraseEnding = false
    private var progressSaveStarted = false
    private var lastInputAtByNote: [Int: Double] = [:]
    private var activeGoodNotesByMidi: [Int: String] = [:]
    private var lastPrecisionRank: EarTrainingPrecisionJudge.LessonRank?
    private var lastGoodRatePercent: Int?
    private var pausedTimelineSec: Double?
    private var preparedPhraseURL: URL?
    private var lastSeekSliderUiUpdate: TimeInterval = 0
    private var musicXmlCache: [String: String] = [:]

    init(
        stage: EarTrainingStageDetail,
        phrases: [EarTrainingPhraseDetail],
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        audio: EarTrainingAudio,
        initialPracticeMode: Bool = false,
        onExit: @escaping () -> Void
    ) {
        self.stage = stage
        self.phrases = phrases
        self.lessonContext = lessonContext
        self.isEnglishCopy = isEnglishCopy
        self.audio = audio
        self.onExitCallback = onExit
        self.hudLabels = EarTrainingBattleHudLabels.make(isEnglish: isEnglishCopy)
        self.copy = EarTrainingGameCopy.make(isEnglish: isEnglishCopy)
        self.practiceMode = initialPracticeMode
        self.timingAdjustmentMs = EarTrainingOsmdTimingAdjustment.loadTimingAdjustmentMs()
        self.statusText = isEnglishCopy
            ? "Press START to begin precision mode."
            : "STARTで精密モードを開始します"
    }

    func start() {
        audio.stopPhrase()
        audio.start()
        audio.emitNegativePhraseTimelineBeforeAnchor = true
        audio.onTimeUpdate = { [weak self] _ in
            Task { @MainActor in
                self?.handleAudioTimeUpdate()
            }
        }
        audio.onEnded = { [weak self] in
            Task { @MainActor in
                self?.finishPhraseIfNeeded()
            }
        }
    }

    func tearDown() {
        audio.stopPhrase()
        audio.onTimeUpdate = nil
        audio.onEnded = nil
    }

    func startBattle() {
        phraseEnding = false
        progressSaveStarted = false
        lessonProgressStatus = nil
        lastPrecisionRank = nil
        lastGoodRatePercent = nil
        pausedTimelineSec = nil
        phraseRunId += 1
        let runId = phraseRunId

        guard let phrase = currentPhrase else {
            scoreErrorText = isEnglishCopy ? "No phrase registered." : "フレーズが登録されていません"
            return
        }

        Task { @MainActor [weak self] in
            guard let self, self.phraseRunId == runId else { return }
            await self.preparePhraseAssets(phrase: phrase, runId: runId)
            guard self.phraseRunId == runId else { return }
            self.rebuildPrecisionNotes()
            self.beginPhrasePlayback(phrase: phrase)
        }
    }

    private var currentPhrase: EarTrainingPhraseDetail? {
        phrases.indices.contains(phraseIndex) ? phrases[phraseIndex] : phrases.first
    }

    private func preparePhraseAssets(phrase: EarTrainingPhraseDetail, runId: Int) async {
        scoreTimelineArmed = false
        activeMeasureNumber = 1
        scoreErrorText = nil

        if let xmlUrl = phrase.musicXmlUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !xmlUrl.isEmpty {
            if let cached = musicXmlCache[xmlUrl] {
                baseMusicXmlText = cached
            } else if let url = URL(string: xmlUrl) {
                do {
                    let (data, _) = try await URLSession.shared.data(from: url)
                    guard phraseRunId == runId else { return }
                    let text = String(data: data, encoding: .utf8) ?? ""
                    let normalized = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXml(text)
                    musicXmlCache[xmlUrl] = normalized
                    baseMusicXmlText = normalized
                } catch {
                    scoreErrorText = isEnglishCopy ? "Could not load MusicXML." : "MusicXMLを読み込めませんでした"
                }
            }
        }

        applyDisplayMusicXml()

        if let midiUrl = phrase.midiUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           !midiUrl.isEmpty,
           let url = URL(string: midiUrl) {
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                guard phraseRunId == runId else { return }
                baseMidiData = data
            } catch {
                baseMidiData = nil
            }
        } else {
            baseMidiData = nil
        }

        phraseLyricEvents = baseMusicXmlText.map {
            EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlLyrics(
                $0,
                bpm: Double(stage.bpm),
                beatsPerMeasure: stage.beatsPerMeasure
            )
        } ?? []
        nextLyricIndex = 0
        activeLyricText = ""

        if let audioUrl = URL(string: phrase.audioUrl) {
            preparedPhraseURL = audioUrl
            _ = await audio.preparePhraseForImmediatePlayback(url: audioUrl)
        }
    }

    private func applyDisplayMusicXml() {
        guard let base = baseMusicXmlText else {
            musicXMLText = nil
            return
        }
        let offset = practiceTransposeEnabled && practiceMode ? practiceTransposeOffset : 0
        let transposed = EarTrainingMusicXmlTransposer.applyPracticeTransposeToMusicXml(base, offset: offset)
        musicXMLText = EarTrainingChordOsmdMusicXmlNormalizer.stripLyricsFromMusicXml(transposed)
        if practiceTransposeEnabled {
            practiceOriginalKeyFifths = EarTrainingMusicXmlTransposer.readKeyFifths(fromMusicXml: base)
            practiceOriginalKeyName = EarTrainingMusicXmlTransposer.preferredKeyName(fifths: practiceOriginalKeyFifths)
        }
    }

    private var practiceTransposeEnabled: Bool {
        stage.resolvedPracticeTranspose
    }

    private func rebuildPrecisionNotes() {
        let classificationBpm = resolveEffectivePracticeBpm()
        var builtNotes: [EarTrainingPrecisionNote] = []

        if let midiData = baseMidiData {
            let offset = practiceTransposeEnabled && practiceMode ? practiceTransposeOffset : 0
            if let result = try? EarTrainingPrecisionMidi.buildFromMidi(data: midiData, bpm: stage.bpm, transposeOffset: offset) {
                builtNotes = result.notes
            }
        } else if let xml = musicXMLText {
            builtNotes = EarTrainingPrecisionNotes.buildFromMusicXml(
                musicXmlText: xml,
                bpm: stage.bpm,
                beatsPerMeasure: stage.beatsPerMeasure
            ).notes
        }

        let calibrated = EarTrainingPrecisionNotes.calibrateNotes(
            notes: builtNotes,
            resolveCalibratedStartSec: resolveCalibratedTargetTimeSec,
            practiceMode: practiceMode,
            practiceSpeedPercent: practiceSpeedPercent,
            classificationBpm: classificationBpm
        )
        keyboardRange = EarTrainingPrecisionNotes.resolveKeyboardRange(noteMidis: calibrated.map(\.midi))
        precisionNotes = calibrated
        runtimeStates = EarTrainingPrecisionJudge.createRuntimeStates(notes: calibrated)

        let lastStart = calibrated.map(\.startSec).max() ?? 0
        let lastDur = calibrated.last?.durationSec ?? 0
        let loopDuration = currentPhrase?.loopDurationSec ?? 0
        phraseLoopEndSec = max(loopDuration, lastStart + lastDur + 0.25)
        phraseDurationSec = max(1, practiceMode
            ? EarTrainingPracticeSpeed.scalePracticePhraseLoopEndSec(phraseLoopEndSec, speedPercent: practiceSpeedPercent)
            : phraseLoopEndSec)
    }

    private func beginPhrasePlayback(phrase: EarTrainingPhraseDetail) {
        guard let url = preparedPhraseURL else { return }
        gameState = .countIn
        scoreTimelineArmed = true
        audio.phrasePitchSemitones = Float(effectivePracticeTransposeOffset())
        audio.phrasePlaybackSpeedPercent = Float(practiceMode ? practiceSpeedPercent : 100)
        audio.phraseTimelinePlaybackOffsetSec = 0

        if let paused = pausedTimelineSec, practiceMode, paused > 0 {
            _ = audio.playPreparedPhraseFromTimelineOffset(url: url, timelineOffsetSec: paused) { [weak self] in
                self?.gameState = .playingPhrase
            }
            pausedTimelineSec = nil
            updateSeekSliderUi(phraseTimeSec: paused, force: true)
            return
        }

        _ = audio.schedulePreparedPhraseWithCountIn(
            url: url,
            countInBeats: stage.countInBeats,
            bpm: stage.bpm,
            onPhraseStarted: { [weak self] in
                self?.gameState = .playingPhrase
            }
        )
    }

    private func handleAudioTimeUpdate() {
        guard gameState == .countIn || gameState == .playingPhrase else { return }
        guard let phraseTime = audio.phraseWallClockTimelineSecNowOrNil() else { return }

        updateActiveMeasure(for: max(0, phraseTime))
        let windowSec = resolveEffectiveTimingWindowSec(EarTrainingPrecisionJudge.judgmentWindowSec)
        _ = EarTrainingPrecisionJudge.markExpiredNotesAsMiss(
            notes: precisionNotes,
            states: &runtimeStates,
            phraseTimeSec: phraseTime,
            windowSec: windowSec
        )
        applyLyricsIfNeeded(phraseTimeSec: phraseTime)
        updateHiddenNotesAtEnd(phraseTimeSec: phraseTime)
        updateSeekSliderUi(phraseTimeSec: max(0, phraseTime))

        if phraseTime >= phraseLoopEndSec - 0.05 {
            finishPhraseIfNeeded()
        }
    }

    private func updateHiddenNotesAtEnd(phraseTimeSec: Double) {
        for note in precisionNotes {
            guard var state = runtimeStates[note.id], state.judgment == .good else { continue }
            if state.hiddenFromLane == true { continue }
            if phraseTimeSec >= note.startSec + note.durationSec {
                state.hiddenFromLane = true
                runtimeStates[note.id] = state
            }
        }
    }

    private func applyLyricsIfNeeded(phraseTimeSec: Double) {
        while nextLyricIndex < phraseLyricEvents.count {
            let lyric = phraseLyricEvents[nextLyricIndex]
            if resolveCalibratedTargetTimeSec(lyric.targetTimeSec) > phraseTimeSec {
                break
            }
            activeLyricText = lyric.text
            nextLyricIndex += 1
        }
    }

    private func updateActiveMeasure(for time: Double) {
        let measureDuration = effectiveMeasureDurationSec
        guard measureDuration > 0 else { return }
        let raw = Int(floor(time / measureDuration)) + 1
        let maxMeasure = max(stage.loopMeasures, precisionNotes.map(\.measureNumber).max() ?? 1)
        let next = max(1, min(maxMeasure, raw))
        if next != activeMeasureNumber {
            activeMeasureNumber = next
        }
    }

    func handleNoteOn(midi: Int, velocity: Int, playAudio: Bool = true) {
        let now = CFAbsoluteTimeGetCurrent() * 1000
        if let last = lastInputAtByNote[midi], now - last < Self.inputCooldownMs {
            return
        }
        lastInputAtByNote[midi] = now
        midiHeldKeys.insert(midi)

        guard gameState == .countIn || gameState == .playingPhrase else { return }
        guard let phraseTime = audio.phraseWallClockTimelineSecNowOrNil() else { return }

        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
        }

        let windowSec = resolveEffectiveTimingWindowSec(EarTrainingPrecisionJudge.judgmentWindowSec)
        guard let matched = EarTrainingPrecisionJudge.findNoteForInput(
            notes: precisionNotes,
            states: runtimeStates,
            midi: midi,
            phraseTimeSec: phraseTime,
            windowSec: windowSec
        ) else {
            return
        }

        guard var state = runtimeStates[matched.id] else { return }
        state.judgment = .good
        state.hitAtSec = phraseTime
        if matched.isShortNote {
            state.hiddenFromLane = true
        }
        runtimeStates[matched.id] = state
        activeGoodNotesByMidi[midi] = matched.id
    }

    func handleNoteOff(midi: Int, playAudio: Bool = true) {
        midiHeldKeys.remove(midi)
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: midi)
        }
        guard let noteId = activeGoodNotesByMidi.removeValue(forKey: midi),
              var state = runtimeStates[noteId] else {
            return
        }
        guard let note = precisionNotes.first(where: { $0.id == noteId }), !note.isShortNote else {
            return
        }
        state.releasedEarly = true
        state.hiddenFromLane = true
        runtimeStates[noteId] = state
    }

    private func finishPhraseIfNeeded() {
        guard !phraseEnding else { return }
        phraseEnding = true
        audio.stopPhrase()
        let rate = EarTrainingPrecisionJudge.goodRate(notes: precisionNotes, states: runtimeStates)
        let rank = EarTrainingPrecisionJudge.rankForGoodRate(rate)
        if practiceMode {
            gameState = .idle
            phraseEnding = false
            return
        }
        lastPrecisionRank = rank
        lastGoodRatePercent = Int((rate * 100).rounded())
        gameState = .stageClear
        statusText = copy.stageClear
        saveLessonProgressIfNeeded(rank: rank)
    }

    private func saveLessonProgressIfNeeded(rank: EarTrainingPrecisionJudge.LessonRank) {
        guard let lessonContext, !practiceMode, !progressSaveStarted,
              EarTrainingPrecisionJudge.isClearRank(rank) else { return }
        progressSaveStarted = true
        lessonProgressStatus = .saving
        let lessonRank = EarTrainingPrecisionJudge.mapRankToLessonRank(rank)
        Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                _ = try await self.supabase.recordEarTrainingLessonProgress(
                    lessonId: lessonContext.lessonId,
                    lessonSongId: lessonContext.lessonSongId,
                    rank: lessonRank,
                    clearConditions: lessonContext.clearConditions
                )
                self.lessonProgressStatus = .saved
            } catch {
                self.lessonProgressStatus = .saving
            }
        }
    }

    func applySeek(_ targetSec: Double) {
        guard practiceMode, let url = preparedPhraseURL else { return }
        let clamped = max(0, min(phraseDurationSec, targetSec))
        let windowSec = resolveEffectiveTimingWindowSec(EarTrainingPrecisionJudge.judgmentWindowSec)
        EarTrainingPrecisionJudge.resetRuntimeStatesFromTime(
            notes: precisionNotes,
            states: &runtimeStates,
            phraseTimeSec: clamped,
            windowSec: windowSec
        )
        nextLyricIndex = 0
        activeLyricText = ""
        for (index, lyric) in phraseLyricEvents.enumerated() {
            if resolveCalibratedTargetTimeSec(lyric.targetTimeSec) <= clamped {
                nextLyricIndex = index + 1
                activeLyricText = lyric.text
            }
        }
        audio.stopPhrase()
        Task { @MainActor [weak self] in
            guard let self else { return }
            _ = await self.audio.preparePhraseForImmediatePlayback(url: url)
            self.gameState = .playingPhrase
            _ = self.audio.playPreparedPhraseFromTimelineOffset(url: url, timelineOffsetSec: clamped) { [weak self] in
                self?.gameState = .playingPhrase
            }
            self.updateSeekSliderUi(phraseTimeSec: clamped, force: true)
        }
    }

    func togglePause() {
        guard practiceMode else { return }
        if gameState == .playingPhrase || gameState == .countIn {
            pausedTimelineSec = audio.phraseWallClockTimelineSecNowOrNil() ?? seekSliderSec
            audio.pausePhrasePlayback()
            gameState = .idle
        } else if gameState == .idle, pausedTimelineSec != nil {
            startBattle()
        }
    }

    func seekBy(deltaSec: Double) {
        let base = audio.phraseWallClockTimelineSecNowOrNil() ?? seekSliderSec
        applySeek(base + deltaSec)
    }

    private func updateSeekSliderUi(phraseTimeSec: Double, force: Bool = false) {
        let now = CFAbsoluteTimeGetCurrent()
        if !force, now - lastSeekSliderUiUpdate < Self.seekSliderUiUpdateIntervalSec {
            return
        }
        lastSeekSliderUiUpdate = now
        seekSliderSec = phraseTimeSec
    }

    func applyPracticeModeAndRestart(_ value: Bool) {
        practiceMode = value
        if !value {
            practiceTransposeOffset = 0
            practiceSpeedPercent = 100
            audio.phrasePitchSemitones = 0
            audio.phrasePlaybackSpeedPercent = 100
        }
        applyDisplayMusicXml()
        rebuildPrecisionNotes()
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
        applyDisplayMusicXml()
        rebuildPrecisionNotes()
        isSettingsOpen = false
        startBattle()
    }

    func applyTimingAdjustmentMs(_ value: Int) {
        timingAdjustmentMs = EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(value)
        EarTrainingOsmdTimingAdjustment.saveTimingAdjustmentMs(timingAdjustmentMs)
        rebuildPrecisionNotes()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    private func effectivePracticeTransposeOffset() -> Int {
        guard practiceTransposeEnabled, practiceMode else { return 0 }
        return practiceTransposeOffset
    }

    private func resolveEffectivePracticeBpm() -> Int {
        EarTrainingPracticeSpeed.effectivePracticeBpm(stage.bpm, speedPercent: practiceMode ? practiceSpeedPercent : 100)
    }

    private func resolveEffectiveTargetTimeSec(_ targetTimeSec: Double) -> Double {
        practiceMode
            ? EarTrainingPracticeSpeed.scalePracticeTargetTimeSec(targetTimeSec, speedPercent: practiceSpeedPercent)
            : targetTimeSec
    }

    private func resolveCalibratedTargetTimeSec(_ targetTimeSec: Double) -> Double {
        EarTrainingOsmdTimingAdjustment.resolveCalibratedTargetTimeSec(
            speedScaledTargetTimeSec: resolveEffectiveTargetTimeSec(targetTimeSec),
            timingAdjustmentMs: timingAdjustmentMs
        )
    }

    private func resolveEffectiveTimingWindowSec(_ baseSec: Double) -> Double {
        practiceMode
            ? EarTrainingPracticeSpeed.scalePracticeTimingWindowSec(baseSec, speedPercent: practiceSpeedPercent)
            : baseSec
    }

    func currentPhraseTimelineSec() -> Double? {
        audio.phraseWallClockTimelineSecNowOrNil()
    }

    func currentEffectiveJudgmentWindowSec() -> Double {
        resolveEffectiveTimingWindowSec(EarTrainingPrecisionJudge.judgmentWindowSec)
    }
}

extension EarTrainingPrecisionBattleController: EarTrainingLobbyPresentable {
    var showLobbyControls: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var resultState: EarTrainingResultState? {
        switch gameState {
        case .stageClear: return .win
        case .gameOver: return .lose
        default: return nil
        }
    }

    var lastRank: EarTrainingRank? {
        guard let rank = lastPrecisionRank else { return nil }
        switch rank {
        case .s: return .perfect
        case .a: return .great
        case .b, .c: return .good
        case .d: return .fail
        }
    }

    var resultRankLine: String? {
        guard !practiceMode, let rank = lastPrecisionRank, let percent = lastGoodRatePercent else {
            return nil
        }
        return "\(rank.rawValue) — \(percent)%"
    }

    var startButtonLabel: String {
        gameState == .idle ? "START" : "RETRY"
    }

    var canChangePracticeMode: Bool { lessonContext != nil }

    var lessonProgressText: String? {
        guard lessonContext != nil, gameState == .stageClear else { return nil }
        switch lessonProgressStatus {
        case .saving: return isEnglishCopy ? "Saving…" : "保存中…"
        case .saved: return isEnglishCopy ? "Progress saved." : "進捗を保存しました。"
        case nil: return nil
        }
    }

    var stageTitleForLobby: String {
        stage.localizedTitle(isEnglishCopy ? .en : .ja)
    }

    var quizRulesLine: String? {
        stage.battleClearConditionText(isEnglish: isEnglishCopy)
    }

    func handleBack() { onExitCallback() }

    func setPracticeMode(_ value: Bool) {
        applyPracticeModeAndRestart(value)
    }
}

extension EarTrainingPrecisionBattleController: EarTrainingPianoPlayable {
    var voicingHintsByMidi: [Int: VoicingHintState] { [:] }
}
