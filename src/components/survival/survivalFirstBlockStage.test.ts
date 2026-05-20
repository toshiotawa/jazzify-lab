import { describe, expect, it, vi } from 'vitest';
import {
  getStageKillQuota,
  hasBeginnerStageAssist,
  isFirstBlockRegularStage,
} from './survivalFirstBlockStage';
import { STAGE_FIRST_BLOCK_KILL_QUOTA, STAGE_KILL_QUOTA } from './SurvivalStageDefinitions';

vi.mock('./descent/descentBlocks', () => ({
  getBlockForStage: (stageNumber: number) => {
    if (stageNumber <= 5) return { blockIndex: 0 };
    return { blockIndex: 1 };
  },
}));

vi.mock('./SurvivalStageDefinitions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./SurvivalStageDefinitions')>();
  return {
    ...actual,
    isBlockLastStage: (stageNumber: number) => stageNumber === 5,
  };
});

describe('survivalFirstBlockStage', () => {
  it('第一ブロック通常ステージの撃破ノルマは 10', () => {
    expect(getStageKillQuota(1, 'basic')).toBe(STAGE_FIRST_BLOCK_KILL_QUOTA);
    expect(getStageKillQuota(4, 'phrases')).toBe(STAGE_FIRST_BLOCK_KILL_QUOTA);
  });

  it('第一ブロックのボス戦は通常ノルマ 150', () => {
    expect(getStageKillQuota(5, 'basic')).toBe(STAGE_KILL_QUOTA);
  });

  it('第二ブロック以降は通常ノルマ 150', () => {
    expect(getStageKillQuota(6, 'basic')).toBe(STAGE_KILL_QUOTA);
  });

  it('第一ブロック通常ステージは beginner assist 対象', () => {
    expect(isFirstBlockRegularStage(1, 'basic')).toBe(true);
    expect(hasBeginnerStageAssist(3, 'songs')).toBe(true);
  });

  it('第一ブロックボスは beginner assist 対象外', () => {
    expect(isFirstBlockRegularStage(5, 'basic')).toBe(false);
    expect(hasBeginnerStageAssist(5, 'basic')).toBe(false);
  });
});
