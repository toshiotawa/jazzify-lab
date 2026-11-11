import type { PlayMapBlock, PlayMapNode } from '@/platform/supabasePlayMap';
import { isSoftLandingPaywallSource } from '@/utils/analytics/softLandingOffer';
import {
  defenseBlockCompleteTrainingLabel,
  defenseBlockCompleteTrialLabel,
  defenseGuidanceBodyCopy,
  defenseResultNextStepLabel,
  resolveDefenseTrainingGuidance,
  resolveDefenseTrainingGuidanceAfterTutorial,
  trainingGuidancePrimaryLabel,
} from '@/utils/defenseTrainingGuidance';

const advancedBlock: PlayMapBlock = {
  id: 'advanced-block',
  mode: 'defense',
  tier: 'advanced',
  blockKey: 'intro',
  label: 'はじめに',
  labelEn: 'Introduction',
  sortOrder: 0,
};

const advancedFloor2: PlayMapBlock = {
  id: 'advanced-floor-2',
  mode: 'defense',
  tier: 'advanced',
  blockKey: 'floor-2',
  label: '第2階層',
  labelEn: 'Floor 2',
  sortOrder: 1,
};

const makeNode = (
  id: string,
  blockId: string,
  sortOrder: number,
  nodeKind: 'stage' | 'tutorial',
  title = `Title ${id}`,
): PlayMapNode => ({
  id,
  blockId,
  sortOrder,
  nodeKind,
  tutorialKey: nodeKind === 'tutorial' ? 'defense-input-setup-v1' : null,
  survivalMapCategory: null,
  survivalStageNumber: null,
  defenseStageId: nodeKind === 'stage' ? `stage-${id}` : null,
  lessonId: null,
  title,
  titleEn: title,
  requiredRank: 'C',
  difficultyLevel: null,
});

const floorNodes: PlayMapNode[] = [
  makeNode('tutorial', advancedBlock.id, -1, 'tutorial', 'はじめての設定'),
  makeNode('stage-1', advancedBlock.id, 0, 'stage', 'ステージ 1-1'),
  makeNode('stage-2', advancedBlock.id, 1, 'stage', 'ステージ 1-2'),
];

const floor2Nodes: PlayMapNode[] = [
  makeNode('floor2-1', advancedFloor2.id, 0, 'stage', 'ステージ 2-1'),
];

describe('resolveDefenseTrainingGuidance', () => {
  it('guides free users to the tutorial first', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: false,
      blocks: [advancedBlock],
      nodes: floorNodes,
      clearedNodeIds: new Set(),
    });

    expect(guidance).toEqual({
      kind: 'openDefense',
      tier: 'advanced',
      nodeId: 'tutorial',
      nodeTitle: 'はじめての設定',
      reason: 'tutorial',
    });
  });

  it('guides free users to the next floor stage after tutorial', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: false,
      blocks: [advancedBlock],
      nodes: floorNodes,
      clearedNodeIds: new Set(['tutorial']),
    });

    expect(guidance).toMatchObject({
      kind: 'openDefense',
      tier: 'advanced',
      nodeId: 'stage-1',
      reason: 'nextStage',
    });
  });

  it('guides free users to the floor 2 upsell after floor 1 is cleared', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: false,
      blocks: [advancedBlock, advancedFloor2],
      nodes: [...floorNodes, ...floor2Nodes],
      clearedNodeIds: new Set(['tutorial', 'stage-1', 'stage-2']),
    });

    expect(guidance).toEqual({ kind: 'defenseBlockComplete' });
  });

  it('guides premium users to floor 2 after floor 1 is cleared', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: true,
      blocks: [advancedBlock, advancedFloor2],
      nodes: [...floorNodes, ...floor2Nodes],
      clearedNodeIds: new Set(['tutorial', 'stage-1', 'stage-2']),
    });

    expect(guidance).toMatchObject({
      kind: 'openDefense',
      tier: 'advanced',
      nodeId: 'floor2-1',
      reason: 'nextStage',
    });
  });

  it('guides premium users to training when every stage is cleared', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: true,
      blocks: [advancedBlock, advancedFloor2],
      nodes: [...floorNodes, ...floor2Nodes],
      clearedNodeIds: new Set([
        'tutorial',
        'stage-1',
        'stage-2',
        'floor2-1',
      ]),
    });

    expect(guidance).toEqual({ kind: 'openTraining' });
  });

  it('guides to the first stage after tutorial even when all stages are cleared', () => {
    const guidance = resolveDefenseTrainingGuidanceAfterTutorial({
      isPremiumMember: true,
      blocks: [advancedBlock, advancedFloor2],
      nodes: [...floorNodes, ...floor2Nodes],
      clearedNodeIds: new Set([
        'tutorial',
        'stage-1',
        'stage-2',
        'floor2-1',
      ]),
    });

    expect(guidance).toMatchObject({
      kind: 'openDefense',
      tier: 'advanced',
      nodeId: 'stage-1',
      nodeTitle: 'ステージ 1-1',
      reason: 'nextStage',
    });
  });
});

describe('isSoftLandingPaywallSource', () => {
  it('includes phrase_defense', () => {
    expect(isSoftLandingPaywallSource('phrase_defense')).toBe(true);
  });
});

describe('defenseResultNextStepLabel', () => {
  it('uses next-stage copy only for regular uncleared stages', () => {
    expect(
      defenseResultNextStepLabel(
        {
          kind: 'openDefense',
          tier: 'advanced',
          nodeId: 'stage-1',
          nodeTitle: 'フレーズ I',
          reason: 'nextStage',
        },
        false,
      ),
    ).toBe('次のステージ');
    expect(
      defenseResultNextStepLabel(
        {
          kind: 'openDefense',
          tier: 'advanced',
          nodeId: 'stage-1',
          nodeTitle: 'Phrase I',
          reason: 'nextStage',
        },
        true,
      ),
    ).toBe('Next stage');
  });

  it('does not send regular stage results to training or block complete', () => {
    expect(defenseResultNextStepLabel({ kind: 'openTraining' }, false)).toBeNull();
    expect(defenseResultNextStepLabel({ kind: 'defenseBlockComplete' }, false)).toBeNull();
    expect(
      defenseResultNextStepLabel(
        {
          kind: 'openDefense',
          tier: 'advanced',
          nodeId: 'tutorial',
          nodeTitle: 'はじめての設定',
          reason: 'tutorial',
        },
        false,
      ),
    ).toBeNull();
  });
});

describe('block complete copy', () => {
  it('offers the 7-day trial, training, and map return in that order', () => {
    expect(defenseBlockCompleteTrialLabel(false)).toBe('7日無料で続きを試す');
    expect(defenseBlockCompleteTrainingLabel(false)).toBe('トレーニングを試す');
    expect(defenseBlockCompleteTrainingLabel(true)).toBe('Try Training');
  });
});

describe('training guidance copy', () => {
  it('asks to update the streak when today is not recorded', () => {
    expect(trainingGuidancePrimaryLabel(false, false)).toBe('今日の連続記録を更新');
    expect(defenseGuidanceBodyCopy({ kind: 'openTraining' }, false, false)).toBe(
      '今日の連続記録はまだ更新されていません。トレーニングで更新しましょう。',
    );
  });

  it('uses keep-going copy when today is already recorded', () => {
    expect(trainingGuidancePrimaryLabel(false, true)).toBe('トレーニングへ');
    expect(defenseGuidanceBodyCopy({ kind: 'openTraining' }, false, true)).toBe(
      '今日の連続記録は更新済みです。さらにトレーニングでスキルを伸ばしましょう。',
    );
  });
});
