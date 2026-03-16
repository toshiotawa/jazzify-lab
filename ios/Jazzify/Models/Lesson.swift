import Foundation

struct Course: Codable, Identifiable, Sendable {
    let id: UUID
    let title: String
    let titleEn: String?
    let description: String?
    let descriptionEn: String?
    let sortOrder: Int
    let isPublished: Bool

    enum CodingKeys: String, CodingKey {
        case id, title, description
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case sortOrder = "sort_order"
        case isPublished = "is_published"
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
    let sortOrder: Int
    let isPublished: Bool
    let requiredRank: String?

    enum CodingKeys: String, CodingKey {
        case id, title, description
        case courseId = "course_id"
        case titleEn = "title_en"
        case descriptionEn = "description_en"
        case sortOrder = "sort_order"
        case isPublished = "is_published"
        case requiredRank = "required_rank"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn ?? title) : title
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }
}
