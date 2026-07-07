import Foundation

/// Web `isLastChordOsmdTargetInMeasure` 相当の小節内最終ターゲット判定。
struct EarTrainingChordOsmdRhythmTargetRef: Equatable {
    let targetTimeSec: Double
    let measureNumber: Int
    let orderIndex: Int
}

enum EarTrainingChordOsmdRhythm {
    static func noteHitRatio(
        expectedMidiCounts: [Int: Int],
        remainingMidiCounts: [Int: Int]
    ) -> Double {
        let expected = expectedMidiCounts.values.reduce(0, +)
        guard expected > 0 else { return 1 }
        let remaining = remainingMidiCounts.values.reduce(0, +)
        return Double(expected - remaining) / Double(expected)
    }

    static func isLastTargetInMeasure(
        targets: [EarTrainingChordOsmdRhythmTargetRef],
        target: EarTrainingChordOsmdRhythmTargetRef
    ) -> Bool {
        var latestTimeSec = target.targetTimeSec
        var latestOrderIndex = target.orderIndex

        for candidate in targets where candidate.measureNumber == target.measureNumber {
            if candidate.targetTimeSec > latestTimeSec + 1e-9 {
                latestTimeSec = candidate.targetTimeSec
                latestOrderIndex = candidate.orderIndex
                continue
            }
            if abs(candidate.targetTimeSec - latestTimeSec) <= 1e-9,
               candidate.orderIndex > latestOrderIndex {
                latestOrderIndex = candidate.orderIndex
            }
        }

        return abs(target.targetTimeSec - latestTimeSec) <= 1e-9
            && target.orderIndex == latestOrderIndex
    }
}
