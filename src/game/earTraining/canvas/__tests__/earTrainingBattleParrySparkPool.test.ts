import {
  getParryEffectRadiusAtAge,
  getParryLingerAlpha,
  getParryRingScaleAtAge,
  getVisualNow,
  getVisualSlowCompensation,
  PARRY_EFFECT_FADE_START_MS,
  PARRY_FINISH_START_MS,
  PARRY_LINGER_FADE_DURATION_MS,
  PARRY_MERGE_RADIUS_PX,
  PARRY_MOTION_END_MS,
  PARRY_RING_LINE_WIDTH,
  PARRY_RING_MERGE_SCALE,
  PARRY_SLOW_PHASE_MS,
  PARRY_TOTAL_MS,
  PARRY_VISUAL_SLOW_DURATION_MS,
  PARRY_VISUAL_SLOW_SCALE,
} from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  createParrySparkPool,
  getParrySparkDrawState,
  hasActiveParrySparks,
  PARRY_SPARK_COLOR,
  PARRY_SPARK_DURATION_MS,
  pruneParrySparks,
  spawnParrySparks,
} from '@/game/earTraining/canvas/earTrainingBattleParrySparkPool';

describe('earTrainingBattle visual slow', () => {
  const slow = {
    startedAt: 1_000,
    durationMs: PARRY_VISUAL_SLOW_DURATION_MS,
    scale: PARRY_VISUAL_SLOW_SCALE,
  };

  it('returns zero compensation before slow starts', () => {
    expect(getVisualSlowCompensation(900, slow)).toBe(0);
    expect(getVisualNow(900, slow)).toBe(900);
  });

  it('slows visual time during the slow window', () => {
    const midReal = slow.startedAt + slow.durationMs / 2;
    const compensation = getVisualSlowCompensation(midReal, slow);
    expect(compensation).toBeCloseTo((slow.durationMs / 2) * (1 - slow.scale));
    expect(getVisualNow(midReal, slow)).toBeCloseTo(midReal - compensation);
  });

  it('caps compensation after slow ends', () => {
    const afterReal = slow.startedAt + slow.durationMs + 100;
    const maxCompensation = slow.durationMs * (1 - slow.scale);
    expect(getVisualSlowCompensation(afterReal, slow)).toBeCloseTo(maxCompensation);
    expect(getVisualNow(afterReal, slow)).toBeCloseTo(afterReal - maxCompensation);
  });
});

describe('parry merge timeline', () => {
  it('uses shared baseline radius at 251ms before per-effect jitter', () => {
    expect(getParryEffectRadiusAtAge(PARRY_FINISH_START_MS)).toBeCloseTo(PARRY_MERGE_RADIUS_PX);
    expect(getParryRingScaleAtAge(PARRY_FINISH_START_MS)).toBeCloseTo(PARRY_RING_MERGE_SCALE);
    expect(getParryRingScaleAtAge(PARRY_FINISH_START_MS - 1)).toBeNull();
  });

  it('matches iOS ring stroke width constant', () => {
    expect(PARRY_RING_LINE_WIDTH).toBe(5);
  });
});

describe('earTrainingBattleParrySparkPool', () => {
  it('spawns 28 sparks for normal parry and 40 for chain parry', () => {
    const pool = createParrySparkPool();
    expect(spawnParrySparks(pool, 120, 80, 1_000, false)).toBe(28);
    expect(hasActiveParrySparks(pool)).toBe(true);

    for (const slot of pool) {
      slot.active = false;
    }

    expect(spawnParrySparks(pool, 120, 80, 2_000, true)).toBe(40);
  });

  it('reuses inactive pool slots without allocating new objects', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 10, 100, false);
    const firstActive = pool.find(slot => slot.active);
    expect(firstActive).toBeDefined();
    if (!firstActive) return;
    firstActive.timeOffsetMs = 0;
    pruneParrySparks(pool, 100 + PARRY_MOTION_END_MS);
    expect(firstActive.active).toBe(false);

    spawnParrySparks(pool, 20, 20, 700, false);
    expect(pool.some(slot => slot.active && slot.startedAt === 700)).toBe(true);
  });

  it('uses visualNow so sparks stay in sync during visual slow', () => {
    const pool = createParrySparkPool();
    const parryStartedAt = 1_000;
    spawnParrySparks(pool, 100, 100, parryStartedAt, false);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;

    slot.timeOffsetMs = 0;
    slot.radiusScale = 1;
    const slow = {
      startedAt: parryStartedAt,
      durationMs: PARRY_VISUAL_SLOW_DURATION_MS,
      scale: PARRY_VISUAL_SLOW_SCALE,
    };
    const midReal = parryStartedAt + PARRY_VISUAL_SLOW_DURATION_MS / 2;
    const visualMid = getVisualNow(midReal, slow);
    const realMid = getParrySparkDrawState(slot, midReal);
    const slowedMid = getParrySparkDrawState(slot, visualMid);
    expect(slowedMid).toBeDefined();
    expect(realMid).toBeDefined();
    if (!realMid || !slowedMid) return;
    expect(Math.hypot(slowedMid.x - 100, slowedMid.y - 100))
      .toBeLessThan(Math.hypot(realMid.x - 100, realMid.y - 100));
  });

  it('prunes sparks by visual age including time offset', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 10, 100, false);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    slot.timeOffsetMs = 0;
    pruneParrySparks(pool, 100 + PARRY_MOTION_END_MS);
    expect(slot.active).toBe(false);
  });

  it('uses orange color only', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 50, 50, 1_000, false);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    const state = getParrySparkDrawState(slot, 1_100);
    expect(state?.color).toBe(PARRY_SPARK_COLOR);
  });

  it('applies per-spark radius scale so merge distances are not identical', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 100, 100, 1_000, false);
    const mergeTime = 1_000 + PARRY_FINISH_START_MS;
    const distances = pool
      .filter(slot => slot.active)
      .map(slot => {
        const state = getParrySparkDrawState(slot, mergeTime);
        if (!state) return null;
        return Math.hypot(state.x - 100, state.y - 100);
      })
      .filter((value): value is number => value !== null);
    expect(distances.length).toBeGreaterThan(1);
    const min = Math.min(...distances);
    const max = Math.max(...distances);
    expect(max - min).toBeGreaterThan(2);
  });
});

describe('getParryLingerAlpha', () => {
  it('starts fading after 751ms from parry start', () => {
    const parryStartedAt = 1_000;
    expect(getParryLingerAlpha(parryStartedAt + PARRY_EFFECT_FADE_START_MS - 1, parryStartedAt, 1)).toBe(1);
    expect(
      getParryLingerAlpha(parryStartedAt + PARRY_MOTION_END_MS, parryStartedAt, 1),
    ).toBeLessThan(0.05);
    expect(PARRY_LINGER_FADE_DURATION_MS).toBe(PARRY_MOTION_END_MS - PARRY_EFFECT_FADE_START_MS);
    expect(PARRY_SLOW_PHASE_MS).toBe(250);
    expect(PARRY_FINISH_START_MS).toBe(251);
    expect(PARRY_SPARK_DURATION_MS).toBe(PARRY_TOTAL_MS);
    expect(PARRY_TOTAL_MS).toBe(1000);
  });
});
