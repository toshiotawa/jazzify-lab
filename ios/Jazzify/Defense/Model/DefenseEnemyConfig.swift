import CoreGraphics
import Foundation

enum DefenseEnemyConfig {
    static let groundY: CGFloat = 320
    static let attackLungeSec: TimeInterval = 0.36
    static let lungeDist: CGFloat = 22
    static let lungeHeight: CGFloat = 14
    static let impactSec: TimeInterval = 0.3
    static let impactHitbackSec: TimeInterval = 0.12
    static let flyingYOffset: CGFloat = 90
    static let noImpact: TimeInterval = -1

    static let sparkAngles: [CGFloat] = [
        0,
        .pi / 3,
        2 * .pi / 3,
        .pi,
        4 * .pi / 3,
        5 * .pi / 3,
    ]

    static func centerY(for type: DefenseEnemyType) -> CGFloat {
        let config = type.config
        if config.isFlying {
            return groundY - flyingYOffset
        }
        return groundY - config.spriteHeight / 2
    }

    static func spriteWidth(for type: DefenseEnemyType) -> CGFloat {
        let config = type.config
        return config.spriteHeight * config.aspectRatio
    }

    static func isAttacking(
        attackHitPending: Bool,
        elapsedSec: TimeInterval,
        attackStartedAt: TimeInterval
    ) -> Bool {
        attackHitPending || (attackStartedAt > 0 && elapsedSec - attackStartedAt < attackLungeSec)
    }

    static func attackOffset(attackElapsed: TimeInterval, flying: Bool) -> CGPoint {
        let p = attackElapsed / attackLungeSec
        if p <= 0 || p > 1 {
            return .zero
        }
        let height = flying ? lungeHeight * 0.5 : lungeHeight
        let dx = -lungeDist * sin(.pi * p)
        let dy = -height * sin(.pi * min(1, p * 2))
        return CGPoint(x: dx, y: dy)
    }

    static func pickFrame(
        elapsedSec: TimeInterval,
        slotIndex: Int,
        moving: Bool,
        flying: Bool,
        attacking: Bool
    ) -> DefenseEnemyFrame {
        if attacking { return .move }
        if flying || moving {
            let phase = Int(floor((elapsedSec + Double(slotIndex) * 0.1) / 0.25)) % 2
            return phase == 0 ? .idle : .move
        }
        return .idle
    }

    static func flyingBobOffset(elapsedSec: TimeInterval, slotIndex: Int) -> CGFloat {
        CGFloat(sin(elapsedSec * 4 + Double(slotIndex)) * 4)
    }
}

enum DefenseEnemyFrame: String {
    case idle
    case move
}

private struct DefenseEnemyTypeConfig {
    let spriteHeight: CGFloat
    let aspectRatio: CGFloat
    let isFlying: Bool
    let zDepth: CGFloat
}

extension DefenseEnemyType {
    fileprivate var config: DefenseEnemyTypeConfig {
        switch self {
        case .slime: return DefenseEnemyTypeConfig(spriteHeight: 40, aspectRatio: 256 / 159, isFlying: false, zDepth: 70)
        case .bat: return DefenseEnemyTypeConfig(spriteHeight: 40, aspectRatio: 256 / 228, isFlying: true, zDepth: 90)
        case .goblin: return DefenseEnemyTypeConfig(spriteHeight: 56, aspectRatio: 247 / 256, isFlying: false, zDepth: 60)
        case .skeleton: return DefenseEnemyTypeConfig(spriteHeight: 60, aspectRatio: 161 / 256, isFlying: false, zDepth: 50)
        case .ghost: return DefenseEnemyTypeConfig(spriteHeight: 56, aspectRatio: 229 / 256, isFlying: true, zDepth: 80)
        case .mushroom: return DefenseEnemyTypeConfig(spriteHeight: 56, aspectRatio: 233 / 256, isFlying: false, zDepth: 55)
        case .wolf: return DefenseEnemyTypeConfig(spriteHeight: 52, aspectRatio: 256 / 165, isFlying: false, zDepth: 40)
        case .golem: return DefenseEnemyTypeConfig(spriteHeight: 84, aspectRatio: 250 / 256, isFlying: false, zDepth: 20)
        case .mimic: return DefenseEnemyTypeConfig(spriteHeight: 52, aspectRatio: 256 / 229, isFlying: false, zDepth: 30)
        case .dragon: return DefenseEnemyTypeConfig(spriteHeight: 96, aspectRatio: 256 / 220, isFlying: false, zDepth: 10)
        }
    }

    var spriteHeight: CGFloat { config.spriteHeight }
    var aspectRatio: CGFloat { config.aspectRatio }
    var isFlying: Bool { config.isFlying }
    var zDepth: CGFloat { config.zDepth }

    func assetName(frame: DefenseEnemyFrame) -> String {
        "defense_enemy_\(rawValue)_\(frame.rawValue)"
    }
}
