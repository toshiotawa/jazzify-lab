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
  it('aligns spark radius and ring scale at 251ms', () => {
    expect(getParryEffectRadiusAtAge(PARRY_FINISH_START_MS)).toBeCloseTo(PARRY_MERGE_RADIUS_PX);
    expect(getParryRingScaleAtAge(PARRY_FINISH_START_MS)).toBeCloseTo(PARRY_RING_MERGE_SCALE);
    expect(getParryRingScaleAtAge(PARRY_FINISH_START_MS - 1)).toBeNull();
  });
});

describe('earTrainingBattleParrySparkPool', () => {
  it('spawns 14 sparks for normal parry and 20 for chain parry', () => {
    const pool = createParrySparkPool();
    expect(spawnParrySparks(pool, 120, 80, 1_000, false)).toBe(14);
    expect(hasActiveParrySparks(pool)).toBe(true);

    for (const slot of pool) {
      slot.active = false;
    }

    expect(spawnParrySparks(pool, 120, 80, 2_000, true)).toBe(20);
  });

  it('reuses inactive pool slots without allocating new objects', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 10, 100, false);
    const firstActive = pool.find(slot => slot.active);
    expect(firstActive).toBeDefined();
    pruneParrySparks(pool, 100 + PARRY_MOTION_END_MS);
    expect(firstActive?.active).toBe(false);

    spawnParrySparks(pool, 20, 20, 700, false);
    expect(pool.some(slot => slot.active && slot.startedAt === 700)).toBe(true);
  });

  it('uses orange color only', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 50, 50, 1_000, false);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    const state = getParrySparkDrawState(slot, 1_020);
    expect(state?.color).toBe(PARRY_SPARK_COLOR);
  });

  it('expands sparks radially from the player center', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 100, 100, 1_000, false);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;
    const early = getParrySparkDrawState(slot, 1_010);
    const merged = getParrySparkDrawState(slot, 1_000 + PARRY_FINISH_START_MS);
    expect(early).toBeDefined();
    expect(merged).toBeDefined();
    if (!early || !merged) return;
    const earlyDist = Math.hypot(early.x - 100, early.y - 100);
    const mergedDist = Math.hypot(merged.x - 100, merged.y - 100);
    expect(mergedDist).toBeGreaterThan(earlyDist);
    expect(mergedDist).toBeCloseTo(PARRY_MERGE_RADIUS_PX, 0);
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
