import Foundation
import CoreGraphics
struct EarTrainingPrecisionNote: Equatable, Sendable, Identifiable {
    let id: String
    let midi: Int
    let startSec: Double
    let durationSec: Double
    let isBlackKey: Bool
    let measureNumber: Int
    let isShortNote: Bool
}

struct EarTrainingPrecisionKeyboardRange: Equatable, Sendable {
    let minMidi: Int
    let maxMidi: Int
}

struct EarTrainingPrecisionNoteBuildResult: Equatable, Sendable {
    let notes: [EarTrainingPrecisionNote]
    let keyboardRange: EarTrainingPrecisionKeyboardRange
}

enum EarTrainingPrecisionNotes {
    static let fullKeyboardRange = EarTrainingPrecisionKeyboardRange(minMidi: 21, maxMidi: 108)
    static let guideLeadSec: Double = 0.5
    static let shortNoteHeightPx: CGFloat = 8
    static let fallLeadSec: Double = 3

    private static let blackKeyOffsets: Set<Int> = [1, 3, 6, 8, 10]
    private static let defaultKeyboardSpanSemitones = 24
    private static let keyboardPaddingSemitones = 2

    static let shortNoteMaxQuarterNum = 2
    static let shortNoteMaxQuarterDen = 3
    static let midiSamePitchOverlapTrimEpsilonSec: Double = 0.001
    private static let noteMinDurationSec: Double = 0.05

    static func isBlackKeyMidi(_ midi: Int) -> Bool {
        let mod = ((midi % 12) + 12) % 12
        return blackKeyOffsets.contains(mod)
    }

    static func isShortNoteQuarterLength(_ quarterLength: Double) -> Bool {
        quarterLength * Double(shortNoteMaxQuarterDen) <= Double(shortNoteMaxQuarterNum) + 1e-9
    }

    static func shortNoteMaxDurationSec(bpm: Int) -> Double {
        (60.0 / Double(max(1, bpm))) * (Double(shortNoteMaxQuarterNum) / Double(shortNoteMaxQuarterDen))
    }

    static func isShortNoteDuration(durationSec: Double, bpm: Int) -> Bool {
        let safeBpm = max(1, bpm)
        let quarterLength = durationSec * Double(safeBpm) / 60.0
        return isShortNoteQuarterLength(quarterLength)
    }

    static func withShortNoteFlags(
        notes: [EarTrainingPrecisionNote],
        classificationBpm: Int
    ) -> [EarTrainingPrecisionNote] {
        notes.map { note in
            EarTrainingPrecisionNote(
                id: note.id,
                midi: note.midi,
                startSec: note.startSec,
                durationSec: note.durationSec,
                isBlackKey: note.isBlackKey,
                measureNumber: note.measureNumber,
                isShortNote: isShortNoteDuration(durationSec: note.durationSec, bpm: classificationBpm)
            )
        }
    }

    /// 同一 midi の連続ノーツで note off が次 note on を跨ぐ場合、手前 duration を短縮する。
    static func trimOverlappingSamePitchNotes(
        notes: [EarTrainingPrecisionNote],
        classificationBpm: Int,
        epsilonSec: Double = midiSamePitchOverlapTrimEpsilonSec
    ) -> [EarTrainingPrecisionNote] {
        guard notes.count > 1 else { return notes }
        var result = notes
        var lastIndexByMidi: [Int: Int] = [:]

        for i in 0..<result.count {
            let note = result[i]
            if let prevIndex = lastIndexByMidi[note.midi] {
                let prev = result[prevIndex]
                let prevEnd = prev.startSec + prev.durationSec
                if prevEnd > note.startSec - epsilonSec {
                    let newDuration = max(
                        noteMinDurationSec,
                        note.startSec - epsilonSec - prev.startSec
                    )
                    result[prevIndex] = EarTrainingPrecisionNote(
                        id: prev.id,
                        midi: prev.midi,
                        startSec: prev.startSec,
                        durationSec: newDuration,
                        isBlackKey: prev.isBlackKey,
                        measureNumber: prev.measureNumber,
                        isShortNote: isShortNoteDuration(durationSec: newDuration, bpm: classificationBpm)
                    )
                }
            }
            lastIndexByMidi[note.midi] = i
        }

        return result
    }

