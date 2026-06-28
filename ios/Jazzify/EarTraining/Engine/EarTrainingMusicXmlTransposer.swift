import Foundation

/// Web `musicXmlTransposer.ts` / `earTrainingPracticeTranspose.ts` 相当（OSMD 練習移調）。
enum EarTrainingMusicXmlTransposer {
    static let practiceTransposeMin = -6
    static let practiceTransposeMax = 6

    private static let fifthsToKeyName: [Int: String] = [
        -7: "Cb", -6: "Gb", -5: "Db", -4: "Ab", -3: "Eb", -2: "Bb", -1: "F",
        0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#",
    ]

    private static let keyNameToFifths: [String: Int] = [
        "Cb": -7, "Gb": -6, "Db": -5, "Ab": -4, "Eb": -3, "Bb": -2, "F": -1,
        "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
    ]

    private static let semitoneToFifthsChange: [Int: Int] = [
        0: 0, 1: -5, 2: 2, 3: -3, 4: 4, 5: -1,
        6: 6, 7: 1, 8: -4, 9: 3, 10: -2, 11: 5,
    ]

    private static let preferredKeysByChroma: [String] = [
        "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
    ]

    private static let scaleMap: [String: [String]] = [
        "C": ["C", "D", "E", "F", "G", "A", "B"],
        "G": ["G", "A", "B", "C", "D", "E", "F#"],
        "D": ["D", "E", "F#", "G", "A", "B", "C#"],
        "A": ["A", "B", "C#", "D", "E", "F#", "G#"],
        "E": ["E", "F#", "G#", "A", "B", "C#", "D#"],
        "B": ["B", "C#", "D#", "E", "F#", "G#", "A#"],
        "F#": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
        "C#": ["C#", "D#", "E#", "F#", "G#", "A#", "B#"],
        "Gb": ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
        "Db": ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
        "Ab": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
        "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
        "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
        "F": ["F", "G", "A", "Bb", "C", "D", "E"],
        "Cb": ["Cb", "Db", "Eb", "Fb", "Gb", "Ab", "Bb"],
    ]

    static func clampPracticeTransposeOffset(_ offset: Int) -> Int {
        max(practiceTransposeMin, min(practiceTransposeMax, offset))
    }

