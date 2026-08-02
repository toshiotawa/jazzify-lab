import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpBeforeAfter: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-12 sm:py-20 scroll-mt-20">
      <div className="lp-container">
        <h2
          className="lp-section-title text-2xl sm:text-3xl text-center max-w-2xl mx-auto"
          data-animate="from-behind"
        >
          {copy.beforeAfter.heading}
        </h2>

        <div
          className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          data-animate="alt-cards"
        >
          <div
            className="lp-card p-6 sm:p-8"
            style={{ borderTop: '3px solid var(--lp-line)' }}
          >
            <h3
              className="lp-subtitle text-lg mb-6"
              style={{ color: 'var(--lp-ink-muted)' }}
            >
              {copy.beforeAfter.beforeLabel}
            </h3>
            <ul className="space-y-4">
              {copy.beforeAfter.beforeItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 lp-body"
                  style={{ color: 'var(--lp-ink-muted)' }}
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'var(--lp-line)', color: 'var(--lp-ink-muted)' }}
                    aria-hidden="true"
                  >
                    ×
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="lp-card p-6 sm:p-8"
            style={{ borderTop: '3px solid var(--lp-gold)' }}
          >
            <h3
              className="lp-subtitle text-lg mb-6"
              style={{ color: 'var(--lp-gold-deep)' }}
            >
              {copy.beforeAfter.afterLabel}
            </h3>
            <ul className="space-y-4">
              {copy.beforeAfter.afterItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 lp-body"
                  style={{ color: 'var(--lp-ink)' }}
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--lp-gold-tint)', color: 'var(--lp-gold-deep)' }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
