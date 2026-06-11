import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LpAppStoreButton } from '@/components/landing/LpAppStoreButton';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const HERO_POSTER_SRC = '/newLP/hero-poster.webp';
const HERO_POSTER_MOBILE_SRC = '/newLP/hero-poster-640.webp';
const HERO_VIDEO_WEBM = '/newLP/hero.webm';
const HERO_VIDEO_MP4 = '/newLP/hero.mp4';

const scrollToDemo = (): void => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LpHero: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoActive, setVideoActive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const injectSourcesAndPlay = (): void => {
      if (cancelled || video.querySelector('source')) return;

      const webm = document.createElement('source');
      webm.src = HERO_VIDEO_WEBM;
      webm.type = 'video/webm';
      const mp4 = document.createElement('source');
      mp4.src = HERO_VIDEO_MP4;
      mp4.type = 'video/mp4';
      video.appendChild(webm);
      video.appendChild(mp4);
      video.load();
      void video.play().then(() => {
        if (!cancelled) setVideoActive(true);
      }).catch(() => { /* autoplay policy */ });
    };

    const scheduleLoad = (): void => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(injectSourcesAndPlay, { timeout: 4000 });
      } else {
        setTimeout(injectSourcesAndPlay, 2000);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        scheduleLoad();
        observer.disconnect();
      }
    }, { threshold: 0, rootMargin: '0px' });

    observer.observe(video);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return (
    <section className="lp-dark hero-bg pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="lp-container grid md:grid-cols-12 gap-12 md:gap-8 lg:gap-12 items-center">
        <div className="md:col-span-6 lg:col-span-5">
          <h1 className="lp-display-hero lp-hero-title" data-animate="from-behind">
            {copy.hero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <div className="lp-hero-description mt-6 space-y-2" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.hero.subtitle.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="lp-btn-gold px-8 py-4 text-lg"
              aria-label={copy.hero.demoCta}
              onClick={scrollToDemo}
            >
              {copy.hero.demoCta}
            </button>
            <LpAppStoreButton
              label={copy.hero.appStoreCta}
              ariaLabel={copy.footer.appStoreAria}
              size="md"
            />
            <Link to="/signup" className="lp-btn-outline px-8 py-4 text-lg">
              {copy.hero.signupCta}
            </Link>
          </div>
          <p className="lp-note mt-4" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.hero.note}
          </p>
        </div>

        <div className="md:col-span-6 lg:col-span-7">
          <div className="lp-shot-stage" data-animate="from-behind">
            <div className="lp-shot lp-hero-media">
              <picture>
                <source
                  srcSet={HERO_POSTER_MOBILE_SRC}
                  media="(max-width: 767px)"
                  type="image/webp"
                />
                <img
                  src={HERO_POSTER_SRC}
                  alt={copy.hero.videoAlt}
                  width={1280}
                  height={952}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`w-full h-auto block transition-opacity duration-300 ${videoActive ? 'opacity-0 absolute inset-0 pointer-events-none' : ''}`}
                />
              </picture>
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="none"
                poster={HERO_POSTER_SRC}
                className={`w-full h-auto block ${videoActive ? '' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
                aria-label={copy.hero.videoAlt}
              />
            </div>
            <span className="lp-shot-note absolute -bottom-3.5 left-5 sm:left-8">
              {copy.hero.videoBadge}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
