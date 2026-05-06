/**
 * 魔王城降下マップ: ブロック（コードタイプ）メタデータ
 * 1ブロック = 5 ステージ、Mixed を含むブロックのみ 6 ステージ。
 * 注: Web版は survival_stages テーブルがソース。fetchAllStages 完了後に rebuildDescentBlocks を呼ぶ。
 */

import { ALL_STAGES, BlockKey } from '../SurvivalStageDefinitions';

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
}

const BLOCK_ORDER: BlockKey[] = [
  'major',
  'minor',
  'M7',
  'm7',
  '7',
  'm7b5',
  'mM7',
  'dim7',
  'aug7',
  '6',
  'm6',
  'M7_9',
  'm7_9',
  '7_9_13',
  '7_b9_b13',
  '6_9',
  'm6_9',
  '7_b9_13',
  '7_sharp9_b13',
  'm7b5_11',
  'dimM7',
];

const BLOCK_LABELS: Record<BlockKey, { ja: string; en: string }> = {
  major: { ja: 'メジャー', en: 'Major' },
  minor: { ja: 'マイナー', en: 'Minor' },
  M7: { ja: 'M7', en: 'M7' },
  m7: { ja: 'm7', en: 'm7' },
  '7': { ja: '7', en: '7' },
  m7b5: { ja: 'm7b5', en: 'm7b5' },
  mM7: { ja: 'mM7', en: 'mM7' },
  dim7: { ja: 'dim7', en: 'dim7' },
  aug7: { ja: 'aug7', en: 'aug7' },
  '6': { ja: '6', en: '6' },
  m6: { ja: 'm6', en: 'm6' },
  M7_9: { ja: 'M7(9)', en: 'M7(9)' },
  m7_9: { ja: 'm7(9)', en: 'm7(9)' },
  '7_9_13': { ja: '7(9.13)', en: '7(9.13)' },
  '7_b9_b13': { ja: '7(b9.b13)', en: '7(b9.b13)' },
  '6_9': { ja: '6(9)', en: '6(9)' },
  m6_9: { ja: 'm6(9)', en: 'm6(9)' },
  '7_b9_13': { ja: '7(b9.13)', en: '7(b9.13)' },
  '7_sharp9_b13': { ja: '7(#9.b13)', en: '7(#9.b13)' },
  m7b5_11: { ja: 'm7(b5)(11)', en: 'm7(b5)(11)' },
  dimM7: { ja: 'dim(M7)', en: 'dim(M7)' },
};

function buildBlocks(): BlockMeta[] {
  if (ALL_STAGES.length === 0) return [];
  const byKey: Map<BlockKey, { stageNumbers: number[]; mixedStageNumber: number | null }> = new Map();
  for (const stage of ALL_STAGES) {
    const entry = byKey.get(stage.blockKey) ?? { stageNumbers: [], mixedStageNumber: null };
    entry.stageNumbers.push(stage.stageNumber);
    if (stage.isMixedStage) entry.mixedStageNumber = stage.stageNumber;
    byKey.set(stage.blockKey, entry);
  }

  const result: BlockMeta[] = [];
  for (let blockIndex = 0; blockIndex < BLOCK_ORDER.length; blockIndex += 1) {
    const blockKey = BLOCK_ORDER[blockIndex];
    const entry = byKey.get(blockKey);
    if (!entry) continue;
    const sorted = [...entry.stageNumbers].sort((a, b) => a - b);
    const label = BLOCK_LABELS[blockKey];
    result.push({
      blockKey,
      blockIndex,
      label: label.ja,
      labelEn: label.en,
      stageNumbers: sorted,
      firstStage: sorted[0],
      lastStage: sorted[sorted.length - 1],
      mixedStageNumber: entry.mixedStageNumber,
      hasMixed: entry.mixedStageNumber !== null,
      stageCount: sorted.length,
    });
  }
  return result;
}

export let ALL_BLOCKS: BlockMeta[] = [];

const stageToBlockMap: Map<number, BlockMeta> = new Map();

/** ALL_STAGES が更新された後に呼ぶ。 */
export function rebuildDescentBlocks(): void {
  ALL_BLOCKS = buildBlocks();
  stageToBlockMap.clear();
  for (const block of ALL_BLOCKS) {
    for (const stageNumber of block.stageNumbers) {
      stageToBlockMap.set(stageNumber, block);
    }
  }
}

export function getBlockForStage(stageNumber: number): BlockMeta | undefined {
  return stageToBlockMap.get(stageNumber);
}

export function getBlockByKey(blockKey: BlockKey): BlockMeta | undefined {
  return ALL_BLOCKS.find(b => b.blockKey === blockKey);
}

export function isBlockCleared(blockKey: BlockKey, clearedStages: ReadonlySet<number>): boolean {
  const block = getBlockByKey(blockKey);
  if (!block) return false;
  return block.stageNumbers.every(n => clearedStages.has(n));
}

/**
 * カメラ下限クランプ用: キャラクターがいるブロック + その次のブロックまでを
 * 「閲覧可能」とみなす境界ブロックインデックスを返す。
 */
export function getAccessibleBlockIndex(frontierStageNumber: number, clearedStages: ReadonlySet<number>): number {
  const currentBlock = getBlockForStage(frontierStageNumber);
  if (!currentBlock) return 0;
  if (isBlockCleared(currentBlock.blockKey, clearedStages)) {
    return Math.min(currentBlock.blockIndex + 1, ALL_BLOCKS.length - 1);
  }
  return currentBlock.blockIndex;
}
