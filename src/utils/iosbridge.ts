declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        gameCallback?: { postMessage: (msg: unknown) => void };
        midiRequest?: { postMessage: (msg: unknown) => void };
      };
    };
    __NATIVE_AUTH_TOKEN__?: string;
    onNativeMidiMessage?: (status: number, note: number, velocity: number) => void;
    onNativeMidiDevices?: (devices: Array<{ uniqueID: number; displayName: string; manufacturer: string }>) => void;
  }
}

export const isIOSWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('platform') === 'ios';
};

export const getIOSMode = (): string | null => {
  if (typeof window === 'undefined') return null;
  const search = window.location.search || '';
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?'))
    : '';
  const params = new URLSearchParams(search || hashQuery);
  return params.get('mode');
};

export const getIOSParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  const search = window.location.search || '';
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?'))
    : '';
  const params = new URLSearchParams(search || hashQuery);
  return params.get(key);
};

export const getNativeAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.__NATIVE_AUTH_TOKEN__ ?? null;
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
