import Foundation

enum DefenseGuidanceReason: Equatable, Sendable {
    case tutorial
    case nextStage
}

enum DefenseTrainingGuidance: Equatable, Sendable {
    case openDefense(
        tier: PlayMapTier,
        nodeId: UUID,
        nodeTitle: String,
        reason: DefenseGuidanceReason
    )
    case openTraining
    case none
}

enum DefenseTrainingGuidanceResolver {
    private static func sortedTierBlocks(
        _ blocks: [PlayMapBlock],
        tier: PlayMapTier
    ) -> [PlayMapBlock] {
        blocks
            .filter { $0.tier == tier }
            .sorted { $0.sortOrder < $1.sortOrder }
    }

    private static func findBasicTutorialNode(
        blocks: [PlayMapBlock],
        nodes: [PlayMapNode]
    ) -> PlayMapNode? {
        guard let block0 = sortedTierBlocks(blocks, tier: .basic).first else {
            return nil
        }
        return nodes.first { $0.blockId == block0.id && $0.nodeKind == .tutorial }
    }

    private static func nodeDisplayTitle(_ node: PlayMapNode, locale: AppLocale) -> String {
        node.localizedTitle(locale)
    }

    private static func findNextUnclearedStageInBlock(
        block: PlayMapBlock,
        nodes: [PlayMapNode],
        clearedNodeIds: Set<UUID>
    ) -> PlayMapNode? {
        let stages = nodes
            .filter { $0.blockId == block.id && $0.nodeKind == .stage }
            .sorted { $0.sortOrder < $1.sortOrder }
        return stages.first { !clearedNodeIds.contains($0.id) }
    }

    private static func countTierClearedStages(
        blocks: [PlayMapBlock],
        nodes: [PlayMapNode],
        tier: PlayMapTier,
        clearedNodeIds: Set<UUID>
    ) -> Int {
        let layout = DefenseDescentLayoutBuilder.build(
            blocks: blocks,
            nodes: nodes,
            tier: tier
        )
        return DefenseDescentAccess.countClearedStageNodes(in: layout, clearedNodeIds: clearedNodeIds)
    }

    private static func resolvePlayableFrontier(
        tier: PlayMapTier,
        blocks: [PlayMapBlock],
        nodes: [PlayMapNode],
        clearedNodeIds: Set<UUID>,
        isPremium: Bool,
        locale: AppLocale
    ) -> DefenseTrainingGuidance? {
        let layout = DefenseDescentLayoutBuilder.build(
            blocks: blocks,
            nodes: nodes,
            tier: tier
        )
        guard let frontierId = DefenseDescentAccess.findFrontierNodeId(
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        ) else {
            return nil
        }
        guard let frontierNode = nodes.first(where: { $0.id == frontierId }) else {
            return nil
        }
        guard PlayMapProgression.isProgressionGate(frontierNode),
              !clearedNodeIds.contains(frontierId),
              DefenseDescentAccess.isNodeUnlocked(
                nodeId: frontierId,
                blockLayouts: layout.blocks,
                clearedNodeIds: clearedNodeIds,
                isPremium: isPremium
              ) else {
            return nil
        }
        return .openDefense(
            tier: tier,
            nodeId: frontierId,
            nodeTitle: nodeDisplayTitle(frontierNode, locale: locale),
            reason: .nextStage
        )
    }

    private static func resolveTutorialGuidance(
        tutorial: PlayMapNode,
        locale: AppLocale
    ) -> DefenseTrainingGuidance {
        .openDefense(
            tier: .basic,
            nodeId: tutorial.id,
            nodeTitle: nodeDisplayTitle(tutorial, locale: locale),
            reason: .tutorial
        )
    }

    static func resolve(
        isPremium: Bool,
        blocks: [PlayMapBlock],
        nodes: [PlayMapNode],
        clearedNodeIds: Set<UUID>,
        locale: AppLocale
    ) -> DefenseTrainingGuidance {
        guard !blocks.isEmpty, !nodes.isEmpty else {
            return .none
        }

        let tutorial = findBasicTutorialNode(blocks: blocks, nodes: nodes)
        let tutorialCleared = tutorial.map { clearedNodeIds.contains($0.id) } ?? true

        if !isPremium {
            if let tutorial, !tutorialCleared {
                return resolveTutorialGuidance(tutorial: tutorial, locale: locale)
            }
            if let basicBlock0 = sortedTierBlocks(blocks, tier: .basic).first,
               let nextStage = findNextUnclearedStageInBlock(
                block: basicBlock0,
                nodes: nodes,
                clearedNodeIds: clearedNodeIds
               ) {
                return .openDefense(
                    tier: .basic,
                    nodeId: nextStage.id,
                    nodeTitle: nodeDisplayTitle(nextStage, locale: locale),
                    reason: .nextStage
                )
            }
            return .openTraining
        }

        let basicCleared = countTierClearedStages(
            blocks: blocks,
            nodes: nodes,
            tier: .basic,
            clearedNodeIds: clearedNodeIds
        )
        let advancedCleared = countTierClearedStages(
            blocks: blocks,
            nodes: nodes,
            tier: .advanced,
            clearedNodeIds: clearedNodeIds
        )
        let preferredTier: PlayMapTier = advancedCleared > basicCleared ? .advanced : .basic
        let tiersToTry: [PlayMapTier] = preferredTier == .basic ? [.basic, .advanced] : [.advanced, .basic]

        for tier in tiersToTry {
            if tier == .basic, let tutorial, !tutorialCleared {
                return resolveTutorialGuidance(tutorial: tutorial, locale: locale)
            }
            if let frontierGuidance = resolvePlayableFrontier(
                tier: tier,
                blocks: blocks,
                nodes: nodes,
                clearedNodeIds: clearedNodeIds,
                isPremium: true,
                locale: locale
            ) {
                return frontierGuidance
            }
        }

        return .openTraining
    }

    static func primaryLabel(for guidance: DefenseTrainingGuidance, locale: AppLocale) -> String? {
        switch guidance {
        case .openDefense(_, _, _, let reason):
            switch reason {
            case .tutorial:
                return locale == .ja ? "はじめての設定を始める" : "Start first-time setup"
            case .nextStage:
                return locale == .ja ? "フレーズディフェンスを続ける" : "Continue Phrase Defense"
            }
        case .openTraining:
            return locale == .ja ? "トレーニングへ" : "Go to Training"
        case .none:
            return nil
        }
    }

    static func bodyCopy(for guidance: DefenseTrainingGuidance, locale: AppLocale) -> String? {
        switch guidance {
        case .openDefense(_, _, let nodeTitle, let reason):
            let quoted = locale == .ja ? "「\(nodeTitle)」" : "\"\(nodeTitle)\""
            switch reason {
            case .tutorial:
                return locale == .ja
                    ? "\(quoted)で入力設定を行いましょう。"
                    : "Set up your input with \(quoted)."
            case .nextStage:
                return locale == .ja ? "次は\(quoted)です。" : "Next up: \(quoted)"
            }
        case .openTraining:
            return locale == .ja
                ? "トレーニングでスキルを伸ばしましょう。"
                : "Keep building skills in Training."
        case .none:
            return nil
        }
    }
}
