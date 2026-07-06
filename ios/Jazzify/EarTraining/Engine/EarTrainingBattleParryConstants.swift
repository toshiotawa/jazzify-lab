import CoreGraphics
import Foundation
import UIKit

/// Web `earTrainingBattleDrawState.ts` のパリィ定数・半径タイムライン。
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
    static let ringMergeScale: CGFloat = (mergeRadiusPx * 2) / ringBaseSize
    static let ringMaxScale: CGFloat = 2.45
    static let maxRadiusPx: CGFloat = (ringBaseSize * ringMaxScale) / 2
    static let lingerFadeStartMs: Double = effectFadeStartMs
    static let lingerFadeDurationMs: Double = motionEndMs - effectFadeStartMs
    static let visualSlowDurationMs: Double = slowPhaseMs
    static let visualSlowScale: Double = 0.22
    static let slashDurationMs: Double = 240
    static let sparkPoolSize = 128
    static let sparkColor = UIColor(red: 251 / 255, green: 146 / 255, blue: 60 / 255, alpha: 1)
    static let ringOrange = UIColor(red: 251 / 255, green: 146 / 255, blue: 60 / 255, alpha: 0.85)
    static let parryCameraZoomTarget: CGFloat = 1.012
    static let parryCameraZoomInSec: TimeInterval = 0.02
    static let parryCameraZoomOutSec: TimeInterval = 0.08

    static func easeCubicOut(_ t: Double) -> Double {
        1 - pow(1 - t, 3)
    }

    static func lerp(_ from: CGFloat, _ to: CGFloat, _ t: Double) -> CGFloat {
        from + (to - from) * CGFloat(t)
    }

    static func getParryLingerAlpha(now: Double, groupStartedAt: Double, baseAlpha: Double) -> Double {
        let age = now - groupStartedAt
        if age < lingerFadeStartMs { return baseAlpha }
        let fadeT = min(1, (age - lingerFadeStartMs) / lingerFadeDurationMs)
        return baseAlpha * (1 - easeCubicOut(fadeT))
    }

    static func getParryEffectRadiusAtAge(_ ageMs: Double) -> CGFloat {
        if ageMs <= ringExpandStartMs {
            let t = ageMs / ringExpandStartMs
            return lerp(sparkStartRadiusPx, mergeRadiusPx, easeCubicOut(t))
        }
        if ageMs <= ringExpandEndMs {
            let t = (ageMs - ringExpandStartMs) / (ringExpandEndMs - ringExpandStartMs)
            return lerp(mergeRadiusPx, maxRadiusPx, easeCubicOut(t))
        }
        return maxRadiusPx
    }

    static func getParryRingScaleAtAge(_ ageMs: Double) -> CGFloat? {
        if ageMs < ringExpandStartMs { return nil }
        if ageMs <= ringExpandEndMs {
            let t = (ageMs - ringExpandStartMs) / (ringExpandEndMs - ringExpandStartMs)
            return lerp(ringMergeScale, ringMaxScale, easeCubicOut(t))
        }
        return ringMaxScale
    }

    static func getVisualSlowCompensation(now: Double, slowStartedAt: Double?) -> Double {
        guard let slowStartedAt, now > slowStartedAt else { return 0 }
        let elapsed = now - slowStartedAt
        if elapsed >= visualSlowDurationMs {
            return visualSlowDurationMs * (1 - visualSlowScale)
        }
        return elapsed * (1 - visualSlowScale)
    }

    static func getVisualNow(now: Double, slowStartedAt: Double?) -> Double {
        now - getVisualSlowCompensation(now: now, slowStartedAt: slowStartedAt)
    }
}
