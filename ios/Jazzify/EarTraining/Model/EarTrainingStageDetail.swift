import Foundation

/// 耳コピバトルのステージ詳細データ。Web 版 `EarTrainingStage` ([src/types/index.ts L726-755]) を移植。
/// `Lesson.swift` の軽量 `EarTrainingStage` (レッスン一覧表示用) と区別するため、`Detail` 接尾辞を付ける。
enum EarTrainingMode: String, Codable, Sendable {
    case phrase
    case chordVoicing = "chord_voicing"
    case chordQuiz = "chord_quiz"
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
    let quizRequiredCorrectCount: Int?
    let chordQuizItems: [EarTrainingChordQuizItem]?

    var resolvedMode: EarTrainingMode { mode ?? .phrase }

    var resolvedChordVoicingSelfPaced: Bool { chordVoicingSelfPaced == true }

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

    func resolvedQuizHideUnpressedNotationInBattle(practiceMode: Bool) -> Bool {
        guard practiceMode != true else { return false }
        return quizShowNotationInBattle == false
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
        case quizRequiredCorrectCount = "quiz_required_correct_count"
        case chordQuizItems = "chord_quiz_items"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
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
        quote: EarTrainingPhraseChordQuoteDetail? = nil
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
