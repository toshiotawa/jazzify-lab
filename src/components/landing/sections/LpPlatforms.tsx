import React from 'react';
import { Link } from 'react-router-dom';
import { LpAppStoreButton } from '@/components/landing/LpAppStoreButton';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpPlatforms: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-12 sm:py-14 scroll-mt-20" style={{ background: 'var(--lp-surface)' }}>
      <div className="lp-container">
        <h2
          className="lp-section-title text-xl sm:text-2xl text-center mb-8"
          data-animate="from-behind"
        >
          {copy.platforms.heading}
        </h2>

        <div
          className="max-w-3xl mx-auto text-center space-y-3 mb-10"
          style={{ color: 'var(--lp-ink-muted)' }}
          data-animate="from-behind"
        >
          {copy.platforms.body.map((paragraph) => (
            <p key={paragraph} className="text-sm sm:text-base">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {copy.platforms.cards.map((card) => (
            <div key={card.title} className="lp-card p-6 sm:p-8" data-animate="from-behind">
              <h3 className="lp-subtitle text-lg mb-3">{card.title}</h3>
              <p className="text-sm" style={{ color: 'var(--lp-ink-muted)' }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <LpAppStoreButton
            label={copy.platforms.appStoreCta}
            ariaLabel={copy.footer.appStoreAria}
            size="md"
          />
          <Link to="/signup" className="lp-btn-gold px-8 py-4 text-lg">
            {copy.platforms.webCta}
          </Link>
        </div>
      </div>
    </section>
  );
};
