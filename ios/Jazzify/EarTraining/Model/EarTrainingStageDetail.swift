import Foundation

/// 耳コピバトルのステージ詳細データ。Web 版 `EarTrainingStage` ([src/types/index.ts L726-755]) を移植。
/// `Lesson.swift` の軽量 `EarTrainingStage` (レッスン一覧表示用) と区別するため、`Detail` 接尾辞を付ける。
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
    let phrases: [EarTrainingPhraseDetail]?

    enum CodingKeys: String, CodingKey {
        case id, slug, title, description, bpm, phrases
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

struct EarTrainingPhraseDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let stageId: UUID
    let orderIndex: Int
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
