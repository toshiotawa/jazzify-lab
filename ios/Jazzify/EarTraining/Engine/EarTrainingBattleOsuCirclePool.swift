import CoreGraphics
import SpriteKit
import UIKit

/// Web `earTrainingBattleOsuCirclePool.ts` 相当。
@MainActor
final class EarTrainingBattleOsuCirclePool {
    static let poolSize = 16

    struct TimingUpdate {
        let commandId: Int
        let approachStartMs: Double
        let judgedMs: Double
    }

    private struct Slot {
        var active = false
        var commandId = -1
        var approachStartMs: Double = 0
        var judgedMs: Double = 0
        var centerX: CGFloat = 0
        var targetY: CGFloat = 0
        var dismissed = false
        let innerNode: SKShapeNode
        let outerNode: SKShapeNode
    }

    private var slots: [Slot]
    private let container = SKNode()

    init(parent: SKNode) {
        slots = (0..<Self.poolSize).map { _ in
            let inner = SKShapeNode(circleOfRadius: 1)
            inner.fillColor = .clear
            inner.strokeColor = UIColor(red: 251 / 255, green: 146 / 255, blue: 60 / 255, alpha: 0.5)
            inner.lineWidth = EarTrainingBattleOsuCircleTiming.lineWidth
            inner.isHidden = true
            inner.zPosition = 64

            let outer = SKShapeNode(circleOfRadius: 1)
            outer.fillColor = .clear
            outer.strokeColor = UIColor(white: 1, alpha: 0.5)
            outer.lineWidth = EarTrainingBattleOsuCircleTiming.lineWidth
            outer.isHidden = true
            outer.zPosition = 64

            return Slot(innerNode: inner, outerNode: outer)
        }
        container.zPosition = 64
        parent.addChild(container)
        for slot in slots {
            container.addChild(slot.outerNode)
            container.addChild(slot.innerNode)
        }
    }

    var hasActiveCircles: Bool {
        slots.contains { $0.active && !$0.dismissed }
    }

    @discardableResult
    func spawn(
        commandId: Int,
        approachStartMs: Double,
        judgedMs: Double,
        centerX: CGFloat,
        targetY: CGFloat
    ) -> Bool {
        guard let index = slots.firstIndex(where: { !$0.active }) else { return false }
        slots[index].active = true
        slots[index].commandId = commandId
        slots[index].approachStartMs = approachStartMs
        slots[index].judgedMs = judgedMs
        slots[index].centerX = centerX
        slots[index].targetY = targetY
        slots[index].dismissed = false
        return true
    }

    func resyncTimings(_ updates: [TimingUpdate]) -> Int {
        var count = 0
        for update in updates {
            guard let index = slots.firstIndex(where: {
                $0.active && $0.commandId == update.commandId && !$0.dismissed
            }) else { continue }
            slots[index].approachStartMs = update.approachStartMs
            slots[index].judgedMs = update.judgedMs
            count += 1
        }
        return count
    }

    func burst(commandId: Int) -> CGPoint? {
        guard let index = slots.firstIndex(where: { $0.active && $0.commandId == commandId }) else {
            return nil
        }
        let position = CGPoint(x: slots[index].centerX, y: slots[index].targetY)
        slots[index].active = false
        slots[index].innerNode.isHidden = true
        slots[index].outerNode.isHidden = true
        return position
    }

    func dismiss(commandId: Int) -> Bool {
        guard let index = slots.firstIndex(where: { $0.active && $0.commandId == commandId }) else {
            return false
        }
        slots[index].dismissed = true
        return true
    }

    func update(nowMs: Double) {
        let nextCommandId = resolveNextCommandId(nowMs: nowMs)
        for index in slots.indices {
            guard slots[index].active else { continue }
            let slot = slots[index]
            let timing = EarTrainingBattleOsuCircleTiming.compute(
                nowMs: nowMs,
                approachStartMs: slot.approachStartMs,
                judgedMs: slot.judgedMs,
                centerX: slot.centerX,
                targetY: slot.targetY,
                dismissed: slot.dismissed
            )
            if slot.dismissed || !timing.visible {
                slots[index].active = false
                slots[index].innerNode.isHidden = true
                slots[index].outerNode.isHidden = true
                continue
            }
            let isNext = slot.commandId == nextCommandId
            let alpha: CGFloat = isNext ? 0.78 : 0.5
            slots[index].innerNode.isHidden = false
            slots[index].outerNode.isHidden = false
            slots[index].innerNode.strokeColor = UIColor(red: 251 / 255, green: 146 / 255, blue: 60 / 255, alpha: alpha)
            slots[index].outerNode.strokeColor = UIColor(white: 1, alpha: alpha)
            slots[index].innerNode.position = CGPoint(x: timing.centerX, y: timing.centerY)
            slots[index].outerNode.position = CGPoint(x: timing.centerX, y: timing.centerY)
            slots[index].innerNode.path = CGPath(
                ellipseIn: CGRect(
                    x: -timing.innerRadius,
                    y: -timing.innerRadius,
                    width: timing.innerRadius * 2,
                    height: timing.innerRadius * 2
                ),
                transform: nil
            )
            slots[index].outerNode.path = CGPath(
                ellipseIn: CGRect(
                    x: -timing.outerRadius,
                    y: -timing.outerRadius,
                    width: timing.outerRadius * 2,
                    height: timing.outerRadius * 2
                ),
                transform: nil
            )
        }
    }

    private func resolveNextCommandId(nowMs: Double) -> Int? {
        var nextCommandId: Int?
        var nextJudgedMs = Double.greatestFiniteMagnitude
        for slot in slots where slot.active && !slot.dismissed {
            guard slot.judgedMs < nextJudgedMs else { continue }
            let timing = EarTrainingBattleOsuCircleTiming.compute(
                nowMs: nowMs,
                approachStartMs: slot.approachStartMs,
                judgedMs: slot.judgedMs,
                centerX: slot.centerX,
                targetY: slot.targetY,
                dismissed: slot.dismissed
            )
            guard timing.visible else { continue }
            nextJudgedMs = slot.judgedMs
            nextCommandId = slot.commandId
        }
        return nextCommandId
    }

    func clear() {
        for index in slots.indices {
            slots[index].active = false
            slots[index].dismissed = false
            slots[index].innerNode.isHidden = true
            slots[index].outerNode.isHidden = true
        }
    }
}
