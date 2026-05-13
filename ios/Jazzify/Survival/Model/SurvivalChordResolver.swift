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
    /// HINT スタッフ用（DB の `voicing_names` と MIDI を対応させて昇順、無ければ nil）。
    public let progressionStaffVoicingNames: [String]?
    /// 調号 -7…7。DB 未取得時でも綴りがあれば 0 とみなしてスタッフを表示可能。
    public let progressionStaffKeyFifths: Int?

    public init(
        id: String,
        root: String,
        quality: SurvivalChordQuality,
        midiNotes: [Int],
        pitchClasses: [Int],
        displayName: String,
        progressionStaffVoicingNames: [String]? = nil,
        progressionStaffKeyFifths: Int? = nil,
    ) {
        self.id = id
        self.root = root
        self.quality = quality
        self.midiNotes = midiNotes
        self.pitchClasses = pitchClasses
        self.displayName = displayName
        self.progressionStaffVoicingNames = progressionStaffVoicingNames
        self.progressionStaffKeyFifths = progressionStaffKeyFifths
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
        let staffNames = Self.ascendingProgressionStaffNames(entry: entry)
        // 採用範囲は -6..+5（F# キーは Gb で表現する方針）。
        let storedKey = entry.keyFifths.map { min(5, max(-6, $0)) }
        let keyForStaff: Int? = storedKey ?? (staffNames != nil ? 0 : nil)
        let id = "prog:\(index):\(entry.name):\(sortedMidi.map(String.init).joined(separator: ","))"
        return SurvivalResolvedChord(
            id: id,
            root: entry.name,
            quality: .progression,
            midiNotes: sortedMidi,
            pitchClasses: pcs,
            displayName: entry.name,
            progressionStaffVoicingNames: staffNames,
            progressionStaffKeyFifths: keyForStaff
        )
    }

    /// `voicing` の各 MIDI と並列の綴りを昇順 MIDI に並べる。重複ピッチクラスや綴り不足時は nil。
    /// オクターブは鍵盤 HINT の単一オクターブ再構築（baseMidi=48 / C3 起点・厳密昇順）に揃え、
    /// `SurvivalGameLoop.hintHighlightMidis` と完全一致させる。例: `FM7(9) [E4,G4,A4,C5]` → `[E3,G3,A3,C4]`。
    private static func ascendingProgressionStaffNames(entry: SurvivalChordProgressionEntry) -> [String]? {
        let voices = entry.voicing
        guard !voices.isEmpty else { return nil }
        let pitchClasses = Set(voices.map { (($0 % 12) + 12) % 12 })
        guard pitchClasses.count == voices.count else { return nil }

        guard let parallel = entry.voicingNames, parallel.count == voices.count else { return nil }

        let sortedVoicing = voices.sorted()
        let hintMidiByPc = reconstructHintMidisByPitchClass(sortedVoicing: sortedVoicing)

        var pairs: [(midi: Int, nm: String)] = []
        pairs.reserveCapacity(voices.count)
        for (rawMidi, rawName) in zip(voices, parallel) {
            let trimmed = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return nil }
            let pc = ((rawMidi % 12) + 12) % 12
            let aligned = hintMidiByPc[pc] ?? rawMidi
            let nm = alignNameOctaveToMidi(name: trimmed, targetMidi: aligned)
            pairs.append((midi: aligned, nm: nm))
        }
        pairs.sort { $0.midi < $1.midi }
        return pairs.map(\.nm)
    }

    private static let hintBaseMidi = 48

    private static func reconstructHintMidisByPitchClass(
        sortedVoicing: [Int]
    ) -> [Int: Int] {
        var orderedPcs: [Int] = []
        var seenPc = Set<Int>()
        for midi in sortedVoicing {
            let pc = ((midi % 12) + 12) % 12
            if seenPc.insert(pc).inserted {
                orderedPcs.append(pc)
            }
        }
        var out: [Int: Int] = [:]
        var last = -1
        for pc in orderedPcs {
            var m = pc + hintBaseMidi
            while m <= last { m += 12 }
            out[pc] = m
            last = m
        }
        return out
    }

    private static let stepSemitone: [Character: Int] = [
        "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11,
    ]

    /// 綴り（step + accidental）を保ったまま、オクターブだけ targetMidi に揃えた表記へ。
    /// パース不能のときは入力をそのまま返す。
    private static func alignNameOctaveToMidi(name: String, targetMidi: Int) -> String {
        let chars = Array(name)
        guard let first = chars.first, let stepSemi = stepSemitone[first] else { return name }
        var idx = 1
        var alter = 0
        while idx < chars.count {
            let ch = chars[idx]
            if ch == "x" { alter = 2; idx += 1; break }
            if ch == "#" || ch == "♯" { alter += 1; idx += 1; continue }
            if ch == "b" || ch == "♭" { alter -= 1; idx += 1; continue }
            break
        }
        let octString = String(chars[idx...])
        guard let octave = Int(octString) else { return name }
        let currentMidi = (octave + 1) * 12 + stepSemi + alter
        let diffSemi = Double(targetMidi - currentMidi)
        let diffOct = Int((diffSemi / 12.0).rounded())
        if diffOct == 0 { return name }
        let prefix = String(chars[0..<idx])
        return "\(prefix)\(octave + diffOct)"
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
