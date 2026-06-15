import { isIOSWebView } from '@/utils/iosbridge';

/**
 * iOS WebKit では shadowBlur が極端に重い。
 * iOS では一律 0 に固定する。
 */
export const applyIOSCanvasOptimizations = (ctx: CanvasRenderingContext2D): void => {
  if (!isIOSWebView()) return;
  try {
    Object.defineProperty(ctx, 'shadowBlur', {
      configurable: true,
      get: () => 0,
      set: () => { /* noop */ },
    });
  } catch { /* ignore */ }
};

/**
 * iOS WebView では DPR を 1.5 上限としてダウンサンプリングする。
 */
export const getEffectiveCanvasDpr = (): number => {
  const raw = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  if (isIOSWebView()) return Math.min(raw, 1.5);
  return raw;
};
