import {
  PARRY_LINGER_FADE_START_MS,
  PARRY_TOTAL_MS,
  getParryLingerAlpha,
} from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  createParrySparkPool,
  getParrySparkDrawState,
  hasActiveParrySparks,
  pruneParrySparks,
  spawnParrySparks,
} from '@/game/earTraining/canvas/earTrainingBattleParrySparkPool';

describe('earTrainingBattleParrySparkPool', () => {
  it('spawns 16 sparks for normal parry and 22 for chain parry', () => {
    const pool = createParrySparkPool();
    expect(spawnParrySparks(pool, 120, 80, 1_000, false)).toBe(16);
    expect(hasActiveParrySparks(pool)).toBe(true);

    for (const slot of pool) {
      slot.active = false;
    }

    expect(spawnParrySparks(pool, 120, 80, 2_000, true)).toBe(22);
  });

  it('reuses inactive pool slots without allocating new objects', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 10, 10, 100, false);
    const firstActive = pool.find(slot => slot.active);
    expect(firstActive).toBeDefined();
    pruneParrySparks(pool, 600);
    expect(firstActive?.active).toBe(false);

    spawnParrySparks(pool, 20, 20, 700, false);
    expect(pool.some(slot => slot.active && slot.startedAt === 700)).toBe(true);
  });

  it('decelerates spark motion and fades alpha', () => {
    const pool = createParrySparkPool();
    spawnParrySparks(pool, 0, 0, 1_000, false);
    const slot = pool.find(entry => entry.active);
    expect(slot).toBeDefined();
    if (!slot) return;

    const early = getParrySparkDrawState(slot, 1_030);
    const late = getParrySparkDrawState(slot, 1_200);
    expect(early).not.toBeNull();
    expect(late).not.toBeNull();
    if (!early || !late) return;

    const earlyDistance = Math.hypot(early.x - slot.originX, early.y - slot.originY);
    const lateDistance = Math.hypot(late.x - slot.originX, late.y - slot.originY);
    expect(lateDistance).toBeGreaterThan(earlyDistance);
    expect(late.alpha).toBeLessThan(early.alpha);
  });
});

describe('getParryLingerAlpha', () => {
  it('starts fading after 750ms from parry start', () => {
    const parryStartedAt = 1_000;
    expect(getParryLingerAlpha(parryStartedAt + PARRY_LINGER_FADE_START_MS - 1, parryStartedAt, 1)).toBe(1);
    expect(
      getParryLingerAlpha(parryStartedAt + PARRY_TOTAL_MS, parryStartedAt, 1),
    ).toBeLessThan(0.05);
  });
});
