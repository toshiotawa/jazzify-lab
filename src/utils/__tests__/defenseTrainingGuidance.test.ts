import type { PlayMapBlock, PlayMapNode } from '@/platform/supabasePlayMap';
import {
  defenseGuidanceBodyCopy,
  resolveDefenseTrainingGuidance,
  trainingGuidancePrimaryLabel,
} from '@/utils/defenseTrainingGuidance';

const basicBlock: PlayMapBlock = {
  id: 'basic-block',
  mode: 'defense',
  tier: 'basic',
  blockKey: 'intro',
  label: 'はじめに',
  labelEn: 'Introduction',
  sortOrder: 0,
};

const advancedBlock: PlayMapBlock = {
  id: 'advanced-block',
  mode: 'defense',
  tier: 'advanced',
  blockKey: 'intro',
  label: 'はじめに',
  labelEn: 'Introduction',
  sortOrder: 0,
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

const basicNodes: PlayMapNode[] = [
  makeNode('tutorial', basicBlock.id, -1, 'tutorial', 'はじめての設定'),
  makeNode('stage-1', basicBlock.id, 0, 'stage', 'フレーズ I'),
  makeNode('stage-2', basicBlock.id, 1, 'stage', 'フレーズ II'),
];

const advancedNodes: PlayMapNode[] = [
  makeNode('adv-1', advancedBlock.id, 0, 'stage', 'Adv I'),
  makeNode('adv-2', advancedBlock.id, 1, 'stage', 'Adv II'),
];

describe('resolveDefenseTrainingGuidance', () => {
  it('guides free users to the basic tutorial first', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: false,
      blocks: [basicBlock],
      nodes: basicNodes,
      clearedNodeIds: new Set(),
    });

    expect(guidance).toEqual({
      kind: 'openDefense',
      tier: 'basic',
      nodeId: 'tutorial',
      nodeTitle: 'はじめての設定',
      reason: 'tutorial',
    });
  });

  it('guides free users to the next basic block stage after tutorial', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: false,
      blocks: [basicBlock],
      nodes: basicNodes,
      clearedNodeIds: new Set(['tutorial']),
    });

    expect(guidance).toMatchObject({
      kind: 'openDefense',
      tier: 'basic',
      nodeId: 'stage-1',
      reason: 'nextStage',
    });
  });

  it('guides free users to training after basic block 1 stages are cleared', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: false,
      blocks: [basicBlock],
      nodes: basicNodes,
      clearedNodeIds: new Set(['tutorial', 'stage-1', 'stage-2']),
    });

    expect(guidance).toEqual({ kind: 'openTraining' });
  });

  it('guides premium users to the tier with more cleared stages', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: true,
      blocks: [basicBlock, advancedBlock],
      nodes: [...basicNodes, ...advancedNodes],
      clearedNodeIds: new Set(['tutorial', 'adv-1']),
    });

    expect(guidance).toMatchObject({
      kind: 'openDefense',
      tier: 'advanced',
      nodeId: 'adv-2',
      reason: 'nextStage',
    });
  });

  it('defaults premium users to basic when cleared counts are tied', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: true,
      blocks: [basicBlock, advancedBlock],
      nodes: [...basicNodes, ...advancedNodes],
      clearedNodeIds: new Set(['tutorial', 'stage-1', 'adv-1']),
    });

    expect(guidance).toMatchObject({
      kind: 'openDefense',
      tier: 'basic',
      nodeId: 'stage-2',
    });
  });

  it('guides premium users to training when both tiers are fully cleared', () => {
    const guidance = resolveDefenseTrainingGuidance({
      isPremiumMember: true,
      blocks: [basicBlock, advancedBlock],
      nodes: [...basicNodes, ...advancedNodes],
      clearedNodeIds: new Set([
        'tutorial',
        'stage-1',
        'stage-2',
        'adv-1',
        'adv-2',
      ]),
    });

    expect(guidance).toEqual({ kind: 'openTraining' });
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
