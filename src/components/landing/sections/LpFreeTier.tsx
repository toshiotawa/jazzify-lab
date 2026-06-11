import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const CheckIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
    style={{ color: 'var(--lp-gold-deep)' }}
  >
    <path
      d="M4 10l4 4 8-8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LpFreeTier: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-12 sm:py-14 scroll-mt-20">
      <div className="lp-container">
        <h2
          className="lp-section-title text-xl sm:text-2xl text-center mb-8"
          data-animate="from-behind"
        >
          {copy.freeTier.heading}
        </h2>

        <div className="lp-card p-8 sm:p-10 text-center max-w-xl mx-auto">
          <div
            className="space-y-3"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.freeTier.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <ul className="mt-6 space-y-3 text-left max-w-md mx-auto">
            {copy.freeTier.checks.map((check) => (
              <li key={check} className="flex items-center gap-3">
                <CheckIcon />
                <span className="font-semibold">{check}</span>
              </li>
            ))}
          </ul>

          <Link to="/signup" className="lp-btn-gold px-10 py-4 text-lg mt-8">
            {copy.freeTier.cta}
          </Link>

          <p className="mt-3 text-xs" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.freeTier.note}
          </p>
        </div>
      </div>
    </section>
  );
};
