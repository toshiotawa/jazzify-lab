import React, { useRef, useState } from 'react';
import { getPromoVideo } from '@/components/landing/landingAssets';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { trackEvent } from '@/utils/analytics/ga';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpPromoVideo: React.FC = () => {
  const isEnglish = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglish);
  const promo = getPromoVideo(isEnglish);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (): void => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!video.querySelector('source')) {
      const src = window.matchMedia('(max-width: 767px)').matches ? promo.src720 : promo.src1080;
      const source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);
      video.load();
    }

    void video.play().then(() => {
      setIsPlaying(true);
      trackEvent('lp_promo_video_play', { locale: isEnglish ? 'en' : 'ja' });
    }).catch(() => {
      // Autoplay policy should not apply after explicit user click.
    });
  };

  return (
    <section className="lp-dark py-16 sm:py-20 scroll-mt-20" style={{ background: 'var(--lp-night-2)' }}>
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">{copy.promoVideo.eyebrow}</span>
        </div>
        <h2
          className="lp-display text-3xl sm:text-4xl md:text-5xl text-center mb-8"
          data-animate="from-behind"
        >
          {copy.promoVideo.heading}
        </h2>
        <div
          className="lp-section-lead max-w-2xl mx-auto text-center space-y-2 mb-10"
          style={{ color: 'var(--lp-ink-muted)' }}
          data-animate="text-up"
        >
          {copy.promoVideo.sub.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="lp-shot-stage max-w-4xl mx-auto" data-animate="from-behind">
          <div className="lp-shot lp-promo-video relative">
            {!isPlaying ? (
              <button
                type="button"
                className="lp-promo-play relative block w-full group cursor-pointer"
                onClick={handlePlay}
                aria-label={copy.promoVideo.playLabel}
              >
                <picture>
                  <source
                    srcSet={promo.posterMobile}
                    media="(max-width: 767px)"
                    type="image/webp"
                  />
                  <img
                    src={promo.poster}
                    alt={copy.promoVideo.videoAlt}
                    width={1920}
                    height={1080}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto block"
                  />
                </picture>
                <span
                  className="lp-promo-play-overlay absolute inset-0 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="lp-btn-gold px-10 py-5 text-lg sm:text-xl shadow-2xl group-hover:scale-105 transition-transform inline-flex items-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {copy.promoVideo.playLabel}
                  </span>
                </span>
              </button>
            ) : null}
            <video
              ref={videoRef}
              controls={isPlaying}
              playsInline
              preload="none"
              poster={promo.poster}
              className={isPlaying ? 'w-full h-auto block' : 'sr-only'}
              aria-label={copy.promoVideo.videoAlt}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
