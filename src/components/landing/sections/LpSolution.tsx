import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpSolution: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      id="features"
      className="py-12 sm:py-20 scroll-mt-20"
    >
      <div className="lp-container">
        <h2
          className="lp-section-title text-2xl sm:text-3xl text-center mb-12"
          data-animate="from-behind"
        >
          {copy.solution.heading}
        </h2>

        <div
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          data-animate="alt-cards"
        >
          {copy.solution.values.map((value, index) => (
            <div key={value.title} className="lp-card p-8 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-lg"
                style={{ background: 'var(--lp-gold-tint)', color: 'var(--lp-gold-deep)' }}
              >
                {index + 1}
              </div>
              <h3 className="lp-subtitle text-lg mb-3">{value.title}</h3>
              <p className="lp-card-body" style={{ color: 'var(--lp-ink-muted)' }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
