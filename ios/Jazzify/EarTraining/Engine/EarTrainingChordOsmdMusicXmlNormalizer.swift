import Foundation

/// OSMD リズム判定：MusicXML 上の同時発音クラスタと DB の `(measure_number, beat_offset)` を対応付けるための 1 アタック分。
struct ChordOsmdMusicXmlAttack: Equatable, Sendable {
    let measureNumber: Int
    /// 小節内の拍位置（先頭拍を 1）。四分音符グリッド。
    let beatStartInMeasure: Double
    let midis: [Int]
}

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

    /// `<staves>` の最大値と、`<note>` 直下の `<staff>` 番号の最大値のうち大きい方（いずれも無ければ 1）。
    private static func maxDetectedStaffLayerCount(from root: ChordOsmdXmlElement) -> Int {
        var maxFromStaves = 0
        var maxFromNoteStaff = 0
        func visit(_ el: ChordOsmdXmlElement) {
            if el.name == "staves", let n = parsePositiveInt(textContent(of: el)) {
                maxFromStaves = max(maxFromStaves, n)
            }
            if el.name == "note" {
                for ch in el.children {
                    if case let .element(child) = ch, child.name == "staff",
                       let n = parsePositiveInt(textContent(of: child))
                    {
                        maxFromNoteStaff = max(maxFromNoteStaff, n)
                    }
                }
            }
            for ch in el.children {
                if case let .element(child) = ch {
                    visit(child)
                }
            }
        }
        visit(root)
        return max(1, maxFromStaves, maxFromNoteStaff)
    }

    private static func textContent(of el: ChordOsmdXmlElement) -> String? {
        var buffer = ""
        for ch in el.children {
            if case let .text(t) = ch {
                buffer.append(t)
            }
        }
        let trimmed = buffer.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    static func normalizeChordOsmdMusicXml(_ xmlText: String) -> String {
        normalizeChordOsmdMusicXmlWithMeta(xmlText).xml
    }

    /// Web の `detectMaxStaffLayersFromMusicXml` と同一規則。`@Published` の段数と表示 XML のズレがあってもズーム判定を正す。
    static func detectMaxStaffLayersFromMusicXmlString(_ xml: String) -> Int {
        var maxFromStaves = 0
        var maxFromNoteStaff = 0

        if let re = try? NSRegularExpression(pattern: #"<staves>\s*(\d+)\s*</staves>"#, options: .caseInsensitive) {
            let full = NSRange(xml.startIndex..., in: xml)
            re.enumerateMatches(in: xml, options: [], range: full) { result, _, _ in
                guard let result, result.numberOfRanges >= 2,
                      let cap = Range(result.range(at: 1), in: xml),
                      let n = Int(xml[cap]), n > maxFromStaves else { return }
                maxFromStaves = n
            }
        }

        guard let noteOuter = try? NSRegularExpression(pattern: #"<note\b[^>]*>[\s\S]*?</note>"#, options: .caseInsensitive),
              let staffInner = try? NSRegularExpression(pattern: #"<staff>\s*(\d+)\s*</staff>"#, options: .caseInsensitive)
        else {
            return max(1, maxFromStaves, maxFromNoteStaff)
        }

        let full = NSRange(xml.startIndex..., in: xml)
        noteOuter.enumerateMatches(in: xml, options: [], range: full) { noteMatch, _, _ in
            guard let noteMatch else { return }
            guard let blockRange = Range(noteMatch.range, in: xml) else { return }
            let block = String(xml[blockRange])
            let blockFull = NSRange(block.startIndex..., in: block)
            staffInner.enumerateMatches(in: block, options: [], range: blockFull) { sm, _, _ in
                guard let sm, sm.numberOfRanges >= 2,
                      let sr = Range(sm.range(at: 1), in: block),
                      let n = Int(block[sr]), n > maxFromNoteStaff else { return }
                maxFromNoteStaff = n
            }
        }

        return max(1, maxFromStaves, maxFromNoteStaff)
    }

    /// 正規化後の XML と、段落譜数の検出結果（読み込み 1 回で両方算出）。
    static func normalizeChordOsmdMusicXmlWithMeta(_ xmlText: String) -> (xml: String, maxStaffLayers: Int) {
        guard let root = ChordOsmdXmlParser.parse(xmlText) else {
            return (xmlText, 1)
        }
        let maxStaffLayers = Self.maxDetectedStaffLayerCount(from: root)

        var changed = false
        var timing = Timing(divisions: 1, beats: 4, beatType: 4)

        for measure in allElements(named: "measure", in: root) {
            timing = readMeasureTiming(measure, previous: timing)
            if normalizeMeasureToExplicitTwoStaffVoices(measure: measure, timing: timing) {
                changed = true
            }
        }

        guard changed else { return (xmlText, maxStaffLayers) }
        // `XMLParser` は XML 宣言と DOCTYPE を保持せず、serializer も root 以下しか出力しない。
        // WebKit の DOMParser は宣言の無い文字列を `invalid document` として弾くため、`<?xml ... ?>` を再付与する。
        let normalized = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + ChordOsmdXmlSerializer.stringify(root)
        return (normalized, maxStaffLayers)
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

    private struct ScoreTimingStateForAttacks {
        var divisions: Int
        var beats: Int
        var beatType: Int
        var keyFifths: Int
    }

    private static let xmlAttackBeatMatchEpsilon = 0.01

    private static let sharpKeySignatureSteps = ["F", "C", "G", "D", "A", "E", "B"]
    private static let flatKeySignatureSteps = ["B", "E", "A", "D", "G", "C", "F"]

    /// `<tie type="stop"/>` または `<notations>` 直下の `<tied type="stop"/>`（別ツール出力）。
    /// 同じクラスタの別構成音に誤検出しないよう、`note` の直接子のみを見る。
    private static func hasTieStop(on noteElement: ChordOsmdXmlElement) -> Bool {
        for ch in noteElement.children {
            guard case let .element(el) = ch else { continue }
            if el.name == "tie", attribute(named: "type", on: el) == "stop" {
                return true
            }
            if el.name == "notations" {
                for nch in el.children {
                    guard case let .element(ne) = nch else { continue }
                    if ne.name == "tied", attribute(named: "type", on: ne) == "stop" {
                        return true
                    }
                }
            }
        }
        return false
    }

    private static func attribute(named key: String, on element: ChordOsmdXmlElement) -> String? {
        element.attributes.first(where: { $0.name == key })?.value
    }

    /// Web `collectChordOsmdMusicXmlAttacks` と同等（`<chord/>`・`<backup>` を考慮）。
    static func collectChordOsmdMusicXmlAttacks(_ xmlText: String) -> [ChordOsmdMusicXmlAttack] {
        guard let root = ChordOsmdXmlParser.parse(xmlText) else { return [] }
        let measures = measuresInPartsFirst(from: root)
        var attacks: [ChordOsmdMusicXmlAttack] = []
        var timing = ScoreTimingStateForAttacks(divisions: 1, beats: 4, beatType: 4, keyFifths: 0)

        for (idx, measure) in measures.enumerated() {
            let measureNumber = parseMeasureNumberAttribute(measure, ordinalOneBased: idx + 1)
            var currentTime = 0.0
            let children = measure.children
            var ci = 0
            while ci < children.count {
                guard case let .element(child) = children[ci] else {
                    ci += 1
                    continue
                }

                switch child.name {
                case "attributes":
                    timing = readScoreTimingForAttacks(attributes: child, previous: timing)
                    ci += 1
                case "backup":
                    if let d = parsePositiveInt(text(in: child, localName: "duration")).map(Double.init) {
                        currentTime -= d
                    }
                    ci += 1
                case "forward":
                    if let d = parsePositiveInt(text(in: child, localName: "duration")).map(Double.init) {
                        currentTime += d
                    }
                    ci += 1
                case "note":
                    guard directChild(child, localName: "grace") == nil else {
                        ci += 1
                        continue
                    }
                    guard let duration = parsePositiveInt(text(in: child, localName: "duration")).map(Double.init) else {
                        ci += 1
                        continue
                    }

                    if directChild(child, localName: "rest") != nil {
                        currentTime += duration
                        ci += 1
                        continue
                    }

                    guard let pitch = directChild(child, localName: "pitch") else {
                        ci += 1
                        continue
                    }

                    if directChild(child, localName: "chord") != nil {
                        ci += 1
                        continue
                    }

                    let headStopTied = hasTieStop(on: child)
                    var clusterMidis: [Int] = []
                    let clusterDur = duration
                    if let m0 = midiFromPitchElement(pitch, keyFifths: timing.keyFifths), !headStopTied {
                        clusterMidis.append(m0)
                    }

                    var ni = ci + 1
                    while ni < children.count {
                        // XMLParser は要素間の改行・インデントを `.text` として保持するため、
                        // 同じクラスタ内の `<chord/>` 続きノートに到達する前に空白テキストを通り抜ける必要がある。
                        if case .text = children[ni] {
                            ni += 1
                            continue
                        }
                        guard case let .element(next) = children[ni], next.name == "note" else { break }
                        guard directChild(next, localName: "grace") == nil else { break }
                        guard directChild(next, localName: "chord") != nil else { break }
                        guard directChild(next, localName: "rest") == nil else { break }
                        guard let nextPitch = directChild(next, localName: "pitch") else { break }
                        let chordToneStopTied = hasTieStop(on: next)
                        if let mm = midiFromPitchElement(nextPitch, keyFifths: timing.keyFifths), !chordToneStopTied {
                            clusterMidis.append(mm)
                        }
                        ni += 1
                    }

                    let divisions = max(1, timing.divisions)
                    let quartersFromMeasureStart = currentTime / Double(divisions)
                    let beatStartInMeasure = quartersFromMeasureStart + 1

                    if !clusterMidis.isEmpty {
                        attacks.append(
                            ChordOsmdMusicXmlAttack(
                                measureNumber: measureNumber,
                                beatStartInMeasure: beatStartInMeasure,
                                midis: clusterMidis
                            )
                        )
                    }

                    currentTime += clusterDur
                    ci = ni
                default:
                    ci += 1
                }
            }
        }

        return attacks
    }

    /// `(measure_number, beat_offset)` に一致する MusicXML アタックの MIDI をマージ。無ければ nil（voicing フォールバック）。
    static func mergeMidisFromXmlAttacks(
        _ attacks: [ChordOsmdMusicXmlAttack],
        measureNumber: Int,
        beatOffset: Double
    ) -> [Int: Int]? {
        var merged: [Int: Int] = [:]
        var matched = false
        for attack in attacks where attack.measureNumber == measureNumber {
            if abs(attack.beatStartInMeasure - beatOffset) >= xmlAttackBeatMatchEpsilon {
                continue
            }
            matched = true
            for midi in attack.midis {
                merged[midi, default: 0] += 1
            }
        }
        guard matched, !merged.isEmpty else { return nil }
        return merged
    }

    private static func measuresInPartsFirst(from root: ChordOsmdXmlElement) -> [ChordOsmdXmlElement] {
        var fromParts: [ChordOsmdXmlElement] = []

        func collect(_ el: ChordOsmdXmlElement) {
            if el.name == "part" {
                for ch in el.children {
                    if case let .element(m) = ch, m.name == "measure" {
                        fromParts.append(m)
                    }
                }
                return
            }
            for ch in el.children {
                if case let .element(c) = ch {
                    collect(c)
                }
            }
        }

        collect(root)
        if !fromParts.isEmpty {
            return fromParts
        }
        return allElements(named: "measure", in: root)
    }

    private static func parseMeasureNumberAttribute(_ measure: ChordOsmdXmlElement, ordinalOneBased: Int) -> Int {
        if let raw = measure.attributes.first(where: { $0.name == "number" })?.value {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            var digits = ""
            for ch in trimmed where ch.isNumber {
                digits.append(ch)
                if digits.count >= 6 { break }
            }
            if let parsed = Int(digits), parsed > 0 {
                return parsed
            }
        }
        return ordinalOneBased
    }

    private static func readScoreTimingForAttacks(
        attributes: ChordOsmdXmlElement,
        previous: ScoreTimingStateForAttacks
    ) -> ScoreTimingStateForAttacks {
        var t = previous
        if let d = parsePositiveInt(text(in: attributes, localName: "divisions")) {
            t.divisions = d
        }
        if let timeEl = directChild(attributes, localName: "time") {
            if let b = parsePositiveInt(text(in: timeEl, localName: "beats")) {
                t.beats = b
            }
            if let bt = parsePositiveInt(text(in: timeEl, localName: "beat-type")) {
                t.beatType = bt
            }
        }
        if let keyEl = directChild(attributes, localName: "key"),
           let fifthsText = text(in: keyEl, localName: "fifths"),
           let k = Int(fifthsText.trimmingCharacters(in: .whitespacesAndNewlines))
        {
            t.keyFifths = k
        }
        return t
    }

    private static func clampKeyFifths(_ value: Int) -> Int {
        min(7, max(-7, value))
    }

    private static func keySignatureAlter(step: String, keyFifths: Int) -> Int {
        let fifths = clampKeyFifths(keyFifths)
        if fifths > 0 {
            for index in 0..<fifths where index < sharpKeySignatureSteps.count {
                if sharpKeySignatureSteps[index] == step {
                    return 1
                }
            }
            return 0
        }
        if fifths < 0 {
            let flatCount = abs(fifths)
            for index in 0..<flatCount where index < flatKeySignatureSteps.count {
                if flatKeySignatureSteps[index] == step {
                    return -1
                }
            }
            return 0
        }
        return 0
    }

    private static func midiFromPitchElement(_ pitch: ChordOsmdXmlElement, keyFifths: Int) -> Int? {
        guard let stepRaw = text(in: pitch, localName: "step")?.trimmingCharacters(in: .whitespacesAndNewlines),
              stepRaw.count == 1
        else {
            return nil
        }
        let stepUpper = String(stepRaw.prefix(1)).uppercased()

        let baseMap: [String: Int] = [
            "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
        ]
        guard let semitoneBase = baseMap[stepUpper] else { return nil }

        guard let octaveStr = text(in: pitch, localName: "octave"),
              let octave = Int(octaveStr.trimmingCharacters(in: .whitespacesAndNewlines))
        else {
            return nil
        }

        let alter: Int
        if let alterText = text(in: pitch, localName: "alter"),
           let parsed = Int(alterText.trimmingCharacters(in: .whitespacesAndNewlines))
        {
            alter = parsed
        } else {
            alter = keySignatureAlter(step: stepUpper, keyFifths: keyFifths)
        }

        return (octave + 1) * 12 + semitoneBase + alter
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
