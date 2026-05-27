import CoreGraphics
import Foundation

/// B 列正解フレームで鳴らす音（ルート + 風船破裂 SE）。
struct BalloonRushFrameAudio: Equatable, Sendable {
    var rootMidi: Int?
    var balloonPopCount: Int = 0
}

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

struct BalloonRushDrawSnapshot: Sendable {
    let playerX: CGFloat
    let playerY: CGFloat
    let playerDirection: SurvivalDirection8
    let balloons: [(id: String, x: CGFloat, y: CGFloat, visible: Bool)]
    let jajiiX: CGFloat?
    let jajiiY: CGFloat?
    let nowPerfMs: Double
}

/// SpriteKit 描画用（`SurvivalStageRuntime.balloonRushBalloons`）。
struct SurvivalBalloonRenderState: Sendable {
    let id: String
    let x: CGFloat
    let y: CGFloat
    let visible: Bool
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
