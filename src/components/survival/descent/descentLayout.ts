/**
 * 魔王城降下マップ: レイアウト座標計算
 * マップ座標系は「論理ピクセル(lp)」で設計。描画側でビューポート幅にフィットするようスケールする。
 * 3レーン固定: 左 / 中央 / 右。ブロック末尾は必ず中央レーン＆大踊り場。
 */

import { ALL_BLOCKS, BlockMeta, getBlockByKey, getBlockForStage } from './descentBlocks';
import { BlockKey } from '../SurvivalStageDefinitions';

/** ロジカル座標系の幅（デザイン基準・スマホ縦画面相当） */
export const MAP_LOGICAL_WIDTH = 390;

/** 3レーンの X 座標（論理座標） */
export const LANE_X = {
  L: 95,
  C: MAP_LOGICAL_WIDTH / 2,
  R: 295,
} as const;

export type LaneKey = keyof typeof LANE_X;

/** Y 間隔ルール */
const Y_TOP_PADDING = 56;            // ブロックヘッダーの上余白（タイトルプレート上端分）
const Y_HEADER_TO_FIRST = 80;        // ヘッダープレート → 1つ目の踊り場
const Y_STAGE_GAP = 130;             // 通常踊り場間（小→小）
const Y_BEFORE_BIG = 170;            // 直前踊り場 → 大踊り場
const Y_DOOR_TO_NEXT_HEADER = 70;    // 扉 → 次ブロックヘッダー
const Y_DOOR_OFFSET_FROM_BIG = -10;  // 大踊り場に対する扉の相対Y（上方・奥行き演出）

/** 大踊り場（ブロック末尾ステージ）の相対位置 */
const BIG_LANDING_HEIGHT = 180;
const SMALL_LANDING_HEIGHT = 90;

export interface StagePosition {
  stageNumber: number;
  x: number;
  y: number;
  lane: LaneKey;
  landingType: 'small' | 'big';
  blockKey: BlockKey;
}

export interface BlockLayout {
  blockKey: BlockKey;
  blockIndex: number;
  headerY: number;
  doorY: number;
  bigLandingY: number;
  startY: number;
  endY: number;
  stages: StagePosition[];
}

/** ブロック内ステージに左右交互の lane を割り当て（末尾のみ C）。mixed を含む 6 ステージも同ルール。 */
function assignLane(indexInBlock: number, isLastInBlock: boolean): LaneKey {
  if (isLastInBlock) return 'C';
  return indexInBlock % 2 === 0 ? 'L' : 'R';
}

function buildLayoutForBlock(block: BlockMeta, startY: number): BlockLayout {
  const headerY = startY + Y_TOP_PADDING;
  const firstStageY = headerY + Y_HEADER_TO_FIRST;
  const stages: StagePosition[] = [];
  const count = block.stageCount;
  let y = firstStageY;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const lane = assignLane(i, isLast);
    const stageNumber = block.stageNumbers[i];
    stages.push({
      stageNumber,
      x: LANE_X[lane],
      y,
      lane,
      landingType: isLast ? 'big' : 'small',
      blockKey: block.blockKey,
    });
    if (!isLast) {
      y += i === count - 2 ? Y_BEFORE_BIG : Y_STAGE_GAP;
    }
  }
  const bigLandingY = stages[stages.length - 1].y;
  const doorY = bigLandingY + Y_DOOR_OFFSET_FROM_BIG;
  const endY = bigLandingY + BIG_LANDING_HEIGHT / 2 + Y_DOOR_TO_NEXT_HEADER;
  return {
    blockKey: block.blockKey,
    blockIndex: block.blockIndex,
    headerY,
    doorY,
    bigLandingY,
    startY,
    endY,
    stages,
  };
}

function buildAllLayouts(): BlockLayout[] {
  const layouts: BlockLayout[] = [];
  let cursorY = 0;
  for (const block of ALL_BLOCKS) {
    const layout = buildLayoutForBlock(block, cursorY);
    layouts.push(layout);
    cursorY = layout.endY;
  }
  return layouts;
}

export const ALL_BLOCK_LAYOUTS: BlockLayout[] = buildAllLayouts();

const STAGE_POSITIONS: Map<number, StagePosition> = (() => {
  const map = new Map<number, StagePosition>();
  for (const layout of ALL_BLOCK_LAYOUTS) {
    for (const stage of layout.stages) {
      map.set(stage.stageNumber, stage);
    }
  }
  return map;
})();

export function getStagePosition(stageNumber: number): StagePosition | undefined {
  return STAGE_POSITIONS.get(stageNumber);
}

export function getBlockLayout(blockKey: BlockKey): BlockLayout | undefined {
  return ALL_BLOCK_LAYOUTS.find(l => l.blockKey === blockKey);
}

export function getBlockLayoutByIndex(blockIndex: number): BlockLayout | undefined {
  return ALL_BLOCK_LAYOUTS[blockIndex];
}

/** マップ全長（論理px） */
export const MAP_LOGICAL_HEIGHT = ALL_BLOCK_LAYOUTS[ALL_BLOCK_LAYOUTS.length - 1].endY;

/** ステージが属するブロックのレイアウトを返す */
export function getBlockLayoutForStage(stageNumber: number): BlockLayout | undefined {
  const block = getBlockForStage(stageNumber);
  if (!block) return undefined;
  return getBlockLayout(block.blockKey);
}

/** ユーティリティ: ブロックの全ノードを覆う y 範囲 */
export function getBlockNodeYRange(blockKey: BlockKey): { min: number; max: number } | undefined {
  const block = getBlockByKey(blockKey);
  if (!block) return undefined;
  const layout = getBlockLayout(blockKey);
  if (!layout) return undefined;
  return { min: layout.stages[0].y, max: layout.stages[layout.stages.length - 1].y };
}

export const LAYOUT_CONSTANTS = {
  MAP_LOGICAL_WIDTH,
  MAP_LOGICAL_HEIGHT,
  LANE_X,
  Y_STAGE_GAP,
  Y_BEFORE_BIG,
  BIG_LANDING_HEIGHT,
  SMALL_LANDING_HEIGHT,
  Y_HEADER_TO_FIRST,
  Y_TOP_PADDING,
  Y_DOOR_OFFSET_FROM_BIG,
  Y_DOOR_TO_NEXT_HEADER,
} as const;
