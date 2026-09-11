import Foundation

/// 綴り（音名 + 変化記号 + オクターブ）を保った音楽理論ユーティリティ。
/// Web `trainingQuestionBuilder.ts`（tonal 依存）と同じ結果を返すことを目的とする。
enum TrainingMusicTheory {
    struct SpelledNote: Equatable {
        /// 0 = C ... 6 = B
        let letterIndex: Int
        /// -2 ... 2
        let alter: Int
        let octave: Int

        var midi: Int {
            (octave + 1) * 12 + letterSemitones[letterIndex] + alter
        }

        var name: String {
            "\(letters[letterIndex])\(accidentalText(alter))\(octave)"
        }

        /// 出題文用にオクターブを除いた音名（例: C4 → C）
        var pitchName: String {
            "\(letters[letterIndex])\(accidentalText(alter))"
        }

        var pitchClass: Int {
            normalizePitchClass(midi)
        }
    }

    /// tonal 表記の音程（例: "3m", "5P", "9M", "-4A"）
    struct IntervalSpec {
        /// 度数 - 1（2度 = 1）。負の値は下行。
        let steps: Int
        let semitones: Int
    }

    private static let letters = ["C", "D", "E", "F", "G", "A", "B"]
    private static let letterSemitones = [0, 2, 4, 5, 7, 9, 11]
    /// 完全 / 長音程の基準半音数（度数 1〜7）
    private static let baseIntervalSemitones = [0, 2, 4, 5, 7, 9, 11]
    private static let perfectDegrees: Set<Int> = [1, 4, 5]

    static let chordTemplates: [String: [String]] = [
        "single": ["1P"],
        "maj": ["1P", "3M", "5P"],
        "min": ["1P", "3m", "5P"],
        "aug": ["1P", "3M", "5A"],
        "dim": ["1P", "3m", "5d"],
        "7": ["1P", "3M", "5P", "7m"],
        "maj7": ["1P", "3M", "5P", "7M"],
        "m7": ["1P", "3m", "5P", "7m"],
        "mM7": ["1P", "3m", "5P", "7M"],
        "dim7": ["1P", "3m", "5d", "6M"],
        "aug7": ["1P", "3M", "5A", "7m"],
        "m7b5": ["1P", "3m", "5d", "7m"],
        "6": ["1P", "3M", "5P", "6M"],
        "m6": ["1P", "3m", "5P", "6M"],
        "9": ["1P", "3M", "5P", "7m", "9M"],
        "m9": ["1P", "3m", "5P", "7m", "9M"],
        "maj9": ["1P", "3M", "5P", "7M", "9M"],
        "11": ["1P", "3M", "5P", "7m", "9M", "11P"],
        "m11": ["1P", "3m", "5P", "7m", "9M", "11P"],
        "13": ["1P", "3M", "5P", "7m", "9M", "11P", "13M"],
        "m13": ["1P", "3m", "5P", "7m", "9M", "11P", "13M"],
        "sus2": ["1P", "2M", "5P"],
        "sus4": ["1P", "4P", "5P"],
        "7sus4": ["1P", "4P", "5P", "7m"],
        "add9": ["1P", "3M", "5P", "9M"],
        "madd9": ["1P", "3m", "5P", "9M"],
        "maj7_9": ["3M", "5P", "7M", "9M"],
        "m7_9": ["3m", "5P", "7m", "9M"],
        "7_9_6th": ["3M", "6M", "7m", "9M"],
        "7_b9_b6th": ["3M", "6m", "7m", "9m"],
        "6_9": ["3M", "5P", "6M", "9M"],
        "m6_9": ["3m", "5P", "6M", "9M"],
        "7_b9_6th": ["3M", "6M", "7m", "9m"],
        "7_s9_b6th": ["3M", "6m", "7m", "9A"],
        "m7b5_11": ["1P", "4P", "5d", "7m"],
        "dimM7": ["1P", "3m", "5d", "7M"],
    ]

    /// Web `CHORD_SYMBOL_SUFFIX` と同じ
    static let chordSymbolSuffix: [String: String] = [
        "maj": "",
        "min": "m",
        "dim": "dim",
        "aug": "aug",
        "sus4": "sus4",
        "maj7": "M7",
        "m7": "m7",
        "7": "7",
        "m7b5": "m7(b5)",
        "dim7": "dim7",
        "7sus4": "7sus4",
        "6": "6",
        "m6": "m6",
        "mM7": "mM7",
    ]

