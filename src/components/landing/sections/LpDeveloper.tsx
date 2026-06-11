import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpDeveloper: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      className="py-16 sm:py-24 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-start">
          <div
            className="w-48 h-60 sm:w-56 sm:h-72 rounded-xl overflow-hidden shrink-0 mx-auto md:mx-0"
            style={{ border: '2px solid var(--lp-gold-tint)' }}
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
            <div className="lp-heading-tick" />
            <h2
              className="lp-display text-2xl sm:text-3xl md:text-4xl mb-6"
              data-animate="from-behind"
            >
              {copy.developer.heading}
            </h2>

            <div className="flex flex-wrap gap-3 mb-6">
              {copy.developer.stats.map((stat) => (
                <span key={stat} className="lp-pill-gold lp-pill font-bold">
                  {stat}
                </span>
              ))}
            </div>

            <div
              className="space-y-4"
              style={{ color: 'var(--lp-ink-muted)' }}
              data-animate="text-up"
            >
              {copy.developer.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
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
