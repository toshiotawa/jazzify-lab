import { isIOSWebView } from '@/utils/iosbridge';

type MidiWarningTarget = 'mac-safari' | 'ios-browser' | null;

export const detectMidiWarningTarget = (): MidiWarningTarget => {
  if (typeof navigator === 'undefined') return null;

  const ua = navigator.userAgent;

  if (isIOSWebView()) return null;

  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios-browser';

  const isMac = /Macintosh|Mac OS X/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Opera|Firefox/.test(ua);
  if (isMac && isSafari) return 'mac-safari';

  return null;
};
