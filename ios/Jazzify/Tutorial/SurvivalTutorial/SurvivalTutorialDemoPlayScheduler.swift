import Foundation

enum SurvivalTutorialDemoPlayScheduler {
    enum EventKind: String, Sendable {
        case chordStart
        case rollStepStart
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
        let rollStepIndex: Int?
        let lineIndex: Int?
    }

    static func beatToSeconds(beat: Double, bpm: Double) -> Double {
        let safeBpm = max(1, bpm)
        return (beat * 60) / safeBpm
    }

    /// BGM アンカー時刻からの残り遅延秒（負値は 0 にクランプ）。
    /// `advanceSeconds` 正値で発火を前倒し（描画レイテンシ補正）、負値で後ろ倒し（出力レイテンシ追従）。
    static func anchoredDelaySeconds(
        atSeconds: Double,
        elapsedSeconds: Double,
        advanceSeconds: Double = 0
    ) -> Double {
        max(0, atSeconds - elapsedSeconds - advanceSeconds)
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
            if let rollSteps = chord.rollSteps, !rollSteps.isEmpty {
                let end = chord.startBeat + chord.durationBeats
                maxEndBeat = max(maxEndBeat, end)
                for (rollStepIndex, step) in rollSteps.enumerated() {
                    let kind: EventKind = rollStepIndex == 0 ? .chordStart : .rollStepStart
                    events.append(
                        ScheduleEvent(
                            kind: kind,
                            atBeat: step.startBeat,
                            atSeconds: beatToSeconds(beat: step.startBeat, bpm: bpm),
                            chordIndex: index,
                            rollStepIndex: rollStepIndex,
                            lineIndex: nil
                        )
                    )
                }
                events.append(
                    ScheduleEvent(
                        kind: .chordEnd,
                        atBeat: end,
                        atSeconds: beatToSeconds(beat: end, bpm: bpm),
                        chordIndex: index,
                        rollStepIndex: nil,
                        lineIndex: nil
                    )
                )
                continue
            }

            let start = chord.startBeat
            let end = start + chord.durationBeats
            maxEndBeat = max(maxEndBeat, end)
            events.append(
                ScheduleEvent(
                    kind: .chordStart,
                    atBeat: start,
                    atSeconds: beatToSeconds(beat: start, bpm: bpm),
                    chordIndex: index,
                    rollStepIndex: nil,
                    lineIndex: nil
                )
            )
            events.append(
                ScheduleEvent(
                    kind: .chordEnd,
                    atBeat: end,
                    atSeconds: beatToSeconds(beat: end, bpm: bpm),
                    chordIndex: index,
                    rollStepIndex: nil,
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
                    rollStepIndex: nil,
                    lineIndex: index
                )
            )
            events.append(
                ScheduleEvent(
                    kind: .lineEnd,
                    atBeat: end,
                    atSeconds: beatToSeconds(beat: end, bpm: bpm),
                    chordIndex: nil,
                    rollStepIndex: nil,
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
                rollStepIndex: nil,
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
        if let activeChordIndex,
           chords.indices.contains(activeChordIndex) {
            return chords[activeChordIndex].measure_number
        }
        return chords.first?.measure_number ?? 1
    }

    /// demo_play 台本の全 `voicing` から最大 MIDI（休符 `[]` は除外）。鍵盤スクロール用。
    static func maxVoicingMidi(in chords: [SurvivalTutorialV3DemoChordEvent]) -> Int? {
        var maxValue: Int?
        for chord in chords {
            for midi in chord.voicing {
                if maxValue == nil || midi > maxValue! {
                    maxValue = midi
                }
            }
        }
        return maxValue
    }

    /// `applyTutorialSceneKeyboardScroll` 用。Onboarding ii-V-I ではなく台本 voicing のみから構築する。
    static func resolvedChordsForKeyboardScroll(
        in chords: [SurvivalTutorialV3DemoChordEvent]
    ) -> [SurvivalResolvedChord] {
        chords.enumerated().compactMap { index, event in
            guard !event.voicing.isEmpty else { return nil }
            let names = SurvivalTutorialDemoStaffBuilder.voicingNames(for: event)
            return SurvivalResolvedChord.fromExplicitTutorialVoicing(
                id: "demo-play-scroll:\(index)",
                name: event.chordName,
                voicing: event.voicing,
                voicingNames: names,
                keyFifths: event.keyFifths ?? 0
            )
        }
    }
}

struct SurvivalTutorialDemoStaffSnapshot: Equatable {
    let chords: [SurvivalTutorialV3DemoChordEvent]
    let activeChordIndex: Int?
    let activeRollStepIndex: Int?
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

    static func fixedStaves(for chords: [SurvivalTutorialV3DemoChordEvent]) -> [Int] {
        var staves = Set<Int>()
        for chord in chords {
            if let voicingStaves = chord.voicing_staves {
                for staff in voicingStaves where staff == 1 || staff == 2 {
                    staves.insert(staff)
                }
            }
            if let rollSteps = chord.rollSteps {
                for step in rollSteps {
                    if let stepStaves = step.voicing_staves {
                        for staff in stepStaves where staff == 1 || staff == 2 {
                            staves.insert(staff)
                        }
                    }
                }
            }
        }
        if staves.contains(1), staves.contains(2) {
            return [1, 2]
        }
        if staves.contains(1) {
            return [1]
        }
        if staves.contains(2) {
            return [2]
        }
        return [1, 2]
    }
}
