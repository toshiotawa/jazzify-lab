import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY_PREFERRED_LOCALE } from '@/constants/storageKeys';

const mockLocation = (overrides: Partial<Location>): void => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      hostname: 'jazzify.jp',
      search: '',
      hash: '',
      origin: 'https://jazzify.jp',
      pathname: '/',
      ...overrides,
    },
  });
};

const mockNavigatorLanguages = (languages: string[]): void => {
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages,
  });
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: languages[0] ?? 'en-US',
  });
};

describe('globalAudience locale detection', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
    mockLocation({});
    mockNavigatorLanguages(['en-US']);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('?lang=en beats stored preferred_locale ja', async () => {
    window.localStorage.setItem(STORAGE_KEY_PREFERRED_LOCALE, 'ja');
    mockLocation({ search: '?lang=en' });

    const { detectPreferredLocale, shouldUseEnglishCopy } = await import('@/utils/globalAudience');
    expect(detectPreferredLocale()).toBe('en');
    expect(shouldUseEnglishCopy()).toBe(true);
  });

  it('en.jazzify.jp beats stored preferred_locale ja', async () => {
    window.localStorage.setItem(STORAGE_KEY_PREFERRED_LOCALE, 'ja');
    mockLocation({ hostname: 'en.jazzify.jp', origin: 'https://en.jazzify.jp' });

    const { detectPreferredLocale } = await import('@/utils/globalAudience');
    expect(detectPreferredLocale()).toBe('en');
  });

  it('?lang=ja beats en subdomain', async () => {
    mockLocation({
      hostname: 'en.jazzify.jp',
      search: '?lang=ja',
      origin: 'https://en.jazzify.jp',
    });

    const { detectPreferredLocale } = await import('@/utils/globalAudience');
    expect(detectPreferredLocale()).toBe('ja');
  });

  it('French browser on jazzify.jp defaults to English', async () => {
    mockNavigatorLanguages(['fr-FR']);
    mockLocation({ hostname: 'jazzify.jp' });

    const { detectPreferredLocale, detectBrowserLocale } = await import('@/utils/globalAudience');
    expect(detectBrowserLocale()).toBe('en');
    expect(detectPreferredLocale()).toBe('en');
  });

  it('Japanese browser on jazzify.jp stays Japanese without URL override', async () => {
    mockNavigatorLanguages(['ja-JP']);
    mockLocation({ hostname: 'jazzify.jp' });

    const { detectPreferredLocale } = await import('@/utils/globalAudience');
    expect(detectPreferredLocale()).toBe('ja');
  });

  it('syncPreferredLocaleFromUrl persists URL locale', async () => {
    mockLocation({ search: '?lang=en' });

    const { syncPreferredLocaleFromUrl, getStoredPreferredLocale } = await import('@/utils/globalAudience');
    syncPreferredLocaleFromUrl();
    expect(getStoredPreferredLocale()).toBe('en');
  });

  it('resolveUrlLocaleOverride reads hash query lang', async () => {
    mockLocation({ hash: '#fantasy?lang=en' });

    const { resolveUrlLocaleOverride } = await import('@/utils/globalAudience');
    expect(resolveUrlLocaleOverride()).toBe('en');
  });
});
