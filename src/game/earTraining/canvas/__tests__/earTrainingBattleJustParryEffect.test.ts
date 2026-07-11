import { describe, expect, it } from 'vitest';
import {
  clearJustParryEffect,
  computeJustParryFlashLayer,
  computeJustParryRingLayer,
  computeJustParrySplashLayer,
  createJustParryEffectState,
  isJustParryEffectActive,
  JUST_PARRY_FLASH_DURATION_MS,
  JUST_PARRY_MIN_DURATION_MS,
  JUST_PARRY_RING_DURATION_MS,
  JUST_PARRY_SPLASH_DURATION_MS,
  JUST_PARRY_VISUAL_DURATION_MS,
  pruneJustParryEffect,
  resolveJustParryEffectDurationMs,
  startJustParryEffect,
  type StartJustParryEffectParams,
} from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';

const BASE_START_PARAMS: StartJustParryEffectParams = {
  startedAt: 1000,
  originX: 120,
  originY: 172,
  seedBase: 7,
  imageKey: 'guardD',
  flipX: false,
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
  it('starts active and expires on fixed visual duration', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);

    expect(isJustParryEffectActive(state, 1100)).toBe(true);
    expect(state.endAt).toBe(BASE_START_PARAMS.startedAt + JUST_PARRY_VISUAL_DURATION_MS);
    expect(isJustParryEffectActive(state, BASE_START_PARAMS.startedAt + JUST_PARRY_VISUAL_DURATION_MS - 1)).toBe(true);
    expect(isJustParryEffectActive(state, BASE_START_PARAMS.startedAt + JUST_PARRY_VISUAL_DURATION_MS)).toBe(false);

    clearJustParryEffect(state);
    expect(state.active).toBe(false);
  });

  it('restarts on consecutive hits', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);
    const firstAngle = state.splashAngle;

    startJustParryEffect(state, {
      ...BASE_START_PARAMS,
      startedAt: 1200,
      originX: 125,
      originY: 170,
      seedBase: 2,
    });

    expect(state.startedAt).toBe(1200);
    expect(state.endAt).toBe(1200 + JUST_PARRY_VISUAL_DURATION_MS);
    expect(state.splashAngle).not.toBe(firstAngle);
    expect(isJustParryEffectActive(state, 1600)).toBe(true);
    expect(isJustParryEffectActive(state, 1650)).toBe(false);
  });

  it('prunes expired effect', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);

    pruneJustParryEffect(state, BASE_START_PARAMS.startedAt + JUST_PARRY_VISUAL_DURATION_MS - 1);
    expect(state.active).toBe(true);

    pruneJustParryEffect(state, BASE_START_PARAMS.startedAt + JUST_PARRY_VISUAL_DURATION_MS);
    expect(state.active).toBe(false);
  });
});

describe('just parry layer timing', () => {
  it('is deterministic for the same seed', () => {
    const first = createJustParryEffectState();
    const second = createJustParryEffectState();
    startJustParryEffect(first, BASE_START_PARAMS);
    startJustParryEffect(second, BASE_START_PARAMS);

    expect(second.splashAngle).toBe(first.splashAngle);
    expect(second.splashAngleDelta).toBe(first.splashAngleDelta);
  });

  it('shows flash only during the first flash window', () => {
    expect(computeJustParryFlashLayer(0)?.alpha).toBeCloseTo(0.88, 5);
    expect(computeJustParryFlashLayer(Math.floor(JUST_PARRY_FLASH_DURATION_MS * 0.2))?.alpha).toBeCloseTo(0.88, 5);
    expect(computeJustParryFlashLayer(JUST_PARRY_FLASH_DURATION_MS)).toBeNull();
    expect(computeJustParryFlashLayer(JUST_PARRY_FLASH_DURATION_MS + 1)).toBeNull();
  });

  it('shows ring only during the first ring window', () => {
    expect(computeJustParryRingLayer(0)?.alpha).toBeCloseTo(0.9, 5);
    expect(computeJustParryRingLayer(Math.floor(JUST_PARRY_RING_DURATION_MS * 0.2))?.alpha).toBeCloseTo(0.9, 5);
    expect(computeJustParryRingLayer(JUST_PARRY_RING_DURATION_MS)).toBeNull();
  });

  it('shows splash for the full visual window', () => {
    expect(computeJustParrySplashLayer(0, 0, 0)?.alpha).toBeCloseTo(0.85, 5);
    expect(computeJustParrySplashLayer(Math.floor(JUST_PARRY_SPLASH_DURATION_MS * 0.2), 0, 0)?.alpha).toBeCloseTo(0.85, 5);
    expect(computeJustParrySplashLayer(JUST_PARRY_SPLASH_DURATION_MS)).toBeNull();
  });

  it('expands each layer over time', () => {
    const flashStart = computeJustParryFlashLayer(0);
    const flashMid = computeJustParryFlashLayer(Math.floor(JUST_PARRY_FLASH_DURATION_MS * 0.5));
    const ringStart = computeJustParryRingLayer(0);
    const ringMid = computeJustParryRingLayer(Math.floor(JUST_PARRY_RING_DURATION_MS * 0.5));
    const splashStart = computeJustParrySplashLayer(0, 0, 0);
    const splashMid = computeJustParrySplashLayer(Math.floor(JUST_PARRY_SPLASH_DURATION_MS * 0.5), 0, 0);

    expect(flashStart).not.toBeNull();
    expect(flashMid).not.toBeNull();
    expect(ringStart).not.toBeNull();
    expect(ringMid).not.toBeNull();
    expect(splashStart).not.toBeNull();
    expect(splashMid).not.toBeNull();

    if (!flashStart || !flashMid || !ringStart || !ringMid || !splashStart || !splashMid) {
      throw new Error('expected layer params');
    }

    expect(flashMid.scale).toBeGreaterThan(flashStart.scale);
    expect(ringMid.scale).toBeGreaterThan(ringStart.scale);
    expect(splashMid.scale).toBeGreaterThan(splashStart.scale);
  });
});
