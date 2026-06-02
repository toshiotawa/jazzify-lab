import Foundation

enum SurvivalTutorialDemoPlayScheduler {
    enum EventKind: String, Sendable {
        case chordStart
        case chordEnd
        case lineStart
        case lineEnd
        case demoEnd
    }

    struct ScheduleEvent: Sendable {
        let kind: EventKind
        let atBeat: Double
        let atSeconds: Double
        let chordIndex: Int?
        let lineIndex: Int?
    }

    static func beatToSeconds(beat: Double, bpm: Double) -> Double {
        let safeBpm = max(1, bpm)
        return (beat * 60) / safeBpm
    }

    static func defaultLineDurationBeats(bpm: Double) -> Double {
        (SurvivalTutorialV3Constants.dialogueLineSeconds * bpm) / 60
    }

    static func buildSchedule(scene: SurvivalTutorialV3DemoPlayScene) -> [ScheduleEvent] {
        let bpm = scene.bpm
        let beatsPerMeasure = scene.beatsPerMeasure ?? 4
        let defaultLineBeats = defaultLineDurationBeats(bpm: bpm)
        let endHold = scene.endHoldBeats ?? beatsPerMeasure
        var maxEndBeat: Double = 0
        var events: [ScheduleEvent] = []

        for (index, chord) in scene.chords.enumerated() {
            let start = chord.startBeat
            let end = start + chord.durationBeats
            maxEndBeat = max(maxEndBeat, end)
            events.append(
                ScheduleEvent(
                    kind: .chordStart,
                    atBeat: start,
                    atSeconds: beatToSeconds(beat: start, bpm: bpm),
                    chordIndex: index,
                    lineIndex: nil
                )
            )
            events.append(
                ScheduleEvent(
                    kind: .chordEnd,
                    atBeat: end,
                    atSeconds: beatToSeconds(beat: end, bpm: bpm),
                    chordIndex: index,
                    lineIndex: nil
                )
            )
        }

        for (index, line) in scene.lines.enumerated() {
            let start = line.startBeat
            let duration = line.durationBeats ?? defaultLineBeats
            let end = start + duration
            maxEndBeat = max(maxEndBeat, end)
            events.append(
                ScheduleEvent(
                    kind: .lineStart,
                    atBeat: start,
                    atSeconds: beatToSeconds(beat: start, bpm: bpm),
                    chordIndex: nil,
                    lineIndex: index
                )
            )
            events.append(
                ScheduleEvent(
                    kind: .lineEnd,
                    atBeat: end,
                    atSeconds: beatToSeconds(beat: end, bpm: bpm),
                    chordIndex: nil,
                    lineIndex: index
                )
            )
        }

        let demoEndBeat = maxEndBeat + endHold
        events.append(
            ScheduleEvent(
                kind: .demoEnd,
                atBeat: demoEndBeat,
                atSeconds: beatToSeconds(beat: demoEndBeat, bpm: bpm),
                chordIndex: nil,
                lineIndex: nil
            )
        )

        return events.sorted {
            if $0.atSeconds == $1.atSeconds {
                return $0.kind.rawValue < $1.kind.rawValue
            }
            return $0.atSeconds < $1.atSeconds
        }
    }

    static func resolveLineSpeaker(_ line: SurvivalTutorialV3DemoLine) -> SurvivalTutorialV3DialogueSpeaker {
        switch line.speaker {
        case "fai":
            return .fai
        case "narration":
            return .narration
        default:
            return .jajii
        }
    }

    static func resolveWindowStartMeasure(
        chords: [SurvivalTutorialV3DemoChordEvent],
        activeChordIndex: Int?
    ) -> Int {
        guard let activeChordIndex,
              chords.indices.contains(activeChordIndex) else {
            return chords.first?.measure_number ?? 1
        }
        let activeMeasure = chords[activeChordIndex].measure_number
        let maxMeasure = chords.map(\.measure_number).max() ?? 1
        if activeMeasure >= maxMeasure {
            return max(1, maxMeasure - 1)
        }
        return activeMeasure
    }
}

struct SurvivalTutorialDemoStaffSnapshot: Equatable {
    let chords: [SurvivalTutorialV3DemoChordEvent]
    let activeChordIndex: Int?
    let keyFifths: Int
    let windowStartMeasure: Int
}

enum SurvivalTutorialDemoStaffBuilder {
    static func voicingNames(for chord: SurvivalTutorialV3DemoChordEvent) -> [String] {
        if let names = chord.voicingNames, names.count == chord.voicing.count {
            return names
        }
        return chord.voicing.map { "M\($0)" }
    }

    static func voicingStaves(for chord: SurvivalTutorialV3DemoChordEvent, names: [String]) -> [Int] {
        if let staves = chord.voicing_staves, staves.count == names.count {
            return staves
        }
        return names.map { _ in 2 }
    }
}
