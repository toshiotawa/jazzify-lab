import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const CheckIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
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

const CrossIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
    style={{ color: 'var(--lp-ink-muted)' }}
  >
    <path
      d="M6 6l8 8M14 6l-8 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const LpFit: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-12 sm:py-20 scroll-mt-20" style={{ background: 'var(--lp-surface)' }}>
      <div className="lp-container max-w-4xl mx-auto">
        <h2
          className="lp-section-title text-2xl sm:text-3xl text-center mb-12"
          data-animate="from-behind"
        >
          {copy.fit.heading}
        </h2>

        <div className="grid md:grid-cols-2 gap-8" data-animate="alt-cards">
          <div className="lp-card p-8">
            <h3 className="lp-subtitle text-lg mb-6">{copy.fit.forYouHeading}</h3>
            <ul className="space-y-4">
              {copy.fit.forYouItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="lp-card-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-card p-8">
            <h3 className="lp-subtitle text-lg mb-6">{copy.fit.notForYouHeading}</h3>
            <ul className="space-y-4">
              {copy.fit.notForYouItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CrossIcon />
                  <span className="lp-card-body" style={{ color: 'var(--lp-ink-muted)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
