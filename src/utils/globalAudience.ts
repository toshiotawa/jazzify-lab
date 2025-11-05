import { getWindow } from '@/platform';

type MembershipRank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum';

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

export const shouldUseEnglishCopy = (rank: MembershipRank | null | undefined): boolean => {
  if (isStandardGlobalRank(rank)) {
    return true;
  }
  return detectPreferredLocale() === LOCALE_EN;
};

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

