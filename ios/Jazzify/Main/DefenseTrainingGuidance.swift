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
    case defenseBlockComplete
    case openTraining
    case none
}

enum DefenseTrainingPromptKind: Equatable, Sendable {
    case resume
    case nextStep
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

    private static func isBlockFullyCleared(
        block: PlayMapBlock,
        nodes: [PlayMapNode],
        clearedNodeIds: Set<UUID>
    ) -> Bool {
        let stages = nodes.filter { $0.blockId == block.id && $0.nodeKind == .stage }
        guard !stages.isEmpty else { return false }
        return stages.allSatisfy { clearedNodeIds.contains($0.id) }
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
            let basicBlock0 = sortedTierBlocks(blocks, tier: .basic).first
            if let basicBlock0,
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
            if let basicBlock0,
               isBlockFullyCleared(block: basicBlock0, nodes: nodes, clearedNodeIds: clearedNodeIds) {
                return .defenseBlockComplete
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

    static func loadTodayStreakUpdated(profile: Profile?) async -> Bool {
        let timezone = TrainingActivity.resolveUserTimezone(profile: profile)
        let todayKey = TrainingActivity.localDateKey(Date(), timezone: timezone)
        let days = (try? await SupabaseService.shared.fetchTrainingActivityDays(timezone: timezone)) ?? []
        return TrainingActivity.isTodayStreakUpdated(activeDays: Set(days), todayKey: todayKey)
    }

    static func sheetTitle(
        for guidance: DefenseTrainingGuidance,
        kind: DefenseTrainingPromptKind,
        locale: AppLocale,
        todayStreakUpdated: Bool = false
    ) -> String {
        switch kind {
        case .resume:
            switch guidance {
            case .openTraining:
                if todayStreakUpdated {
                    return locale == .ja ? "トレーニングを続けますか？" : "Keep going in Training?"
                }
                return locale == .ja ? "今日の連続記録を更新しますか？" : "Update today's streak?"
            default:
                return locale == .ja ? "続きから再開しますか？" : "Continue where you left off?"
            }
        case .nextStep:
            switch guidance {
            case .openTraining:
                return locale == .ja ? "お疲れさまでした！" : "Nice work!"
            case .defenseBlockComplete:
                return locale == .ja ? "第1階層をクリアしました！" : "You cleared Floor 1!"
            default:
                return locale == .ja ? "次に進みますか？" : "Ready for the next step?"
            }
        }
    }

    static func blockCompleteTrialLabel(locale: AppLocale) -> String {
        locale == .ja ? "7日無料で続きを試す" : "Try the next tier free for 7 days"
    }

    static func blockCompleteSoftLandingLabel(locale: AppLocale) -> String {
        locale == .ja ? "コードランを無料で始める" : "Start Chord Run free"
    }

    static func blockCompleteBodyCopy(locale: AppLocale) -> String {
        locale == .ja
            ? "第1階層をクリアしました。Advanced と全ステージはプレミアムで解放できます。"
            : "You cleared Floor 1. Unlock Advanced and all stages with Premium."
    }

    static func blockCompleteNextStepLabel(locale: AppLocale) -> String {
        locale == .ja ? "次のステップを見る" : "See what's next"
    }

    static func primaryLabel(
        for guidance: DefenseTrainingGuidance,
        locale: AppLocale,
        todayStreakUpdated: Bool = false
    ) -> String? {
        switch guidance {
        case .openDefense(_, _, _, let reason):
            switch reason {
            case .tutorial:
                return locale == .ja ? "はじめての設定を始める" : "Start first-time setup"
            case .nextStage:
                return locale == .ja ? "フレーズディフェンスを続ける" : "Continue Phrase Defense"
            }
        case .defenseBlockComplete:
            return blockCompleteNextStepLabel(locale: locale)
        case .openTraining:
            if todayStreakUpdated {
                return locale == .ja ? "トレーニングへ" : "Go to Training"
            }
            return locale == .ja ? "今日の連続記録を更新" : "Update today's streak"
        case .none:
            return nil
        }
    }

    static func bodyCopy(
        for guidance: DefenseTrainingGuidance,
        locale: AppLocale,
        todayStreakUpdated: Bool = false
    ) -> String? {
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
        case .defenseBlockComplete:
            return blockCompleteBodyCopy(locale: locale)
        case .openTraining:
            if todayStreakUpdated {
                return locale == .ja
                    ? "今日の連続記録は更新済みです。さらにトレーニングでスキルを伸ばしましょう。"
                    : "Today's streak is already updated. Keep building skills in Training."
            }
            return locale == .ja
                ? "今日の連続記録はまだ更新されていません。トレーニングで更新しましょう。"
                : "Today's training streak is not updated yet. Play Training to keep it going."
        case .none:
            return nil
        }
    }
}
