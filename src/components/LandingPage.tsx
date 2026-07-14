import React, { useCallback, useEffect, useRef, useState } from 'react';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getLandingCopy } from '@/components/landing/landingCopy';
import PublicPageHelmet from '@/components/seo/PublicPageHelmet';
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

type LpDemoComponent = React.ComponentType<{ autoOpenOnMount?: boolean }>;

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

const LandingPage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderDemo, setShouldRenderDemo] = useState(false);
  const [LpDemoComponent, setLpDemoComponent] = useState<LpDemoComponent | null>(null);
  const isEnglishLanding = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglishLanding);

  const activateDemo = useCallback(() => {
    setShouldRenderDemo(true);
    if (LpDemoComponent) {
      return;
    }
    void import(/* @vite-ignore */ '@/components/landing/sections/LpDemo')
      .then((module) => {
        setLpDemoComponent(() => module.LpDemo);
      })
      .catch(() => {
        setLpDemoComponent(() => DemoUnavailable);
      });
  }, [LpDemoComponent]);

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

  return (
    <div className="lp-root flex h-screen flex-col overflow-hidden">
      <PublicPageHelmet
        title={copy.seo.title}
        description={copy.seo.description}
        htmlLang={isEnglishLanding ? 'en' : 'ja'}
      />

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef} style={{ background: 'var(--lp-bg)' }}>
        <LpHeader />
        <LpHero />

        <div id="demo" className="scroll-mt-20 lp-dark" style={{ background: 'var(--lp-night-2)' }}>
          {shouldRenderDemo ? (
            LpDemoComponent ? (
              <LpDemoComponent autoOpenOnMount />
            ) : (
              <section className="py-20 text-center" style={{ color: 'var(--lp-ink-muted)' }}>
                {copy.demo.loading}
              </section>
            )
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
