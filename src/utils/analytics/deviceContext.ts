export type DeviceCategory = 'desktop' | 'mobile' | 'tablet';
export type DeviceOs = 'ios' | 'android' | 'windows' | 'macos' | 'other';
export type DeviceBrowser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'other';

export interface SignupDeviceContext {
  signup_device_category: DeviceCategory;
  signup_os: DeviceOs;
  signup_browser: DeviceBrowser;
}

const isIPad = (ua: string, maxTouchPoints: number): boolean =>
  /iPad/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);

export const resolveSignupDeviceContext = (
  userAgent = '',
  maxTouchPoints = 0,
): SignupDeviceContext => {
  const ua = userAgent;

  let signup_os: DeviceOs = 'other';
  if (/Android/i.test(ua)) {
    signup_os = 'android';
  } else if (/iPhone|iPod/i.test(ua) || isIPad(ua, maxTouchPoints)) {
    signup_os = 'ios';
  } else if (/Windows/i.test(ua)) {
    signup_os = 'windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    signup_os = 'macos';
  }

  let signup_device_category: DeviceCategory = 'desktop';
  if (isIPad(ua, maxTouchPoints) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    signup_device_category = 'tablet';
  } else if (/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
    signup_device_category = 'mobile';
  }

  let signup_browser: DeviceBrowser = 'other';
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox/i.test(ua);
  if (isSafari) {
    signup_browser = 'safari';
  } else if (/Edg/i.test(ua)) {
    signup_browser = 'edge';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    signup_browser = 'firefox';
  } else if (/Chrome|Chromium|CriOS/i.test(ua)) {
    signup_browser = 'chrome';
  }

  return { signup_device_category, signup_os, signup_browser };
};

export const resolveCurrentSignupDeviceContext = (): SignupDeviceContext => {
  if (typeof navigator === 'undefined') {
    return resolveSignupDeviceContext();
  }
  return resolveSignupDeviceContext(navigator.userAgent, navigator.maxTouchPoints);
};

export const getDeviceGaParams = (): Record<string, string> => {
  const ctx = resolveCurrentSignupDeviceContext();
  return {
    device_category: ctx.signup_device_category,
    device_os: ctx.signup_os,
    device_browser: ctx.signup_browser,
  };
};
