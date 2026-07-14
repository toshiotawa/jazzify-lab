import { describe, expect, it } from 'vitest';
import { buildPublicPageSeoUrls, EN_SITE_ORIGIN, JA_SITE_ORIGIN } from '@/utils/publicPageSeo';

describe('buildPublicPageSeoUrls', () => {
  it('en ホストでは canonical が en ドメインになる', () => {
    const urls = buildPublicPageSeoUrls('/signup', EN_SITE_ORIGIN);
    expect(urls.canonical).toBe('https://en.jazzify.jp/signup');
    expect(urls.jaUrl).toBe('https://jazzify.jp/signup');
    expect(urls.enUrl).toBe('https://en.jazzify.jp/signup');
    expect(urls.ogLocale).toBe('en_US');
  });

  it('ja ホストでは canonical が ja ドメインになる', () => {
    const urls = buildPublicPageSeoUrls('/terms', JA_SITE_ORIGIN);
    expect(urls.canonical).toBe('https://jazzify.jp/terms');
    expect(urls.ogLocale).toBe('ja_JP');
  });

  it('ルートパスを正規化する', () => {
    const urls = buildPublicPageSeoUrls('/', EN_SITE_ORIGIN);
    expect(urls.canonical).toBe('https://en.jazzify.jp/');
  });
});
