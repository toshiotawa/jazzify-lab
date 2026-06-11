import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { HELP_MIDI_KEYBOARD_CHOICE_PATH } from '@/components/landing/landingLinks';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpRequirements: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-12 sm:py-14 scroll-mt-20">
      <div className="lp-container">
        <h2
          className="lp-section-title text-xl sm:text-2xl text-center mb-3"
          data-animate="from-behind"
        >
          {copy.requirements.heading}
        </h2>

        <p className="text-center mb-8">
          <Link
            to={HELP_MIDI_KEYBOARD_CHOICE_PATH}
            className="text-sm underline transition-colors hover:text-[var(--lp-gold-deep)]"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.requirements.choiceLinkLabel}
          </Link>
        </p>

        <div className="lp-card p-8 sm:p-10 text-center max-w-3xl mx-auto">
          <div
            className="lp-section-lead space-y-3"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.requirements.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {copy.requirements.badges.map((badge) => (
              <span key={badge} className="lp-pill">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
