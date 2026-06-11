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
    <section
      className="py-20 sm:py-28 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.skills.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.skills.heading}
        </h2>

        <div
          className="max-w-2xl mx-auto text-center mb-12"
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
