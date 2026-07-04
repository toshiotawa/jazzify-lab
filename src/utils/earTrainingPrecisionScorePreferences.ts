export const PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY = 'earTraining.precision.scoreBandHeightPx';

export const PRECISION_SCORE_BAND_DEFAULT_HEIGHT_PX = 144;
export const PRECISION_SCORE_BAND_MULTI_STAFF_DEFAULT_HEIGHT_PX = 208;
export const PRECISION_SCORE_BAND_MIN_HEIGHT_PX = 96;

export const clampPrecisionScoreBandHeightPx = (
  heightPx: number,
  viewportHeightPx: number,
): number => {
  const max = Math.max(PRECISION_SCORE_BAND_MIN_HEIGHT_PX, viewportHeightPx - 140);
  return Math.min(max, Math.max(PRECISION_SCORE_BAND_MIN_HEIGHT_PX, Math.round(heightPx)));
};

export const loadPrecisionScoreBandHeightPx = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const savePrecisionScoreBandHeightPx = (heightPx: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY,
      String(Math.round(heightPx)),
    );
  } catch {
    // ignore quota / private mode
  }
};