    static let scaleTemplates: [String: [String]] = [
        "major": ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
        "ionian": ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
        "natural_minor": ["1P", "2M", "3m", "4P", "5P", "6m", "7m"],
        "aeolian": ["1P", "2M", "3m", "4P", "5P", "6m", "7m"],
        "harmonic_minor": ["1P", "2M", "3m", "4P", "5P", "6m", "7M"],
        "melodic_minor": ["1P", "2M", "3m", "4P", "5P", "6M", "7M"],
        "hmp5_below": ["1P", "2m", "3m", "4P", "5d", "6m", "7m"],
        "dorian": ["1P", "2M", "3m", "4P", "5P", "6M", "7m"],
        "phrygian": ["1P", "2m", "3m", "4P", "5P", "6m", "7m"],
        "lydian": ["1P", "2M", "3M", "4A", "5P", "6M", "7M"],
        "mixolydian": ["1P", "2M", "3M", "4P", "5P", "6M", "7m"],
        "locrian": ["1P", "2m", "3m", "4P", "5d", "6m", "7m"],
        "altered": ["1P", "2m", "3m", "3M", "5d", "6m", "7m"],
        "half_whole_diminished": ["1P", "2m", "3m", "3M", "4A", "5P", "6m", "7M"],
        "whole_half_diminished": ["1P", "2M", "3m", "4P", "5d", "6m", "6M", "7M"],
        "lydian_dominant": ["1P", "2M", "3M", "4A", "5P", "6M", "7m"],
        "mixolydian_b6": ["1P", "2M", "3M", "4P", "5P", "6m", "7m"],
        "locrian_natural2": ["1P", "2M", "3m", "4P", "5d", "6m", "7m"],
        "whole_tone": ["1P", "2M", "3M", "4A", "5A", "6M"],
        "major_pentatonic": ["1P", "2M", "3M", "5P", "6M"],
        "minor_pentatonic": ["1P", "3m", "4P", "5P", "7m"],
    ]

    // MARK: - Parsing / formatting

    static func accidentalText(_ alter: Int) -> String {
        switch alter {
        case 2: return "x"
        case 1: return "#"
        case -1: return "b"
        case -2: return "bb"
        default: return ""
        }
    }

    /// "Db4" / "F#3" / "Fb3" / "Cx5" / "Bbb2" を解釈する。オクターブ無しは nil。
    static func parseSpelled(_ noteName: String) -> SpelledNote? {
        let trimmed = noteName.trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first,
              let letterIndex = letters.firstIndex(of: String(first).uppercased())
        else { return nil }
        var alter = 0
        var index = trimmed.index(after: trimmed.startIndex)
        accidentalLoop: while index < trimmed.endIndex {
            switch trimmed[index] {
            case "x": alter += 2
            case "#", "♯": alter += 1
            case "b", "♭": alter -= 1
            default: break accidentalLoop
            }
            index = trimmed.index(after: index)
        }
        guard let octave = Int(trimmed[index...]) else { return nil }
        return SpelledNote(letterIndex: letterIndex, alter: alter, octave: octave)
    }

    /// オクターブ無しのルート名（"Db"）を解釈する。
    static func parsePitchClassName(_ name: String) -> (letterIndex: Int, alter: Int)? {
        guard let parsed = parseSpelled("\(name)4") else { return nil }
        return (parsed.letterIndex, parsed.alter)
    }

    static func parseVoicingMidi(_ noteName: String) -> Int? {
        parseSpelled(noteName)?.midi
    }

    static func normalizePitchClass(_ midi: Int) -> Int {
        ((midi % 12) + 12) % 12
    }

    // MARK: - Intervals

    /// "3m" / "5P" / "9M" / "4A" / "5d" / "-4A"
    static func parseInterval(_ text: String) -> IntervalSpec? {
        var body = text
        var descending = false
        if body.hasPrefix("-") {
            descending = true
            body.removeFirst()
        }
        guard let qualityChar = body.last else { return nil }
        let numberText = String(body.dropLast())
        guard let number = Int(numberText), number >= 1 else { return nil }
        let simpleDegree = ((number - 1) % 7) + 1
        let octaves = (number - 1) / 7
        var semitones = baseIntervalSemitones[simpleDegree - 1] + octaves * 12
        let isPerfect = perfectDegrees.contains(simpleDegree)
        switch qualityChar {
        case "P", "M": break
        case "m": semitones -= 1
        case "A": semitones += 1
        case "d": semitones -= isPerfect ? 1 : 2
        default: return nil
        }
        let steps = number - 1
        return IntervalSpec(
            steps: descending ? -steps : steps,
            semitones: descending ? -semitones : semitones
        )
    }