    static func readKeyFifths(fromMusicXml xml: String) -> Int {
        if let match = xml.range(of: #"<key[^>]*>[\s\S]*?<fifths>(-?\d+)</fifths>"#, options: .regularExpression) {
            let snippet = String(xml[match])
            if let fifthsMatch = snippet.range(of: #"<fifths>(-?\d+)</fifths>"#, options: .regularExpression) {
                let inner = String(snippet[fifthsMatch])
                if let digits = inner.range(of: #"-?\d+"#, options: .regularExpression),
                   let value = Int(inner[digits]) {
                    return max(-7, min(7, value))
                }
            }
        }
        if let fallback = xml.range(of: #"<fifths>(-?\d+)</fifths>"#, options: .regularExpression) {
            let inner = String(xml[fallback])
            if let digits = inner.range(of: #"-?\d+"#, options: .regularExpression),
               let value = Int(inner[digits]) {
                return max(-7, min(7, value))
            }
        }
        return 0
    }

    static func preferredKeyName(fifths: Int) -> String {
        let clamped = max(-7, min(7, fifths))
        let raw = fifthsToKeyName[clamped] ?? "C"
        switch raw {
        case "F#": return "Gb"
        case "C#": return "Db"
        case "Cb": return "B"
        default: return raw
        }
    }

    static func targetKeyName(originalFifths: Int, semitoneOffset: Int) -> String {
        let originalKey = preferredKeyName(fifths: originalFifths)
        return preferredTargetKey(originalKey: originalKey, semitones: semitoneOffset)
    }

    static func preferredTargetKey(originalKey: String, semitones: Int) -> String {
        let normalized = normalizeToPreferredKey(originalKey)
        guard let chroma = chromaForKey(normalized) else { return normalized }
        let targetChroma = ((chroma + semitones) % 12 + 12) % 12
        return preferredKeysByChroma[targetChroma]
    }

    static func applyPracticeTransposeToMusicXml(_ baseXml: String, offset: Int) -> String {
        let clamped = clampPracticeTransposeOffset(offset)
        if clamped == 0 { return baseXml }
        return transposeMusicXml(baseXml, semitones: clamped)
    }

    static func transposeMusicXml(_ xmlString: String, semitones: Int) -> String {
        if semitones == 0 { return xmlString }
        guard let data = xmlString.data(using: .utf8),
              let doc = try? XMLDocument(data: data, options: [.nodePreserveAll]) else {
            return xmlString
        }

        let originalFifths = readKeyFifths(fromMusicXml: xmlString)
        let originalKeyName = fifthsToKeyName[originalFifths] ?? "C"
        let targetKey = targetKeyFromTransposition(originalKeyName: originalKeyName, semitones: semitones)
        let targetFifths = keyNameToFifths[normalizeToPreferredKey(targetKey)] ?? keyNameToFifths[targetKey] ?? 0
        let intervalName = intervalBetweenKeys(from: originalKeyName, to: targetKey)

        for noteEl in doc.elements(forName: "note") {
            if noteEl.elements(forName: "rest").isEmpty == false { continue }
            guard let pitchEl = noteEl.elements(forName: "pitch").first,
                  let stepEl = pitchEl.elements(forName: "step").first,
                  let octaveEl = pitchEl.elements(forName: "octave").first,
                  let stepText = stepEl.stringValue,
                  let octaveText = octaveEl.stringValue,
                  let octave = Int(octaveText) else { continue }

            let alter = Int(pitchEl.elements(forName: "alter").first?.stringValue ?? "0") ?? 0
            let noteStr = pitchToNote(step: stepText, alter: alter, octave: octave)
            guard var transposed = EarTrainingMusicXmlPitchMath.transpose(noteStr, intervalName: intervalName) else {
                continue
            }
            let octaveShift = semitones / 12
            if octaveShift != 0 {
                let octInterval = "\(abs(octaveShift) * 8)P"
                if octaveShift > 0 {
                    transposed = EarTrainingMusicXmlPitchMath.transpose(transposed, intervalName: octInterval) ?? transposed
                } else {
                    transposed = EarTrainingMusicXmlPitchMath.transpose(transposed, intervalName: "-\(octInterval)") ?? transposed
                }
            }
            applyNoteToPitch(transposed, pitchEl: pitchEl, noteEl: noteEl, targetKey: targetKey)
        }

        for harmonyEl in doc.elements(forName: "harmony") {
            guard let rootEl = harmonyEl.elements(forName: "root").first,
                  let rootStepEl = rootEl.elements(forName: "root-step").first,
                  let rootStep = rootStepEl.stringValue else { continue }
            let rootAlter = Int(rootEl.elements(forName: "root-alter").first?.stringValue ?? "0") ?? 0
            var rootNote = rootStep
            if rootAlter > 0 {
                rootNote += String(repeating: "#", count: rootAlter)
            } else if rootAlter < 0 {
                rootNote += String(repeating: "b", count: -rootAlter)
            }
            guard let transposedRoot = EarTrainingMusicXmlPitchMath.transpose(rootNote, intervalName: intervalName),
                  let parsed = EarTrainingMusicXmlPitchMath.parseNote(transposedRoot, requireOctave: false) else {
                continue
            }
            rootStepEl.stringValue = EarTrainingMusicXmlPitchMath.letterNames[parsed.step]
            for child in rootEl.elements(forName: "root-alter") {
                rootEl.removeChild(child)
            }
            if parsed.alt != 0 {
                let alterEl = XMLElement(name: "root-alter")
                alterEl.stringValue = String(parsed.alt)
                rootEl.addChild(alterEl)
            }
        }

        for keyEl in doc.elements(forName: "key") {
            if let fifthsEl = keyEl.elements(forName: "fifths").first {
                fifthsEl.stringValue = String(targetFifths)
            }
        }

        return doc.xmlString(options: [.nodeCompactEmptyElement])
    }

    private static func normalizeToPreferredKey(_ key: String) -> String {
        if preferredKeysByChroma.contains(key) { return key }
        if let fifths = keyNameToFifths[key] {
            return preferredKeyName(fifths: fifths)
        }
        return key
    }

    private static func chromaForKey(_ key: String) -> Int? {
        let semitones: [String: Int] = [
            "C": 0, "B#": 0, "Db": 1, "C#": 1, "D": 2, "Eb": 3, "D#": 3, "E": 4, "Fb": 4,
            "F": 5, "E#": 5, "Gb": 6, "F#": 6, "G": 7, "Ab": 8, "G#": 8, "A": 9, "Bb": 10,
            "A#": 10, "B": 11, "Cb": 11,
        ]
        return semitones[key]
    }

    private static func targetKeyFromTransposition(originalKeyName: String, semitones: Int) -> String {
        let originalFifths = keyNameToFifths[originalKeyName] ?? 0
        let normalized = ((semitones % 12) + 12) % 12
        let fifthsChange = semitoneToFifthsChange[normalized] ?? 0
        var targetFifths = originalFifths + fifthsChange
        while targetFifths > 6 { targetFifths -= 12 }
        while targetFifths < -6 { targetFifths += 12 }
        if targetFifths == -7 { targetFifths = 5 }
        if targetFifths == 7 { targetFifths = -5 }
        return fifthsToKeyName[targetFifths] ?? "C"
    }

    private static func intervalBetweenKeys(from: String, to: String) -> String {
        guard let fromChroma = chromaForKey(normalizeToPreferredKey(from)),
              let toChroma = chromaForKey(normalizeToPreferredKey(to)) else {
            return "1P"
        }
        let semitones = ((toChroma - fromChroma) % 12 + 12) % 12
        return EarTrainingMusicXmlPitchMath.intervalName(fromSemitoneOffset: semitones) ?? "1P"
    }

    private static func pitchToNote(step: String, alter: Int, octave: Int) -> String {
        var accidental = ""
        if alter > 0 {
            accidental = String(repeating: "#", count: alter)
        } else if alter < 0 {
            accidental = String(repeating: "b", count: -alter)
        }
        return "\(step.uppercased())\(accidental)\(octave)"
    }

    private static func adjustNoteToKeyScale(_ noteName: String, targetKey: String) -> String {
        let scaleNotes = scaleMap[normalizeToPreferredKey(targetKey)] ?? scaleMap["C"] ?? ["C"]
        guard let chroma = chromaForSpelledNote(noteName) else { return noteName }
        for scaleNote in scaleNotes {
            if chromaForSpelledNote(scaleNote) == chroma {
                return scaleNote
            }
        }
        return noteName
    }

    private static func chromaForSpelledNote(_ noteName: String) -> Int? {
        guard let parsed = EarTrainingMusicXmlPitchMath.parseNote(noteName, requireOctave: false) else { return nil }
        let natural = [0, 2, 4, 5, 7, 9, 11][parsed.step % 7]
        return ((natural + parsed.alt) % 12 + 12) % 12
    }

    private static func applyNoteToPitch(
        _ noteStr: String,
        pitchEl: XMLElement,
        noteEl: XMLElement,
        targetKey: String,
    ) {
        guard let parsed = EarTrainingMusicXmlPitchMath.parseNote(noteStr, requireOctave: true),
              let octave = parsed.oct else { return }

        let noteWithoutOct = EarTrainingMusicXmlPitchMath.spellNote(step: parsed.step, alt: parsed.alt, oct: nil)
        let adjusted = adjustNoteToKeyScale(noteWithoutOct, targetKey: targetKey)
        guard let adjustedParsed = EarTrainingMusicXmlPitchMath.parseNote(adjusted, requireOctave: false) else { return }

        for child in pitchEl.children ?? [] {
            pitchEl.removeChild(child)
        }
        let stepEl = XMLElement(name: "step")
        stepEl.stringValue = EarTrainingMusicXmlPitchMath.letterNames[adjustedParsed.step]
        pitchEl.addChild(stepEl)
        if adjustedParsed.alt != 0 {
            let alterEl = XMLElement(name: "alter")
            alterEl.stringValue = String(adjustedParsed.alt)
            pitchEl.addChild(alterEl)
        }
        let octaveEl = XMLElement(name: "octave")
        octaveEl.stringValue = String(octave)
        pitchEl.addChild(octaveEl)

        for child in noteEl.elements(forName: "accidental") {
            noteEl.removeChild(child)
        }
    }
}

// MARK: - Pitch math（Survival `TonalMini` と同等の最小移植）

private enum EarTrainingMusicXmlPitchMath {
    static let letterNames = ["C", "D", "E", "F", "G", "A", "B"]

    private static let fifthsSteps: [Int] = [0, 2, 4, -1, 1, 3, 5]
    private static let stepsToFifthsUnaltered: [Int] = [3, 0, 4, 1, 5, 2, 6]
    private static let stepsToOctOffset: [Int] = [0, 1, 2, -1, 0, 1, 2]

    private static let semitoneToIntervalName: [Int: String] = [
        0: "1P", 1: "2m", 2: "2M", 3: "3m", 4: "3M", 5: "4P", 6: "5d", 7: "5P",
        8: "6m", 9: "6M", 10: "7m", 11: "7M", 12: "8P",
    ]

    private static let intervalCoordByName: [String: [Int]] = [
        "1P": [0, 0], "2m": [-5, 3], "2M": [2, -1], "3m": [-3, 2], "3M": [4, -2],
        "4P": [-1, 1], "5d": [-6, 4], "5P": [1, 0], "6m": [-4, 3], "6M": [3, -1],
        "7m": [-2, 2], "7M": [5, -2], "8P": [0, 1],
    ]

    struct ParsedPitch {
        let step: Int
        let alt: Int
        let oct: Int?
    }

    static func intervalName(fromSemitoneOffset offset: Int) -> String? {
        semitoneToIntervalName[offset]
    }

    static func parseNote(_ raw: String, requireOctave: Bool) -> ParsedPitch? {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let re = try? NSRegularExpression(pattern: #"^([A-Ga-g])(#{1,}|b{1,}|x{1,}|)(-?\d*)$"#),
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

    static func spellNote(step: Int, alt: Int, oct: Int?) -> String {
        let letter = letterNames[step]
        let acc: String
        if alt < 0 {
            acc = String(repeating: "b", count: -alt)
        } else if alt > 0 {
            acc = String(repeating: "#", count: alt)
        } else {
            acc = ""
        }
        if let oct {
            return "\(letter)\(acc)\(oct)"
        }
        return "\(letter)\(acc)"
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

    private static func unalteredFifthsIndex(_ f: Int) -> Int {
        var i = (f + 1) % 7
        if i < 0 { i += 7 }
        return i
    }
}

private extension XMLDocument {
    func elements(forName localName: String) -> [XMLElement] {
        var results: [XMLElement] = []
        collectElements(localName: localName, in: rootElement(), into: &results)
        return results
    }

    private func collectElements(localName: String, in node: XMLElement?, into results: inout [XMLElement]) {
        guard let node else { return }
        if node.name == localName || node.localName == localName {
            results.append(node)
        }
        for child in node.children ?? [] {
            if let el = child as? XMLElement {
                collectElements(localName: localName, in: el, into: &results)
            }
        }
    }
}

private extension XMLElement {
    func elements(forName localName: String) -> [XMLElement] {
        var results: [XMLElement] = []
        for child in children ?? [] {
            guard let el = child as? XMLElement else { continue }
            if el.name == localName || el.localName == localName {
                results.append(el)
            }
            results.append(contentsOf: el.elements(forName: localName))
        }
        return results
    }
}
