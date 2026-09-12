import CoreGraphics
import Foundation

/// フレーズディフェンス プレイマップ用レイアウト（Web `playDescentLayout.ts` と同一仕様）。
enum DefenseDescentLayoutConstants {
    static let logicalWidth: CGFloat = SurvivalDescentLayoutConstants.logicalWidth
    static let yTopPadding: CGFloat = SurvivalDescentLayoutConstants.yTopPadding
    static let yHeaderToFirst: CGFloat = SurvivalDescentLayoutConstants.yHeaderToFirst
    static let yStageGap: CGFloat = SurvivalDescentLayoutConstants.yStageGap
    static let yBeforeBig: CGFloat = SurvivalDescentLayoutConstants.yBeforeBig
    static let yDoorToNextHeader: CGFloat = SurvivalDescentLayoutConstants.yDoorToNextHeader
    static let yDoorOffsetFromBig: CGFloat = SurvivalDescentLayoutConstants.yDoorOffsetFromBig
    static let bigLandingHeight: CGFloat = SurvivalDescentLayoutConstants.bigLandingHeight
}

struct DefenseDescentNodePosition: Identifiable, Hashable, Sendable {
    let nodeId: UUID
    let node: PlayMapNode
    let x: CGFloat
    let y: CGFloat
    let lane: SurvivalDescentLane
    let landingType: SurvivalDescentLandingType
    let blockKey: String
    let displayLabel: String

    var id: UUID { nodeId }
}

struct DefenseDescentBlockLayout: Identifiable, Hashable, Sendable {
    let blockKey: String
    let blockIndex: Int
    let blockId: UUID
    let label: String
    let labelEn: String
    let headerY: CGFloat
    let doorY: CGFloat
    let bigLandingY: CGFloat
    let startY: CGFloat
    let endY: CGFloat
    let nodes: [DefenseDescentNodePosition]

    var id: UUID { blockId }
}

struct DefenseDescentLayout: Sendable {
    let logicalWidth: CGFloat
    let totalHeight: CGFloat
    let blocks: [DefenseDescentBlockLayout]
    let nodePositions: [UUID: DefenseDescentNodePosition]

    func position(for nodeId: UUID) -> DefenseDescentNodePosition? {
        nodePositions[nodeId]
    }
}

enum DefenseDescentLayoutBuilder {
    private static func assignLane(indexInBlock: Int, isLastInBlock: Bool) -> SurvivalDescentLane {
        if isLastInBlock { return .center }
        return indexInBlock % 2 == 0 ? .left : .right
    }

    private static func buildLayout(
        for block: PlayMapBlock,
        blockIndex: Int,
        nodes: [PlayMapNode],
        startY: CGFloat,
        stageLabelOffset: Int
    ) -> (layout: DefenseDescentBlockLayout, nextStageLabel: Int) {
        let c = DefenseDescentLayoutConstants.self
        let blockNodes = nodes
            .filter { $0.blockId == block.id }
            .sorted { $0.sortOrder < $1.sortOrder }

        let headerY = startY + c.yTopPadding
        let firstNodeY = headerY + c.yHeaderToFirst
        var positions: [DefenseDescentNodePosition] = []
        let count = blockNodes.count
        var y = firstNodeY
        var stageLabel = stageLabelOffset

        for i in 0..<count {
            let isLast = (i == count - 1)
            let lane = assignLane(indexInBlock: i, isLastInBlock: isLast)
            let node = blockNodes[i]
            let displayLabel = node.nodeKind == .quest ? "?" : String(stageLabel)
            if node.nodeKind == .stage {
                stageLabel += 1
            }
            positions.append(
                DefenseDescentNodePosition(
                    nodeId: node.id,
                    node: node,
                    x: lane.x,
                    y: y,
                    lane: lane,
                    landingType: isLast ? .big : .small,
                    blockKey: block.blockKey,
                    displayLabel: displayLabel
                )
            )
            if !isLast {
                y += (i == count - 2) ? c.yBeforeBig : c.yStageGap
            }
        }

        let bigLandingY = positions.last?.y ?? firstNodeY
        let doorY = bigLandingY + c.yDoorOffsetFromBig
        let endY = bigLandingY + c.bigLandingHeight / 2 + c.yDoorToNextHeader

        let layout = DefenseDescentBlockLayout(
            blockKey: block.blockKey,
            blockIndex: blockIndex,
            blockId: block.id,
            label: block.label,
            labelEn: block.labelEn,
            headerY: headerY,
            doorY: doorY,
            bigLandingY: bigLandingY,
            startY: startY,
            endY: endY,
            nodes: positions
        )
        return (layout, stageLabel)
    }

