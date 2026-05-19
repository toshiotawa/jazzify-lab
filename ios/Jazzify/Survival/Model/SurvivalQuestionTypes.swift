import Foundation

/// Web `survivalQuestionTypes.ts` 相当: サバイバル random の度数・テンション出題。
enum SurvivalQuestionTypes {
    enum Kind: String {
        case interval
        case tension
    }

    enum Direction: String {
        case up
        case down
    }

    struct ParsedId {
        let kind: Kind
        let root: String
        let intervalName: String
        let direction: Direction
    }

    struct Resolved {
        let id: String
        let kind: Kind
        let root: String
        let intervalName: String
        let direction: Direction
        let midi: Int
        let pitchClass: Int
        let noteName: String
        let typeDisplayNameEn: String
        let typeDisplayNameJa: String
    }

    private struct TensionDef {
        let name: String
        let tonalInterval: String
        let staffInterval: String
        let labelEn: String
        let labelJa: String
    }

    private static let intervalNameToTonal: [String: String] = [
        "m2": "2m", "M2": "2M", "m3": "3m", "M3": "3M", "P4": "4P",
        "aug4": "4A", "dim5": "5d", "P5": "5P", "aug5": "5A",
        "m6": "6m", "M6": "6M", "m7": "7m", "M7": "7M",
    ]

    private static let intervalLabelJa: [String: String] = [
        "m2": "短2度", "M2": "長2度", "m3": "短3度", "M3": "長3度", "P4": "完全4度",
        "aug4": "増4度", "dim5": "減5度", "P5": "完全5度", "aug5": "増5度",
        "m6": "短6度", "M6": "長6度", "m7": "短7度", "M7": "長7度",
    ]

    private static let intervalLabelEn: [String: String] = [
        "m2": "Minor 2nd", "M2": "Major 2nd", "m3": "Minor 3rd", "M3": "Major 3rd",
        "P4": "Perfect 4th", "aug4": "Augmented 4th", "dim5": "Diminished 5th",
        "P5": "Perfect 5th", "aug5": "Augmented 5th", "m6": "Minor 6th", "M6": "Major 6th",
        "m7": "Minor 7th", "M7": "Major 7th",
    ]

    private static let tensions: [TensionDef] = [
        TensionDef(name: "9", tonalInterval: "9M", staffInterval: "2M", labelEn: "9th", labelJa: "9th"),
        TensionDef(name: "b9", tonalInterval: "9m", staffInterval: "2m", labelEn: "b9th", labelJa: "b9th"),
        TensionDef(name: "#9", tonalInterval: "9A", staffInterval: "3m", labelEn: "#9th", labelJa: "#9th"),
        TensionDef(name: "11", tonalInterval: "11P", staffInterval: "4P", labelEn: "11th", labelJa: "11th"),
        TensionDef(name: "#11", tonalInterval: "11A", staffInterval: "4A", labelEn: "#11th", labelJa: "#11th"),
        TensionDef(name: "13", tonalInterval: "13M", staffInterval: "6M", labelEn: "13th", labelJa: "13th"),
        TensionDef(name: "b13", tonalInterval: "13m", staffInterval: "6m", labelEn: "b13th", labelJa: "b13th"),
    ]

    private static let tensionByName: [String: TensionDef] = Dictionary(
        uniqueKeysWithValues: tensions.map { ($0.name, $0) }
    )

    static func buildAllowed(roots: [String], suffix: String) -> [String]? {
        if let spec = parseSuffix(suffix) {
            switch spec.kind {
            case .interval:
                return roots.map { "interval:\($0):\(spec.intervalName):\(spec.direction.rawValue)" }
            case .tension:
                return roots.map { "tension:\($0):\(spec.intervalName):up" }
            }
        }
        return nil
    }

    static func parseId(_ id: String) -> ParsedId? {
        let trimmed = id.trimmingCharacters(in: .whitespacesAndNewlines)
        if let m = matchGroups(#"^interval:([^:]+):([^:]+):(up|down)$"#, in: trimmed), m.count == 3 {
            let root = m[0]
            let name = m[1]
            let dirRaw = m[2]
            guard intervalNameToTonal[name] != nil, let dir = Direction(rawValue: dirRaw) else { return nil }
            return ParsedId(kind: .interval, root: root, intervalName: name, direction: dir)
        }
        if let m = matchGroups(#"^tension:([^:]+):([^:]+):up$"#, in: trimmed), m.count == 2 {
            let root = m[0]
            let name = m[1]
            guard tensionByName[name] != nil else { return nil }
            return ParsedId(kind: .tension, root: root, intervalName: name, direction: .up)
        }
        return nil
    }

