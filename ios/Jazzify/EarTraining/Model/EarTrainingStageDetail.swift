import Foundation

/// 耳コピバトルのステージ詳細データ。Web 版 `EarTrainingStage` ([src/types/index.ts L726-755]) を移植。
/// `Lesson.swift` の軽量 `EarTrainingStage` (レッスン一覧表示用) と区別するため、`Detail` 接尾辞を付ける。
enum EarTrainingMode: String, Codable, Sendable {
    case phrase
    case chordVoicing = "chord_voicing"
    case chordQuiz = "chord_quiz"
    case chordOSMD = "chord_osmd"
    case chordPrecision = "chord_precision"
    case adlib
    case phrasePairAdlib = "phrase_pair_adlib"

    /// レッスン課題カード用（Web `formatEarTrainingModeLabel` と同値）
    func lessonDisplayLabel(locale: AppLocale) -> String {
        let ja = locale == .ja
        switch self {
        case .phrase:
            return ja ? "耳コピ" : "Ear copy"
        case .chordVoicing:
            return ja ? "コード演奏" : "Chord voicing"
        case .chordQuiz:
            return ja ? "コードクイズ" : "Chord quiz"
        case .chordOSMD:
            return ja ? "楽譜バトル" : "Sheet music battle"
        case .chordPrecision:
            return ja ? "精密モード" : "Precision mode"
        case .adlib:
            return ja ? "アドリブ" : "Ad lib"
        case .phrasePairAdlib:
            return ja ? "フレーズペアアドリブ" : "Phrase pair ad lib"
        }
    }
}

struct EarTrainingChordQuizItem: Codable, Identifiable, Sendable {
    let id: UUID
    let stageId: UUID
    let orderIndex: Int
    let measureNumber: Int?
    let beatOffset: Double?
    let durationBeats: Double?
    let chordName: String
    let voicing: [String]
    let voicingStaves: [Int]
    let keyFifths: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case stageId = "stage_id"
        case orderIndex = "order_index"
        case measureNumber = "measure_number"
        case beatOffset = "beat_offset"
        case durationBeats = "duration_beats"
        case chordName = "chord_name"
        case voicing
        case voicingStaves = "voicing_staves"
        case keyFifths = "key_fifths"
    }
}

