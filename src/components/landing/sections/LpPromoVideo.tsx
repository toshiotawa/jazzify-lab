import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getPromoVideo } from '@/components/landing/landingAssets';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { trackEvent } from '@/utils/analytics/ga';
import {
  createPromoVideoSession,
  watchProgressPercent,
  watchSeconds,
} from '@/utils/analytics/promoVideoEvents';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpPromoVideo: React.FC = () => {
  const isEnglish = shouldUseEnglishCopy();
  const locale = isEnglish ? 'en' : 'ja';
  const copy = getLandingCopy(isEnglish);
  const promo = getPromoVideo(isEnglish);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef(createPromoVideoSession());
  const [isPlaying, setIsPlaying] = useState(false);
  const posterSrc = useMemo(
    () => (window.matchMedia('(max-width: 767px)').matches ? promo.posterMobile : promo.poster),
    [promo.poster, promo.posterMobile],
  );
  const videoSrc = useMemo(
    () => (window.matchMedia('(max-width: 767px)').matches ? promo.src720 : promo.src1080),
    [promo.src720, promo.src1080],
  );

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const session = sessionRef.current;

    const baseParams = () => ({
      locale,
      progress_percent: watchProgressPercent(video.currentTime, video.duration),
      watch_seconds: watchSeconds(video.currentTime),
    });

    const fireAbandon = (): void => {
      if (!session.onAbandon()) {
        return;
      }
      trackEvent('lp_promo_video_abandon', baseParams());
    };

    const onEnded = (): void => {
      if (!session.onComplete()) {
        return;
      }
      trackEvent('lp_promo_video_complete', {
        locale,
        progress_percent: 100,
        watch_seconds: watchSeconds(video.duration || video.currentTime),
      });
    };

    video.addEventListener('ended', onEnded);
    window.addEventListener('pagehide', fireAbandon);

    return () => {
      fireAbandon();
      video.removeEventListener('ended', onEnded);
      window.removeEventListener('pagehide', fireAbandon);
    };
  }, [isPlaying, locale]);

  const handlePlayButtonClick = (): void => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    void video.play().catch(() => {
      // Playback failure leaves the poster and play button available for retry.
    });
  };

  const handleVideoPlay = (): void => {
    setIsPlaying(true);
    if (sessionRef.current.onPlay()) {
      trackEvent('lp_promo_video_play', { locale });
    }
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
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              playsInline
              preload="none"
              poster={posterSrc}
              className="w-full h-auto block"
              aria-label={copy.promoVideo.videoAlt}
              onPlay={handleVideoPlay}
            />
            {!isPlaying ? (
              <button
                type="button"
                className="lp-promo-play-icon"
                onClick={handlePlayButtonClick}
                aria-label={isEnglish ? 'Play video' : '動画を再生'}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
