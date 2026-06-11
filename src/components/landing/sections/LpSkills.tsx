import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const CheckIcon: React.FC = () => (
  <span
    className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0"
    style={{ background: 'var(--lp-gold-tint)' }}
  >
    <svg
      className="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ color: 'var(--lp-gold-deep)' }}
    >
      <path
        d="M3.5 8.5l3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export const LpSkills: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-14 sm:py-16 scroll-mt-20">
      <div className="lp-container">
        <div className="lp-heading-tick lp-heading-tick--center" />
        <h2
          className="lp-display text-xl sm:text-2xl md:text-3xl text-center"
          data-animate="from-behind"
        >
          {copy.skills.heading}
        </h2>

        <div
          className="max-w-2xl mx-auto text-center mt-8 mb-10"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.skills.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div
          className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto"
          data-animate="alt-cards"
        >
          {copy.skills.items.map((item) => (
            <div
              key={item}
              className="lp-card px-6 py-5 flex items-center gap-3"
            >
              <CheckIcon />
              <span className="font-semibold text-sm sm:text-base">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