struct EarTrainingStageDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let slug: String
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let bpm: Int
    let beatsPerMeasure: Int
    let beatType: Int
    let loopMeasures: Int
    let maxLoopsPerPhrase: Int
    let countInBeats: Int
    let timeLimitSec: Int
    let playerHp: Int
    let enemyHp: Int
    let perCorrectNoteDamage: Int
    let goodCompletionDamage: Int
    let greatCompletionDamage: Int
    let perfectCompletionDamage: Int
    let missDamage: Int
    let failDamage: Int
    let perfectMaxMisses: Int
    let greatMaxMisses: Int
    let backgroundTheme: String?
    let isActive: Bool?
    let mode: EarTrainingMode?
    /// MusicXML-style key signature fifths (-7…7) for staff when phrase has no override.
    let keyFifths: Int?
    let phrases: [EarTrainingPhraseDetail]?
    /// Web `chord_voicing_self_paced` — セルフペース（無音・カウントイン省略）。
    let chordVoicingSelfPaced: Bool?
    let quizDurationSeconds: Int?
    let quizQuestionOrder: String?
    let quizShowNotationInBattle: Bool?
    let hideChordNamesInBattle: Bool?
    let quizRequiredCorrectCount: Int?
    let showKeyboardHintsInBattle: Bool?
    /// Web `osmd_targets_from_score` — MusicXML の音符アタックから判定ターゲットを生成する。
    let osmdTargetsFromScore: Bool?
    /// Web `practice_transpose` — 練習モードで ±6 半音移調 UI を有効化。
    let practiceTranspose: Bool?
    let chordQuizItems: [EarTrainingChordQuizItem]?
    /// Web `ear_training_stages.chord_voicing_composite_phrase`
    let chordVoicingCompositePhrase: Bool?
    /// PostgREST には無いフィールド（`fetchEarTrainingStageDetail` の enrich で付与）。
    let compositePhraseBootstrap: EarTrainingCompositePhraseBootstrap?
    /// PostgREST には無いフィールド（`fetchEarTrainingStageDetail` の enrich で付与）。
    let phrasePairAdlibBootstrap: EarTrainingPhrasePairAdlibBootstrap?

    var resolvedMode: EarTrainingMode { mode ?? .phrase }

    var isPhrasePairAdlibConfigured: Bool {
        resolvedMode == .phrasePairAdlib
            && phrasePairAdlibBootstrap.map { !$0.steps.isEmpty } == true
    }

    var resolvedChordVoicingSelfPaced: Bool { chordVoicingSelfPaced == true }

    /// コード演奏バトル複合モードが DB 構成まで揃っているか（一覧取得では enrich が無く未設定のとき false）。
    var isChordVoicingCompositePhraseConfigured: Bool {
        resolvedMode == .chordVoicing
            && chordVoicingCompositePhrase == true
            && compositePhraseBootstrap.map { !$0.definitions.isEmpty } == true
    }

    var resolvedQuizDurationSeconds: Int {
        let raw = quizDurationSeconds ?? 90
        return max(10, min(600, raw))
    }

    var resolvedQuizRequiredCorrectCount: Int {
        max(1, quizRequiredCorrectCount ?? 80)
    }

    var resolvedQuizQuestionOrderSequential: Bool {
        quizQuestionOrder == "sequential"
    }

    var resolvedShowKeyboardHintsInBattle: Bool {
        showKeyboardHintsInBattle == true
    }

    /// Web `earTrainingOsmdUsesScoreTargets` 相当。`chord_osmd` では未指定時 true（明示的 false のみ chords タイミング）。
    var resolvedOsmdTargetsFromScore: Bool {
        if osmdTargetsFromScore == true { return true }
        if resolvedMode == .chordOSMD, osmdTargetsFromScore != false { return true }
        return false
    }

    var resolvedPracticeTranspose: Bool {
        practiceTranspose == true
    }

    func resolvedQuizHideUnpressedNotationInBattle(practiceMode: Bool) -> Bool {
        guard practiceMode != true else { return false }
        return quizShowNotationInBattle == false
    }

    var resolvedHideChordNamesInBattle: Bool {
        hideChordNamesInBattle == true
    }

    func battleClearConditionText(isEnglish: Bool) -> String {
        switch resolvedMode {
        case .chordQuiz:
            let r = max(1, quizRequiredCorrectCount ?? 80)
            if isEnglish {
                return "Answer at least \(r) questions correctly."
            }
            return "\(r)問以上正解"
        case .chordOSMD:
            return isEnglish
                ? "Reduce the enemy HP to 0."
                : "敵HPを0にする。"
        case .chordPrecision:
            return isEnglish
                ? "Achieve 70% or more GOOD notes."
                : "GOOD率70%以上でクリア"
        case .chordVoicing, .phrase, .adlib, .phrasePairAdlib:
            return isEnglish
                ? "Reduce the enemy HP to 0 within the time limit."
                : "制限時間以内に敵HPを0にする"
        }
    }

    func sortedChordQuizItems() -> [EarTrainingChordQuizItem] {
        (chordQuizItems ?? []).sorted { $0.orderIndex < $1.orderIndex }
    }

    enum CodingKeys: String, CodingKey {
        case id, slug, title, description, bpm, mode, phrases
        case keyFifths = "key_fifths"
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case beatsPerMeasure = "beats_per_measure"
        case beatType = "beat_type"
        case loopMeasures = "loop_measures"
        case maxLoopsPerPhrase = "max_loops_per_phrase"
        case countInBeats = "count_in_beats"
        case timeLimitSec = "time_limit_sec"
        case playerHp = "player_hp"
        case enemyHp = "enemy_hp"
        case perCorrectNoteDamage = "per_correct_note_damage"
        case goodCompletionDamage = "good_completion_damage"
        case greatCompletionDamage = "great_completion_damage"
        case perfectCompletionDamage = "perfect_completion_damage"
        case missDamage = "miss_damage"
        case failDamage = "fail_damage"
        case perfectMaxMisses = "perfect_max_misses"
        case greatMaxMisses = "great_max_misses"
        case backgroundTheme = "background_theme"
        case isActive = "is_active"
        case chordVoicingSelfPaced = "chord_voicing_self_paced"
        case quizDurationSeconds = "quiz_duration_seconds"
        case quizQuestionOrder = "quiz_question_order"
        case quizShowNotationInBattle = "quiz_show_notation_in_battle"
        case hideChordNamesInBattle = "hide_chord_names_in_battle"
        case quizRequiredCorrectCount = "quiz_required_correct_count"
        case showKeyboardHintsInBattle = "show_keyboard_hints_in_battle"
        case osmdTargetsFromScore = "osmd_targets_from_score"
        case practiceTranspose = "practice_transpose"
        case chordQuizItems = "chord_quiz_items"
        case chordVoicingCompositePhrase = "chord_voicing_composite_phrase"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        slug = try container.decode(String.self, forKey: .slug)
        title = try container.decode(String.self, forKey: .title)
        titleEn = try container.decodeIfPresent(String.self, forKey: .titleEn)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        descriptionEn = try container.decodeIfPresent(String.self, forKey: .descriptionEn)
        bpm = try container.decode(Int.self, forKey: .bpm)
        beatsPerMeasure = try container.decode(Int.self, forKey: .beatsPerMeasure)
        beatType = try container.decode(Int.self, forKey: .beatType)
        loopMeasures = try container.decode(Int.self, forKey: .loopMeasures)
        maxLoopsPerPhrase = try container.decode(Int.self, forKey: .maxLoopsPerPhrase)
        countInBeats = try container.decode(Int.self, forKey: .countInBeats)
        timeLimitSec = try container.decode(Int.self, forKey: .timeLimitSec)
        playerHp = try container.decode(Int.self, forKey: .playerHp)
        enemyHp = try container.decode(Int.self, forKey: .enemyHp)
        perCorrectNoteDamage = try container.decode(Int.self, forKey: .perCorrectNoteDamage)
        goodCompletionDamage = try container.decode(Int.self, forKey: .goodCompletionDamage)
        greatCompletionDamage = try container.decode(Int.self, forKey: .greatCompletionDamage)
        perfectCompletionDamage = try container.decode(Int.self, forKey: .perfectCompletionDamage)
        missDamage = try container.decode(Int.self, forKey: .missDamage)
        failDamage = try container.decode(Int.self, forKey: .failDamage)
        perfectMaxMisses = try container.decode(Int.self, forKey: .perfectMaxMisses)
        greatMaxMisses = try container.decode(Int.self, forKey: .greatMaxMisses)
        backgroundTheme = try container.decodeIfPresent(String.self, forKey: .backgroundTheme)
        isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
        mode = try container.decodeIfPresent(EarTrainingMode.self, forKey: .mode)
        keyFifths = try container.decodeIfPresent(Int.self, forKey: .keyFifths)
        phrases = try container.decodeIfPresent([EarTrainingPhraseDetail].self, forKey: .phrases)
        chordVoicingSelfPaced = try container.decodeIfPresent(Bool.self, forKey: .chordVoicingSelfPaced)
        quizDurationSeconds = try container.decodeIfPresent(Int.self, forKey: .quizDurationSeconds)
        quizQuestionOrder = try container.decodeIfPresent(String.self, forKey: .quizQuestionOrder)
        quizShowNotationInBattle = try container.decodeIfPresent(Bool.self, forKey: .quizShowNotationInBattle)
        hideChordNamesInBattle = try container.decodeIfPresent(Bool.self, forKey: .hideChordNamesInBattle)
        quizRequiredCorrectCount = try container.decodeIfPresent(Int.self, forKey: .quizRequiredCorrectCount)
        showKeyboardHintsInBattle = try container.decodeIfPresent(Bool.self, forKey: .showKeyboardHintsInBattle)
        osmdTargetsFromScore = try container.decodeIfPresent(Bool.self, forKey: .osmdTargetsFromScore)
        practiceTranspose = try container.decodeIfPresent(Bool.self, forKey: .practiceTranspose)
        chordQuizItems = try container.decodeIfPresent([EarTrainingChordQuizItem].self, forKey: .chordQuizItems)
        chordVoicingCompositePhrase = try container.decodeIfPresent(Bool.self, forKey: .chordVoicingCompositePhrase)
        compositePhraseBootstrap = nil
        phrasePairAdlibBootstrap = nil
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(slug, forKey: .slug)
        try container.encode(title, forKey: .title)
        try container.encodeIfPresent(titleEn, forKey: .titleEn)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(descriptionEn, forKey: .descriptionEn)
        try container.encode(bpm, forKey: .bpm)
        try container.encode(beatsPerMeasure, forKey: .beatsPerMeasure)
        try container.encode(beatType, forKey: .beatType)
        try container.encode(loopMeasures, forKey: .loopMeasures)
        try container.encode(maxLoopsPerPhrase, forKey: .maxLoopsPerPhrase)
        try container.encode(countInBeats, forKey: .countInBeats)
        try container.encode(timeLimitSec, forKey: .timeLimitSec)
        try container.encode(playerHp, forKey: .playerHp)
        try container.encode(enemyHp, forKey: .enemyHp)
        try container.encode(perCorrectNoteDamage, forKey: .perCorrectNoteDamage)
        try container.encode(goodCompletionDamage, forKey: .goodCompletionDamage)
        try container.encode(greatCompletionDamage, forKey: .greatCompletionDamage)
        try container.encode(perfectCompletionDamage, forKey: .perfectCompletionDamage)
        try container.encode(missDamage, forKey: .missDamage)
        try container.encode(failDamage, forKey: .failDamage)
        try container.encode(perfectMaxMisses, forKey: .perfectMaxMisses)
        try container.encode(greatMaxMisses, forKey: .greatMaxMisses)
        try container.encodeIfPresent(backgroundTheme, forKey: .backgroundTheme)
        try container.encodeIfPresent(isActive, forKey: .isActive)
        try container.encodeIfPresent(mode, forKey: .mode)
        try container.encodeIfPresent(keyFifths, forKey: .keyFifths)
        try container.encodeIfPresent(phrases, forKey: .phrases)
        try container.encodeIfPresent(chordVoicingSelfPaced, forKey: .chordVoicingSelfPaced)
        try container.encodeIfPresent(quizDurationSeconds, forKey: .quizDurationSeconds)
        try container.encodeIfPresent(quizQuestionOrder, forKey: .quizQuestionOrder)
        try container.encodeIfPresent(quizShowNotationInBattle, forKey: .quizShowNotationInBattle)
        try container.encodeIfPresent(hideChordNamesInBattle, forKey: .hideChordNamesInBattle)
        try container.encodeIfPresent(quizRequiredCorrectCount, forKey: .quizRequiredCorrectCount)
        try container.encodeIfPresent(showKeyboardHintsInBattle, forKey: .showKeyboardHintsInBattle)
        try container.encodeIfPresent(osmdTargetsFromScore, forKey: .osmdTargetsFromScore)
        try container.encodeIfPresent(practiceTranspose, forKey: .practiceTranspose)
        try container.encodeIfPresent(chordQuizItems, forKey: .chordQuizItems)
        try container.encodeIfPresent(chordVoicingCompositePhrase, forKey: .chordVoicingCompositePhrase)
    }

    init(
        id: UUID,
        slug: String,
        title: String,
        titleEn: String?,
        description: String?,
        descriptionEn: String?,
        bpm: Int,
        beatsPerMeasure: Int,
        beatType: Int,
        loopMeasures: Int,
        maxLoopsPerPhrase: Int,
        countInBeats: Int,
        timeLimitSec: Int,
        playerHp: Int,
        enemyHp: Int,
        perCorrectNoteDamage: Int,
        goodCompletionDamage: Int,
        greatCompletionDamage: Int,
        perfectCompletionDamage: Int,
        missDamage: Int,
        failDamage: Int,
        perfectMaxMisses: Int,
        greatMaxMisses: Int,
        backgroundTheme: String?,
        isActive: Bool?,
        mode: EarTrainingMode?,
        keyFifths: Int?,
        phrases: [EarTrainingPhraseDetail]?,
        chordVoicingSelfPaced: Bool?,
        quizDurationSeconds: Int?,
        quizQuestionOrder: String?,
        quizShowNotationInBattle: Bool?,
        hideChordNamesInBattle: Bool?,
        quizRequiredCorrectCount: Int?,
        showKeyboardHintsInBattle: Bool?,
        osmdTargetsFromScore: Bool? = nil,
        practiceTranspose: Bool? = nil,
        chordQuizItems: [EarTrainingChordQuizItem]?,
        chordVoicingCompositePhrase: Bool?,
        compositePhraseBootstrap: EarTrainingCompositePhraseBootstrap?,
        phrasePairAdlibBootstrap: EarTrainingPhrasePairAdlibBootstrap? = nil
    ) {
        self.id = id
        self.slug = slug
        self.title = title
        self.titleEn = titleEn
        self.description = description
        self.descriptionEn = descriptionEn
        self.bpm = bpm
        self.beatsPerMeasure = beatsPerMeasure
        self.beatType = beatType
        self.loopMeasures = loopMeasures
        self.maxLoopsPerPhrase = maxLoopsPerPhrase
        self.countInBeats = countInBeats
        self.timeLimitSec = timeLimitSec
        self.playerHp = playerHp
        self.enemyHp = enemyHp
        self.perCorrectNoteDamage = perCorrectNoteDamage
        self.goodCompletionDamage = goodCompletionDamage
        self.greatCompletionDamage = greatCompletionDamage
        self.perfectCompletionDamage = perfectCompletionDamage
        self.missDamage = missDamage
        self.failDamage = failDamage
        self.perfectMaxMisses = perfectMaxMisses
        self.greatMaxMisses = greatMaxMisses
        self.backgroundTheme = backgroundTheme
        self.isActive = isActive
        self.mode = mode
        self.keyFifths = keyFifths
        self.phrases = phrases
        self.chordVoicingSelfPaced = chordVoicingSelfPaced
        self.quizDurationSeconds = quizDurationSeconds
        self.quizQuestionOrder = quizQuestionOrder
        self.quizShowNotationInBattle = quizShowNotationInBattle
        self.hideChordNamesInBattle = hideChordNamesInBattle
        self.quizRequiredCorrectCount = quizRequiredCorrectCount
        self.showKeyboardHintsInBattle = showKeyboardHintsInBattle
        self.osmdTargetsFromScore = osmdTargetsFromScore
        self.practiceTranspose = practiceTranspose
        self.chordQuizItems = chordQuizItems
        self.chordVoicingCompositePhrase = chordVoicingCompositePhrase
        self.compositePhraseBootstrap = compositePhraseBootstrap
        self.phrasePairAdlibBootstrap = phrasePairAdlibBootstrap
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        if locale == .en {
            let en = titleEn?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return en.isEmpty ? "" : en
        }
        return title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        if locale == .en {
            let en = descriptionEn?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return en.isEmpty ? nil : en
        }
        return description
    }

    /// Web 版 `sortStageRelations` ([src/platform/supabaseEarTraining.ts L35-45]) と同じ並び順に整える。
    func sortedPhrases() -> [EarTrainingPhraseDetail] {
        let raw = phrases ?? []
        let sortedPhrases = raw.sorted { $0.orderIndex < $1.orderIndex }
        return sortedPhrases.map { phrase in
            EarTrainingPhraseDetail(
                id: phrase.id,
                stageId: phrase.stageId,
                orderIndex: phrase.orderIndex,
                keyFifths: phrase.keyFifths,
                title: phrase.title,
                titleEn: phrase.titleEn,
                musicXmlUrl: phrase.musicXmlUrl,
                midiUrl: phrase.midiUrl,
                audioUrl: phrase.audioUrl,
                loopDurationSec: phrase.loopDurationSec,
                audioDurationSec: phrase.audioDurationSec,
                noteCount: phrase.noteCount,
                notes: (phrase.notes ?? []).sorted { $0.noteIndex < $1.noteIndex },
                chords: (phrase.chords ?? []).sorted { $0.orderIndex < $1.orderIndex },
                demoLoops: (phrase.demoLoops ?? []).sorted { $0.loopNumber < $1.loopNumber }
            )
        }
    }
}