    /// 綴りを保った移調。
    static func transpose(_ note: SpelledNote, by interval: IntervalSpec) -> SpelledNote {
        let rawLetter = note.letterIndex + interval.steps
        let letterIndex = ((rawLetter % 7) + 7) % 7
        let octaveCarry = Int((Double(rawLetter) / 7.0).rounded(.down))
        let octave = note.octave + octaveCarry
        let targetMidi = note.midi + interval.semitones
        let naturalMidi = (octave + 1) * 12 + letterSemitones[letterIndex]
        let alter = targetMidi - naturalMidi
        return SpelledNote(letterIndex: letterIndex, alter: alter, octave: octave)
    }

    static func transpose(_ noteName: String, interval: String) -> String? {
        guard let note = parseSpelled(noteName), let spec = parseInterval(interval) else { return nil }
        return transpose(note, by: spec).name
    }

    /// ピッチクラス間の上行音程（tonal `distance("C", "Eb")` = "3m" 相当）。
    static func ascendingInterval(fromRoot: String, toRoot: String) -> IntervalSpec? {
        guard let from = parsePitchClassName(fromRoot), let to = parsePitchClassName(toRoot) else { return nil }
        let steps = ((to.letterIndex - from.letterIndex) % 7 + 7) % 7
        let fromPc = letterSemitones[from.letterIndex] + from.alter
        let toPc = letterSemitones[to.letterIndex] + to.alter
        let semitones = ((toPc - fromPc) % 12 + 12) % 12
        return IntervalSpec(steps: steps, semitones: semitones)
    }

    // MARK: - Building

    static func spelledFromIntervals(root: String, octave: Int, intervals: [String]) -> [SpelledNote] {
        guard let rootNote = parseSpelled("\(root)\(octave)") else { return [] }
        return intervals.compactMap { interval in
            parseInterval(interval).map { transpose(rootNote, by: $0) }
        }
    }

    static func shiftOctave(_ note: SpelledNote, by delta: Int) -> SpelledNote {
        SpelledNote(letterIndex: note.letterIndex, alter: note.alter, octave: note.octave + delta)
    }

    /// 最低音が [minMidi, minMidi + 12) に入る最も低いオクターブへ平行移動する。
    static func placeLowestInOctaveAbove(_ notes: [SpelledNote], minMidi: Int) -> [SpelledNote] {
        guard let lowest = notes.map(\.midi).min() else { return [] }
        let delta = Int((Double(minMidi - lowest) / 12.0).rounded(.up))
        if delta == 0 { return notes }
        return notes.map { shiftOctave($0, by: delta) }
    }

    /// 最低音の直下にあるルート音（正解時に鳴らす音）。
    static func rootMidiBelow(root: String, lowestMidi: Int) -> Int? {
        guard let rootPcName = parsePitchClassName(root) else { return nil }
        let rootPc = normalizePitchClass(letterSemitones[rootPcName.letterIndex] + rootPcName.alter)
        var midi = lowestMidi - ((normalizePitchClass(lowestMidi) - rootPc + 12) % 12)
        if midi >= lowestMidi { midi -= 12 }
        return midi
    }

    /// 音程トレーニングでは重変化記号と E# / B# / Cb / Fb を避ける
    static func isSimpleSpelling(_ note: SpelledNote) -> Bool {
        if abs(note.alter) > 1 { return false }
        if note.alter == 1, note.letterIndex == 2 || note.letterIndex == 6 { return false }
        if note.alter == -1, note.letterIndex == 0 || note.letterIndex == 3 { return false }
        return true
    }

    /// コンサート音高を♭系の綴りで音名にする（譜読み用）
    static func flatSpelledName(_ midi: Int) -> String {
        let names = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
        let pc = normalizePitchClass(midi)
        let octave = Int((Double(midi) / 12.0).rounded(.down)) - 1
        return "\(names[pc])\(octave)"
    }
}
