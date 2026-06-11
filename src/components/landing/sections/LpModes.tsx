import React from 'react';
import { getLandingCopy, type LandingModeItem } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface ModeBlockProps {
  mode: LandingModeItem;
  imageSrc: string;
  imageAnimate: 'slide-left' | 'slide-right';
  reversed: boolean;
}

const ModeBlock: React.FC<ModeBlockProps> = ({ mode, imageSrc, imageAnimate, reversed }) => (
  <div className="grid md:grid-cols-2 gap-8 items-center">
    <div className={`lp-shot ${reversed ? 'md:order-2' : ''}`} data-animate={imageAnimate}>
      <img
        src={imageSrc}
        alt={mode.imageAlt}
        loading="lazy"
        className="w-full h-auto block"
      />
    </div>
    <div className={reversed ? 'md:order-1' : ''}>
      <span
        className="lp-eyebrow text-xs tracking-widest mb-3 block"
        style={{ color: 'var(--lp-gold-deep)' }}
      >
        {mode.tagline}
      </span>
      <h3 className="lp-display text-2xl sm:text-3xl mb-4">{mode.title}</h3>
      <div
        className="space-y-3 text-sm sm:text-base"
        style={{ color: 'var(--lp-ink-muted)' }}
      >
        {mode.description.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  </div>
);

export const LpModes: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  const modes: Array<{
    mode: LandingModeItem;
    imageSrc: string;
    imageAnimate: 'slide-left' | 'slide-right';
    reversed: boolean;
  }> = [
    {
      mode: copy.modes.chordRun,
      imageSrc: '/newLP/chord-run.webp',
      imageAnimate: 'slide-right',
      reversed: false,
    },
    {
      mode: copy.modes.survival,
      imageSrc: '/newLP/survival.webp',
      imageAnimate: 'slide-left',
      reversed: true,
    },
    {
      mode: copy.modes.battle,
      imageSrc: '/newLP/battle.webp',
      imageAnimate: 'slide-right',
      reversed: false,
    },
  ];

  return (
    <section id="modes" className="py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.modes.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.modes.heading}
        </h2>

        <div className="space-y-16 max-w-5xl mx-auto">
          {modes.map(({ mode, imageSrc, imageAnimate, reversed }) => (
            <ModeBlock
              key={mode.title}
              mode={mode}
              imageSrc={imageSrc}
              imageAnimate={imageAnimate}
              reversed={reversed}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
