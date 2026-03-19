import Foundation

struct AnnouncementRow: Codable, Identifiable, Sendable {
    let id: UUID
    let title: String
    let content: String
    let linkUrl: String?
    let linkText: String?
    let titleEn: String?
    let contentEn: String?
    let linkTextEn: String?
    let priority: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, content, priority
        case linkUrl = "link_url"
        case linkText = "link_text"
        case titleEn = "title_en"
        case contentEn = "content_en"
        case linkTextEn = "link_text_en"
        case createdAt = "created_at"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        if locale == .en, let en = titleEn, !en.isEmpty { return en }
        return title
    }

    func localizedContent(_ locale: AppLocale) -> String {
        if locale == .en, let en = contentEn, !en.isEmpty { return en }
        return content
    }
}
