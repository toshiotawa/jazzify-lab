import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import '@/app-extra.css';

const LPPIXIPiano = React.lazy(() => import('./LPPIXIPiano'));
const OnboardingExperience = React.lazy(
  () => import('@/components/onboarding/OnboardingExperience'),
);

const LPFantasyDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { settings, updateSettings } = useGameStore();
  const isEnglishCopy = shouldUseEnglishCopy();

  const demoTitle = isEnglishCopy ? 'Demo Play' : 'デモプレイ';
  const fullscreenButtonLabel = isEnglishCopy ? 'Start Tutorial Demo' : 'チュートリアルを体験';
  const midiDeviceLabel = isEnglishCopy ? 'Choose a MIDI device' : 'MIDI機器を選択';
  const midiHelperText = isEnglishCopy
    ? 'Selected device will be used in the demo. You can also play with mouse or touch.'
    : '選択した機器はデモプレイで使用されます。未選択でもマウス/タッチでプレイ可能です。';
  const pixiLoadingText = isEnglishCopy ? 'Loading piano...' : 'PIXIを読み込み中...';
  const exitFullscreenText = isEnglishCopy ? 'Exit' : '終了';
  const modalLoadingText = isEnglishCopy ? 'Loading...' : '読み込み中...';

  const [suspendPiano, setSuspendPiano] = useState(false);
  const [pianoVisible, setPianoVisible] = useState(false);
  const pianoSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    try {
      const observer = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setPianoVisible(true);
          observer.disconnect();
        }
      }, { root: null, rootMargin: '200px' });
      if (pianoSentinelRef.current) observer.observe(pianoSentinelRef.current);
      return () => observer.disconnect();
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(mq.matches);
    try { mq.addEventListener('change', update); } catch { mq.addListener(update); }
    update();
    return () => {
      try { mq.removeEventListener('change', update); } catch { mq.removeListener(update); }
    };
  }, []);

  const dvhCleanupRef = useRef<(() => void) | null>(null);

  const closeDemo = useCallback(() => {
    setIsOpen(false);
    try {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      (document as any).webkitExitFullscreen?.();
      (document as any).msExitFullscreen?.();
    } catch { /* noop */ }
    try {
      dvhCleanupRef.current?.();
      dvhCleanupRef.current = null;
      document.documentElement.style.removeProperty('--dvh');
    } catch { /* noop */ }
    setSuspendPiano(false);
  }, []);

  const openDemo = useCallback(() => {
    setSuspendPiano(true);
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
        const vv = (window as any).visualViewport;
        const vals = [window.innerHeight, document.documentElement.clientHeight];
        if (vv) vals.push(vv.height);
        const dvh = Math.min(...vals);
        document.documentElement.style.setProperty('--dvh', dvh + 'px');
      };
      setDvh();
      window.addEventListener('resize', setDvh, { passive: true });
      const vv = (window as any).visualViewport;
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
      (root as any).webkitRequestFullscreen?.();
      (root as any).msRequestFullscreen?.();
      try { window.dispatchEvent(new Event('resize')); } catch { /* noop */ }
    }, 0);

  }, []);

  const handleDemoExit = useCallback(() => {
    closeDemo();
  }, [closeDemo]);

  return (
    <section className="py-10" data-animate="slide-right">
      <div className="container mx-auto px-6">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 section-title flex items-center justify-center gap-4"
          data-animate="from-behind heading-underline"
        >
          <picture>
            <source srcSet="/stage_icons/9.webp" type="image/webp" />
            <img src="/stage_icons/9.png" alt={demoTitle} className="w-16 h-16" width={64} height={64} />
          </picture>
          {demoTitle}
        </h2>

        <div
          className="rounded-2xl border border-purple-500/30 bg-slate-900/60 shadow-xl overflow-hidden"
          data-animate="slide-right text-up"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* iPhone-style piano preview */}
            <div className="iphone-frame iphone-landscape mx-auto">
              <div className="device-screen relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div ref={pianoSentinelRef} className="absolute inset-0 flex items-end justify-center p-4">
                  <div className="w-full max-w-[640px]">
                    {pianoVisible ? (
                      <Suspense fallback={<div className="text-center text-gray-300 text-sm">{pixiLoadingText}</div>}>
                        {!suspendPiano && (
                          <LPPIXIPiano midiDeviceId={settings.selectedMidiDevice} height={isPortrait ? 120 : 150} />
                        )}
                      </Suspense>
                    ) : (
                      <div className="w-full h-[120px] md:h-[150px] bg-black/40 rounded-md border border-white/10" />
                    )}
                  </div>
                </div>
              </div>
              <div className="iphone-notch landscape" aria-hidden="true" />
              <div className="iphone-home landscape" aria-hidden="true" />
            </div>

            {/* Right column */}
            <div className="p-4 md:p-6 flex flex-col justify-center gap-4" data-animate="text-up">
              <div className="text-center">
                <p className="text-sm text-purple-200 mb-1">
                  {isEnglishCopy ? 'Survival Tutorial — II-V-I' : 'サバイバルチュートリアル — II-V-I'}
                </p>
                <p className="text-xs text-gray-400">
                  {isEnglishCopy
                    ? 'Play chords, see the staff, and finish the guided tour.'
                    : 'コードを弾いて譜面を見ながら、ガイド付き体験を最後まで進めます。'}
                </p>
              </div>

              <button
                onClick={openDemo}
                className="h-11 w-56 md:h-12 md:w-64 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-2xl mx-auto"
                aria-label={fullscreenButtonLabel}
              >
                {fullscreenButtonLabel}
              </button>

              <div>
                <div className="text-sm text-purple-200 font-semibold mb-2">{midiDeviceLabel}</div>
                <MidiDeviceSelector
                  value={settings.selectedMidiDevice}
                  onChange={(id) => updateSettings({ selectedMidiDevice: id })}
                />
                <div className="text-xs text-gray-400 mt-2">{midiHelperText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen survival game overlay */}
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
              onClick={handleDemoExit}
              className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-white border border-white/10"
            >
              {exitFullscreenText}
            </button>
          </div>
          <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">{modalLoadingText}</div>}>
              <OnboardingExperience
                embeddedFullHeight
                showSignupCtaOnFinish
                showSkip
                onComplete={handleDemoExit}
              />
            </Suspense>
          </div>
        </div>
      )}

    </section>
  );
};

export default LPFantasyDemo;