    static func build(
        blocks: [PlayMapBlock],
        nodes: [PlayMapNode],
        tier: PlayMapTier
    ) -> DefenseDescentLayout {
        let tierBlocks = blocks
            .filter { $0.tier == tier }
            .sorted { $0.sortOrder < $1.sortOrder }

        var blockLayouts: [DefenseDescentBlockLayout] = []
        var nodePositions: [UUID: DefenseDescentNodePosition] = [:]
        var cursorY: CGFloat = 0
        var stageLabel = 1

        for (blockIndex, block) in tierBlocks.enumerated() {
            let built = buildLayout(
                for: block,
                blockIndex: blockIndex,
                nodes: nodes,
                startY: cursorY,
                stageLabelOffset: stageLabel
            )
            blockLayouts.append(built.layout)
            built.layout.nodes.forEach { nodePositions[$0.nodeId] = $0 }
            cursorY = built.layout.endY
            stageLabel = built.nextStageLabel
        }

        let totalHeight = blockLayouts.last?.endY ?? 0
        return DefenseDescentLayout(
            logicalWidth: DefenseDescentLayoutConstants.logicalWidth,
            totalHeight: totalHeight,
            blocks: blockLayouts,
            nodePositions: nodePositions
        )
    }
}

enum DefenseDescentAccess {
    static func isBlockUnlocked(
        blockIndex: Int,
        blockLayouts: [DefenseDescentBlockLayout],
        clearedNodeIds: Set<UUID>,
        isPremium: Bool
    ) -> Bool {
        if blockIndex == 0 { return true }
        if !isPremium && blockIndex >= 1 { return false }
        guard let prev = blockLayouts[safe: blockIndex - 1] else { return blockIndex == 0 }
        let stageNodes = prev.nodes.filter { $0.node.nodeKind == .stage }
        if stageNodes.isEmpty { return true }
        return stageNodes.allSatisfy { clearedNodeIds.contains($0.nodeId) }
    }

    static func findFrontierNodeId(
        blockLayouts: [DefenseDescentBlockLayout],
        clearedNodeIds: Set<UUID>,
        isPremium: Bool
    ) -> UUID? {
        for blockLayout in blockLayouts {
            guard isBlockUnlocked(
                blockIndex: blockLayout.blockIndex,
                blockLayouts: blockLayouts,
                clearedNodeIds: clearedNodeIds,
                isPremium: isPremium
            ) else { continue }
            for node in blockLayout.nodes where !clearedNodeIds.contains(node.nodeId) {
                return node.nodeId
            }
        }
        return blockLayouts.last?.nodes.last?.nodeId
    }

    static func accessibleBlockIndex(
        blockLayouts: [DefenseDescentBlockLayout],
        clearedNodeIds: Set<UUID>,
        isPremium: Bool
    ) -> Int {
        guard let frontier = findFrontierNodeId(
            blockLayouts: blockLayouts,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        ) else {
            return max(0, blockLayouts.count - 1)
        }
        guard let blockIndex = blockLayouts.firstIndex(where: { block in
            block.nodes.contains(where: { $0.nodeId == frontier })
        }) else { return 0 }
        let block = blockLayouts[blockIndex]
        let stageNodes = block.nodes.filter { $0.node.nodeKind == .stage }
        let blockCleared = !stageNodes.isEmpty
            && stageNodes.allSatisfy { clearedNodeIds.contains($0.nodeId) }
        if blockCleared {
            return min(blockIndex + 1, blockLayouts.count - 1)
        }
        return blockIndex
    }

    static func countStageNodes(in layout: DefenseDescentLayout) -> Int {
        layout.blocks.reduce(0) { partial, block in
            partial + block.nodes.filter { $0.node.nodeKind == .stage }.count
        }
    }

    static func countClearedStageNodes(
        in layout: DefenseDescentLayout,
        clearedNodeIds: Set<UUID>
    ) -> Int {
        layout.blocks.reduce(0) { partial, block in
            partial + block.nodes.filter {
                $0.node.nodeKind == .stage && clearedNodeIds.contains($0.nodeId)
            }.count
        }
    }
}
