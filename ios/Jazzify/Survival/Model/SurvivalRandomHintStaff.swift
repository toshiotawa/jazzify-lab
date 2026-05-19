import Foundation

// MARK: - Web `survivalRandomHintStaff.ts` / `survivalProgressionVoicings.ts` 相当（ランダム HINT 譜面）

/// ランダムモード HINT 時: コード ID → 五線譜用オクターブ付き音名・調号（常に C）。
enum SurvivalRandomHintStaff {
    private static let voicingLowestMidiMin = 48
    private static let voicingLowestMidiMax = 59

    private static let all17Roots: [String] = [
        "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
    ]

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

    /// `SurvivalChordResolver` と同順（最長一致ルート）
    private static let validRootPrefixes: [String] = [
        "C#", "Db", "D#", "Eb", "F#", "Gb", "G#", "Ab", "A#", "Bb",
        "Cb", "E#", "Fb", "B#",
        "C", "D", "E", "F", "G", "A", "B",
    ]

    private enum ProgressionKind: CaseIterable {
        case M7_9, m7, seven_9_13, seven_9, seven_b9_b13, m7b5, six_9, dim7, m6_9, mM7_9, dom7, aug7

        var displaySuffix: String {
            switch self {
            case .M7_9: return "M7(9)"
            case .m7: return "m7"
            case .seven_9_13: return "7(9.13)"
            case .seven_9: return "7(9)"
            case .seven_b9_b13: return "7(b9.b13)"
            case .m7b5: return "m7(b5)"
            case .six_9: return "6(9)"
            case .dim7: return "dim7"
            case .m6_9: return "m6(9)"
            case .mM7_9: return "mM7(9)"
            case .dom7: return "7"
            case .aug7: return "7aug"
            }
        }
    }

    private typealias VoicingForm = Character // 'A' | 'B' | 'C'

    private static let minorSeventhAFormPC: Set<Int> = [0, 1, 2, 3, 4]
    private static let halfDimAFormPC: Set<Int> = [0, 1, 2, 3, 4, 5]
    private static let majorDominantAFormPC: Set<Int> = [0, 1, 2, 3, 4, 10, 11]
    private static let minorDominantAFormPC: Set<Int> = [0, 1, 2, 3, 4, 11]
    private static let majorTonicAFormPC: Set<Int> = [0, 1, 2, 10, 11]
    private static let minorTonicAFormPC: Set<Int> = [0, 1, 2, 3, 10, 11]

    private static let kindRelatives: [ProgressionKind: ([Int], [Int])] = [
        .M7_9: ([4, 7, 11, 14], [11, 14, 16, 19]),
        .m7: ([3, 7, 10, 14], [10, 14, 15, 19]),
        .seven_9_13: ([4, 9, 10, 14], [10, 14, 16, 21]),
        .seven_9: ([4, 7, 10, 14], [10, 14, 16, 19]),
        .seven_b9_b13: ([4, 8, 10, 13], [10, 13, 16, 20]),
        .m7b5: ([3, 6, 10, 14], [10, 14, 15, 18]),
        .six_9: ([4, 7, 9, 14], [9, 14, 16, 19]),
        .dim7: ([0, 3, 6, 9], [6, 9, 12, 15]),
        .m6_9: ([3, 7, 9, 14], [9, 14, 15, 19]),
        .mM7_9: ([3, 7, 11, 14], [11, 14, 15, 19]),
        .dom7: ([4, 7, 10, 13], [10, 13, 16, 19]),
        .aug7: ([4, 8, 10, 14], [10, 14, 16, 20]),
    ]

    private static let suffixMatchers: [(suffix: String, kind: ProgressionKind)] = [
        ("M7(9.13)", .M7_9), ("M7(9)", .M7_9), ("mM7(9)", .mM7_9),
        ("m7(b5)", .m7b5), ("m7(b9.b13)", .m7),
        ("7(9.13)", .seven_9_13), ("7(b9.b13)", .seven_b9_b13),
        ("m6(9)", .m6_9), ("6(9)", .six_9),
        ("m7(9)", .m7), ("7(9)", .seven_9),
        ("dim7", .dim7), ("7aug", .aug7), ("aug7", .aug7),
        ("m7", .m7), ("7", .dom7),
    ]

