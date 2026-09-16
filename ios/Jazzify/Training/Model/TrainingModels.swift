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

struct TrainingProgressionEntry: Codable, Sendable, Equatable {
    let name: String
    let voicing: [Int]
    let voicingNames: [String]
    let keyFifths: Int
    let voicingStaves: [Int]?
    let voicingSlots: [[String]]?

    enum CodingKeys: String, CodingKey {
        case name, voicing
        case voicingNames = "voicing_names"
        case keyFifths = "key_fifths"
        case voicingStaves = "voicing_staves"
        case voicingSlots = "voicing_slots"
    }

    init(
        name: String,
        voicing: [Int],
        voicingNames: [String],
        keyFifths: Int,
        voicingStaves: [Int]? = nil,
        voicingSlots: [[String]]? = nil
    ) {
        self.name = name
        self.voicing = voicing
        self.voicingNames = voicingNames
        self.keyFifths = keyFifths
        self.voicingStaves = voicingStaves
        self.voicingSlots = voicingSlots
    }
}

struct TrainingReferenceChord: Codable, Sendable, Equatable {
    let name: String
    let notes: [String]
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
    let inversion: Int?
    let ordered: Bool?
    let progression: [TrainingProgressionEntry]?
    let unitSize: Int?
    let shuffleUnits: Bool?
    let referenceKey: String?
    let referenceChords: [TrainingReferenceChord]?
    let voicingForm: String?
    let scorePerVoicing: Bool?
    let playRootOnFirstCorrect: Bool?

    enum CodingKeys: String, CodingKey {
        case roots, quality, scale, interval, direction, clef, intervals, staves
        case includeAccidentals = "include_accidentals"
        case voicingNotes = "voicing_notes"
        case referenceRoot = "reference_root"
        case minLowestNote = "min_lowest_note"
        case inversion, ordered, progression
        case unitSize = "unit_size"
        case shuffleUnits = "shuffle_units"
        case referenceKey = "reference_key"
        case referenceChords = "reference_chords"
        case voicingForm = "voicing_form"
        case scorePerVoicing = "score_per_voicing"
        case playRootOnFirstCorrect = "play_root_on_first_correct"
    }

    init(
        roots: [String]? = nil,
        quality: String? = nil,
        scale: String? = nil,
        interval: String? = nil,
        direction: String? = nil,
        clef: String? = nil,
        includeAccidentals: Bool? = nil,
        intervals: [String]? = nil,
        staves: [Int]? = nil,
        voicingNotes: [String]? = nil,
        referenceRoot: String? = nil,
        minLowestNote: String? = nil,
        inversion: Int? = nil,
        ordered: Bool? = nil,
        progression: [TrainingProgressionEntry]? = nil,
        unitSize: Int? = nil,
        shuffleUnits: Bool? = nil,
        referenceKey: String? = nil,
        referenceChords: [TrainingReferenceChord]? = nil,
        voicingForm: String? = nil,
        scorePerVoicing: Bool? = nil,
        playRootOnFirstCorrect: Bool? = nil
    ) {
        self.roots = roots
        self.quality = quality
        self.scale = scale
        self.interval = interval
        self.direction = direction
        self.clef = clef
        self.includeAccidentals = includeAccidentals
        self.intervals = intervals
        self.staves = staves
        self.voicingNotes = voicingNotes
        self.referenceRoot = referenceRoot
        self.minLowestNote = minLowestNote
        self.inversion = inversion
        self.ordered = ordered
        self.progression = progression
        self.unitSize = unitSize
        self.shuffleUnits = shuffleUnits
        self.referenceKey = referenceKey
        self.referenceChords = referenceChords
        self.voicingForm = voicingForm
        self.scorePerVoicing = scorePerVoicing
        self.playRootOnFirstCorrect = playRootOnFirstCorrect
    }
}

struct TrainingProgressionUnit: Sendable, Equatable {
    let unitIndex: Int
    let keyFifths: Int
    let questions: [TrainingQuestion]
}

struct TrainingProgressionCursor: Sendable, Equatable {
    let unitIndex: Int
    let chordIndex: Int
}

struct TrainingCategoryRow: Codable, Identifiable, Sendable {
    let id: UUID
    let slug: String
    let titleJa: String
    let titleEn: String
    let descriptionJa: String
    let descriptionEn: String
    let sortOrder: Int
    let isFree: Bool
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug
        case titleJa = "title_ja"
        case titleEn = "title_en"
        case descriptionJa = "description_ja"
        case descriptionEn = "description_en"
        case sortOrder = "sort_order"
        case isFree = "is_free"
        case isActive = "is_active"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? titleEn : titleJa
    }

    func localizedDescription(_ locale: AppLocale) -> String {
        locale == .en ? descriptionEn : descriptionJa
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
    let groupIndex: Int?

    init(
        noteName: String,
        midi: Int,
        pitchClass: Int,
        staff: Int,
        isTarget: Bool,
        groupIndex: Int? = nil
    ) {
        self.noteName = noteName
        self.midi = midi
        self.pitchClass = pitchClass
        self.staff = staff
        self.isTarget = isTarget
        self.groupIndex = groupIndex
    }
}

