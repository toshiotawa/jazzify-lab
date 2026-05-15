import Foundation

/* Non-nested DOM: XMLParser 用。`XMLDocument` 系は iOS Swift から参照できないため。 */

private final class ChordOsmdXmlElement {
    let name: String
    var attributes: [(name: String, value: String)] = []
    var children: [ChordOsmdXmlChild] = []

    init(name: String) {
        self.name = name
    }
}

private enum ChordOsmdXmlChild {
    case text(String)
    case element(ChordOsmdXmlElement)

    func copyForAppend() -> ChordOsmdXmlChild {
        switch self {
        case let .text(t):
            return .text(t)
        case let .element(el):
            return .element(deepCopyElement(el))
        }
    }
}

private func deepCopyElement(_ source: ChordOsmdXmlElement) -> ChordOsmdXmlElement {
    let c = ChordOsmdXmlElement(name: source.name)
    c.attributes = source.attributes
    c.children = source.children.map { ch in
        switch ch {
        case let .text(t):
            return .text(t)
        case let .element(el):
            return .element(deepCopyElement(el))
        }
    }
    return c
}

/// Web の `normalizeChordOsmdMusicXml` と同等。
enum EarTrainingChordOsmdMusicXmlNormalizer {
    private static let timingEpsilon = 0.0005

    private struct Timing {
        var divisions: Int
        var beats: Int
        var beatType: Int
    }

    private struct TimedStaffNote {
        var start: Double
        var duration: Double
        var staff: Int
        let note: ChordOsmdXmlElement
    }

    private struct TimedMarker {
        var time: Double
        let node: ChordOsmdXmlChild
    }

