import Foundation

enum Config {
    static let supabaseURL: URL = {
        guard let urlString = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String,
              !urlString.isEmpty,
              let url = URL(string: urlString) else {
            fatalError("SUPABASE_URL is not set in Info.plist / build settings")
        }
        return url
    }()

    static let supabaseAnonKey: String = {
        guard let key = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String,
              !key.isEmpty else {
            fatalError("SUPABASE_ANON_KEY is not set in Info.plist / build settings")
        }
        let segments = key.split(separator: ".", omittingEmptySubsequences: false)
        guard segments.count == 3 else {
            fatalError(
                "SUPABASE_ANON_KEY must be a single JWT (3 dot-separated segments). " +
                    "Secrets.xcconfig に anon / service_role を連結して貼っていないか確認し、Dashboard の anon public key のみを設定してください。"
            )
        }
        return key
    }()

    static let webAppBaseURL: URL = {
        guard let urlString = Bundle.main.infoDictionary?["WEB_APP_BASE_URL"] as? String,
              !urlString.isEmpty,
              let url = URL(string: urlString) else {
            return URL(string: "https://jazzify.jp")!
        }
        return url
    }()

    /// Web app terms & privacy (browser / marketing).
    static var termsWebURL: URL { webAppBaseURL.appendingPathComponent("terms") }
    static var privacyWebURL: URL { webAppBaseURL.appendingPathComponent("privacy") }

    /// iOS-specific legal pages (match App Store Connect privacy policy URL).
    static var termsIosURL: URL {
        webAppBaseURL.appendingPathComponent("terms").appendingPathComponent("ios")
    }
    static var privacyIosURL: URL {
        webAppBaseURL.appendingPathComponent("privacy").appendingPathComponent("ios")
    }

    static let cdnBaseURL = URL(string: "https://jazzify-cdn.com")!

    static let reviewEmail = "toshiotawa@me.com"

    static let iapProductID = "jp.jazzify.premium.monthly"

    static var appLocale: AppLocale {
        let preferred = Locale.preferredLanguages.first ?? "ja"
        return preferred.hasPrefix("ja") ? .ja : .en
    }
}

enum AppLocale: String, Codable, CaseIterable {
    case ja
    case en

    var displayName: String {
        switch self {
        case .ja: return "日本語"
        case .en: return "English"
        }
    }
}
