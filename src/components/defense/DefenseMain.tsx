/**
 * ディフェンス — レッスン課題専用エントリ（URL ハッシュから stage / lesson を解決）
 * `#defense-lesson?lessonId=&lessonSongId=&stageId=&clearConditions=`
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DefenseGameScreen } from '@/components/defense/DefenseGameScreen';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import type { DefenseDifficulty, DefenseStage } from '@/game/defense/defenseTypes';
import { unlockDefenseBackingAudioContext } from '@/game/defense/defenseBackingDeck';
import { getWindow } from '@/platform';
import {
  fetchDefenseDifficultyLevel,
  fetchDefenseStageDetail,
} from '@/platform/supabaseDefense';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import type { ClearConditions, LessonContext } from '@/types';
import { recordAssignmentStartFireAndForget } from '@/utils/analytics/assignmentStarts';
import { getAppRouteSearchParams } from '@/utils/appPaths';
import { cn } from '@/utils/cn';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { buildReturnFromAssignmentHash } from '@/utils/lessonNavigation';
import { markAudioUserInteraction } from '@/utils/MidiController';

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
    return { ...defaultClearConditions, ...parsed };
  } catch {
    return defaultClearConditions;
  }
};

interface LoadedStage {
  readonly stage: DefenseStage;
  readonly difficulty: DefenseDifficulty;
}

interface ActiveSession {
  readonly practiceMode: boolean;
  readonly nonce: number;
}

const DefenseMain: React.FC = () => {
  const profile = useAuthStore((state) => state.profile);
  const geoCountry = useGeoStore((state) => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  const params = useMemo(() => getAppRouteSearchParams(getWindow().location), []);
  const stageId = params.get('stageId')?.trim() ?? '';
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
      sourceType: 'defense',
    };
  }, [params]);

  const [loaded, setLoaded] = useState<LoadedStage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const lessonClearedThisSessionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      if (!stageId) {
        setError(isEnglishCopy ? 'Missing stage ID in URL.' : 'URL に stageId がありません。');
        setLoading(false);
        return;
      }
      try {
        const detail = await fetchDefenseStageDetail(stageId);
        if (cancelled) return;
        if (!detail || detail.phrases.length === 0) {
          setError(isEnglishCopy ? 'Defense stage could not be loaded.' : 'ディフェンスステージを読み込めませんでした。');
          return;
        }
        const difficulty = await fetchDefenseDifficultyLevel(detail.difficultyLevel);
        if (cancelled) return;
        if (!difficulty) {
          setError(isEnglishCopy ? 'Difficulty preset is missing.' : '難易度データが見つかりません。');
          return;
        }
        setLoaded({ stage: detail, difficulty });
      } catch {
        if (!cancelled) {
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
  }, [stageId, isEnglishCopy]);

  const handleBackToLesson = useCallback(() => {
    getWindow().location.hash = buildReturnFromAssignmentHash({
      lessonId: lessonContext?.lessonId,
      justClearedLessonSongId: lessonClearedThisSessionRef.current
        ? lessonContext?.lessonSongId
        : undefined,
    });
  }, [lessonContext]);

  const startSession = useCallback((practiceMode: boolean) => {
    markAudioUserInteraction();
    unlockDefenseBackingAudioContext();
    setSession((prev) => ({ practiceMode, nonce: (prev?.nonce ?? 0) + 1 }));
    if (!practiceMode && lessonContext && profile?.id) {
      recordAssignmentStartFireAndForget(profile.id, {
        lessonId: lessonContext.lessonId,
        lessonSongId: lessonContext.lessonSongId,
        isPractice: false,
      });
    }
  }, [lessonContext, profile?.id]);

  const handleRetry = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, nonce: prev.nonce + 1 } : prev));
  }, []);

  const handleExitGame = useCallback(() => {
    setSession(null);
  }, []);

  const handleLessonClear = useCallback(() => {
    if (!lessonContext) return;
    void updateLessonRequirementProgress(
      lessonContext.lessonId,
      lessonContext.lessonSongId,
      'S',
      lessonContext.clearConditions,
      { sourceType: 'defense', lessonSongId: lessonContext.lessonSongId },
    ).then((completed) => {
      if (completed) {
        lessonClearedThisSessionRef.current = true;
      }
    }).catch(() => undefined);
  }, [lessonContext]);

  if (session && loaded) {
    return (
      <DefenseGameScreen
        key={session.nonce}
        stage={loaded.stage}
        difficulty={loaded.difficulty}
        practiceMode={session.practiceMode}
        onExit={handleExitGame}
        onRetry={handleRetry}
        onClear={handleLessonClear}
      />
    );
  }

  const stageTitle = loaded
    ? (isEnglishCopy && loaded.stage.titleEn ? loaded.stage.titleEn : loaded.stage.title)
    : '';

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white">
      <GameHeader />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-bold">{isEnglishCopy ? 'Defense' : 'ディフェンス'}</h1>

        {loading && <LoadingScreen compact />}
        {error && (
          <p className="mt-4 rounded bg-red-900/40 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        {loaded && (
          <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <div className="font-semibold">{stageTitle}</div>
            <div className="mt-1 text-xs text-slate-400">
              Lv.{loaded.stage.difficultyLevel} / {loaded.stage.surviveSeconds}s / HP {loaded.stage.playerHp}
              {' / '}
              {isEnglishCopy
                ? `${loaded.stage.phrases.length} phrases × ${loaded.stage.requiredCompletionCount}`
                : `${loaded.stage.phrases.length}フレーズ × ${loaded.stage.requiredCompletionCount}回`}
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {isEnglishCopy
                ? 'Play the notated phrase in order to slash the frontmost enemy. Survive until the timer ends. Only performance mode counts toward the assignment.'
                : '譜面の音を順番に演奏すると、一番手前の敵を横一閃で攻撃します。タイマー終了まで生き残ればクリア。課題の達成は本番モードのみ記録されます。'}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm hover:bg-emerald-600"
                onClick={() => startSession(true)}
              >
                {isEnglishCopy ? 'Practice' : '練習'}
              </button>
              <button
                type="button"
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm hover:bg-indigo-600"
                onClick={() => startSession(false)}
              >
                {isEnglishCopy ? 'Performance' : '本番'}
              </button>
            </div>
          </section>
        )}

        <button
          type="button"
          className="mt-6 text-sm text-slate-400 underline hover:text-slate-200"
          onClick={handleBackToLesson}
        >
          {isEnglishCopy ? 'Back to quest' : 'クエストに戻る'}
        </button>
      </main>
    </div>
  );
};

export default DefenseMain;
