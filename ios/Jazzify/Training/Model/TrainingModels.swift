import Foundation

enum TrainingKind: String, Codable, Sendable {
    case noteReading = "note_reading"
    case interval
    case chord
    case scale
    case voicing
    case progression
}

enum TrainingClefMode: String, Codable, Sendable {
    case instrument
    case bassConcert = "bass_concert"
    case grandConcert = "grand_concert"
}

struct TrainingConfig: Codable, Sendable {
    let roots: [String]?
    let quality: String?
    let scale: String?
    let interval: String?
    let direction: String?
    let clef: String?
    let includeAccidentals: Bool?
    let intervals: [String]?
    let staves: [Int]?
    let voicingNotes: [String]?
    let referenceRoot: String?
    let minLowestNote: String?

    enum CodingKeys: String, CodingKey {
        case roots, quality, scale, interval, direction, clef, intervals, staves
        case includeAccidentals = "include_accidentals"
        case voicingNotes = "voicing_notes"
        case referenceRoot = "reference_root"
        case minLowestNote = "min_lowest_note"
    }
}

struct TrainingCategoryRow: Codable, Identifiable, Sendable {
    let id: UUID
    let slug: String
    let titleJa: String
    let titleEn: String
    let sortOrder: Int
    let isFree: Bool
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug
        case titleJa = "title_ja"
        case titleEn = "title_en"
        case sortOrder = "sort_order"
        case isFree = "is_free"
        case isActive = "is_active"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? titleEn : titleJa
    }
}

struct TrainingRow: Codable, Identifiable, Sendable {
    let id: UUID
    let categoryId: UUID
    let slug: String
    let titleJa: String
    let titleEn: String
    let sortOrder: Int
    let kind: TrainingKind
    let clefMode: TrainingClefMode
    let useKeySignature: Bool
    let playRootOnCorrect: Bool
    let bgmUrl: String
    let config: TrainingConfig
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug, kind, config
        case categoryId = "category_id"
        case titleJa = "title_ja"
        case titleEn = "title_en"
        case sortOrder = "sort_order"
        case clefMode = "clef_mode"
        case useKeySignature = "use_key_signature"
        case playRootOnCorrect = "play_root_on_correct"
        case bgmUrl = "bgm_url"
        case isActive = "is_active"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? titleEn : titleJa
    }
}

struct TrainingCategoryWithTrainings: Identifiable, Sendable {
    let category: TrainingCategoryRow
    let trainings: [TrainingRow]

    var id: UUID { category.id }
}

struct TrainingQuestionNote: Sendable, Equatable {
    let noteName: String
    let midi: Int
    let pitchClass: Int
    let staff: Int
    let isTarget: Bool
}

struct TrainingQuestion: Sendable, Equatable {
    let questionKey: String
    let promptLabel: String
    let notes: [TrainingQuestionNote]
    let layout: TrainingQuestionLayout
    let ordered: Bool
    let keyFifths: Int
    let rootMidi: Int?
}

enum TrainingQuestionLayout: String, Sendable {
    case stacked
    case horizontal
}

struct TrainingQuestionBuilderOptions: Sendable {
    let training: TrainingRow
    let ignoreNotationInstrument: Bool
    let lessonRoots: [String]?
    let lessonOrder: String?
    let lessonItems: [TrainingConfig]?
    let lessonItemIndex: Int?
    let previousQuestionKey: String?
}

struct TrainingRuntimeEnemy: Sendable {
    var typeIndex: Int
    var active: Bool
    var fadeAlpha: CGFloat
    var slashUntilSec: TimeInterval
}

struct TrainingRuntimeDyingEnemy: Sendable {
    var active: Bool
    var typeIndex: Int
    var alpha: CGFloat
    var slashUntilSec: TimeInterval
    var offsetX: CGFloat
}

enum TrainingGameResult: String, Sendable {
    case playing
    case finished
}

struct TrainingRuntime: Sendable {
    var durationSec: TimeInterval
    var elapsedSec: TimeInterval
    var score: Int
    var result: TrainingGameResult
    var enemy: TrainingRuntimeEnemy
    var dyingEnemy: TrainingRuntimeDyingEnemy
    var question: TrainingQuestion?
    var correctTargetIndices: [Int]
    var nextQuestionKey: String?
    var guardPoseUntilSec: TimeInterval
}

struct TrainingScoreSummary: Identifiable, Sendable {
    let trainingId: UUID
    let bestScore: Int
    let bestRank: TrainingLetterRank
    let rankPosition: Int?

    var id: UUID { trainingId }
}

struct TrainingRankingEntry: Identifiable, Sendable {
    let rankPosition: Int
    let userId: UUID
    let nickname: String
    let avatarUrl: String?
    let playerLevel: Int
    let bestScore: Int
    let bestRank: TrainingLetterRank

    var id: UUID { userId }
}

struct TrainingUpsertResult: Sendable {
    let bestScore: Int
    let bestRank: TrainingLetterRank
    let isNewBest: Bool
}

struct TrainingLessonContext: Sendable {
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}

enum TrainingGamePhase: Equatable {
    case countdown
    case playing
    case finished
}

enum TrainingScreen: Equatable {
    case list
    case ranking
    case game
    case result
}

enum TrainingConstants {
    static let gameDurationSec: TimeInterval = 60
    static let countdownSec = 3
    static let enemyCount = 10
    static let catalogTTL: TimeInterval = 60
    static let guardPoseSec: TimeInterval = 1
    static let hudHeight: CGFloat = 64
    static let dyingFadeSpeed: CGFloat = 2.5
    static let dyingKnockbackPxPerSec: CGFloat = 120

    static func staffHeightRatio(clefMode: TrainingClefMode) -> CGFloat {
        clefMode == .grandConcert ? 0.5 : 0.34
    }

    static func staffNoteOpacity(practiceMode: Bool, kind: TrainingKind) -> CGFloat {
        practiceMode || kind == .noteReading || kind == .interval ? 1 : 0
    }
}
