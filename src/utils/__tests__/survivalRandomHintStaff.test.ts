import { describe, expect, it } from 'vitest';

import { buildSurvivalRandomHintStaffVoicing } from '@/utils/survivalRandomHintStaff';
import {
  analyzeSurvivalChordProgression,
  buildStaffVoicingNamesForProgressionChord,
  SURVIVAL_PROGRESSION_VOICING_MAP,
} from '@/utils/survivalProgressionVoicings';

describe('buildSurvivalRandomHintStaffVoicing', () => {
  it('Cdim7 は減 7 度を Bbb で記譜する', () => {
    const r = buildSurvivalRandomHintStaffVoicing('Cdim7');
    expect(r).not.toBeNull();
    expect(r?.keyFifths).toBe(0);
    expect(r?.voicingNames.join(' ')).toContain('Bbb');
    expect(r?.voicingNames).toEqual(['C4', 'Eb4', 'Gb4', 'Bbb4']);
  });

  it('C#M7 は E# / B# を使う', () => {
    const r = buildSurvivalRandomHintStaffVoicing('C#M7');
    expect(r).not.toBeNull();
    const joined = r?.voicingNames.join(' ') ?? '';
    expect(joined).toContain('E#');
    expect(joined).toContain('B#');
  });

  it('FM7(9) は Progression の B フォーム相当を 1 オクターブ上げた綴りになる', () => {
    const r = buildSurvivalRandomHintStaffVoicing('FM7(9)');
    expect(r).not.toBeNull();
    const prog = analyzeSurvivalChordProgression('FM7(9)');
    expect(prog.entries[0]?.form).toBe('B');
    const base = SURVIVAL_PROGRESSION_VOICING_MAP['FM7(9)']?.voicing;
    expect(base).toBeDefined();
    if (!base) throw new Error('missing map');
    const expected = buildStaffVoicingNamesForProgressionChord({
      name: 'FM7(9)',
      voicing: base.map(m => m + 12),
    });
    expect(r?.voicingNames).toEqual(expected);
  });

  it('BbM7(9) は Progression の A フォーム相当を 1 オクターブ上げた綴りになる', () => {
    const r = buildSurvivalRandomHintStaffVoicing('BbM7(9)');
    expect(r).not.toBeNull();
    const prog = analyzeSurvivalChordProgression('BbM7(9)');
    expect(prog.entries[0]?.form).toBe('A');
    const base = SURVIVAL_PROGRESSION_VOICING_MAP['BbM7(9)']?.voicing;
    expect(base).toBeDefined();
    if (!base) throw new Error('missing map');
    const expected = buildStaffVoicingNamesForProgressionChord({
      name: 'BbM7(9)',
      voicing: base.map(m => m + 12),
    });
    expect(r?.voicingNames).toEqual(expected);
  });

  it('7(9.6th) 表記でも Progression 7(9.13) キーで解決する', () => {
    const r = buildSurvivalRandomHintStaffVoicing('G7(9.6th)');
    expect(r).not.toBeNull();
    const base = SURVIVAL_PROGRESSION_VOICING_MAP['G7(9.13)']?.voicing;
    expect(base).toBeDefined();
    if (!base) throw new Error('missing map');
    const expected = buildStaffVoicingNamesForProgressionChord({
      name: 'G7(9.13)',
      voicing: base.map(m => m + 12),
    });
    expect(r?.voicingNames).toEqual(expected);
  });
});
