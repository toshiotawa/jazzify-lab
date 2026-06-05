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
    let isDeveloperOnly: Bool?
    let isMainCourse: Bool?

    enum CodingKeys: String, CodingKey {
        case id, title, description, audience
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case orderIndex = "order_index"
        case premiumOnly = "premium_only"
        case isTutorial = "is_tutorial"
        case difficultyTier = "difficulty_tier"
        case isDeveloperOnly = "is_developer_only"
        case isMainCourse = "is_main_course"
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
    let blockDescription: String?
    let blockDescriptionEn: String?
    let manualCompletionDisabled: Bool?

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
        case blockDescription = "block_description"
        case blockDescriptionEn = "block_description_en"
        case manualCompletionDisabled = "manual_completion_disabled"
    }

    var isManualCompletionDisabled: Bool {
        manualCompletionDisabled == true
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }
}

extension Lesson: Hashable {
    static func == (lhs: Lesson, rhs: Lesson) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

struct LessonDetail: Codable, Identifiable, Sendable {
    let id: UUID
    let courseId: UUID?
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let assignmentDescription: String?
    let assignmentDescriptionEn: String?
    let lessonSongs: [LessonSong]
    let blockNumber: Int?
    let blockName: String?
    let blockNameEn: String?
    let blockDescription: String?
    let blockDescriptionEn: String?
    let manualCompletionDisabled: Bool?

    enum CodingKeys: String, CodingKey {
        case id, title, description
        case courseId = "course_id"
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case assignmentDescription = "assignment_description"
        case assignmentDescriptionEn = "assignment_description_en"
        case lessonSongs = "lesson_songs"
        case blockNumber = "block_number"
        case blockName = "block_name"
        case blockNameEn = "block_name_en"
        case blockDescription = "block_description"
        case blockDescriptionEn = "block_description_en"
        case manualCompletionDisabled = "manual_completion_disabled"
    }

    var isManualCompletionDisabled: Bool {
        manualCompletionDisabled == true
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }

    func localizedAssignmentDescription(_ locale: AppLocale) -> String? {
        let primary = locale == .en ? assignmentDescriptionEn : assignmentDescription
        let fallback = locale == .en ? assignmentDescription : assignmentDescriptionEn
        if let primary, !primary.isEmpty { return primary }
        if let fallback, !fallback.isEmpty { return fallback }
        return nil
    }
}

struct BalloonRushStageSummary: Codable, Identifiable, Sendable {
    let id: UUID
    let slug: String?
    let title: String
    let titleEn: String?
    /// Web `BalloonRushStageRow.stage_type`（nil は progression とみなす）
    let stageType: String?
    let timeLimitSec: Int?
    let popQuota: Int?

    enum CodingKeys: String, CodingKey {
        case id, slug, title
        case titleEn = "title_en"
        case stageType = "stage_type"
        case timeLimitSec = "time_limit_sec"
        case popQuota = "pop_quota"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func lessonRequirementModeLabel(locale: AppLocale) -> String {
        if stageType == "random" {
            return locale == .ja ? "ランダムコード" : "Random chords"
        }
        return locale == .ja ? "プログレッションコード" : "Progression chords"
    }

