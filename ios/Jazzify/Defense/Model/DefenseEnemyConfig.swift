import CoreGraphics
import Foundation

struct DefenseEnemyTypeStats {
    let hpMult: Double
    let speedMult: Double
    let damageAdd: Int
    let intervalMult: Double
    let rangeMult: Double
    let knockbackMult: Double
}

struct ResolvedDefenseEnemyStats {
    let hp: Int
    let speedPxPerSec: Double
    let damage: Int
    let attackIntervalSec: Double
    let attackRangePx: Double
    let knockbackMult: Double
}

enum DefenseEnemyConfig {
    static let waveCount = 4
    static let waveHpMult: [Double] = [1, 1.5, 2.2, 3]
    static let waveSpawnIntervalMult: [Double] = [1, 0.85, 0.72, 0.6]
    static let hitFlashSec: TimeInterval = 0.15
    static let spMax = 5
    static let fireballSpeedPx: CGFloat = 520
    static let fireballDamageMult = 3
    static let fireballHitRadius: CGFloat = 28
    static let damagePopupSec: TimeInterval = 0.6
    static let damagePopupPoolSize = 16
    static let fireballPoolSize = 3
    static let knockbackImpulse: CGFloat = 320
    static let knockbackDecayTauSec: TimeInterval = 0.3
    static let noWaveStart: TimeInterval = -1
    static let noHitFlash: TimeInterval = -1
    static let groundY: CGFloat = 320
    static let attackLungeSec: TimeInterval = 0.36
    static let lungeDist: CGFloat = 22
    static let lungeHeight: CGFloat = 14
    static let impactSec: TimeInterval = 0.3
    static let impactHitbackSec: TimeInterval = 0.12
    static let slashSec: TimeInterval = 0.35
    static let noSlash: TimeInterval = -1
    static let flyingYOffset: CGFloat = 90
    static let noImpact: TimeInterval = -1
    static let playerImpactHitbackPt: CGFloat = 8

    static var battleDisplayScale: CGFloat { EarTrainingBattleStageKit.battleCharacterVisualScale }

    static func displaySpriteHeight(for type: DefenseEnemyType) -> CGFloat {
        type.spriteHeight * battleDisplayScale
    }

    static func displaySpriteWidth(for type: DefenseEnemyType) -> CGFloat {
        displaySpriteHeight(for: type) * type.aspectRatio
    }

    static var displayFlyingYOffset: CGFloat { flyingYOffset * battleDisplayScale }

    static func displayFlyingBobOffset(elapsedSec: TimeInterval, slotIndex: Int) -> CGFloat {
        flyingBobOffset(elapsedSec: elapsedSec, slotIndex: slotIndex) * battleDisplayScale
    }

    static func displayAttackFootOffset(attackElapsed: TimeInterval, flying: Bool) -> CGFloat {
        attackOffset(attackElapsed: attackElapsed, flying: flying).y * battleDisplayScale
    }

    static func displayCanvasDeltaFromFloor(_ logicalDelta: CGFloat) -> CGFloat {
        logicalDelta * battleDisplayScale
    }

    static func displayLayoutPt(_ base: CGFloat) -> CGFloat {
        base * battleDisplayScale
    }

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

    static let waveRosters: [[DefenseEnemyType]] = [
        [.slime, .bat, .mushroom, .slime],
        [.goblin, .wolf, .ghost, .goblin],
        [.skeleton, .mimic, .mushroom, .slime],
        [.golem, .wolf, .dragon, .bat],
    ]

    static let waveCumulativeRosters: [[DefenseEnemyType]] = {
        var cumulative: [[DefenseEnemyType]] = []
        for wave in 0..<waveRosters.count {
            var roster: [DefenseEnemyType] = []
            for w in 0...wave {
                roster.append(contentsOf: waveRosters[w])
            }
            cumulative.append(roster)
        }
        return cumulative
    }()

