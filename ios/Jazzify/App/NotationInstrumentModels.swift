import Foundation

enum NotationInstrumentClef: String, Sendable {
    case treble
    case bass
    case grand

    /// Single-staff number for this clef. Grand uses both staves.
    var singleStaffNumber: Int? {
        switch self {
        case .treble: return 1
        case .bass: return 2
        case .grand: return nil
        }
    }

    static func resolveFixedActiveStaves(
        clefOverride: NotationInstrumentClef?,
        fallback: [Int]?
    ) -> [Int]? {
        if let staff = clefOverride?.singleStaffNumber {
            return [staff]
        }
        return fallback
    }
}

struct NotationInstrumentPreset: Sendable, Equatable {
    let id: String
    let clef: NotationInstrumentClef
    /// 記譜 C の実音との半音差（Bb = -2）
    let transposition: Int
    /// 楽器固有の記譜オクターブ（-1 = 1 オクターブ下に書く）
    let octaveOffset: Int
    let labelJa: String
    let labelEn: String
}

enum NotationInstrumentCatalog {
    static let octaveShiftMin = -3
    static let octaveShiftMax = 3
    static let defaultInstrumentId = "piano"

    static let presets: [NotationInstrumentPreset] = [
        .init(id: "piano", clef: .grand, transposition: 0, octaveOffset: 0, labelJa: "ピアノ / キーボード", labelEn: "Piano / Keyboard"),
        .init(id: "concert_melody", clef: .treble, transposition: 0, octaveOffset: 0, labelJa: "単音楽器（コンサートキー）", labelEn: "Melody (Concert key)"),
        .init(id: "flute", clef: .treble, transposition: 0, octaveOffset: 0, labelJa: "フルート", labelEn: "Flute"),
        .init(id: "oboe", clef: .treble, transposition: 0, octaveOffset: 0, labelJa: "オーボエ", labelEn: "Oboe"),
        .init(id: "violin", clef: .treble, transposition: 0, octaveOffset: 0, labelJa: "ヴァイオリン", labelEn: "Violin"),
        .init(id: "guitar", clef: .treble, transposition: 0, octaveOffset: -1, labelJa: "ギター", labelEn: "Guitar"),
        .init(id: "ukulele", clef: .treble, transposition: 0, octaveOffset: 0, labelJa: "ウクレレ", labelEn: "Ukulele"),
        .init(id: "trumpet_bb", clef: .treble, transposition: -2, octaveOffset: 0, labelJa: "トランペット in B♭", labelEn: "Trumpet in B♭"),
        .init(id: "clarinet_bb", clef: .treble, transposition: -2, octaveOffset: 0, labelJa: "クラリネット in B♭", labelEn: "Clarinet in B♭"),
        .init(id: "soprano_sax", clef: .treble, transposition: -2, octaveOffset: 0, labelJa: "ソプラノサックス in B♭", labelEn: "Soprano Sax in B♭"),
        .init(id: "alto_sax", clef: .treble, transposition: -9, octaveOffset: 0, labelJa: "アルトサックス in E♭", labelEn: "Alto Sax in E♭"),
        .init(id: "tenor_sax", clef: .treble, transposition: -2, octaveOffset: -1, labelJa: "テナーサックス in B♭", labelEn: "Tenor Sax in B♭"),
        .init(id: "baritone_sax", clef: .treble, transposition: -9, octaveOffset: -1, labelJa: "バリトンサックス in E♭", labelEn: "Baritone Sax in E♭"),
        .init(id: "french_horn_f", clef: .treble, transposition: -7, octaveOffset: 0, labelJa: "ホルン in F", labelEn: "French Horn in F"),
        .init(id: "bass_clarinet_bb", clef: .treble, transposition: -2, octaveOffset: -1, labelJa: "バスクラリネット in B♭", labelEn: "Bass Clarinet in B♭"),
        .init(id: "trombone", clef: .bass, transposition: 0, octaveOffset: 0, labelJa: "トロンボーン", labelEn: "Trombone"),
        .init(id: "euphonium", clef: .bass, transposition: 0, octaveOffset: 0, labelJa: "ユーフォニアム", labelEn: "Euphonium"),
        .init(id: "tuba", clef: .bass, transposition: 0, octaveOffset: 0, labelJa: "チューバ", labelEn: "Tuba"),
        .init(id: "cello", clef: .bass, transposition: 0, octaveOffset: 0, labelJa: "チェロ", labelEn: "Cello"),
        .init(id: "bassoon", clef: .bass, transposition: 0, octaveOffset: 0, labelJa: "ファゴット", labelEn: "Bassoon"),
        .init(id: "electric_bass", clef: .bass, transposition: 0, octaveOffset: -1, labelJa: "エレキベース", labelEn: "Electric Bass"),
        .init(id: "double_bass", clef: .bass, transposition: 0, octaveOffset: -1, labelJa: "コントラバス", labelEn: "Double Bass"),
    ]

    private static let presetById: [String: NotationInstrumentPreset] = Dictionary(
        uniqueKeysWithValues: presets.map { ($0.id, $0) }
    )

    static func normalizeInstrumentId(_ value: String?) -> String {
        guard let value, presetById[value] != nil else {
            return defaultInstrumentId
        }
        return value
    }

    static func preset(for id: String) -> NotationInstrumentPreset {
        presetById[id] ?? presetById[defaultInstrumentId]!
    }

    static func clampOctaveShift(_ value: Int) -> Int {
        max(octaveShiftMin, min(octaveShiftMax, Int(value)))
    }

    /// コンサート音高 → 記譜表示の半音オフセット（上方向）
    static func writtenSemitoneOffset(preset: NotationInstrumentPreset, userOctaveShift: Int) -> Int {
        -preset.transposition - preset.octaveOffset * 12 + clampOctaveShift(userOctaveShift) * 12
    }

    static func formatWrittenOffsetLabel(_ offset: Int, isEnglishCopy: Bool) -> String {
        if offset == 0 {
            return isEnglishCopy ? "Concert pitch (written)" : "移調なし（記譜）"
        }
        let sign = offset > 0 ? "+" : ""
        return isEnglishCopy
            ? "\(sign)\(offset) semitones (written)"
            : "記譜 \(sign)\(offset) 半音"
    }

    static func formatClefLabel(_ clef: NotationInstrumentClef, isEnglishCopy: Bool) -> String {
        switch clef {
        case .grand:
            return isEnglishCopy ? "Grand staff" : "大譜表"
        case .treble:
            return isEnglishCopy ? "Treble clef" : "ト音記号"
        case .bass:
            return isEnglishCopy ? "Bass clef" : "ヘ音記号"
        }
    }
}
