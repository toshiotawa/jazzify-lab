import Foundation

enum NoteInputMethod: String {
    case midi
    case voice
    case touch
}

enum NoteInputPreferences {
    private static let methodKey = "jazzify.input.method"
    private static let micSensitivityKey = "jazzify.input.micSensitivity"
    private static let voiceFastResponseKey = "jazzify.input.voiceFastResponse"

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

    static var micSensitivity: Int {
        get {
            let stored = UserDefaults.standard.integer(forKey: micSensitivityKey)
            return stored > 0 ? min(10, max(1, stored)) : 5
        }
        set {
            UserDefaults.standard.set(min(10, max(1, newValue)), forKey: micSensitivityKey)
        }
    }

    /// マイク高速反応: ON=pitchStableFrames 2, OFF=4
    static var voiceFastResponse: Bool {
        get { UserDefaults.standard.bool(forKey: voiceFastResponseKey) }
        set { UserDefaults.standard.set(newValue, forKey: voiceFastResponseKey) }
    }

    static var pitchStableFrames: Int {
        voiceFastResponse ? 2 : 4
    }

    static var midiVolume: Float {
        get { SurvivalGameAudio.shared.pianoVolume }
        set { SurvivalGameAudio.shared.setPianoVolume(max(0, min(1, newValue))) }
    }
}
