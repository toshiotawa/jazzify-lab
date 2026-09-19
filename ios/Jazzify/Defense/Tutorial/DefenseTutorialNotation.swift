import Foundation

struct DefenseTutorialNotationSettings: Equatable, Sendable {
    var notationInstrumentId: String
    var notationOctaveShift: Int
    var clefOverride: NotationInstrumentClef?
    /// Written transposition semitones; nil = use preset.transposition
    var transpositionOverride: Int?
}

enum DefenseTutorialNotation {
    static func resolveClef(_ settings: DefenseTutorialNotationSettings) -> NotationInstrumentClef {
        if let clefOverride = settings.clefOverride {
            return clefOverride
        }
        return NotationInstrumentCatalog.preset(for: settings.notationInstrumentId).clef
    }

    static func resolveVoicingStaff(_ clef: NotationInstrumentClef) -> Int {
        clef.singleStaffNumber ?? 1
    }

    static func resolveDisplayStaves(_ clef: NotationInstrumentClef) -> [Int] {
        if let staff = clef.singleStaffNumber {
            return [staff]
        }
        return [1, 2]
    }

    static func resolveDefaultOctaveShift(_ clef: NotationInstrumentClef) -> Int {
        clef == .bass ? -1 : 0
    }

    static func formatOctaveShiftLabel(_ shift: Int, isEnglishCopy: Bool) -> String {
        let sign = shift > 0 ? "+" : ""
        return isEnglishCopy
            ? "Written octave \(sign)\(shift)"
            : "記譜オクターブ \(sign)\(shift)"
    }

    static func resolveTransposition(_ settings: DefenseTutorialNotationSettings) -> Int {
        if let transpositionOverride = settings.transpositionOverride {
            return transpositionOverride
        }
        return NotationInstrumentCatalog.preset(for: settings.notationInstrumentId).transposition
    }

    static func resolveWrittenOffset(_ settings: DefenseTutorialNotationSettings) -> Int {
        let preset = NotationInstrumentCatalog.preset(for: settings.notationInstrumentId)
        let transposition = resolveTransposition(settings)
        let adjustedPreset: NotationInstrumentPreset
        if transposition == preset.transposition {
            adjustedPreset = preset
        } else {
            adjustedPreset = NotationInstrumentPreset(
                id: preset.id,
                clef: preset.clef,
                transposition: transposition,
                octaveOffset: preset.octaveOffset,
                labelJa: preset.labelJa,
                labelEn: preset.labelEn
            )
        }
        return NotationInstrumentCatalog.writtenSemitoneOffset(
            preset: adjustedPreset,
            userOctaveShift: settings.notationOctaveShift
        )
    }

    private static let writtenKeyByTransposition: [Int: String] = [
        0: "C",
        -2: "B♭",
        -7: "F",
        -9: "E♭",
    ]

    private static func formatWrittenKeyLabel(_ transpositionSemitones: Int) -> String {
        if let key = writtenKeyByTransposition[transpositionSemitones] {
            return "in \(key)"
        }
        let sign = transpositionSemitones > 0 ? "+" : ""
        return "in C\(sign)\(transpositionSemitones)"
    }

    static func formatTutorialNotationLabel(
        _ settings: DefenseTutorialNotationSettings,
        isEnglishCopy: Bool
    ) -> String {
        let clef = resolveClef(settings)
        let clefLabel = NotationInstrumentCatalog.formatClefLabel(
            clef == .grand ? .treble : clef,
            isEnglishCopy: isEnglishCopy
        )
        let transposition = resolveTransposition(settings)
        let keyLabel = formatWrittenKeyLabel(transposition)
        let sep = isEnglishCopy ? " · " : "・"
        return "\(keyLabel)\(sep)\(clefLabel)"
    }

    static func formatTutorialPlaySubtitle(
        concertMidis: [Int],
        isEnglishCopy: Bool
    ) -> String {
        let label = formatTutorialSoundNoteNames(concertMidis: concertMidis)
        return isEnglishCopy ? "Sound: \(label)" : "音：\(label)"
    }

    static func formatTutorialSoundNoteNames(concertMidis: [Int]) -> String {
        concertMidis.map { formatMidiNoteName($0) }.joined(separator: " · ")
    }

    private static func formatMidiNoteName(_ midi: Int) -> String {
        let pitchClass = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        let names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
        return "\(names[pitchClass])\(octave)"
    }

    static func defaultSettings(
        notationInstrumentId: String,
        notationOctaveShift: Int = 0
    ) -> DefenseTutorialNotationSettings {
        DefenseTutorialNotationSettings(
            notationInstrumentId: notationInstrumentId,
            notationOctaveShift: notationOctaveShift,
            clefOverride: nil,
            transpositionOverride: nil
        )
    }
}
