import CoreGraphics
import Foundation

/// Web `balloonRushMelee.ts` — B 列近接ヒット（風船向け）。
enum BalloonRushMelee {
    static func findBalloonsHitByMelee(
        player: SurvivalPlayerState,
        balloons: [BalloonRushBalloon]
    ) -> [String] {
        let baseRange: CGFloat = 80
        let totalRange = baseRange + CGFloat(player.skills.bRangeBonusLevel) * 20
        let dirVec = player.direction.vector
        let attackX = player.x + dirVec.dx * 40
        let attackY = player.y + dirVec.dy * 40

        var hit: [String] = []
        for b in balloons where !b.popped {
            let dx = b.x - attackX
            let dy = b.y - attackY
            let dist = hypot(dx, dy)
            let toX = b.x - player.x
            let toY = b.y - player.y
            let dot = toX * dirVec.dx + toY * dirVec.dy
            let isInFront = dot > 0
            let effectiveRange = isInFront ? totalRange : baseRange
            if dist < effectiveRange {
                hit.append(b.id)
            }
        }
        return hit
    }

    static func createMeleeShockwave(player: SurvivalPlayerState, now: TimeInterval) -> BalloonRushVisualShockwave {
        let baseRange: CGFloat = 80
        let totalRange = baseRange + CGFloat(player.skills.bRangeBonusLevel) * 20
        let dirVec = player.direction.vector
        let attackX = player.x + dirVec.dx * 40
        let attackY = player.y + dirVec.dy * 40
        return BalloonRushVisualShockwave(
            id: "br_brst_\(now)_\(Int.random(in: 0..<1_000_000))",
            x: attackX,
            y: attackY,
            maxRadius: totalRange,
            startPerfMs: now * 1000
        )
    }

    static func knockVelocityFromBurst(balloon: BalloonRushSpawn.Point, player: BalloonRushSpawn.Point, force: CGFloat) -> (vx: CGFloat, vy: CGFloat) {
        let dx = player.x - balloon.x
        let dy = player.y - balloon.y
        let dist = hypot(dx, dy)
        guard dist > 1e-3 else { return (0, 0) }
        return (dx / dist * force, dy / dist * force)
    }
}
