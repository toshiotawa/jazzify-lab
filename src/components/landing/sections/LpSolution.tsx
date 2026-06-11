import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpSolution: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      id="features"
      className="py-12 sm:py-20 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-start">
          <div className="md:col-span-5">
            <h2
              className="lp-section-title text-2xl sm:text-3xl"
              data-animate="from-behind"
            >
              {copy.solution.heading}
            </h2>

            <div
              className="mt-8 space-y-4"
              style={{ color: 'var(--lp-ink-muted)' }}
            >
              {copy.solution.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="md:col-span-7" data-animate="text-up">
            {copy.solution.values.map((value, index) => (
              <div
                key={value.title}
                className="flex gap-5 py-6"
                style={{
                  borderBottom:
                    index < copy.solution.values.length - 1
                      ? '1px solid var(--lp-line)'
                      : undefined,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold"
                  style={{ background: 'var(--lp-gold-tint)', color: 'var(--lp-gold-deep)' }}
                >
                  {index + 1}
                </div>
                <div>
                  <h3 className="lp-subtitle text-lg mb-2">{value.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
