import Foundation

enum PlayMapMode: String, Codable, Sendable {
    case codeRun = "code_run"
    case defense
}

enum PlayMapTier: String, Codable, Sendable, CaseIterable {
    case basic
    case advanced
}

enum PlayMapNodeKind: String, Codable, Sendable {
    case stage
    case quest
}

enum CodeRunLetterRank: String, Codable, Sendable, CaseIterable {
    case S, A, B, C, D, E, F
}

struct PlayMapBlock: Codable, Identifiable, Sendable {
    let id: UUID
    let mode: PlayMapMode
    let tier: PlayMapTier
    let blockKey: String
    let label: String
    let labelEn: String
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, mode, tier, label
        case blockKey = "block_key"
        case labelEn = "label_en"
        case sortOrder = "sort_order"
    }

    func localizedLabel(_ locale: AppLocale) -> String {
        locale == .en ? (labelEn.isEmpty ? label : labelEn) : label
    }
}

struct PlayMapNode: Codable, Identifiable, Sendable {
    let id: UUID
    let blockId: UUID
    let sortOrder: Int
    let nodeKind: PlayMapNodeKind
    let survivalMapCategory: String?
    let survivalStageNumber: Int?
    let defenseStageId: String?
    let lessonId: UUID?
    let title: String
    let titleEn: String
    let requiredRank: CodeRunLetterRank

    enum CodingKeys: String, CodingKey {
        case id, title
        case blockId = "block_id"
        case sortOrder = "sort_order"
        case nodeKind = "node_kind"
        case survivalMapCategory = "survival_map_category"
        case survivalStageNumber = "survival_stage_number"
        case defenseStageId = "defense_stage_id"
        case lessonId = "lesson_id"
        case titleEn = "title_en"
        case requiredRank = "required_rank"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn.isEmpty ? title : titleEn) : title
    }
}

struct PlayMapNodeClear: Codable, Sendable {
    let nodeId: UUID
    let bestTimeSec: Double?
    let bestRank: CodeRunLetterRank?
    let bestSurviveSec: Int?
    let clearCount: Int

    enum CodingKeys: String, CodingKey {
        case nodeId = "node_id"
        case bestTimeSec = "best_time_sec"
        case bestRank = "best_rank"
        case bestSurviveSec = "best_survive_sec"
        case clearCount = "clear_count"
    }
}

struct CodeRunRankThreshold: Codable, Sendable {
    let rank: CodeRunLetterRank
    let maxSeconds: Int
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case rank
        case maxSeconds = "max_seconds"
        case sortOrder = "sort_order"
    }
}

struct RecordPlayMapNodeClearResult: Sendable {
    let isFirstClear: Bool
    let nodeId: UUID
    let mode: PlayMapMode
    let error: String?
}

enum MainQuestInstrument: String, Sendable {
    case piano
    case all

    static func resolve(profileInstrument: String?) -> MainQuestInstrument {
        profileInstrument == "piano" || profileInstrument == nil ? .piano : .all
    }
}

enum CodeRunRankCalculator {
    static let defaultThresholds: [CodeRunRankThreshold] = [
        CodeRunRankThreshold(rank: .S, maxSeconds: 60, sortOrder: 0),
        CodeRunRankThreshold(rank: .A, maxSeconds: 90, sortOrder: 1),
        CodeRunRankThreshold(rank: .B, maxSeconds: 120, sortOrder: 2),
        CodeRunRankThreshold(rank: .C, maxSeconds: 150, sortOrder: 3),
        CodeRunRankThreshold(rank: .D, maxSeconds: 165, sortOrder: 4),
        CodeRunRankThreshold(rank: .E, maxSeconds: 180, sortOrder: 5),
        CodeRunRankThreshold(rank: .F, maxSeconds: 195, sortOrder: 6),
    ]

    static func scoreToRank(elapsedSec: Double, thresholds: [CodeRunRankThreshold]) -> CodeRunLetterRank {
        let sorted = thresholds.sorted { $0.sortOrder < $1.sortOrder }
        for threshold in sorted where elapsedSec <= Double(threshold.maxSeconds) {
            return threshold.rank
        }
        return .F
    }

    static func meetsRequirement(
        achieved: CodeRunLetterRank,
        required: CodeRunLetterRank,
        thresholds: [CodeRunRankThreshold]
    ) -> Bool {
        rankOrder(achieved, thresholds: thresholds) <= rankOrder(required, thresholds: thresholds)
    }

    private static func rankOrder(_ rank: CodeRunLetterRank, thresholds: [CodeRunRankThreshold]) -> Int {
        thresholds.first(where: { $0.rank == rank })?.sortOrder ?? 99
    }
}

enum PlayMapWorldLayout {
    struct NodeLayout: Identifiable {
        let node: PlayMapNode
        let blockIndex: Int
        let nodeIndexInBlock: Int
        let x: CGFloat
        let y: CGFloat

        var id: UUID { node.id }
    }

    struct BlockLayout: Identifiable {
        let block: PlayMapBlock
        let blockIndex: Int
        let y: CGFloat
        let height: CGFloat
        let nodes: [NodeLayout]

        var id: UUID { block.id }
    }

    struct Layout {
        let blocks: [BlockLayout]
        let totalHeight: CGFloat
        let logicalWidth: CGFloat
    }

    private static let blockHeaderHeight: CGFloat = 56
    private static let nodeRowHeight: CGFloat = 88
    private static let blockPadding: CGFloat = 24
    private static let logicalWidth: CGFloat = 720

    static func build(
        blocks: [PlayMapBlock],
        nodes: [PlayMapNode],
        tier: PlayMapTier
    ) -> Layout {
        let tierBlocks = blocks
            .filter { $0.tier == tier }
            .sorted { $0.sortOrder < $1.sortOrder }

        var y: CGFloat = 40
        var blockLayouts: [BlockLayout] = []

        for (blockIndex, block) in tierBlocks.enumerated() {
            let blockNodes = nodes
                .filter { $0.blockId == block.id }
                .sorted { $0.sortOrder < $1.sortOrder }

            let nodeLayouts: [NodeLayout] = blockNodes.enumerated().map { nodeIndex, node in
                NodeLayout(
                    node: node,
                    blockIndex: blockIndex,
                    nodeIndexInBlock: nodeIndex,
                    x: logicalWidth / 2 + (nodeIndex % 2 == 0 ? -120 : 120),
                    y: y + blockHeaderHeight + CGFloat(nodeIndex) * nodeRowHeight
                )
            }

            let height = blockHeaderHeight
                + max(CGFloat(blockNodes.count), 1) * nodeRowHeight
                + blockPadding
            blockLayouts.append(BlockLayout(
                block: block,
                blockIndex: blockIndex,
                y: y,
                height: height,
                nodes: nodeLayouts
            ))
            y += height + 32
        }

        return Layout(blocks: blockLayouts, totalHeight: y + 40, logicalWidth: logicalWidth)
    }

    static func isBlockUnlocked(
        blockIndex: Int,
        blockLayouts: [BlockLayout],
        clearedNodeIds: Set<UUID>,
        isPremium: Bool
    ) -> Bool {
        if blockIndex == 0 { return true }
        if !isPremium && blockIndex >= 1 { return false }
        guard let prev = blockLayouts[safe: blockIndex - 1] else { return blockIndex == 0 }
        let stageNodes = prev.nodes.filter { $0.node.nodeKind == .stage }
        if stageNodes.isEmpty { return true }
        return stageNodes.allSatisfy { clearedNodeIds.contains($0.node.id) }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
