import Foundation

enum AnalyticsClientID {
    private static let storageKey = "jazzify_analytics_client_id"
    private static let firstOpenSentKey = "jazzify_analytics_first_open_sent"

    static func current() -> String {
        if let existing = UserDefaults.standard.string(forKey: storageKey), !existing.isEmpty {
            return existing
        }
        let created = UUID().uuidString.lowercased()
        UserDefaults.standard.set(created, forKey: storageKey)
        return created
    }

    static func consumeFirstOpenIfNeeded() -> Bool {
        guard !UserDefaults.standard.bool(forKey: firstOpenSentKey) else {
            return false
        }
        UserDefaults.standard.set(true, forKey: firstOpenSentKey)
        return true
    }
}
