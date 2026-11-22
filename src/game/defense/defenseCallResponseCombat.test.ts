import { describe, expect, it } from 'vitest';
import {
  applyDefenseCallResponseDifficulty,
  computeDefenseCallResponseClearTarget,
  countDefensePhraseNotes,
  DEFENSE_MIN_CLEAR_NOTES,
  getDefenseWaveIndexFromPhraseProgress,
  resolveDefenseCallResponseEnemySpeedPx,
} from '@/game/defense/defenseCallResponseCombat';
import type { DefenseDifficulty, DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';

const makePhrase = (noteCount: number, required: number | null = null): DefensePhrase => ({
  id: 'p',
  orderIndex: 0,
  title: 'T',
  audioUrl: '',
  loopStartMeasure: null,
  loopEndMeasure: null,
  keyFifths: null,
  requiredCompletionCount: required,
  chords: [{
    id: 'c',
    orderIndex: 0,
    chordName: 'Dm7',
    measureNumber: 1,
    notes: Array.from({ length: noteCount }, (_, i) => ({
      orderIndex: i,
      pitchMidi: 60 + i,
      pitchClass: i % 12,
      noteName: 'C4',
      staff: 1 as const,
    })),
  }],
});

const crStage = {
  audioLoopBars: 4,
  callResponseBars: 1,
  callResponseResponseBars: 3,
  requiredCompletionCount: 3,
} satisfies Pick<DefenseStage, 'audioLoopBars' | 'callResponseBars' | 'callResponseResponseBars' | 'requiredCompletionCount'>;

describe('computeDefenseCallResponseClearTarget', () => {
  it('targets 12 completions for stage 1-1 style (4 phrases × 3)', () => {
    const phrases = [
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
    ];
    expect(computeDefenseCallResponseClearTarget(crStage, phrases)).toBe(12);
  });

  it('bumps laps when one phrase and notes below minimum', () => {
    const phrases = [makePhrase(6)];
    expect(computeDefenseCallResponseClearTarget(crStage, phrases)).toBe(9);
    const notes = 6 * 3 * 3;
    expect(notes).toBeGreaterThanOrEqual(DEFENSE_MIN_CLEAR_NOTES);
  });

  it('returns null when call-response disabled', () => {
    expect(computeDefenseCallResponseClearTarget(
      { ...crStage, callResponseBars: null },
      [makePhrase(6)],
    )).toBeNull();
  });
});

describe('resolveDefenseCallResponseEnemySpeedPx', () => {
  it('raises Lv7 floor above Lv6 pattern and applies 1:3 mult', () => {
    const diff: Pick<DefenseDifficulty, 'enemySpeedPxPerSec' | 'level'> = {
      level: 7,
      enemySpeedPxPerSec: 36,
    };
    const speed = resolveDefenseCallResponseEnemySpeedPx(diff, 4, 3);
    expect(speed).toBeGreaterThan(36);
    expect(speed).toBeCloseTo(Math.max(36, 34 + 7 * 6) * (4 / 3), 5);
  });
});

describe('getDefenseWaveIndexFromPhraseProgress', () => {
  it('steps wave with phrase completions', () => {
    expect(getDefenseWaveIndexFromPhraseProgress(0, 12)).toBe(0);
    expect(getDefenseWaveIndexFromPhraseProgress(3, 12)).toBe(1);
    expect(getDefenseWaveIndexFromPhraseProgress(12, 12)).toBe(3);
  });
});

describe('countDefensePhraseNotes', () => {
  it('sums chord notes', () => {
    expect(countDefensePhraseNotes(makePhrase(6))).toBe(6);
  });
});

describe('applyDefenseCallResponseDifficulty', () => {
  it('returns new object with adjusted speed', () => {
    const base: DefenseDifficulty = {
      level: 5,
      enemyHp: 3,
      spawnIntervalSec: 2,
      maxEnemies: 6,
      enemySpeedPxPerSec: 64,
      enemyDamage: 2,
      attackIntervalSec: 2,
      attackRangePx: 52,
    };
    const next = applyDefenseCallResponseDifficulty(base, 4, 3);
    expect(next.enemySpeedPxPerSec).toBeGreaterThan(base.enemySpeedPxPerSec);
    expect(next.level).toBe(base.level);
  });
});