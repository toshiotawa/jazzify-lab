import Foundation

enum DefenseSeparateTracksPhraseBars: Int {
    case one = 1
    case two = 2
    case four = 4
}

struct DefenseSeparateTracksGrid: Equatable {
    let cycleFrames: Int
    let cyclesPerForm: Int
    let bgmFrames: Int
    let sampleRate: Double
    let phraseBars: DefenseSeparateTracksPhraseBars
    let progressionBars: Int
    let playbackRatio: Double
}

struct DefensePhraseLoopWindow: Equatable {
    let rank: Int
    let startMeasure: Int
    let endMeasure: Int
    let sourceStartFrame: Int
    let sourceEndFrame: Int
}

struct DefensePhraseSchedule: Equatable {
    let targetCycle: Int
    let phraseIndex: Int
    let revision: Int
    let generation: UInt64
}

enum DefenseSeparateTracksTransport {
    static func idealCycleFrames(
        sampleRate: Double,
        bpm: Double,
        beatsPerBar: Int,
        phraseBars: Int,
        playbackRatio: Double
    ) -> Double {
        let safeFs = max(1.0, sampleRate)
        let safeBpm = max(1.0, bpm)
        let safeBeats = max(1, beatsPerBar)
        let safeK = max(1, phraseBars)
        let safeRatio = max(0.0001, playbackRatio)
        return safeFs * 60.0 / safeBpm * Double(safeBeats) * Double(safeK) / safeRatio
    }

    static func computeGrid(
        sampleRate: Double,
        bpm: Double,
        beatsPerBar: Int,
        phraseBars: DefenseSeparateTracksPhraseBars,
        progressionBars: Int,
        playbackRatio: Double
    ) -> DefenseSeparateTracksGrid {
        let cycleFrames = max(1, Int(idealCycleFrames(
            sampleRate: sampleRate,
            bpm: bpm,
            beatsPerBar: beatsPerBar,
            phraseBars: phraseBars.rawValue,
            playbackRatio: playbackRatio
        ).rounded()))
        let safeN = max(1, progressionBars)
        let cyclesPerForm = max(1, safeN / phraseBars.rawValue)
        return DefenseSeparateTracksGrid(
            cycleFrames: cycleFrames,
            cyclesPerForm: cyclesPerForm,
            bgmFrames: cyclesPerForm * cycleFrames,
            sampleRate: sampleRate,
            phraseBars: phraseBars,
            progressionBars: safeN,
            playbackRatio: playbackRatio
        )
    }

    static func measureSourceFrame(
        measureNumber: Int,
        bpm: Double,
        beatsPerBar: Int,
        sampleRate: Double
    ) -> Int {
        let safeMeasure = max(0, measureNumber)
        let safeBpm = max(1.0, bpm)
        let safeBeats = max(1, beatsPerBar)
        let safeFs = max(1.0, sampleRate)
        return Int(((Double(safeMeasure) * Double(safeBeats) * 60.0 / safeBpm) * safeFs).rounded())
    }

    static func isSourceFrameCountValid(actualFrames: Int, expectedFrames: Int) -> Bool {
        abs(actualFrames - expectedFrames) <= 1
    }

    static func phraseLoopWindow(
        rank: Int,
        phraseBars: DefenseSeparateTracksPhraseBars,
        bpm: Double,
        beatsPerBar: Int,
        sampleRate: Double
    ) -> DefensePhraseLoopWindow {
        let startMeasure = rank * phraseBars.rawValue + 1
        let endMeasure = (rank + 1) * phraseBars.rawValue
        return DefensePhraseLoopWindow(
            rank: rank,
            startMeasure: startMeasure,
            endMeasure: endMeasure,
            sourceStartFrame: measureSourceFrame(
                measureNumber: startMeasure - 1,
                bpm: bpm,
                beatsPerBar: beatsPerBar,
                sampleRate: sampleRate
            ),
            sourceEndFrame: measureSourceFrame(
                measureNumber: endMeasure,
                bpm: bpm,
                beatsPerBar: beatsPerBar,
                sampleRate: sampleRate
            )
        )
    }

    static func planPhraseReservation(
        absoluteCycle: Int,
        phaseFrame: Int,
        cycleFrames: Int,
        leadFrames: Int,
        phraseIndex: Int,
        revision: Int,
        generation: UInt64
    ) -> DefensePhraseSchedule {
        let safeF = max(1, cycleFrames)
        let safeLead = max(0, leadFrames)
        var targetCycle = absoluteCycle + 1
        var remaining = safeF - max(0, min(phaseFrame, safeF))
        while remaining < safeLead {
            targetCycle += 1
            remaining += safeF
        }
        return DefensePhraseSchedule(
            targetCycle: targetCycle,
            phraseIndex: phraseIndex,
            revision: revision,
            generation: generation
        )
    }

    static func beatInForm(
        absoluteCycle: Int,
        phaseFrame: Int,
        cycleFrames: Int,
        phraseBars: Int,
        beatsPerBar: Int,
        cyclesPerForm: Int
    ) -> Double {
        let safeF = max(1, cycleFrames)
        let safeQ = max(1, cyclesPerForm)
        let safeK = max(1, phraseBars)
        let safeBeats = max(1, beatsPerBar)
        let cycleInForm = ((absoluteCycle % safeQ) + safeQ) % safeQ
        let fraction = Double(max(0, min(phaseFrame, safeF))) / Double(safeF)
        return (Double(cycleInForm) * Double(safeK) + fraction * Double(safeK)) * Double(safeBeats)
    }

    static func bgmReadFrame(
        absoluteCycle: Int,
        phaseFrame: Int,
        cycleFrames: Int,
        cyclesPerForm: Int
    ) -> Int {
        let safeF = max(1, cycleFrames)
        let safeQ = max(1, cyclesPerForm)
        let cycleInForm = ((absoluteCycle % safeQ) + safeQ) % safeQ
        let safePhase = max(0, min(phaseFrame, safeF - 1))
        return cycleInForm * safeF + safePhase
    }
}
