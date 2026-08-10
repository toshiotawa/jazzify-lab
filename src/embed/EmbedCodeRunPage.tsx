import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CodeRunDemoFinishOutcome } from '@/components/survival/codeRun/CodeRunGameScreen';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import { fetchSurvivalStage } from '@/components/survival/SurvivalStageDefinitions';
import {
  applyDemoConfigToStage,
  buildCodeRunDemoLpUrl,
  resolveCodeRunDemo,
} from '@/embed/codeRunDemoCatalog';
import { useSurvivalMidiSession } from '@/hooks/useSurvivalMidiSession';
import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  fetchSurvivalBgmSettings,
  fetchSurvivalDifficultySettings,
  resolveStageBgmUrl,
  toSurvivalBgmSettingsMap,
} from '@/platform/supabaseSurvival';
import { trackEvent } from '@/utils/analytics/ga';
import { installDvhViewport } from '@/utils/dvhViewport';
import { isIphoneSafari, requestAppFullscreen } from '@/utils/fullscreenSupport';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const LazyCodeRunGameScreen = React.lazy(
  () => import('@/components/survival/codeRun/CodeRunGameScreen'),
);

type EmbedScreen = 'pre' | 'playing' | 'finished';

const EmbedCodeRunPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const demoId = searchParams.get('id');
  const autoStart = searchParams.get('fs') === '1';
  const demoConfig = useMemo(() => resolveCodeRunDemo(demoId), [demoId]);
  const isEnglish = shouldUseEnglishCopy({ preferredLocale: demoConfig?.lpLocale });
  const survivalMidi = useSurvivalMidiSession();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [screen, setScreen] = useState<EmbedScreen>('pre');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stageDefinition, setStageDefinition] = useState<Awaited<ReturnType<typeof fetchSurvivalStage>>>(null);
  const [gameConfig, setGameConfig] = useState<DifficultyConfig | null>(null);
  const [finishOutcome, setFinishOutcome] = useState<CodeRunDemoFinishOutcome | null>(null);
  const didAutoStartRef = useRef(false);

  const lpUrl = demoConfig ? buildCodeRunDemoLpUrl(demoConfig) : 'https://jazzify.jp/';

  useEffect(() => installDvhViewport(), []);

  const loadStage = useCallback(async () => {
    if (!demoConfig) {
      setLoadError(isEnglish ? 'Unknown demo id.' : '不明なデモ ID です。');
      return null;
    }
    setLoadError(null);
    const row = await fetchSurvivalStage(demoConfig.mapCategory, demoConfig.stageNumber);
    if (!row || row.playMode !== 'code_run') {
      setLoadError(isEnglish ? 'Stage not found.' : 'ステージが見つかりません。');
      return null;
    }
    const stage = applyDemoConfigToStage(row, demoConfig);

    let bgmSettings = DEFAULT_SURVIVAL_BGM_SETTINGS;
    try {
      bgmSettings = toSurvivalBgmSettingsMap(await fetchSurvivalBgmSettings());
    } catch { /* fallback */ }

    let baseConfig: DifficultyConfig = {
      difficulty: stage.difficulty,
      displayName: stage.name,
      description: stage.name,
      descriptionEn: stage.nameEn,
      allowedChords: stage.allowedChords,
      enemySpawnRate: 1,
      enemySpawnCount: 1,
      enemyStatMultiplier: 1,
      expMultiplier: 1,
      itemDropRate: 1,
      bgmUrl: resolveStageBgmUrl(stage, bgmSettings),
    };

    try {
      const settings = await fetchSurvivalDifficultySettings();
      const matched = settings.find((entry) => entry.difficulty === stage.difficulty);
      if (matched) {
        baseConfig = {
          ...baseConfig,
          displayName: matched.displayName,
          description: matched.description ?? stage.name,
          descriptionEn: matched.descriptionEn ?? stage.nameEn,
          enemySpawnRate: matched.enemySpawnRate,
          enemySpawnCount: matched.enemySpawnCount,
          enemyStatMultiplier: matched.enemyStatMultiplier,
          expMultiplier: matched.expMultiplier,
          itemDropRate: matched.itemDropRate,
        };
      }
    } catch { /* noop */ }

    setStageDefinition(stage);
    setGameConfig(baseConfig);
    return stage;
  }, [demoConfig, isEnglish]);

  const startDemo = useCallback(async () => {
    if (!demoConfig) return;
    trackEvent('demo_start', { demo_id: demoConfig.id });
    const stage = await loadStage();
    if (!stage) return;
    setScreen('playing');
  }, [demoConfig, loadStage]);

  useEffect(() => {
    if (!autoStart || didAutoStartRef.current || !demoConfig) return;
    didAutoStartRef.current = true;
    void startDemo().then(() => {
      if (rootRef.current) {
        void requestAppFullscreen(rootRef.current);
      }
    });
  }, [autoStart, demoConfig, startDemo]);

  const handleFinish = useCallback((outcome: CodeRunDemoFinishOutcome) => {
    if (!demoConfig) return;
    if (outcome === 'clear') {
      trackEvent('demo_clear', { demo_id: demoConfig.id });
    } else if (outcome === 'timeout') {
      trackEvent('demo_timeout', { demo_id: demoConfig.id });
    }
    setFinishOutcome(outcome);
    setScreen('finished');
  }, [demoConfig]);

  const openFullscreenTab = useCallback(() => {
    if (!demoConfig) return;
    const url = `${window.location.origin}/embed/code-run?id=${encodeURIComponent(demoConfig.id)}&fs=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [demoConfig]);

  const handleCtaClick = useCallback(() => {
    if (demoConfig) {
      trackEvent('demo_cta_click', { demo_id: demoConfig.id, outcome: finishOutcome ?? 'unknown' });
    }
  }, [demoConfig, finishOutcome]);

  if (!demoConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">{isEnglish ? 'Demo not found' : 'デモが見つかりません'}</h1>
          <p className="mt-2 text-sm text-white/70">
            {isEnglish ? 'Use ?id=demo_1 or ?id=demo_2' : '?id=demo_1 または ?id=demo_2 を指定してください'}
          </p>
        </div>
      </div>
    );
  }

  const chordModeLabel = demoConfig.chordSource.kind === 'random'
    ? (isEnglish ? 'Random chords' : 'ランダム出題')
    : (isEnglish ? 'Chord progression' : 'コード進行');

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-black text-white"
      style={{ minHeight: 'var(--dvh, 100dvh)' }}
    >
      {screen === 'pre' && (
        <div className="mx-auto flex min-h-[var(--dvh,100dvh)] max-w-lg flex-col justify-center px-6 py-10">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Jazzify Code Run</p>
          <h1 className="mt-3 text-3xl font-bold">{isEnglish ? 'Try the demo' : 'デモを体験'}</h1>
          <p className="mt-3 text-sm text-white/70">
            {isEnglish
              ? 'Play with a MIDI keyboard or the on-screen piano. Arrow keys move on desktop.'
              : 'MIDIキーボードまたは画面鍵盤でプレイできます。PCでは矢印キーで移動します。'}
          </p>
          <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-white/60">{isEnglish ? 'Mode' : '出題'}</span>
              <span>{chordModeLabel}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/60">{isEnglish ? 'Guide' : 'ガイド'}</span>
              <span>{demoConfig.hintMode ? (isEnglish ? 'On' : 'あり') : (isEnglish ? 'Off' : 'なし')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/60">{isEnglish ? 'Time limit' : '制限時間'}</span>
              <span>{demoConfig.timeLimitSec}s</span>
            </div>
          </div>
          {loadError && (
            <p className="mt-4 text-sm text-red-300">{loadError}</p>
          )}
          <button
            type="button"
            onClick={() => { void startDemo(); }}
            className="mt-8 w-full rounded-xl bg-cyan-500 py-4 text-lg font-bold text-black transition hover:bg-cyan-400"
          >
            {isEnglish ? 'START' : 'スタート'}
          </button>
          {isIphoneSafari() && (
            <button
              type="button"
              onClick={openFullscreenTab}
              className="mt-3 w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/90"
            >
              {isEnglish ? 'Open in new tab (fullscreen)' : '別タブで全画面プレイ'}
            </button>
          )}
        </div>
      )}

      {screen === 'playing' && stageDefinition && gameConfig && (
        <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
          <LazyCodeRunGameScreen
            difficulty={stageDefinition.difficulty}
            config={gameConfig}
            stageDefinition={stageDefinition}
            hintMode={demoConfig.hintMode}
            onBackToSelect={() => setScreen('pre')}
            onBackToMenu={() => setScreen('pre')}
            survivalMidi={survivalMidi}
            preferredLocale={demoConfig.lpLocale}
            fullscreenRootRef={rootRef}
            onOpenFullscreenTab={isIphoneSafari() ? openFullscreenTab : undefined}
            demoMode={{
              timeLimitSec: demoConfig.timeLimitSec,
              onFinish: handleFinish,
            }}
          />
        </React.Suspense>
      )}

      {screen === 'finished' && (
        <div className="mx-auto flex min-h-[var(--dvh,100dvh)] max-w-lg flex-col justify-center px-6 py-10 text-center">
          <h2 className="text-3xl font-bold">
            {finishOutcome === 'clear'
              ? (isEnglish ? 'Nice run!' : 'クリア！')
              : finishOutcome === 'timeout'
                ? (isEnglish ? 'Time\'s up!' : '時間切れ！')
                : (isEnglish ? 'Try again!' : 'もう一度！')}
          </h2>
          <p className="mt-3 text-sm text-white/70">
            {isEnglish
              ? 'Continue your chord journey with the full Jazzify course.'
              : 'Jazzify本編でコードランを続けましょう。'}
          </p>
          <a
            href={lpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCtaClick}
            className="mt-8 inline-block w-full rounded-xl bg-amber-400 py-4 text-lg font-bold text-black transition hover:bg-amber-300"
          >
            {isEnglish ? 'Explore Jazzify' : 'Jazzifyを見る'}
          </a>
          <button
            type="button"
            onClick={() => {
              setFinishOutcome(null);
              setScreen('pre');
            }}
            className="mt-3 w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/90"
          >
            {isEnglish ? 'Play again' : 'もう一度プレイ'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmbedCodeRunPage;
