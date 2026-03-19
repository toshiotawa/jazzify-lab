import Foundation

struct SurvivalCharacterRow: Codable, Identifiable, Sendable {
    let id: String
    let name: String
    let nameEn: String?
    let avatarUrl: String
    let sortOrder: Int
    let description: String?
    let descriptionEn: String?

    enum CodingKeys: String, CodingKey {
        case id, name, description
        case nameEn = "name_en"
        case avatarUrl = "avatar_url"
        case sortOrder = "sort_order"
        case descriptionEn = "description_en"
    }

    func localizedName(_ locale: AppLocale) -> String {
        if locale == .en, let en = nameEn, !en.isEmpty { return en }
        return name
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        if locale == .en, let en = descriptionEn, !en.isEmpty { return en }
        return description
    }
}

struct SurvivalStageClearRow: Codable, Sendable {
    let stageNumber: Int
    let characterId: String?
    let clearedAt: Date

    enum CodingKeys: String, CodingKey {
        case stageNumber = "stage_number"
        case characterId = "character_id"
        case clearedAt = "cleared_at"
    }
}

struct SurvivalDifficultyRow: Codable, Identifiable, Sendable {
    let id: UUID
    let difficulty: String
    let displayName: String
    let description: String?
    let descriptionEn: String?

    enum CodingKeys: String, CodingKey {
        case id, difficulty, description
        case displayName = "display_name"
        case descriptionEn = "description_en"
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        if locale == .en, let en = descriptionEn, !en.isEmpty { return en }
        return description
    }
}
