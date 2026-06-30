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

    /// 練習移調オフセットを ±6 の符号付き最短経路へ揃える（例: +10 → -2）。
    static func normalizeSignedSemitoneOffset(_ semitones: Int) -> Int {
        if semitones >= practiceTransposeMin && semitones <= practiceTransposeMax {
            return semitones
        }
        if semitones < practiceTransposeMin {
            return practiceTransposeMin
        }
        var wrapped = semitones % 12
        if wrapped < 0 {
            wrapped += 12
        }
        if wrapped > 6 {
            wrapped -= 12
        }
        return max(practiceTransposeMin, min(practiceTransposeMax, wrapped))
    }

    static func clampPracticeTransposeOffset(_ offset: Int) -> Int {
        normalizeSignedSemitoneOffset(offset)
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

    /// DB 由来のコードネーム表示ラベルを練習移調する（スラッシュ・複数ラベル対応）。
    static func transposeChordLabel(_ label: String, semitones: Int) -> String {
        let clamped = clampPracticeTransposeOffset(semitones)
        if clamped == 0 { return label }
        if label.contains(" / ") {
            return label
                .components(separatedBy: " / ")
                .map { transposeSingleChordLabel($0, semitones: clamped) }
                .joined(separator: " / ")
        }
        return transposeSingleChordLabel(label, semitones: clamped)
    }

    static func transposeMusicXml(_ xmlString: String, semitones: Int) -> String {
        if semitones == 0 { return xmlString }
        guard let root = ChordOsmdXmlParser.parse(xmlString) else {
            return xmlString
        }

        let originalFifths = readKeyFifths(fromMusicXml: xmlString)
        let originalKeyName = fifthsToKeyName[originalFifths] ?? "C"
        let normalizedOriginal = normalizeToPreferredKey(originalKeyName)
        let rawTarget = targetKeyFromTransposition(originalKeyName: normalizedOriginal, semitones: semitones)
        let targetKey = normalizeToPreferredKey(rawTarget)
        let targetFifths = keyNameToFifths[normalizeToPreferredKey(targetKey)] ?? keyNameToFifths[targetKey] ?? 0
        guard let intervalCoord = EarTrainingMusicXmlPitchMath.intervalCoord(
            fromKey: normalizedOriginal,
            toKey: targetKey,
        ) else {
            return xmlString
        }
        let intervalSemitones = EarTrainingMusicXmlPitchMath.semitoneDistance(
            fromKey: normalizedOriginal,
            toKey: targetKey,
        )
        let octaveAdjust = Int((Double(semitones - intervalSemitones) / 12.0).rounded())

        for noteEl in allElements(named: "note", in: root) {
            if directChild(noteEl, localName: "rest") != nil { continue }
            guard let pitchEl = directChild(noteEl, localName: "pitch"),
                  let stepText = text(in: pitchEl, localName: "step"),
                  let octaveText = text(in: pitchEl, localName: "octave"),
                  let octave = Int(octaveText) else { continue }

            let alter = Int(text(in: pitchEl, localName: "alter") ?? "0") ?? 0
            let noteStr = pitchToNote(step: stepText, alter: alter, octave: octave)
            guard var transposed = EarTrainingMusicXmlPitchMath.transposeByCoord(
                noteName: noteStr,
                intervalCoord: intervalCoord,
            ) else {
                continue
            }
            if octaveAdjust != 0 {
                let octInterval = "\(abs(octaveAdjust) * 8)P"
                if octaveAdjust > 0 {
                    transposed = EarTrainingMusicXmlPitchMath.transpose(
                        noteName: transposed,
                        intervalName: octInterval,
                    ) ?? transposed
                } else {
                    transposed = EarTrainingMusicXmlPitchMath.transpose(
                        noteName: transposed,
                        intervalName: "-\(octInterval)",
                    ) ?? transposed
                }
            }
            applyNoteToPitch(transposed, pitchEl: pitchEl, noteEl: noteEl, targetKey: targetKey)
        }

        for harmonyEl in allElements(named: "harmony", in: root) {
            transposeHarmonyPitch(
                in: harmonyEl,
                parentLocalName: "root",
                stepLocalName: "root-step",
                alterLocalName: "root-alter",
                intervalCoord: intervalCoord,
                octaveAdjust: octaveAdjust,
                targetKey: targetKey,
            )
            transposeHarmonyPitch(
                in: harmonyEl,
                parentLocalName: "bass",
                stepLocalName: "bass-step",
                alterLocalName: "bass-alter",
                intervalCoord: intervalCoord,
                octaveAdjust: octaveAdjust,
                targetKey: targetKey,
            )
        }

        for keyEl in allElements(named: "key", in: root) {
            if let fifthsEl = directChild(keyEl, localName: "fifths") {
                setText(in: fifthsEl, text: String(targetFifths))
            }
        }

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + ChordOsmdXmlSerializer.stringify(root)
    }

    private static func transposeHarmonyPitch(
        in harmonyEl: ChordOsmdXmlElement,
        parentLocalName: String,
        stepLocalName: String,
        alterLocalName: String,
        intervalCoord: [Int],
        octaveAdjust: Int,
        targetKey: String,
    ) {
        guard let parentEl = directChild(harmonyEl, localName: parentLocalName),
              let stepEl = directChild(parentEl, localName: stepLocalName),
              let step = text(in: parentEl, localName: stepLocalName) else { return }
        let alter = Int(text(in: parentEl, localName: alterLocalName) ?? "0") ?? 0
        var note = step
        if alter > 0 {
            note += String(repeating: "#", count: alter)
        } else if alter < 0 {
            note += String(repeating: "b", count: -alter)
        }
        guard var transposed = EarTrainingMusicXmlPitchMath.transposeByCoord(
            noteName: note,
            intervalCoord: intervalCoord,
        ) else {
            return
        }
        if octaveAdjust != 0 {
            let octInterval = "\(abs(octaveAdjust) * 8)P"
            if octaveAdjust > 0 {
                transposed = EarTrainingMusicXmlPitchMath.transpose(
                    noteName: transposed,
                    intervalName: octInterval,
                ) ?? transposed
            } else {
                transposed = EarTrainingMusicXmlPitchMath.transpose(
                    noteName: transposed,
                    intervalName: "-\(octInterval)",
                ) ?? transposed
            }
        }
        guard let parsed = EarTrainingMusicXmlPitchMath.parseNote(transposed, requireOctave: false) else {
            return
        }
        let noteWithoutOct = EarTrainingMusicXmlPitchMath.spellNote(
            step: parsed.step,
            alt: parsed.alt,
            oct: nil,
        )
        let adjusted = adjustNoteToKeyScale(noteWithoutOct, targetKey: targetKey)
        guard let adjustedParsed = EarTrainingMusicXmlPitchMath.parseNote(adjusted, requireOctave: false) else {
            return
        }
        setText(in: stepEl, text: EarTrainingMusicXmlPitchMath.letterNames[adjustedParsed.step])
        parentEl.children.removeAll { child in
            if case let .element(el) = child, el.name == alterLocalName {
                return true
            }
            return false
        }
        if adjustedParsed.alt != 0 {
            appendElement(named: alterLocalName, text: String(adjustedParsed.alt), to: parentEl)
        }
    }

    private static func transposeSingleChordLabel(_ label: String, semitones: Int) -> String {
        let trimmed = label.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty || trimmed == "—" { return trimmed }

        if trimmed.contains("/"), !trimmed.contains(" / ") {
            let parts = trimmed.split(separator: "/", maxSplits: 1, omittingEmptySubsequences: false)
                .map(String.init)
            if parts.count == 2 {
                let bass = parts[1].trimmingCharacters(in: .whitespacesAndNewlines)
                if isNoteOnlyLabel(bass) {
                    let numerator = transposeSingleChordLabel(
                        parts[0].trimmingCharacters(in: .whitespacesAndNewlines),
                        semitones: semitones
                    )
                    let transposedBass = transposeRootNoteName(bass, semitones: semitones)
                    return "\(numerator)/\(transposedBass)"
                }
            }
        }

        guard let re = try? NSRegularExpression(pattern: #"^([A-Ga-g](?:#{1,2}|b{1,2}|x)?)(.*)$"#),
              let match = re.firstMatch(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed)),
              match.numberOfRanges >= 3,
              let rootRange = Range(match.range(at: 1), in: trimmed),
              let suffixRange = Range(match.range(at: 2), in: trimmed) else {
            return trimmed
        }
        let root = String(trimmed[rootRange])
        let suffix = String(trimmed[suffixRange])
        return "\(transposeRootNoteName(root, semitones: semitones))\(suffix)"
    }

    private static func isNoteOnlyLabel(_ text: String) -> Bool {
        text.range(of: #"^[A-Ga-g](?:#{1,2}|b{1,2}|x)?$"#, options: .regularExpression) != nil
    }

    private static func transposeRootNoteName(_ root: String, semitones: Int) -> String {
        let intervalName = signedIntervalName(fromSemitones: semitones)
        guard let transposed = EarTrainingMusicXmlPitchMath.transpose(
            noteName: root,
            intervalName: intervalName
        ),
              let parsed = EarTrainingMusicXmlPitchMath.parseNote(transposed, requireOctave: false) else {
            return root
        }
        return EarTrainingMusicXmlPitchMath.spellNote(step: parsed.step, alt: parsed.alt, oct: nil)
    }

    private static func allElements(named target: String, in root: ChordOsmdXmlElement) -> [ChordOsmdXmlElement] {
        var out: [ChordOsmdXmlElement] = []
        func visit(_ el: ChordOsmdXmlElement) {
            if el.name == target {
                out.append(el)
            }
            for ch in el.children {
                if case let .element(child) = ch {
                    visit(child)
                }
            }
        }
        visit(root)
        return out
    }

    private static func directChild(_ parent: ChordOsmdXmlElement, localName: String) -> ChordOsmdXmlElement? {
        for ch in parent.children {
            if case let .element(el) = ch, el.name == localName {
                return el
            }
        }
        return nil
    }

    private static func text(in parent: ChordOsmdXmlElement, localName: String) -> String? {
        guard let el = directChild(parent, localName: localName) else { return nil }
        for ch in el.children {
            if case let .text(t) = ch {
                let trimmed = t.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty { return trimmed }
            }
        }
        return nil
    }

    private static func setText(in element: ChordOsmdXmlElement, text: String) {
        element.children = [.text(text)]
    }

    private static func appendElement(named name: String, text: String, to parent: ChordOsmdXmlElement) {
        let child = ChordOsmdXmlElement(name: name)
        child.children.append(.text(text))
        parent.children.append(.element(child))
    }

    private static func normalizeToPreferredKey(_ key: String) -> String {
        if preferredKeysByChroma.contains(key) { return key }
        guard let chroma = chromaForKey(key) else { return key }
        return preferredKeysByChroma[chroma]
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

    private static func signedIntervalName(fromSemitones semitones: Int) -> String {
        let normalized = normalizeSignedSemitoneOffset(semitones)
        if normalized == 0 { return "1P" }
        let absOffset = abs(normalized)
        guard let base = EarTrainingMusicXmlPitchMath.intervalName(fromSemitoneOffset: absOffset) else {
            return "1P"
        }
        return normalized < 0 ? "-\(base)" : base
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
        pitchEl: ChordOsmdXmlElement,
        noteEl: ChordOsmdXmlElement,
        targetKey: String,
    ) {
        guard let parsed = EarTrainingMusicXmlPitchMath.parseNote(noteStr, requireOctave: true),
              let octave = parsed.oct else { return }

        let noteWithoutOct = EarTrainingMusicXmlPitchMath.spellNote(step: parsed.step, alt: parsed.alt, oct: nil)
        let adjusted = adjustNoteToKeyScale(noteWithoutOct, targetKey: targetKey)
        guard let adjustedParsed = EarTrainingMusicXmlPitchMath.parseNote(adjusted, requireOctave: false) else { return }

        let targetFifths = keyNameToFifths[normalizeToPreferredKey(targetKey)] ?? keyNameToFifths[targetKey] ?? 0
        let stepLetter = EarTrainingMusicXmlPitchMath.letterNames[adjustedParsed.step]
        let keyAlterForStep = keySignatureAlter(step: stepLetter, keyFifths: targetFifths)
        let needsExplicitNatural = adjustedParsed.alt == 0 && keyAlterForStep != 0

        pitchEl.children.removeAll()
        appendElement(
            named: "step",
            text: stepLetter,
            to: pitchEl
        )
        if adjustedParsed.alt != 0 {
            appendElement(named: "alter", text: String(adjustedParsed.alt), to: pitchEl)
        } else if needsExplicitNatural {
            appendElement(named: "alter", text: "0", to: pitchEl)
        }
        appendElement(named: "octave", text: String(octave), to: pitchEl)

        noteEl.children.removeAll { child in
            if case let .element(el) = child, el.name == "accidental" {
                return true
            }
            return false
        }
        if needsExplicitNatural {
            appendElement(named: "accidental", text: "natural", to: noteEl)
        }
    }

    private static func keySignatureAlter(step: String, keyFifths: Int) -> Int {
        let fifths = max(-7, min(7, keyFifths))
        let sharpSteps = ["F", "C", "G", "D", "A", "E", "B"]
        let flatSteps = ["B", "E", "A", "D", "G", "C", "F"]
        if fifths > 0 {
            for index in 0..<fifths where index < sharpSteps.count {
                if sharpSteps[index] == step {
                    return 1
                }
            }
            return 0
        }
        if fifths < 0 {
            let flatCount = abs(fifths)
            for index in 0..<flatCount where index < flatSteps.count {
                if flatSteps[index] == step {
                    return -1
                }
            }
            return 0
        }
        return 0
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

    static func intervalCoord(fromKey: String, toKey: String) -> [Int]? {
        guard let from = noteNameToCoord(fromKey + "4"),
              let to = noteNameToCoord(toKey + "4") else { return nil }
        return [to[0] - from[0], to[1] - from[1]]
    }

    static func transposeByCoord(noteName: String, intervalCoord: [Int]) -> String? {
        guard let nc = noteNameToCoord(noteName), intervalCoord.count == 2 else { return nil }
        return coordToNoteName([nc[0] + intervalCoord[0], nc[1] + intervalCoord[1]])
    }

    static func semitoneDistance(fromKey: String, toKey: String) -> Int {
        guard let intervalCoord = intervalCoord(fromKey: fromKey, toKey: toKey),
              let transposedRoot = transposeByCoord(noteName: fromKey + "4", intervalCoord: intervalCoord),
              let fromMidi = midiNumber(noteName: fromKey + "4"),
              let toMidi = midiNumber(noteName: transposedRoot) else {
            return 0
        }
        return toMidi - fromMidi
    }

    static func midiNumber(noteName: String) -> Int? {
        guard let parsed = parseNote(noteName, requireOctave: true), let oct = parsed.oct else { return nil }
        let natural = [0, 2, 4, 5, 7, 9, 11][parsed.step % 7]
        let chroma = ((natural + parsed.alt) % 12 + 12) % 12
        return (oct + 1) * 12 + chroma
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
        guard let p = parseNote(name, requireOctave: false) else { return nil }
        let oct = p.oct ?? 4
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
