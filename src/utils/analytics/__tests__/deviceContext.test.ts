import { describe, expect, it } from 'vitest';

import { resolveSignupDeviceContext } from '@/utils/analytics/deviceContext';

describe('resolveSignupDeviceContext', () => {
  it('detects iPhone Safari as mobile/ios/safari', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(resolveSignupDeviceContext(ua, 5)).toEqual({
      signup_device_category: 'mobile',
      signup_os: 'ios',
      signup_browser: 'safari',
    });
  });

  it('detects iPad as tablet/ios/safari', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    expect(resolveSignupDeviceContext(ua, 5)).toEqual({
      signup_device_category: 'tablet',
      signup_os: 'ios',
      signup_browser: 'safari',
    });
  });

  it('detects desktop Chrome on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(resolveSignupDeviceContext(ua, 0)).toEqual({
      signup_device_category: 'desktop',
      signup_os: 'windows',
      signup_browser: 'chrome',
    });
  });

  it('detects Android mobile Chrome', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(resolveSignupDeviceContext(ua, 5)).toEqual({
      signup_device_category: 'mobile',
      signup_os: 'android',
      signup_browser: 'chrome',
    });
  });

  it('detects desktop Edge on macOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    expect(resolveSignupDeviceContext(ua, 0)).toEqual({
      signup_device_category: 'desktop',
      signup_os: 'macos',
      signup_browser: 'edge',
    });
  });
});
