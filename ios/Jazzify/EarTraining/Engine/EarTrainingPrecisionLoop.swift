import Foundation

enum EarTrainingLoopTransposeDirection: String, CaseIterable, Sendable {
    case down
    case up
    case fourthUp
    case none
}

struct EarTrainingPrecisionLoopWindow: Equatable, Sendable {
    let startMeasure: Int
    let endMeasure: Int
    let startSec: Double
    let endSec: Double
    let durationSec: Double
}

struct EarTrainingPrecisionLoopPosition: Equatable, Sendable {
    let cycleIndex: Int
    let localSec: Double
}

struct EarTrainingPrecisionLoopOsmdTimeline: Equatable, Sendable {
    let measureNumber: Int
    let phraseTimelineSec: Double
}

enum EarTrainingPrecisionLoop {
    static let loopBaseSemitoneMin = -6
    static let loopBaseSemitoneMax = 5

    static func resolveLoopWindow(
        startMeasure: Int,
        endMeasure: Int,
        measureDurationSec: Double
    ) -> EarTrainingPrecisionLoopWindow {
        let safeStart = max(1, startMeasure)
        let safeEnd = max(safeStart, endMeasure)
        let safeMeasureDuration = max(1e-6, measureDurationSec)
        let startSec = Double(safeStart - 1) * safeMeasureDuration
        let endSec = Double(safeEnd) * safeMeasureDuration
        return EarTrainingPrecisionLoopWindow(
            startMeasure: safeStart,
            endMeasure: safeEnd,
            startSec: startSec,
            endSec: endSec,
            durationSec: max(1e-6, endSec - startSec)
        )
    }

    static func loopSemitoneForCycle(
        _ cycleIndex: Int,
        direction: EarTrainingLoopTransposeDirection,
        baseSemitone: Int = 0
    ) -> Int {
        let safeCycle = max(0, cycleIndex)
        let step: Int
        switch direction {
        case .none:
            step = 0
        case .down:
            step = -safeCycle
        case .up:
            step = safeCycle
        case .fourthUp:
            step = safeCycle * 5
        }
        let raw = baseSemitone + step
        var wrapped = ((raw % 12) + 12) % 12
        if wrapped > 6 || (wrapped == 6 && raw < 0) {
            wrapped -= 12
        }
        return wrapped
    }

    static func loopPracticeUniqueSemitones(
        direction: EarTrainingLoopTransposeDirection,
        baseSemitone: Int = 0
    ) -> [Int] {
        if direction == .none {
            return [loopSemitoneForCycle(0, direction: direction, baseSemitone: baseSemitone)]
        }
        var seen = Set<Int>()
        var result: [Int] = []
        for cycle in 0..<12 {
            let semitone = loopSemitoneForCycle(cycle, direction: direction, baseSemitone: baseSemitone)
            if seen.contains(semitone) {
                continue
            }
            seen.insert(semitone)
            result.append(semitone)
        }
        return result
    }

    static func globalToLoopPosition(
        _ globalSec: Double,
        durationSec: Double
    ) -> EarTrainingPrecisionLoopPosition {
        let safeDuration = max(1e-6, durationSec)
        let safeGlobal = max(0, globalSec)
        let cycleIndex = Int(floor(safeGlobal / safeDuration))
        let localSec = safeGlobal - Double(cycleIndex) * safeDuration
        return EarTrainingPrecisionLoopPosition(cycleIndex: cycleIndex, localSec: localSec)
    }

    static func loopCycleWindowSize(durationSec: Double) -> Int {
        let safeDuration = max(1e-6, durationSec)
        return max(2, Int(ceil(EarTrainingPrecisionNotes.fallLeadSec / safeDuration)) + 1)
    }

