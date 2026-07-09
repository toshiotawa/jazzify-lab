import CoreGraphics
import Foundation
import UIKit

/// Web `earTrainingBattleDrawState.ts` のパリィ定数・半径タイムライン。
struct ParryBeatSyncRuntime: Equatable {
    let slowPhaseMs: Double
    let ringExpandStartMs: Double
    let ringExpandEndMs: Double
    let effectFadeStartMs: Double
    let motionEndMs: Double

    static let `default` = ParryBeatSyncRuntime(
        slowPhaseMs: EarTrainingBattleParryConstants.slowPhaseMs,
        ringExpandStartMs: EarTrainingBattleParryConstants.ringExpandStartMs,
        ringExpandEndMs: EarTrainingBattleParryConstants.ringExpandEndMs,
        effectFadeStartMs: EarTrainingBattleParryConstants.effectFadeStartMs,
        motionEndMs: EarTrainingBattleParryConstants.motionEndMs
    )
}

enum EarTrainingBattleParryConstants {
    static let slowPhaseMs: Double = 250
    static let ringExpandStartMs: Double = 251
    static let ringExpandEndMs: Double = 750
    static let effectFadeStartMs: Double = 751
    static let motionEndMs: Double = 1000
    static let reflectHitMs: Double = 1
    static let totalMs: Double = 1000
    static let ringBaseSize: CGFloat = 72
    static let sparkStartRadiusPx: CGFloat = 4
    static let mergeRadiusPx: CGFloat = 34
    static let ringMaxScale: CGFloat = 2.45
    static let maxRadiusPx: CGFloat = (ringBaseSize * ringMaxScale) / 2
    static let lingerFadeStartMs: Double = effectFadeStartMs
    static let lingerFadeDurationMs: Double = motionEndMs - effectFadeStartMs
    static let visualSlowDurationMs: Double = slowPhaseMs
    static let visualSlowScale: Double = 0.22
    static let hitStopMs: Double = 64
    static let hitStopScale: Double = 0.04
    static let slashDurationMs: Double = 240
    static let sparkPoolSize = 128
    static let sparkColor = UIColor(red: 103 / 255, green: 232 / 255, blue: 249 / 255, alpha: 1)
    static let impactRingColor = UIColor(red: 103 / 255, green: 232 / 255, blue: 249 / 255, alpha: 0.88)
    static let finishPunchZoomTarget: CGFloat = 1.12
    static let finishPunchZoomInSec: TimeInterval = 0.064
    static let finishPunchZoomHoldSec: TimeInterval = 0.048
    static let finishPunchZoomOutSec: TimeInterval = 0.16

    static func easeCubicOut(_ t: Double) -> Double {
        1 - pow(1 - t, 3)
    }

    static func lerp(_ from: CGFloat, _ to: CGFloat, _ t: Double) -> CGFloat {
        from + (to - from) * CGFloat(t)
    }

    static func makeParryBeatSync(from schedule: EarTrainingBattleBeatSyncTiming.Schedule) -> ParryBeatSyncRuntime {
        ParryBeatSyncRuntime(
            slowPhaseMs: schedule.slowPhaseMs,
            ringExpandStartMs: schedule.ringExpandStartMs,
            ringExpandEndMs: ringExpandEndMs,
            effectFadeStartMs: effectFadeStartMs,
            motionEndMs: motionEndMs
        )
    }

    static func getParryEffectRadiusAtAge(_ ageMs: Double, beatSync: ParryBeatSyncRuntime = .default) -> CGFloat {
        if ageMs <= beatSync.slowPhaseMs {
            let t = ageMs / max(1, beatSync.slowPhaseMs)
            return lerp(sparkStartRadiusPx, mergeRadiusPx, easeCubicOut(t))
        }
        if ageMs <= beatSync.ringExpandEndMs {
            let t = (ageMs - beatSync.ringExpandStartMs)
                / max(1, beatSync.ringExpandEndMs - beatSync.ringExpandStartMs)
            return lerp(mergeRadiusPx, maxRadiusPx, easeCubicOut(t))
        }
        return maxRadiusPx
    }

    static func getParryLingerAlpha(
        now: Double,
        groupStartedAt: Double,
        baseAlpha: Double,
        beatSync: ParryBeatSyncRuntime = .default
    ) -> Double {
        let age = now - groupStartedAt
        if age < beatSync.effectFadeStartMs { return baseAlpha }
        let fadeT = min(1, (age - beatSync.effectFadeStartMs) / lingerFadeDurationMs)
        return baseAlpha * (1 - easeCubicOut(fadeT))
    }

    static func getParryLingerAlpha(now: Double, groupStartedAt: Double, baseAlpha: Double) -> Double {
        getParryLingerAlpha(now: now, groupStartedAt: groupStartedAt, baseAlpha: baseAlpha, beatSync: .default)
    }

    static func getParryEffectRadiusAtAge(_ ageMs: Double) -> CGFloat {
        getParryEffectRadiusAtAge(ageMs, beatSync: .default)
    }

    static func getParryRingScaleAtAge(_ ageMs: Double) -> CGFloat? {
        if ageMs < ringExpandStartMs { return nil }
        if ageMs <= ringExpandEndMs {
            let t = (ageMs - ringExpandStartMs) / (ringExpandEndMs - ringExpandStartMs)
            let ringMergeScale = (mergeRadiusPx * 2) / ringBaseSize
            return lerp(ringMergeScale, ringMaxScale, easeCubicOut(t))
        }
        return ringMaxScale
    }

    static func getVisualSlowCompensation(
        now: Double,
        slowStartedAt: Double?,
        durationMs: Double = visualSlowDurationMs,
        slowScale: Double = visualSlowScale
    ) -> Double {
        guard let slowStartedAt, now > slowStartedAt else { return 0 }
        let elapsed = now - slowStartedAt
        if elapsed >= durationMs {
            return durationMs * (1 - slowScale)
        }
        return elapsed * (1 - slowScale)
    }

    static func getVisualNow(
        now: Double,
        slowStartedAt: Double?,
        durationMs: Double = visualSlowDurationMs,
        slowScale: Double = visualSlowScale
    ) -> Double {
        now - getVisualSlowCompensation(
            now: now,
            slowStartedAt: slowStartedAt,
            durationMs: durationMs,
            slowScale: slowScale
        )
    }
}
