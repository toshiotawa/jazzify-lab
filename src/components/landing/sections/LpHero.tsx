import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const scrollToDemo = (): void => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LpHero: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="hero-bg pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="lp-container grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1
            className="lp-display-hero text-3xl sm:text-4xl md:text-5xl"
            data-animate="from-behind"
          >
            {copy.hero.title}
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
            <Link to="/signup" className="lp-btn-outline px-8 py-4 text-lg">
              {copy.hero.signupCta}
            </Link>
          </div>
          <p className="mt-4 text-xs sm:text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.hero.note}
          </p>
        </div>

        <div className="lp-shot" data-animate="from-behind">
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
      </div>
    </section>
  );
};
