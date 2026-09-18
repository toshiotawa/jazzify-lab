import XCTest
@testable import Jazzify

final class DefenseTrainingGuidanceTests: XCTestCase {
    private let basicBlockId = UUID()
    private let advancedBlockId = UUID()
    private let tutorialId = UUID()
    private let stage1Id = UUID()
    private let stage2Id = UUID()
    private let adv1Id = UUID()
    private let adv2Id = UUID()

    private var basicBlock: PlayMapBlock {
        PlayMapBlock(
            id: basicBlockId,
            mode: .defense,
            tier: .basic,
            blockKey: "intro",
            label: "はじめに",
            labelEn: "Introduction",
            sortOrder: 0
        )
    }

    private var advancedBlock: PlayMapBlock {
        PlayMapBlock(
            id: advancedBlockId,
            mode: .defense,
            tier: .advanced,
            blockKey: "intro",
            label: "はじめに",
            labelEn: "Introduction",
            sortOrder: 0
        )
    }

    private var basicNodes: [PlayMapNode] {
        [
            PlayMapNode(
                id: tutorialId,
                blockId: basicBlockId,
                sortOrder: -1,
                nodeKind: .tutorial,
                survivalMapCategory: nil,
                survivalStageNumber: nil,
                defenseStageId: nil,
                lessonId: nil,
                title: "はじめての設定",
                titleEn: "First-time setup",
                requiredRank: .C,
                difficultyLevel: nil,
                tutorialKey: DefenseTutorialConstants.key
            ),
            makeStage(id: stage1Id, blockId: basicBlockId, sortOrder: 0, title: "フレーズ I"),
            makeStage(id: stage2Id, blockId: basicBlockId, sortOrder: 1, title: "フレーズ II"),
        ]
    }

    private var advancedNodes: [PlayMapNode] {
        [
            makeStage(id: adv1Id, blockId: advancedBlockId, sortOrder: 0, title: "Adv I"),
            makeStage(id: adv2Id, blockId: advancedBlockId, sortOrder: 1, title: "Adv II"),
        ]
    }

    private func makeStage(id: UUID, blockId: UUID, sortOrder: Int, title: String) -> PlayMapNode {
        PlayMapNode(
            id: id,
            blockId: blockId,
            sortOrder: sortOrder,
            nodeKind: .stage,
            survivalMapCategory: nil,
            survivalStageNumber: nil,
            defenseStageId: "stage-\(id.uuidString)",
            lessonId: nil,
            title: title,
            titleEn: title,
            requiredRank: .C,
            difficultyLevel: nil,
            tutorialKey: nil
        )
    }

    func testFreeUserStartsWithTutorial() {
        let guidance = DefenseTrainingGuidanceResolver.resolve(
            isPremium: false,
            blocks: [basicBlock],
            nodes: basicNodes,
            clearedNodeIds: [],
            locale: .ja
        )

        guard case .openDefense(let tier, let nodeId, _, let reason) = guidance else {
            return XCTFail("Expected openDefense")
        }
        XCTAssertEqual(tier, .basic)
        XCTAssertEqual(nodeId, tutorialId)
        XCTAssertEqual(reason, .tutorial)
    }

    func testFreeUserContinuesBasicBlockAfterTutorial() {
        let guidance = DefenseTrainingGuidanceResolver.resolve(
            isPremium: false,
            blocks: [basicBlock],
            nodes: basicNodes,
            clearedNodeIds: [tutorialId],
            locale: .ja
        )

        guard case .openDefense(let tier, let nodeId, _, let reason) = guidance else {
            return XCTFail("Expected openDefense")
        }
        XCTAssertEqual(tier, .basic)
        XCTAssertEqual(nodeId, stage1Id)
        XCTAssertEqual(reason, .nextStage)
    }

    func testFreeUserMovesToTrainingAfterBasicBlock() {
        let guidance = DefenseTrainingGuidanceResolver.resolve(
            isPremium: false,
            blocks: [basicBlock],
            nodes: basicNodes,
            clearedNodeIds: [tutorialId, stage1Id, stage2Id],
            locale: .ja
        )

        XCTAssertEqual(guidance, .openTraining)
    }

    func testPremiumUserPrefersTierWithMoreClears() {
        let guidance = DefenseTrainingGuidanceResolver.resolve(
            isPremium: true,
            blocks: [basicBlock, advancedBlock],
            nodes: basicNodes + advancedNodes,
            clearedNodeIds: [tutorialId, adv1Id],
            locale: .ja
        )

        guard case .openDefense(let tier, let nodeId, _, _) = guidance else {
            return XCTFail("Expected openDefense")
        }
        XCTAssertEqual(tier, .advanced)
        XCTAssertEqual(nodeId, adv2Id)
    }

    func testTrainingCopyChangesWithTodayStreak() {
        XCTAssertEqual(
            DefenseTrainingGuidanceResolver.primaryLabel(
                for: .openTraining,
                locale: .ja,
                todayStreakUpdated: false
            ),
            "今日の連続記録を更新"
        )
        XCTAssertEqual(
            DefenseTrainingGuidanceResolver.bodyCopy(
                for: .openTraining,
                locale: .ja,
                todayStreakUpdated: true
            ),
            "今日の連続記録は更新済みです。さらにトレーニングでスキルを伸ばしましょう。"
        )
    }
}
