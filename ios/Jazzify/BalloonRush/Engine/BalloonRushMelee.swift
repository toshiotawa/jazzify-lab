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
}
