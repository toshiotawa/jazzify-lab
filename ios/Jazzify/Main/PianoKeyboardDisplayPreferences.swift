import Foundation

extension Notification.Name {
    static let pianoKeyboardDisplayModeDidChange = Notification.Name("pianoKeyboardDisplayModeDidChange")
}

enum PianoKeyboardDisplayMode: String, CaseIterable, Sendable {
    case questionRangeFit
    case full88Keys

    var storageValue: String { rawValue }
}

enum PianoKeyboardDisplayPreferences {
    static let storageKey = "piano.keyboardDisplayMode"

    static func load() -> PianoKeyboardDisplayMode {
        guard let raw = UserDefaults.standard.string(forKey: storageKey),
              let mode = PianoKeyboardDisplayMode(rawValue: raw) else {
            return .questionRangeFit
        }
        return mode
    }

    static func save(_ mode: PianoKeyboardDisplayMode) {
        UserDefaults.standard.set(mode.storageValue, forKey: storageKey)
        NotificationCenter.default.post(name: .pianoKeyboardDisplayModeDidChange, object: nil)
    }
}

struct PianoStagePitchRange: Equatable, Sendable {
    let minMidi: Int
    let maxMidi: Int

    static let full88 = PianoStagePitchRange(
        minMidi: PianoKeyboardScrollGeometry.firstMidi,
        maxMidi: PianoKeyboardScrollGeometry.lastMidi
    )
}
