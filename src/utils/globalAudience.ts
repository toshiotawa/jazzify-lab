import { getWindow } from '@/platform';
import {
  STORAGE_KEY_GEO_COUNTRY,
  STORAGE_KEY_PREFERRED_LOCALE,
  STORAGE_KEY_SIGNUP_COUNTRY,
} from '@/constants/storageKeys';

type MembershipRank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | 'black';

const GLOBAL_SUBDOMAIN_HINTS = new Set(['en', 'global', 'intl', 'world']);
const GLOBAL_LANG_PARAM = 'lang';
const LOCALE_EN = 'en';
const LOCALE_JA = 'ja';
type AppLocale = 'en' | 'ja';

const isBrowserEnvironment = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeHostname = (hostname: string | null | undefined): string => {
  if (!hostname) return '';
  return hostname.trim().toLowerCase();
};

const normalizeLocale = (value: string | null | undefined): AppLocale | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === LOCALE_EN || normalized.startsWith(`${LOCALE_EN}-`)) return LOCALE_EN;
  if (normalized === LOCALE_JA || normalized.startsWith(`${LOCALE_JA}-`)) return LOCALE_JA;
  return null;
};

const resolveQueryLocale = (search: string): AppLocale | null => {
  if (!search) return null;
  const params = new URLSearchParams(search);
  return normalizeLocale(params.get(GLOBAL_LANG_PARAM));
};

/**
 * ハッシュ内のクエリパラメータからロケールを解決する
 * 例: #fantasy?lang=en → 'en'
 */
const resolveHashLocale = (hash: string): AppLocale | null => {
  if (!hash) return null;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;
  const queryString = hash.slice(queryIndex + 1);
  return resolveQueryLocale(queryString);
};

const resolveSubdomainLocale = (hostname: string): AppLocale | null => {
  const segments = hostname.split('.');
  if (segments.length === 0) return null;
  const [firstSegment] = segments;
  if (GLOBAL_SUBDOMAIN_HINTS.has(firstSegment)) {
    return LOCALE_EN;
  }
  return null;
};

const resolveTopLevelLocale = (hostname: string): AppLocale | null => {
  if (!hostname) return null;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  if (hostname.endsWith('.jp')) {
    return LOCALE_JA;
  }
  const endsWithGlobal = ['.com', '.net', '.org', '.io'].some(tld => hostname.endsWith(tld));
  if (endsWithGlobal) {
    return LOCALE_EN;
  }
  return null;
};

export const isStandardGlobalRank = (rank: MembershipRank | null | undefined): boolean => rank === 'standard_global';

const normalizeCountry = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
};

const safeReadLocalStorage = (key: string): string | null => {
  try {
    const platformWindow = getWindow();
    return platformWindow?.localStorage?.getItem(key) ?? null;
  } catch {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      return null;
    }
  }
  return null;
};

const getStoredSignupCountry = (): string | null => normalizeCountry(safeReadLocalStorage(STORAGE_KEY_SIGNUP_COUNTRY));
const getStoredGeoCountry = (): string | null => normalizeCountry(safeReadLocalStorage(STORAGE_KEY_GEO_COUNTRY));
export const getStoredPreferredLocale = (): AppLocale | null => normalizeLocale(
  safeReadLocalStorage(STORAGE_KEY_PREFERRED_LOCALE),
);

export const persistPreferredLocale = (locale: AppLocale | null): void => {
  try {
    const platformWindow = getWindow();
    if (!locale) {
      platformWindow?.localStorage?.removeItem(STORAGE_KEY_PREFERRED_LOCALE);
    } else {
      platformWindow?.localStorage?.setItem(STORAGE_KEY_PREFERRED_LOCALE, locale);
    }
  } catch {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (!locale) {
          window.localStorage.removeItem(STORAGE_KEY_PREFERRED_LOCALE);
        } else {
          window.localStorage.setItem(STORAGE_KEY_PREFERRED_LOCALE, locale);
        }
      }
    } catch {
      // ignore storage errors
    }
  }
};

export const detectBrowserLocale = (): AppLocale | null => {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const platformWindow = getWindow();
    const navigatorLanguages = platformWindow?.navigator?.languages;
    if (Array.isArray(navigatorLanguages)) {
      for (const locale of navigatorLanguages) {
        const normalized = normalizeLocale(locale);
        if (normalized) return normalized;
      }
    }
    return normalizeLocale(platformWindow?.navigator?.language);
  } catch {
    if (typeof navigator !== 'undefined') {
      if (Array.isArray(navigator.languages)) {
        for (const locale of navigator.languages) {
          const normalized = normalizeLocale(locale);
          if (normalized) return normalized;
        }
      }
      return normalizeLocale(navigator.language);
    }
  }

  return null;
};

