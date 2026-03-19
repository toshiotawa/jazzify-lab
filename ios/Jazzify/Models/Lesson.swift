import Foundation

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

    enum CodingKeys: String, CodingKey {
        case id, title, description, audience
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case orderIndex = "order_index"
        case premiumOnly = "premium_only"
        case isTutorial = "is_tutorial"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
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
