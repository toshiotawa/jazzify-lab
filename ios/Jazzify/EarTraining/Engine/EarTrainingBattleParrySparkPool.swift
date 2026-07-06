import SpriteKit
import UIKit

/// Web `earTrainingBattleParrySparkPool.ts` 相当。128 スロットの粒子プール。
@MainActor
final class EarTrainingBattleParrySparkPool {
    private struct Slot {
        var active = false
        var parryStartedAt: TimeInterval = 0
        var centerX: CGFloat = 0
        var centerY: CGFloat = 0
        var dirX: CGFloat = 0
        var dirY: CGFloat = 0
        var size: CGFloat = 0
        var timeOffsetMs: Double = 0
        var radiusScale: CGFloat = 1
        let node: SKShapeNode
    }

    private var slots: [Slot]
    private let container = SKNode()

    init(parent: SKNode) {
        slots = (0..<EarTrainingBattleParryConstants.sparkPoolSize).map { _ in
            let node = SKShapeNode(circleOfRadius: 1)
            node.fillColor = EarTrainingBattleParryConstants.sparkColor
            node.strokeColor = .clear
            node.lineWidth = 0
            node.isHidden = true
            node.zPosition = 67
            return Slot(node: node)
        }
        container.zPosition = 67
        parent.addChild(container)
        for slot in slots {
            container.addChild(slot.node)
        }
    }

    var hasActiveSparks: Bool {
        slots.contains { $0.active }
    }

    @discardableResult
    func spawn(x: CGFloat, y: CGFloat, startedAt: TimeInterval, isChainParry: Bool) -> Int {
        let count = isChainParry ? 40 : 28
        let sizeMin: CGFloat = 1.5
        let sizeMax: CGFloat = isChainParry ? 4 : 3.5
        var spawned = 0

        for index in slots.indices where spawned < count {
            guard slots[index].active == false else { continue }
            let angle = Double.random(in: 0...(Double.pi * 2))
            slots[index].active = true
            slots[index].parryStartedAt = startedAt
            slots[index].centerX = x
            slots[index].centerY = y
            slots[index].dirX = CGFloat(cos(angle))
            slots[index].dirY = CGFloat(sin(angle))
            slots[index].size = sizeMin + CGFloat.random(in: 0...(sizeMax - sizeMin))
            slots[index].timeOffsetMs = Double.random(in: -25...25)
            slots[index].radiusScale = CGFloat.random(in: 0.88...1.12)
            slots[index].node.isHidden = false
            spawned += 1
        }
        return spawned
    }

    func update(now: TimeInterval, slowStartedAt: TimeInterval?) {
        let visualNow = EarTrainingBattleParryConstants.getVisualNow(
            now: now * 1000,
            slowStartedAt: slowStartedAt.map { $0 * 1000 }
        ) / 1000

        for index in slots.indices {
            guard slots[index].active else { continue }
            let slot = slots[index]
            let ageMs = (visualNow - slot.parryStartedAt) * 1000 + slot.timeOffsetMs
            if ageMs < 0 || ageMs >= EarTrainingBattleParryConstants.motionEndMs {
                slots[index].active = false
                slots[index].node.isHidden = true
                continue
            }

            let radius = EarTrainingBattleParryConstants.getParryEffectRadiusAtAge(ageMs) * slot.radiusScale
            let posX = slot.centerX + slot.dirX * radius
            let posY = slot.centerY + slot.dirY * radius
            let fadeT = ageMs / EarTrainingBattleParryConstants.motionEndMs
            let alpha = EarTrainingBattleParryConstants.getParryLingerAlpha(
                now: visualNow * 1000,
                groupStartedAt: slot.parryStartedAt * 1000,
                baseAlpha: 1 - fadeT * 0.4
            )
            let sparkSize = max(0.6, slot.size * (1 - fadeT * 0.35) * 0.4)

            slots[index].node.position = CGPoint(x: posX, y: posY)
            slots[index].node.alpha = CGFloat(max(0, alpha))
            slots[index].node.path = CGPath(
                ellipseIn: CGRect(x: -sparkSize, y: -sparkSize, width: sparkSize * 2, height: sparkSize * 2),
                transform: nil
            )
        }
    }

    func clear() {
        for index in slots.indices {
            slots[index].active = false
            slots[index].node.isHidden = true
        }
    }
}