struct TrainingQuestion: Sendable, Equatable {
    let questionKey: String
    let promptLabel: String
    let notes: [TrainingQuestionNote]
    let layout: TrainingQuestionLayout
    let ordered: Bool
    let keyFifths: Int
    let rootMidi: Int?
    let scorePerVoicing: Bool?
    let playRootOnFirstCorrect: Bool?
    let voicingGroupCount: Int?

    init(
        questionKey: String,
        promptLabel: String,
        notes: [TrainingQuestionNote],
        layout: TrainingQuestionLayout,
        ordered: Bool,
        keyFifths: Int,
        rootMidi: Int?,
        scorePerVoicing: Bool? = nil,
        playRootOnFirstCorrect: Bool? = nil,
        voicingGroupCount: Int? = nil
    ) {
        self.questionKey = questionKey
        self.promptLabel = promptLabel
        self.notes = notes
        self.layout = layout
        self.ordered = ordered
        self.keyFifths = keyFifths
        self.rootMidi = rootMidi
        self.scorePerVoicing = scorePerVoicing
        self.playRootOnFirstCorrect = playRootOnFirstCorrect
        self.voicingGroupCount = voicingGroupCount
    }
}

enum TrainingQuestionLayout: String, Sendable {
    case stacked
    case horizontal
    case grouped
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

struct TrainingGoalSetItem: Sendable, Equatable {
    let trainingId: UUID
    let targetRank: TrainingLetterRank
    let sortOrder: Int
}

enum TrainingGoalTargetInstrument: String, Sendable, Equatable {
    case piano
    case all

    func localizedLabel(_ locale: AppLocale) -> String {
        switch self {
        case .piano:
            return locale == .ja ? "ピアノ" : "Piano"
        case .all:
            return locale == .ja ? "全楽器" : "All instruments"
        }
    }
}

enum TrainingGoalTargetLevel: String, Sendable, Equatable {
    case beginner
    case intermediate
    case advanced

    func localizedLabel(_ locale: AppLocale) -> String {
        switch self {
        case .beginner:
            return locale == .ja ? "ビギナー" : "Beginner"
        case .intermediate:
            return locale == .ja ? "トレーナー" : "Trainer"
        case .advanced:
            return locale == .ja ? "マスター" : "Master"
        }
    }
}

struct TrainingUiText: Sendable, Equatable {
    let key: String
    let textJa: String
    let textEn: String

    func localizedText(_ locale: AppLocale) -> String {
        locale == .en ? textEn : textJa
    }
}

struct TrainingGoalRankInfo: Sendable, Equatable {
    let rank: TrainingLetterRank
    let questionCount: Int

    func localizedLabel(_ locale: AppLocale) -> String {
        if locale == .ja {
            return "\(rank.rawValue)(\(questionCount)問)"
        }
        return "\(rank.rawValue) (\(questionCount) questions)"
    }
}

struct TrainingGoalSet: Identifiable, Sendable, Equatable {
    let id: UUID
    let slug: String
    let titleJa: String
    let titleEn: String
    let descriptionJa: String
    let descriptionEn: String
    let targetInstrument: TrainingGoalTargetInstrument
    let targetLevel: TrainingGoalTargetLevel
    let sortOrder: Int
    let items: [TrainingGoalSetItem]

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? titleEn : titleJa
    }

    func localizedDescription(_ locale: AppLocale) -> String {
        locale == .en ? descriptionEn : descriptionJa
    }

    func resolveRankInfo(trainingById: [UUID: TrainingRow]) -> TrainingGoalRankInfo? {
        guard let firstItem = items.first,
              let training = trainingById[firstItem.trainingId]
        else { return nil }
        return TrainingGoalRankInfo(
            rank: firstItem.targetRank,
            questionCount: TrainingRank.minScore(for: firstItem.targetRank, kind: training.kind)
        )
    }
}

/// 1日・1トレーニングあたりの本番ハイスコア（`day` は `yyyy-MM-dd`）
struct TrainingDailyBest: Sendable, Equatable {
    let day: String
    let trainingId: UUID
    let bestScore: Int
    let bestRank: TrainingLetterRank
}

enum TrainingGamePhase: Equatable {
    case countdown
    case playing
    case finished
}

enum TrainingScreen: Equatable {
    case list
    case goal
    case goals
    case records(trainingId: UUID?)
    case calendar(dateKey: String)
    case ranking
    case result
}

enum TrainingConstants {
    static let gameDurationSec: TimeInterval = 60
    static let countdownSec = 3
    static let enemyCount = 10
    static let catalogTTL: TimeInterval = 60
    static let guardPoseSec: TimeInterval = 0.375
    static let hudHeight: CGFloat = 64
    static let dyingFadeSpeed: CGFloat = 2.5
    static let dyingKnockbackPxPerSec: CGFloat = 120

    static func staffNoteOpacity(practiceMode: Bool, kind: TrainingKind, scorePerVoicing: Bool = false) -> CGFloat {
        practiceMode || kind == .noteReading || kind == .interval || scorePerVoicing ? 1 : 0
    }
}
