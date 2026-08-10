interface FullscreenCapableElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenCapableDocument extends Document {
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

export const isIphoneSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  return !('requestFullscreen' in document.documentElement);
};

export const canUseElementFullscreen = (): boolean => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as FullscreenCapableElement;
  return typeof el.requestFullscreen === 'function'
    || typeof el.webkitRequestFullscreen === 'function'
    || typeof el.msRequestFullscreen === 'function';
};

export const requestAppFullscreen = async (element: HTMLElement): Promise<boolean> => {
  const target = element as FullscreenCapableElement;
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return true;
    }
    if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
      return true;
    }
    if (target.msRequestFullscreen) {
      await target.msRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

export const exitAppFullscreen = async (): Promise<void> => {
  const doc = document as FullscreenCapableDocument;
  try {
    if (doc.fullscreenElement) {
      await doc.exitFullscreen?.();
    }
    await doc.webkitExitFullscreen?.();
    await doc.msExitFullscreen?.();
  } catch {
    /* noop */
  }
};

export const isAppFullscreenActive = (): boolean =>
  typeof document !== 'undefined' && Boolean(document.fullscreenElement);
