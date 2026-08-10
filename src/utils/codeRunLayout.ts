export const computeCodeRunKeyboardHeight = (viewportHeight: number): number =>
  Math.min(190, Math.max(150, viewportHeight * 0.22));

export type CodeRunPixelScaleMode = 'fit' | 'cover';

/** 倍率の量子化ステップ。細かすぎるとリサイズ毎に再描画が走るため 1/16 に丸める。 */
const PIXEL_SCALE_STEP = 16;
const MIN_PIXEL_SCALE = 0.25;

/** コンテナに収まるピクセルアート向け表示倍率（1/16 刻み）。 */
export const computeCodeRunPixelScale = (
  containerW: number,
  containerH: number,
  viewW: number,
  viewH: number,
  mode: CodeRunPixelScaleMode = 'fit',
): number => {
  if (containerW <= 0 || containerH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  const widthScale = containerW / viewW;
  const heightScale = containerH / viewH;
  const raw = mode === 'cover' ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale);
  return Math.max(MIN_PIXEL_SCALE, Math.floor(raw * PIXEL_SCALE_STEP) / PIXEL_SCALE_STEP);
};

export const isCodeRunMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
};
