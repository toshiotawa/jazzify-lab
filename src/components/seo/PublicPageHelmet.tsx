import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getWindow } from '@/platform';
import { buildPublicPageSeoUrls, type PublicPageSeoMeta } from '@/utils/publicPageSeo';

interface PublicPageHelmetProps extends PublicPageSeoMeta {
  htmlLang?: 'ja' | 'en';
}

const PublicPageHelmet: React.FC<PublicPageHelmetProps> = ({
  title,
  description,
  htmlLang,
}) => {
  const { pathname } = useLocation();
  const seoUrls = useMemo(() => {
    let siteOrigin = 'https://jazzify.jp';
    try {
      siteOrigin = getWindow().location.origin;
    } catch {
      /* keep default */
    }
    return buildPublicPageSeoUrls(pathname, siteOrigin);
  }, [pathname]);

  return (
    <Helmet htmlAttributes={htmlLang ? { lang: htmlLang } : undefined}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={seoUrls.canonical} />
      <link rel="alternate" hrefLang="ja" href={seoUrls.jaUrl} />
      <link rel="alternate" hrefLang="en" href={seoUrls.enUrl} />
      <link rel="alternate" hrefLang="x-default" href={seoUrls.jaUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Jazzify" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={seoUrls.canonical} />
      <meta property="og:locale" content={seoUrls.ogLocale} />
      <meta property="og:locale:alternate" content={seoUrls.ogLocaleAlternate} />
      <meta property="og:image" content={seoUrls.ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={seoUrls.ogImage} />
    </Helmet>
  );
};

export default PublicPageHelmet;
