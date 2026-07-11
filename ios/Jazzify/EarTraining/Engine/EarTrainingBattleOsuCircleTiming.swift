import CoreGraphics
import Foundation
import QuartzCore

/// Web `earTrainingBattleOsuCircleTiming.ts` 相当。
enum EarTrainingBattleOsuCircleTiming {
    /// iOS バトルキャラ縮尺（`EarTrainingBattleScene.battleCharacterVisualScale`）に合わせる
    private static let visualScale: CGFloat = 2.0 / 3.0
    static let innerRadiusPx = EarTrainingBattleParryConstants.maxRadiusPx * visualScale
    static let outerStartRadiusPx = EarTrainingBattleParryConstants.maxRadiusPx * 2 * visualScale
    static let lineWidth: CGFloat = 3
    static let enterFraction: Double = 0.2
    static let enterOffsetPx: CGFloat = 48 * visualScale
    static let strokeAlpha: CGFloat = 0.5

    enum Phase: Equatable {
        case hidden
        case approach
        case locked
        case burst
        case dismissed
    }

    struct PerfTiming: Equatable {
        let judgedMs: Double
        let approachStartMs: Double
    }

    struct State: Equatable {
        let visible: Bool
        let phase: Phase
        let centerX: CGFloat
        let centerY: CGFloat
        let innerRadius: CGFloat
        let outerRadius: CGFloat
    }

    static func overlapOuterRadiusPx() -> CGFloat {
        innerRadiusPx + lineWidth
    }

    static func resolvePerfTiming(
        judgedPhraseTimeSec: Double,
        phraseTimeSec: Double,
        approachLeadSec: Double,
        wallNowMs: Double = CACurrentMediaTime() * 1000
    ) -> PerfTiming {
        let judgedMs = wallNowMs + (judgedPhraseTimeSec - phraseTimeSec) * 1000
        return PerfTiming(
            judgedMs: judgedMs,
            approachStartMs: judgedMs - approachLeadSec * 1000
        )
    }

    static func compute(
        nowMs: Double,
        approachStartMs: Double,
        judgedMs: Double,
        centerX: CGFloat,
        targetY: CGFloat,
        burstAtMs: Double? = nil,
        dismissed: Bool = false
    ) -> State {
        if dismissed {
            return State(
                visible: false,
                phase: .dismissed,
                centerX: centerX,
                centerY: targetY,
                innerRadius: innerRadiusPx,
                outerRadius: innerRadiusPx
            )
        }

        if let burstAtMs, nowMs >= burstAtMs {
            return State(
                visible: false,
                phase: .burst,
                centerX: centerX,
                centerY: targetY,
                innerRadius: innerRadiusPx,
                outerRadius: innerRadiusPx
            )
        }

        if nowMs < approachStartMs {
            return State(
                visible: false,
                phase: .hidden,
                centerX: centerX,
                centerY: targetY,
                innerRadius: innerRadiusPx,
                outerRadius: outerStartRadiusPx
            )
        }

        let beatMs = judgedMs - approachStartMs
        let approachT = beatMs > 0
            ? min(1, max(0, (nowMs - approachStartMs) / beatMs))
            : 1
        let enterT = min(1, approachT / enterFraction)
        let centerY = EarTrainingBattleParryConstants.lerp(
            targetY + enterOffsetPx,
            targetY,
            EarTrainingBattleParryConstants.easeCubicOut(enterT)
        )
        let overlapOuter = overlapOuterRadiusPx()

        if nowMs >= judgedMs {
            return State(
                visible: true,
                phase: .locked,
                centerX: centerX,
                centerY: centerY,
                innerRadius: innerRadiusPx,
                outerRadius: overlapOuter
            )
        }

        let outerRadius = EarTrainingBattleParryConstants.lerp(
            outerStartRadiusPx,
            overlapOuter,
            approachT
        )
        return State(
            visible: true,
            phase: .approach,
            centerX: centerX,
            centerY: centerY,
            innerRadius: innerRadiusPx,
            outerRadius: outerRadius
        )
    }
}
