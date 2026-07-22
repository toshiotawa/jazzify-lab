import Foundation

extension Notification.Name {
    static let screenRotation180DidChange = Notification.Name("screenRotation180DidChange")
}

enum ScreenRotationPreferences {
    static let storageKey = "display.rotateScreen180"

    static func load() -> Bool {
        UserDefaults.standard.bool(forKey: storageKey)
    }

    static func save(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: storageKey)
        NotificationCenter.default.post(name: .screenRotation180DidChange, object: nil)
    }
}
