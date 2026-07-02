import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clampPrecisionScoreBandHeightPx,
  loadPrecisionScoreBandHeightPx,
  PRECISION_SCORE_BAND_DEFAULT_HEIGHT_PX,
  PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY,
  PRECISION_SCORE_BAND_MIN_HEIGHT_PX,
  savePrecisionScoreBandHeightPx,
} from '@/utils/earTrainingPrecisionScorePreferences';

describe('earTrainingPrecisionScorePreferences', () => {
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
    window.localStorage.removeItem(PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY);
  });

  it('returns null when nothing is stored', () => {
    expect(loadPrecisionScoreBandHeightPx()).toBeNull();
  });

  it('clamps height to min and viewport headroom', () => {
    expect(clampPrecisionScoreBandHeightPx(50, 800)).toBe(PRECISION_SCORE_BAND_MIN_HEIGHT_PX);
    expect(clampPrecisionScoreBandHeightPx(900, 800)).toBe(660);
    expect(clampPrecisionScoreBandHeightPx(128.7, 800)).toBe(129);
  });

  it('persists and reloads band height', () => {
    savePrecisionScoreBandHeightPx(160);
    expect(window.localStorage.getItem(PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY)).toBe('160');
    expect(loadPrecisionScoreBandHeightPx()).toBe(160);
  });

  it('returns null for invalid stored values', () => {
    window.localStorage.setItem(PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY, 'not-a-number');
    expect(loadPrecisionScoreBandHeightPx()).toBeNull();
  });

  it('default constant matches legacy band height', () => {
    expect(PRECISION_SCORE_BAND_DEFAULT_HEIGHT_PX).toBe(128);
  });
});