    private static let progressionParseNormalizations: [(String, String)] = [
        ("7(9.6th)", "7(9.13)"), ("7(b9.b6th)", "7(b9.b13)"),
    ]

    private static let staffTemplateIntervals: [SurvivalChordQuality: [String]] = [
        .single: ["1P"],
        .maj: ["1P", "3M", "5P"],
        .min: ["1P", "3m", "5P"],
        .aug: ["1P", "3M", "5A"],
        .dim: ["1P", "3m", "5d"],
        .seven: ["1P", "3M", "5P", "7m"],
        .maj7: ["1P", "3M", "5P", "7M"],
        .m7: ["1P", "3m", "5P", "7m"],
        .mM7: ["1P", "3m", "5P", "7M"],
        .dim7: ["1P", "3m", "5d", "6M"],
        .aug7: ["1P", "3M", "5A", "7m"],
        .m7b5: ["1P", "3m", "5d", "7m"],
        .six: ["1P", "3M", "5P", "6M"],
        .m6: ["1P", "3m", "5P", "6M"],
        .maj7_9: ["3M", "5P", "7M", "9M"],
        .m7_9: ["3m", "5P", "7m", "9M"],
        .seven_9_6th: ["3M", "6M", "7m", "9M"],
        .seven_b9_b6th: ["3M", "6m", "7m", "9m"],
        .six_9: ["3M", "5P", "6M", "9M"],
        .m6_9: ["3m", "5P", "6M", "9M"],
        .seven_b9_6th: ["3M", "6M", "7m", "9m"],
        .seven_s9_b6th: ["3M", "6m", "7m", "9A"],
        .m7b5_11: ["1P", "4P", "5d", "7m"],
        .dimM7: ["1P", "3m", "5d", "7M"],
    ]

    /// `SurvivalQuestionTypes` などから Tonal 互換 API を利用するための委譲。
    static func transpose(noteName: String, intervalName: String) -> String? {
        TonalMini.transpose(noteName: noteName, intervalName: intervalName)
    }

    static func midi(ofSpelledNote name: String) -> Int? {
        TonalMini.midi(ofSpelledNote: name)
    }

    /// WEB `buildSurvivalRandomHintStaffVoicing` 相当。
    static func voicing(forChordId chordId: String) -> (names: [String], keyFifths: Int)? {
        let trimmed = chordId.trimmingCharacters(in: .whitespacesAndNewlines)
        if let questionNames = SurvivalQuestionTypes.staffVoicingNames(forChordId: trimmed) {
            return (questionNames, 0)
        }
        let numerator: String = trimmed.split(separator: "/").first.map(String.init) ?? trimmed
        guard let parsed = SurvivalChordResolver.parseChord(id: numerator) else { return nil }

        if let mapKey = progressionMapKey(root: parsed.root, quality: parsed.quality),
           let entryVoicing = progressionVoicingMap[mapKey],
           entryVoicing.count == 4 {
            let up = entryVoicing.map { $0 + 12 }
            let parseName = normalizeChordSymbolForProgressionParse(numerator)
            if let names = buildStaffVoicingNames(forName: parseName, voicing: up), names.count == 4 {
                return (names, 0)
            }
        }

        if let basic = buildTemplateStaffVoicingNames(root: parsed.root, quality: parsed.quality), !basic.isEmpty {
            return (basic, 0)
        }
        return nil
    }

    // MARK: - Progression map + staff names

    private static let progressionVoicingMap: [String: [Int]] = {
        var map: [String: [Int]] = [:]
        map.reserveCapacity(all17Roots.count * ProgressionKind.allCases.count)
        for root in all17Roots {
            for kind in ProgressionKind.allCases {
                let name = "\(root)\(kind.displaySuffix)"
                let form: VoicingForm
                if kind == .M7_9 && root == "Eb" {
                    form = "C"
                } else {
                    form = defaultFormForRootByKind(root: root, kind: kind)
                }
                let voicing: [Int]
                if form == "C" {
                    let bRel = kindRelatives[.M7_9]!.1
                    let oct = choosePreferredRootOctave(root: root, relatives: bRel)
                    let bMidis = relativeSemitonesToAscendingMidi(root: root, relatives: bRel, preferredRootOctave: oct)
                    voicing = bMidis.map { $0 - 12 }
                } else {
                    let ab = kindRelatives[kind]!
                    let rel = form == "A" ? ab.0 : ab.1
                    let oct = choosePreferredRootOctave(root: root, relatives: rel)
                    voicing = relativeSemitonesToAscendingMidi(root: root, relatives: rel, preferredRootOctave: oct)
                }
                map[name] = voicing
            }
        }
        return map
    }()