    static func calibrateNotes(
        notes: [EarTrainingPrecisionNote],
        resolveCalibratedStartSec: (Double) -> Double,
        practiceMode: Bool,
        practiceSpeedPercent: Int,
        classificationBpm: Int
    ) -> [EarTrainingPrecisionNote] {
        let scaled = notes.map { note in
            EarTrainingPrecisionNote(
                id: note.id,
                midi: note.midi,
                startSec: resolveCalibratedStartSec(note.startSec),
                durationSec: practiceMode
                    ? EarTrainingPracticeSpeed.scalePracticeTargetTimeSec(note.durationSec, speedPercent: practiceSpeedPercent)
                    : note.durationSec,
                isBlackKey: note.isBlackKey,
                measureNumber: note.measureNumber,
                isShortNote: note.isShortNote
            )
        }
        return withShortNoteFlags(notes: scaled, classificationBpm: classificationBpm)
    }

    static func resolveKeyboardRange(noteMidis: [Int]) -> EarTrainingPrecisionKeyboardRange {
        guard !noteMidis.isEmpty else {
            return EarTrainingPrecisionKeyboardRange(minMidi: 60, maxMidi: 83)
        }
        var minNote = noteMidis[0]
        var maxNote = noteMidis[0]
        for midi in noteMidis.dropFirst() {
            if midi < minNote { minNote = midi }
            if midi > maxNote { maxNote = midi }
        }

        var minMidi = minNote - keyboardPaddingSemitones
        var maxMidi = maxNote + keyboardPaddingSemitones
        let span = maxMidi - minMidi + 1
        if span < defaultKeyboardSpanSemitones {
            let center = Double(minNote + maxNote) / 2.0
            let halfSpan = defaultKeyboardSpanSemitones / 2
            minMidi = Int(center.rounded()) - halfSpan
            maxMidi = minMidi + defaultKeyboardSpanSemitones - 1
        }
        return EarTrainingPrecisionKeyboardRange(
            minMidi: max(21, minMidi),
            maxMidi: min(108, maxMidi)
        )
    }

    static func isNoteInGuideWindow(
        note: EarTrainingPrecisionNote,
        phraseTimeSec: Double,
        windowSec: Double,
        leadSec: Double = guideLeadSec
    ) -> Bool {
        let earliest = note.startSec - leadSec
        let latest = note.startSec + windowSec
        return phraseTimeSec >= earliest && phraseTimeSec <= latest
    }

    static func isNoteInPerformanceWindow(
        note: EarTrainingPrecisionNote,
        phraseTimeSec: Double
    ) -> Bool {
        phraseTimeSec >= note.startSec && phraseTimeSec <= note.startSec + note.durationSec
    }