/// レッスン詳細画面で先読みした耳コピステージ詳細を、バトル起動時に再利用する。
actor EarTrainingStageDetailCache {
    static let shared = EarTrainingStageDetailCache()

    private var cachedDetails: [UUID: EarTrainingStageDetail] = [:]
    private var inFlightTasks: [UUID: Task<EarTrainingStageDetail, Error>] = [:]

    private init() {}

    func stageDetail(for stageId: UUID) async throws -> EarTrainingStageDetail {
        if let cached = cachedDetails[stageId] {
            return cached
        }

        if let task = inFlightTasks[stageId] {
            return try await resolve(task: task, stageId: stageId)
        }

        let task = Task {
            try await SupabaseService.shared.fetchEarTrainingStageDetail(stageId: stageId)
        }
        inFlightTasks[stageId] = task
        return try await resolve(task: task, stageId: stageId)
    }

    func preload(stageIds: [UUID]) {
        for stageId in Set(stageIds) {
            guard cachedDetails[stageId] == nil, inFlightTasks[stageId] == nil else { continue }
            inFlightTasks[stageId] = Task {
                try await SupabaseService.shared.fetchEarTrainingStageDetail(stageId: stageId)
            }
        }
    }

    private func resolve(task: Task<EarTrainingStageDetail, Error>, stageId: UUID) async throws -> EarTrainingStageDetail {
        do {
            let detail = try await task.value
            cachedDetails[stageId] = detail
            inFlightTasks[stageId] = nil
            return detail
        } catch {
            inFlightTasks[stageId] = nil
            throw error
        }
    }
}

