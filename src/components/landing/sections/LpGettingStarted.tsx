import React from 'react';
import { Link } from 'react-router-dom';
import { LpAppStoreButton } from '@/components/landing/LpAppStoreButton';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { HELP_MIDI_KEYBOARD_CHOICE_PATH } from '@/components/landing/landingLinks';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpGettingStarted: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-12 sm:py-20 scroll-mt-20">
      <div className="lp-container">
        <h2
          className="lp-section-title text-2xl sm:text-3xl text-center mb-6"
          data-animate="from-behind"
        >
          {copy.platforms.heading}
        </h2>

        <div
          className="lp-section-lead max-w-3xl mx-auto text-center space-y-3 mb-10"
          style={{ color: 'var(--lp-ink-muted)' }}
          data-animate="from-behind"
        >
          {copy.platforms.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {copy.platforms.cards.map((card) => (
            <div key={card.title} className="lp-card p-6 sm:p-8" data-animate="from-behind">
              <h3 className="lp-subtitle text-lg mb-3">{card.title}</h3>
              <p className="lp-card-body" style={{ color: 'var(--lp-ink-muted)' }}>
                {card.description}
              </p>
              {card.linkTo && card.linkLabel && (
                <p className="mt-4">
                  <Link
                    to={card.linkTo}
                    className="text-sm underline transition-colors hover:text-[var(--lp-gold-deep)]"
                    style={{ color: 'var(--lp-ink-muted)' }}
                  >
                    {card.linkLabel}
                  </Link>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="lp-card p-8 sm:p-10 text-center max-w-3xl mx-auto">
          <div
            className="lp-section-lead space-y-3"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.requirements.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-4">
            <Link
              to={HELP_MIDI_KEYBOARD_CHOICE_PATH}
              className="text-sm underline transition-colors hover:text-[var(--lp-gold-deep)]"
              style={{ color: 'var(--lp-ink-muted)' }}
            >
              {copy.requirements.choiceLinkLabel}
            </Link>
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {copy.requirements.badges.map((badge) => (
              <span key={badge} className="lp-pill">
                {badge}
              </span>
            ))}
          </div>
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
