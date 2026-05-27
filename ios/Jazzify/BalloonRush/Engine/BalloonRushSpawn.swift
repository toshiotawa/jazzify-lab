import CoreGraphics
import Foundation

/// Web `balloonRushSpawn.ts` と同期。
enum BalloonRushSpawn {
    static let initialNearPlayerMinPx: CGFloat = 60
    static let initialNearPlayerMaxPx: CGFloat = 100
    static let initialFarFromPlayerMinPx: CGFloat = 140
    static let betweenBalloonsMinPx: CGFloat = 100
    static let respawnFromPlayerMinPx: CGFloat = 120
    static let mapMarginPx: CGFloat = 48

    struct Point: Sendable {
        var x: CGFloat
        var y: CGFloat
    }

    static func hypotDist(_ a: Point, _ b: Point) -> CGFloat {
        hypot(a.x - b.x, a.y - b.y)
    }

    private static func clampToMap(x: CGFloat, y: CGFloat, margin: CGFloat) -> Point {
        Point(
            x: min(BalloonRushMap.width - margin, max(margin, x)),
            y: min(BalloonRushMap.height - margin, max(margin, y))
        )
    }

    private static func randomInRing(
        cx: CGFloat,
        cy: CGFloat,
        minR: CGFloat,
        maxR: CGFloat,
        margin: CGFloat,
        rng: () -> CGFloat
    ) -> Point {
        let r = minR + rng() * (maxR - minR)
        let ang = rng() * .pi * 2
        return clampToMap(x: cx + cos(ang) * r, y: cy + sin(ang) * r, margin: margin)
    }

    static func pickInitialFivePositions(player: Point, margin: CGFloat, rng: () -> CGFloat) -> [Point] {
        var out: [Point] = []
        let first = randomInRing(
            cx: player.x,
            cy: player.y,
            minR: initialNearPlayerMinPx,
            maxR: initialNearPlayerMaxPx,
            margin: margin,
            rng: rng
        )
        out.append(first)

        for _ in 0..<4 {
            var cand = first
            for _ in 0..<60 {
                let sx = margin + rng() * (BalloonRushMap.width - margin * 2)
                let sy = margin + rng() * (BalloonRushMap.height - margin * 2)
                let trial = clampToMap(x: sx, y: sy, margin: margin)
                if hypotDist(player, trial) < initialFarFromPlayerMinPx { continue }
                var ok = true
                for o in out where hypotDist(trial, o) < betweenBalloonsMinPx {
                    ok = false
                    break
                }
                if ok {
                    cand = trial
                    break
                }
            }
            out.append(cand)
        }
        return out
    }

    static func pickRespawnPosition(
        player: Point,
        existing: [Point],
        margin: CGFloat,
        rng: () -> CGFloat
    ) -> Point? {
        for _ in 0..<120 {
            let sx = margin + rng() * (BalloonRushMap.width - margin * 2)
            let sy = margin + rng() * (BalloonRushMap.height - margin * 2)
            let trial = clampToMap(x: sx, y: sy, margin: margin)
            if hypotDist(player, trial) < respawnFromPlayerMinPx { continue }
            var ok = true
            for o in existing where hypotDist(trial, o) < betweenBalloonsMinPx {
                ok = false
                break
            }
            if ok { return trial }
        }
        return nil
    }
}
