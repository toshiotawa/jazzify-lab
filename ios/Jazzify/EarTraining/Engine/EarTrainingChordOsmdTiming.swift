import Foundation

/// Web `earTrainingChordOsmd.ts` の OSMD タイミング定数。
enum EarTrainingChordOsmdTiming {
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
}
