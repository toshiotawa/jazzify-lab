import { resolveBlockKillQuota } from '@/utils/survivalBlockBalance';
import { getBlockForStage } from './descent/descentBlocks';
import {
  getStageByNumber,
  isBlockLastStage,
  STAGE_FIRST_BLOCK_KILL_QUOTA,
  STAGE_KILL_QUOTA,
  type StageDefinition,
} from './SurvivalStageDefinitions';
import {
  DEFAULT_SURVIVAL_MAP_CATEGORY,
  type SurvivalMapCategory,
} from './SurvivalTypes';

/** 第一ブロックの通常ステージ（各ブロック末尾のボス戦は除く）。 */
export function isFirstBlockRegularStage(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): boolean {
  if (isBlockLastStage(stageNumber, mapCategory)) return false;
  const block = getBlockForStage(stageNumber, mapCategory);
  return block?.blockIndex === 0;
}

export function getStageKillQuota(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): number {
  const stage = getStageByNumber(stageNumber, mapCategory);
  if (stage) return resolveBlockKillQuota(stage);
  return isFirstBlockRegularStage(stageNumber, mapCategory)
    ? STAGE_FIRST_BLOCK_KILL_QUOTA
    : STAGE_KILL_QUOTA;
}

export function getStageKillQuotaForStage(stage: StageDefinition): number {
  return resolveBlockKillQuota(stage);
}

/** 挑戦（本番）でも鍵盤ハイライト・譜面音符を維持する第一ブロックステージ（ボス戦を含む）。 */
export function hasBeginnerStageAssist(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): boolean {
  const block = getBlockForStage(stageNumber, mapCategory);
  return block?.blockIndex === 0;
}

export function hasBeginnerStageAssistForStage(stage: StageDefinition): boolean {
  return hasBeginnerStageAssist(stage.stageNumber, stage.mapCategory);
}

/** 第一ブロック末尾のボス戦か。 */
export function isFirstBlockBossStage(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): boolean {
  if (!isBlockLastStage(stageNumber, mapCategory)) return false;
  const block = getBlockForStage(stageNumber, mapCategory);
  return block?.blockIndex === 0;
}

export function isFirstBlockBossStageDef(stage: StageDefinition): boolean {
  return isFirstBlockBossStage(stage.stageNumber, stage.mapCategory);
}
