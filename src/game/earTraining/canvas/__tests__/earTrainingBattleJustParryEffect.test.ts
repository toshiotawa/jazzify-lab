import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  clearJustParryBodyGlow,
  createJustParryBodyGlowState,
  getJustParryBodyGlowAlpha,
  isJustParryBodyGlowActive,
  JUST_PARRY_GUARD_GLOW_BLIP_MS,
  JUST_PARRY_GUARD_SUSTAIN_MS,
  JUST_PARRY_MIN_DURATION_MS,
  pruneJustParryBodyGlow,
  resolveJustParryEffectDurationMs,
  startJustParryBodyGlow,
} from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';

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

describe('just parry body glow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sustains guard glow until cleared', () => {
    expect(JUST_PARRY_GUARD_SUSTAIN_MS).toBeGreaterThan(60_000);
    expect(JUST_PARRY_GUARD_GLOW_BLIP_MS).toBe(2);
    const state = createJustParryBodyGlowState();
    startJustParryBodyGlow(state, {
      startedAt: 1000,
      durationMs: JUST_PARRY_GUARD_SUSTAIN_MS,
      imageKey: 'guardD',
      flipX: false,
    });
    expect(isJustParryBodyGlowActive(state, 1000 + 10_000)).toBe(true);
    expect(getJustParryBodyGlowAlpha(state, 1010)).toBe(1);
    clearJustParryBodyGlow(state);
    expect(isJustParryBodyGlowActive(state, 1010)).toBe(false);
  });

  it('matches finish pose duration of one beat', () => {
    const oneBeatMs = 375;
    const state = createJustParryBodyGlowState();
    startJustParryBodyGlow(state, {
      startedAt: 500,
      durationMs: oneBeatMs,
      imageKey: 'finish',
      flipX: false,
    });
    expect(state.endAt).toBe(500 + oneBeatMs);
    expect(isJustParryBodyGlowActive(state, 500 + oneBeatMs - 1)).toBe(true);
    pruneJustParryBodyGlow(state, 500 + oneBeatMs);
    expect(state.active).toBe(false);
  });
});
