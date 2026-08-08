import React from 'react';
import { getLandingCopy, type LandingModeItem } from '@/components/landing/landingCopy';
import { LpChordRunVideo } from '@/components/landing/sections/LpChordRunVideo';
import { LpViralTweetEmbed } from '@/components/landing/sections/LpViralTweetEmbed';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface ModeCardProps {
  mode: LandingModeItem;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
}

const ModeCard: React.FC<ModeCardProps> = ({ mode, imageSrc, imageWidth, imageHeight }) => (
  <div className="lp-card overflow-hidden flex flex-col">
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
    <div className="p-6 flex-1">
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--lp-gold-deep)' }}>
        {mode.tagline}
      </p>
      <h3 className="lp-subtitle text-xl mb-2">{mode.title}</h3>
      {mode.description.map((paragraph) => (
        <p key={paragraph} className="lp-card-body" style={{ color: 'var(--lp-ink-muted)' }}>
          {paragraph}
        </p>
      ))}
    </div>
  </div>
);

export const LpModes: React.FC = () => {
  const isEnglishCopy = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglishCopy);
  const chordRunVideo = copy.modes.chordRunVideo;

  const modes: Array<{
    mode: LandingModeItem;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
  }> = [
    {
      mode: copy.modes.chordRun,
      imageSrc: '/newLP/chord-run.webp',
      imageWidth: 1280,
      imageHeight: 952,
    },
    {
      mode: copy.modes.survival,
      imageSrc: '/newLP/survival.webp',
      imageWidth: 1280,
      imageHeight: 733,
    },
    {
      mode: copy.modes.battle,
      imageSrc: '/newLP/battle.webp',
      imageWidth: 1280,
      imageHeight: 726,
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

        <div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          data-animate="alt-cards"
        >
          {modes.map(({ mode, imageSrc, imageWidth, imageHeight }) => (
            <ModeCard
              key={mode.title}
              mode={mode}
              imageSrc={imageSrc}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
            />
          ))}
        </div>

        {chordRunVideo ? (
          <div className="max-w-3xl mx-auto mt-14" data-animate="from-behind">
            <LpChordRunVideo copy={chordRunVideo} />
            <div className="lp-chord-run-comments">
              <h4 className="lp-eyebrow text-center mb-4">{chordRunVideo.commentsHeading}</h4>
              <figure className="lp-chord-run-comment">
                <img
                  src="/newLP/chord-run-comment-1.webp"
                  alt={chordRunVideo.comment1Alt}
                  width={1024}
                  height={83}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="lp-chord-run-comment">
                <img
                  src="/newLP/chord-run-comment-2.webp"
                  alt={chordRunVideo.comment2Alt}
                  width={1024}
                  height={247}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        ) : null}

        {!isEnglishCopy ? (
          <div className="max-w-5xl mx-auto mt-12">
            <LpViralTweetEmbed />
          </div>
        ) : null}
      </div>
    </section>
  );
};
