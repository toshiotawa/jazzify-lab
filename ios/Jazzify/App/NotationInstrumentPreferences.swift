import Foundation

extension Notification.Name {
    static let notationInstrumentDidChange = Notification.Name("notationInstrumentDidChange")
}

enum NotationInstrumentPreferences {
    private static let instrumentKey = "display.notationInstrumentId"
    private static let octaveShiftKey = "display.notationOctaveShift"

    static func loadInstrumentId() -> String {
        let stored = UserDefaults.standard.string(forKey: instrumentKey)
        return NotationInstrumentCatalog.normalizeInstrumentId(stored)
    }

    static func loadPreset() -> NotationInstrumentPreset {
        NotationInstrumentCatalog.preset(for: loadInstrumentId())
    }

    static func loadOctaveShift() -> Int {
        if UserDefaults.standard.object(forKey: octaveShiftKey) == nil {
            return 0
        }
        return NotationInstrumentCatalog.clampOctaveShift(
            UserDefaults.standard.integer(forKey: octaveShiftKey)
        )
    }

    static func loadWrittenOffset(ignoreNotationInstrument: Bool = false) -> Int {
        if ignoreNotationInstrument {
            return 0
        }
        let preset = loadPreset()
        return NotationInstrumentCatalog.writtenSemitoneOffset(
            preset: preset,
            userOctaveShift: loadOctaveShift()
        )
    }

    /// 出題・判定用（ユーザオクターブ除外）
    static func loadConcertQuestionOffset(ignoreNotationInstrument: Bool = false) -> Int {
        if ignoreNotationInstrument {
            return 0
        }
        let preset = loadPreset()
        return NotationInstrumentCatalog.writtenSemitoneOffset(preset: preset, userOctaveShift: 0)
    }

    static func saveInstrumentId(_ id: String) {
        let normalized = NotationInstrumentCatalog.normalizeInstrumentId(id)
        UserDefaults.standard.set(normalized, forKey: instrumentKey)
        NotificationCenter.default.post(name: .notationInstrumentDidChange, object: nil)
    }

    static func saveOctaveShift(_ shift: Int) {
        let clamped = NotationInstrumentCatalog.clampOctaveShift(shift)
        UserDefaults.standard.set(clamped, forKey: octaveShiftKey)
        NotificationCenter.default.post(name: .notationInstrumentDidChange, object: nil)
    }
}
