import React, { Suspense, useCallback, useRef, useState } from 'react';
import { LpMidiDeviceSelector } from '@/components/landing/LpMidiDeviceSelector';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { trackEvent } from '@/utils/analytics/ga';

const OnboardingExperience = React.lazy(
  () => import('@/components/onboarding/OnboardingExperience'),
);

interface FullscreenCapableElement extends HTMLDivElement {
  webkitRequestFullscreen?: () => void;
  msRequestFullscreen?: () => void;
}

interface FullscreenCapableDocument extends Document {
  webkitExitFullscreen?: () => void;
  msExitFullscreen?: () => void;
}

export const LpDemo: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<FullscreenCapableElement | null>(null);
  const dvhCleanupRef = useRef<(() => void) | null>(null);
  const { settings, updateSettings } = useGameStore();

  const closeDemo = useCallback(() => {
    setIsOpen(false);
    const doc: FullscreenCapableDocument = document;
    try {
      doc.body.style.overflow = '';
      doc.documentElement.style.overflow = '';
      if (doc.fullscreenElement) doc.exitFullscreen?.().catch(() => {});
      doc.webkitExitFullscreen?.();
      doc.msExitFullscreen?.();
    } catch { /* noop */ }
    try {
      dvhCleanupRef.current?.();
      dvhCleanupRef.current = null;
      doc.documentElement.style.removeProperty('--dvh');
    } catch { /* noop */ }
  }, []);

  const openDemo = useCallback(() => {
    trackEvent('tutorial_begin', { tutorial_name: 'lp_demo' });
    void import('@/components/survival/tutorial/tutorialAudioUnlock')
      .then(({ unlockTutorialAudio }) => unlockTutorialAudio())
      .catch(() => { /* autoplay policy */ });
    setIsOpen(true);
    try {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch { /* noop */ }

    try {
      dvhCleanupRef.current?.();
      dvhCleanupRef.current = null;
      const setDvh = () => {
        const vv = window.visualViewport;
        const vals = [window.innerHeight, document.documentElement.clientHeight];
        if (vv) vals.push(vv.height);
        document.documentElement.style.setProperty('--dvh', `${Math.min(...vals)}px`);
      };
      setDvh();
      window.addEventListener('resize', setDvh, { passive: true });
      const vv = window.visualViewport;
      if (vv) {
        vv.addEventListener('resize', setDvh, { passive: true });
        vv.addEventListener('scroll', setDvh, { passive: true });
      }
      dvhCleanupRef.current = () => {
        window.removeEventListener('resize', setDvh);
        if (vv) {
          vv.removeEventListener('resize', setDvh);
          vv.removeEventListener('scroll', setDvh);
        }
      };
      setTimeout(setDvh, 200);
      setTimeout(setDvh, 500);
    } catch { /* noop */ }

    setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
      root.webkitRequestFullscreen?.();
      root.msRequestFullscreen?.();
      try { window.dispatchEvent(new Event('resize')); } catch { /* noop */ }
    }, 0);
  }, []);

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

        <div className="lp-section-lead max-w-2xl mx-auto text-center space-y-2 mb-12" style={{ color: 'var(--lp-ink-muted)' }} data-animate="text-up">
          {copy.demo.sub.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="lp-card max-w-4xl mx-auto overflow-hidden" data-animate="from-behind">
          <button
            type="button"
            onClick={openDemo}
            className="relative block w-full group cursor-pointer"
            aria-label={copy.demo.startButton}
          >
            <picture>
              <source
                srcSet="/newLP/survival-balloon-640.webp"
                media="(max-width: 767px)"
                type="image/webp"
              />
              <img
                src="/newLP/survival-balloon.webp"
                alt={copy.modes.survival.imageAlt}
                className="w-full h-auto block"
                width={1024}
                height={587}
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

          <div className="p-6 sm:p-8" style={{ borderTop: '1px solid var(--lp-line)' }}>
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--lp-ink)' }}>{copy.demo.midiLabel}</p>
              <div
                className="rounded-xl p-4 text-left"
                style={{ background: 'var(--lp-night)', border: '1px solid var(--lp-line)' }}
              >
                <LpMidiDeviceSelector
                  value={settings.selectedMidiDevice}
                  onChange={(id) => updateSettings({ selectedMidiDevice: id })}
                />
              </div>
              <p className="lp-note mt-3" style={{ color: 'var(--lp-ink-muted)' }}>{copy.demo.midiHelper}</p>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-[1000] bg-black overflow-hidden flex flex-col"
          style={{
            height: 'var(--dvh, 100svh)',
            maxHeight: 'var(--dvh, 100svh)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-0 right-0 z-50 pt-[max(12px,env(safe-area-inset-top))] pr-[max(12px,env(safe-area-inset-right))]">
            <button
              type="button"
              onClick={() => {
                trackEvent('tutorial_skip', { tutorial_name: 'lp_demo', exit_method: 'close_button' });
                closeDemo();
              }}
              className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-white border border-white/10"
            >
              {copy.demo.exit}
            </button>
          </div>
          <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">{copy.demo.loading}</div>}>
              <OnboardingExperience
                embeddedFullHeight
                showSignupCtaOnFinish
                showSkip
                ctaLabel={copy.demo.finishCta}
                onComplete={(reachedEnd) => {
                  trackEvent(reachedEnd ? 'tutorial_complete' : 'tutorial_skip', {
                    tutorial_name: 'lp_demo',
                  });
                  if (!reachedEnd) {
                    closeDemo();
                  }
                }}
              />
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
};
