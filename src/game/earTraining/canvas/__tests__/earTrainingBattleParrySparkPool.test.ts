import { describe, expect, it } from 'vitest';
import {
  clearParrySparkPool,
  createParrySparkPool,
  hasActiveParrySparks,
  PARRY_HIT_CAMERA_SHAKE_INTENSITY,
  PARRY_HIT_CAMERA_SHAKE_MS,
  PARRY_SPARK_CHAIN_COUNT,
  PARRY_SPARK_COUNT,
  PARRY_SPARK_DURATION_MS,
  pruneParrySparkPool,
  spawnParrySparks,
} from '@/game/earTraining/canvas/earTrainingBattleParrySparkPool';

describe('parry spark pool', () => {
  it('spawns welding sparks and expires on wall clock', () => {
    const pool = createParrySparkPool();
    const spawned = spawnParrySparks(pool, 100, 200, 1000, false);
    expect(spawned).toBe(PARRY_SPARK_COUNT);
    expect(hasActiveParrySparks(pool, 1100)).toBe(true);

    pruneParrySparkPool(pool, 1000 + PARRY_SPARK_DURATION_MS + 200);
    expect(hasActiveParrySparks(pool, 1000 + PARRY_SPARK_DURATION_MS + 200)).toBe(false);
  });

  it('spawns more sparks on chain parry', () => {
    const pool = createParrySparkPool();
    expect(spawnParrySparks(pool, 0, 0, 0, true)).toBe(PARRY_SPARK_CHAIN_COUNT);
  });

  it('clears active sparks', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 20, 50, false);
    clearParrySparkPool(pool);
    expect(hasActiveParrySparks(pool, 60)).toBe(false);
  });

  it('exports hit camera shake constants', () => {
    expect(PARRY_HIT_CAMERA_SHAKE_INTENSITY).toBe(0.01);
    expect(PARRY_HIT_CAMERA_SHAKE_MS).toBe(60);
  });
});
