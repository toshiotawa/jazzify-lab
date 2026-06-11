import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpSolution: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      id="features"
      className="py-20 sm:py-28 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.solution.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.solution.heading}
        </h2>

        <div
          className="max-w-2xl mx-auto text-center space-y-4 mb-16"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.solution.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          data-animate="alt-cards"
        >
          {copy.solution.values.map((value, index) => (
            <div key={value.title} className="lp-card lp-card-hover p-8 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center font-bold"
                style={{ background: 'var(--lp-blue-tint)', color: 'var(--lp-blue-dark)' }}
              >
                {index + 1}
              </div>
              <h3 className="font-bold text-lg mb-3">{value.title}</h3>
              <p className="text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
