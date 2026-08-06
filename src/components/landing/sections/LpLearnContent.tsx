import React from 'react';
import { getLpCoursesShot } from '@/components/landing/landingAssets';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpLearnContent: React.FC = () => {
  const isEnglish = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglish);
  const coursesShot = getLpCoursesShot(isEnglish);

  return (
    <section
      id="courses"
      className="py-12 sm:py-20 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <h2
          className="lp-section-title text-2xl sm:text-3xl text-center mb-6"
          data-animate="from-behind"
        >
          {copy.courses.heading}
        </h2>

        <div
          className="lp-section-lead max-w-2xl mx-auto text-center space-y-4 mb-12"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.courses.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="lp-shot-stage max-w-3xl mx-auto mb-12" data-animate="from-behind">
          <div className="lp-shot">
            <picture>
              <source
                srcSet={coursesShot.mobileSrc}
                media="(max-width: 1023px)"
                type="image/webp"
              />
              <img
                src={coursesShot.src}
                alt={copy.courses.imageAlt}
                width={coursesShot.width}
                height={coursesShot.height}
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
            </picture>
          </div>
        </div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          data-animate="alt-cards"
        >
          {copy.courses.items.map((item) => (
            <div key={item.title} className="lp-card lp-card-hover p-7">
              <h3
                className="lp-subtitle text-lg mb-2 flex items-center gap-2"
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
              <p className="lp-card-body" style={{ color: 'var(--lp-ink-muted)' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
