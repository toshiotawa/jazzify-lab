import Foundation

enum CourseDifficultyTier: String, CaseIterable, Codable, Sendable {
    case tutorial
    case beginner
    case intermediate
    case advanced

    static let displayOrder: [CourseDifficultyTier] = [.tutorial, .beginner, .intermediate, .advanced]

    init(dbValue: String?) {
        if let raw = dbValue, let t = CourseDifficultyTier(rawValue: raw) {
            self = t
        } else {
            self = .beginner
        }
    }

    func sectionTitle(locale: AppLocale) -> String {
        switch self {
        case .tutorial:
            return locale == .ja ? "チュートリアル" : "Tutorial"
        case .beginner:
            return locale == .ja ? "初級" : "Beginner"
        case .intermediate:
            return locale == .ja ? "中級" : "Intermediate"
        case .advanced:
            return locale == .ja ? "上級" : "Advanced"
        }
    }

    var sortIndex: Int {
        switch self {
        case .tutorial: return 0
        case .beginner: return 1
        case .intermediate: return 2
        case .advanced: return 3
        }
    }
}

struct Course: Codable, Identifiable, Sendable {
    let id: UUID
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let orderIndex: Int
    let premiumOnly: Bool?
    let isTutorial: Bool?
    let audience: String?
    let difficultyTier: String?

    enum CodingKeys: String, CodingKey {
        case id, title, description, audience
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case orderIndex = "order_index"
        case premiumOnly = "premium_only"
        case isTutorial = "is_tutorial"
        case difficultyTier = "difficulty_tier"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }

    var resolvedDifficultyTier: CourseDifficultyTier {
        CourseDifficultyTier(dbValue: difficultyTier)
    }
}

struct Lesson: Codable, Identifiable, Sendable {
    let id: UUID
    let courseId: UUID?
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let orderIndex: Int
    let premiumOnly: Bool?
    let blockNumber: Int?
    let blockName: String?
    let blockNameEn: String?

    enum CodingKeys: String, CodingKey {
        case id, title, description
        case courseId = "course_id"
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case orderIndex = "order_index"
        case premiumOnly = "premium_only"
        case blockNumber = "block_number"
        case blockName = "block_name"
        case blockNameEn = "block_name_en"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }
}

struct LessonDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let courseId: UUID?
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let assignmentDescription: String?
    let navLinks: [String]?
    let lessonSongs: [LessonSong]

    enum CodingKeys: String, CodingKey {
        case id, title, description
        case courseId = "course_id"
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case assignmentDescription = "assignment_description"
        case navLinks = "nav_links"
        case lessonSongs = "lesson_songs"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }
}

struct LessonSong: Codable, Identifiable, Sendable {
    let id: UUID
    let lessonId: UUID
    let songId: UUID?
    let fantasyStageId: UUID?
    let isFantasy: Bool
    let isSurvival: Bool?
    let survivalStageNumber: Int?
    let clearConditions: LessonClearConditions?
    let orderIndex: Int?
    let title: String?
    let songs: LessonSongReferenceSong?
    let fantasyStage: FantasyStage?

    enum CodingKeys: String, CodingKey {
        case id, title, songs
        case lessonId = "lesson_id"
        case songId = "song_id"
        case fantasyStageId = "fantasy_stage_id"
        case isFantasy = "is_fantasy"
        case isSurvival = "is_survival"
        case survivalStageNumber = "survival_stage_number"
        case clearConditions = "clear_conditions"
        case orderIndex = "order_index"
        case fantasyStage
    }
}

struct LessonSongReferenceSong: Codable, Sendable {
    let id: UUID
    let title: String
    let artist: String?
}

enum LessonMediaLocaleScope: String, Codable, Sendable {
    case jaOnly = "ja_only"
    case enOnly = "en_only"
    case both = "both"

    func isVisible(for appLocale: AppLocale) -> Bool {
        switch self {
        case .both:
            return true
        case .jaOnly:
            return appLocale == .ja
        case .enOnly:
            return appLocale == .en
        }
    }
}

struct LessonClearConditions: Codable, Sendable {
    let key: Int?
    let speed: Double?
    let rank: String?
    let count: Int?
    let notationSetting: String?
    let requiresDays: Bool?
    let dailyCount: Int?

    enum CodingKeys: String, CodingKey {
        case key, speed, rank, count
        case notationSetting = "notation_setting"
        case requiresDays = "requires_days"
        case dailyCount = "daily_count"
    }
}

struct LessonVideoResource: Codable, Identifiable, Sendable {
    let id: UUID
    let lessonId: UUID
    let vimeoUrl: String
    let orderIndex: Int
    let videoUrl: String?
    let r2Key: String?
    let contentType: String?
    let localeScope: LessonMediaLocaleScope?

    enum CodingKeys: String, CodingKey {
        case id
        case lessonId = "lesson_id"
        case vimeoUrl = "vimeo_url"
        case orderIndex = "order_index"
        case videoUrl = "video_url"
        case r2Key = "r2_key"
        case contentType = "content_type"
        case localeScope = "locale_scope"
    }

    func isVisible(for appLocale: AppLocale) -> Bool {
        (localeScope ?? .both).isVisible(for: appLocale)
    }
}

struct LessonAttachmentResource: Codable, Identifiable, Sendable {
    let id: UUID
    let lessonId: UUID
    let fileName: String
    let url: String
    let r2Key: String
    let contentType: String?
    let size: Int?
    let orderIndex: Int
    let platinumOnly: Bool
    let localeScope: LessonMediaLocaleScope?

    enum CodingKeys: String, CodingKey {
        case id, url, size
        case lessonId = "lesson_id"
        case fileName = "file_name"
        case r2Key = "r2_key"
        case contentType = "content_type"
        case orderIndex = "order_index"
        case platinumOnly = "platinum_only"
        case localeScope = "locale_scope"
    }

    func isVisible(for appLocale: AppLocale) -> Bool {
        (localeScope ?? .both).isVisible(for: appLocale)
    }
}

struct LessonRequirementProgressRow: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let lessonId: UUID
    let songId: UUID?
    let lessonSongId: UUID?
    let clearCount: Int
    let clearDates: [String]
    let bestRank: String?
    let isCompleted: Bool
    let dailyProgress: [String: LessonRequirementDailyProgress]?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case lessonId = "lesson_id"
        case songId = "song_id"
        case lessonSongId = "lesson_song_id"
        case clearCount = "clear_count"
        case clearDates = "clear_dates"
        case bestRank = "best_rank"
        case isCompleted = "is_completed"
        case dailyProgress = "daily_progress"
    }
}

struct LessonRequirementDailyProgress: Codable, Sendable {
    let count: Int
    let completed: Bool
}
