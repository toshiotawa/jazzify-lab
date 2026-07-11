import CoreGraphics
import SpriteKit
import UIKit

/// Web `earTrainingBattleOsuCircleShatterPool.ts` 相当。
@MainActor
final class EarTrainingBattleOsuCircleShatterPool {
    static let poolSize = 128
    static let durationMs: Double = 380
    static let fragmentCount = 20
    private static let arcSpan = (Double.pi * 2 / Double(fragmentCount)) * 0.82
    private static let lineWidth = EarTrainingBattleOsuCircleTiming.lineWidth + 2

    private struct Slot {
        var active = false
        var startedAtMs: Double = 0
        var originX: CGFloat = 0
        var originY: CGFloat = 0
        var midAngle: Double = 0
        var ringRadius: CGFloat = 0
        var dirX: CGFloat = 0
        var dirY: CGFloat = 0
        var driftSpeed: Double = 0
        var spinRadPerMs: Double = 0
        let node: SKShapeNode
    }

    private var slots: [Slot]
    private let container = SKNode()

    init(parent: SKNode) {
        slots = (0..<Self.poolSize).map { _ in
            let node = SKShapeNode()
            node.lineWidth = Self.lineWidth
            node.lineCap = .round
            node.fillColor = .clear
            node.isHidden = true
            node.zPosition = 63
            return Slot(node: node)
        }
        container.zPosition = 63
        parent.addChild(container)
        for slot in slots {
            container.addChild(slot.node)
        }
    }

    var hasActiveFragments: Bool {
        slots.contains { $0.active }
    }

    @discardableResult
    func spawn(origin: CGPoint, ringRadius: CGFloat, startedAtMs: Double, colorIndex: Int = 0) -> Int {
        var spawned = 0
        let strokeColor = EarTrainingBattleOsuCircleColors.innerStroke(colorIndex: colorIndex)
        for fragmentIndex in 0..<Self.fragmentCount {
            guard let slotIndex = slots.firstIndex(where: { !$0.active }) else { break }
            let midAngle = (Double.pi * 2 * Double(fragmentIndex)) / Double(Self.fragmentCount)
            slots[slotIndex].active = true
            slots[slotIndex].startedAtMs = startedAtMs
            slots[slotIndex].originX = origin.x
            slots[slotIndex].originY = origin.y
            slots[slotIndex].midAngle = midAngle
            slots[slotIndex].ringRadius = ringRadius
            slots[slotIndex].dirX = CGFloat(cos(midAngle))
            slots[slotIndex].dirY = CGFloat(sin(midAngle))
            slots[slotIndex].driftSpeed = Double.random(in: 180...340)
            slots[slotIndex].spinRadPerMs = Double.random(in: -0.005...0.005)
            let startAngle = midAngle - Self.arcSpan / 2
            let endAngle = midAngle + Self.arcSpan / 2
            let path = CGMutablePath()
            path.addArc(
                center: .zero,
                radius: ringRadius,
                startAngle: startAngle,
                endAngle: endAngle,
                clockwise: false
            )
            let node = slots[slotIndex].node
            node.path = path
            node.strokeColor = strokeColor
            node.lineWidth = Self.lineWidth
            node.position = origin
            node.zRotation = 0
            node.alpha = 1
            node.isHidden = false
            spawned += 1
        }
        return spawned
    }

    func update(nowMs: Double) {
        for index in slots.indices {
            guard slots[index].active else { continue }
            let slot = slots[index]
            let age = nowMs - slot.startedAtMs
            if age >= Self.durationMs {
                slots[index].active = false
                slots[index].node.isHidden = true
                continue
            }
            let t = age / Self.durationMs
            let drift = CGFloat(slot.driftSpeed * (age / 1000))
            let cx = slot.originX + slot.dirX * drift
            let cy = slot.originY + slot.dirY * drift
            let spin = slot.spinRadPerMs * age
            let alpha: Double = t < 0.35 ? 1 : 1 - pow((t - 0.35) / 0.65, 1.4)
            slots[index].node.position = CGPoint(x: cx, y: cy)
            slots[index].node.zRotation = CGFloat(spin)
            slots[index].node.alpha = CGFloat(max(0, alpha))
        }
    }

    func clear() {
        for index in slots.indices {
            slots[index].active = false
            slots[index].node.isHidden = true
        }
    }
}
