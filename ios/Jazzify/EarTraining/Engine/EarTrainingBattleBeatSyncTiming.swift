import Foundation

/// Web `earTrainingBattleBeatSyncTiming.ts` 相当。
enum EarTrainingBattleBeatSyncTiming {
    static let targetOffsetSec: Double = 0.25
    private static let beatEps: Double = 1e-6

    struct Schedule: Equatable {
        let landingPhraseSec: Double
        let slowDurationMs: Double
        let slowPhaseMs: Double
        let ringExpandStartMs: Double
    }

    private static func beatDurationSec(bpm: Double) -> Double {
        60 / max(1, bpm)
    }

    private static func collectLandingCandidates(hitPhraseSec: Double, bpm: Double) -> [Double] {
        let beatDur = beatDurationSec(bpm: bpm)
        let hitBeat = hitPhraseSec / beatDur
        let startBeat = Int(floor(hitBeat + beatEps))
        let endBeat = Int(ceil(hitBeat + 2))
        var candidates: [Double] = []

        for beat in startBeat...endBeat {
            let onBeatSec = Double(beat) * beatDur
            if onBeatSec > hitPhraseSec + beatEps {
                candidates.append(onBeatSec)
            }
        }
        return candidates
    }

    static func resolveBeatSyncLandingSec(
        hitPhraseSec: Double,
        bpm: Double,
        targetOffsetSec: Double = targetOffsetSec
    ) -> Double {
        let targetSec = hitPhraseSec + targetOffsetSec
        let candidates = collectLandingCandidates(hitPhraseSec: hitPhraseSec, bpm: bpm)
        guard !candidates.isEmpty else {
            return hitPhraseSec + targetOffsetSec
        }

        var bestSec = candidates[0]
        var bestDistance = abs(bestSec - targetSec)

        for index in 1..<candidates.count {
            let candidateSec = candidates[index]
            let distance = abs(candidateSec - targetSec)
            if distance < bestDistance - beatEps {
                bestSec = candidateSec
                bestDistance = distance
                continue
            }
            if abs(distance - bestDistance) <= beatEps, candidateSec > bestSec {
                bestSec = candidateSec
                bestDistance = distance
            }
        }
        return bestSec
    }

    static func resolveParryBeatSyncSchedule(
        hitPhraseSec: Double,
        bpm: Double,
        targetOffsetSec: Double = targetOffsetSec
    ) -> Schedule {
        let landingPhraseSec = resolveBeatSyncLandingSec(
            hitPhraseSec: hitPhraseSec,
            bpm: bpm,
            targetOffsetSec: targetOffsetSec
        )
        let slowDurationMs = max(1, round((landingPhraseSec - hitPhraseSec) * 1000))
        return Schedule(
            landingPhraseSec: landingPhraseSec,
            slowDurationMs: slowDurationMs,
            slowPhaseMs: slowDurationMs,
            ringExpandStartMs: slowDurationMs + 1
        )
    }

    static func resolveParryBeatSyncScheduleOrFallback(
        hitPhraseSec: Double?,
        bpm: Double?,
        targetOffsetSec: Double = targetOffsetSec
    ) -> Schedule {
        guard let hitPhraseSec,
              let bpm,
              hitPhraseSec.isFinite,
              bpm.isFinite,
              bpm > 0 else {
            let fallbackMs = EarTrainingBattleParryConstants.slowPhaseMs
            return Schedule(
                landingPhraseSec: hitPhraseSec ?? 0,
                slowDurationMs: fallbackMs,
                slowPhaseMs: fallbackMs,
                ringExpandStartMs: fallbackMs + 1
            )
        }
        return resolveParryBeatSyncSchedule(
            hitPhraseSec: hitPhraseSec,
            bpm: bpm,
            targetOffsetSec: targetOffsetSec
        )
    }

    static func resolveParryZoomOutPhraseSec(
        hitPhraseSec: Double,
        nextTargetPhraseSec: Double?,
        bpm: Double
    ) -> Double {
        if let nextTargetPhraseSec,
           nextTargetPhraseSec.isFinite,
           nextTargetPhraseSec > hitPhraseSec + beatEps {
            return nextTargetPhraseSec
        }
        return resolveBeatSyncLandingSec(hitPhraseSec: hitPhraseSec, bpm: bpm)
    }

    static func resolvePhraseSecFromPerfAnchor(
        hitPhraseSec: Double,
        hitPerfSec: Double,
        nowSec: Double
    ) -> Double {
        hitPhraseSec + (nowSec - hitPerfSec)
    }

    static func resolveParryChainSlowDurationMs(
        hitPhraseSec: Double,
        zoomOutPhraseSec: Double,
        minDurationMs: Double
    ) -> Double {
        max(minDurationMs, round((zoomOutPhraseSec - hitPhraseSec) * 1000))
    }

    static func resolveParryZoomScaleAtPhraseSec(
        currentPhraseSec: Double,
        anchorPhraseSec: Double,
        zoomTarget: Double = EarTrainingBattleParryConstants.zoomTarget
    ) -> Double {
        let elapsed = currentPhraseSec - anchorPhraseSec
        if elapsed <= beatEps { return 1 }
        let t = min(1, elapsed / EarTrainingBattleParryConstants.zoomRampSec)
        return 1 + (zoomTarget - 1) * EarTrainingBattleParryConstants.easeCubicOut(t)
    }
}
