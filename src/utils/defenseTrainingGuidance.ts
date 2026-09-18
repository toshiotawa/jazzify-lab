import {
  buildPlayDescentLayout,
  countClearedStageNodes,
  findFrontierNodeId,
  isPlayDescentNodeUnlocked,
} from '@/components/play/defenseDescent/playDescentLayout';
import { isPlayMapProgressionGate } from '@/components/play/defenseDescent/playMapProgression';
import type { PlayMapBlock, PlayMapNode, PlayMapTier } from '@/platform/supabasePlayMap';

export type DefenseGuidanceReason = 'tutorial' | 'nextStage';

export type DefenseTrainingGuidance =
  | {
    kind: 'openDefense';
    tier: PlayMapTier;
    nodeId: string;
    nodeTitle: string;
    reason: DefenseGuidanceReason;
  }
  | { kind: 'openTraining' }
  | { kind: 'none' };

export interface ResolveDefenseTrainingGuidanceInput {
  isPremiumMember: boolean;
  blocks: readonly PlayMapBlock[];
  nodes: readonly PlayMapNode[];
  clearedNodeIds: ReadonlySet<string>;
  isEnglishCopy?: boolean;
}

const sortedTierBlocks = (
  blocks: readonly PlayMapBlock[],
  tier: PlayMapTier,
): PlayMapBlock[] =>
  blocks.filter((block) => block.tier === tier).sort((a, b) => a.sortOrder - b.sortOrder);

const findBasicTutorialNode = (
  blocks: readonly PlayMapBlock[],
  nodes: readonly PlayMapNode[],
): PlayMapNode | null => {
  const block0 = sortedTierBlocks(blocks, 'basic')[0];
  if (!block0) {
    return null;
  }
  return nodes.find((node) => node.blockId === block0.id && node.nodeKind === 'tutorial') ?? null;
};

const nodeDisplayTitle = (node: PlayMapNode, isEnglishCopy: boolean): string =>
  (isEnglishCopy ? node.titleEn : node.title);

const findNextUnclearedStageInBlock = (
  block: PlayMapBlock,
  nodes: readonly PlayMapNode[],
  clearedNodeIds: ReadonlySet<string>,
): PlayMapNode | null => {
  const stages = nodes
    .filter((node) => node.blockId === block.id && node.nodeKind === 'stage')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  for (const stage of stages) {
    if (!clearedNodeIds.has(stage.id)) {
      return stage;
    }
  }
  return null;
};

const countTierClearedStages = (
  blocks: readonly PlayMapBlock[],
  nodes: readonly PlayMapNode[],
  tier: PlayMapTier,
  clearedNodeIds: ReadonlySet<string>,
): number => {
  const layout = buildPlayDescentLayout(blocks, nodes, tier);
  return countClearedStageNodes(layout, clearedNodeIds);
};

const resolvePlayableFrontier = (
  tier: PlayMapTier,
  blocks: readonly PlayMapBlock[],
  nodes: readonly PlayMapNode[],
  clearedNodeIds: ReadonlySet<string>,
  isPremiumMember: boolean,
  isEnglishCopy: boolean,
): Extract<DefenseTrainingGuidance, { kind: 'openDefense' }> | null => {
  const layout = buildPlayDescentLayout(blocks, nodes, tier, isEnglishCopy);
  const frontierId = findFrontierNodeId(layout.blocks, clearedNodeIds, isPremiumMember);
  if (!frontierId) {
    return null;
  }

  const frontierNode = nodes.find((node) => node.id === frontierId);
  if (!frontierNode) {
    return null;
  }

  if (
    isPlayMapProgressionGate(frontierNode)
    && !clearedNodeIds.has(frontierId)
    && isPlayDescentNodeUnlocked(frontierId, layout.blocks, clearedNodeIds, isPremiumMember)
  ) {
    return {
      kind: 'openDefense',
      tier,
      nodeId: frontierId,
      nodeTitle: nodeDisplayTitle(frontierNode, isEnglishCopy),
      reason: 'nextStage',
    };
  }

  return null;
};

const resolveTutorialGuidance = (
  tutorial: PlayMapNode,
  isEnglishCopy: boolean,
): Extract<DefenseTrainingGuidance, { kind: 'openDefense' }> => ({
  kind: 'openDefense',
  tier: 'basic',
  nodeId: tutorial.id,
  nodeTitle: nodeDisplayTitle(tutorial, isEnglishCopy),
  reason: 'tutorial',
});