    static func resolve(id: String, octave: Int = 4) -> Resolved? {
        guard let parsed = parseId(id) else { return nil }
        let rootSpelled = parsed.root.replacingOccurrences(of: "x", with: "##")

        switch parsed.kind {
        case .interval:
            guard let tonal = intervalNameToTonal[parsed.intervalName] else { return nil }
            let intervalToken = parsed.direction == .down ? "-\(tonal)" : tonal
            guard let noteWithOct = SurvivalRandomHintStaff.transpose(
                noteName: "\(rootSpelled)\(octave)",
                intervalName: intervalToken
            ) else {
                return nil
            }
            guard let midi = SurvivalRandomHintStaff.midi(ofSpelledNote: noteWithOct) else { return nil }
            let noteName = noteWithOct.replacingOccurrences(of: #"\d+$"#, with: "", options: .regularExpression)
                .replacingOccurrences(of: "##", with: "x")
            return makeResolved(
                id: id, parsed: parsed, midi: midi, noteName: noteName
            )
        case .tension:
            guard let def = tensionByName[parsed.intervalName],
                  let noteWithOct = SurvivalRandomHintStaff.transpose(noteName: "\(rootSpelled)\(octave)", intervalName: def.tonalInterval),
                  let midi = SurvivalRandomHintStaff.midi(ofSpelledNote: noteWithOct) else {
                return nil
            }
            let noteName = noteWithOct.replacingOccurrences(of: #"\d+$"#, with: "", options: .regularExpression)
                .replacingOccurrences(of: "##", with: "x")
            return makeResolved(
                id: id, parsed: parsed, midi: midi, noteName: noteName
            )
        }
    }

    static func staffVoicingNames(forChordId chordId: String, octave: Int = 4) -> [String]? {
        guard let parsed = parseId(chordId), let resolved = resolve(id: chordId, octave: octave) else { return nil }

        switch parsed.kind {
        case .interval:
            return ["\(resolved.noteName)\(octave)"]
        case .tension:
            guard let def = tensionByName[parsed.intervalName] else { return nil }
            let staffMidi = resolved.midi - 12
            let staffOct = staffMidi / 12 - 1
            let rootSpelled = parsed.root.replacingOccurrences(of: "x", with: "##")
            guard var candidate = SurvivalRandomHintStaff.transpose(
                noteName: "\(rootSpelled)\(staffOct)",
                intervalName: def.staffInterval
            ) else { return nil }
            candidate = alignSpelledNoteToMidi(candidate, targetMidi: staffMidi) ?? candidate
            return [candidate.replacingOccurrences(of: "##", with: "x")]
        }
    }

    // MARK: - Private

    private static func parseSuffix(_ suffix: String) -> ParsedId? {
        if let m = matchGroups(#"^interval:([^:]+):(up|down)$"#, in: suffix), m.count == 2 {
            let name = m[0]
            let dirRaw = m[1]
            guard intervalNameToTonal[name] != nil, let dir = Direction(rawValue: dirRaw) else { return nil }
            return ParsedId(kind: .interval, root: "", intervalName: name, direction: dir)
        }
        if let m = matchGroups(#"^tension:([^:]+):up$"#, in: suffix), m.count == 1 {
            let name = m[0]
            guard tensionByName[name] != nil else { return nil }
            return ParsedId(kind: .tension, root: "", intervalName: name, direction: .up)
        }
        return nil
    }

    private static func makeResolved(id: String, parsed: ParsedId, midi: Int, noteName: String) -> Resolved {
        let pc = ((midi % 12) + 12) % 12
        let en = typeLabel(kind: parsed.kind, name: parsed.intervalName, direction: parsed.direction, langEn: true)
        let ja = typeLabel(kind: parsed.kind, name: parsed.intervalName, direction: parsed.direction, langEn: false)
        return Resolved(
            id: id,
            kind: parsed.kind,
            root: parsed.root,
            intervalName: parsed.intervalName,
            direction: parsed.direction,
            midi: midi,
            pitchClass: pc,
            noteName: noteName,
            typeDisplayNameEn: en,
            typeDisplayNameJa: ja
        )
    }

    private static func typeLabel(kind: Kind, name: String, direction: Direction, langEn: Bool) -> String {
        if kind == .tension {
            let def = tensionByName[name]
            let base = langEn ? (def?.labelEn ?? name) : (def?.labelJa ?? name)
            return langEn ? "\(base) Up" : "\(base)上"
        }
        let base = langEn ? (intervalLabelEn[name] ?? name) : (intervalLabelJa[name] ?? name)
        if langEn {
            return "\(base) \(direction == .up ? "Up" : "Down")"
        }
        return "\(base)\(direction == .up ? "上" : "下")"
    }

    private static func matchGroups(_ pattern: String, in text: String) -> [String]? {
        guard let re = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(text.startIndex..., in: text)
        guard let m = re.firstMatch(in: text, range: range), m.numberOfRanges > 1 else { return nil }
        var groups: [String] = []
        for i in 1 ..< m.numberOfRanges {
            guard let r = Range(m.range(at: i), in: text) else { return nil }
            groups.append(String(text[r]))
        }
        return groups
    }

    private static func alignSpelledNoteToMidi(_ spelled: String, targetMidi: Int) -> String? {
        var candidate = spelled
        var midi = SurvivalRandomHintStaff.midi(ofSpelledNote: candidate)
        while let m = midi, m < targetMidi,
              let next = SurvivalRandomHintStaff.transpose(noteName: candidate, intervalName: "8P") {
            candidate = next
            midi = SurvivalRandomHintStaff.midi(ofSpelledNote: candidate)
        }
        while let m = midi, m > targetMidi,
              let next = SurvivalRandomHintStaff.transpose(noteName: candidate, intervalName: "-8P") {
            candidate = next
            midi = SurvivalRandomHintStaff.midi(ofSpelledNote: candidate)
        }
        guard let m = midi, m == targetMidi else { return nil }
        return candidate
    }
}
