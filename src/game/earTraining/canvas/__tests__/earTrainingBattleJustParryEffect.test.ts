import { describe, expect, it } from 'vitest';
import {
  clearJustParryBodyGlow,
  createJustParryBodyGlowState,
  getJustParryBodyGlowAlpha,
  isJustParryBodyGlowActive,
  JUST_PARRY_MIN_DURATION_MS,
  JUST_PARRY_VISUAL_DURATION_MS,
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
  it('uses guard duration of 60ms', () => {
    expect(JUST_PARRY_VISUAL_DURATION_MS).toBe(60);
    const state = createJustParryBodyGlowState();
    startJustParryBodyGlow(state, {
      startedAt: 1000,
      durationMs: JUST_PARRY_VISUAL_DURATION_MS,
      imageKey: 'guardD',
      flipX: false,
    });
    expect(isJustParryBodyGlowActive(state, 1059)).toBe(true);
    expect(isJustParryBodyGlowActive(state, 1060)).toBe(false);
    expect(getJustParryBodyGlowAlpha(state, 1010)).toBe(1);
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
    clearJustParryBodyGlow(state);
  });
});