export function resolveDefenseTrainingGuidance(
  input: ResolveDefenseTrainingGuidanceInput,
): DefenseTrainingGuidance {
  const {
    isPremiumMember,
    blocks,
    nodes,
    clearedNodeIds,
    isEnglishCopy = false,
  } = input;

  if (blocks.length === 0 || nodes.length === 0) {
    return { kind: 'none' };
  }

  const tutorial = findBasicTutorialNode(blocks, nodes);
  const tutorialCleared = tutorial != null && clearedNodeIds.has(tutorial.id);

  if (!isPremiumMember) {
    if (tutorial && !tutorialCleared) {
      return resolveTutorialGuidance(tutorial, isEnglishCopy);
    }

    const basicBlock0 = sortedTierBlocks(blocks, 'basic')[0];
    if (basicBlock0) {
      const nextStage = findNextUnclearedStageInBlock(basicBlock0, nodes, clearedNodeIds);
      if (nextStage) {
        return {
          kind: 'openDefense',
          tier: 'basic',
          nodeId: nextStage.id,
          nodeTitle: nodeDisplayTitle(nextStage, isEnglishCopy),
          reason: 'nextStage',
        };
      }
    }

    return { kind: 'openTraining' };
  }

  const basicCleared = countTierClearedStages(blocks, nodes, 'basic', clearedNodeIds);
  const advancedCleared = countTierClearedStages(blocks, nodes, 'advanced', clearedNodeIds);
  const preferredTier: PlayMapTier = advancedCleared > basicCleared ? 'advanced' : 'basic';
  const tiersToTry: PlayMapTier[] = preferredTier === 'basic'
    ? ['basic', 'advanced']
    : ['advanced', 'basic'];

  for (const tier of tiersToTry) {
    if (tier === 'basic' && tutorial && !tutorialCleared) {
      return resolveTutorialGuidance(tutorial, isEnglishCopy);
    }

    const frontierGuidance = resolvePlayableFrontier(
      tier,
      blocks,
      nodes,
      clearedNodeIds,
      true,
      isEnglishCopy,
    );
    if (frontierGuidance) {
      return frontierGuidance;
    }
  }

  return { kind: 'openTraining' };
}

export function buildDefenseNodeHash(nodeId: string): string {
  return `#phrase-defense?nodeId=${encodeURIComponent(nodeId)}`;
}

export const TRAINING_ROUTE_HASH = '#training';

export function defenseGuidancePrimaryLabel(
  guidance: Extract<DefenseTrainingGuidance, { kind: 'openDefense' }>,
  isEnglishCopy: boolean,
): string {
  if (guidance.reason === 'tutorial') {
    return isEnglishCopy ? 'Start first-time setup' : 'はじめての設定を始める';
  }
  return isEnglishCopy ? 'Continue Phrase Defense' : 'フレーズディフェンスを続ける';
}

export function trainingGuidancePrimaryLabel(
  isEnglishCopy: boolean,
  todayStreakUpdated: boolean,
): string {
  if (todayStreakUpdated) {
    return isEnglishCopy ? 'Go to Training' : 'トレーニングへ';
  }
  return isEnglishCopy ? "Update today's streak" : '今日の連続記録を更新';
}

export function defenseGuidanceBodyCopy(
  guidance: DefenseTrainingGuidance,
  isEnglishCopy: boolean,
  todayStreakUpdated = false,
): string | null {
  if (guidance.kind === 'openDefense') {
    const quotedTitle = isEnglishCopy
      ? `"${guidance.nodeTitle}"`
      : `「${guidance.nodeTitle}」`;
    if (guidance.reason === 'tutorial') {
      return isEnglishCopy
        ? `Set up your input with ${quotedTitle}.`
        : `${quotedTitle}で入力設定を行いましょう。`;
    }
    return isEnglishCopy
      ? `Next up: ${quotedTitle}`
      : `次は${quotedTitle}です。`;
  }
  if (guidance.kind === 'openTraining') {
    if (todayStreakUpdated) {
      return isEnglishCopy
        ? "Today's streak is already updated. Keep building skills in Training."
        : '今日の連続記録は更新済みです。さらにトレーニングでスキルを伸ばしましょう。';
    }
    return isEnglishCopy
      ? "Today's training streak is not updated yet. Play Training to keep it going."
      : '今日の連続記録はまだ更新されていません。トレーニングで更新しましょう。';
  }
  return null;
}
