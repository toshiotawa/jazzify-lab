export const computeCodeRunKeyboardHeight = (viewportHeight: number): number =>
  Math.min(190, Math.max(150, viewportHeight * 0.22));

export type CodeRunPixelScaleMode = 'fit' | 'cover';

/** コンテナに収まるピクセルアート向け表示倍率（拡大は整数倍、縮小は 0.5 刻み）。 */
export const computeCodeRunPixelScale = (
  containerW: number,
  containerH: number,
  viewW: number,
  viewH: number,
  mode: CodeRunPixelScaleMode = 'fit',
): number => {
  if (containerW <= 0 || containerH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  const fitScale = Math.min(containerW / viewW, containerH / viewH);
  const coverScale = Math.max(containerW / viewW, containerH / viewH);
  const raw = mode === 'cover' ? coverScale : fitScale;
  if (raw >= 1) return Math.max(1, Math.floor(raw));
  return Math.max(0.25, Math.floor(raw * 2) / 2);
};

export const isCodeRunMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
};
