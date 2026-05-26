/**
 * Block-level survival balance: `survival_stage_blocks` optional columns override code defaults.
 */

import { resolveBossMaxHp } from '@/components/survival/boss/SurvivalBossEngine';
import { getBlockForStage } from '@/components/survival/descent/descentBlocks';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import {
  isBlockLastStage,
  PHRASES_STAGE_PLAYER_MAX_HP,
  STAGE_FIRST_BLOCK_KILL_QUOTA,
  STAGE_KILL_QUOTA,
  STAGE_PLAYER_MAX_HP,
  survivalStageDbBalanceFor,
} from '@/components/survival/SurvivalStageDefinitions';

const isFirstBlockRegularStageDef = (stage: StageDefinition): boolean => {
  if (isBlockLastStage(stage.stageNumber, stage.mapCategory)) return false;
  const block = getBlockForStage(stage.stageNumber, stage.mapCategory);
  return block?.blockIndex === 0;
};

const isFirstBlockBossStageDef = (stage: StageDefinition): boolean => {
  if (!isBlockLastStage(stage.stageNumber, stage.mapCategory)) return false;
  const block = getBlockForStage(stage.stageNumber, stage.mapCategory);
  return block?.blockIndex === 0;
};

/** 通常戦プレイヤー初期 HP（ブロック DB または Phrases/Basic のデフォルト）。 */
export const resolveBlockPlayerMaxHp = (stage: StageDefinition): number => {
  const ov = survivalStageDbBalanceFor(stage.mapCategory, stage.blockKey)?.playerMaxHp;
  if (ov !== undefined && ov > 0) return ov;
  return stage.mapCategory === 'phrases' ? PHRASES_STAGE_PLAYER_MAX_HP : STAGE_PLAYER_MAX_HP;
};

/** 通常戦撃破ノルマ。 */
export const resolveBlockKillQuota = (stage: StageDefinition): number => {
  const ov = survivalStageDbBalanceFor(stage.mapCategory, stage.blockKey)?.killQuota;
  if (ov !== undefined && ov > 0) return ov;
  return isFirstBlockRegularStageDef(stage)
    ? STAGE_FIRST_BLOCK_KILL_QUOTA
    : STAGE_KILL_QUOTA;
};

/** ブロック末尾ボス戦の敵ボス HP。 */
export const resolveBlockBossMaxHp = (stage: StageDefinition): number => {
  const ov = survivalStageDbBalanceFor(stage.mapCategory, stage.blockKey)?.bossMaxHp;
  if (ov !== undefined && ov > 0) return ov;
  const phrase = stage.mapCategory === 'phrases';
  return resolveBossMaxHp(phrase, {
    isFirstBlockBoss: isFirstBlockBossStageDef(stage),
  });
};
