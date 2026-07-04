export const OSMD_BATTLE_PLAYHEAD_PX = 120;
/** 1 小節フィット時の最小縮小率（iOS `precisionMinFitScale` と同一）。 */
const OSMD_PRECISION_MIN_FIT_SCALE = 0.35;
/** 窓フィットの最低表示小節数（Web バトル。iOS は Swift 側で 3）。 */
export const OSMD_WINDOW_MIN_VISIBLE_MEASURES_WEB = 4;
/** 最低表示小節数でスケールがこの倍率未満なら 2 小節フィットへフォールバック。 */
export const OSMD_WINDOW_DENSE_FALLBACK_SCALE = 0.5;
/** 密集フォールバック時の表示小節数。 */
export const OSMD_WINDOW_DENSE_FALLBACK_MEASURES = 2;

export interface OsmdFitWindowConfig {
  minVisibleMeasures: number;
}

export interface OsmdScrollLayout {
  /** プレイヘッド固定位置（画面左からの px）。0 のとき小節左端をビューポート左端に合わせる。 */
  playheadPx: number;
  /** true のとき小節の左端（小節線）をアンカーにする（false は音符左端を優先）。 */
  anchorToMeasureLeft: boolean;
  /** true のとき現在小節がビューポート幅に収まるよう effectiveScale を縮小する。 */
  fitActiveMeasureWidth: boolean;
  /** 設定時は N 小節窓フィット＋最終表示小節到達時の窓ジャンプスクロール。 */
  fitWindow?: OsmdFitWindowConfig;
}

/** リズムバトル既定（4 小節窓フィット・最終表示小節到達時ジャンプ）。 */
export const OSMD_SCROLL_LAYOUT_BATTLE_DEFAULT: OsmdScrollLayout = {
  playheadPx: 0,
  anchorToMeasureLeft: true,
  fitActiveMeasureWidth: false,
  fitWindow: {
    minVisibleMeasures: OSMD_WINDOW_MIN_VISIBLE_MEASURES_WEB,
  },
};

/** 精密モード（左端アンカー・1 小節フィット）。 */
export const OSMD_SCROLL_LAYOUT_PRECISION: OsmdScrollLayout = {
  playheadPx: 0,
  anchorToMeasureLeft: true,
  fitActiveMeasureWidth: true,
};

export interface OsmdMeasureBounds {
  left: number;
  right: number;
  noteLeft?: number;
  noteRight?: number;
}

export interface OsmdMeasureJumpScrollInput {
  activeMeasureNumber: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  measureCentersByNumber: Readonly<Record<number, number>>;
  playheadPx: number;
  effectiveScale: number;
  scoreWidth: number;
  viewportWidth: number;
  /** true のとき音符左端ではなく小節線（bounds.left）をアンカーにする。 */
  anchorToMeasureLeft?: boolean;
}

export interface OsmdMeasureJumpScrollResult {
  offsetPx: number;
  xPos: number;
}

export interface OsmdReachEndJumpScrollInput {
  activeMeasureNumber: number;
  previousWindowStart: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  measureCentersByNumber: Readonly<Record<number, number>>;
  cssScale: number;
  playheadPx: number;
  scoreWidth: number;
  viewportWidth: number;
  maxMeasureNumber: number;
  minFitScale?: number;
}

export interface OsmdReachEndJumpScrollResult extends OsmdMeasureJumpScrollResult {
  windowStartMeasure: number;
}

export interface OsmdActiveMeasureHighlightInput {
  activeMeasureNumber: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  playheadPx: number;
  effectiveScale: number;
  scrollOffsetPx: number;
}

export interface OsmdActiveMeasureHighlightResult {
  leftPx: number;
  widthPx: number;
  visible: boolean;
}

const clamp = (value: number, min: number, max: number): number => (
  Math.max(min, Math.min(max, value))
);

const resolveScrollAnchorX = (
  bounds: OsmdMeasureBounds | undefined,
  measureCentersByNumber: Readonly<Record<number, number>>,
  measureNumber: number,
  viewportWidth: number,
  anchorToMeasureLeft: boolean,
): number => {
  if (bounds) {
    if (anchorToMeasureLeft) {
      return bounds.left;
    }
    if (typeof bounds.noteLeft === 'number' && Number.isFinite(bounds.noteLeft)) {
      return bounds.noteLeft;
    }
    return bounds.left;
  }
  return measureCentersByNumber[measureNumber]
    ?? measureCentersByNumber[1]
    ?? viewportWidth / 2;
};

