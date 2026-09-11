import type { PlayMapBlock, PlayMapNode } from '@/platform/supabasePlayMap';

interface WorldNodeLayout {
  node: PlayMapNode;
  blockIndex: number;
  nodeIndexInBlock: number;
  x: number;
  y: number;
}

interface WorldBlockLayout {
  block: PlayMapBlock;
  blockIndex: number;
  y: number;
  height: number;
  nodes: WorldNodeLayout[];
}

interface WorldMapLayout {
  blocks: WorldBlockLayout[];
  totalHeight: number;
  logicalWidth: number;
}

const BLOCK_HEADER_HEIGHT = 56;
const NODE_ROW_HEIGHT = 88;
const BLOCK_PADDING = 24;
const LOGICAL_WIDTH = 720;

export const buildWorldMapLayout = (
  blocks: readonly PlayMapBlock[],
  nodes: readonly PlayMapNode[],
  tier: 'basic' | 'advanced',
): WorldMapLayout => {
  const tierBlocks = blocks
    .filter((b) => b.tier === tier)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  let y = 40;
  const blockLayouts: WorldBlockLayout[] = [];

  tierBlocks.forEach((block, blockIndex) => {
    const blockNodes = nodes
      .filter((n) => n.blockId === block.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const nodeLayouts: WorldNodeLayout[] = blockNodes.map((node, nodeIndexInBlock) => ({
      node,
      blockIndex,
      nodeIndexInBlock,
      x: LOGICAL_WIDTH / 2 + (nodeIndexInBlock % 2 === 0 ? -120 : 120),
      y: y + BLOCK_HEADER_HEIGHT + nodeIndexInBlock * NODE_ROW_HEIGHT,
    }));

    const height = BLOCK_HEADER_HEIGHT + Math.max(blockNodes.length, 1) * NODE_ROW_HEIGHT + BLOCK_PADDING;
    blockLayouts.push({ block, blockIndex, y, height, nodes: nodeLayouts });
    y += height + 32;
  });

  return { blocks: blockLayouts, totalHeight: y + 40, logicalWidth: LOGICAL_WIDTH };
};


export const isBlockUnlocked = (
  blockIndex: number,
  blockLayouts: readonly WorldBlockLayout[],
  clearedNodeIds: ReadonlySet<string>,
  isPremium: boolean,
): boolean => {
  if (blockIndex === 0) return true;
  if (!isPremium && blockIndex >= 1) return false;
  const prev = blockLayouts[blockIndex - 1];
  if (!prev) return blockIndex === 0;
  const stageNodes = prev.nodes.filter((n) => n.node.nodeKind === 'stage');
  if (stageNodes.length === 0) return true;
  return stageNodes.every((n) => clearedNodeIds.has(n.node.id));
};
