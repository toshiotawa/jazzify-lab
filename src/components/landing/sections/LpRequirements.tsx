import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpRequirements: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.requirements.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.requirements.heading}
        </h2>

        <div className="lp-card p-8 sm:p-10 text-center max-w-3xl mx-auto">
          <div
            className="space-y-3 text-sm sm:text-base"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.requirements.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {copy.requirements.badges.map((badge) => (
              <span key={badge} className="lp-pill">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