/** 表示 N 小節窓の開始小節番号（最終表示小節到達時に次窓へ: 1, 4, 7, … / n=4 の例）。 */
export const computeOsmdWindowStartMeasureNumber = (
  activeMeasureNumber: number,
  visibleMeasures = OSMD_WINDOW_MIN_VISIBLE_MEASURES_WEB,
): number => {
  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const safeVisible = Math.max(2, Math.floor(visibleMeasures));
  const stride = safeVisible - 1;
  return 1 + Math.floor((measureNumber - 1) / stride) * stride;
};

const computeOsmdWindowMeasureSpanWidth = (
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>,
  windowStart: number,
  visibleMeasures: number,
  maxMeasureNumber: number,
): number | null => {
  const safeVisible = Math.max(1, Math.floor(visibleMeasures));
  const windowEnd = Math.min(maxMeasureNumber, windowStart + safeVisible - 1);
  const startBounds = measureBoundsByNumber[windowStart];
  const endBounds = measureBoundsByNumber[windowEnd];
  if (!startBounds || !endBounds) {
    return null;
  }
  const width = endBounds.right - startBounds.left;
  if (!Number.isFinite(width) || width <= 0) {
    return null;
  }
  return width;
};

const computeOsmdWindowFitMultiplier = (input: {
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  maxMeasureNumber: number;
  viewportWidth: number;
  cssScale: number;
  visibleMeasures: number;
  minFitScale: number;
}): number => {
  const {
    measureBoundsByNumber,
    maxMeasureNumber,
    viewportWidth,
    cssScale,
    visibleMeasures,
    minFitScale,
  } = input;
  if (cssScale <= 0 || viewportWidth <= 0 || maxMeasureNumber <= 0) {
    return 1;
  }
  const safeVisible = Math.max(2, Math.floor(visibleMeasures));
  const stride = safeVisible - 1;
  let maxWindowWidth = 0;
  for (let windowStart = 1; windowStart <= maxMeasureNumber; windowStart += stride) {
    const spanWidth = computeOsmdWindowMeasureSpanWidth(
      measureBoundsByNumber,
      windowStart,
      visibleMeasures,
      maxMeasureNumber,
    );
    if (spanWidth !== null && spanWidth > maxWindowWidth) {
      maxWindowWidth = spanWidth;
    }
  }
  if (maxWindowWidth <= 0) {
    return 1;
  }
  const fitScale = viewportWidth / (maxWindowWidth * cssScale);
  return Math.min(1, Math.max(minFitScale, fitScale));
};

/** 全窓の最大幅に基づくグローバル窓フィット effectiveScale。 */
export const computeOsmdWindowFitScale = (input: {
  cssScale: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  maxMeasureNumber: number;
  viewportWidth: number;
  minVisibleMeasures: number;
  minFitScale?: number;
  denseFallbackScale?: number;
}): number => {
  const {
    cssScale,
    measureBoundsByNumber,
    maxMeasureNumber,
    viewportWidth,
    minVisibleMeasures,
    minFitScale = OSMD_PRECISION_MIN_FIT_SCALE,
    denseFallbackScale = OSMD_WINDOW_DENSE_FALLBACK_SCALE,
  } = input;
  const safeMinVisible = Math.max(2, Math.floor(minVisibleMeasures));
  let multiplier = computeOsmdWindowFitMultiplier({
    measureBoundsByNumber,
    maxMeasureNumber,
    viewportWidth,
    cssScale,
    visibleMeasures: safeMinVisible,
    minFitScale,
  });
  if (multiplier < denseFallbackScale && safeMinVisible > OSMD_WINDOW_DENSE_FALLBACK_MEASURES) {
    multiplier = computeOsmdWindowFitMultiplier({
      measureBoundsByNumber,
      maxMeasureNumber,
      viewportWidth,
      cssScale,
      visibleMeasures: OSMD_WINDOW_DENSE_FALLBACK_MEASURES,
      minFitScale,
    });
  }
  return cssScale * multiplier;
};

export interface OsmdWindowJumpScrollInput {
  activeMeasureNumber: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  measureCentersByNumber: Readonly<Record<number, number>>;
  effectiveScale: number;
  scoreWidth: number;
  viewportWidth: number;
  visibleMeasures?: number;
}