struct EarTrainingPhraseDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let stageId: UUID
    let orderIndex: Int
    /// Per-phrase staff key; nil falls back to stage `key_fifths`.
    let keyFifths: Int?
    let title: String?
    let titleEn: String?
    let musicXmlUrl: String?
    let midiUrl: String?
    let audioUrl: String
    let loopDurationSec: Double
    let audioDurationSec: Double
    let noteCount: Int
    let notes: [EarTrainingPhraseNoteDetail]?
    let chords: [EarTrainingPhraseChordDetail]?
    let demoLoops: [EarTrainingPhraseDemoLoopDetail]?

    enum CodingKeys: String, CodingKey {
        case id, title, notes, chords
        case keyFifths = "key_fifths"
        case stageId = "stage_id"
        case orderIndex = "order_index"
        case titleEn = "title_en"
        case musicXmlUrl = "music_xml_url"
        case midiUrl = "midi_url"
        case audioUrl = "audio_url"
        case loopDurationSec = "loop_duration_sec"
        case audioDurationSec = "audio_duration_sec"
        case noteCount = "note_count"
        case demoLoops = "demo_loops"
    }
}

struct EarTrainingPhraseNoteDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let phraseId: UUID
    let noteIndex: Int
    let pitchMidi: Int
    let pitchClass: Int
    let noteName: String
    let octave: Int?
    let measureNumber: Int?
    let beatOffset: Double?
    let tiedFromPrevious: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case phraseId = "phrase_id"
        case noteIndex = "note_index"
        case pitchMidi = "pitch_midi"
        case pitchClass = "pitch_class"
        case noteName = "note_name"
        case octave
        case measureNumber = "measure_number"
        case beatOffset = "beat_offset"
        case tiedFromPrevious = "tied_from_previous"
    }
}

