import React from 'react';
import { getLpDemoShot } from '@/components/landing/landingAssets';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface LpDemoPlaceholderProps {
  onActivate: () => void;
}

export const LpDemoPlaceholder: React.FC<LpDemoPlaceholderProps> = ({ onActivate }) => {
  const isEnglish = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglish);
  const demoShot = getLpDemoShot(isEnglish);

  return (
    <section className="lp-dark py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">{copy.demo.eyebrow}</span>
        </div>
        <h2
          className="lp-display text-3xl sm:text-4xl md:text-5xl text-center mb-10"
          data-animate="from-behind"
        >
          {copy.demo.heading}
        </h2>

        <div
          className="lp-section-lead max-w-2xl mx-auto text-center space-y-2 mb-12"
          style={{ color: 'var(--lp-ink-muted)' }}
          data-animate="text-up"
        >
          {copy.demo.sub.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="lp-card max-w-4xl mx-auto overflow-hidden" data-animate="from-behind">
          <button
            type="button"
            onClick={onActivate}
            className="relative block w-full group cursor-pointer"
            aria-label={copy.demo.startButton}
          >
            <picture>
              <source
                srcSet={demoShot.mobileSrc}
                media="(max-width: 767px)"
                type="image/webp"
              />
              <img
                src={demoShot.src}
                alt={copy.modes.survival.imageAlt}
                className="w-full h-auto block"
                width={demoShot.width}
                height={demoShot.height}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(14,22,38,0.35)' }}>
              <span className="lp-btn-gold px-10 py-5 text-lg sm:text-xl shadow-2xl group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {copy.demo.startButton}
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
