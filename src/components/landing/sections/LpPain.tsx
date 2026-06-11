import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpPain: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const bodyLastIndex = copy.pain.body.length - 1;

  return (
    <section className="py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center"
          data-animate="from-behind heading-underline"
        >
          {copy.pain.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>

        <div
          className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mt-16"
          data-animate="alt-cards"
        >
          {copy.pain.cards.map((card) => (
            <div
              key={card}
              className="lp-card p-6 text-sm sm:text-base"
              style={{ color: 'var(--lp-ink-muted)' }}
            >
              {card}
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto mt-12 text-center space-y-4">
          {copy.pain.body.map((paragraph, index) => (
            <p
              key={paragraph}
              className={index === bodyLastIndex ? 'font-semibold' : undefined}
              style={{ color: index === bodyLastIndex ? 'var(--lp-ink)' : 'var(--lp-ink-muted)' }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};
