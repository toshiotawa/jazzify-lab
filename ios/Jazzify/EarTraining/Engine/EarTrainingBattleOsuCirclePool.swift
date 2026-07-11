import CoreGraphics
import SpriteKit
import UIKit

/// Web `earTrainingBattleOsuCirclePool.ts` 相当。
@MainActor
final class EarTrainingBattleOsuCirclePool {
    static let poolSize = 16
    /// 内円縮尺（2/3）に合わせたラベルサイズ
    private static let labelFontSize: CGFloat = 14
    private static let labelLineHeight: CGFloat = 15
    /// 内円実寸でパスを持ち、外円だけ相対 scale する。
    /// 単位円を 80〜170 倍すると SpriteKit の stroke がぼやけて太く見えるため。
    private static let pathRadius = EarTrainingBattleOsuCircleTiming.innerRadiusPx

    struct TimingUpdate {
        let commandId: Int
        let approachStartMs: Double
        let judgedMs: Double
    }

    struct BurstPosition {
        let point: CGPoint
        let colorIndex: Int
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
        var colorIndex = 0
        var isNextTarget: Bool?
        let innerNode: SKShapeNode
        let outerNode: SKShapeNode
        let labelNode: SKNode
    }

    private var slots: [Slot]
    private let container = SKNode()
    private var visibleSlotScratch: [Int] = []

    init(parent: SKNode) {
        slots = (0..<Self.poolSize).map { _ in
            // 内円は実寸パス（scale=1）で Web と同じ細い stroke。外円は相対 scale のみ。
            let inner = SKShapeNode(circleOfRadius: Self.pathRadius)
            inner.fillColor = .clear
            inner.glowWidth = 0
            inner.lineWidth = EarTrainingBattleOsuCircleTiming.lineWidth
            inner.isHidden = true
            inner.zPosition = 64

            let outer = SKShapeNode(circleOfRadius: Self.pathRadius)
            outer.fillColor = .clear
            outer.glowWidth = 0
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
        noteLabels: [String] = [],
        colorIndex: Int = 0
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
        slots[index].colorIndex = colorIndex
        slots[index].isNextTarget = nil
        applyOuterRadius(at: index, radius: EarTrainingBattleOsuCircleTiming.outerStartRadiusPx)
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

    func burst(commandId: Int) -> BurstPosition? {
        guard let index = slots.firstIndex(where: { $0.active && $0.commandId == commandId }) else {
            return nil
        }
        let position = BurstPosition(
            point: CGPoint(x: slots[index].centerX, y: slots[index].targetY),
            colorIndex: slots[index].colorIndex
        )
        hideSlot(at: index)
        slots[index].active = false
        return position
    }

    func dismiss(commandId: Int) -> Bool {
        guard let index = slots.firstIndex(where: { $0.active && $0.commandId == commandId }) else {
            return false
        }
        slots[index].dismissed = true
        hideSlot(at: index)
        slots[index].active = false
        return true
    }

    func update(nowMs: Double) {
        var nextCommandId: Int?
        var nextJudgedMs = Double.greatestFiniteMagnitude
        visibleSlotScratch.removeAll(keepingCapacity: true)

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
                hideSlot(at: index)
                slots[index].active = false
                continue
            }
            if slot.judgedMs < nextJudgedMs {
                nextJudgedMs = slot.judgedMs
                nextCommandId = slot.commandId
            }
            visibleSlotScratch.append(index)

            let position = CGPoint(x: timing.centerX, y: timing.centerY)
            slots[index].innerNode.isHidden = false
            slots[index].outerNode.isHidden = false
            slots[index].labelNode.isHidden = slot.noteLabels.isEmpty
            slots[index].innerNode.position = position
            slots[index].outerNode.position = position
            slots[index].labelNode.position = position
            applyOuterRadius(at: index, radius: timing.outerRadius)
        }

        for index in visibleSlotScratch {
            let isNext = slots[index].commandId == nextCommandId
            if slots[index].isNextTarget != isNext {
                applyEmphasis(at: index, isNext: isNext)
            }
        }
    }

    /// 外円は pathRadius 基準の相対 scale。`setScale` は線幅も拡大するため割って Web 固定幅に合わせる。
    private func applyOuterRadius(at index: Int, radius: CGFloat) {
        let scale = max(radius, 0.001) / Self.pathRadius
        slots[index].outerNode.setScale(scale)
        slots[index].outerNode.lineWidth = EarTrainingBattleOsuCircleColors.outerLineWidth / scale
    }

    private func applyEmphasis(at index: Int, isNext: Bool) {
        let emphasis: CGFloat = isNext ? 1 : 0.78
        let innerColor = EarTrainingBattleOsuCircleColors.innerStroke(colorIndex: slots[index].colorIndex)
        let outerColor = EarTrainingBattleOsuCircleColors.outerStroke(colorIndex: slots[index].colorIndex)
        slots[index].innerNode.strokeColor = innerColor.withAlphaComponent(emphasis)
        slots[index].outerNode.strokeColor = outerColor.withAlphaComponent(emphasis)
        slots[index].labelNode.alpha = emphasis
        slots[index].isNextTarget = isNext
    }

    private func hideSlot(at index: Int) {
        slots[index].isNextTarget = nil
        slots[index].innerNode.isHidden = true
        slots[index].outerNode.isHidden = true
        slots[index].labelNode.isHidden = true
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

    func clear() {
        for index in slots.indices {
            slots[index].active = false
            slots[index].dismissed = false
            slots[index].noteLabels = []
            slots[index].colorIndex = 0
            hideSlot(at: index)
            slots[index].labelNode.removeAllChildren()
        }
    }
}
