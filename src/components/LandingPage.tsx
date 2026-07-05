import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getWindow } from '@/platform';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { LpHeader } from '@/components/landing/sections/LpHeader';
import { LpHero } from '@/components/landing/sections/LpHero';
import { LpDemoPlaceholder } from '@/components/landing/sections/LpDemoPlaceholder';
import { LpPain } from '@/components/landing/sections/LpPain';
import { LpSolution } from '@/components/landing/sections/LpSolution';
import { LpMainQuest } from '@/components/landing/sections/LpMainQuest';
import { LpCourses } from '@/components/landing/sections/LpCourses';
import { LpModes } from '@/components/landing/sections/LpModes';
import { LpPlatforms } from '@/components/landing/sections/LpPlatforms';
import { LpSkills } from '@/components/landing/sections/LpSkills';
import { LpRequirements } from '@/components/landing/sections/LpRequirements';
import { LpDeveloper } from '@/components/landing/sections/LpDeveloper';
import { LpFreeTier } from '@/components/landing/sections/LpFreeTier';
import { LpPricing } from '@/components/landing/sections/LpPricing';
import { LpFaq } from '@/components/landing/sections/LpFaq';
import { LpFinalCta } from '@/components/landing/sections/LpFinalCta';
import { LpFooter } from '@/components/landing/sections/LpFooter';

import '@/landing.css';

const DemoUnavailable: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  return (
    <section className="py-16">
      <div className="lp-container">
        <div className="lp-card p-8 text-center" style={{ color: 'var(--lp-ink-muted)' }}>
          {copy.demo.lazyPlaceholder}
        </div>
      </div>
    </section>
  );
};

const LpDemo = React.lazy(
  () => import('@/components/landing/sections/LpDemo')
    .then((m) => ({ default: m.LpDemo }))
    .catch(() => ({ default: DemoUnavailable })),
);

const LandingPage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderDemo, setShouldRenderDemo] = useState(false);
  const isEnglishLanding = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglishLanding);

  const activateDemo = useCallback(() => {
    setShouldRenderDemo(true);
  }, []);

  useEffect(() => {
    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    const observed = new WeakSet<Element>();

    const animateObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
          }
        });
      },
      { root: scrollRoot, threshold: 0.05, rootMargin: '0px 0px -5% 0px' },
    );

    const scanAndObserve = () => {
      scrollRoot.querySelectorAll('[data-animate]').forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          animateObserver.observe(el);
        }
      });
    };

    scanAndObserve();

    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });
    mutationObserver.observe(scrollRoot, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      animateObserver.disconnect();
    };
  }, [shouldRenderDemo]);

  const siteOrigin = useMemo(() => {
    try {
      return getWindow().location.origin;
    } catch {
      return 'https://jazzify.jp';
    }
  }, []);

  const helmetOgLocale = isEnglishLanding ? 'en_US' : 'ja_JP';
  const helmetOgLocaleAlternate = isEnglishLanding ? 'ja_JP' : 'en_US';

  return (
    <div className="lp-root flex h-screen flex-col overflow-hidden">
      <Helmet>
        <title>{copy.seo.title}</title>
        <meta name="description" content={copy.seo.description} />
        <link rel="canonical" href={`${siteOrigin}/`} />
        <link rel="alternate" hrefLang="ja" href="https://jazzify.jp/" />
        <link rel="alternate" hrefLang="en" href="https://en.jazzify.jp/" />
        <link rel="alternate" hrefLang="x-default" href="https://jazzify.jp/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Jazzify" />
        <meta property="og:title" content={copy.seo.title} />
        <meta property="og:description" content={copy.seo.description} />
        <meta property="og:url" content={`${siteOrigin}/`} />
        <meta property="og:locale" content={helmetOgLocale} />
        <meta property="og:locale:alternate" content={helmetOgLocaleAlternate} />
        <meta property="og:image" content={`${siteOrigin}/newLP/hero-poster.webp`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={copy.seo.title} />
        <meta name="twitter:description" content={copy.seo.description} />
        <meta name="twitter:image" content={`${siteOrigin}/newLP/hero-poster.webp`} />
      </Helmet>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef} style={{ background: 'var(--lp-bg)' }}>
        <LpHeader />
        <LpHero />

        <div id="demo" className="scroll-mt-20 lp-dark" style={{ background: 'var(--lp-night-2)' }}>
          {shouldRenderDemo ? (
            <React.Suspense
              fallback={(
                <section className="py-20 text-center" style={{ color: 'var(--lp-ink-muted)' }}>
                  {copy.demo.loading}
                </section>
              )}
            >
              <LpDemo autoOpenOnMount />
            </React.Suspense>
          ) : (
            <LpDemoPlaceholder onActivate={activateDemo} />
          )}
        </div>

        <LpPain />
        <LpSolution />
        <LpMainQuest />
        <LpCourses />
        <LpModes />
        <LpPlatforms />
        <LpDeveloper />
        <LpSkills />
        <LpRequirements />
        <LpFreeTier />
        <LpPricing />
        <LpFaq />
        <LpFinalCta />
        <LpFooter />
      </div>
    </div>
  );
};

export default LandingPage;
