import SpriteKit
import UIKit

/// Web `earTrainingBattleParrySparkPool.ts` 相当。溶接工場風の粒火花プール。
@MainActor
final class EarTrainingBattleParrySparkPool {
    private struct Slot {
        var active = false
        var startedAt: TimeInterval = 0
        var durationMs: Double = 0
        var originX: CGFloat = 0
        var originY: CGFloat = 0
        var vx: CGFloat = 0
        var vy: CGFloat = 0
        var size: CGFloat = 0
        var colorIndex = 0
        let node: SKShapeNode
    }

    private var slots: [Slot]
    private let container = SKNode()
    private let colors: [UIColor] = [
        UIColor(red: 1, green: 0.984, blue: 0.922, alpha: 1),
        UIColor(red: 0.996, green: 0.941, blue: 0.541, alpha: 1),
        UIColor(red: 0.992, green: 0.878, blue: 0.278, alpha: 1),
        UIColor(red: 0.984, green: 0.573, blue: 0.235, alpha: 1),
        UIColor(red: 0.992, green: 0.729, blue: 0.455, alpha: 1),
    ]

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
    func spawn(
        x: CGFloat,
        y: CGFloat,
        startedAt: TimeInterval,
        isChainParry: Bool
    ) -> Int {
        let count = isChainParry
            ? EarTrainingBattleParryConstants.sparkChainCount
            : EarTrainingBattleParryConstants.sparkCount
        var spawned = 0

        for index in slots.indices where spawned < count {
            guard slots[index].active == false else { continue }
            let angleSpreadHalf = EarTrainingBattleParryConstants.sparkAngleSpread / 2
            let angle = EarTrainingBattleParryConstants.sparkAngleUpBias
                + CGFloat.random(in: -angleSpreadHalf...angleSpreadHalf)
            let speed = CGFloat.random(
                in: EarTrainingBattleParryConstants.sparkSpeedMin...EarTrainingBattleParryConstants.sparkSpeedMax
            )
            slots[index].active = true
            slots[index].startedAt = startedAt
            slots[index].durationMs = EarTrainingBattleParryConstants.sparkDurationMs
                + Double.random(
                    in: -EarTrainingBattleParryConstants.sparkDurationJitterMs...EarTrainingBattleParryConstants.sparkDurationJitterMs
                )
            slots[index].originX = x
            slots[index].originY = y
            slots[index].vx = cos(angle) * speed
            slots[index].vy = sin(angle) * speed
            slots[index].size = CGFloat.random(
                in: EarTrainingBattleParryConstants.sparkSizeMin...EarTrainingBattleParryConstants.sparkSizeMax
            )
            slots[index].colorIndex = Int.random(in: 0..<colors.count)
            slots[index].node.fillColor = colors[slots[index].colorIndex]
            slots[index].node.isHidden = false
            spawned += 1
        }
        return spawned
    }

    func update(now: TimeInterval) {
        for index in slots.indices {
            guard slots[index].active else { continue }
            let slot = slots[index]
            let ageMs = (now - slot.startedAt) * 1000
            if ageMs < 0 || ageMs >= slot.durationMs {
                slots[index].active = false
                slots[index].node.isHidden = true
                continue
            }

            let t = ageMs / slot.durationMs
            let gravity = EarTrainingBattleParryConstants.sparkGravity
            let posX = slot.originX + slot.vx * ageMs
            let posY = slot.originY + slot.vy * ageMs + 0.5 * gravity * ageMs * ageMs
            let alpha = (1 - t) * (1 - t * 0.35)
            let sparkSize = max(0.5, slot.size * (1 - t * 0.25))

            slots[index].node.position = CGPoint(x: posX, y: posY)
            slots[index].node.alpha = CGFloat(max(0, alpha))
            slots[index].node.setScale(sparkSize)
        }
    }

    func clear() {
        for index in slots.indices {
            slots[index].active = false
            slots[index].node.isHidden = true
        }
    }
}
