import Foundation

/// Web `earTrainingChordOsmd.ts` の OSMD タイミング定数。
enum EarTrainingChordOsmdTiming {
    static let judgmentWindowEarlySec: Double = 0.12
    static let judgmentWindowLateSec: Double = 0.15
    static let approachLeadBeats: Double = 1
    static let hammerLeadMeasuresDefault = 1
    static let hammerImpactOffsetSec: Double = 0.3

    static func approachLeadSec(bpm: Double) -> Double {
        (60 / max(1, bpm)) * approachLeadBeats
    }

    static func hammerLeadBeats(beatsPerMeasure: Int, leadMeasures: Int = hammerLeadMeasuresDefault) -> Double {
        Double(max(1, leadMeasures) * max(1, beatsPerMeasure))
    }

    static func hammerLeadSec(
        bpm: Double,
        beatsPerMeasure: Int,
        leadMeasures: Int = hammerLeadMeasuresDefault
    ) -> Double {
        (60 / max(1, bpm)) * hammerLeadBeats(beatsPerMeasure: beatsPerMeasure, leadMeasures: leadMeasures)
    }

    static func isWithinJudgmentWindow(
        phraseTimeSec: Double,
        judgedTargetTimeSec: Double,
        earlySec: Double = judgmentWindowEarlySec,
        lateSec: Double = judgmentWindowLateSec
    ) -> Bool {
        let delta = phraseTimeSec - judgedTargetTimeSec
        return delta >= -earlySec && delta <= lateSec
    }

    static func pickNearestTargetIndex(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        canMatchTarget: (Int) -> Bool,
        earlySec: Double = judgmentWindowEarlySec,
        lateSec: Double = judgmentWindowLateSec
    ) -> Int? {
        var bestIndex: Int?
        var bestAbsDelta = Double.infinity
        for index in 0..<targetCount {
            guard canMatchTarget(index) else { continue }
            let judged = judgedTargetTimeSec(index)
            let delta = phraseTimeSec - judged
            guard delta >= -earlySec, delta <= lateSec else { continue }
            let absDelta = abs(delta)
            if absDelta < bestAbsDelta {
                bestAbsDelta = absDelta
                bestIndex = index
            }
        }
        return bestIndex
    }
}
