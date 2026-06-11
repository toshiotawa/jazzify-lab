import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getWindow } from '@/platform';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { LpHeader } from '@/components/landing/sections/LpHeader';
import { LpHero } from '@/components/landing/sections/LpHero';
import { LpPain } from '@/components/landing/sections/LpPain';
import { LpSolution } from '@/components/landing/sections/LpSolution';
import { LpMainQuest } from '@/components/landing/sections/LpMainQuest';
import { LpCourses } from '@/components/landing/sections/LpCourses';
import { LpModes } from '@/components/landing/sections/LpModes';
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

// チャンク読み込み失敗（オフライン・デプロイ直後等）でLP全体が落ちないようフォールバックする
const LpDemo = React.lazy(
  () => import('@/components/landing/sections/LpDemo')
    .then((m) => ({ default: m.LpDemo }))
    .catch(() => ({ default: DemoUnavailable })),
);

const LandingPage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const demoSentinelRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderDemo, setShouldRenderDemo] = useState(false);
  const isEnglishLanding = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglishLanding);

  useEffect(() => {
    const root = scrollRef.current;
    const target = demoSentinelRef.current;
    if (!root || !target || shouldRenderDemo) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldRenderDemo(true);
        observer.disconnect();
      }
    }, { root, threshold: 0, rootMargin: '600px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldRenderDemo]);

  // data-animate 要素に is-inview を付与（スクロール連動アニメーション）
  // LpDemo は lazy + Suspense のため、初回 effect 時点では DOM に無いことがある。
  // MutationObserver で後から挿入された [data-animate] も登録しないと opacity:0 のまま残る。
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
      { root: scrollRoot, threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
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

        <div id="demo" className="scroll-mt-20">
          <div ref={demoSentinelRef} />
          {shouldRenderDemo ? (
            <React.Suspense
              fallback={(
                <section className="py-20 text-center" style={{ color: 'var(--lp-ink-muted)' }}>
                  {copy.demo.loading}
                </section>
              )}
            >
              <LpDemo />
            </React.Suspense>
          ) : (
            <section className="py-16">
              <div className="lp-container">
                <div className="lp-card p-8 text-center" style={{ color: 'var(--lp-ink-muted)' }}>
                  {copy.demo.lazyPlaceholder}
                </div>
              </div>
            </section>
          )}
        </div>

        <LpPain />
        <LpSolution />
        <LpMainQuest />
        <LpCourses />
        <LpModes />
        <LpSkills />
        <LpRequirements />
        <LpDeveloper />
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
