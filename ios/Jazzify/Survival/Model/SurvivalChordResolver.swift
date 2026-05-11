import Foundation

/// Web 版 `src/utils/chord-templates.ts` / `src/utils/chord-utils.ts` のうち、
/// サバイバル ステージモードで出題される 21 コードクオリティ + 単音 を iOS ネイティブで解決するための
/// 純ロジックモジュール。ルート音名 + インターバル → MIDI ノート番号 + ピッチクラス配列を生成する。
///
/// - `resolveChord("CM7")` → root="C" / pitchClasses=[0,4,7,11] / midiNotes=[60,64,67,71]
/// - Mixed ステージ対応のため `SurvivalStageDefinition.allowedChords` に含まれる全コードを網羅する。
public enum SurvivalChordQuality: String, Hashable, Sendable {
    case single
    case maj, min, aug, dim
    case seven = "7"
    case maj7
    case m7
    case mM7
    case dim7
    case aug7
    case m7b5
    case six = "6"
    case m6
    case maj7_9
    case m7_9
    case seven_9_6th
    case seven_b9_b6th
    case six_9
    case m6_9
    case seven_b9_6th
    case seven_s9_b6th
    case m7b5_11
    case dimM7
    /// Progression（コード進行）ステージ専用。MusicXML から動的に作る voicing でテンプレ計算は使わない。
    case progression
}

public struct SurvivalResolvedChord: Hashable, Sendable {
    public let id: String
    public let root: String
    public let quality: SurvivalChordQuality
    /// オクターブ 4 基準の MIDI ノート番号 (表示順)
    public let midiNotes: [Int]
    /// 0-11 のピッチクラス (重複除去済み)
    public let pitchClasses: [Int]
    public let displayName: String

    public init(id: String, root: String, quality: SurvivalChordQuality, midiNotes: [Int], pitchClasses: [Int], displayName: String) {
        self.id = id
        self.root = root
        self.quality = quality
        self.midiNotes = midiNotes
        self.pitchClasses = pitchClasses
        self.displayName = displayName
    }

    /// 正解時ルート音用。Progression はコード記号ルート（`displayName`）を、それ以外は最低 MIDI のピッチクラスを使う。
    public var rootPitchClass: Int {
        if quality == .progression, let pc = SurvivalChordResolver.progressionSymbolRootPitchClass(chordSymbol: displayName) {
            return pc
        }
        guard let first = midiNotes.first else { return 0 }
        return ((first % 12) + 12) % 12
    }

    /// Progression エントリ（DB の `chord_progression` 由来）から `SurvivalResolvedChord` を構築する。
    /// - `midiNotes` は実音域（鍵盤ハイライト用）。
    /// - `pitchClasses` は重複除去した 0..<12 の集合（オクターブ無視判定用）。
    public static func fromProgressionEntry(
        _ entry: SurvivalChordProgressionEntry,
        index: Int
    ) -> SurvivalResolvedChord {
        let sortedMidi = Array(Set(entry.voicing)).sorted()
        var pcs: [Int] = []
        var seen = Set<Int>()
        for note in sortedMidi {
            let pc = ((note % 12) + 12) % 12
            if seen.insert(pc).inserted { pcs.append(pc) }
        }
        let id = "prog:\(index):\(entry.name):\(sortedMidi.map(String.init).joined(separator: ","))"
        return SurvivalResolvedChord(
            id: id,
            root: entry.name,
            quality: .progression,
            midiNotes: sortedMidi,
            pitchClasses: pcs,
            displayName: entry.name
        )
    }
}

enum SurvivalChordResolver {
    /// インターバル → 半音数
    private static let intervalSemitones: [String: Int] = [
        "1P": 0,
        "2m": 1, "2M": 2, "2A": 3,
        "3m": 3, "3M": 4,
        "4P": 5, "4A": 6, "4d": 4,
        "5d": 6, "5P": 7, "5A": 8,
        "6m": 8, "6M": 9, "6A": 10,
        "7m": 10, "7M": 11,
        "9m": 13, "9M": 14, "9A": 15,
        "11P": 17, "11A": 18,
        "13m": 20, "13M": 21,
    ]

    /// コードクオリティ → インターバル定義
    private static let chordTemplates: [SurvivalChordQuality: [String]] = [
        .single: ["1P"],
        .maj:    ["1P", "3M", "5P"],
        .min:    ["1P", "3m", "5P"],
        .aug:    ["1P", "3M", "5A"],
        .dim:    ["1P", "3m", "5d"],
        .seven:  ["1P", "3M", "5P", "7m"],
        .maj7:   ["1P", "3M", "5P", "7M"],
        .m7:     ["1P", "3m", "5P", "7m"],
        .mM7:    ["1P", "3m", "5P", "7M"],
        .dim7:   ["1P", "3m", "5d", "6M"],
        .aug7:   ["1P", "3M", "5A", "7m"],
        .m7b5:   ["1P", "3m", "5d", "7m"],
        .six:    ["1P", "3M", "5P", "6M"],
        .m6:     ["1P", "3m", "5P", "6M"],
        .maj7_9:      ["3M", "5P", "7M", "9M"],
        .m7_9:        ["3m", "5P", "7m", "9M"],
        .seven_9_6th: ["3M", "6M", "7m", "9M"],
        .seven_b9_b6th: ["3M", "6m", "7m", "9m"],
        .six_9:       ["3M", "5P", "6M", "9M"],
        .m6_9:        ["3m", "5P", "6M", "9M"],
        .seven_b9_6th: ["3M", "6M", "7m", "9m"],
        .seven_s9_b6th: ["3M", "6m", "7m", "9A"],
        .m7b5_11:     ["1P", "4P", "5d", "7m"],
        .dimM7:       ["1P", "3m", "5d", "7M"],
    ]