    static func normalizeChordOsmdMusicXml(_ xmlText: String) -> String {
        guard let root = ChordOsmdXmlParser.parse(xmlText) else {
            return xmlText
        }

        var changed = false
        var timing = Timing(divisions: 1, beats: 4, beatType: 4)

        for measure in allElements(named: "measure", in: root) {
            timing = readMeasureTiming(measure, previous: timing)
            if normalizeMeasureToExplicitTwoStaffVoices(measure: measure, timing: timing) {
                changed = true
            }
        }

        guard changed else { return xmlText }
        // `XMLParser` は XML 宣言と DOCTYPE を保持せず、serializer も root 以下しか出力しない。
        // WebKit の DOMParser は宣言の無い文字列を `invalid document` として弾くため、`<?xml ... ?>` を再付与する。
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + ChordOsmdXmlSerializer.stringify(root)
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

    private static func readMeasureTiming(_ measure: ChordOsmdXmlElement, previous: Timing) -> Timing {
        guard let attributes = directChild(measure, localName: "attributes") else {
            return previous
        }
        let divisions = parsePositiveInt(text(in: attributes, localName: "divisions")) ?? previous.divisions
        let timeEl = directChild(attributes, localName: "time")
        let beats = timeEl.flatMap { parsePositiveInt(text(in: $0, localName: "beats")) } ?? previous.beats
        let beatType = timeEl.flatMap { parsePositiveInt(text(in: $0, localName: "beat-type")) } ?? previous.beatType
        return Timing(divisions: divisions, beats: beats, beatType: beatType)
    }

    private static func normalizeMeasureToExplicitTwoStaffVoices(measure: ChordOsmdXmlElement, timing: Timing) -> Bool {
        if containsChildElement(named: "backup", in: measure) { return false }
        if containsChildElement(named: "forward", in: measure) { return false }

        var timedNotes: [TimedStaffNote] = []
        var markers: [TimedMarker] = []
        var time = 0.0
        var hasUnsupportedNote = false

        for ch in measure.children {
            if case let .element(child) = ch, child.name == "note" {
                if directChild(child, localName: "chord") != nil || directChild(child, localName: "grace") != nil {
                    hasUnsupportedNote = true
                    break
                }
                guard let duration = parsePositiveInt(text(in: child, localName: "duration")).map(Double.init),
                      let staff = parseStaffNumber(text(in: child, localName: "staff"))
                else {
                    hasUnsupportedNote = true
                    break
                }

                timedNotes.append(TimedStaffNote(start: time, duration: duration, staff: staff, note: child))
                time += duration
            } else {
                if case let .element(node) = ch {
                    markers.append(TimedMarker(time: time, node: .element(deepCopyElement(node))))
                } else if case let .text(t) = ch {
                    markers.append(TimedMarker(time: time, node: .text(t)))
                }
            }
        }

        if hasUnsupportedNote || timedNotes.isEmpty { return false }
        if !timedNotes.contains(where: { $0.staff == 1 }) || !timedNotes.contains(where: { $0.staff == 2 }) {
            return false
        }

        let hasStaffSwitch = timedNotes.indices.dropFirst().contains { i in
            timedNotes[i].staff != timedNotes[i - 1].staff
        }
        if !hasStaffSwitch { return false }

        let expectedMeasureDuration =
            Double(timing.divisions * timing.beats) * 4.0 / Double(max(1, timing.beatType))
        let measureDuration = max(Double(time), expectedMeasureDuration)
        guard measureDuration.isFinite, measureDuration > 0 else { return false }

        measure.children.removeAll(keepingCapacity: true)

        let inlineMarkers = markers.filter { $0.time < measureDuration - timingEpsilon }
        let endMarkers = markers.filter { $0.time >= measureDuration - timingEpsilon }
        var markerIndex = 0

        func appendInlineMarkersUpTo(_ targetTime: Double, measureElement: ChordOsmdXmlElement) {
            while markerIndex < inlineMarkers.count,
                  inlineMarkers[markerIndex].time <= targetTime + timingEpsilon
            {
                measureElement.children.append(inlineMarkers[markerIndex].node.copyForAppend())
                markerIndex += 1
            }
        }

        func appendRest(duration: Double, voice: Int, staff: Int, measureElement: ChordOsmdXmlElement) {
            if duration <= timingEpsilon { return }
            measureElement.children.append(
                .element(createRestNote(duration: duration, voice: voice, staff: staff, divisions: timing.divisions))
            )
        }

        func appendStaffVoice(staff: Int, withMarkers: Bool, measureElement: ChordOsmdXmlElement) {
            let staffNotes = timedNotes.filter { $0.staff == staff }
            var cursor = 0.0
            for note in staffNotes {
                if withMarkers {
                    while markerIndex < inlineMarkers.count,
                          inlineMarkers[markerIndex].time < note.start - timingEpsilon
                    {
                        let marker = inlineMarkers[markerIndex]
                        appendRest(duration: marker.time - cursor, voice: staff, staff: staff, measureElement: measureElement)
                        cursor = marker.time
                        measureElement.children.append(marker.node.copyForAppend())
                        markerIndex += 1
                    }
                    appendInlineMarkersUpTo(note.start, measureElement: measureElement)
                }
                appendRest(duration: note.start - cursor, voice: staff, staff: staff, measureElement: measureElement)
                measureElement.children.append(.element(cloneTimedNote(source: note.note, voice: staff, staff: staff)))
                cursor = note.start + note.duration
            }
            if withMarkers {
                while markerIndex < inlineMarkers.count {
                    let marker = inlineMarkers[markerIndex]
                    appendRest(duration: marker.time - cursor, voice: staff, staff: staff, measureElement: measureElement)
                    cursor = marker.time
                    measureElement.children.append(marker.node.copyForAppend())
                    markerIndex += 1
                }
            }
            appendRest(duration: measureDuration - cursor, voice: staff, staff: staff, measureElement: measureElement)
        }

        appendStaffVoice(staff: 1, withMarkers: true, measureElement: measure)
        measure.children.append(.element(createBackup(duration: measureDuration)))
        appendStaffVoice(staff: 2, withMarkers: false, measureElement: measure)
        for m in endMarkers {
            measure.children.append(m.node.copyForAppend())
        }

        return true
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

    private static func containsChildElement(named name: String, in parent: ChordOsmdXmlElement) -> Bool {
        for ch in parent.children {
            if case let .element(el) = ch, el.name == name {
                return true
            }
        }
        return false
    }

    private static func parsePositiveInt(_ value: String?) -> Int? {
        guard let value, let n = Int(value), n > 0 else { return nil }
        return n
    }

    private static func parseStaffNumber(_ value: String?) -> Int? {
        if value == "1" { return 1 }
        if value == "2" { return 2 }
        return nil
    }

    private static func durationToMusicXmlType(duration: Double, divisions: Int) -> String? {
        let d = Double(max(1, divisions))
        let ratio = duration / d
        if abs(ratio - 4) <= timingEpsilon { return "whole" }
        if abs(ratio - 2) <= timingEpsilon { return "half" }
        if abs(ratio - 1) <= timingEpsilon { return "quarter" }
        if abs(ratio - 0.5) <= timingEpsilon { return "eighth" }
        if abs(ratio - 0.25) <= timingEpsilon { return "16th" }
        return nil
    }

    private static func createDurationElement(duration: Double) -> ChordOsmdXmlElement {
        let el = ChordOsmdXmlElement(name: "duration")
        el.children.append(.text(String(Int(duration.rounded()))))
        return el
    }

    private static func createRestNote(duration: Double, voice: Int, staff: Int, divisions: Int) -> ChordOsmdXmlElement {
        let note = ChordOsmdXmlElement(name: "note")
        note.children.append(.element(ChordOsmdXmlElement(name: "rest")))
        note.children.append(.element(createDurationElement(duration: duration)))
        let voiceEl = ChordOsmdXmlElement(name: "voice")
        voiceEl.children.append(.text(String(voice)))
        note.children.append(.element(voiceEl))
        if let noteType = durationToMusicXmlType(duration: duration, divisions: divisions) {
            let typeEl = ChordOsmdXmlElement(name: "type")
            typeEl.children.append(.text(noteType))
            note.children.append(.element(typeEl))
        }
        let staffEl = ChordOsmdXmlElement(name: "staff")
        staffEl.children.append(.text(String(staff)))
        note.children.append(.element(staffEl))
        return note
    }

    private static func createBackup(duration: Double) -> ChordOsmdXmlElement {
        let backup = ChordOsmdXmlElement(name: "backup")
        backup.children.append(.element(createDurationElement(duration: duration)))
        return backup
    }

    private static func cloneTimedNote(source: ChordOsmdXmlElement, voice: Int, staff: Int) -> ChordOsmdXmlElement {
        let copy = deepCopyElement(source)
        setText(in: copy, localName: "voice", text: String(voice))
        setText(in: copy, localName: "staff", text: String(staff))
        return copy
    }

    private static func setText(in parent: ChordOsmdXmlElement, localName: String, text: String) {
        if let existing = directChild(parent, localName: localName) {
            existing.children = [.text(text)]
            return
        }
        let child = ChordOsmdXmlElement(name: localName)
        child.children.append(.text(text))
        parent.children.append(.element(child))
    }
}

// MARK: - XMLParser

private enum ChordOsmdXmlParser {
    static func parse(_ xml: String) -> ChordOsmdXmlElement? {
        guard let data = xml.data(using: .utf8) else { return nil }
        let delegate = Delegate()
        let parser = XMLParser(data: data)
        parser.delegate = delegate
        guard parser.parse(), let root = delegate.root else {
            return nil
        }
        return root
    }

    private final class Delegate: NSObject, XMLParserDelegate {
        private var stack: [ChordOsmdXmlElement] = []
        private var textBuffer = ""
        var root: ChordOsmdXmlElement?

        func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
            flushText()
            let el = ChordOsmdXmlElement(name: elementName)
            el.attributes = attributeDict.map { (name: $0.key, value: $0.value) }
            if let parent = stack.last {
                parent.children.append(.element(el))
            } else {
                root = el
            }
            stack.append(el)
        }

        func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
            flushText()
            _ = stack.popLast()
        }

        func parser(_ parser: XMLParser, foundCharacters string: String) {
            textBuffer += string
        }

        private func flushText() {
            guard !textBuffer.isEmpty else { return }
            if let parent = stack.last {
                if case let .text(existing) = parent.children.last {
                    parent.children[parent.children.count - 1] = .text(existing + textBuffer)
                } else {
                    parent.children.append(.text(textBuffer))
                }
            }
            textBuffer = ""
        }
    }
}

// MARK: - Serialize

private enum ChordOsmdXmlSerializer {
    static func stringify(_ root: ChordOsmdXmlElement) -> String {
        var out = ""
        serialize(root, into: &out)
        return out
    }

    private static func escape(_ s: String) -> String {
        var r = ""
        r.reserveCapacity(s.count)
        for ch in s {
            switch ch {
            case "&": r.append("&amp;")
            case "<": r.append("&lt;")
            case ">": r.append("&gt;")
            case "\"": r.append("&quot;")
            case "'": r.append("&apos;")
            default: r.append(ch)
            }
        }
        return r
    }

    private static func serialize(_ el: ChordOsmdXmlElement, into out: inout String) {
        out.append("<\(el.name)")
        for attr in el.attributes {
            out.append(" \(attr.name)=\"\(escape(attr.value))\"")
        }
        if el.children.isEmpty {
            out.append("/>")
            return
        }
        out.append(">")
        for ch in el.children {
            switch ch {
            case let .text(t):
                out.append(escape(t))
            case let .element(child):
                serialize(child, into: &out)
            }
        }
        out.append("</\(el.name)>")
    }
}