struct EarTrainingPhraseChordQuoteDetail: Codable, Sendable, Hashable {
    let id: UUID
    let phraseChordId: UUID
    let text: String

    enum CodingKeys: String, CodingKey {
        case id
        case phraseChordId = "phrase_chord_id"
        case text
    }
}

struct EarTrainingPhraseChordDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let phraseId: UUID
    let orderIndex: Int
    let chordName: String
    let measureNumber: Int?
    let beatOffset: Double?
    let durationBeats: Double?
    let startTimeSec: Double?
    let endTimeSec: Double?
    let voicing: [String]?
    let voicingStaves: [Int]?
    /// `ear_training_phrase_chord_quotes`（0..1）。PostgREST のネストが配列になる場合も許容。
    let quote: EarTrainingPhraseChordQuoteDetail?
    let inputDisabled: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case phraseId = "phrase_id"
        case orderIndex = "order_index"
        case chordName = "chord_name"
        case measureNumber = "measure_number"
        case beatOffset = "beat_offset"
        case durationBeats = "duration_beats"
        case startTimeSec = "start_time_sec"
        case endTimeSec = "end_time_sec"
        case voicing
        case voicingStaves = "voicing_staves"
        case quote
        case inputDisabled = "input_disabled"
    }

    init(
        id: UUID,
        phraseId: UUID,
        orderIndex: Int,
        chordName: String,
        measureNumber: Int? = nil,
        beatOffset: Double? = nil,
        durationBeats: Double? = nil,
        startTimeSec: Double? = nil,
        endTimeSec: Double? = nil,
        voicing: [String]?,
        voicingStaves: [Int]?,
        quote: EarTrainingPhraseChordQuoteDetail? = nil,
        inputDisabled: Bool = false
    ) {
        self.id = id
        self.phraseId = phraseId
        self.orderIndex = orderIndex
        self.chordName = chordName
        self.measureNumber = measureNumber
        self.beatOffset = beatOffset
        self.durationBeats = durationBeats
        self.startTimeSec = startTimeSec
        self.endTimeSec = endTimeSec
        self.voicing = voicing
        self.voicingStaves = voicingStaves
        self.quote = quote
        self.inputDisabled = inputDisabled
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(UUID.self, forKey: .id)
        phraseId = try c.decode(UUID.self, forKey: .phraseId)
        orderIndex = try c.decode(Int.self, forKey: .orderIndex)
        chordName = try c.decode(String.self, forKey: .chordName)
        measureNumber = try c.decodeIfPresent(Int.self, forKey: .measureNumber)
        beatOffset = try c.decodeIfPresent(Double.self, forKey: .beatOffset)
        durationBeats = try c.decodeIfPresent(Double.self, forKey: .durationBeats)
        startTimeSec = try c.decodeIfPresent(Double.self, forKey: .startTimeSec)
        endTimeSec = try c.decodeIfPresent(Double.self, forKey: .endTimeSec)
        voicing = try c.decodeIfPresent([String].self, forKey: .voicing)
        voicingStaves = try c.decodeIfPresent([Int].self, forKey: .voicingStaves)
        quote = Self.decodeQuote(container: c)
        inputDisabled = try c.decodeIfPresent(Bool.self, forKey: .inputDisabled) ?? false
    }

    private static func decodeQuote(container c: KeyedDecodingContainer<CodingKeys>) -> EarTrainingPhraseChordQuoteDetail? {
        if let q = try? c.decode(EarTrainingPhraseChordQuoteDetail.self, forKey: .quote) {
            return q
        }
        if let arr = try? c.decode([EarTrainingPhraseChordQuoteDetail].self, forKey: .quote) {
            return arr.first
        }
        return nil
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(phraseId, forKey: .phraseId)
        try c.encode(orderIndex, forKey: .orderIndex)
        try c.encode(chordName, forKey: .chordName)
        try c.encodeIfPresent(measureNumber, forKey: .measureNumber)
        try c.encodeIfPresent(beatOffset, forKey: .beatOffset)
        try c.encodeIfPresent(durationBeats, forKey: .durationBeats)
        try c.encodeIfPresent(startTimeSec, forKey: .startTimeSec)
        try c.encodeIfPresent(endTimeSec, forKey: .endTimeSec)
        try c.encodeIfPresent(voicing, forKey: .voicing)
        try c.encodeIfPresent(voicingStaves, forKey: .voicingStaves)
        try c.encodeIfPresent(quote, forKey: .quote)
    }
}

struct EarTrainingPhraseDemoLoopDetail: Codable, Sendable, Hashable {
    let phraseId: UUID
    let loopNumber: Int

    enum CodingKeys: String, CodingKey {
        case phraseId = "phrase_id"
        case loopNumber = "loop_number"
    }
}
