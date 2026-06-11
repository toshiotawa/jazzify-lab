import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpRequirements: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-14 sm:py-16 scroll-mt-20">
      <div className="lp-container">
        <div className="lp-heading-tick lp-heading-tick--center" />
        <h2
          className="lp-display text-xl sm:text-2xl md:text-3xl text-center mb-10"
          data-animate="from-behind"
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
