import React from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const MidiKeyboardIllustration: React.FC = () => (
  <svg
    width="160"
    height="48"
    viewBox="0 0 160 48"
    fill="none"
    aria-hidden="true"
    className="mx-auto mb-8"
    style={{ color: 'var(--lp-blue)' }}
  >
    <rect x="1" y="1" width="158" height="46" rx="4" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="16" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="28" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="40" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="52" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="64" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="76" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="88" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="100" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="112" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="124" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="136" y="6" width="10" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="148" y="6" width="8" height="36" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    <rect x="12" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="24" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="36" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="60" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="72" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="84" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="108" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="120" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
    <rect x="132" y="6" width="6" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.75" />
  </svg>
);

export const LpRequirements: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section className="py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.requirements.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.requirements.heading}
        </h2>

        <div className="lp-card p-8 sm:p-10 text-center max-w-3xl mx-auto">
          <MidiKeyboardIllustration />

          <div
            className="space-y-3 text-sm sm:text-base"
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
