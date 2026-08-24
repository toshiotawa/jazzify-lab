import Foundation

enum NoteInputMethod: String {
    case midi
    case voice
}

enum NoteInputPreferences {
    private static let methodKey = "jazzify.input.method"
    private static let ignoreOctaveKey = "jazzify.input.ignoreOctave"
    private static let micSensitivityKey = "jazzify.input.micSensitivity"

    static var inputMethod: NoteInputMethod {
        get {
            guard let raw = UserDefaults.standard.string(forKey: methodKey),
                  let method = NoteInputMethod(rawValue: raw) else {
                return .midi
            }
            return method
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: methodKey)
        }
    }

    static var ignoreOctave: Bool {
        get { UserDefaults.standard.bool(forKey: ignoreOctaveKey) }
        set { UserDefaults.standard.set(newValue, forKey: ignoreOctaveKey) }
    }

    static var micSensitivity: Int {
        get {
            let stored = UserDefaults.standard.integer(forKey: micSensitivityKey)
            return stored > 0 ? min(10, max(1, stored)) : 5
        }
        set {
            UserDefaults.standard.set(min(10, max(1, newValue)), forKey: micSensitivityKey)
        }
    }
}
