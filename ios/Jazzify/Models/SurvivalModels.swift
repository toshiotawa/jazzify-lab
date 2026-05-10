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
    let mapCategory: String?
    let stageNumber: Int
    let characterId: String?
    let clearedAt: Date
    /// DB `survival_stage_clears.clear_count`。後方互換で省略時は 1。
    let clearCount: Int

    enum CodingKeys: String, CodingKey {
        case mapCategory = "map_category"
        case stageNumber = "stage_number"
        case characterId = "character_id"
        case clearedAt = "cleared_at"
        case clearCount = "clear_count"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        mapCategory = try c.decodeIfPresent(String.self, forKey: .mapCategory)
        stageNumber = try c.decode(Int.self, forKey: .stageNumber)
        characterId = try c.decodeIfPresent(String.self, forKey: .characterId)
        clearedAt = try c.decode(Date.self, forKey: .clearedAt)
        let raw = try c.decodeIfPresent(Int.self, forKey: .clearCount)
        if let raw, raw >= 1 {
            clearCount = raw
        } else {
            clearCount = 1
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(mapCategory, forKey: .mapCategory)
        try c.encode(stageNumber, forKey: .stageNumber)
        try c.encodeIfPresent(characterId, forKey: .characterId)
        try c.encode(clearedAt, forKey: .clearedAt)
        try c.encode(clearCount, forKey: .clearCount)
    }
}

struct SurvivalStageProgressRow: Codable, Sendable {
    let currentStageNumber: Int
    let totalClearedStages: Int

    enum CodingKeys: String, CodingKey {
        case currentStageNumber = "current_stage_number"
        case totalClearedStages = "total_cleared_stages"
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
