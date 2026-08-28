export const computeCodeRunKeyboardHeight = (viewportHeight: number): number =>
  Math.min(96, Math.max(76, viewportHeight * 0.11));

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
  scaleFactor = 1,
): number => {
  if (containerW <= 0 || containerH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  const widthScale = containerW / viewW;
  const heightScale = containerH / viewH;
  const raw = mode === 'cover' ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale);
  const scaled = raw * scaleFactor;
  return Math.max(MIN_PIXEL_SCALE, Math.floor(scaled * PIXEL_SCALE_STEP) / PIXEL_SCALE_STEP);
};

export const CODE_RUN_MOBILE_SCALE_FACTOR = 0.8;

/**
 * cover 表示ではビューの左右（または上下）が切り取られるため、エンジンのカメラ値のままだと
 * 見えている範囲の中でプレイヤーが端に寄ってしまう。実際に見えているサイズを基準に寄せ直す。
 * 全体が見えている（fit）ときはエンジン値をそのまま使う。
 */
export const computeCodeRunVisibleCameraAxis = (
  engineCamera: number,
  playerCenter: number,
  visibleSize: number,
  viewSize: number,
  worldSize: number,
): number => {
  if (visibleSize <= 0 || visibleSize >= viewSize) return engineCamera;
  const maxLeading = Math.max(0, worldSize - visibleSize);
  const leading = Math.min(maxLeading, Math.max(0, playerCenter - visibleSize / 2));
  return leading - (viewSize - visibleSize) / 2;
};

export const isCodeRunMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
};
