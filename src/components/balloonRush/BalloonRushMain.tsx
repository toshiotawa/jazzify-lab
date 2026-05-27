/**
 * 風船ラッシュ — レッスン課題専用エントリ（URL ハッシュから stage / lesson を解決）
 * 準備・ゲーム画面はサバイバルモードの UI を流用する。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getWindow } from '@/platform';
import { fetchBalloonRushStageById } from '@/platform/supabaseBalloonRush';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import type { ClearConditions, LessonContext } from '@/types';
import { fetchLessonSongById } from '@/platform/supabaseLessons';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import { resolveBalloonRushAllowedChordIds } from '@/utils/balloonRushStageDefinitions';
import {
  applyLessonRandomChords,
  parseSurvivalLessonRandomChords,
} from '@/utils/survivalLessonRandomChords';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import {
  balloonRushDifficultyConfig,
  balloonRushLessonRuntime,
  balloonRushToStageDefinition,
} from '@/utils/balloonRushSurvivalBridge';
import BalloonRushGameScreen from '@/components/balloonRush/BalloonRushGameScreen';
import SurvivalRunPrepModal from '@/components/survival/SurvivalRunPrepModal';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';
import type { SurvivalCharacter } from '@/components/survival/SurvivalTypes';

const defaultClearConditions: ClearConditions = {
  count: 1,
  rank: 'S',
};

const parseClearConditions = (raw: string | null): ClearConditions => {
  if (!raw) {
    return defaultClearConditions;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ClearConditions>;
    return {
      ...defaultClearConditions,
      ...parsed,
    };
  } catch {
    return defaultClearConditions;
  }
};

type Screen = 'prep' | 'game';

const readHashParams = (): URLSearchParams => {
  const hash = getWindow().location.hash;
  const qIndex = hash.indexOf('?');
  return new URLSearchParams(qIndex >= 0 ? hash.slice(qIndex + 1) : '');
};

const BalloonRushMain: React.FC = () => {
  const { profile } = useAuthStore(state => ({ profile: state.profile }));
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  const [hashNonce, setHashNonce] = useState(0);
  useEffect(() => {
    const onHash = (): void => {
      setHashNonce(n => n + 1);
    };
    getWindow().addEventListener('hashchange', onHash);
    return () => getWindow().removeEventListener('hashchange', onHash);
  }, []);

  const params = useMemo(() => readHashParams(), [hashNonce]);

  const lessonContext = useMemo<LessonContext | null>(() => {
    const lessonId = params.get('lessonId');
    const lessonSongId = params.get('lessonSongId');
    if (!lessonId || !lessonSongId) {
      return null;
    }
    return {
      lessonId,
      lessonSongId,
      clearConditions: parseClearConditions(params.get('clearConditions')),
      sourceType: 'balloon_rush',
    };
  }, [params]);

  const stageIdFromUrl = params.get('stageId');

  const [screen, setScreen] = useState<Screen>('prep');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedStage, setResolvedStage] = useState<BalloonRushResolvedStage | null>(null);
  const [hintMode, setHintMode] = useState(false);
  const [gameNonce, setGameNonce] = useState(0);
  const [gameConfigOverride, setGameConfigOverride] = useState<DifficultyConfig | null>(null);
  const [lessonRandomChordOverrides, setLessonRandomChordOverrides] = useState<
    ReadonlyMap<string, ChordDefinition> | undefined
  >(undefined);

  const demoCharacter = useMemo((): SurvivalCharacter | null => {
    try {
      const w = getWindow() as unknown as { localStorage?: { getItem: (key: string) => string | null } };
      const raw = w.localStorage?.getItem('selectedCharacter');
      if (!raw) return null;
      return JSON.parse(raw) as SurvivalCharacter;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const stageIdTrimmed = typeof stageIdFromUrl === 'string' ? stageIdFromUrl.trim() : '';

      const missingId =
        stageIdTrimmed === ''
          ? isEnglishCopy
            ? 'Missing stage ID in URL.'
            : 'URL に stageId がありません。'
          : null;

      if (missingId !== null) {
        setResolvedStage(null);
        setError(missingId);
        setLoading(false);
        return;
      }

      try {
        const st = await fetchBalloonRushStageById(stageIdTrimmed);
        if (cancelled) return;
        if (!st?.id) {
          setResolvedStage(null);
          setError(
            isEnglishCopy ? 'Balloon rush stage could not be loaded.' : '風船ラッシュステージを読み込めませんでした。',
          );
        } else {
          setResolvedStage(st);
          setScreen(lessonContext ? 'prep' : 'game');
          setHintMode(false);
          setGameNonce(n => n + 1);
        }
      } catch {
        if (!cancelled) {
          setResolvedStage(null);
          setError(isEnglishCopy ? 'Failed to load stage.' : 'ステージ取得に失敗しました。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [stageIdFromUrl, lessonContext, isEnglishCopy]);

  useEffect(() => {
    let cancelled = false;
    const loadLessonRandomChords = async (): Promise<void> => {
      if (!lessonContext?.lessonSongId || !resolvedStage) {
        setGameConfigOverride(null);
        setLessonRandomChordOverrides(undefined);
        return;
      }
      try {
        const lessonSong = await fetchLessonSongById(lessonContext.lessonSongId);
        if (cancelled) return;
        const entries = parseSurvivalLessonRandomChords(lessonSong.survival_random_chords);
        const baseAllowed = resolveBalloonRushAllowedChordIds(resolvedStage);
        const applied = applyLessonRandomChords(
          baseAllowed,
          entries,
          resolvedStage.stageType,
        );
        const baseConfig = balloonRushDifficultyConfig(resolvedStage);
        setGameConfigOverride({
          ...baseConfig,
          allowedChords: applied.allowedChordIds.length > 0
            ? [...applied.allowedChordIds]
            : [...baseConfig.allowedChords],
        });
        setLessonRandomChordOverrides(
          applied.overrides.size > 0 ? applied.overrides : undefined,
        );
      } catch {
        if (!cancelled) {
          setGameConfigOverride(null);
          setLessonRandomChordOverrides(undefined);
        }
      }
    };
    void loadLessonRandomChords();
    return () => {
      cancelled = true;
    };
  }, [lessonContext?.lessonSongId, resolvedStage]);

  const handleBack = useCallback(() => {
    if (lessonContext) {
      getWindow().location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    getWindow().location.hash = '#lessons';
  }, [lessonContext]);

  const handleLessonClear = useCallback(async (): Promise<void> => {
    if (!lessonContext) return;
    await updateLessonRequirementProgress(
      lessonContext.lessonId,
      lessonContext.lessonSongId,
      'S',
      lessonContext.clearConditions,
      { sourceType: 'balloon_rush', lessonSongId: lessonContext.lessonSongId },
    );
  }, [lessonContext]);

  const prepStageDefinition = useMemo(
    () => (resolvedStage ? balloonRushToStageDefinition(resolvedStage) : null),
    [resolvedStage],
  );
  const prepLessonRuntime = useMemo(
    () => (resolvedStage ? balloonRushLessonRuntime(resolvedStage) : undefined),
    [resolvedStage],
  );

  if (loading) {
    return <LoadingScreen message={isEnglishCopy ? 'Loading balloon rush…' : '読み込み中…'} />;
  }

  if (error !== null || !resolvedStage) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
        <GameHeader />
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-6">
            <p className="mb-4 text-sm text-red-100">{error ?? ''}</p>
            <button type="button" onClick={handleBack} className="btn btn-primary">
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
        </div>
        <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
      </div>
    );
  }

  if (lessonContext !== null && screen === 'prep') {
    return (
      <>
        <GameHeader />
        <div
          className="relative flex min-h-screen items-center justify-center overflow-hidden fantasy-game-screen"
          style={{
            background:
              'radial-gradient(ellipse at top, #1b1228 0%, #0d0818 45%, #050309 100%)',
          }}
        >
          <SurvivalRunPrepModal
            isOpen
            variant="balloon_rush"
            stage={prepStageDefinition}
            lessonRuntime={prepLessonRuntime}
            isEnglishCopy={isEnglishCopy}
            initialHintMode={false}
            onCancel={handleBack}
            onConfirm={(hint) => {
              setHintMode(hint);
              setGameNonce(n => n + 1);
              setScreen('game');
            }}
          />
        </div>
        <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
      </>
    );
  }

  return (
    <>
      <BalloonRushGameScreen
        key={`${resolvedStage.slug}-${hintMode}-${gameNonce}`}
        stage={resolvedStage}
        hintMode={hintMode}
        character={demoCharacter}
        lessonContext={lessonContext}
        isEnglishCopy={isEnglishCopy}
        configOverride={gameConfigOverride ?? undefined}
        lessonRandomChordOverrides={lessonRandomChordOverrides}
        onLessonClear={handleLessonClear}
        onBack={handleBack}
      />
      <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
    </>
  );
};

export default BalloonRushMain;
