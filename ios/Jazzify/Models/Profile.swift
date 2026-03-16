import Foundation

struct Profile: Codable, Identifiable, Sendable {
    let id: UUID
    var email: String
    var nickname: String
    var avatarUrl: String?
    var rank: MembershipRank
    var xp: Int
    var level: Int
    var preferredLocale: String?
    var country: String?
    var isAdmin: Bool

    enum CodingKeys: String, CodingKey {
        case id, email, nickname, rank, xp, level, country
        case avatarUrl = "avatar_url"
        case preferredLocale = "preferred_locale"
        case isAdmin = "is_admin"
    }
}

enum MembershipRank: String, Codable, Sendable {
    case free
    case standard
    case standardGlobal = "standard_global"
    case premium
    case platinum
    case black

    var isPremium: Bool {
        self != .free
    }

    func label(locale: AppLocale) -> String {
        switch locale {
        case .ja: return isPremium ? "プレミアム" : "フリー"
        case .en: return isPremium ? "Premium" : "Free"
        }
    }
}
