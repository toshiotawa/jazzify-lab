import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpDeveloper: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      className="py-20 sm:py-28 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.developer.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.developer.heading}
        </h2>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-start">
          <div
            className="w-48 h-60 sm:w-56 sm:h-72 rounded-xl overflow-hidden shrink-0 mx-auto md:mx-0"
            style={{ border: '1px solid var(--lp-line)' }}
          >
            <picture>
              <source srcSet="/profile.webp" type="image/webp" />
              <img
                src="/profile.jpg"
                alt={copy.developer.photoAlt}
                className="w-full h-full object-cover"
                width={480}
                height={576}
                loading="lazy"
              />
            </picture>
          </div>

          <div className="flex-1">
            <div
              className="space-y-4"
              style={{ color: 'var(--lp-ink-muted)' }}
              data-animate="text-up"
            >
              {copy.developer.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              {copy.developer.stats.map((stat) => (
                <span key={stat} className="lp-pill-gold lp-pill font-bold">
                  {stat}
                </span>
              ))}
            </div>

            <p className="mt-6 font-bold" style={{ color: 'var(--lp-ink)' }}>
              {copy.developer.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
              {copy.developer.role}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
