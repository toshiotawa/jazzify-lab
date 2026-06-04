import { isIOSWebView } from '@/utils/iosbridge';

/**
 * Retina 向け Canvas バッファ倍率。iOS WebView では描画負荷のため 1.5 を上限とする。
 */
export const getEffectiveCanvasDpr = (): number => {
  const raw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  if (isIOSWebView()) return Math.min(raw, 1.5);
  return raw;
};