    /// サフィックス → クオリティ
    private static let suffixToQuality: [String: SurvivalChordQuality] = [
        "": .maj,
        "m": .min,
        "M7": .maj7,
        "maj7": .maj7,
        "m7": .m7,
        "7": .seven,
        "dim": .dim,
        "dim7": .dim7,
        "aug": .aug,
        "aug7": .aug7,
        "6": .six,
        "m6": .m6,
        "mM7": .mM7,
        "m7b5": .m7b5,
        "M7(9)": .maj7_9,
        "m7(9)": .m7_9,
        "7(9.6th)": .seven_9_6th,
        "7(b9.b6th)": .seven_b9_b6th,
        "6(9)": .six_9,
        "m6(9)": .m6_9,
        "7(b9.6th)": .seven_b9_6th,
        "7(#9.b6th)": .seven_s9_b6th,
        "m7(b5)(11)": .m7b5_11,
        "dim(M7)": .dimM7,
    ]

    /// ルート音名 → Cからの半音数 (重複あり: 異名同音許容)
    private static let rootSemitones: [String: Int] = [
        "C": 0, "B#": 0,
        "C#": 1, "Db": 1,
        "D": 2,
        "D#": 3, "Eb": 3,
        "E": 4, "Fb": 4,
        "F": 5, "E#": 5,
        "F#": 6, "Gb": 6,
        "G": 7,
        "G#": 8, "Ab": 8,
        "A": 9,
        "A#": 10, "Bb": 10,
        "B": 11, "Cb": 11,
    ]

    private static let validRootPrefixes = ["C#", "Db", "D#", "Eb", "F#", "Gb", "G#", "Ab", "A#", "Bb",
                                            "Cb", "E#", "Fb", "B#",
                                            "C", "D", "E", "F", "G", "A", "B"]

    /// Progression エントリの `name`（例: `Dm7(9)`、`C/E`）からコード記号ルートのピッチクラス (0 = C)。
    /// - スラッシュコードは分子のみを見る。パース不能時は nil。
    static func progressionSymbolRootPitchClass(chordSymbol: String) -> Int? {
        var s = chordSymbol.trimmingCharacters(in: .whitespacesAndNewlines)
        if let slash = s.firstIndex(of: "/") {
            s = String(s[..<slash]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        for prefix in validRootPrefixes where s.hasPrefix(prefix) {
            if let semi = rootSemitones[prefix] {
                return ((semi % 12) + 12) % 12
            }
        }
        return nil
    }

    /// コード ID (例: "CM7", "Db7(b9.b6th)") をルートとサフィックスに分割
    static func parseChord(id: String) -> (root: String, quality: SurvivalChordQuality)? {
        if id.hasSuffix("_note") {
            let root = String(id.dropLast("_note".count))
            if rootSemitones[root] != nil {
                return (root, .single)
            }
            return nil
        }

        for prefix in validRootPrefixes where id.hasPrefix(prefix) {
            let root = prefix
            let suffix = String(id.dropFirst(prefix.count))
            if let quality = suffixToQuality[suffix] {
                return (root, quality)
            }
        }
        return nil
    }

    /// コード ID から MIDI ノート番号・ピッチクラス・表示名を解決する。
    /// 解決不能な場合は nil。
    static func resolve(id: String, octave: Int = 4) -> SurvivalResolvedChord? {
        guard let parsed = parseChord(id: id) else { return nil }
        let rootSemitone = rootSemitones[parsed.root] ?? 0
        let rootMidi = (octave + 1) * 12 + rootSemitone // C4 = 60
        guard let intervals = chordTemplates[parsed.quality] else { return nil }

        var midiNotes: [Int] = []
        for interval in intervals {
            guard let semitones = intervalSemitones[interval] else { continue }
            midiNotes.append(rootMidi + semitones)
        }

        var pitchClasses: [Int] = []
        var seen = Set<Int>()
        for note in midiNotes {
            let pc = ((note % 12) + 12) % 12
            if seen.insert(pc).inserted {
                pitchClasses.append(pc)
            }
        }

        return SurvivalResolvedChord(
            id: id,
            root: parsed.root,
            quality: parsed.quality,
            midiNotes: midiNotes,
            pitchClasses: pitchClasses,
            displayName: id
        )
    }

    /// 与えた入力ピッチクラス配列が target コードを満たしているか判定
    static func isMatch(inputPitchClasses: [Int], target: SurvivalResolvedChord) -> Bool {
        guard !target.pitchClasses.isEmpty else { return false }
        let inputs = Set(inputPitchClasses.map { ((($0 % 12) + 12) % 12) })
        for pc in target.pitchClasses where !inputs.contains(pc) {
            return false
        }
        return true
    }

    /// target のうち、入力済みに含まれるピッチクラスのみ返す (重複除去)
    static func correctNotes(inputPitchClasses: [Int], target: SurvivalResolvedChord) -> [Int] {
        let targetSet = Set(target.pitchClasses)
        var seen = Set<Int>()
        var result: [Int] = []
        for note in inputPitchClasses {
            let pc = (((note % 12) + 12) % 12)
            if targetSet.contains(pc), seen.insert(pc).inserted {
                result.append(pc)
            }
        }
        return result
    }
}