    /// ボディのみ（プレフィックスなし）。Web `buildBalloonRushLessonRequirementDisplay` と同文言。
    func lessonClearConditionBody(locale: AppLocale, timeLimit: Int, popQuota: Int) -> String {
        locale == .ja
            ? "\(timeLimit)秒以内に風船を\(popQuota)個割る"
            : "pop \(popQuota) balloons within \(timeLimit)s"
    }
}

struct LessonSong: Codable, Identifiable, Sendable {
    let id: UUID
    let lessonId: UUID
    let songId: UUID?
    let fantasyStageId: UUID?
    let earTrainingStageId: UUID?
    let isBalloonRush: Bool?
    let balloonRushStageId: UUID?
    let isFantasy: Bool
    let isSurvival: Bool?
    let isSurvivalTutorial: Bool?
    let survivalTutorialScriptId: String?
    let isEarTraining: Bool?
    let isEarTrainingTutorial: Bool?
    let earTrainingTutorialScriptId: String?
    let survivalStageNumber: Int?
    /// Web `lesson_songs.survival_map_category`。nil のときアプリ側では basic。
    let survivalMapCategory: String?
    let survivalCompositeConfig: SurvivalLessonCompositeConfig?
    /// Web `lesson_songs.survival_random_chords`。Random 課題のカスタム出題プール。
    let survivalRandomChords: [SurvivalLessonRandomChordEntry]?
    let survivalLessonOverrides: SurvivalLessonOverrides?
    let overrideProductionStaffHintMode: String?
    let overrideProductionKeyboardHintMode: String?
    let clearConditions: LessonClearConditions?
    /// 表示用。false のとき任意課題（クエスト完了ボタン条件には含めない）。
    let isClearRequired: Bool?
    let orderIndex: Int?
    let title: String?
    let titleEn: String?
    let songs: LessonSongReferenceSong?
    let fantasyStage: FantasyStage?
    let earTrainingStage: EarTrainingStage?
    let balloonRushStage: BalloonRushStageSummary?

    enum CodingKeys: String, CodingKey {
        case id, title, songs
        case titleEn = "title_en"
        case lessonId = "lesson_id"
        case songId = "song_id"
        case fantasyStageId = "fantasy_stage_id"
        case earTrainingStageId = "ear_training_stage_id"
        case isBalloonRush = "is_balloon_rush"
        case balloonRushStageId = "balloon_rush_stage_id"
        case balloonRushStage = "balloon_rush_stage"
        case isFantasy = "is_fantasy"
        case isSurvival = "is_survival"
        case isSurvivalTutorial = "is_survival_tutorial"
        case survivalTutorialScriptId = "survival_tutorial_script_id"
        case isEarTraining = "is_ear_training"
        case isEarTrainingTutorial = "is_ear_training_tutorial"
        case earTrainingTutorialScriptId = "ear_training_tutorial_script_id"
        case survivalStageNumber = "survival_stage_number"
        case survivalMapCategory = "survival_map_category"
        case survivalCompositeConfig = "survival_composite_config"
        case survivalRandomChords = "survival_random_chords"
        case survivalLessonOverrides = "survival_lesson_overrides"
        case overrideProductionStaffHintMode = "override_production_staff_hint_mode"
        case overrideProductionKeyboardHintMode = "override_production_keyboard_hint_mode"
        case clearConditions = "clear_conditions"
        case isClearRequired = "is_clear_required"
        case orderIndex = "order_index"
        case fantasyStage
        case earTrainingStage
    }
}

struct LessonSongReferenceSong: Codable, Sendable {
    let id: UUID
    let title: String
    let artist: String?
}

struct EarTrainingStage: Codable, Identifiable, Sendable {
    let id: UUID
    let slug: String?
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let bpm: Int?
    let timeLimitSec: Int?
    let mode: EarTrainingMode?
    let quizDurationSeconds: Int?
    let quizRequiredCorrectCount: Int?
    let showKeyboardHintsInBattle: Bool?

    enum CodingKeys: String, CodingKey {
        case id, slug, title, description, bpm, mode
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case timeLimitSec = "time_limit_sec"
        case quizDurationSeconds = "quiz_duration_seconds"
        case quizRequiredCorrectCount = "quiz_required_correct_count"
        case showKeyboardHintsInBattle = "show_keyboard_hints_in_battle"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }

    func battleClearConditionText(locale: AppLocale) -> String {
        let isEnglish = locale == .en
        switch mode ?? .phrase {
        case .chordQuiz:
            let r = max(1, quizRequiredCorrectCount ?? 80)
            return isEnglish
                ? "Answer at least \(r) questions correctly."
                : "\(r)問以上正解"
        case .chordOSMD:
            return isEnglish
                ? "Reduce the enemy HP to 0."
                : "敵HPを0にする。"
        case .chordVoicing, .phrase, .adlib, .phrasePairAdlib:
            return isEnglish
                ? "Reduce the enemy HP to 0 within the time limit."
                : "制限時間以内に敵HPを0にする"
        }
    }
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
