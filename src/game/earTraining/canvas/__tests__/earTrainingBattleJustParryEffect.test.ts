import { describe, expect, it } from 'vitest';
import {
  clearJustParryEffect,
  createJustParryEffectState,
  getJustParryEffectAlpha,
  isJustParryEffectActive,
  JUST_PARRY_INK_DROPLET_COUNT,
  JUST_PARRY_INK_SPLAT_SPIKE_COUNT,
  JUST_PARRY_INK_TENDRIL_COUNT,
  JUST_PARRY_MIN_DURATION_MS,
  resolveJustParryEffectDurationMs,
  startJustParryEffect,
} from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';

describe('resolveJustParryEffectDurationMs', () => {
  it('uses midpoint to next target when available', () => {
    expect(resolveJustParryEffectDurationMs(1, 2, undefined)).toBe(500);
    expect(resolveJustParryEffectDurationMs(0.5, 1.5, undefined)).toBe(500);
  });

  it('uses fallback end phrase sec for final target', () => {
    expect(resolveJustParryEffectDurationMs(1, undefined, 2.2)).toBe(1200);
  });

  it('enforces minimum duration', () => {
    expect(resolveJustParryEffectDurationMs(1, 1.05, undefined)).toBe(JUST_PARRY_MIN_DURATION_MS);
    expect(resolveJustParryEffectDurationMs(1, undefined, 1.02)).toBe(JUST_PARRY_MIN_DURATION_MS);
  });
});

describe('just parry effect lifecycle', () => {
  it('starts active and expires on raw wall clock', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, {
      startedAt: 1000,
      durationMs: 400,
      playerBodyX: 120,
      playerBodyY: 200,
      contactX: 180,
      contactY: 170,
      imageKey: 'avatar',
      flipX: false,
      seedBase: 7,
    });

    expect(isJustParryEffectActive(state, 1100)).toBe(true);
    expect(state.droplets).toHaveLength(JUST_PARRY_INK_DROPLET_COUNT);
    expect(state.splatSpikes).toHaveLength(JUST_PARRY_INK_SPLAT_SPIKE_COUNT);
    expect(state.tendrils).toHaveLength(JUST_PARRY_INK_TENDRIL_COUNT);
    expect(state.droplets[0]?.satellites.length).toBeGreaterThanOrEqual(2);
    expect(getJustParryEffectAlpha(state, 1100)).toBe(1);
    expect(isJustParryEffectActive(state, 1400)).toBe(false);

    clearJustParryEffect(state);
    expect(state.active).toBe(false);
    expect(state.droplets).toHaveLength(0);
    expect(state.splatSpikes).toHaveLength(0);
    expect(state.tendrils).toHaveLength(0);
  });

  it('restarts on consecutive hits', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, {
      startedAt: 1000,
      durationMs: 300,
      playerBodyX: 120,
      playerBodyY: 200,
      contactX: 180,
      contactY: 170,
      imageKey: 'avatar-a',
      flipX: false,
      seedBase: 1,
    });
    const firstDroplets = state.droplets;
    const firstSpikes = state.splatSpikes;

    startJustParryEffect(state, {
      startedAt: 1200,
      durationMs: 500,
      playerBodyX: 125,
      playerBodyY: 198,
      contactX: 190,
      contactY: 168,
      imageKey: 'avatar-b',
      flipX: true,
      seedBase: 2,
    });

    expect(state.startedAt).toBe(1200);
    expect(state.endAt).toBe(1700);
    expect(state.imageKey).toBe('avatar-b');
    expect(state.droplets).not.toBe(firstDroplets);
    expect(state.splatSpikes).not.toBe(firstSpikes);
    expect(isJustParryEffectActive(state, 1600)).toBe(true);
    expect(isJustParryEffectActive(state, 1700)).toBe(false);
  });
});
