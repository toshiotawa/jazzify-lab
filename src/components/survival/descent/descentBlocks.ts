/**
 * 魔王城降下マップ: ブロック（コードタイプ）メタデータ
 * Web版は survival_stages テーブルと survival_stage_blocks でメタを取得。fetchAllStages 完了後に rebuildDescentBlocks を呼ぶ。
 * Basic / Songs マップごとに別々のブロックリストを管理する。
 *
 * ブロック並びとラベルは Supabase `survival_stage_blocks` の値が正。
 * - 並び: `sort_order` 昇順 (未登録のブロックは最小 stage_number 順で末尾に並べる)
 * - ラベル: `label` / `label_en` (未登録時は block_key 文字列をそのまま表示)
 */

import {
  BlockKey,
  bossTypeForBlockIndex,
  getStagesByCategory,
  resolveSurvivalBlockLabel,
  resolveSurvivalBlockSortOrder,
  SurvivalBossType,
} from '../SurvivalStageDefinitions';
import {
  SurvivalMapCategory,
  DEFAULT_SURVIVAL_MAP_CATEGORY,
  SURVIVAL_MAP_CATEGORIES,
} from '../SurvivalTypes';
import { getStageNumbersOfFirstBlock } from './survivalFreeTier';

export interface BlockMeta {
  blockKey: BlockKey;
  blockIndex: number;
  /** ヘッダープレートに表示するラベル（例: "M7"） */
  label: string;
  labelEn: string;
  /** このブロックに含まれるステージ番号（昇順） */
  stageNumbers: number[];
  firstStage: number;
  lastStage: number;
  /** Mixed ステージがある場合の stage number */
  mixedStageNumber: number | null;
  hasMixed: boolean;
  stageCount: number;
  /** ブロック index に基づくボスタイプ (A/B/C ローテーション) */
  bossType: SurvivalBossType;
}

interface BlockBucket {
  stageNumbers: number[];
  mixedStageNumber: number | null;
  firstStageNumber: number;
}

function buildBlocksForCategory(category: SurvivalMapCategory): BlockMeta[] {
  const stages = getStagesByCategory(category);
  if (stages.length === 0) return [];
  const byKey: Map<BlockKey, BlockBucket> = new Map();
  for (const stage of stages) {
    const existing = byKey.get(stage.blockKey);
    if (existing) {
      existing.stageNumbers.push(stage.stageNumber);
      if (stage.isMixedStage) existing.mixedStageNumber = stage.stageNumber;
      if (stage.stageNumber < existing.firstStageNumber) {
        existing.firstStageNumber = stage.stageNumber;
      }
    } else {
      byKey.set(stage.blockKey, {
        stageNumbers: [stage.stageNumber],
        mixedStageNumber: stage.isMixedStage ? stage.stageNumber : null,
        firstStageNumber: stage.stageNumber,
      });
    }
  }

  const blockKeys = Array.from(byKey.keys());
  blockKeys.sort((a, b) => {
    const sa = resolveSurvivalBlockSortOrder(category, a);
    const sb = resolveSurvivalBlockSortOrder(category, b);
    if (sa !== undefined && sb !== undefined) {
      if (sa !== sb) return sa - sb;
    } else if (sa !== undefined) {
      return -1;
    } else if (sb !== undefined) {
      return 1;
    }
    const fa = byKey.get(a)?.firstStageNumber ?? Number.MAX_SAFE_INTEGER;
    const fb = byKey.get(b)?.firstStageNumber ?? Number.MAX_SAFE_INTEGER;
    return fa - fb;
  });

  const result: BlockMeta[] = [];
  for (let blockIndex = 0; blockIndex < blockKeys.length; blockIndex += 1) {
    const blockKey = blockKeys[blockIndex];
    const entry = byKey.get(blockKey);
    if (!entry) continue;
    const sorted = [...entry.stageNumbers].sort((a, b) => a - b);
    const fromDb = resolveSurvivalBlockLabel(category, blockKey);
    result.push({
      blockKey,
      blockIndex,
      label: fromDb?.ja ?? blockKey,
      labelEn: fromDb?.en ?? blockKey,
      stageNumbers: sorted,
      firstStage: sorted[0],
      lastStage: sorted[sorted.length - 1],
      mixedStageNumber: entry.mixedStageNumber,
      hasMixed: entry.mixedStageNumber !== null,
      stageCount: sorted.length,
      bossType: bossTypeForBlockIndex(blockIndex),
    });
  }
  return result;
}

const BLOCKS_BY_CATEGORY: Record<SurvivalMapCategory, BlockMeta[]> = {
  basic: [],
  songs: [],
};

const STAGE_TO_BLOCK_BY_CATEGORY: Record<SurvivalMapCategory, Map<number, BlockMeta>> = {
  basic: new Map(),
  songs: new Map(),
};

/** 互換用: Basic マップのブロック一覧 */
export let ALL_BLOCKS: BlockMeta[] = [];

/** ALL_STAGES が更新された後に呼ぶ。全カテゴリを再構築する。 */
export function rebuildDescentBlocks(): void {
  for (const category of SURVIVAL_MAP_CATEGORIES) {
    const blocks = buildBlocksForCategory(category);
    BLOCKS_BY_CATEGORY[category] = blocks;
    const stageMap = STAGE_TO_BLOCK_BY_CATEGORY[category];
    stageMap.clear();
    for (const block of blocks) {
      for (const stageNumber of block.stageNumbers) {
        stageMap.set(stageNumber, block);
      }
    }
  }
  ALL_BLOCKS = BLOCKS_BY_CATEGORY.basic;
}

export function getBlocksByCategory(category: SurvivalMapCategory): BlockMeta[] {
  return BLOCKS_BY_CATEGORY[category];
}

/**
 * フリープランでプレイ可能なステージ番号（当該マップの第一ブロック＝Basic / Songs 共通ルール）。
 * Web `SurvivalDescentMap` と iOS `SurvivalStageCatalog.freeTierStageNumbers(in:)` と同義。
 */
export function getFreeTierStageNumbers(mapCategory: SurvivalMapCategory): readonly number[] {
  return getStageNumbersOfFirstBlock(getBlocksByCategory(mapCategory));
}

export function getBlockForStage(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): BlockMeta | undefined {
  return STAGE_TO_BLOCK_BY_CATEGORY[mapCategory].get(stageNumber);
}

export function getBlockByKey(
  blockKey: BlockKey,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): BlockMeta | undefined {
  return BLOCKS_BY_CATEGORY[mapCategory].find(b => b.blockKey === blockKey);
}

export function isBlockCleared(
  blockKey: BlockKey,
  clearedStages: ReadonlySet<number>,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): boolean {
  const block = getBlockByKey(blockKey, mapCategory);
  if (!block) return false;
  return block.stageNumbers.every(n => clearedStages.has(n));
}

/**
 * カメラ下限クランプ用: キャラクターがいるブロック + その次のブロックまでを
 * 「閲覧可能」とみなす境界ブロックインデックスを返す。
 */
export function getAccessibleBlockIndex(
  frontierStageNumber: number,
  clearedStages: ReadonlySet<number>,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): number {
  const blocks = BLOCKS_BY_CATEGORY[mapCategory];
  const currentBlock = getBlockForStage(frontierStageNumber, mapCategory);
  if (!currentBlock) return 0;
  if (isBlockCleared(currentBlock.blockKey, clearedStages, mapCategory)) {
    return Math.min(currentBlock.blockIndex + 1, blocks.length - 1);
  }
  return currentBlock.blockIndex;
}
