import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StageDefinition } from '../../SurvivalStageDefinitions';

const { basicStages } = vi.hoisted(() => {
  const majorRegular = (stageNumber: number): StageDefinition => ({
    stageNumber,
    name: `Stage ${stageNumber}`,
    nameEn: `Stage ${stageNumber}`,
    difficulty: 'easy',
    stageType: 'random',
    playMode: 'survival',
    chordSuffix: '',
    chordDisplayName: 'Major',
    chordDisplayNameEn: 'Major',
    rootPattern: 'cde',
    rootPatternName: 'CDE',
    rootPatternNameEn: 'CDE',
    allowedChords: ['C_note'],
    blockKey: 'major',
    mapCategory: 'basic',
  });

  return {
    basicStages: [
      majorRegular(1),
      majorRegular(2),
      majorRegular(3),
      majorRegular(4),
      majorRegular(5),
      {
        ...majorRegular(9901),
        name: 'Dev dual dialogue',
        nameEn: 'Dev dual dialogue',
        lessonOnly: true,
      },
    ],
  };
});

vi.mock('../../SurvivalStageDefinitions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../SurvivalStageDefinitions')>();
  return {
    ...actual,
    getStagesByCategory: (category: string) => (category === 'basic' ? basicStages : []),
    getStageByNumber: (stageNumber: number, category: string) =>
      (category === 'basic' ? basicStages : []).find(s => s.stageNumber === stageNumber),
    resolveSurvivalBlockLabel: () => ({ ja: 'メジャー', en: 'Major' }),
    resolveSurvivalBlockSortOrder: () => 0,
  };
});

import { STAGE_FIRST_BLOCK_KILL_QUOTA } from '../../SurvivalStageDefinitions';
import { hasBeginnerStageAssist, getStageKillQuota } from '../../survivalFirstBlockStage';
import { getBlockForStage, rebuildDescentBlocks } from '../descentBlocks';

describe('getBlockForStage lesson_only block_key inheritance', () => {
  beforeEach(() => {
    rebuildDescentBlocks();
  });

  it('maps lesson_only stage to blockIndex via block_key', () => {
    expect(getBlockForStage(9901, 'basic')?.blockIndex).toBe(0);
    expect(getBlockForStage(9901, 'basic')?.blockKey).toBe('major');
  });

  it('does not add lesson_only stage to descent block stageNumbers', () => {
    expect(getBlockForStage(9901, 'basic')?.stageNumbers).not.toContain(9901);
    expect(getBlockForStage(1, 'basic')?.stageNumbers).toContain(1);
  });

  it('enables beginner assist and first-block kill quota for lesson_only major block', () => {
    expect(hasBeginnerStageAssist(9901, 'basic')).toBe(true);
    expect(getStageKillQuota(9901, 'basic')).toBe(STAGE_FIRST_BLOCK_KILL_QUOTA);
  });
});
