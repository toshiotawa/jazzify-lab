import { describe, expect, it } from 'vitest';
import {
  clearJustParryEffect,
  createJustParryEffectState,
  getJustParryEffectAlpha,
  isJustParryEffectActive,
  JUST_PARRY_MIN_DURATION_MS,
  JUST_PARRY_SPARK_COUNT,
  pruneJustParryEffect,
  resolveJustParryEffectDurationMs,
  startJustParryEffect,
  type JustParrySparkStreak,
  type StartJustParryEffectParams,
} from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';

const BASE_START_PARAMS: StartJustParryEffectParams = {
  startedAt: 1000,
  durationMs: 400,
  originX: 120,
  originY: 172,
  contactX: 180,
  contactY: 170,
  imageKey: 'avatar',
  flipX: false,
  seedBase: 7,
};

const computeSparkPosition = (
  streak: JustParrySparkStreak,
  originX: number,
  originY: number,
  elapsedMs: number,
): { x: number; y: number } => {
  const localElapsed = Math.max(0, elapsedMs - streak.delayMs);
  const t = localElapsed / 1000;
  const frictionIntegral = streak.friction > 1e-6
    ? (1 - Math.exp(-streak.friction * t)) / streak.friction
    : t;
  return {
    x: originX + streak.vx * frictionIntegral,
    y: originY + streak.vy * frictionIntegral + 0.5 * 420 * t * t,
  };
};

describe('resolveJustParryEffectDurationMs', () => {
  it('uses full note duration minus 1ms to next target when available', () => {
    expect(resolveJustParryEffectDurationMs(1, 2, undefined)).toBe(999);
    expect(resolveJustParryEffectDurationMs(0.5, 1.5, undefined)).toBe(999);
  });

  it('uses fallback end phrase sec minus 1ms for final target', () => {
    expect(resolveJustParryEffectDurationMs(1, undefined, 2.2)).toBe(1199);
  });

  it('enforces minimum duration', () => {
    expect(resolveJustParryEffectDurationMs(1, 1.05, undefined)).toBe(JUST_PARRY_MIN_DURATION_MS);
    expect(resolveJustParryEffectDurationMs(1, undefined, 1.02)).toBe(JUST_PARRY_MIN_DURATION_MS);
  });
});

describe('just parry effect lifecycle', () => {
  it('starts active and expires on raw wall clock', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);

    expect(isJustParryEffectActive(state, 1100)).toBe(true);
    expect(state.streaks.length).toBeGreaterThanOrEqual(JUST_PARRY_SPARK_COUNT);
    expect(getJustParryEffectAlpha(state, 1100)).toBe(1);
    expect(isJustParryEffectActive(state, 1400)).toBe(false);

    clearJustParryEffect(state);
    expect(state.active).toBe(false);
    expect(state.streaks).toHaveLength(0);
  });

  it('restarts on consecutive hits', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, {
      ...BASE_START_PARAMS,
      durationMs: 300,
      imageKey: 'avatar-a',
      seedBase: 1,
    });
    const firstStreaks = state.streaks;

    startJustParryEffect(state, {
      ...BASE_START_PARAMS,
      startedAt: 1200,
      durationMs: 500,
      originX: 125,
      originY: 170,
      contactX: 190,
      contactY: 168,
      imageKey: 'avatar-b',
      flipX: true,
      seedBase: 2,
    });

    expect(state.startedAt).toBe(1200);
    expect(state.endAt).toBe(1700);
    expect(state.imageKey).toBe('avatar-b');
    expect(state.streaks).not.toBe(firstStreaks);
    expect(isJustParryEffectActive(state, 1600)).toBe(true);
    expect(isJustParryEffectActive(state, 1700)).toBe(false);
  });

  it('prunes expired effect', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);

    pruneJustParryEffect(state, 1399);
    expect(state.active).toBe(true);

    pruneJustParryEffect(state, 1400);
    expect(state.active).toBe(false);
    expect(state.streaks).toHaveLength(0);
  });
});

describe('just parry precomputed spark params', () => {
  it('is deterministic for the same seed', () => {
    const first = createJustParryEffectState();
    const second = createJustParryEffectState();
    startJustParryEffect(first, BASE_START_PARAMS);
    startJustParryEffect(second, BASE_START_PARAMS);

    expect(second.streaks).toEqual(first.streaks);
  });

  it('assigns velocities and color indices within expected ranges', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);

    state.streaks.forEach((streak) => {
      const speed = Math.hypot(streak.vx, streak.vy);
      expect(speed).toBeGreaterThanOrEqual(200);
      expect(speed).toBeLessThanOrEqual(1250);
      expect(streak.colorIndex).toBeGreaterThanOrEqual(0);
      expect(streak.colorIndex).toBeLessThan(4);
      expect(streak.lengthPx).toBeGreaterThanOrEqual(4);
      expect(streak.lengthPx).toBeLessThanOrEqual(24);
    });
  });

  it('follows friction-based motion over elapsed time', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);
    const streak = state.streaks[0];
    if (!streak) {
      throw new Error('expected streak');
    }

    const atStart = computeSparkPosition(streak, state.originX, state.originY, 0);
    expect(atStart.x).toBe(state.originX);
    expect(atStart.y).toBe(state.originY);

    const later = computeSparkPosition(
      streak,
      state.originX,
      state.originY,
      streak.delayMs + 120,
    );
    expect(later.y).toBeGreaterThan(atStart.y);
    expect(later.x).not.toBe(atStart.x);
  });
});
