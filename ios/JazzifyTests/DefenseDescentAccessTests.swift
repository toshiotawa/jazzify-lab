import XCTest
@testable import Jazzify

final class DefenseDescentAccessTests: XCTestCase {
    private let blockAId = UUID()
    private let blockBId = UUID()
    private let questId = UUID()
    private let stage1Id = UUID()
    private let stage2Id = UUID()
    private let blockBNodeId = UUID()

    private var blockA: PlayMapBlock {
        PlayMapBlock(
            id: blockAId,
            mode: .defense,
            tier: .basic,
            blockKey: "intro",
            label: "はじめに",
            labelEn: "Introduction",
            sortOrder: 0
        )
    }

    private var blockB: PlayMapBlock {
        PlayMapBlock(
            id: blockBId,
            mode: .defense,
            tier: .basic,
            blockKey: "next",
            label: "次",
            labelEn: "Next",
            sortOrder: 1
        )
    }

    private func makeNode(
        id: UUID,
        blockId: UUID,
        sortOrder: Int,
        kind: PlayMapNodeKind
    ) -> PlayMapNode {
        PlayMapNode(
            id: id,
            blockId: blockId,
            sortOrder: sortOrder,
            nodeKind: kind,
            survivalMapCategory: nil,
            survivalStageNumber: nil,
            defenseStageId: kind == .stage ? "stage-\(id.uuidString)" : nil,
            lessonId: kind == .quest ? UUID() : nil,
            title: "Title",
            titleEn: "Title EN",
            requiredRank: .C,
            difficultyLevel: nil
        )
    }

    private func buildLayout() -> DefenseDescentLayout {
        let nodes = [
            makeNode(id: questId, blockId: blockAId, sortOrder: 0, kind: .quest),
            makeNode(id: stage1Id, blockId: blockAId, sortOrder: 1, kind: .stage),
            makeNode(id: stage2Id, blockId: blockAId, sortOrder: 2, kind: .stage),
            makeNode(id: blockBNodeId, blockId: blockBId, sortOrder: 0, kind: .stage),
        ]
        return DefenseDescentLayoutBuilder.build(blocks: [blockA, blockB], nodes: nodes, tier: .basic)
    }

    func testBlockUnlockRequiresAllNodesIncludingQuest() {
        let layout = buildLayout()
        let clearedStageOnly: Set<UUID> = [stage1Id, stage2Id]
        XCTAssertFalse(
            DefenseDescentAccess.isBlockUnlocked(
                blockIndex: 1,
                blockLayouts: layout.blocks,
                clearedNodeIds: clearedStageOnly,
                isPremium: true
            )
        )
        let clearedAll: Set<UUID> = [questId, stage1Id, stage2Id]
        XCTAssertTrue(
            DefenseDescentAccess.isBlockUnlocked(
                blockIndex: 1,
                blockLayouts: layout.blocks,
                clearedNodeIds: clearedAll,
                isPremium: true
            )
        )
    }

    func testNodeUnlockRequiresPriorNodesInBlock() {
        let layout = buildLayout()
        let cleared = Set<UUID>()
        XCTAssertTrue(
            DefenseDescentAccess.isNodeUnlocked(
                nodeId: questId,
                blockLayouts: layout.blocks,
                clearedNodeIds: cleared,
                isPremium: true
            )
        )
        XCTAssertFalse(
            DefenseDescentAccess.isNodeUnlocked(
                nodeId: stage1Id,
                blockLayouts: layout.blocks,
                clearedNodeIds: cleared,
                isPremium: true
            )
        )
        XCTAssertTrue(
            DefenseDescentAccess.isNodeUnlocked(
                nodeId: stage1Id,
                blockLayouts: layout.blocks,
                clearedNodeIds: [questId],
                isPremium: true
            )
        )
    }

    func testClearedNodeAlwaysReplayable() {
        let layout = buildLayout()
        XCTAssertTrue(
            DefenseDescentAccess.isNodeUnlocked(
                nodeId: questId,
                blockLayouts: layout.blocks,
                clearedNodeIds: [questId],
                isPremium: true
            )
        )
    }
}
