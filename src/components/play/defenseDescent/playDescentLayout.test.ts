import {
  buildPlayDescentLayout,
  findFrontierNodeId,
  getAccessiblePlayBlockIndex,
  getUnlockedPlayNodeIds,
  isPlayDescentBlockUnlocked,
  isPlayDescentNodeUnlocked,
} from '@/components/play/defenseDescent/playDescentLayout';
import type { PlayMapBlock, PlayMapNode } from '@/platform/supabasePlayMap';
import { LANE_X } from '@/components/survival/descent/descentLayout';

const blockA: PlayMapBlock = {
  id: 'block-a',
  mode: 'defense',
  tier: 'basic',
  blockKey: 'intro',
  label: 'はじめに',
  labelEn: 'Introduction',
  sortOrder: 0,
};

const blockB: PlayMapBlock = {
  id: 'block-b',
  mode: 'defense',
  tier: 'basic',
  blockKey: 'next',
  label: '次',
  labelEn: 'Next',
  sortOrder: 1,
};

const makeNode = (
  id: string,
  blockId: string,
  sortOrder: number,
  nodeKind: 'stage' | 'quest' | 'tutorial' = 'stage',
): PlayMapNode => ({
  id,
  blockId,
  sortOrder,
  nodeKind,
  tutorialKey: nodeKind === 'tutorial' ? 'defense-input-setup-v1' : null,
  survivalMapCategory: null,
  survivalStageNumber: null,
  defenseStageId: nodeKind === 'stage' ? `stage-${id}` : null,
  lessonId: nodeKind === 'quest' ? `lesson-${id}` : null,
  title: `Title ${id}`,
  titleEn: `Title EN ${id}`,
  requiredRank: 'C',
  difficultyLevel: null,
});

describe('buildPlayDescentLayout', () => {
  it('assigns alternating lanes with last node centered on big landing', () => {
    const nodes = [
      makeNode('n1', blockA.id, 0),
      makeNode('n2', blockA.id, 1),
      makeNode('n3', blockA.id, 2),
    ];
    const layout = buildPlayDescentLayout([blockA], nodes, 'basic');
    const block = layout.blocks[0];
    expect(block.nodes).toHaveLength(3);
    expect(block.nodes[0].lane).toBe('L');
    expect(block.nodes[0].x).toBe(LANE_X.L);
    expect(block.nodes[1].lane).toBe('R');
    expect(block.nodes[2].lane).toBe('C');
    expect(block.nodes[2].landingType).toBe('big');
  });

  it('numbers stage nodes sequentially and uses ? for quest nodes', () => {
    const nodes = [
      makeNode('q1', blockA.id, -1, 'quest'),
      makeNode('s1', blockA.id, 0, 'stage'),
      makeNode('s2', blockA.id, 1, 'stage'),
    ];
    const layout = buildPlayDescentLayout([blockA], nodes, 'basic');
    expect(layout.blocks[0].nodes.map((n) => n.displayLabel)).toEqual(['?', '1', '2']);
  });

  it('labels tutorial nodes as intro and does not block stage unlock', () => {
    const nodes = [
      makeNode('t1', blockA.id, -1, 'tutorial'),
      makeNode('s1', blockA.id, 0, 'stage'),
    ];
    const layout = buildPlayDescentLayout([blockA], nodes, 'basic', false);
    expect(layout.blocks[0].nodes[0].displayLabel).toBe('入門');
    const cleared = new Set<string>();
    expect(isPlayDescentNodeUnlocked('s1', layout.blocks, cleared, true)).toBe(true);
  });

  it('chains block Y positions without overlap', () => {
    const nodes = [
      makeNode('a1', blockA.id, 0),
      makeNode('b1', blockB.id, 0),
    ];
    const layout = buildPlayDescentLayout([blockA, blockB], nodes, 'basic');
    expect(layout.blocks).toHaveLength(2);
    expect(layout.blocks[1].startY).toBe(layout.blocks[0].endY);
    expect(layout.totalHeight).toBe(layout.blocks[1].endY);
  });
});

describe('isPlayDescentBlockUnlocked', () => {
  it('requires previous block all node clears for premium users', () => {
    const nodes = [
      makeNode('a1', blockA.id, 0),
      makeNode('q1', blockA.id, 1, 'quest'),
      makeNode('b1', blockB.id, 0),
    ];
    const layout = buildPlayDescentLayout([blockA, blockB], nodes, 'basic');
    const clearedStageOnly = new Set<string>(['a1']);
    expect(isPlayDescentBlockUnlocked(0, layout.blocks, clearedStageOnly, true)).toBe(true);
    expect(isPlayDescentBlockUnlocked(1, layout.blocks, clearedStageOnly, true)).toBe(false);
    expect(isPlayDescentBlockUnlocked(1, layout.blocks, new Set(['a1', 'q1']), true)).toBe(true);
  });
});

describe('isPlayDescentNodeUnlocked', () => {
  it('requires prior nodes in block including quest nodes', () => {
    const nodes = [
      makeNode('q1', blockA.id, 0, 'quest'),
      makeNode('s1', blockA.id, 1, 'stage'),
      makeNode('s2', blockA.id, 2, 'stage'),
    ];
    const layout = buildPlayDescentLayout([blockA], nodes, 'basic');
    const cleared = new Set<string>();
    expect(isPlayDescentNodeUnlocked('q1', layout.blocks, cleared, true)).toBe(true);
    expect(isPlayDescentNodeUnlocked('s1', layout.blocks, cleared, true)).toBe(false);
    expect(isPlayDescentNodeUnlocked('s1', layout.blocks, new Set(['q1']), true)).toBe(true);
    expect(isPlayDescentNodeUnlocked('s2', layout.blocks, new Set(['q1']), true)).toBe(false);
    expect(isPlayDescentNodeUnlocked('s2', layout.blocks, new Set(['q1', 's1']), true)).toBe(true);
  });

  it('allows replay of cleared nodes', () => {
    const nodes = [
      makeNode('s1', blockA.id, 0, 'stage'),
      makeNode('s2', blockA.id, 1, 'stage'),
    ];
    const layout = buildPlayDescentLayout([blockA], nodes, 'basic');
    const cleared = new Set<string>(['s1']);
    expect(isPlayDescentNodeUnlocked('s1', layout.blocks, cleared, true)).toBe(true);
  });
});

describe('getUnlockedPlayNodeIds', () => {
  it('returns only frontier and cleared nodes', () => {
    const nodes = [
      makeNode('s1', blockA.id, 0, 'stage'),
      makeNode('s2', blockA.id, 1, 'stage'),
    ];
    const layout = buildPlayDescentLayout([blockA], nodes, 'basic');
    const cleared = new Set<string>(['s1']);
    const unlocked = getUnlockedPlayNodeIds(layout.blocks, cleared, true);
    expect(unlocked.has('s1')).toBe(true);
    expect(unlocked.has('s2')).toBe(true);
  });
});

describe('frontier helpers', () => {
  it('finds first uncleared node in unlocked blocks', () => {
    const nodes = [
      makeNode('a1', blockA.id, 0),
      makeNode('a2', blockA.id, 1),
      makeNode('b1', blockB.id, 0),
    ];
    const layout = buildPlayDescentLayout([blockA, blockB], nodes, 'basic');
    const cleared = new Set<string>(['a1']);
    expect(findFrontierNodeId(layout.blocks, cleared, true)).toBe('a2');
    expect(getAccessiblePlayBlockIndex(layout.blocks, cleared, true)).toBe(0);
  });
});
