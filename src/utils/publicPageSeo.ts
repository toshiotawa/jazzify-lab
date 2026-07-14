export const JA_SITE_ORIGIN = 'https://jazzify.jp';
export const EN_SITE_ORIGIN = 'https://en.jazzify.jp';
export const DEFAULT_OG_IMAGE_PATH = '/newLP/hero-poster.webp';

export interface PublicPageSeoMeta {
  title: string;
  description: string;
}

export interface PublicPageSeoUrls {
  canonical: string;
  jaUrl: string;
  enUrl: string;
  ogLocale: 'ja_JP' | 'en_US';
  ogLocaleAlternate: 'ja_JP' | 'en_US';
  ogImage: string;
}

const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === '/') {
    return '/';
  }
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const buildPublicPageSeoUrls = (
  pathname: string,
  siteOrigin: string,
): PublicPageSeoUrls => {
  const normalizedPath = normalizePathname(pathname);
  const isEnglishHost = siteOrigin === EN_SITE_ORIGIN;
  const canonicalOrigin = isEnglishHost ? EN_SITE_ORIGIN : JA_SITE_ORIGIN;

  return {
    canonical: `${canonicalOrigin}${normalizedPath}`,
    jaUrl: `${JA_SITE_ORIGIN}${normalizedPath}`,
    enUrl: `${EN_SITE_ORIGIN}${normalizedPath}`,
    ogLocale: isEnglishHost ? 'en_US' : 'ja_JP',
    ogLocaleAlternate: isEnglishHost ? 'ja_JP' : 'en_US',
    ogImage: `${canonicalOrigin}${DEFAULT_OG_IMAGE_PATH}`,
  };
};
