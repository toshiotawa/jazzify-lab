import {
  createOsuCircleShatterPool,
  hasActiveOsuCircleShatter,
  OSU_SHATTER_DURATION_MS,
  OSU_SHATTER_FRAGMENT_COUNT,
  pruneOsuCircleShatter,
  spawnOsuCircleShatter,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCircleShatterPool';

describe('spawnOsuCircleShatter', () => {
  it('指定位置から弧セグメントを生成する', () => {
    const pool = createOsuCircleShatterPool();
    const spawned = spawnOsuCircleShatter(pool, 120, 240, 88, 1000);
    expect(spawned).toBe(OSU_SHATTER_FRAGMENT_COUNT);
    expect(hasActiveOsuCircleShatter(pool, 1000)).toBe(true);
    expect(hasActiveOsuCircleShatter(pool, 1000 + OSU_SHATTER_DURATION_MS - 1)).toBe(true);
    expect(hasActiveOsuCircleShatter(pool, 1000 + OSU_SHATTER_DURATION_MS)).toBe(false);
  });

  it('期限切れスロットを prune する', () => {
    const pool = createOsuCircleShatterPool();
    spawnOsuCircleShatter(pool, 0, 0, 50, 1000);
    pruneOsuCircleShatter(pool, 1000 + OSU_SHATTER_DURATION_MS);
    expect(hasActiveOsuCircleShatter(pool, 1000 + OSU_SHATTER_DURATION_MS)).toBe(false);
  });
});
