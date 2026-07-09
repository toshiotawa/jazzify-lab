import CoreGraphics
import SpriteKit
import UIKit

/// Web `earTrainingBattleOsuCirclePool.ts` 相当。
@MainActor
final class EarTrainingBattleOsuCirclePool {
    static let poolSize = 16
    private static let strokeColor = UIColor(red: 251 / 255, green: 146 / 255, blue: 60 / 255, alpha: 1)
    private static let labelFontSize: CGFloat = 13
    private static let labelLineHeight: CGFloat = 14

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
        var noteLabels: [String] = []
        let innerNode: SKShapeNode
        let outerNode: SKShapeNode
        let labelNode: SKNode
    }

    private var slots: [Slot]
    private let container = SKNode()

    init(parent: SKNode) {
        slots = (0..<Self.poolSize).map { _ in
            let inner = SKShapeNode(circleOfRadius: 1)
            inner.fillColor = .clear
            inner.strokeColor = Self.strokeColor
            inner.lineWidth = EarTrainingBattleOsuCircleTiming.lineWidth
            inner.isHidden = true
            inner.zPosition = 64

            let outer = SKShapeNode(circleOfRadius: 1)
            outer.fillColor = .clear
            outer.strokeColor = Self.strokeColor
            outer.lineWidth = EarTrainingBattleOsuCircleTiming.lineWidth
            outer.isHidden = true
            outer.zPosition = 64

            let labelNode = SKNode()
            labelNode.isHidden = true
            labelNode.zPosition = 65

            return Slot(innerNode: inner, outerNode: outer, labelNode: labelNode)
        }
        container.zPosition = 64
        parent.addChild(container)
        for slot in slots {
            container.addChild(slot.outerNode)
            container.addChild(slot.innerNode)
            container.addChild(slot.labelNode)
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
        targetY: CGFloat,
        noteLabels: [String] = []
    ) -> Bool {
        guard let index = slots.firstIndex(where: { !$0.active }) else { return false }
        slots[index].active = true
        slots[index].commandId = commandId
        slots[index].approachStartMs = approachStartMs
        slots[index].judgedMs = judgedMs
        slots[index].centerX = centerX
        slots[index].targetY = targetY
        slots[index].dismissed = false
        slots[index].noteLabels = noteLabels
        rebuildLabels(at: index)
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
        slots[index].labelNode.isHidden = true
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
                slots[index].labelNode.isHidden = true
                continue
            }
            let isNext = slot.commandId == nextCommandId
            let alpha: CGFloat = isNext ? 1 : 0.78
            slots[index].innerNode.isHidden = false
            slots[index].outerNode.isHidden = false
            slots[index].labelNode.isHidden = slot.noteLabels.isEmpty
            slots[index].innerNode.strokeColor = Self.strokeColor.withAlphaComponent(alpha)
            slots[index].outerNode.strokeColor = Self.strokeColor.withAlphaComponent(alpha)
            slots[index].labelNode.alpha = alpha
            slots[index].innerNode.position = CGPoint(x: timing.centerX, y: timing.centerY)
            slots[index].outerNode.position = CGPoint(x: timing.centerX, y: timing.centerY)
            slots[index].labelNode.position = CGPoint(x: timing.centerX, y: timing.centerY)
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

    private func rebuildLabels(at index: Int) {
        let labelNode = slots[index].labelNode
        labelNode.removeAllChildren()
        let labels = slots[index].noteLabels
        guard !labels.isEmpty else {
            labelNode.isHidden = true
            return
        }
        let totalHeight = CGFloat(labels.count - 1) * Self.labelLineHeight
        for (offset, text) in labels.enumerated() {
            let label = SKLabelNode(text: text)
            label.fontName = "AvenirNext-Bold"
            label.fontSize = Self.labelFontSize
            label.fontColor = UIColor(red: 1, green: 0.969, blue: 0.929, alpha: 1)
            label.verticalAlignmentMode = .center
            label.horizontalAlignmentMode = .center
            label.position = CGPoint(
                x: 0,
                y: totalHeight / 2 - CGFloat(offset) * Self.labelLineHeight
            )
            labelNode.addChild(label)
        }
        labelNode.isHidden = false
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
            slots[index].noteLabels = []
            slots[index].innerNode.isHidden = true
            slots[index].outerNode.isHidden = true
            slots[index].labelNode.isHidden = true
            slots[index].labelNode.removeAllChildren()
        }
    }
}