/** 窓開始小節左端をビューポート左端へ合わせるオフセット（窓 1 は 0 で音部記号を保持）。 */
export const computeOsmdWindowJumpScrollOffset = (
  input: OsmdWindowJumpScrollInput,
): OsmdMeasureJumpScrollResult => {
  const visibleMeasures = input.visibleMeasures ?? OSMD_WINDOW_MIN_VISIBLE_MEASURES_WEB;
  const measureNumber = Math.max(1, Math.floor(input.activeMeasureNumber));
  const windowStart = computeOsmdWindowStartMeasureNumber(measureNumber, visibleMeasures);
  const bounds = input.measureBoundsByNumber[windowStart] ?? input.measureBoundsByNumber[1];
  const xPos = bounds?.left
    ?? input.measureCentersByNumber[windowStart]
    ?? input.measureCentersByNumber[1]
    ?? input.viewportWidth / 2;

  if (windowStart === 1) {
    return { offsetPx: 0, xPos };
  }

  const maxOffset = Math.max(0, input.scoreWidth * input.effectiveScale - input.viewportWidth);
  const offsetPx = clamp(xPos * input.effectiveScale, 0, maxOffset);
  return { offsetPx, xPos };
};

/** windowStart から effectiveScale 適用後にビューポートへ収まる小節数。 */
export const computeOsmdVisibleMeasureCountFromWindowStart = (input: {
  windowStartMeasure: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  effectiveScale: number;
  viewportWidth: number;
  maxMeasureNumber: number;
}): number => {
  const windowStart = Math.max(1, Math.floor(input.windowStartMeasure));
  const startBounds = input.measureBoundsByNumber[windowStart];
  if (!startBounds || input.viewportWidth <= 0 || input.effectiveScale <= 0) {
    return 1;
  }
  const originX = startBounds.left * input.effectiveScale;
  let count = 0;
  for (let measureNumber = windowStart; measureNumber <= input.maxMeasureNumber; measureNumber += 1) {
    const bounds = input.measureBoundsByNumber[measureNumber];
    if (!bounds) {
      break;
    }
    const rightPx = bounds.right * input.effectiveScale - originX;
    if (count > 0 && rightPx > input.viewportWidth) {
      break;
    }
    count += 1;
  }
  return Math.max(1, count);
};

/** 精密モード: 最終表示小節到達時のみ窓を進めるジャンプ（1 小節フィット維持）。 */
export const computeOsmdReachEndJumpScrollOffset = (
  input: OsmdReachEndJumpScrollInput,
): OsmdReachEndJumpScrollResult => {
  const activeMeasure = Math.max(1, Math.floor(input.activeMeasureNumber));
  const activeBounds = input.measureBoundsByNumber[activeMeasure] ?? input.measureBoundsByNumber[1];
  const effectiveScale = computeOsmdEffectiveScaleForMeasure({
    cssScale: input.cssScale,
    bounds: activeBounds,
    viewportWidth: input.viewportWidth,
    fitActiveMeasureWidth: true,
    minFitScale: input.minFitScale,
  });

  let windowStart = Math.max(1, Math.floor(input.previousWindowStart));
  if (activeMeasure < windowStart) {
    windowStart = activeMeasure;
  }

  const visibleCount = computeOsmdVisibleMeasureCountFromWindowStart({
    windowStartMeasure: windowStart,
    measureBoundsByNumber: input.measureBoundsByNumber,
    effectiveScale,
    viewportWidth: input.viewportWidth,
    maxMeasureNumber: input.maxMeasureNumber,
  });
  const lastVisible = windowStart + visibleCount - 1;

  if (activeMeasure >= lastVisible && activeMeasure > windowStart) {
    windowStart = activeMeasure;
  }

  const anchorBounds = input.measureBoundsByNumber[windowStart] ?? input.measureBoundsByNumber[1];
  const xPos = anchorBounds?.left
    ?? input.measureCentersByNumber[windowStart]
    ?? input.measureCentersByNumber[1]
    ?? input.viewportWidth / 2;

  if (windowStart === 1) {
    return { offsetPx: 0, xPos, windowStartMeasure: windowStart };
  }

  const maxOffset = Math.max(0, input.scoreWidth * effectiveScale - input.viewportWidth);
  const offsetPx = clamp(xPos * effectiveScale - input.playheadPx, 0, maxOffset);
  return { offsetPx, xPos, windowStartMeasure: windowStart };
};