export const detectPreferredLocale = (): AppLocale => {
  if (!isBrowserEnvironment()) {
    return LOCALE_JA;
  }

  let hostname = '';
  let search = '';
  let hash = '';
  try {
    const platformWindow = getWindow();
    hostname = normalizeHostname(platformWindow.location.hostname);
    search = platformWindow.location.search;
    hash = platformWindow.location.hash;
  } catch {
    hostname = normalizeHostname(window.location?.hostname);
    search = window.location?.search ?? '';
    hash = window.location?.hash ?? '';
  }

  const storedLocale = getStoredPreferredLocale();
  if (storedLocale) return storedLocale;

  // 優先順位1: 通常のクエリパラメータ (?lang=en)
  const queryLocale = resolveQueryLocale(search);
  if (queryLocale) return queryLocale;

  // 優先順位2: ハッシュ内のクエリパラメータ (#fantasy?lang=en)
  const hashLocale = resolveHashLocale(hash);
  if (hashLocale) return hashLocale;

  // 優先順位3: サブドメイン (en.jazzify.jp)
  const subdomainLocale = resolveSubdomainLocale(hostname);
  if (subdomainLocale) return subdomainLocale;

  // 優先順位4: ブラウザ言語設定
  const browserLocale = detectBrowserLocale();
  if (browserLocale) return browserLocale;

  // 優先順位5: TLD (.jp → ja, .com → en)
  const tldLocale = resolveTopLevelLocale(hostname);
  if (tldLocale) return tldLocale;

  return LOCALE_JA;
};

export interface AudienceContext {
  rank?: MembershipRank | null;
  country?: string | null;
  localeOverride?: AppLocale | null;
  preferredLocale?: AppLocale | null;
  geoCountryHint?: string | null;
  signupCountryHint?: string | null;
}

type ShouldUseEnglishCopyInput = AudienceContext | MembershipRank | null | undefined;

const normalizeInputToContext = (input?: ShouldUseEnglishCopyInput): AudienceContext | undefined => {
  if (input === undefined) {
    return undefined;
  }
  if (typeof input === 'string' || input === null) {
    return { rank: input ?? undefined };
  }
  return input;
};

export const shouldUseEnglishCopy = (input?: ShouldUseEnglishCopyInput): boolean => {
  const context = normalizeInputToContext(input) ?? {};
  const { localeOverride, preferredLocale } = context;

  // Debug log in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Only log once per session or use a distinct marker to avoid spam
    // console.debug('shouldUseEnglishCopy check:', { context, storedGeo: getStoredGeoCountry(), storedSignup: getStoredSignupCountry() });
  }

  if (localeOverride === LOCALE_EN) {
    return true;
  }
  if (localeOverride === LOCALE_JA) {
    return false;
  }

  if (preferredLocale === LOCALE_EN) {
    return true;
  }
  if (preferredLocale === LOCALE_JA) {
    return false;
  }

  return detectPreferredLocale() === LOCALE_EN;
};

export const resolveAudienceLocale = (input?: ShouldUseEnglishCopyInput): AppLocale => (
  shouldUseEnglishCopy(input) ? LOCALE_EN : LOCALE_JA
);

export const resolveAudienceCountryHint = (): {
  signupCountry: string | null;
  geoCountry: string | null;
} => ({
  signupCountry: getStoredSignupCountry(),
  geoCountry: getStoredGeoCountry(),
});

export const shouldHideFantasyStory = (rank: MembershipRank | null | undefined): boolean => shouldUseEnglishCopy(rank);

export const isGlobalAudience = (rank: MembershipRank | null | undefined): boolean => shouldUseEnglishCopy(rank);

export const getLocalizedFantasyStageName = (
  stage: {
    name: string;
    name_en?: string | null;
  },
  rankOrContext: MembershipRank | null | undefined | AudienceContext
): string => {
  if (shouldUseEnglishCopy(rankOrContext) && stage.name_en) {
    return stage.name_en;
  }
  return stage.name;
};

export const getLocalizedFantasyStageDescription = (
  stage: {
    description: string;
    description_en?: string | null;
  },
  rankOrContext: MembershipRank | null | undefined | AudienceContext
): string => {
  if (shouldUseEnglishCopy(rankOrContext) && stage.description_en) {
    return stage.description_en;
  }
  return stage.description;
};

