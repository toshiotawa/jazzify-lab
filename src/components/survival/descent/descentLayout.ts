/**
 * 魔王城降下マップ: レイアウト座標計算
 * マップ座標系は「論理ピクセル(lp)」で設計。描画側でビューポート幅にフィットするようスケールする。
 * 3レーン固定: 左 / 中央 / 右。ブロック末尾は必ず中央レーン＆大踊り場。
 * Basic / Songs マップごとに別々のレイアウトを管理する。
 */

import { BlockMeta, getBlocksByCategory, getBlockByKey, getBlockForStage } from './descentBlocks';
import { BlockKey } from '../SurvivalStageDefinitions';
import {
  SurvivalMapCategory,
  DEFAULT_SURVIVAL_MAP_CATEGORY,
  SURVIVAL_DESCENT_MAP_CATEGORIES,
} from '../SurvivalTypes';

/** ロジカル座標系の幅（デザイン基準・横長レイアウト寄り） */
export const MAP_LOGICAL_WIDTH = 560;

/** 3レーンの X 座標（論理座標） */
export const LANE_X = {
  L: 120,
  C: MAP_LOGICAL_WIDTH / 2,
  R: 440,
} as const;

export type LaneKey = keyof typeof LANE_X;

/** Y 間隔ルール */
const Y_TOP_PADDING = 56;
const Y_HEADER_TO_FIRST = 80;
const Y_STAGE_GAP = 130;
const Y_BEFORE_BIG = 170;
const Y_DOOR_TO_NEXT_HEADER = 70;
const Y_DOOR_OFFSET_FROM_BIG = -10;

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

function buildAllLayouts(category: SurvivalMapCategory): BlockLayout[] {
  const layouts: BlockLayout[] = [];
  let cursorY = 0;
  for (const block of getBlocksByCategory(category)) {
    const layout = buildLayoutForBlock(block, cursorY);
    layouts.push(layout);
    cursorY = layout.endY;
  }
  return layouts;
}

const LAYOUTS_BY_CATEGORY: Record<SurvivalMapCategory, BlockLayout[]> = {
  basic: [],
  songs: [],
  phrases: [],
  lesson: [],
};

const STAGE_POSITIONS_BY_CATEGORY: Record<SurvivalMapCategory, Map<number, StagePosition>> = {
  basic: new Map(),
  songs: new Map(),
  phrases: new Map(),
  lesson: new Map(),
};

const MAP_LOGICAL_HEIGHT_BY_CATEGORY: Record<SurvivalMapCategory, number> = {
  basic: 0,
  songs: 0,
  phrases: 0,
  lesson: 0,
};

/** 互換用: Basic マップのレイアウト一覧 */
export let ALL_BLOCK_LAYOUTS: BlockLayout[] = [];

/** 互換用: Basic マップ全長（論理px） */
export let MAP_LOGICAL_HEIGHT = 0;

/** ALL_BLOCKS が更新された後に呼ぶ。全カテゴリを再構築する。 */
export function rebuildDescentLayouts(): void {
  for (const category of SURVIVAL_DESCENT_MAP_CATEGORIES) {
    const layouts = buildAllLayouts(category);
    LAYOUTS_BY_CATEGORY[category] = layouts;
    const positions = STAGE_POSITIONS_BY_CATEGORY[category];
    positions.clear();
    for (const layout of layouts) {
      for (const stage of layout.stages) {
        positions.set(stage.stageNumber, stage);
      }
    }
    MAP_LOGICAL_HEIGHT_BY_CATEGORY[category] = layouts.length > 0
      ? layouts[layouts.length - 1].endY
      : 0;
  }
  ALL_BLOCK_LAYOUTS = LAYOUTS_BY_CATEGORY.basic;
  MAP_LOGICAL_HEIGHT = MAP_LOGICAL_HEIGHT_BY_CATEGORY.basic;
}

export function getBlockLayoutsByCategory(category: SurvivalMapCategory): BlockLayout[] {
  return LAYOUTS_BY_CATEGORY[category];
}

export function getMapLogicalHeightByCategory(category: SurvivalMapCategory): number {
  return MAP_LOGICAL_HEIGHT_BY_CATEGORY[category];
}

export function getStagePosition(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): StagePosition | undefined {
  return STAGE_POSITIONS_BY_CATEGORY[mapCategory].get(stageNumber);
}

export function getBlockLayout(
  blockKey: BlockKey,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): BlockLayout | undefined {
  return LAYOUTS_BY_CATEGORY[mapCategory].find(l => l.blockKey === blockKey);
}

export function getBlockLayoutByIndex(
  blockIndex: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): BlockLayout | undefined {
  return LAYOUTS_BY_CATEGORY[mapCategory][blockIndex];
}

/** ステージが属するブロックのレイアウトを返す */
export function getBlockLayoutForStage(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): BlockLayout | undefined {
  const block = getBlockForStage(stageNumber, mapCategory);
  if (!block) return undefined;
  return getBlockLayout(block.blockKey, mapCategory);
}

/** ユーティリティ: ブロックの全ノードを覆う y 範囲 */
export function getBlockNodeYRange(
  blockKey: BlockKey,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): { min: number; max: number } | undefined {
  const block = getBlockByKey(blockKey, mapCategory);
  if (!block) return undefined;
  const layout = getBlockLayout(blockKey, mapCategory);
  if (!layout) return undefined;
  return { min: layout.stages[0].y, max: layout.stages[layout.stages.length - 1].y };
}

export const LAYOUT_CONSTANTS = {
  MAP_LOGICAL_WIDTH,
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
