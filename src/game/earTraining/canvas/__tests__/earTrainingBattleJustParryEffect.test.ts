import { describe, expect, it } from 'vitest';
import {
  clearJustParryEffect,
  createJustParryEffectState,
  getJustParryEffectAlpha,
  isJustParryEffectActive,
  JUST_PARRY_INK_CORE_BLOB_MAX_COUNT,
  JUST_PARRY_INK_CORE_BLOB_MIN_COUNT,
  JUST_PARRY_INK_DROPLET_COUNT,
  JUST_PARRY_INK_TENDRIL_COUNT,
  JUST_PARRY_INK_TEXTURE_VARIANT_COUNT,
  JUST_PARRY_MIN_DURATION_MS,
  pruneJustParryEffect,
  resolveJustParryEffectDurationMs,
  startJustParryEffect,
  type JustParryInkDroplet,
  type StartJustParryEffectParams,
} from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';

const BASE_START_PARAMS: StartJustParryEffectParams = {
  startedAt: 1000,
  durationMs: 400,
  playerBodyX: 120,
  playerBodyY: 200,
  contactX: 180,
  contactY: 170,
  imageKey: 'avatar',
  flipX: false,
  seedBase: 7,
};

const computeBallisticPosition = (
  droplet: JustParryInkDroplet,
  contactX: number,
  contactY: number,
  elapsedMs: number,
): { x: number; y: number } => {
  const localElapsed = Math.max(0, elapsedMs - droplet.delayMs);
  const t = localElapsed / 1000;
  const gravity = 1900;
  return {
    x: contactX + droplet.vx * t,
    y: contactY + droplet.vy * t + 0.5 * gravity * t * t,
  };
};

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
    startJustParryEffect(state, BASE_START_PARAMS);

    expect(isJustParryEffectActive(state, 1100)).toBe(true);
    expect(state.droplets).toHaveLength(JUST_PARRY_INK_DROPLET_COUNT);
    expect(state.coreBlobs.length).toBeGreaterThanOrEqual(JUST_PARRY_INK_CORE_BLOB_MIN_COUNT);
    expect(state.coreBlobs.length).toBeLessThanOrEqual(JUST_PARRY_INK_CORE_BLOB_MAX_COUNT);
    expect(state.tendrils).toHaveLength(JUST_PARRY_INK_TENDRIL_COUNT);
    expect(getJustParryEffectAlpha(state, 1100)).toBe(1);
    expect(isJustParryEffectActive(state, 1400)).toBe(false);

    clearJustParryEffect(state);
    expect(state.active).toBe(false);
    expect(state.droplets).toHaveLength(0);
    expect(state.coreBlobs).toHaveLength(0);
    expect(state.tendrils).toHaveLength(0);
  });

  it('restarts on consecutive hits', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, {
      ...BASE_START_PARAMS,
      durationMs: 300,
      imageKey: 'avatar-a',
      seedBase: 1,
    });
    const firstDroplets = state.droplets;
    const firstCoreBlobs = state.coreBlobs;

    startJustParryEffect(state, {
      ...BASE_START_PARAMS,
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
    expect(state.coreBlobs).not.toBe(firstCoreBlobs);
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
    expect(state.droplets).toHaveLength(0);
  });
});

describe('just parry precomputed ink params', () => {
  it('is deterministic for the same seed', () => {
    const first = createJustParryEffectState();
    const second = createJustParryEffectState();
    startJustParryEffect(first, BASE_START_PARAMS);
    startJustParryEffect(second, BASE_START_PARAMS);

    expect(second.droplets).toEqual(first.droplets);
    expect(second.coreBlobs).toEqual(first.coreBlobs);
    expect(second.tendrils).toEqual(first.tendrils);
  });

  it('assigns ballistic velocities and texture indices within expected ranges', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);

    state.droplets.forEach((droplet) => {
      const speed = Math.hypot(droplet.vx, droplet.vy);
      expect(speed).toBeGreaterThanOrEqual(210);
      expect(speed).toBeLessThanOrEqual(940);
      expect(droplet.textureIndex).toBeGreaterThanOrEqual(0);
      expect(droplet.textureIndex).toBeLessThan(JUST_PARRY_INK_TEXTURE_VARIANT_COUNT);
      expect(Math.abs(droplet.spinRadPerSec)).toBeLessThanOrEqual(2);
      expect(droplet.sizePx).toBeGreaterThanOrEqual(4);
      expect(droplet.sizePx).toBeLessThanOrEqual(22);
    });

    state.coreBlobs.forEach((blob) => {
      const offsetDist = Math.hypot(blob.offsetX, blob.offsetY);
      expect(offsetDist).toBeGreaterThanOrEqual(34 * 0.3 - 0.01);
      expect(offsetDist).toBeLessThanOrEqual(34 * 0.6 + 0.01);
      expect(blob.textureIndex).toBeGreaterThanOrEqual(0);
      expect(blob.textureIndex).toBeLessThan(JUST_PARRY_INK_TEXTURE_VARIANT_COUNT);
    });
  });

  it('follows gravity-based ballistic motion over elapsed time', () => {
    const state = createJustParryEffectState();
    startJustParryEffect(state, BASE_START_PARAMS);
    const droplet = state.droplets[0];
    if (!droplet) {
      throw new Error('expected droplet');
    }

    const atStart = computeBallisticPosition(droplet, state.contactX, state.contactY, 0);
    expect(atStart.x).toBe(state.contactX);
    expect(atStart.y).toBe(state.contactY);

    const later = computeBallisticPosition(
      droplet,
      state.contactX,
      state.contactY,
      droplet.delayMs + 120,
    );
    expect(later.y).toBeGreaterThan(atStart.y);
    expect(later.x).not.toBe(atStart.x);
  });
});
