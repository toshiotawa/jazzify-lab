import Foundation

/// Web `simplifyMusicXmlEnharmonics` と同等の MusicXML 再綴り。
enum EarTrainingMusicXmlEnharmonicSimplifier {
    private struct SimplifiedSpelledPitch {
        let step: String
        let alter: Int
        let octaveAdjust: Int
    }

    private static let accidentalSimplifyMap: [String: SimplifiedSpelledPitch] = [
        "B1": .init(step: "C", alter: 0, octaveAdjust: 1),
        "E1": .init(step: "F", alter: 0, octaveAdjust: 0),
        "C-1": .init(step: "B", alter: 0, octaveAdjust: -1),
        "F-1": .init(step: "E", alter: 0, octaveAdjust: 0),
        "A2": .init(step: "B", alter: 0, octaveAdjust: 0),
        "B2": .init(step: "C", alter: 1, octaveAdjust: 1),
        "C2": .init(step: "D", alter: 0, octaveAdjust: 0),
        "D2": .init(step: "E", alter: 0, octaveAdjust: 0),
        "E2": .init(step: "F", alter: 1, octaveAdjust: 0),
        "F2": .init(step: "G", alter: 0, octaveAdjust: 0),
        "G2": .init(step: "A", alter: 0, octaveAdjust: 0),
        "A-2": .init(step: "G", alter: 0, octaveAdjust: 0),
        "B-2": .init(step: "A", alter: 0, octaveAdjust: 0),
        "C-2": .init(step: "B", alter: -1, octaveAdjust: -1),
        "D-2": .init(step: "C", alter: 0, octaveAdjust: 0),
        "E-2": .init(step: "D", alter: 0, octaveAdjust: 0),
        "F-2": .init(step: "E", alter: -1, octaveAdjust: 0),
        "G-2": .init(step: "F", alter: 0, octaveAdjust: 0),
    ]

    static func simplifySpelledPitch(step: String, alter: Int, octave: Int) -> (step: String, alter: Int, octave: Int)? {
        guard alter != 0, let simplified = accidentalSimplifyMap["\(step)\(alter)"] else {
            return nil
        }
        return (
            step: simplified.step,
            alter: simplified.alter,
            octave: octave + simplified.octaveAdjust
        )
    }

    static func simplifyMusicXml(_ xmlString: String) -> String {
        guard EnharmonicDisplayPreferences.load() else {
            return xmlString
        }
        guard let root = ChordOsmdXmlParser.parse(xmlString) else {
            return xmlString
        }

        let keyFifths = readKeyFifths(from: root)
        var changed = false

        for noteEl in allElements(named: "note", in: root) {
            if directChild(noteEl, localName: "rest") != nil {
                continue
            }
            guard let pitchEl = directChild(noteEl, localName: "pitch"),
                  let stepText = text(in: pitchEl, localName: "step"),
                  let octaveText = text(in: pitchEl, localName: "octave"),
                  let octave = Int(octaveText) else {
                continue
            }
            let alter = Int(text(in: pitchEl, localName: "alter") ?? "0") ?? 0
            guard alter != 0,
                  let simplified = simplifySpelledPitch(step: stepText, alter: alter, octave: octave) else {
                continue
            }

            let keyAlterForStep = keySignatureAlter(step: simplified.step, keyFifths: keyFifths)
            let needsExplicitNatural = simplified.alter == 0 && keyAlterForStep != 0

            if let stepEl = directChild(pitchEl, localName: "step") {
                setText(in: stepEl, text: simplified.step)
            }
            pitchEl.children.removeAll { child in
                if case let .element(el) = child, el.name == "alter" {
                    return true
                }
                return false
            }
            if simplified.alter != 0 {
                appendElement(named: "alter", text: String(simplified.alter), to: pitchEl)
            } else if needsExplicitNatural {
                appendElement(named: "alter", text: "0", to: pitchEl)
            }
            if let octaveEl = directChild(pitchEl, localName: "octave") {
                setText(in: octaveEl, text: String(simplified.octave))
            }

            noteEl.children.removeAll { child in
                if case let .element(el) = child, el.name == "accidental" {
                    return true
                }
                return false
            }
            if needsExplicitNatural {
                appendElement(named: "accidental", text: "natural", to: noteEl)
            }
            changed = true
        }

        for harmonyEl in allElements(named: "harmony", in: root) {
            if let rootEl = directChild(harmonyEl, localName: "root"),
               simplifyHarmonyPitch(in: rootEl, stepLocalName: "root-step", alterLocalName: "root-alter") {
                changed = true
            }
            if let bassEl = directChild(harmonyEl, localName: "bass"),
               simplifyHarmonyPitch(in: bassEl, stepLocalName: "bass-step", alterLocalName: "bass-alter") {
                changed = true
            }
        }

        guard changed else {
            return xmlString
        }
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + ChordOsmdXmlSerializer.stringify(root)
    }

    private static func simplifyHarmonyPitch(
        in parentEl: ChordOsmdXmlElement,
        stepLocalName: String,
        alterLocalName: String,
    ) -> Bool {
        guard let stepEl = directChild(parentEl, localName: stepLocalName),
              let step = text(in: parentEl, localName: stepLocalName) else {
            return false
        }
        let alter = Int(text(in: parentEl, localName: alterLocalName) ?? "0") ?? 0
        guard alter != 0,
              let simplified = simplifySpelledPitch(step: step, alter: alter, octave: 4) else {
            return false
        }

        setText(in: stepEl, text: simplified.step)
        parentEl.children.removeAll { child in
            if case let .element(el) = child, el.name == alterLocalName {
                return true
            }
            return false
        }
        if simplified.alter != 0 {
            appendElement(named: alterLocalName, text: String(simplified.alter), to: parentEl)
        }
        return true
    }

    private static func readKeyFifths(from root: ChordOsmdXmlElement) -> Int {
        for keyEl in allElements(named: "key", in: root) {
            if let fifthsText = text(in: keyEl, localName: "fifths"),
               let value = Int(fifthsText) {
                return max(-7, min(7, value))
            }
        }
        return 0
    }

    private static func allElements(named target: String, in root: ChordOsmdXmlElement) -> [ChordOsmdXmlElement] {
        var out: [ChordOsmdXmlElement] = []
        func visit(_ el: ChordOsmdXmlElement) {
            if el.name == target {
                out.append(el)
            }
            for child in el.children {
                if case let .element(childEl) = child {
                    visit(childEl)
                }
            }
        }
        visit(root)
        return out
    }

    private static func directChild(_ parent: ChordOsmdXmlElement, localName: String) -> ChordOsmdXmlElement? {
        for child in parent.children {
            if case let .element(el) = child, el.name == localName {
                return el
            }
        }
        return nil
    }

    private static func text(in parent: ChordOsmdXmlElement, localName: String) -> String? {
        guard let el = directChild(parent, localName: localName) else { return nil }
        for child in el.children {
            if case let .text(value) = child {
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    return trimmed
                }
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
