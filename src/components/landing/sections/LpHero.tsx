import React from 'react';
import { Link } from 'react-router-dom';
import { LpAppStoreButton } from '@/components/landing/LpAppStoreButton';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const scrollToDemo = (): void => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LpHero: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="lp-dark hero-bg pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="lp-container grid md:grid-cols-12 gap-12 md:gap-8 lg:gap-12 items-center">
        <div className="md:col-span-6 lg:col-span-5">
          <h1 className="lp-display-hero lp-hero-title" data-animate="from-behind">
            {copy.hero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <div className="mt-6 space-y-2 text-base sm:text-lg" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.hero.subtitle.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="lp-btn-gold px-8 py-4 text-lg"
              aria-label={copy.hero.demoCta}
              onClick={scrollToDemo}
            >
              {copy.hero.demoCta}
            </button>
            <LpAppStoreButton
              label={copy.hero.appStoreCta}
              ariaLabel={copy.footer.appStoreAria}
              size="md"
            />
            <Link to="/signup" className="lp-btn-outline px-8 py-4 text-lg">
              {copy.hero.signupCta}
            </Link>
          </div>
          <p className="mt-4 text-xs sm:text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.hero.note}
          </p>
        </div>

        <div className="md:col-span-6 lg:col-span-7">
          <div className="lp-shot-stage" data-animate="from-behind">
            <div className="lp-shot">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/newLP/hero-poster.webp"
                className="w-full h-auto block"
                aria-label={copy.hero.videoAlt}
              >
                <source src="/newLP/hero.webm" type="video/webm" />
                <source src="/newLP/hero.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="lp-shot-note absolute -bottom-3.5 left-5 sm:left-8">
              {copy.hero.videoBadge}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
