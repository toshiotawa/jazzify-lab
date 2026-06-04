import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import {
  formatSurvivalStageModeLabel,
  resolveLessonSurvivalMapCategory,
} from '@/components/survival/SurvivalStageDefinitions';

const baseStage = (overrides: Partial<StageDefinition>): StageDefinition => ({
  stageNumber: 1,
  name: 'テスト',
  nameEn: 'Test',
  difficulty: 'easy',
  stageType: 'random',
  playMode: 'survival',
  chordSuffix: '',
  chordDisplayName: '',
  chordDisplayNameEn: '',
  rootPattern: 'cde',
  rootPatternName: '',
  rootPatternNameEn: '',
  allowedChords: [],
  blockKey: 'major',
  mapCategory: 'basic',
  ...overrides,
});

describe('resolveLessonSurvivalMapCategory', () => {
  it('accepts known categories', () => {
    expect(resolveLessonSurvivalMapCategory('lesson')).toBe('lesson');
    expect(resolveLessonSurvivalMapCategory('phrases')).toBe('phrases');
  });

  it('falls back to basic for empty or unknown', () => {
    expect(resolveLessonSurvivalMapCategory(null)).toBe('basic');
    expect(resolveLessonSurvivalMapCategory('')).toBe('basic');
    expect(resolveLessonSurvivalMapCategory('invalid')).toBe('basic');
  });
});

describe('formatSurvivalStageModeLabel', () => {
  it('labels phrases map category', () => {
    const stage = baseStage({ mapCategory: 'phrases', stageType: 'random' });
    expect(formatSurvivalStageModeLabel(stage, false)).toBe('フレーズ');
    expect(formatSurvivalStageModeLabel(stage, true)).toBe('Phrases');
  });

  it('labels composite phrase boss on phrases map', () => {
    const stage = baseStage({
      mapCategory: 'phrases',
      stageType: 'progression',
      compositePhraseSources: [1, 2, 3],
    });
    expect(formatSurvivalStageModeLabel(stage, false)).toBe('複合フレーズ');
    expect(formatSurvivalStageModeLabel(stage, true)).toBe('Composite phrases');
  });

  it('labels progression vs random for non-phrases', () => {
    const prog = baseStage({ stageType: 'progression', mapCategory: 'songs' });
    expect(formatSurvivalStageModeLabel(prog, true)).toBe('Progression');
    const rnd = baseStage({ stageType: 'random', mapCategory: 'basic' });
    expect(formatSurvivalStageModeLabel(rnd, false)).toBe('ランダム');
  });
});
