import React from 'react';
import { getLandingCopy, type LandingModeItem } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface ModeBlockProps {
  mode: LandingModeItem;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  imageAnimate: 'slide-left' | 'slide-right';
  reversed: boolean;
}

const ModeBlock: React.FC<ModeBlockProps> = ({
  mode,
  imageSrc,
  imageWidth,
  imageHeight,
  imageAnimate,
  reversed,
}) => (
  <div className="grid md:grid-cols-2 gap-8 items-center">
    <div className={`lp-shot-stage ${reversed ? 'md:order-2' : ''}`} data-animate={imageAnimate}>
      <div className="lp-shot">
        <img
          src={imageSrc}
          alt={mode.imageAlt}
          width={imageWidth}
          height={imageHeight}
          loading="lazy"
          decoding="async"
          className="w-full h-auto block"
        />
      </div>
      <span className="lp-shot-note absolute -bottom-3.5 left-5 sm:left-8">{mode.tagline}</span>
    </div>
    <div className={reversed ? 'md:order-1' : ''}>
      <h3 className="lp-subtitle text-2xl sm:text-3xl mb-4">{mode.title}</h3>
      <div
        className="lp-section-lead space-y-3"
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
    imageWidth: number;
    imageHeight: number;
    imageAnimate: 'slide-left' | 'slide-right';
    reversed: boolean;
  }> = [
    {
      mode: copy.modes.chordRun,
      imageSrc: '/newLP/chord-run.webp',
      imageWidth: 1280,
      imageHeight: 952,
      imageAnimate: 'slide-right',
      reversed: false,
    },
    {
      mode: copy.modes.survival,
      imageSrc: '/newLP/survival.webp',
      imageWidth: 1280,
      imageHeight: 733,
      imageAnimate: 'slide-left',
      reversed: true,
    },
    {
      mode: copy.modes.battle,
      imageSrc: '/newLP/battle.webp',
      imageWidth: 1280,
      imageHeight: 726,
      imageAnimate: 'slide-right',
      reversed: false,
    },
  ];

  return (
    <section id="modes" className="lp-dark modes-bg py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.modes.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind"
        >
          {copy.modes.heading}
        </h2>

        <div className="space-y-16 sm:space-y-20 max-w-5xl mx-auto">
          {modes.map(({ mode, imageSrc, imageWidth, imageHeight, imageAnimate, reversed }) => (
            <ModeBlock
              key={mode.title}
              mode={mode}
              imageSrc={imageSrc}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              imageAnimate={imageAnimate}
              reversed={reversed}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
