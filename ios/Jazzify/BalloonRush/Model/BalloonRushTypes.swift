import CoreGraphics
import Foundation

enum BalloonRushPhase: Equatable, Sendable {
    case playing
    case cleared
    case failed
}

struct BalloonRushBalloon: Identifiable, Sendable {
    let id: String
    var x: CGFloat
    var y: CGFloat
    let spawnedAtSec: TimeInterval
    let lifetimeSec: TimeInterval
    var popped: Bool
}

/// 描画用の軽量衝撃波（Web `ShockwaveBurst`）。
struct BalloonRushVisualShockwave: Identifiable, Sendable {
    let id: String
    let x: CGFloat
    let y: CGFloat
    let maxRadius: CGFloat
    let startPerfMs: Double
}

struct BalloonRushDrawSnapshot: Sendable {
    let playerX: CGFloat
    let playerY: CGFloat
    let playerDirection: SurvivalDirection8
    let balloons: [(id: String, x: CGFloat, y: CGFloat, visible: Bool)]
    let jajiiX: CGFloat?
    let jajiiY: CGFloat?
    let shockwaves: [BalloonRushVisualShockwave]
    let nowPerfMs: Double
}

struct BalloonRushUISnapshot: Equatable, Sendable {
    var phase: BalloonRushPhase
    var hintMode: Bool
    var timeLeftSec: Int
    var remainPop: Int
    var slots: [SurvivalCodeSlot]
    var hintSlotIndex: Int?
    var unpressedNoteOpacity: CGFloat
}
