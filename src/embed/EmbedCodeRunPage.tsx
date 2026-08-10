import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CodeRunDemoFinishOutcome } from '@/components/survival/codeRun/CodeRunGameScreen';
import {
  CODE_RUN_HERO_SPRITE_HEIGHT,
  CODE_RUN_HERO_SPRITE_URL,
  CODE_RUN_HERO_SPRITE_WIDTH,
} from '@/components/survival/codeRun/codeRunSpriteUrls';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import { fetchSurvivalStage } from '@/components/survival/SurvivalStageDefinitions';
import {
  applyDemoConfigToStage,
  buildCodeRunDemoLpUrl,
  resolveCodeRunDemo,
} from '@/embed/codeRunDemoCatalog';
import {
  CODE_RUN_DEMO_EVENTS,
  trackCodeRunDemoEvent,
} from '@/embed/codeRunDemoAnalytics';
import { useSurvivalMidiSession } from '@/hooks/useSurvivalMidiSession';
import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  fetchSurvivalBgmSettings,
  fetchSurvivalDifficultySettings,
  resolveStageBgmUrl,
  toSurvivalBgmSettingsMap,
} from '@/platform/supabaseSurvival';
import { installDvhViewport } from '@/utils/dvhViewport';
import { isIphoneSafari, requestAppFullscreen } from '@/utils/fullscreenSupport';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import './embedCodeRunStart.css';

const LazyCodeRunGameScreen = React.lazy(
  () => import('@/components/survival/codeRun/CodeRunGameScreen'),
);

type EmbedScreen = 'pre' | 'playing' | 'finished';

const EmbedCodeRunPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const demoId = searchParams.get('id');
  const autoStart = searchParams.get('fs') === '1';
  const embedFrom = searchParams.get('from');
  const demoConfig = useMemo(() => resolveCodeRunDemo(demoId), [demoId]);
  const isEnglish = shouldUseEnglishCopy({ preferredLocale: demoConfig?.lpLocale });
  const survivalMidi = useSurvivalMidiSession();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackContext = useMemo(
    () => (demoConfig ? { demoConfig, from: embedFrom } : null),
    [demoConfig, embedFrom],
  );

  const [screen, setScreen] = useState<EmbedScreen>('pre');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stageDefinition, setStageDefinition] = useState<Awaited<ReturnType<typeof fetchSurvivalStage>>>(null);
  const [gameConfig, setGameConfig] = useState<DifficultyConfig | null>(null);
  const [finishOutcome, setFinishOutcome] = useState<CodeRunDemoFinishOutcome | null>(null);
  const didAutoStartRef = useRef(false);

  const lpUrl = demoConfig
    ? buildCodeRunDemoLpUrl(demoConfig, { from: embedFrom })
    : 'https://jazzify.jp/';

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
    if (!demoConfig || !trackContext) return;
    const stage = await loadStage();
    if (!stage) return;
    // ステージ取得成功後にのみ play を送る（失敗時にキーイベントを汚さない）
    trackCodeRunDemoEvent(CODE_RUN_DEMO_EVENTS.play, trackContext);
    setScreen('playing');
  }, [demoConfig, loadStage, trackContext]);

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
    if (!trackContext) return;
    if (outcome === 'clear') {
      trackCodeRunDemoEvent(CODE_RUN_DEMO_EVENTS.clear, trackContext);
    } else if (outcome === 'timeout') {
      trackCodeRunDemoEvent(CODE_RUN_DEMO_EVENTS.timeout, trackContext);
    }
    setFinishOutcome(outcome);
    setScreen('finished');
  }, [trackContext]);

  const openFullscreenTab = useCallback(() => {
    if (!demoConfig) return;
    const params = new URLSearchParams({ id: demoConfig.id, fs: '1' });
    if (embedFrom?.trim()) params.set('from', embedFrom.trim());
    const url = `${window.location.origin}/embed/code-run?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [demoConfig, embedFrom]);

  const handleCtaClick = useCallback(() => {
    if (!trackContext) return;
    trackCodeRunDemoEvent(CODE_RUN_DEMO_EVENTS.ctaClick, trackContext, {
      outcome: finishOutcome ?? 'unknown',
    });
  }, [finishOutcome, trackContext]);

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
        <div className="ecr-screen">
          <div className="ecr-screen__scanlines" aria-hidden="true" />
          <div className="ecr-screen__inner">
            <p className="ecr-eyebrow">JAZZIFY</p>
            <h1 className="ecr-logo">CODE RUN</h1>
            <p className="ecr-lead">
              {isEnglish
                ? 'Play with a MIDI keyboard or the on-screen piano. Arrow keys move on desktop.'
                : 'MIDIキーボードまたは画面鍵盤でプレイできます。PCでは矢印キーで移動します。'}
            </p>

            <div className="ecr-badges">
              <div className="ecr-badge">
                <span className="ecr-badge__key">{isEnglish ? 'Mode' : '出題'}</span>
                <span className="ecr-badge__value">{chordModeLabel}</span>
              </div>
              <div className="ecr-badge">
                <span className="ecr-badge__key">{isEnglish ? 'Guide' : 'ガイド'}</span>
                <span className="ecr-badge__value">
                  {demoConfig.hintMode ? (isEnglish ? 'On' : 'あり') : (isEnglish ? 'Off' : 'なし')}
                </span>
              </div>
              <div className="ecr-badge">
                <span className="ecr-badge__key">{isEnglish ? 'Time' : '制限時間'}</span>
                <span className="ecr-badge__value">{demoConfig.timeLimitSec}s</span>
              </div>
            </div>

            {loadError && <p className="ecr-error">{loadError}</p>}

            <div className="ecr-stage" aria-hidden="true">
              <img
                className="ecr-stage__hero"
                src={CODE_RUN_HERO_SPRITE_URL}
                width={CODE_RUN_HERO_SPRITE_WIDTH}
                height={CODE_RUN_HERO_SPRITE_HEIGHT}
                alt=""
                decoding="async"
              />
              <div className="ecr-stage__ground" />
            </div>

            <button
              type="button"
              onClick={() => { void startDemo(); }}
              className="ecr-start"
            >
              <span className="ecr-start__shine" aria-hidden="true" />
              <span className="ecr-start__caret" aria-hidden="true">▶</span>
              {isEnglish ? 'PRESS START' : 'スタート'}
            </button>

            {isIphoneSafari() && (
              <button type="button" onClick={openFullscreenTab} className="ecr-secondary">
                {isEnglish ? 'Open in new tab (fullscreen)' : '別タブで全画面プレイ'}
              </button>
            )}
          </div>
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
        <div className="ecr-screen">
          <div className="ecr-screen__scanlines" aria-hidden="true" />
          <div className="ecr-screen__inner">
            <p className="ecr-eyebrow">
              {finishOutcome === 'clear' ? 'STAGE CLEAR' : 'GAME OVER'}
            </p>
            <h2 className="ecr-logo">
              {finishOutcome === 'clear'
                ? (isEnglish ? 'NICE RUN!' : 'クリア！')
                : finishOutcome === 'timeout'
                  ? (isEnglish ? "TIME'S UP!" : '時間切れ！')
                  : (isEnglish ? 'TRY AGAIN!' : 'もう一度！')}
            </h2>
            <p className="ecr-lead">
              {isEnglish
                ? 'Continue your chord journey with the full Jazzify course.'
                : 'Jazzify本編でコードランを続けましょう。'}
            </p>

            <div className="ecr-stage" aria-hidden="true">
              <img
                className="ecr-stage__hero"
                src={CODE_RUN_HERO_SPRITE_URL}
                width={CODE_RUN_HERO_SPRITE_WIDTH}
                height={CODE_RUN_HERO_SPRITE_HEIGHT}
                alt=""
                decoding="async"
              />
              <div className="ecr-stage__ground" />
            </div>

            <a
              href={lpUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className="ecr-start"
            >
              <span className="ecr-start__shine" aria-hidden="true" />
              <span className="ecr-start__caret" aria-hidden="true">▶</span>
              {isEnglish ? 'Explore Jazzify' : 'Jazzifyを見る'}
            </a>

            <button
              type="button"
              onClick={() => {
                setFinishOutcome(null);
                setScreen('pre');
              }}
              className="ecr-secondary"
            >
              {isEnglish ? 'Play again' : 'もう一度プレイ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedCodeRunPage;
