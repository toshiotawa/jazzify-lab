import {
  buildPlayDescentLayout,
  findFrontierNodeId,
  getAccessiblePlayBlockIndex,
  isPlayDescentBlockUnlocked,
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
  nodeKind: 'stage' | 'quest' = 'stage',
): PlayMapNode => ({
  id,
  blockId,
  sortOrder,
  nodeKind,
  survivalMapCategory: null,
  survivalStageNumber: null,
  defenseStageId: nodeKind === 'stage' ? `stage-${id}` : null,
  lessonId: nodeKind === 'quest' ? `lesson-${id}` : null,
  title: `Title ${id}`,
  titleEn: `Title EN ${id}`,
  requiredRank: 'C',
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
  it('requires previous block stage clears for premium users', () => {
    const nodes = [
      makeNode('a1', blockA.id, 0),
      makeNode('a2', blockA.id, 1),
      makeNode('b1', blockB.id, 0),
    ];
    const layout = buildPlayDescentLayout([blockA, blockB], nodes, 'basic');
    const cleared = new Set<string>(['a1']);
    expect(isPlayDescentBlockUnlocked(0, layout.blocks, cleared, true)).toBe(true);
    expect(isPlayDescentBlockUnlocked(1, layout.blocks, cleared, true)).toBe(false);
    expect(isPlayDescentBlockUnlocked(1, layout.blocks, new Set(['a1', 'a2']), true)).toBe(true);
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
