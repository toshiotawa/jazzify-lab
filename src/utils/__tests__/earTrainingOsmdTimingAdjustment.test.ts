import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clampEarTrainingOsmdTimingAdjustmentMs,
  EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY,
  formatEarTrainingOsmdTimingAdjustmentLabel,
  loadEarTrainingOsmdTimingAdjustmentMs,
  OSMD_TIMING_ADJUSTMENT_MS_DEFAULT,
  resolveOsmdCalibratedTargetTimeSec,
  saveEarTrainingOsmdTimingAdjustmentMs,
  timingAdjustmentMsToSec,
} from '@/utils/earTrainingOsmdTimingAdjustment';

describe('earTrainingOsmdTimingAdjustment', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
    window.localStorage.removeItem(EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY);
  });

  it('returns default +40ms when nothing is stored', () => {
    expect(loadEarTrainingOsmdTimingAdjustmentMs()).toBe(OSMD_TIMING_ADJUSTMENT_MS_DEFAULT);
  });

  it('clamps and rounds to 10ms steps', () => {
    expect(clampEarTrainingOsmdTimingAdjustmentMs(-310)).toBe(-300);
    expect(clampEarTrainingOsmdTimingAdjustmentMs(305)).toBe(300);
    expect(clampEarTrainingOsmdTimingAdjustmentMs(43)).toBe(40);
    expect(clampEarTrainingOsmdTimingAdjustmentMs(45)).toBe(50);
  });

  it('formats labels with sign', () => {
    expect(formatEarTrainingOsmdTimingAdjustmentLabel(40)).toBe('+40ms');
    expect(formatEarTrainingOsmdTimingAdjustmentLabel(-20)).toBe('-20ms');
    expect(formatEarTrainingOsmdTimingAdjustmentLabel(0)).toBe('0ms');
  });

  it('persists and reloads timing adjustment', () => {
    saveEarTrainingOsmdTimingAdjustmentMs(120);
    expect(window.localStorage.getItem(EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY)).toBe('120');
    expect(loadEarTrainingOsmdTimingAdjustmentMs()).toBe(120);
  });

  it('clamps invalid stored values on load', () => {
    window.localStorage.setItem(EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY, '999');
    expect(loadEarTrainingOsmdTimingAdjustmentMs()).toBe(300);
    window.localStorage.setItem(EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY, 'not-a-number');
    expect(loadEarTrainingOsmdTimingAdjustmentMs()).toBe(OSMD_TIMING_ADJUSTMENT_MS_DEFAULT);
  });

  it('resolveOsmdCalibratedTargetTimeSec adds adjustment to speed-scaled time', () => {
    expect(resolveOsmdCalibratedTargetTimeSec(2, 40)).toBe(2.04);
    expect(timingAdjustmentMsToSec(40)).toBe(0.04);
  });
});