    static func buildFromMusicXml(
        musicXmlText: String,
        bpm: Int,
        beatsPerMeasure: Int,
        transposeOffset: Int = 0,
        isSwing: Bool = false
    ) -> EarTrainingPrecisionNoteBuildResult {
        var notes: [EarTrainingPrecisionNote] = []
        forEachNoteCluster(musicXmlText: musicXmlText) { context in
            let timing = resolvePrecisionNoteTimingSec(
                measureNumber: context.measureNumber,
                beatStartInMeasure: context.beatStartInMeasure,
                durationDivisions: context.durationDivisions,
                divisions: context.divisions,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
            let startSec = timing.startSec
            let durationSec = timing.durationSec
            var indexInCluster = 0
            for noteElement in context.clusterNotes {
                if EarTrainingPrecisionMusicXmlClusterWalker.hasTieStop(on: noteElement) {
                    indexInCluster += 1
                    continue
                }
                guard let rawMidi = EarTrainingPrecisionMusicXmlClusterWalker.midiFromNoteElement(
                    noteElement,
                    keyFifths: context.keyFifths
                ) else {
                    indexInCluster += 1
                    continue
                }
                let midi = rawMidi + transposeOffset
                notes.append(
                    EarTrainingPrecisionNote(
                        id: precisionNoteId(
                            measureNumber: context.measureNumber,
                            beatStartInMeasure: context.beatStartInMeasure,
                            midi: midi,
                            indexInCluster: indexInCluster
                        ),
                        midi: midi,
                        startSec: startSec,
                        durationSec: durationSec,
                        isBlackKey: isBlackKeyMidi(midi),
                        measureNumber: context.measureNumber,
                        isShortNote: isShortNoteDuration(durationSec: durationSec, bpm: bpm)
                    )
                )
                indexInCluster += 1
            }
        }

        notes.sort { lhs, rhs in
            if abs(lhs.startSec - rhs.startSec) > 0.0005 {
                return lhs.startSec < rhs.startSec
            }
            if lhs.midi != rhs.midi {
                return lhs.midi < rhs.midi
            }
            return lhs.id < rhs.id
        }

        let keyboardRange = resolveKeyboardRange(noteMidis: notes.map(\.midi))
        return EarTrainingPrecisionNoteBuildResult(notes: notes, keyboardRange: keyboardRange)
    }

    private static func precisionNoteId(
        measureNumber: Int,
        beatStartInMeasure: Double,
        midi: Int,
        indexInCluster: Int
    ) -> String {
        String(format: "p:%d:%.4f:%d:%d", measureNumber, beatStartInMeasure, midi, indexInCluster)
    }

    private static func durationSecFromDivisions(durationDivisions: Double, divisions: Int, bpm: Int) -> Double {
        let beatDurationSec = 60.0 / Double(max(1, bpm))
        let quarters = durationDivisions / Double(max(1, divisions))
        return max(0.05, quarters * beatDurationSec)
    }

    private static func durationSecFromDivisions(durationDivisions: Double, divisions: Int, bpm: Int) -> Double {
        let beatDurationSec = 60.0 / Double(max(1, bpm))
        let quarters = durationDivisions / Double(max(1, divisions))
        return max(0.05, quarters * beatDurationSec)
    }

    private static func resolvePrecisionNoteTimingSec(
        measureNumber: Int,
        beatStartInMeasure: Double,
        durationDivisions: Double,
        divisions: Int,
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> (startSec: Double, durationSec: Double) {
        if !isSwing {
            let startSec = chordOsmdBeatToTargetTimeSec(
                measureNumber: measureNumber,
                beatStartInMeasure: beatStartInMeasure,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure
            )
            return (
                startSec,
                durationSecFromDivisions(durationDivisions: durationDivisions, divisions: divisions, bpm: bpm)
            )
        }
        let quarters = durationDivisions / Double(max(1, divisions))
        let endBeatStartInMeasure = beatStartInMeasure + quarters
        let startSec = chordOsmdBeatToTargetTimeSec(
            measureNumber: measureNumber,
            beatStartInMeasure: beatStartInMeasure,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: true
        )
        let endSec = chordOsmdBeatToTargetTimeSec(
            measureNumber: measureNumber,
            beatStartInMeasure: endBeatStartInMeasure,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: true
        )
        return (startSec, max(0.05, endSec - startSec))
    }

    private static let chordOsmdSwingLongEighthRatio = 2.0 / 3.0

    private static func applyChordOsmdSwingToBeatIndex(_ beatIndex: Double) -> Double {
        let beatWhole = floor(beatIndex + 1e-6)
        let fraction = beatIndex - beatWhole
        if abs(fraction - 0.5) < 1e-6 {
            return beatWhole + chordOsmdSwingLongEighthRatio
        }
        return beatIndex
    }

    static func chordOsmdBeatToTargetTimeSec(
        measureNumber: Int,
        beatStartInMeasure: Double,
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool = false
    ) -> Double {
        let beatDurationSec = 60.0 / Double(max(1, bpm))
        let bpmSafe = max(1, beatsPerMeasure)
        let measureIndex = max(0, measureNumber - 1)
        let rawBeatIndex = max(0.0, beatStartInMeasure - 1)
        let beatIndex = isSwing ? applyChordOsmdSwingToBeatIndex(rawBeatIndex) : rawBeatIndex
        return (Double(measureIndex * bpmSafe) + beatIndex) * beatDurationSec
    }

    private struct NoteClusterContext {
        let measureNumber: Int
        let beatStartInMeasure: Double
        let clusterNotes: [ChordOsmdXmlElement]
        let divisions: Int
        let keyFifths: Int
        let durationDivisions: Double
    }

    private static func forEachNoteCluster(
        musicXmlText: String,
        handler: (NoteClusterContext) -> Void
    ) {
        EarTrainingPrecisionMusicXmlClusterWalker.forEachCluster(musicXmlText: musicXmlText) { context in
            handler(
                NoteClusterContext(
                    measureNumber: context.measureNumber,
                    beatStartInMeasure: context.beatStartInMeasure,
                    clusterNotes: context.clusterNotes,
                    divisions: context.divisions,
                    keyFifths: context.keyFifths,
                    durationDivisions: context.durationDivisions
                )
            )
        }
    }
}

enum EarTrainingPrecisionMusicXmlClusterWalker {
    struct ClusterContext {
        let measureNumber: Int
        let beatStartInMeasure: Double
        let clusterNotes: [ChordOsmdXmlElement]
        let divisions: Int
        let keyFifths: Int
        let durationDivisions: Double
    }

    private struct ScoreTimingState {
        var divisions: Int
        var beats: Int
        var beatType: Int
        var keyFifths: Int
    }

    static func forEachCluster(
        musicXmlText: String,
        handler: (ClusterContext) -> Void
    ) {
        guard let root = ChordOsmdXmlParser.parse(musicXmlText) else { return }
        let measures = measuresInPartsFirst(from: root)
        var timing = ScoreTimingState(divisions: 1, beats: 4, beatType: 4, keyFifths: 0)

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
                    timing = readScoreTiming(attributes: child, previous: timing)
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
                    guard directChild(child, localName: "pitch") != nil else {
                        ci += 1
                        continue
                    }
                    if directChild(child, localName: "chord") != nil {
                        ci += 1
                        continue
                    }

                    var clusterNotes: [ChordOsmdXmlElement] = [child]
                    let clusterDur = duration
                    var ni = ci + 1
                    while ni < children.count {
                        if case .text = children[ni] {
                            ni += 1
                            continue
                        }
                        guard case let .element(next) = children[ni], next.name == "note" else { break }
                        guard directChild(next, localName: "grace") == nil else { break }
                        guard directChild(next, localName: "chord") != nil else { break }
                        guard directChild(next, localName: "rest") == nil else { break }
                        guard directChild(next, localName: "pitch") != nil else { break }
                        clusterNotes.append(next)
                        ni += 1
                    }

                    let divisions = max(1, timing.divisions)
                    let quartersFromMeasureStart = currentTime / Double(divisions)
                    let beatStartInMeasure = quartersFromMeasureStart + 1

                    handler(
                        ClusterContext(
                            measureNumber: measureNumber,
                            beatStartInMeasure: beatStartInMeasure,
                            clusterNotes: clusterNotes,
                            divisions: divisions,
                            keyFifths: timing.keyFifths,
                            durationDivisions: clusterDur
                        )
                    )

                    currentTime += clusterDur
                    ci = ni
                default:
                    ci += 1
                }
            }
        }
    }

    static func hasTieStop(on noteElement: ChordOsmdXmlElement) -> Bool {
        EarTrainingChordOsmdMusicXmlNormalizer.noteHasTieStop(on: noteElement)
    }

    static func midiFromNoteElement(_ note: ChordOsmdXmlElement, keyFifths: Int) -> Int? {
        EarTrainingChordOsmdMusicXmlNormalizer.parseNoteElementToMidi(note, keyFifths: keyFifths)
    }

    private static func measuresInPartsFirst(from root: ChordOsmdXmlElement) -> [ChordOsmdXmlElement] {
        var measures: [ChordOsmdXmlElement] = []
        func collect(_ el: ChordOsmdXmlElement) {
            if el.name == "part" {
                for child in el.children {
                    if case let .element(c) = child, c.name == "measure" {
                        measures.append(c)
                    }
                }
                return
            }
            for child in el.children {
                if case let .element(c) = child {
                    collect(c)
                }
            }
        }
        collect(root)
        return measures
    }

    private static func parseMeasureNumberAttribute(_ measure: ChordOsmdXmlElement, ordinalOneBased: Int) -> Int {
        if let numText = measure.attributes.first(where: { $0.name == "number" })?.value,
           let parsed = Int(numText.trimmingCharacters(in: .whitespacesAndNewlines)) {
            return max(1, parsed)
        }
        return ordinalOneBased
    }

    private static func readScoreTiming(attributes: ChordOsmdXmlElement, previous: ScoreTimingState) -> ScoreTimingState {
        var next = previous
        if let divisionsText = text(in: attributes, localName: "divisions"),
           let divisions = parsePositiveInt(divisionsText) {
            next.divisions = divisions
        }
        if let time = directChild(attributes, localName: "time") {
            if let beatsText = text(in: time, localName: "beats"), let beats = parsePositiveInt(beatsText) {
                next.beats = beats
            }
            if let beatTypeText = text(in: time, localName: "beat-type"), let beatType = parsePositiveInt(beatTypeText) {
                next.beatType = beatType
            }
        }
        if let key = directChild(attributes, localName: "key"),
           let fifthsText = text(in: key, localName: "fifths"),
           let fifths = Int(fifthsText.trimmingCharacters(in: .whitespacesAndNewlines)) {
            next.keyFifths = fifths
        }
        return next
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
        guard let child = directChild(parent, localName: localName) else { return nil }
        for item in child.children {
            if case let .text(value) = item {
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    return trimmed
                }
            }
        }
        return nil
    }

    private static func parsePositiveInt(_ value: String?) -> Int? {
        guard let value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let parsed = Int(trimmed), parsed > 0 else { return nil }
        return parsed
    }
}
