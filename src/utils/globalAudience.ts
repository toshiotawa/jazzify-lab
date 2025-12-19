import { getWindow } from '@/platform';
import { STORAGE_KEY_GEO_COUNTRY, STORAGE_KEY_SIGNUP_COUNTRY } from '@/constants/storageKeys';

type MembershipRank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | 'black';

const GLOBAL_SUBDOMAIN_HINTS = new Set(['en', 'global', 'intl', 'world']);
const GLOBAL_LANG_PARAM = 'lang';
const LOCALE_EN = 'en';
const LOCALE_JA = 'ja';

const isBrowserEnvironment = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeHostname = (hostname: string | null | undefined): string => {
  if (!hostname) return '';
  return hostname.trim().toLowerCase();
};

const resolveQueryLocale = (search: string): 'en' | 'ja' | null => {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const lang = params.get(GLOBAL_LANG_PARAM)?.toLowerCase();
  if (lang === LOCALE_EN) return LOCALE_EN;
  if (lang === LOCALE_JA) return LOCALE_JA;
  return null;
};

const resolveSubdomainLocale = (hostname: string): 'en' | 'ja' | null => {
  const segments = hostname.split('.');
  if (segments.length === 0) return null;
  const [firstSegment] = segments;
  if (GLOBAL_SUBDOMAIN_HINTS.has(firstSegment)) {
    return LOCALE_EN;
  }
  return null;
};

const resolveTopLevelLocale = (hostname: string): 'en' | 'ja' | null => {
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

const isNonJapanCountry = (value: string | null | undefined): boolean => {
  const normalized = normalizeCountry(value);
  if (!normalized) {
    return false;
  }
  if (normalized === 'JP' || normalized === 'JPN' || normalized === 'JAPAN') {
    return false;
  }
  return true;
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

export const detectPreferredLocale = (): 'en' | 'ja' => {
  if (!isBrowserEnvironment()) {
    return LOCALE_JA;
  }

  let hostname = '';
  let search = '';
  try {
    const platformWindow = getWindow();
    hostname = normalizeHostname(platformWindow.location.hostname);
    search = platformWindow.location.search;
  } catch {
    hostname = normalizeHostname(window.location?.hostname);
    search = window.location?.search ?? '';
  }

  const queryLocale = resolveQueryLocale(search);
  if (queryLocale) return queryLocale;

  const subdomainLocale = resolveSubdomainLocale(hostname);
  if (subdomainLocale) return subdomainLocale;

  const tldLocale = resolveTopLevelLocale(hostname);
  if (tldLocale) return tldLocale;

  return LOCALE_JA;
};

export interface AudienceContext {
  rank?: MembershipRank | null;
  country?: string | null;
  localeOverride?: 'en' | 'ja' | null;
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
  const {
    rank,
    country,
    localeOverride,
    geoCountryHint,
    signupCountryHint,
  } = context;

  if (localeOverride === LOCALE_EN) {
    return true;
  }
  if (localeOverride === LOCALE_JA) {
    return false;
  }

  if (isStandardGlobalRank(rank)) {
    return true;
  }

  if (isNonJapanCountry(country)) {
    return true;
  }

  if (isNonJapanCountry(signupCountryHint)) {
    return true;
  }

  if (isNonJapanCountry(geoCountryHint)) {
    return true;
  }

  if (isNonJapanCountry(getStoredSignupCountry())) {
    return true;
  }

  if (isNonJapanCountry(getStoredGeoCountry())) {
    return true;
  }

  return detectPreferredLocale() === LOCALE_EN;
};

export const resolveAudienceLocale = (input?: ShouldUseEnglishCopyInput): 'en' | 'ja' => (
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
  rank: MembershipRank | null | undefined
): string => {
  if (shouldUseEnglishCopy(rank) && stage.name_en) {
    return stage.name_en;
  }
  return stage.name;
};

export const getLocalizedFantasyStageDescription = (
  stage: {
    description: string;
    description_en?: string | null;
  },
  rank: MembershipRank | null | undefined
): string => {
  if (shouldUseEnglishCopy(rank) && stage.description_en) {
    return stage.description_en;
  }
  return stage.description;
};

