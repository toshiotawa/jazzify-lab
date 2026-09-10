import Foundation

extension Notification.Name {
    static let enharmonicDisplayDidChange = Notification.Name("enharmonicDisplayDidChange")
}

enum EnharmonicDisplayPreferences {
    static let storageKey = "display.simpleEnharmonicDisplay"

    static func load() -> Bool {
        if UserDefaults.standard.object(forKey: storageKey) == nil {
            return true
        }
        return UserDefaults.standard.bool(forKey: storageKey)
    }

    static func save(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: storageKey)
        NotificationCenter.default.post(name: .enharmonicDisplayDidChange, object: nil)
    }
}
