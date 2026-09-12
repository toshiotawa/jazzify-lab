import type { PlayMapBlock, PlayMapNode, PlayMapTier } from '@/platform/supabasePlayMap';
import {
  LANE_X,
  MAP_LOGICAL_WIDTH,
  type LaneKey,
} from '@/components/survival/descent/descentLayout';

const Y_TOP_PADDING = 56;
const Y_HEADER_TO_FIRST = 80;
const Y_STAGE_GAP = 130;
const Y_BEFORE_BIG = 170;
const Y_DOOR_TO_NEXT_HEADER = 70;
const Y_DOOR_OFFSET_FROM_BIG = -10;
const BIG_LANDING_HEIGHT = 180;

export interface PlayNodePosition {
  nodeId: string;
  node: PlayMapNode;
  x: number;
  y: number;
  lane: LaneKey;
  landingType: 'small' | 'big';
  blockKey: string;
  displayLabel: string;
}

export interface PlayBlockLayout {
  blockKey: string;
  blockIndex: number;
  blockId: string;
  label: string;
  labelEn: string;
  headerY: number;
  doorY: number;
  bigLandingY: number;
  startY: number;
  endY: number;
  nodes: PlayNodePosition[];
}

export interface PlayDescentLayout {
  blocks: PlayBlockLayout[];
  totalHeight: number;
  logicalWidth: number;
  nodePositions: Map<string, PlayNodePosition>;
}

function assignLane(indexInBlock: number, isLastInBlock: boolean): LaneKey {
  if (isLastInBlock) return 'C';
  return indexInBlock % 2 === 0 ? 'L' : 'R';
}

function buildLayoutForBlock(
  block: PlayMapBlock,
  blockIndex: number,
  nodes: readonly PlayMapNode[],
  startY: number,
  stageLabelOffset: number,
): { layout: PlayBlockLayout; nextStageLabel: number } {
  const blockNodes = nodes
    .filter((n) => n.blockId === block.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const headerY = startY + Y_TOP_PADDING;
  const firstNodeY = headerY + Y_HEADER_TO_FIRST;
  const positions: PlayNodePosition[] = [];
  const count = blockNodes.length;
  let y = firstNodeY;
  let stageLabel = stageLabelOffset;

  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1;
    const lane = assignLane(i, isLast);
    const node = blockNodes[i];
    const displayLabel = node.nodeKind === 'quest' ? '?' : String(stageLabel);
    if (node.nodeKind === 'stage') {
      stageLabel += 1;
    }
    positions.push({
      nodeId: node.id,
      node,
      x: LANE_X[lane],
      y,
      lane,
      landingType: isLast ? 'big' : 'small',
      blockKey: block.blockKey,
      displayLabel,
    });
    if (!isLast) {
      y += i === count - 2 ? Y_BEFORE_BIG : Y_STAGE_GAP;
    }
  }

  const bigLandingY = positions.length > 0 ? positions[positions.length - 1].y : firstNodeY;
  const doorY = bigLandingY + Y_DOOR_OFFSET_FROM_BIG;
  const endY = bigLandingY + BIG_LANDING_HEIGHT / 2 + Y_DOOR_TO_NEXT_HEADER;

  return {
    layout: {
      blockKey: block.blockKey,
      blockIndex,
      blockId: block.id,
      label: block.label,
      labelEn: block.labelEn,
      headerY,
      doorY,
      bigLandingY,
      startY,
      endY,
      nodes: positions,
    },
    nextStageLabel: stageLabel,
  };
}

