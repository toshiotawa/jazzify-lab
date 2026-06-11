import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpCourses: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      id="courses"
      className="py-20 sm:py-28 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.courses.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.courses.heading}
        </h2>

        <div
          className="max-w-2xl mx-auto text-center space-y-4 mb-12"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.courses.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="lp-shot max-w-3xl mx-auto mb-12" data-animate="from-behind">
          <img
            src="/newLP/courses.webp"
            alt={copy.courses.imageAlt}
            loading="lazy"
            className="w-full h-auto block"
          />
        </div>

        <div
          className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto"
          data-animate="alt-cards"
        >
          {copy.courses.items.map((item) => (
            <div key={item.title} className="lp-card lp-card-hover p-7">
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: 'var(--lp-blue-dark)' }}
              >
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
