import { describe, expect, it } from 'vitest';
import { computeReflectHammerResyncState } from '../earTrainingBattleEffectScheduler';
import { PARRY_REFLECT_HAMMER_WALL_MS } from '../earTrainingBattleDrawState';

describe('computeReflectHammerResyncState', () => {
  it('keeps zero progress at slow end', () => {
    const result = computeReflectHammerResyncState(1_000, 1_000, 2_000);
    expect(result.progress).toBe(0);
    expect(result.newStartedAt).toBe(2_000);
    expect(result.remainingMs).toBe(PARRY_REFLECT_HAMMER_WALL_MS);
  });

  it('preserves mid-flight progress when visual slow ends', () => {
    const startedAt = 1_000;
    const oldVisualNow = startedAt + PARRY_REFLECT_HAMMER_WALL_MS * 0.5;
    const now = 5_000;
    const result = computeReflectHammerResyncState(oldVisualNow, startedAt, now);
    expect(result.progress).toBeCloseTo(0.5);
    expect(result.newStartedAt).toBeCloseTo(now - PARRY_REFLECT_HAMMER_WALL_MS * 0.5);
    expect(result.remainingMs).toBeCloseTo(PARRY_REFLECT_HAMMER_WALL_MS * 0.5);
  });

  it('clamps completed flights to immediate impact', () => {
    const startedAt = 1_000;
    const oldVisualNow = startedAt + PARRY_REFLECT_HAMMER_WALL_MS + 50;
    const result = computeReflectHammerResyncState(oldVisualNow, startedAt, 3_000);
    expect(result.progress).toBe(1);
    expect(result.remainingMs).toBe(0);
  });
});
