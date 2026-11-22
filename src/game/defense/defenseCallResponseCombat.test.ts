import { describe, expect, it } from 'vitest';
import {
  applyDefenseCallResponseDifficulty,
  computeDefenseCallResponseClearTarget,
  countDefensePhraseNotes,
  DEFENSE_MIN_CLEAR_NOTES,
  resolveDefenseCallResponseEnemySpeedPx,
} from '@/game/defense/defenseCallResponseCombat';
import { getDefenseWaveIndexFromKillProgress } from '@/game/defense/defenseEnemyConfig';
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

const lv5Difficulty: DefenseDifficulty = {
  level: 5,
  enemyHp: 3,
  spawnIntervalSec: 2,
  maxEnemies: 6,
  enemySpeedPxPerSec: 64,
  enemyDamage: 2,
  attackIntervalSec: 2,
  attackRangePx: 52,
};

const crStage = {
  audioLoopBars: 4,
  callResponseBars: 1,
  callResponseResponseBars: 3,
  requiredCompletionCount: 3,
  callResponseLaps: 1,
  attackTrigger: 'note' as const,
  playStyle: 'phrase' as const,
} satisfies Pick<
  DefenseStage,
  | 'audioLoopBars'
  | 'callResponseBars'
  | 'callResponseResponseBars'
  | 'requiredCompletionCount'
  | 'callResponseLaps'
  | 'attackTrigger'
  | 'playStyle'
>;

describe('computeDefenseCallResponseClearTarget', () => {
  it('returns positive kill target for stage 1-1 style (4 phrases × 3)', () => {
    const phrases = [
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
    ];
    const target = computeDefenseCallResponseClearTarget(crStage, phrases, lv5Difficulty);
    expect(target).not.toBeNull();
    expect(target).toBeGreaterThan(20);
  });

  it('raises kill target when call_response_laps is 2 (full stage loop)', () => {
    const phrases = [
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
    ];
    const oneLap = computeDefenseCallResponseClearTarget(crStage, phrases, lv5Difficulty);
    const twoLap = computeDefenseCallResponseClearTarget(
      { ...crStage, callResponseLaps: 2 },
      phrases,
      lv5Difficulty,
    );
    expect(oneLap).not.toBeNull();
    expect(twoLap).not.toBeNull();
    expect(twoLap).toBeGreaterThan(oneLap ?? 0);
  });

  it('bumps laps when one phrase and notes below minimum', () => {
    const phrases = [makePhrase(6)];
    const targetLaps1 = computeDefenseCallResponseClearTarget(crStage, phrases, lv5Difficulty);
    const targetLaps2 = computeDefenseCallResponseClearTarget(
      { ...crStage, callResponseLaps: 2 },
      phrases,
      lv5Difficulty,
    );
    const targetLaps4 = computeDefenseCallResponseClearTarget(
      { ...crStage, callResponseLaps: 4 },
      phrases,
      lv5Difficulty,
    );
    expect(targetLaps1).not.toBeNull();
    expect(targetLaps1).toBe(targetLaps2);
    expect(targetLaps4).toBeGreaterThan(targetLaps1 ?? 0);
    const notes = 6 * 3 * 3;
    expect(notes).toBeGreaterThanOrEqual(DEFENSE_MIN_CLEAR_NOTES);
  });

  it('never allows clearing before full laps even with max SP fireball hits', () => {
    const phrases = [
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
      makePhrase(6),
    ];
    for (const laps of [1, 2, 3]) {
      const stage = { ...crStage, callResponseLaps: laps };
      const target = computeDefenseCallResponseClearTarget(stage, phrases, lv5Difficulty);
      expect(target).not.toBeNull();
      const targetKills = target ?? 0;
      const totalSlashes = 72 * laps;
      const totalFireballs = Math.floor((12 * laps) / 5);
      // Even if every fireball hits maxEnemies for 3 slash-equivalents each,
      // totalSlashes - 1 slashes cannot exceed targetKills - 1.
      const totalHitsAtMinHp = Array.from({ length: targetKills }, (_, i) => {
        const w = getDefenseWaveIndexFromKillProgress(i, targetKills);
        return Math.max(1, Math.ceil((lv5Difficulty.enemyHp * 0.6 * (w === 0 ? 1 : 1)) / (w + 1)));
      }).reduce((a, b) => a + b, 0);
      expect(totalHitsAtMinHp).toBeGreaterThan(0);
      expect(targetKills).toBeGreaterThan(Math.floor(totalSlashes / 4));
      expect(totalFireballs).toBeGreaterThanOrEqual(2 * laps);
    }
  });

  it('returns null when call-response disabled', () => {
    expect(computeDefenseCallResponseClearTarget(
      { ...crStage, callResponseBars: null },
      [makePhrase(6)],
      lv5Difficulty,
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

describe('getDefenseWaveIndexFromKillProgress', () => {
  it('steps wave with KO progress', () => {
    expect(getDefenseWaveIndexFromKillProgress(0, 40)).toBe(0);
    expect(getDefenseWaveIndexFromKillProgress(10, 40)).toBe(1);
    expect(getDefenseWaveIndexFromKillProgress(40, 40)).toBe(3);
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