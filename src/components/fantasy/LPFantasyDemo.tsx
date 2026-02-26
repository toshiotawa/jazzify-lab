import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';

const LPPIXIPiano = React.lazy(() => import('./LPPIXIPiano'));
const SurvivalGameScreen = React.lazy(() => import('@/components/survival/SurvivalGameScreen'));

const DEMO_TIME_LIMIT_MS = 90 * 1000;

const DEMO_CDE_NOTES = ['C', 'D', 'E'];

const DEMO_BGM_ODD = 'https://jazzify-cdn.com/fantasy-bgm/5b49b467-c54b-4fa8-ba36-bae3cfce424e.mp3';
const DEMO_BGM_EVEN = 'https://jazzify-cdn.com/fantasy-bgm/77249341-8889-49a4-81e1-b190e0b6227c.mp3';

const DEMO_STAGE_CONFIG: DifficultyConfig = {
  difficulty: 'easy',
  displayName: 'Demo Stage',
  description: 'デモ: CDE単音',
  descriptionEn: 'Demo: CDE single notes',
  allowedChords: DEMO_CDE_NOTES.map(r => `${r}_note`),
  enemySpawnRate: 3,
  enemySpawnCount: 2,
  enemyStatMultiplier: 0.5,
  expMultiplier: 0.5,
  itemDropRate: 0.20,
  bgmOddWaveUrl: DEMO_BGM_ODD,
  bgmEvenWaveUrl: DEMO_BGM_EVEN,
};

const DEMO_STAGE_DEFINITION: StageDefinition = {
  stageNumber: 0,
  name: 'デモ CDE',
  nameEn: 'Demo CDE',
  difficulty: 'easy',
  chordSuffix: '_note',
  chordDisplayName: '単音 CDE',
  chordDisplayNameEn: 'Single Notes CDE',
  rootPattern: 'cde',
  rootPatternName: 'CDE',
  rootPatternNameEn: 'CDE',
  allowedChords: DEMO_CDE_NOTES.map(r => `${r}_note`),
};

const LPFantasyDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { settings, updateSettings } = useGameStore();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const demoTitle = isEnglishCopy ? 'Demo Play' : 'デモプレイ';
  const fullscreenButtonLabel = isEnglishCopy ? 'Play Demo (90s)' : 'デモプレイ（90秒）';
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

  const clearDemoTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closeDemo = useCallback((showCtaOverlay: boolean) => {
    setIsOpen(false);
    clearDemoTimer();
    try {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      (document as any).webkitExitFullscreen?.();
      (document as any).msExitFullscreen?.();
    } catch { /* noop */ }
    try { document.documentElement.style.removeProperty('--dvh'); } catch { /* noop */ }
    setSuspendPiano(false);
    if (showCtaOverlay) setShowCta(true);
  }, [clearDemoTimer]);

  const openDemo = useCallback(() => {
    setSuspendPiano(true);
    setIsOpen(true);
    setShowCta(false);

    try {
      const setDvh = () => {
        const dvh = Math.max(window.innerHeight, document.documentElement.clientHeight);
        document.documentElement.style.setProperty('--dvh', dvh + 'px');
      };
      setDvh();
      window.addEventListener('resize', setDvh, { passive: true });
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

    timerRef.current = window.setTimeout(() => {
      closeDemo(true);
    }, DEMO_TIME_LIMIT_MS);
  }, [closeDemo]);

  useEffect(() => {
    return () => clearDemoTimer();
  }, [clearDemoTimer]);

  const handleDemoExit = useCallback(() => {
    closeDemo(true);
  }, [closeDemo]);

  return (
    <section className="py-10" data-animate="slide-right">
      <div className="container mx-auto px-6">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 section-title flex items-center justify-center gap-4"
          data-animate="from-behind heading-underline"
        >
          <img src="/stage_icons/9.png" alt={demoTitle} className="w-16 h-16" />
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
                  {isEnglishCopy ? 'Stage Mode — CDE Single Notes' : 'ステージモード — CDE単音'}
                </p>
                <p className="text-xs text-gray-400">
                  {isEnglishCopy ? '90 seconds free play with hints' : '90秒間の無料体験プレイ（ヒント付き）'}
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
          className="fixed inset-0 z-[1000] bg-black min-h-[var(--dvh,100dvh)] flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-3 right-3 z-50">
            <button
              onClick={handleDemoExit}
              className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-white border border-white/10"
            >
              {exitFullscreenText}
            </button>
          </div>
          <div className="absolute inset-0">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">{modalLoadingText}</div>}>
              <SurvivalGameScreen
                difficulty="easy"
                config={DEMO_STAGE_CONFIG}
                onBackToSelect={handleDemoExit}
                onBackToMenu={handleDemoExit}
                stageDefinition={DEMO_STAGE_DEFINITION}
                hintMode={true}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* CTA overlay after demo ends */}
      {showCta && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-3">
              {isEnglishCopy ? 'Thanks for playing!' : 'お疲れさまでした！'}
            </h3>
            <p className="text-gray-300 mb-6">
              {isEnglishCopy
                ? 'Sign up now and get a 7-day free trial with all features unlocked.'
                : '無料トライアルに登録すると、7日間すべての機能をお試しいただけます。'}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-white text-base transition"
              >
                {isEnglishCopy ? 'Start Free Trial' : '無料トライアルを始める'}
              </Link>
              <button
                onClick={() => setShowCta(false)}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                {isEnglishCopy ? 'Close' : '閉じる'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LPFantasyDemo;
