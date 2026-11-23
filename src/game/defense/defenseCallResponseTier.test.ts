import { describe, expect, it } from 'vitest';
import {
  buildDefenseCallResponseBaseDifficulty,
  clampDefenseCallResponseTierLevel,
  computeDefenseCallResponsePhraseDensityScale,
  computeDefenseEndlessAccel,
  computeDefenseEndlessAccelWithCap,
  computeDefenseEndlessProgress,
  computeDefenseStarRank,
  formatDefenseStarRank,
  scaleDefenseEndlessAccelCap,
} from '@/game/defense/defenseCallResponseTier';
import {
  resolveDefenseCallResponseGuardedDifficulty,
  resolveDefenseEndlessAccelCap,
} from '@/game/defense/defenseCallResponseClearGuard';
import type { DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';

const makePhrase = (notes: number, measureCount = 1, required: number | null = 3): DefensePhrase => ({
  id: 'p',
  orderIndex: 0,
  title: 'T',
  audioUrl: '',
  loopStartMeasure: null,
  loopEndMeasure: null,
  keyFifths: null,
  requiredCompletionCount: required,
  chords: Array.from({ length: measureCount }, (_, m) => ({
    id: `c-${m}`,
    orderIndex: m,
    chordName: 'Dm7',
    measureNumber: m + 1,
    notes: m === 0
      ? Array.from({ length: notes }, (_, i) => ({
        orderIndex: i,
        pitchMidi: 60 + i,
        pitchClass: i % 12,
        noteName: 'C4',
        staff: 1 as const,
      }))
      : [],
  })),
});

const stageBase = {
  playerHp: 16,
  surviveSeconds: 120,
  attackTrigger: 'note' as const,
  bpm: 120,
  beatsPerBar: 4,
  phraseBars: 1,
  requiredCompletionCount: 3,
  callResponseBars: 1,
  callResponseResponseBars: 3,
  callResponseLaps: 1,
  audioLoopBars: 4,
  playStyle: 'phrase' as const,
} satisfies Pick<
  DefenseStage,
  | 'playerHp'
  | 'surviveSeconds'
  | 'attackTrigger'
  | 'bpm'
  | 'beatsPerBar'
  | 'phraseBars'
  | 'requiredCompletionCount'
  | 'callResponseBars'
  | 'callResponseResponseBars'
  | 'callResponseLaps'
  | 'audioLoopBars'
  | 'playStyle'
>;

describe('clampDefenseCallResponseTierLevel', () => {
  it('clamps to 1..5', () => {
    expect(clampDefenseCallResponseTierLevel(0)).toBe(1);
    expect(clampDefenseCallResponseTierLevel(3)).toBe(3);
    expect(clampDefenseCallResponseTierLevel(9)).toBe(5);
  });
});

describe('computeDefenseCallResponsePhraseDensityScale', () => {
  it('returns 1 for dense 6-notes-per-bar phrases and scales down for sparse 2-bar 7-note phrases', () => {
    const dense = [makePhrase(6, 1)];
    const denseScale = computeDefenseCallResponsePhraseDensityScale(dense, {
      attackTrigger: 'note',
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 1,
    });
    expect(denseScale).toBeCloseTo(1, 2);

    const sparse = [makePhrase(7, 1)];
    const sparseScale = computeDefenseCallResponsePhraseDensityScale(sparse, {
      attackTrigger: 'note',
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 2,
    });
    expect(sparseScale).toBeLessThan(0.75);
    expect(sparseScale).toBeGreaterThan(0.2);
  });
});

describe('buildDefenseCallResponseBaseDifficulty', () => {
  it('scales speed and spawn interval monotonically from tier 1 to tier 5', () => {
    const phrases = [makePhrase(6), makePhrase(6), makePhrase(6), makePhrase(6)];
    const lv1 = buildDefenseCallResponseBaseDifficulty({
      tierLevel: 1,
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 1,
      attackTrigger: 'note',
      phrases,
    });
    const lv5 = buildDefenseCallResponseBaseDifficulty({
      tierLevel: 5,
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 1,
      attackTrigger: 'note',
      phrases,
    });
    expect(lv1.enemySpeedPxPerSec).toBeLessThan(lv5.enemySpeedPxPerSec);
    expect(lv1.spawnIntervalSec).toBeGreaterThan(lv5.spawnIntervalSec);
    expect(lv1.maxEnemies).toBe(4);
    expect(lv5.maxEnemies).toBe(10);
  });

  it('adjusts spawn interval inversely with player attack pace for sparse phrases', () => {
    const dense = buildDefenseCallResponseBaseDifficulty({
      tierLevel: 3,
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 1,
      attackTrigger: 'note',
      phrases: [makePhrase(6, 1)],
    });
    const sparse = buildDefenseCallResponseBaseDifficulty({
      tierLevel: 3,
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 2,
      attackTrigger: 'note',
      phrases: [makePhrase(4, 1)],
    });
    expect(sparse.spawnIntervalSec).toBeGreaterThan(dense.spawnIntervalSec);
  });

  it('halves enemyHp (ceil) when attackTrigger is measure', () => {
    const lv5Measure = buildDefenseCallResponseBaseDifficulty({
      tierLevel: 5,
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 2,
      attackTrigger: 'measure',
      phrases: [makePhrase(4, 2)],
    });
    expect(lv5Measure.enemyHp).toBe(3);
  });
});

describe('resolveDefenseCallResponseGuardedDifficulty', () => {
  it('produces clear-safe speeds for Stage 1-1 across tiers 1..5', () => {
    const phrases = [makePhrase(6), makePhrase(6), makePhrase(6), makePhrase(6)];
    const speeds: number[] = [];
    for (let tier = 1; tier <= 5; tier += 1) {
      const difficulty = resolveDefenseCallResponseGuardedDifficulty(stageBase, phrases, {
        tierLevel: tier,
        bpm: 120,
        beatsPerBar: 4,
        phraseBars: 1,
        attackTrigger: 'note',
        phrases,
      });
      expect(difficulty.enemySpeedPxPerSec).toBeGreaterThan(20);
      speeds.push(difficulty.enemySpeedPxPerSec);
    }
    expect(speeds[4]).toBeGreaterThan(speeds[0] ?? 0);
  });

  it('handles sparse 2-bar 7-note phrase (120 BPM 2c6r) across tiers 1..5', () => {
    const phrases = [makePhrase(7, 1), makePhrase(7, 1), makePhrase(7, 1), makePhrase(7, 1)];
    const sparseStage = {
      ...stageBase,
      phraseBars: 2,
      callResponseBars: 2,
      callResponseResponseBars: 6,
      audioLoopBars: 8,
    };
    for (let tier = 1; tier <= 5; tier += 1) {
      const difficulty = resolveDefenseCallResponseGuardedDifficulty(sparseStage, phrases, {
        tierLevel: tier,
        bpm: 120,
        beatsPerBar: 4,
        phraseBars: 2,
        attackTrigger: 'note',
        phrases,
      });
      expect(difficulty.enemySpeedPxPerSec).toBeGreaterThan(2);
    }
  });

  it('handles very sparse 2-bar 4-note phrase at 100 BPM and measure trigger', () => {
    const verySparse = [makePhrase(4, 1), makePhrase(4, 1)];
    const verySparseStage = {
      ...stageBase,
      bpm: 100,
      phraseBars: 2,
      callResponseBars: 2,
      callResponseResponseBars: 6,
      audioLoopBars: 8,
    };
    const dNote = resolveDefenseCallResponseGuardedDifficulty(verySparseStage, verySparse, {
      tierLevel: 5,
      bpm: 100,
      beatsPerBar: 4,
      phraseBars: 2,
      attackTrigger: 'note',
      phrases: verySparse,
    });
    expect(dNote.enemySpeedPxPerSec).toBeGreaterThanOrEqual(2);

    const measurePhrases = [makePhrase(4, 2), makePhrase(4, 2)];
    const measureStage = {
      ...verySparseStage,
      attackTrigger: 'measure' as const,
      playStyle: 'chord_voicing' as const,
    };
    const dMeasure = resolveDefenseCallResponseGuardedDifficulty(measureStage, measurePhrases, {
      tierLevel: 3,
      bpm: 100,
      beatsPerBar: 4,
      phraseBars: 2,
      attackTrigger: 'measure',
      phrases: measurePhrases,
    });
    expect(dMeasure.enemySpeedPxPerSec).toBeGreaterThanOrEqual(2);
  });
});

describe('computeDefenseStarRank & endless accel', () => {
  it('maps HP bands to 3 ranks', () => {
    expect(computeDefenseStarRank(20, 20)).toBe(3);
    expect(computeDefenseStarRank(19, 20)).toBe(2);
    expect(computeDefenseStarRank(10, 20)).toBe(2);
    expect(computeDefenseStarRank(9, 20)).toBe(1);
    expect(computeDefenseStarRank(1, 20)).toBe(1);
  });

  it('formats legacy null as empty stars', () => {
    expect(formatDefenseStarRank(null)).toBe('☆☆☆');
    expect(formatDefenseStarRank(1)).toBe('★☆☆');
    expect(formatDefenseStarRank(2)).toBe('★★☆');
    expect(formatDefenseStarRank(3)).toBe('★★★');
  });

  it('ramps legacy endless multipliers linearly with elapsed seconds', () => {
    const t0 = computeDefenseEndlessAccel(0);
    const t40 = computeDefenseEndlessAccel(40);
    expect(t0).toEqual({ speedMult: 1, spawnMult: 1, hpMult: 1 });
    expect(t40.speedMult).toBeCloseTo(2.0);
    expect(t40.spawnMult).toBeCloseTo(2.0);
    expect(t40.hpMult).toBeCloseTo(1.6);
  });

  it('caps endless accel with asymptotic progress and never exceeds cap', () => {
    const cap = scaleDefenseEndlessAccelCap(1);
    expect(computeDefenseEndlessProgress(30)).toBeCloseTo(0.283, 2);
    const early = computeDefenseEndlessAccelWithCap(10, cap);
    const late = computeDefenseEndlessAccelWithCap(600, cap);
    expect(late.speedMult).toBeLessThanOrEqual(cap.maxSpeedMult + 1e-9);
    expect(late.spawnMult).toBeLessThanOrEqual(cap.maxSpawnMult + 1e-9);
    expect(late.hpMult).toBeLessThanOrEqual(cap.maxHpMult + 1e-9);
    expect(early.speedMult).toBeLessThan(late.speedMult);
  });

  it('resolveDefenseEndlessAccelCap yields caps that stay within bounds', () => {
    const stageBase: DefenseStage = {
      id: 'cr-1-1',
      slug: 'cr-1-1',
      title: 'CR',
      bpm: 120,
      beatsPerBar: 4,
      phraseBars: 4,
      playerHp: 20,
      surviveSeconds: 120,
      attackTrigger: 'note',
      playStyle: 'note',
      requiredCompletionCount: 1,
      callResponseBars: 1,
      callResponseResponseBars: 3,
      callResponseLaps: 1,
      audioLoopBars: 4,
      audioUrl: '',
      audioRegistrationMode: 'single_source',
      phrases: [],
    };
    const phrases: DefensePhrase[] = [
      makePhrase(7, 2, 1),
    ];
    const base = buildDefenseCallResponseBaseDifficulty({
      tierLevel: 1,
      bpm: stageBase.bpm,
      beatsPerBar: stageBase.beatsPerBar,
      phraseBars: stageBase.phraseBars,
      attackTrigger: stageBase.attackTrigger,
      phrases,
    });
    const guarded = resolveDefenseCallResponseGuardedDifficulty(stageBase, phrases, {
      tierLevel: base.level,
      bpm: stageBase.bpm,
      beatsPerBar: stageBase.beatsPerBar,
      phraseBars: stageBase.phraseBars,
      attackTrigger: stageBase.attackTrigger,
      phrases,
    });
    const cap = resolveDefenseEndlessAccelCap(stageBase, phrases, guarded);
    expect(cap.maxSpeedMult).toBeGreaterThanOrEqual(cap.startSpeedMult);
    expect(cap.maxSpawnMult).toBeGreaterThanOrEqual(1);
    expect(cap.maxHpMult).toBeGreaterThanOrEqual(1);
  });
});
