import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const scrollToDemo = (): void => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LpFinalCta: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="lp-dark lp-cta-night py-24 sm:py-32">
      <div className="lp-container">
        <h2
          className="lp-display-hero text-3xl sm:text-4xl md:text-5xl text-center"
          style={{ color: 'var(--lp-ink)' }}
          data-animate="from-behind"
        >
          {copy.finalCta.heading}
        </h2>

        <div
          className="max-w-2xl mx-auto text-center space-y-3 mt-8"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.finalCta.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <Link to="/signup" className="lp-btn-gold px-10 py-5 text-lg">
            {copy.finalCta.cta}
          </Link>
          <button
            type="button"
            className="lp-btn-outline px-8 py-4"
            aria-label={copy.hero.demoCta}
            onClick={scrollToDemo}
          >
            {copy.hero.demoCta}
          </button>
        </div>

        <p
          className="mt-4 text-xs sm:text-sm text-center"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.finalCta.note}
        </p>
      </div>
    </section>
  );
};