/** 現在小節の左端（小節線付近）を固定プレイヘッド位置へ合わせるオフセット（小節更新時のみジャンプ）。 */
export const computeOsmdMeasureJumpScrollOffset = (
  input: OsmdMeasureJumpScrollInput,
): OsmdMeasureJumpScrollResult => {
  const {
    activeMeasureNumber,
    measureBoundsByNumber,
    measureCentersByNumber,
    playheadPx,
    effectiveScale,
    scoreWidth,
    viewportWidth,
    anchorToMeasureLeft = false,
  } = input;

  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1];
  const xPos = resolveScrollAnchorX(
    bounds,
    measureCentersByNumber,
    measureNumber,
    viewportWidth,
    anchorToMeasureLeft,
  );

  const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
  const offsetPx = clamp(xPos * effectiveScale - playheadPx, 0, maxOffset);

  return { offsetPx, xPos };
};

/** 手動スクロールの相対オフセットを、合成後オフセットが [0, maxOffset] に収まるようクランプする。 */
export const clampOsmdManualScrollOffset = (input: {
  baseOffsetPx: number;
  manualOffsetPx: number;
  scoreWidth: number;
  effectiveScale: number;
  viewportWidth: number;
}): number => {
  const maxOffset = Math.max(0, input.scoreWidth * input.effectiveScale - input.viewportWidth);
  return Math.min(Math.max(input.manualOffsetPx, -input.baseOffsetPx), maxOffset - input.baseOffsetPx);
};

/** カウントイン中（phraseTimelineSec < 0）の小節 1 内プレイヘッド進捗 0..1。 */
export const computeOsmdCountInPlayheadProgress = (
  phraseTimelineSec: number,
  countInDurationSec: number,
): number => {
  if (phraseTimelineSec >= 0 || countInDurationSec <= 0) {
    return 0;
  }
  const progress = (phraseTimelineSec + countInDurationSec) / countInDurationSec;
  return Math.max(0, Math.min(1, progress));
};

/** 小節内プレイヘッド進捗 0..1（カウントイン／本編共通）。 */
export const computeOsmdMeasurePlayheadProgress = (input: {
  phraseTimelineSec: number;
  activeMeasureNumber: number;
  measureDurationSec: number;
  countInDurationSec: number;
}): number => {
  const {
    phraseTimelineSec,
    activeMeasureNumber,
    measureDurationSec,
    countInDurationSec,
  } = input;
  if (phraseTimelineSec < 0) {
    return computeOsmdCountInPlayheadProgress(phraseTimelineSec, countInDurationSec);
  }
  const safeMeasureDurationSec = Math.max(1e-6, measureDurationSec);
  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const timeInMeasure = phraseTimelineSec - (measureNumber - 1) * safeMeasureDurationSec;
  return Math.max(0, Math.min(1, timeInMeasure / safeMeasureDurationSec));
};

/** スクロールオフセットを反映した画面上の小節ハイライト矩形（小節更新時のみ再計算）。 */
export const computeOsmdActiveMeasureHighlight = (
  input: OsmdActiveMeasureHighlightInput,
): OsmdActiveMeasureHighlightResult => {
  const {
    activeMeasureNumber,
    measureBoundsByNumber,
    playheadPx,
    effectiveScale,
    scrollOffsetPx,
  } = input;

  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1];
  if (!bounds) {
    return { leftPx: playheadPx, widthPx: 0, visible: false };
  }

  const measureWidth = bounds.right - bounds.left;
  if (!Number.isFinite(measureWidth) || measureWidth <= 0) {
    return { leftPx: playheadPx, widthPx: 0, visible: false };
  }

  return {
    leftPx: bounds.left * effectiveScale - scrollOffsetPx,
    widthPx: measureWidth * effectiveScale,
    visible: true,
  };
};

/** 1 小節フィット時、現在小節がビューポート幅に収まるよう cssScale を縮小した実効スケール。 */
export const computeOsmdEffectiveScaleForMeasure = (input: {
  cssScale: number;
  bounds: OsmdMeasureBounds | undefined;
  viewportWidth: number;
  fitActiveMeasureWidth: boolean;
  minFitScale?: number;
}): number => {
  const {
    cssScale,
    bounds,
    viewportWidth,
    fitActiveMeasureWidth,
    minFitScale = OSMD_PRECISION_MIN_FIT_SCALE,
  } = input;
  if (!fitActiveMeasureWidth || !bounds) {
    return cssScale;
  }
  const measureWidth = bounds.right - bounds.left;
  if (!Number.isFinite(measureWidth) || measureWidth <= 0 || cssScale <= 0 || viewportWidth <= 0) {
    return cssScale;
  }
  const fitScale = viewportWidth / (measureWidth * cssScale);
  const clampedFit = Math.min(1, Math.max(minFitScale, fitScale));
  return cssScale * clampedFit;
};