export const buildPlayDescentLayout = (
  blocks: readonly PlayMapBlock[],
  nodes: readonly PlayMapNode[],
  tier: PlayMapTier,
): PlayDescentLayout => {
  const tierBlocks = blocks
    .filter((b) => b.tier === tier)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const blockLayouts: PlayBlockLayout[] = [];
  const nodePositions = new Map<string, PlayNodePosition>();
  let cursorY = 0;
  let stageLabel = 1;

  tierBlocks.forEach((block, blockIndex) => {
    const { layout, nextStageLabel } = buildLayoutForBlock(
      block,
      blockIndex,
      nodes,
      cursorY,
      stageLabel,
    );
    blockLayouts.push(layout);
    layout.nodes.forEach((node) => nodePositions.set(node.nodeId, node));
    cursorY = layout.endY;
    stageLabel = nextStageLabel;
  });

  const totalHeight = blockLayouts.length > 0 ? blockLayouts[blockLayouts.length - 1].endY : 0;

  return {
    blocks: blockLayouts,
    totalHeight,
    logicalWidth: MAP_LOGICAL_WIDTH,
    nodePositions,
  };
};

export const getPlayNodePosition = (
  layout: PlayDescentLayout,
  nodeId: string,
): PlayNodePosition | undefined => layout.nodePositions.get(nodeId);

export const isPlayDescentBlockUnlocked = (
  blockIndex: number,
  blockLayouts: readonly PlayBlockLayout[],
  clearedNodeIds: ReadonlySet<string>,
  isPremium: boolean,
): boolean => {
  if (blockIndex === 0) return true;
  if (!isPremium && blockIndex >= 1) return false;
  const prev = blockLayouts[blockIndex - 1];
  if (!prev) return blockIndex === 0;
  const stageNodes = prev.nodes.filter((n) => n.node.nodeKind === 'stage');
  if (stageNodes.length === 0) return true;
  return stageNodes.every((n) => clearedNodeIds.has(n.nodeId));
};

export const getAccessiblePlayBlockIndex = (
  blockLayouts: readonly PlayBlockLayout[],
  clearedNodeIds: ReadonlySet<string>,
  isPremium: boolean,
): number => {
  const frontier = findFrontierNodeId(blockLayouts, clearedNodeIds, isPremium);
  if (!frontier) return Math.max(0, blockLayouts.length - 1);
  const blockIndex = blockLayouts.findIndex((b) => b.nodes.some((n) => n.nodeId === frontier));
  if (blockIndex < 0) return 0;
  const block = blockLayouts[blockIndex];
  const stageNodes = block.nodes.filter((n) => n.node.nodeKind === 'stage');
  const blockCleared = stageNodes.length > 0
    && stageNodes.every((n) => clearedNodeIds.has(n.nodeId));
  if (blockCleared) {
    return Math.min(blockIndex + 1, blockLayouts.length - 1);
  }
  return blockIndex;
};

export const findFrontierNodeId = (
  blockLayouts: readonly PlayBlockLayout[],
  clearedNodeIds: ReadonlySet<string>,
  isPremium: boolean,
): string | null => {
  for (const blockLayout of blockLayouts) {
    if (!isPlayDescentBlockUnlocked(blockLayout.blockIndex, blockLayouts, clearedNodeIds, isPremium)) {
      continue;
    }
    for (const node of blockLayout.nodes) {
      if (!clearedNodeIds.has(node.nodeId)) {
        return node.nodeId;
      }
    }
  }
  const lastBlock = blockLayouts[blockLayouts.length - 1];
  const lastNode = lastBlock?.nodes[lastBlock.nodes.length - 1];
  return lastNode?.nodeId ?? null;
};

export const countStageNodes = (layout: PlayDescentLayout): number => {
  let count = 0;
  layout.blocks.forEach((block) => {
    block.nodes.forEach((node) => {
      if (node.node.nodeKind === 'stage') count += 1;
    });
  });
  return count;
};

export const countClearedStageNodes = (
  layout: PlayDescentLayout,
  clearedNodeIds: ReadonlySet<string>,
): number => {
  let count = 0;
  layout.blocks.forEach((block) => {
    block.nodes.forEach((node) => {
      if (node.node.nodeKind === 'stage' && clearedNodeIds.has(node.nodeId)) {
        count += 1;
      }
    });
  });
  return count;
};
