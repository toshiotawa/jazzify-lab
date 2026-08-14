export const PRECISION_SCORE_BAND_HEIGHT_STORAGE_KEY = 'earTraining.precision.scoreBandHeightPx';

export const PRECISION_SCORE_BAND_DEFAULT_HEIGHT_PX = 144;
export const PRECISION_SCORE_BAND_MULTI_STAFF_DEFAULT_HEIGHT_PX = 208;
export const PRECISION_SCORE_BAND_MIN_HEIGHT_PX = 96;

/** ヘッダー + 鍵盤 + 余白（transport 除く） */
export const PRECISION_SCORE_BAND_RESERVED_TOP_PX = 52;
export const PRECISION_PIANO_HEIGHT_PX = 96;
export const PRECISION_TRANSPORT_HEIGHT_PX = 112;

export interface ClampPrecisionScoreBandHeightOptions {
  practiceMode?: boolean;
}

export const clampPrecisionScoreBandHeightPx = (
  heightPx: number,
  viewportHeightPx: number,
  options?: ClampPrecisionScoreBandHeightOptions,
): number => {
  const transport = options?.practiceMode === true ? PRECISION_TRANSPORT_HEIGHT_PX : 0;
  const reserved = PRECISION_SCORE_BAND_RESERVED_TOP_PX + PRECISION_PIANO_HEIGHT_PX + transport + 12;
  const max = Math.max(PRECISION_SCORE_BAND_MIN_HEIGHT_PX, viewportHeightPx - reserved);
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

export const hasSavedPrecisionScoreBandHeightPx = (): boolean => (
  loadPrecisionScoreBandHeightPx() !== null
);
