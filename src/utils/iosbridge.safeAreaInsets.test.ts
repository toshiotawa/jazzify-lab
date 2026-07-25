import { describe, it, expect, afterEach, vi } from 'vitest';
import { getNativeSafeAreaInsets, iosSafeAreaInsetTopCss } from './iosbridge';

describe('iosSafeAreaInsetTopCss', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to env() when native insets are absent', () => {
    vi.stubGlobal('window', {
      ...window,
      __NATIVE_SAFE_AREA_INSETS__: undefined,
    });
    expect(iosSafeAreaInsetTopCss()).toBe('env(safe-area-inset-top)');
    expect(iosSafeAreaInsetTopCss('48px')).toBe('48px');
  });

  it('returns px value when native insets are injected', () => {
    vi.stubGlobal('window', {
      ...window,
      __NATIVE_SAFE_AREA_INSETS__: { top: 59, right: 0, bottom: 34, left: 0 },
    });
    expect(iosSafeAreaInsetTopCss()).toBe('59px');
    expect(getNativeSafeAreaInsets()).toEqual({ top: 59, right: 0, bottom: 34, left: 0 });
  });
});
