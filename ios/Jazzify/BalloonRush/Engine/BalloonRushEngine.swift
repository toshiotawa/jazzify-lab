import Foundation

/// Web `balloonRushEngine.ts` と同期。
enum BalloonRushEngine {
    private static let blinkWindowSec: TimeInterval = 2
    private static let blinkPeriodSec: TimeInterval = 0.5
    private static let blinkCount = 4

    static func balloonAgeSec(_ b: BalloonRushBalloon, nowGameSec: TimeInterval) -> TimeInterval {
        max(0, nowGameSec - b.spawnedAtSec)
    }

    static func isExpired(_ b: BalloonRushBalloon, nowGameSec: TimeInterval) -> Bool {
        balloonAgeSec(b, nowGameSec: nowGameSec) >= b.lifetimeSec - 1e-6
    }

    static func blinkVisible(_ b: BalloonRushBalloon, nowGameSec: TimeInterval) -> Bool {
        let age = balloonAgeSec(b, nowGameSec: nowGameSec)
        let left = b.lifetimeSec - age
        if left > blinkWindowSec { return true }
        if left <= 0 { return false }
        let blinkPhase = blinkWindowSec - left
        let idx = min(blinkCount - 1, Int(floor(blinkPhase / blinkPeriodSec)))
        return idx % 2 == 0
    }
}
