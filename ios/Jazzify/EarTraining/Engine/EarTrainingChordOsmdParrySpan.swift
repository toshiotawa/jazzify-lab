import Foundation

/// Web `ChordOsmdRhythmTarget` / `resolveChordOsmdParrySpanState` 相当。
struct EarTrainingChordOsmdParryTarget: Equatable {
    let id: UUID
    let measureNumber: Int
    let targetTimeSec: Double
    let orderIndex: Int
}

struct EarTrainingChordOsmdParrySpanAnchor: Equatable {
    let id: UUID
    let measureNumber: Int
    let targetTimeSec: Double
    let orderIndex: Int
}

struct EarTrainingChordOsmdParrySpanState: Equatable {
    let anchor: EarTrainingChordOsmdParrySpanAnchor
    let finishTarget: EarTrainingChordOsmdParryTarget?
    let isFinish: Bool
    let extendVisualSlow: Bool
}

enum EarTrainingChordOsmdParrySpan {
    private static let eps: Double = 1e-9
    private static let swingLongEighthRatio = 3.0 / 4.0

    static func toAnchor(_ target: EarTrainingChordOsmdParryTarget) -> EarTrainingChordOsmdParrySpanAnchor {
        EarTrainingChordOsmdParrySpanAnchor(
            id: target.id,
            measureNumber: target.measureNumber,
            targetTimeSec: target.targetTimeSec,
            orderIndex: target.orderIndex
        )
    }

    static func resolveFinishMeasure(anchorMeasureNumber: Int, spanMeasures: Int) -> Int {
        anchorMeasureNumber + max(1, spanMeasures)
    }

    static func resolveFinishBeatInMeasure(anchorBeatInMeasure: Int) -> Int {
        anchorBeatInMeasure > 1 ? anchorBeatInMeasure - 1 : 1
    }

    private static func applySwingToBeatIndex(_ beatIndex: Double) -> Double {
        let beatWhole = floor(beatIndex + 1e-6)
        let fraction = beatIndex - beatWhole
        if abs(fraction - 0.5) < 1e-6 {
            return beatWhole + swingLongEighthRatio
        }
        return beatIndex
    }

    static func lyricTargetTimeSec(
        measureNumber: Int,
        beatStartInMeasure: Double,
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> Double {
        let beatDurationSec = 60 / max(1, bpm)
        let bpmSafe = max(1, beatsPerMeasure)
        let measureIndex = max(0, measureNumber - 1)
        let rawBeatIndex = max(0, beatStartInMeasure - 1)
        let beatIndex = isSwing ? applySwingToBeatIndex(rawBeatIndex) : rawBeatIndex
        return (Double(measureIndex * bpmSafe) + beatIndex) * beatDurationSec
    }

    private static func beatEndSec(
        measureNumber: Int,
        beatStartInMeasure: Int,
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> Double {
        if beatStartInMeasure < beatsPerMeasure {
            return lyricTargetTimeSec(
                measureNumber: measureNumber,
                beatStartInMeasure: Double(beatStartInMeasure + 1),
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
        }
        return lyricTargetTimeSec(
            measureNumber: measureNumber + 1,
            beatStartInMeasure: 1,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing
        )
    }

    static func resolveBeatInMeasure(
        measureNumber: Int,
        targetTimeSec: Double,
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> Int {
        for beat in stride(from: beatsPerMeasure, through: 1, by: -1) {
            let beatStartSec = lyricTargetTimeSec(
                measureNumber: measureNumber,
                beatStartInMeasure: Double(beat),
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
            if targetTimeSec + eps >= beatStartSec {
                return beat
            }
        }
        return 1
    }

    static func resolveSpanEndSec(
        anchor: EarTrainingChordOsmdParrySpanAnchor,
        spanMeasures: Int,
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> Double {
        let anchorBeat = resolveBeatInMeasure(
            measureNumber: anchor.measureNumber,
            targetTimeSec: anchor.targetTimeSec,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing
        )
        let finishMeasure = resolveFinishMeasure(
            anchorMeasureNumber: anchor.measureNumber,
            spanMeasures: spanMeasures
        )
        let finishBeat = resolveFinishBeatInMeasure(anchorBeatInMeasure: anchorBeat)
        return beatEndSec(
            measureNumber: finishMeasure,
            beatStartInMeasure: finishBeat,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing
        )
    }

    private static func isLaterTarget(
        _ candidate: EarTrainingChordOsmdParryTarget,
        than last: EarTrainingChordOsmdParryTarget
    ) -> Bool {
        if candidate.targetTimeSec > last.targetTimeSec + eps {
            return true
        }
        return abs(candidate.targetTimeSec - last.targetTimeSec) <= eps
            && candidate.orderIndex > last.orderIndex
    }

    static func findLastTargetInSpan(
        targets: [EarTrainingChordOsmdParryTarget],
        anchor: EarTrainingChordOsmdParrySpanAnchor,
        spanMeasures: Int,
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> EarTrainingChordOsmdParryTarget? {
        let spanEndSec = resolveSpanEndSec(
            anchor: anchor,
            spanMeasures: spanMeasures,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing
        )
        var last: EarTrainingChordOsmdParryTarget?
        for candidate in targets {
            if candidate.targetTimeSec + eps < anchor.targetTimeSec { continue }
            if candidate.targetTimeSec >= spanEndSec - eps { continue }
            if last == nil || isLaterTarget(candidate, than: last!) {
                last = candidate
            }
        }
        return last
    }

    static func isTargetInSpan(
        target: EarTrainingChordOsmdParryTarget,
        anchor: EarTrainingChordOsmdParrySpanAnchor,
        spanEndSec: Double
    ) -> Bool {
        target.targetTimeSec >= anchor.targetTimeSec - eps
            && target.targetTimeSec < spanEndSec - eps
    }

    static func resolveSpanState(
        targets: [EarTrainingChordOsmdParryTarget],
        target: EarTrainingChordOsmdParryTarget,
        chainAnchor: EarTrainingChordOsmdParrySpanAnchor?,
        spanMeasures: Int,
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool
    ) -> EarTrainingChordOsmdParrySpanState {
        var activeAnchor = chainAnchor
        if let currentAnchor = activeAnchor {
            let previousSpanEndSec = resolveSpanEndSec(
                anchor: currentAnchor,
                spanMeasures: spanMeasures,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
            if target.targetTimeSec >= previousSpanEndSec - eps {
                activeAnchor = nil
            }
        }

        let hadChain = activeAnchor != nil
        if activeAnchor == nil {
            activeAnchor = toAnchor(target)
        }

        let anchor = activeAnchor!
        let spanEndSec = resolveSpanEndSec(
            anchor: anchor,
            spanMeasures: spanMeasures,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing
        )
        let finishTarget = findLastTargetInSpan(
            targets: targets,
            anchor: anchor,
            spanMeasures: spanMeasures,
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing
        )
        let isFinish = finishTarget?.id == target.id
        let extendVisualSlow = hadChain
            && !isFinish
            && finishTarget != nil
            && isTargetInSpan(target: target, anchor: anchor, spanEndSec: spanEndSec)
            && target.id != anchor.id

        return EarTrainingChordOsmdParrySpanState(
            anchor: anchor,
            finishTarget: finishTarget,
            isFinish: isFinish,
            extendVisualSlow: extendVisualSlow
        )
    }
}
