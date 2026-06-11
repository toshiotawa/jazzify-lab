import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpCourses: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      id="courses"
      className="py-16 sm:py-24 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start mb-12">
          <div className="md:col-span-5">
            <div className="lp-heading-tick" />
            <h2
              className="lp-display text-2xl sm:text-3xl md:text-4xl"
              data-animate="from-behind"
            >
              {copy.courses.heading}
            </h2>
          </div>

          <div
            className="md:col-span-7 space-y-4"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.courses.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="lp-shot-stage max-w-3xl mx-auto mb-12" data-animate="from-behind">
          <div className="lp-shot">
            <img
              src="/newLP/courses.webp"
              alt={copy.courses.imageAlt}
              loading="lazy"
              className="w-full h-auto block"
            />
          </div>
        </div>

        <div
          className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto"
          data-animate="alt-cards"
        >
          {copy.courses.items.map((item) => (
            <div key={item.title} className="lp-card lp-card-hover p-7">
              <h3
                className="font-bold text-lg mb-2 flex items-center gap-2"
                style={{ color: 'var(--lp-ink)' }}
              >
                <span
                  className="shrink-0 rounded-sm"
                  style={{
                    width: '3px',
                    height: '1rem',
                    background: 'var(--lp-gold)',
                  }}
                />
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
