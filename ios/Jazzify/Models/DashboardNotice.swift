import Foundation

struct DashboardNoticeRow: Codable, Identifiable, Sendable {
    let id: UUID
    let platform: String
    let locale: String
    let title: String
    let body: String
    let actionLabel: String
    let actionKind: String
    let actionTarget: String
    let isPublished: Bool
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, platform, locale, title, body
        case actionLabel = "action_label"
        case actionKind = "action_kind"
        case actionTarget = "action_target"
        case isPublished = "is_published"
        case sortOrder = "sort_order"
    }
}

enum DashboardNoticeTabTarget: String, CaseIterable {
    case account
    case quest
    case play
    case training
    case top
}

enum DashboardNoticeActionKind: String {
    case external
    case tab
}

enum DashboardNoticeNavigation {
    static func tab(from target: String) -> Tab? {
        guard let tabTarget = DashboardNoticeTabTarget(rawValue: target) else { return nil }
        switch tabTarget {
        case .account: return .account
        case .quest: return .quest
        case .play: return .play
        case .training: return .training
        case .top: return .top
        }
    }

    static func externalURL(from target: String) -> URL? {
        guard target.hasPrefix("https://") else { return nil }
        return URL(string: target)
    }
}
