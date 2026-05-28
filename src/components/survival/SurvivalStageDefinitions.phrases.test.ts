import { describe, expect, it, vi } from 'vitest';
import type { StageDefinition } from './SurvivalStageDefinitions';

const phraseStage = (overrides: Partial<StageDefinition> = {}): StageDefinition => ({
  stageNumber: 6,
  name: 'Composite',
  nameEn: 'Composite',
  difficulty: 'easy',
  stageType: 'progression',
  chordSuffix: '',
  chordDisplayName: 'Phrases',
  chordDisplayNameEn: 'Phrases',
  rootPattern: null,
  rootPatternName: '',
  rootPatternNameEn: '',
  allowedChords: [],
  blockKey: 'phrases_ii_v_c_1',
  mapCategory: 'phrases',
  compositePhraseSources: [1, 2, 3, 4, 5],
  ...overrides,
});

const phraseStages = [
  phraseStage({ stageNumber: 5, compositePhraseSources: undefined }),
  phraseStage({ stageNumber: 6 }),
  phraseStage({ stageNumber: 7, compositePhraseSources: undefined }),
  phraseStage({ stageNumber: 11, compositePhraseSources: undefined }),
  phraseStage({
    stageNumber: 12,
    compositePhraseSources: [7, 8, 9, 10, 11],
  }),
];

vi.mock('./SurvivalStageDefinitions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./SurvivalStageDefinitions')>();
  return {
    ...actual,
    getStageByNumber: (stageNumber: number, mapCategory: string) =>
      (mapCategory === 'phrases'
        ? phraseStages.find(s => s.stageNumber === stageNumber)
        : undefined),
  };
});

import {
  bossTypeForBlockIndex,
  getSurvivalStageBattleKind,
  isBlockLastStage,
  isPhraseMapCompositeStage,
  isSurvivalStageDetailBossClearCondition,
  resolveMapBossTypeForBlock,
} from './SurvivalStageDefinitions';

describe('isPhraseMapCompositeStage', () => {
  it('returns true for phrases map composite stages', () => {
    expect(isPhraseMapCompositeStage(phraseStage())).toBe(true);
  });

  it('excludes lesson-only composite stages', () => {
    expect(isPhraseMapCompositeStage(phraseStage({ lessonOnly: true }))).toBe(false);
  });

  it('excludes non-phrases map categories', () => {
    expect(isPhraseMapCompositeStage(phraseStage({ mapCategory: 'lesson' }))).toBe(false);
  });

  it('excludes regular phrase stages without composite sources', () => {
    expect(isPhraseMapCompositeStage(phraseStage({
      stageNumber: 7,
      compositePhraseSources: undefined,
    }))).toBe(false);
  });
});

describe('resolveMapBossTypeForBlock', () => {
  it('uses B on map when the block ends with a composite phrase stage', () => {
    expect(resolveMapBossTypeForBlock(1, 12, 'phrases')).toBe('B');
  });

  it('keeps blockIndex rotation when the block ends with a regular stage', () => {
    expect(resolveMapBossTypeForBlock(0, 5, 'phrases')).toBe(bossTypeForBlockIndex(0));
  });

  it('does not override map boss type for mid-block regular endings', () => {
    expect(resolveMapBossTypeForBlock(1, 11, 'phrases')).toBe(bossTypeForBlockIndex(1));
  });
});

describe('isSurvivalStageDetailBossClearCondition', () => {
  it('uses boss clear label for mid-block composite stages', () => {
    expect(isSurvivalStageDetailBossClearCondition(phraseStage({ stageNumber: 6 }))).toBe(true);
    expect(isBlockLastStage(6, 'phrases')).toBe(false);
  });

  it('uses boss clear label for block-ending composite stages', () => {
    expect(isSurvivalStageDetailBossClearCondition(phraseStage({
      stageNumber: 12,
      compositePhraseSources: [7, 8, 9, 10, 11],
    }))).toBe(true);
  });

  it('uses regular clear label for non-composite phrase stages', () => {
    expect(isSurvivalStageDetailBossClearCondition(phraseStage({
      stageNumber: 7,
      compositePhraseSources: undefined,
    }))).toBe(false);
  });
});

describe('phrase map composite boss battle kind', () => {
  it('treats mid-block composite as boss when combined with phrase map composite helper', () => {
    const stage = phraseStage({ stageNumber: 6 });
    const isPhraseMapCompositeBossStage = isPhraseMapCompositeStage(stage);
    const stageBattleKind = isPhraseMapCompositeBossStage
      ? 'boss'
      : getSurvivalStageBattleKind(stage.stageType, isBlockLastStage(stage.stageNumber, stage.mapCategory));
    expect(isBlockLastStage(stage.stageNumber, stage.mapCategory)).toBe(false);
    expect(stageBattleKind).toBe('boss');
  });
});
