import CoreGraphics
import Foundation

/// ジャ爺サポート（Web `SurvivalJajiiEngine.ts` と仕様同期）。
/// 追いついたら静止。プレイヤーが離れたときだけ1 leg 歩行。
enum SurvivalJajiiEngine {
    static let minRadius: CGFloat = 60
    static let maxRadius: CGFloat = 180
    static let followTriggerRadius: CGFloat = maxRadius
    static let arriveEps: CGFloat = 4
    static let miniDelaySec: TimeInterval = 2
    static let miniRadiusMultiplier: CGFloat = 1.0 / 2.0
    static let moveSpeedMultiplier: CGFloat = 0.8
    static let moveSlowdownWhilePending: CGFloat = 0.7
    /// demo_play: 出現時プレイヤー位置からの固定オフセット（やや右下）
    static let tutorialDemoOffsetX: CGFloat = 72
    static let tutorialDemoOffsetY: CGFloat = 56

    struct State: Sendable {
        var worldX: CGFloat
        var worldY: CGFloat
        var targetWorldX: CGFloat
        var targetWorldY: CGFloat
        var pendingMiniFireAtSec: TimeInterval?
    }

    static func shouldEnable(stage: SurvivalStageDefinition, scenario: SurvivalScenarioRuntimeState) -> Bool {
        if scenario.tutorialDialogueJajii {
            return true
        }
        guard !scenario.isActive else { return false }
        // 大譜表モード（両手ヴォイシングコース等）は lesson カテゴリでもジャ爺を有効化する。
        if stage.mapCategory == .lesson {
            return stage.grandStaffMode
        }
        return true
    }

    /// demo_play: 出現時のプレイヤー位置 + 固定オフセット（やや右下）でスポーン。以降ワールド座標固定。
    static func makeTutorialDemoFixed(playerX: CGFloat, playerY: CGFloat) -> State {
        let x = playerX + tutorialDemoOffsetX
        let y = playerY + tutorialDemoOffsetY
        return State(
            worldX: x,
            worldY: y,
            targetWorldX: x,
            targetWorldY: y,
            pendingMiniFireAtSec: nil
        )
    }

    static func makeInitial(playerX: CGFloat, playerY: CGFloat) -> State {
        let spawn = randomRingOffset(minR: minRadius, maxR: maxRadius)
        let target = pickDriftTargetNearPlayer(playerX: playerX, playerY: playerY)
        return State(
            worldX: playerX + spawn.x,
            worldY: playerY + spawn.y,
            targetWorldX: target.x,
            targetWorldY: target.y,
            pendingMiniFireAtSec: nil
        )
    }

    static func updateMovementInPlace(
        _ state: inout State,
        playerX: CGFloat,
        playerY: CGFloat,
        deltaSec: TimeInterval,
        moveSpeedPxPerSec: CGFloat = SurvivalConstants.playerSpeed * moveSpeedMultiplier
    ) {
        if isRestingAtTarget(state) {
            if distFromPlayer(state, playerX: playerX, playerY: playerY) <= followTriggerRadius {
                return
            }
            let next = pickDriftTargetNearPlayer(playerX: playerX, playerY: playerY)
            state.targetWorldX = next.x
            state.targetWorldY = next.y
        }

        var dx = state.targetWorldX - state.worldX
        var dy = state.targetWorldY - state.worldY
        var remaining = hypot(dx, dy)

        if remaining < arriveEps {
            state.worldX = state.targetWorldX
            state.worldY = state.targetWorldY
            return
        }

        let slowdown = state.pendingMiniFireAtSec != nil ? moveSlowdownWhilePending : 1
        let step = moveSpeedPxPerSec * CGFloat(deltaSec) * slowdown

        if remaining <= step {
            state.worldX = state.targetWorldX
            state.worldY = state.targetWorldY
        } else {
            state.worldX += dx / remaining * step
            state.worldY += dy / remaining * step
        }
    }

    static func worldPosition(state: State) -> CGPoint {
        CGPoint(x: state.worldX, y: state.worldY)
    }

    static func tryScheduleMiniSpecial(_ state: inout State, nowSec: TimeInterval) -> Bool {
        guard state.pendingMiniFireAtSec == nil else { return false }
        state.pendingMiniFireAtSec = nowSec + miniDelaySec
        return true
    }

    static func consumeDueMiniSpecialIfDue(_ state: inout State, nowSec: TimeInterval) -> Bool {
        guard let pending = state.pendingMiniFireAtSec else { return false }
        guard nowSec >= pending else { return false }
        state.pendingMiniFireAtSec = nil
        return true
    }

    // MARK: - Private helpers

    private static func isRestingAtTarget(_ state: State) -> Bool {
        hypot(state.targetWorldX - state.worldX, state.targetWorldY - state.worldY) < arriveEps
    }

    private static func distFromPlayer(_ state: State, playerX: CGFloat, playerY: CGFloat) -> CGFloat {
        hypot(state.worldX - playerX, state.worldY - playerY)
    }

    private static func randomRingOffset(minR: CGFloat, maxR: CGFloat) -> CGPoint {
        let angle = CGFloat.random(in: 0..<(CGFloat.pi * 2))
        let r = minR + CGFloat.random(in: 0...1) * (maxR - minR)
        return CGPoint(x: cos(angle) * r, y: sin(angle) * r)
    }

    private static func pickDriftTargetNearPlayer(playerX: CGFloat, playerY: CGFloat) -> CGPoint {
        let ring = randomRingOffset(minR: minRadius, maxR: maxRadius)
        return CGPoint(x: playerX + ring.x, y: playerY + ring.y)
    }
}
