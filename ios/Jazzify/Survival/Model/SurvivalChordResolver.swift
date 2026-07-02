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
    /// `progressionStaffVoicingNames` と昇順並び対応した譜表行（1=ト／2=ヘ）。
    public let progressionStaffVoicingStaves: [Int]?
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
        progressionStaffVoicingStaves: [Int]? = nil,
        progressionStaffKeyFifths: Int? = nil,
    ) {
        self.id = id
        self.root = root
        self.quality = quality
        self.midiNotes = midiNotes
        self.pitchClasses = pitchClasses
        self.displayName = displayName
        self.progressionStaffVoicingNames = progressionStaffVoicingNames
        self.progressionStaffVoicingStaves = progressionStaffVoicingStaves
        self.progressionStaffKeyFifths = progressionStaffKeyFifths
    }

    /// 正解時ルート音用。スラッシュコードは分母ルート、それ以外はコード記号ルート。
    public var rootPitchClass: Int {
        if let pc = SurvivalChordResolver.progressionBassRootPitchClass(chordSymbol: displayName) {
            return pc
        }
        if let pc = SurvivalChordResolver.progressionBassRootPitchClass(chordSymbol: root) {
            return pc
        }
        return 0
    }

    /// Web `resolveTutorialChordRef` / `sceneThreeChord` 相当。台本の `voicingNames` をそのまま譜面へ。
    /// HINT 鍵盤向け C3 起点再構築（`fromProgressionEntry`）は行わない。
    public static func fromExplicitTutorialVoicing(
        id: String,
        name: String,
        voicing: [Int],
        voicingNames: [String],
        keyFifths: Int = 0,
        progressionStaffVoicingStaves: [Int]? = nil
    ) -> SurvivalResolvedChord {
        var pitchClasses: [Int] = []
        var seen = Set<Int>()
        for midi in voicing {
            let pc = ((midi % 12) + 12) % 12
            if seen.insert(pc).inserted {
                pitchClasses.append(pc)
            }
        }
        return SurvivalResolvedChord(
            id: id,
            root: SurvivalChordResolver.progressionSymbolRootName(chordSymbol: name) ?? name,
            quality: .progression,
            midiNotes: voicing,
            pitchClasses: pitchClasses,
            displayName: name,
            progressionStaffVoicingNames: voicingNames,
            progressionStaffVoicingStaves: progressionStaffVoicingStaves,
            progressionStaffKeyFifths: min(5, max(-6, keyFifths))
        )
    }

    /// Progression エントリ（DB の `chord_progression` 由来）から `SurvivalResolvedChord` を構築する。
    /// - `midiNotes` は実音域（鍵盤ハイライト用）。
    /// - `pitchClasses` は重複除去した 0..<12 の集合（オクターブ無視判定用）。
    public static func fromProgressionEntry(
        _ entry: SurvivalChordProgressionEntry,
        index: Int,
        grandStaffMode: Bool = false
    ) -> SurvivalResolvedChord {
        let sortedMidi = Array(Set(entry.voicing)).sorted()
        var pcs: [Int] = []
        var seen = Set<Int>()
        for note in sortedMidi {
            let pc = ((note % 12) + 12) % 12
            if seen.insert(pc).inserted { pcs.append(pc) }
        }
        let layout = Self.ascendingProgressionStaffLayout(entry: entry, grandStaffMode: grandStaffMode)
        let staffNames = layout?.names
        let staffRows = layout?.staves
        // 採用範囲は -6..+5（F# キーは Gb で表現する方針）。
        let storedKey = entry.keyFifths.map { min(5, max(-6, $0)) }
        let keyForStaff: Int? = storedKey ?? (staffNames != nil ? 0 : nil)
        let id = "prog:\(index):\(entry.name):\(sortedMidi.map(String.init).joined(separator: ","))"
        let symbolRoot = Self.progressionSymbolRootName(chordSymbol: entry.name)
            ?? sortedMidi.first.map { letterPitchName(midi: $0) }
            ?? "C"
        return SurvivalResolvedChord(
            id: id,
            root: symbolRoot,
            quality: .progression,
            midiNotes: sortedMidi,
            pitchClasses: pcs,
            displayName: entry.name,
            progressionStaffVoicingNames: staffNames,
            progressionStaffVoicingStaves: staffRows,
            progressionStaffKeyFifths: keyForStaff
        )
    }

    /// 大譜表フォールバック: MIDI 60 以上はト音(1)、未満はヘ音(2)。
    public static func staffFromMidi(_ midi: Int) -> Int {
        midi >= 60 ? 1 : 2
    }

    /// 譜面表示用。DB `voicing_staves` を優先し、欠落時は `grandStaffMode` のときのみ MIDI 振り分け。
    public static func displayVoicingStavesPerNote(
        voicingNames: [String],
        storedStaves: [Int]?,
        midiNotesAscending: [Int],
        grandStaffMode: Bool
    ) -> [Int]? {
        if let stored = storedStaves, stored.count == voicingNames.count {
            return stored.map { $0 == 1 ? 1 : 2 }
        }
        guard grandStaffMode else { return nil }
        guard midiNotesAscending.count == voicingNames.count else { return nil }
        return midiNotesAscending.map { staffFromMidi($0) }
    }

    /// `voicing` の各 MIDI と並列の綴りを昇順 MIDI に並べる。重複ピッチクラス時はレイアウト不可。
    /// `voicing_names` が無いときはピッチクラスの簡易綴りを使う。`voicing_staves` 省略時はヘ音のみ（大譜表モード時は MIDI 振り分け）。
    private static func ascendingProgressionStaffLayout(
        entry: SurvivalChordProgressionEntry,
        grandStaffMode: Bool
    ) -> (names: [String], staves: [Int]?)? {
        let voices = entry.voicing
        guard !voices.isEmpty else { return nil }
        let pitchClassesUnique = Set(voices.map { (($0 % 12) + 12) % 12 })
        guard pitchClassesUnique.count == voices.count else { return nil }

        let nameStrings: [String]
        if let parallel = entry.voicingNames, parallel.count == voices.count {
            var built: [String] = []
            built.reserveCapacity(voices.count)
            for rawName in parallel {
                let trimmed = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                built.append(trimmed)
            }
            nameStrings = built
        } else {
            nameStrings = voices.map { letterPitchName(midi: $0) }
        }

        let stavesParallel: [Int]?
        if let vs = entry.voicingStaves, vs.count == voices.count {
            stavesParallel = vs.map { $0 == 1 ? 1 : 2 }
        } else if grandStaffMode {
            stavesParallel = voices.map { staffFromMidi($0) }
        } else {
            stavesParallel = nil
        }

        let sortedVoicing = voices.sorted()
        var tuples: [(midi: Int, nm: String, st: Int)] = []
        tuples.reserveCapacity(voices.count)
        for idx in voices.indices {
            let rawMidi = voices[idx]
            let nmRaw = nameStrings[idx]
            let rawStaff = stavesParallel?[idx] ?? 2
            let adjustedName = alignNameOctaveToMidi(name: nmRaw, targetMidi: rawMidi)
            tuples.append((midi: rawMidi, nm: adjustedName, st: rawStaff))
        }
        tuples.sort { $0.midi < $1.midi }
        if stavesParallel != nil {
            return (tuples.map(\.nm), tuples.map(\.st))
        }
        return (tuples.map(\.nm), nil)
    }

    private static func letterPitchName(midi: Int) -> String {
        let letters = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        let pc = ((midi % 12) + 12) % 12
        guard letters.indices.contains(pc) else { return "C" }
        return letters[pc]
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

    /// `C / F` のようにスラッシュ前後の空白も許容して分子・分母に分割する。
    static func splitProgressionSlashChordParts(chordSymbol: String) -> (numerator: String, denominator: String?) {
        let trimmed = chordSymbol.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let slash = trimmed.firstIndex(of: "/") else {
            return (trimmed, nil)
        }
        let numerator = String(trimmed[..<slash]).trimmingCharacters(in: .whitespacesAndNewlines)
        let denominator = String(trimmed[trimmed.index(after: slash)...]).trimmingCharacters(in: .whitespacesAndNewlines)
        return (numerator, denominator.isEmpty ? nil : denominator)
    }

    private static func matchProgressionRootPrefix(_ token: String) -> String? {
        let s = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !s.isEmpty else { return nil }
        for prefix in validRootPrefixes where s.hasPrefix(prefix) {
            return prefix
        }
        return nil
    }

    /// Progression エントリの `name`（例: `Dm7(9)`、`C/E`）からコード記号ルートの綴りを返す。
    /// スラッシュコードは分子のみ。品質が未対応でもルートは返す。
    static func progressionSymbolRootName(chordSymbol: String) -> String? {
        let parts = splitProgressionSlashChordParts(chordSymbol: chordSymbol)
        return matchProgressionRootPrefix(parts.numerator)
    }

    /// スラッシュコード分母（例: `C / F` → `F`）。分母はルート綴りのみ有効。
    static func progressionSlashBassRootName(chordSymbol: String) -> String? {
        let parts = splitProgressionSlashChordParts(chordSymbol: chordSymbol)
        guard let denominator = parts.denominator else { return nil }
        for prefix in validRootPrefixes where denominator == prefix {
            return prefix
        }
        return nil
    }

    /// 正解時ベース用ルート綴り。スラッシュコードなら分母、それ以外は分子ルート。
    static func progressionBassRootName(chordSymbol: String) -> String? {
        if let slashBass = progressionSlashBassRootName(chordSymbol: chordSymbol) {
            return slashBass
        }
        return progressionSymbolRootName(chordSymbol: chordSymbol)
    }

    /// Progression エントリの `name`（例: `Dm7(9)`、`C/E`）からコード記号ルートのピッチクラス (0 = C)。
    /// - スラッシュコードは分子のみを見る。パース不能時は nil。
    static func progressionSymbolRootPitchClass(chordSymbol: String) -> Int? {
        guard let name = progressionSymbolRootName(chordSymbol: chordSymbol),
              let semi = rootSemitones[name] else {
            return nil
        }
        return ((semi % 12) + 12) % 12
    }

    /// 正解時ベース用ピッチクラス (0 = C)。スラッシュコードは分母。
    static func progressionBassRootPitchClass(chordSymbol: String) -> Int? {
        guard let name = progressionBassRootName(chordSymbol: chordSymbol),
              let semi = rootSemitones[name] else {
            return nil
        }
        return ((semi % 12) + 12) % 12
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
        if let question = SurvivalQuestionTypes.resolve(id: id, octave: octave) {
            return SurvivalResolvedChord(
                id: id,
                root: question.root,
                quality: .single,
                midiNotes: [question.midi],
                pitchClasses: [question.pitchClass],
                displayName: question.typeDisplayNameEn
            )
        }
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