    static func waveIndex(elapsedSec: TimeInterval, surviveSeconds: TimeInterval) -> Int {
        guard surviveSeconds > 0 else { return 0 }
        let waveDurationSec = surviveSeconds / Double(waveCount)
        let index = Int(floor(elapsedSec / waveDurationSec))
        return min(waveCount - 1, max(0, index))
    }

    static func pickWaveEnemyType(waveIndex: Int, spawnCount: Int, cumulative: Bool = false) -> DefenseEnemyType {
        let rosters = cumulative ? waveCumulativeRosters : waveRosters
        let roster = rosters[safe: waveIndex] ?? rosters[0]
        return roster[spawnCount % roster.count]
    }

    static func waveHpMult(for waveIndex: Int) -> Double {
        waveHpMult[safe: waveIndex] ?? waveHpMult.last ?? 1
    }

    static func waveSpawnIntervalMult(for waveIndex: Int) -> Double {
        waveSpawnIntervalMult[safe: waveIndex] ?? waveSpawnIntervalMult.last ?? 1
    }

    static func slashDamage(waveIndex: Int, scaling: Bool) -> Int {
        scaling ? waveIndex + 1 : 1
    }

    static func resolveEnemyStats(
        type: DefenseEnemyType,
        difficulty: DefenseDifficultyDefinition,
        hpMult: Double = 1
    ) -> ResolvedDefenseEnemyStats {
        let stats = type.combatStats
        return ResolvedDefenseEnemyStats(
            hp: max(1, Int((Double(difficulty.enemyHp) * stats.hpMult * hpMult).rounded())),
            speedPxPerSec: difficulty.enemySpeedPxPerSec * stats.speedMult,
            damage: difficulty.enemyDamage + stats.damageAdd,
            attackIntervalSec: difficulty.attackIntervalSec * stats.intervalMult,
            attackRangePx: difficulty.attackRangePx * stats.rangeMult,
            knockbackMult: stats.knockbackMult
        )
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
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
    var combatStats: DefenseEnemyTypeStats {
        switch self {
        case .slime: return DefenseEnemyTypeStats(hpMult: 1.0, speedMult: 0.85, damageAdd: 0, intervalMult: 1.0, rangeMult: 1.0, knockbackMult: 1.1)
        case .bat: return DefenseEnemyTypeStats(hpMult: 0.6, speedMult: 1.6, damageAdd: 0, intervalMult: 0.8, rangeMult: 1.0, knockbackMult: 1.3)
        case .goblin: return DefenseEnemyTypeStats(hpMult: 1.0, speedMult: 1.1, damageAdd: 0, intervalMult: 0.9, rangeMult: 1.0, knockbackMult: 1.0)
        case .skeleton: return DefenseEnemyTypeStats(hpMult: 1.5, speedMult: 0.9, damageAdd: 0, intervalMult: 1.0, rangeMult: 1.0, knockbackMult: 0.9)
        case .ghost: return DefenseEnemyTypeStats(hpMult: 0.6, speedMult: 1.3, damageAdd: 0, intervalMult: 1.2, rangeMult: 1.0, knockbackMult: 1.2)
        case .mushroom: return DefenseEnemyTypeStats(hpMult: 1.2, speedMult: 0.7, damageAdd: 0, intervalMult: 1.3, rangeMult: 1.0, knockbackMult: 0.9)
        case .wolf: return DefenseEnemyTypeStats(hpMult: 1.0, speedMult: 1.5, damageAdd: 0, intervalMult: 0.7, rangeMult: 1.0, knockbackMult: 1.0)
        case .golem: return DefenseEnemyTypeStats(hpMult: 2.0, speedMult: 0.6, damageAdd: 1, intervalMult: 1.5, rangeMult: 1.0, knockbackMult: 0.45)
        case .mimic: return DefenseEnemyTypeStats(hpMult: 1.5, speedMult: 1.0, damageAdd: 0, intervalMult: 1.0, rangeMult: 1.0, knockbackMult: 0.7)
        case .dragon: return DefenseEnemyTypeStats(hpMult: 2.5, speedMult: 0.8, damageAdd: 1, intervalMult: 1.2, rangeMult: 1.4, knockbackMult: 0.5)
        }
    }

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