    static func buildLoopWindowNotes(
        notesBySemitone: [Int: [EarTrainingPrecisionNote]],
        cycleIndex: Int,
        windowSize: Int,
        loopWindow: EarTrainingPrecisionLoopWindow,
        direction: EarTrainingLoopTransposeDirection,
        baseSemitone: Int = 0,
        resolveCalibratedStartSec: (Double) -> Double = { $0 }
    ) -> [EarTrainingPrecisionNote] {
        let safeCycle = max(0, cycleIndex)
        let safeWindowSize = max(1, windowSize)
        var built: [EarTrainingPrecisionNote] = []

        for offset in 0..<safeWindowSize {
            let cycle = safeCycle + offset
            let semitone = loopSemitoneForCycle(cycle, direction: direction, baseSemitone: baseSemitone)
            let baseNotes = notesBySemitone[semitone] ?? []
            let globalCycleOffsetSec = Double(cycle) * loopWindow.durationSec

            for note in baseNotes {
                guard noteOverlapsLoopWindow(note, loopWindow: loopWindow) else { continue }
                let localStartSec = note.startSec - loopWindow.startSec
                let globalStartSec = resolveCalibratedStartSec(localStartSec + globalCycleOffsetSec)
                built.append(
                    EarTrainingPrecisionNote(
                        id: "\(note.id)#c\(cycle)",
                        midi: note.midi,
                        startSec: globalStartSec,
                        durationSec: note.durationSec,
                        isBlackKey: note.isBlackKey,
                        measureNumber: note.measureNumber,
                        isShortNote: note.isShortNote
                    )
                )
            }
        }

        built.sort { left, right in
            if left.startSec != right.startSec {
                return left.startSec < right.startSec
            }
            return left.id < right.id
        }
        return built
    }

    static func loopActiveMeasureNumber(
        localSec: Double,
        measureDurationSec: Double,
        loopWindow: EarTrainingPrecisionLoopWindow,
        maxMeasure: Int
    ) -> Int {
        let safeMeasureDuration = max(1e-6, measureDurationSec)
        let measureInWindow = Int(floor(max(0, localSec) / safeMeasureDuration)) + 1
        let spanMeasures = loopWindow.endMeasure - loopWindow.startMeasure + 1
        let clampedInWindow = max(1, min(spanMeasures, measureInWindow))
        let absoluteMeasure = loopWindow.startMeasure + clampedInWindow - 1
        return max(1, min(maxMeasure, absoluteMeasure))
    }

    static func loopOsmdTimelineSec(
        localSec: Double,
        measureDurationSec: Double,
        loopWindow: EarTrainingPrecisionLoopWindow
    ) -> EarTrainingPrecisionLoopOsmdTimeline {
        let measureNumber = loopActiveMeasureNumber(
            localSec: localSec,
            measureDurationSec: measureDurationSec,
            loopWindow: loopWindow,
            maxMeasure: loopWindow.endMeasure
        )
        let measureInWindow = measureNumber - loopWindow.startMeasure + 1
        let offsetInMeasure = localSec - Double(measureInWindow - 1) * measureDurationSec
        let phraseTimelineSec = Double(measureNumber - 1) * measureDurationSec + offsetInMeasure
        return EarTrainingPrecisionLoopOsmdTimeline(
            measureNumber: measureNumber,
            phraseTimelineSec: phraseTimelineSec
        )
    }

    static func buildPrecisionNotesBySemitone(
        xmlText: String?,
        midiData: Data?,
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool,
        direction: EarTrainingLoopTransposeDirection,
        baseSemitone: Int = 0,
        resolveCalibratedStartSec: @escaping (Double) -> Double,
        practiceMode: Bool,
        practiceSpeedPercent: Int,
        classificationBpm: Int
    ) -> [Int: [EarTrainingPrecisionNote]] {
        let semitones = loopPracticeUniqueSemitones(direction: direction, baseSemitone: baseSemitone)
        var result: [Int: [EarTrainingPrecisionNote]] = [:]

        for semitone in semitones {
            var builtNotes: [EarTrainingPrecisionNote] = []
            if let midiData {
                if let buildResult = try? EarTrainingPrecisionMidi.buildFromMidi(
                    data: midiData,
                    bpm: bpm,
                    transposeOffset: semitone
                ) {
                    builtNotes = buildResult.notes
                }
            } else if let xmlText {
                builtNotes = EarTrainingPrecisionNotes.buildFromMusicXml(
                    musicXmlText: xmlText,
                    bpm: bpm,
                    beatsPerMeasure: beatsPerMeasure,
                    transposeOffset: semitone,
                    isSwing: isSwing
                ).notes
            }
            let calibrated = EarTrainingPrecisionNotes.calibrateNotes(
                notes: builtNotes,
                resolveCalibratedStartSec: resolveCalibratedStartSec,
                practiceMode: practiceMode,
                practiceSpeedPercent: practiceSpeedPercent,
                classificationBpm: classificationBpm
            )
            result[semitone] = calibrated
        }
        return result
    }

    private static func noteOverlapsLoopWindow(
        _ note: EarTrainingPrecisionNote,
        loopWindow: EarTrainingPrecisionLoopWindow
    ) -> Bool {
        let noteEndSec = note.startSec + note.durationSec
        return noteEndSec > loopWindow.startSec + 1e-9 && note.startSec < loopWindow.endSec - 1e-9
    }
}
