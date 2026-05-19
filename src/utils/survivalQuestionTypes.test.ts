import { describe, expect, it } from 'vitest';

import {
  buildAllowedChordsForSuffix,
  buildSurvivalQuestionStaffVoicingNames,
  formatSurvivalQuestionTypeLabel,
  parseSurvivalQuestionId,
  resolveSurvivalQuestion,
} from '@/utils/survivalQuestionTypes';

describe('survivalQuestionTypes', () => {
  it('buildAllowedChordsForSuffix generates interval IDs', () => {
    expect(buildAllowedChordsForSuffix(['C', 'D'], 'interval:m3:up')).toEqual([
      'interval:C:m3:up',
      'interval:D:m3:up',
    ]);
  });

  it('buildAllowedChordsForSuffix generates tension IDs (up only)', () => {
    expect(buildAllowedChordsForSuffix(['C'], 'tension:#9:up')).toEqual(['tension:C:#9:up']);
  });

  it('resolveSurvivalQuestion interval up from C is Eb', () => {
    const resolved = resolveSurvivalQuestion('interval:C:m3:up');
    expect(resolved).not.toBeNull();
    expect(resolved?.midi).toBe(63);
    expect(resolved?.noteName).toBe('Eb');
    expect(resolved?.typeDisplayNameEn).toBe('Minor 3rd Up');
    expect(resolved?.typeDisplayNameJa).toBe('短3度上');
  });

  it('resolveSurvivalQuestion interval down respects enharmonic root', () => {
    const resolved = resolveSurvivalQuestion('interval:Db:M3:down');
    expect(resolved).not.toBeNull();
    expect(resolved?.noteName).toBe('Bb');
  });

  it('resolveSurvivalQuestion tension #9 matches b3 spelling on staff one octave lower', () => {
    const resolved = resolveSurvivalQuestion('interval:C:#9:up');
    expect(resolved).toBeNull();

    const tension = resolveSurvivalQuestion('tension:C:#9:up');
    expect(tension).not.toBeNull();
    expect(tension?.midi).toBe(75);

    const staff = buildSurvivalQuestionStaffVoicingNames('tension:C:#9:up');
    expect(staff).toEqual(['Eb4']);
  });

  it('parseSurvivalQuestionId rejects invalid tension direction', () => {
    expect(parseSurvivalQuestionId('tension:C:9:down')).toBeNull();
  });

  it('formatSurvivalQuestionTypeLabel for tensions', () => {
    expect(formatSurvivalQuestionTypeLabel('tension', 'b13', 'up', 'en')).toBe('b13th Up');
    expect(formatSurvivalQuestionTypeLabel('tension', 'b13', 'up', 'ja')).toBe('b13th上');
  });
});
