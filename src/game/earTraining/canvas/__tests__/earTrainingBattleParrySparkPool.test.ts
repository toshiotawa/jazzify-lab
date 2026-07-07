import {
  createParryBeatSyncFromSlowPhaseMs,
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
    baseCompensation: 0,
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

  it('keeps visualNow continuous when slow restarts mid-flight', () => {
    const hit1At = 1_000;
    const firstSlow = {
      startedAt: hit1At,
      durationMs: 375,
      scale: PARRY_VISUAL_SLOW_SCALE,
      baseCompensation: 0,
    };
    const hit2At = hit1At + 120;
    const visualNowBefore = getVisualNow(hit2At, firstSlow);
    const restarted = {
      startedAt: hit2At,
      durationMs: 375,
      scale: PARRY_VISUAL_SLOW_SCALE,
      baseCompensation: getVisualSlowCompensation(hit2At, firstSlow),
    };
    expect(getVisualNow(hit2At, restarted)).toBeCloseTo(visualNowBefore);
    expect(getVisualNow(hit2At + 50, restarted)).toBeCloseTo(
      visualNowBefore + 50 * PARRY_VISUAL_SLOW_SCALE,
    );
  });
});

describe('parry spark radius timeline', () => {
  it('expands only during slowPhase then holds merge radius', () => {
    expect(getParryEffectRadiusAtAge(0)).toBeCloseTo(4);
    expect(getParryEffectRadiusAtAge(PARRY_SLOW_PHASE_MS)).toBeCloseTo(PARRY_MERGE_RADIUS_PX);
    expect(getParryEffectRadiusAtAge(PARRY_FINISH_START_MS)).toBeCloseTo(PARRY_MERGE_RADIUS_PX);
    expect(getParryEffectRadiusAtAge(900)).toBeCloseTo(PARRY_MERGE_RADIUS_PX);
  });

  it('ring scale helper remains for legacy draw path only', () => {
    expect(getParryRingScaleAtAge(PARRY_FINISH_START_MS)).toBeCloseTo(PARRY_RING_MERGE_SCALE);
    expect(getParryRingScaleAtAge(PARRY_FINISH_START_MS - 1)).toBeNull();
    expect(PARRY_RING_LINE_WIDTH).toBe(5);
  });
});

describe('earTrainingBattleParrySparkPool', () => {
  const defaultBeatSync = createParryBeatSyncFromSlowPhaseMs(PARRY_SLOW_PHASE_MS);

  it('spawns 36 sparks for normal parry and 48 for chain parry', () => {
    const pool = createParrySparkPool();
    expect(spawnParrySparks(pool, 120, 80, 1_000, false, defaultBeatSync)).toBe(36);
    expect(hasActiveParrySparks(pool)).toBe(true);

    for (const slot of pool) {
      slot.active = false;
    }

    expect(spawnParrySparks(pool, 120, 80, 2_000, true, defaultBeatSync)).toBe(48);
  });

  it('reuses inactive pool slots without allocating new objects', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 10, 100, false, defaultBeatSync);
    const firstActive = pool.find(slot => slot.active);
    expect(firstActive).toBeDefined();
    if (!firstActive) return;
    firstActive.timeOffsetMs = 0;
    pruneParrySparks(pool, 100 + PARRY_MOTION_END_MS);
    expect(firstActive.active).toBe(false);

    spawnParrySparks(pool, 20, 20, 700, false, defaultBeatSync);
    expect(pool.some(slot => slot.active && slot.startedAt === 700)).toBe(true);
  });

  it('freezes beatSync per spawn so later parry does not retroactively move sparks', () => {
    const pool = createParrySparkPool();
    const shortSync = createParryBeatSyncFromSlowPhaseMs(250);
    spawnParrySparks(pool, 100, 100, 1_000, false, shortSync);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    slot.timeOffsetMs = 0;
    slot.radiusScale = 1;

    const at200 = getParrySparkDrawState(slot, 1_200);
    expect(at200).toBeDefined();
    if (!at200) return;

    const longSync = createParryBeatSyncFromSlowPhaseMs(800);
    spawnParrySparks(pool, 120, 120, 1_100, false, longSync);
    const afterSecondSpawn = getParrySparkDrawState(slot, 1_200);
    expect(afterSecondSpawn).toBeDefined();
    if (!afterSecondSpawn) return;
    expect(afterSecondSpawn.x).toBeCloseTo(at200.x);
    expect(afterSecondSpawn.y).toBeCloseTo(at200.y);
  });

  it('uses visualNow so sparks stay in sync during visual slow', () => {
    const pool = createParrySparkPool();
    const parryStartedAt = 1_000;
    spawnParrySparks(pool, 100, 100, parryStartedAt, false, defaultBeatSync);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;

    slot.timeOffsetMs = 0;
    slot.radiusScale = 1;
    const slow = {
      startedAt: parryStartedAt,
      durationMs: PARRY_VISUAL_SLOW_DURATION_MS,
      scale: PARRY_VISUAL_SLOW_SCALE,
      baseCompensation: 0,
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
    spawnParrySparks(pool, 10, 10, 100, false, defaultBeatSync);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    slot.timeOffsetMs = 0;
    pruneParrySparks(pool, 100 + PARRY_MOTION_END_MS);
    expect(slot.active).toBe(false);
  });

  it('uses orange color only', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 50, 50, 1_000, false, defaultBeatSync);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    const state = getParrySparkDrawState(slot, 1_100);
    expect(state?.color).toBe(PARRY_SPARK_COLOR);
  });

  it('applies per-spark radius scale so merge distances are not identical', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 100, 100, 1_000, false, defaultBeatSync);
    const mergeTime = 1_000 + PARRY_SLOW_PHASE_MS;
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

  it('does not deactivate existing sparks when spawning again', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 10, 100, false, defaultBeatSync);
    const firstCount = pool.filter(slot => slot.active).length;
    spawnParrySparks(pool, 20, 20, 200, false, defaultBeatSync);
    expect(pool.filter(slot => slot.active && slot.startedAt === 100).length).toBe(firstCount);
    expect(pool.filter(slot => slot.active).length).toBeGreaterThan(firstCount);
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