    private static func progressionMapKey(root: String, quality: SurvivalChordQuality) -> String? {
        switch quality {
        case .maj7_9: return "\(root)M7(9)"
        case .m7_9: return "\(root)m7"
        case .seven_9_6th: return "\(root)7(9.13)"
        case .seven_b9_b6th: return "\(root)7(b9.b13)"
        case .six_9: return "\(root)6(9)"
        case .m6_9: return "\(root)m6(9)"
        default: return nil
        }
    }

    private static func normalizeChordSymbolForProgressionParse(_ raw: String) -> String {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        for (from, to) in progressionParseNormalizations where s.contains(from) {
            s = s.replacingOccurrences(of: from, with: to)
        }
        return s
    }

    private static func normalizeChordToken(_ raw: String) -> String {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let re = try? NSRegularExpression(pattern: #"^([A-G](?:bb|##|b|#|x)?)m7b5$"#, options: []),
              let m = re.firstMatch(in: t, range: NSRange(t.startIndex..., in: t)),
              m.numberOfRanges >= 2,
              let r = Range(m.range(at: 1), in: t) else { return t }
        return "\(t[r])m7(b5)"
    }

    private static func parseChordToken(_ token: String) -> (root: String, kind: ProgressionKind, name: String)? {
        let t = normalizeChordToken(token)
        guard !t.isEmpty else { return nil }
        for prefix in validRootPrefixes where t.hasPrefix(prefix) {
            let root = prefix
            let rest = String(t.dropFirst(prefix.count))
            for (suffix, kind) in suffixMatchers where rest == suffix {
                return (root, kind, "\(root)\(suffix)")
            }
        }
        return nil
    }

    private static func pitchClass(root: String) -> Int? {
        guard let semi = rootSemitones[root] else { return nil }
        return ((semi % 12) + 12) % 12
    }

    private static func formFromPitchClassSet(root: String, aFormPitchClasses: Set<Int>) -> VoicingForm {
        guard let pc = pitchClass(root: root) else { return "B" }
        return aFormPitchClasses.contains(pc) ? "A" : "B"
    }

    private static func defaultFormForDim7Root(root: String) -> VoicingForm {
        guard let pc = pitchClass(root: root) else { return "B" }
        let shifted = (pc - 4 + 12) % 12
        return minorDominantAFormPC.contains(shifted) ? "A" : "B"
    }

    private static func defaultFormForRootByKind(root: String, kind: ProgressionKind) -> VoicingForm {
        switch kind {
        case .seven_9_13, .seven_9, .dom7, .aug7:
            return formFromPitchClassSet(root: root, aFormPitchClasses: majorDominantAFormPC)
        case .seven_b9_b13:
            return formFromPitchClassSet(root: root, aFormPitchClasses: minorDominantAFormPC)
        case .M7_9, .six_9:
            return formFromPitchClassSet(root: root, aFormPitchClasses: majorTonicAFormPC)
        case .m6_9, .mM7_9:
            return formFromPitchClassSet(root: root, aFormPitchClasses: minorTonicAFormPC)
        case .dim7:
            return defaultFormForDim7Root(root: root)
        case .m7:
            return formFromPitchClassSet(root: root, aFormPitchClasses: minorSeventhAFormPC)
        case .m7b5:
            return formFromPitchClassSet(root: root, aFormPitchClasses: halfDimAFormPC)
        }
    }

    private static func selectFormForProgressionIndex(root: String, kind: ProgressionKind) -> VoicingForm {
        if kind == .M7_9 && root == "Eb" { return "C" }
        return defaultFormForRootByKind(root: root, kind: kind)
    }

    private static func relativeSemitonesToAscendingMidi(root: String, relatives: [Int], preferredRootOctave: Int) -> [Int] {
        let base = TonalMini.rootMidiNaturalOctave(root: root, octave: preferredRootOctave)
        var midis = relatives.map { base + $0 }
        for i in 1..<midis.count {
            while midis[i] <= midis[i - 1] { midis[i] += 12 }
        }
        return midis
    }

    private static func choosePreferredRootOctave(root: String, relatives: [Int]) -> Int {
        var bestInRange: Int?
        for oct in 1...5 {
            let v = relativeSemitonesToAscendingMidi(root: root, relatives: relatives, preferredRootOctave: oct)
            let minV = v[0]
            if minV >= voicingLowestMidiMin && minV <= voicingLowestMidiMax {
                bestInRange = oct
            }
        }
        if let b = bestInRange { return b }
        var fallback = 3
        var bestDist = Int.max
        for oct in 1...6 {
            let v = relativeSemitonesToAscendingMidi(root: root, relatives: relatives, preferredRootOctave: oct)
            let minV = v[0]
            let dist: Int
            if minV < voicingLowestMidiMin {
                dist = voicingLowestMidiMin - minV
            } else if minV > voicingLowestMidiMax {
                dist = minV - voicingLowestMidiMax
            } else {
                dist = 0
            }
            if dist < bestDist {
                bestDist = dist
                fallback = oct
            }
        }
        return fallback
    }

    private static func buildFormMidis(root: String, kind: ProgressionKind, form: VoicingForm) -> [Int]? {
        if form == "C" {
            guard kind == .M7_9 && root == "Eb" else { return nil }
            let bRel = kindRelatives[.M7_9]!.1
            let oct = choosePreferredRootOctave(root: root, relatives: bRel)
            let bMidis = relativeSemitonesToAscendingMidi(root: root, relatives: bRel, preferredRootOctave: oct)
            return bMidis.map { $0 - 12 }
        }
        guard let ab = kindRelatives[kind] else { return nil }
        let rel = form == "A" ? ab.0 : ab.1
        let oct = choosePreferredRootOctave(root: root, relatives: rel)
        return relativeSemitonesToAscendingMidi(root: root, relatives: rel, preferredRootOctave: oct)
    }

    private static func assertFourUniquePitchClasses(midis: [Int]) -> Bool {
        guard midis.count == 4 else { return false }
        let pcs = Set(midis.map { (($0 % 12) + 12) % 12 })
        return pcs.count == 4
    }

    private static func buildStaffVoicingNames(forName name: String, voicing entry: [Int]) -> [String]? {
        guard assertFourUniquePitchClasses(midis: entry) else { return nil }
        let normalizedToken = normalizeChordToken(name)
        guard let classified = parseChordToken(normalizedToken) else { return nil }
        let form = selectFormForProgressionIndex(root: classified.root, kind: classified.kind)
        let relatives: [Int]
        if classified.kind == .M7_9 && classified.root == "Eb" && form == "C" {
            relatives = kindRelatives[.M7_9]!.1
        } else {
            let ab = kindRelatives[classified.kind]!
            relatives = form == "A" ? ab.0 : ab.1
        }

        let oct = choosePreferredRootOctave(root: classified.root, relatives: relatives)
        guard let built = buildFormMidis(root: classified.root, kind: classified.kind, form: form) else { return nil }

        let entrySortedPc = Set(entry.map { (($0 % 12) + 12) % 12 }).sorted()
        let builtPc = Set(built.map { (($0 % 12) + 12) % 12 }).sorted()
        guard entrySortedPc.count == builtPc.count else { return nil }
        guard zip(entrySortedPc, builtPc).allSatisfy(==) else { return nil }

        let tonalRoot = classified.root.replacingOccurrences(of: "x", with: "##")
        var spelled: [String] = []
        for off in relatives {
            guard
                let iv = TonalMini.intervalName(fromSemitoneOffset: off),
                let s = TonalMini.transpose(noteName: "\(tonalRoot)\(oct)", intervalName: iv)
            else { return nil }
            spelled.append(s)
        }
        let adjusted = zip(spelled, built).map { alignNameOctaveToMidi(name: $0.0, targetMidi: $0.1) }
        let paired = zip(built, adjusted).map { (midi: $0.0, name: $0.1) }.sorted { $0.midi < $1.midi }

        let entryAscending = Array(Set(entry)).sorted()
        guard paired.count == entryAscending.count else { return nil }

        var outNames: [String] = []
        for midiTarget in entryAscending {
            let tgtPc = ((midiTarget % 12) + 12) % 12
            guard let row = paired.first(where: { (($0.midi % 12) + 12) % 12 == tgtPc }) else { return nil }
            outNames.append(alignNameOctaveToMidi(name: row.name, targetMidi: midiTarget))
        }
        return outNames.map(toStaffSpelling)
    }

    // MARK: - Basic templates (dim7 staff = 7d)

    private static func buildTemplateStaffVoicingNames(root: String, quality: SurvivalChordQuality) -> [String]? {
        let intervals: [String]
        if quality == .dim7 {
            intervals = ["1P", "3m", "5d", "7d"]
        } else {
            intervals = staffTemplateIntervals[quality] ?? []
        }
        guard !intervals.isEmpty else { return nil }

        let tonalRoot = root.replacingOccurrences(of: "x", with: "##")
        let bassOct = 4
        var prevMidi = Int.min
        var out: [String] = []

        for interval in intervals {
            var oct = bassOct
            guard var candidate = TonalMini.transpose(noteName: "\(tonalRoot)\(oct)", intervalName: interval) else { return nil }
            var midi = TonalMini.midi(ofSpelledNote: candidate) ?? Int.min
            while midi <= prevMidi {
                oct += 1
                guard let c2 = TonalMini.transpose(noteName: "\(tonalRoot)\(oct)", intervalName: interval) else { return nil }
                candidate = c2
                guard let m2 = TonalMini.midi(ofSpelledNote: candidate) else { return nil }
                midi = m2
            }
            prevMidi = midi
            out.append(toStaffSpelling(candidate))
        }
        return out
    }

    private static func toStaffSpelling(_ spelled: String) -> String {
        spelled.replacingOccurrences(of: "##", with: "x")
    }

    private static let stepSemitone: [Character: Int] = [
        "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11,
    ]

    /// `SurvivalResolvedChord.alignNameOctaveToMidi` と同じ。
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

// MARK: - Tonal 最小互換（fifths 座標）

private enum TonalMini {
    private static let fifthsSteps: [Int] = [0, 2, 4, -1, 1, 3, 5]
    private static let stepsToFifthsUnaltered: [Int] = [3, 0, 4, 1, 5, 2, 6]
    private static let stepsToOctOffset: [Int] = [0, 1, 2, -1, 0, 1, 2]

    private static let semitoneToIntervalName: [Int: String] = [
        0: "1P", 1: "2m", 2: "2M", 3: "3m", 4: "3M", 5: "4P", 6: "5d", 7: "5P",
        8: "6m", 9: "6M", 10: "7m", 11: "7M", 12: "8P", 13: "9m", 14: "9M",
        15: "10m", 16: "10M", 17: "11P", 18: "12d", 19: "12P", 20: "13m", 21: "13M",
    ]

    private static let intervalCoordByName: [String: [Int]] = [
        "1P": [0, 0], "2m": [-5, 3], "2M": [2, -1], "3m": [-3, 2], "3M": [4, -2],
        "4P": [-1, 1], "4A": [6, -3], "5d": [-6, 4], "5P": [1, 0], "5A": [8, -4],
        "6m": [-4, 3], "6M": [3, -1], "7m": [-2, 2], "7M": [5, -2], "7d": [-9, 6],
        "8P": [0, 1], "9m": [-5, 4], "9M": [2, 0], "9A": [9, -4], "10m": [-3, 3],
        "10M": [4, -1], "11P": [-1, 2], "12d": [-6, 5], "12P": [1, 1], "13m": [-4, 4], "13M": [3, 0],
    ]

    static func intervalName(fromSemitoneOffset offset: Int) -> String? { semitoneToIntervalName[offset] }

    struct ParsedPitch {
        let step: Int
        let alt: Int
        let oct: Int?
    }

    static func rootMidiNaturalOctave(root: String, octave: Int) -> Int {
        guard let p = parseNote(root + "\(octave)", requireOctave: true),
              let m = midi(of: p) else {
            return 60
        }
        return m
    }

    static func midi(ofSpelledNote name: String) -> Int? {
        guard let p = parseNote(name, requireOctave: true) else { return nil }
        return midi(of: p)
    }

    private static func midi(of p: ParsedPitch) -> Int? {
        guard let oct = p.oct else { return nil }
        let semi = naturalSemitoneForStep(p.step)
        let h = semi + p.alt + 12 * (oct + 1)
        guard h >= 0 && h <= 127 else { return nil }
        return h
    }

    private static func naturalSemitoneForStep(_ step: Int) -> Int {
        [0, 2, 4, 5, 7, 9, 11][step % 7]
    }

    private static func parseNote(_ raw: String, requireOctave: Bool) -> ParsedPitch? {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let re = try? NSRegularExpression(pattern: #"^([A-Ga-g])(#{1,}|b{1,}|x{1,}|)(-?\d*)$"#, options: []),
              let m = re.firstMatch(in: t, range: NSRange(t.startIndex..., in: t)),
              m.numberOfRanges >= 4,
              let r0 = Range(m.range(at: 1), in: t),
              let r1 = Range(m.range(at: 2), in: t),
              let r2 = Range(m.range(at: 3), in: t) else { return nil }

        let letter = String(t[r0]).uppercased()
        let accRaw = String(t[r1]).replacingOccurrences(of: "x", with: "##")
        let octStr = String(t[r2])

        let stepIdx: Int
        switch letter {
        case "C": stepIdx = 0
        case "D": stepIdx = 1
        case "E": stepIdx = 2
        case "F": stepIdx = 3
        case "G": stepIdx = 4
        case "A": stepIdx = 5
        case "B": stepIdx = 6
        default: return nil
        }

        let alt: Int
        if accRaw.isEmpty {
            alt = 0
        } else if accRaw.allSatisfy({ $0 == "b" }) {
            alt = -accRaw.count
        } else if accRaw.allSatisfy({ $0 == "#" }) {
            alt = accRaw.count
        } else {
            return nil
        }

        if requireOctave {
            guard !octStr.isEmpty, let o = Int(octStr) else { return nil }
            return ParsedPitch(step: stepIdx, alt: alt, oct: o)
        }
        if octStr.isEmpty {
            return ParsedPitch(step: stepIdx, alt: alt, oct: nil)
        }
        guard let o = Int(octStr) else { return nil }
        return ParsedPitch(step: stepIdx, alt: alt, oct: o)
    }

    private static func unalteredFifthsIndex(_ f: Int) -> Int {
        var i = (f + 1) % 7
        if i < 0 { i += 7 }
        return i
    }

    private static func noteNameToCoord(_ name: String) -> [Int]? {
        guard let p = parseNote(name, requireOctave: true), let oct = p.oct else { return nil }
        let f = fifthsSteps[p.step] + 7 * p.alt
        let o = oct - stepsToOctOffset[p.step] - 4 * p.alt
        return [f, o]
    }

    private static func coordToNoteName(_ coord: [Int]) -> String? {
        guard coord.count >= 2 else { return nil }
        let f = coord[0]
        let o = coord[1]
        let step = stepsToFifthsUnaltered[unalteredFifthsIndex(f)]
        let alt = Int(floor(Double(f + 1) / 7.0))
        let oct = o + 4 * alt + stepsToOctOffset[step]
        return spellNote(step: step, alt: alt, oct: oct)
    }

    private static let letterNames = ["C", "D", "E", "F", "G", "A", "B"]

    private static func spellNote(step: Int, alt: Int, oct: Int) -> String {
        let letter = letterNames[step]
        let acc: String
        if alt < 0 {
            acc = String(repeating: "b", count: -alt)
        } else if alt > 0 {
            acc = String(repeating: "#", count: alt)
        } else {
            acc = ""
        }
        return "\(letter)\(acc)\(oct)"
    }

    static func transpose(noteName: String, intervalName: String) -> String? {
        let intervalCoord: [Int]
        if intervalName.hasPrefix("-") {
            let positive = String(intervalName.dropFirst())
            guard let ic = intervalCoordByName[positive] else { return nil }
            intervalCoord = [-ic[0], -ic[1]]
        } else {
            guard let ic = intervalCoordByName[intervalName] else { return nil }
            intervalCoord = ic
        }
        guard let nc = noteNameToCoord(noteName), nc.count == 2, intervalCoord.count == 2 else { return nil }
        let tr = [nc[0] + intervalCoord[0], nc[1] + intervalCoord[1]]
        return coordToNoteName(tr)
    }
}
