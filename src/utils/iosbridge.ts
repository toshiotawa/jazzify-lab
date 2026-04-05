declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        gameCallback?: { postMessage: (msg: unknown) => void };
        midiRequest?: { postMessage: (msg: unknown) => void };
      };
    };
    __NATIVE_AUTH_TOKEN__?: string;
    /** iOS ネイティブから注入する Supabase リフレッシュトークン（WebView の setSession 用） */
    __NATIVE_REFRESH_TOKEN__?: string;
    onNativeMidiMessage?: (status: number, note: number, velocity: number) => void;
    onNativeMidiDevices?: (devices: Array<{ uniqueID: number; displayName: string; manufacturer: string }>) => void;
    onNativeMidiSelected?: (uniqueID: number) => void;
  }
}

const getHashParams = (): URLSearchParams => {
  const hash = window.location.hash;
  if (!hash.includes('?')) return new URLSearchParams();
  return new URLSearchParams(hash.slice(hash.indexOf('?')));
};

export const isIOSWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('platform') === 'ios') return true;
  if (getHashParams().get('platform') === 'ios') return true;
  try {
    if (window.webkit?.messageHandlers?.gameCallback) return true;
  } catch { /* ignore */ }
  return false;
};

export const getIOSMode = (): string | null => {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const searchMode = searchParams.get('mode');
  if (searchMode) return searchMode;
  return getHashParams().get('mode');
};

export const getIOSParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const searchVal = searchParams.get(key);
  if (searchVal) return searchVal;
  return getHashParams().get(key);
};

export const getNativeAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.__NATIVE_AUTH_TOKEN__ ?? null;
};

export const getNativeRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.__NATIVE_REFRESH_TOKEN__ ?? null;
};

export const sendGameCallback = (action: string, data?: Record<string, unknown>): void => {
  try {
    window.webkit?.messageHandlers?.gameCallback?.postMessage({ action, ...data });
  } catch {
    // not in native WebView
  }
};

export const requestNativeMIDIDevices = (): void => {
  try {
    window.webkit?.messageHandlers?.midiRequest?.postMessage({ action: 'listDevices' });
  } catch {
    // not in native WebView
  }
};

export const selectNativeMIDIDevice = (uniqueID: number): void => {
  try {
    window.webkit?.messageHandlers?.midiRequest?.postMessage({ action: 'selectDevice', uniqueID });
  } catch {
    // not in native WebView
  }
};
