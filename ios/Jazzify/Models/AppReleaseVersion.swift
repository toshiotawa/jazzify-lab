import Foundation

struct AppReleaseVersionRow: Codable, Sendable {
    let platform: String
    let latestVersion: String
    let appStoreUrl: String
    let title: String
    let message: String
    let titleEn: String?
    let messageEn: String?

    enum CodingKeys: String, CodingKey {
        case platform, title, message
        case latestVersion = "latest_version"
        case appStoreUrl = "app_store_url"
        case titleEn = "title_en"
        case messageEn = "message_en"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        if locale == .en, let titleEn, !titleEn.isEmpty { return titleEn }
        return title
    }

    func localizedMessage(_ locale: AppLocale) -> String {
        if locale == .en, let messageEn, !messageEn.isEmpty { return messageEn }
        return message
    }
}

struct AppUpdateNotice: Identifiable, Equatable, Sendable {
    let latestVersion: String
    let currentVersion: String
    let title: String
    let message: String

    var id: String { latestVersion }
}
