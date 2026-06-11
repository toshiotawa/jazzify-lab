import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpPain: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const bodyLastIndex = copy.pain.body.length - 1;

  return (
    <section className="py-12 sm:py-20 scroll-mt-20">
      <div className="lp-container">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-start">
          <div className="md:col-span-5">
            <h2
              className="lp-section-title text-2xl sm:text-3xl"
              data-animate="from-behind"
            >
              {copy.pain.heading.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <div className="mt-8 space-y-4">
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

          <div
            className="md:col-span-7 flex flex-col gap-4"
            data-animate="alt-cards"
          >
            {copy.pain.cards.map((card) => (
              <div
                key={card}
                className="py-4 px-5 text-sm sm:text-base rounded-lg"
                style={{
                  borderLeft: '3px solid var(--lp-gold)',
                  background: 'var(--lp-surface)',
                  color: 'var(--lp-ink-muted)',
                }}
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
