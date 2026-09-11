import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TrainingGameScreen } from '@/components/training/TrainingGameScreen';
import { TrainingList } from '@/components/training/TrainingList';
import { TrainingRanking } from '@/components/training/TrainingRanking';
import { TrainingResult } from '@/components/training/TrainingResult';
import { EnharmonicDisplaySection } from '@/components/settings/EnharmonicDisplaySection';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import type { TrainingRow } from '@/game/training/trainingTypes';
import { meetsTrainingRankRequirement, scoreToTrainingRank, type TrainingLetterRank } from '@/game/training/trainingRank';
import {
  fetchMyTrainingSummary,
  fetchTrainingCatalog,
  invalidateTrainingCaches,
} from '@/platform/supabaseTraining';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import type { ClearConditions, LessonContext } from '@/types';
import { getAppRouteSearchParams } from '@/utils/appPaths';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { isPremiumTier } from '@/utils/membership';
import { getWindow } from '@/platform';
import { buildReturnFromAssignmentHash } from '@/utils/lessonNavigation';

type Screen = 'list' | 'ranking' | 'game' | 'result';

interface ActiveSession {
  readonly training: TrainingRow;
  readonly practiceMode: boolean;
  readonly nonce: number;
}

const parseClearConditions = (raw: string | null): ClearConditions => ({
  count: 1,
  rank: 'C',
  ...(raw ? JSON.parse(raw) as Partial<ClearConditions> : {}),
});

const TrainingMain: React.FC = () => {
  const profile = useAuthStore((state) => state.profile);
  const geoCountry = useGeoStore((state) => state.country);
  const isEnglish = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const isPremium = isPremiumTier(profile?.rank);

  const params = useMemo(() => getAppRouteSearchParams(getWindow().location), []);
  const lessonContext = useMemo<LessonContext | null>(() => {
    const lessonId = params.get('lessonId');
    const lessonSongId = params.get('lessonSongId');
    if (!lessonId || !lessonSongId) return null;
    try {
      return {
        lessonId,
        lessonSongId,
        clearConditions: parseClearConditions(params.get('clearConditions')),
        sourceType: 'training',
      };
    } catch {
      return null;
    }
  }, [params]);

  const forcedTrainingId = params.get('trainingId')?.trim() ?? '';

  const [screen, setScreen] = useState<Screen>('list');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof fetchTrainingCatalog>>>([]);
  const [summaryMap, setSummaryMap] = useState<Map<string, Awaited<ReturnType<typeof fetchMyTrainingSummary>>[number]>>(new Map());
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const lessonClearedRef = useRef(false);

  const reload = useCallback(async () => {
    invalidateTrainingCaches();
    const [catalog, summary] = await Promise.all([
      fetchTrainingCatalog(),
      profile?.id ? fetchMyTrainingSummary() : Promise.resolve([]),
    ]);
    setCategories(catalog);
    setSummaryMap(new Map(summary.map((row) => [row.trainingId, row])));
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;
    void reload()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const allTrainings = useMemo(
    () => categories.flatMap((category) => category.trainings),
    [categories],
  );

  const findTraining = useCallback((trainingId: string): TrainingRow | null => (
    allTrainings.find((training) => training.id === trainingId) ?? null
  ), [allTrainings]);

  useEffect(() => {
    if (!forcedTrainingId || loading) return;
    const training = findTraining(forcedTrainingId);
    if (training) {
      setSession({ training, practiceMode: false, nonce: Date.now() });
      setScreen('game');
    }
  }, [forcedTrainingId, loading, findTraining]);

  const handleSelectTraining = useCallback((trainingId: string, practiceMode: boolean) => {
    const training = findTraining(trainingId);
    if (!training) return;
    lessonClearedRef.current = false;
    setSession({ training, practiceMode, nonce: Date.now() });
    setScreen('game');
  }, [findTraining]);

  const leaveLessonIfNeeded = useCallback(() => {
    if (!lessonContext) {
      return false;
    }
    getWindow().location.hash = buildReturnFromAssignmentHash({
      lessonId: lessonContext.lessonId,
      justClearedLessonSongId: lessonClearedRef.current ? lessonContext.lessonSongId : undefined,
      searchParams: params,
    });
    return true;
  }, [lessonContext, params]);

  const handleFinished = useCallback((score: number) => {
    setFinalScore(score);
    setScreen('result');
    if (lessonContext && session && !session.practiceMode) {
      const requiredRank = (lessonContext.clearConditions?.rank ?? 'C') as TrainingLetterRank;
      if (meetsTrainingRankRequirement(score, requiredRank)) {
        lessonClearedRef.current = true;
        void updateLessonRequirementProgress(
          lessonContext.lessonId,
          lessonContext.lessonSongId,
          scoreToTrainingRank(score),
          lessonContext.clearConditions ?? { count: 1, rank: 'C' },
          { sourceType: 'training', lessonSongId: lessonContext.lessonSongId },
        );
      }
    }
    void reload();
  }, [lessonContext, session, reload]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col bg-slate-950">
      <GameHeader />
      {screen === 'list' && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingList
            categories={categories}
            summaryByTrainingId={summaryMap}
            isPremium={isPremium}
            isEnglish={isEnglish}
            onSelectTraining={handleSelectTraining}
            onOpenRanking={() => setScreen('ranking')}
            onLocked={() => setShowPaywall(true)}
          />
          <div className="mx-auto max-w-3xl px-4 pb-8">
            <button
              type="button"
              className="text-sm text-indigo-300 underline"
              onClick={() => setShowSettings((prev) => !prev)}
            >
              {isEnglish ? 'Display settings' : '表示設定'}
            </button>
            {showSettings && (
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
                <EnharmonicDisplaySection isEnglishCopy={isEnglish} />
              </div>
            )}
          </div>
        </div>
      )}
      {screen === 'ranking' && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingRanking
            categories={categories}
            isEnglish={isEnglish}
            onBack={() => setScreen('list')}
          />
        </div>
      )}
      {screen === 'game' && session && (
        <TrainingGameScreen
          key={session.nonce}
          training={session.training}
          practiceMode={session.practiceMode}
          onFinished={handleFinished}
          onExit={() => {
            if (leaveLessonIfNeeded()) {
              return;
            }
            setSession(null);
            setScreen('list');
          }}
        />
      )}
      {screen === 'result' && session && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingResult
            trainingTitle={isEnglish ? session.training.titleEn : session.training.titleJa}
            trainingId={session.training.id}
            score={finalScore}
            practiceMode={session.practiceMode}
            onRetry={() => {
              setSession({ ...session, nonce: Date.now() });
              setScreen('game');
            }}
            onRanking={() => {
              setSession(null);
              setScreen('ranking');
            }}
            onExit={() => {
              if (leaveLessonIfNeeded()) {
                return;
              }
              setSession(null);
              setScreen('list');
            }}
          />
        </div>
      )}
      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglish} source="training" />
    </div>
  );
};

export default TrainingMain;
