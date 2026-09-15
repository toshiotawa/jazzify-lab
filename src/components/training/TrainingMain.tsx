import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TrainingCalendarPage } from '@/components/training/TrainingCalendarPage';
import { TrainingGameScreen } from '@/components/training/TrainingGameScreen';
import { TrainingGoalListPage } from '@/components/training/TrainingGoalListPage';
import { TrainingGoalPage } from '@/components/training/TrainingGoalPage';
import { TrainingList } from '@/components/training/TrainingList';
import { TrainingRanking } from '@/components/training/TrainingRanking';
import { TrainingRecordsPage } from '@/components/training/TrainingRecordsPage';
import { TrainingResult } from '@/components/training/TrainingResult';
import { EnharmonicDisplaySection } from '@/components/settings/EnharmonicDisplaySection';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import { resolveActiveGoalSet } from '@/game/training/trainingGoalProgress';
import type { TrainingRow } from '@/game/training/trainingTypes';
import { meetsTrainingRankRequirement, scoreToTrainingRank, type TrainingLetterRank } from '@/game/training/trainingRank';
import {
  fetchMyTrainingGoalId,
  fetchMyTrainingSummary,
  fetchTrainingActivityDays,
  fetchTrainingCatalog,
  fetchTrainingGoalSets,
  invalidateTrainingCaches,
  setMyTrainingGoal,
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
import { getLocalDateKey, resolveUserTimezone } from '@/utils/trainingActivity';

type Screen = 'list' | 'goal' | 'goals' | 'records' | 'calendar' | 'ranking' | 'game' | 'result';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const isEnglish = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const isPremium = isPremiumTier(profile?.rank);
  const timezone = resolveUserTimezone(profile);

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
  const viewParam = searchParams.get('view');
  const trainingIdParam = searchParams.get('trainingId');
  const dateParam = searchParams.get('date');
  const monthParam = searchParams.get('month');

  const [screen, setScreen] = useState<Screen>(() => {
    if (viewParam === 'goal') return 'goal';
    if (viewParam === 'goals') return 'goals';
    if (viewParam === 'records') return 'records';
    if (viewParam === 'calendar') return 'calendar';
    return 'list';
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof fetchTrainingCatalog>>>([]);
  const [goalSets, setGoalSets] = useState<Awaited<ReturnType<typeof fetchTrainingGoalSets>>>([]);
  const [selectedGoalSetId, setSelectedGoalSetId] = useState<string | null>(null);
  const [activeDays, setActiveDays] = useState<readonly string[]>([]);
  const [summaryMap, setSummaryMap] = useState<Map<string, Awaited<ReturnType<typeof fetchMyTrainingSummary>>[number]>>(new Map());
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const lessonClearedRef = useRef(false);

  const todayKey = useMemo(() => getLocalDateKey(new Date(), timezone), [timezone]);

  const reload = useCallback(async () => {
    invalidateTrainingCaches();
    const [catalog, summary, goals, myGoalId, activityDays] = await Promise.all([
      fetchTrainingCatalog(),
      profile?.id ? fetchMyTrainingSummary() : Promise.resolve([]),
      fetchTrainingGoalSets(),
      profile?.id ? fetchMyTrainingGoalId() : Promise.resolve(null),
      profile?.id ? fetchTrainingActivityDays(timezone) : Promise.resolve([]),
    ]);
    setCategories(catalog);
    setSummaryMap(new Map(summary.map((row) => [row.trainingId, row])));
    setGoalSets(goals);
    setSelectedGoalSetId(myGoalId);
    setActiveDays(activityDays);
  }, [profile?.id, timezone]);

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

  useEffect(() => {
    if (lessonContext || session) return;
    if (viewParam === 'goal') setScreen('goal');
    else if (viewParam === 'goals') setScreen('goals');
    else if (viewParam === 'records') setScreen('records');
    else if (viewParam === 'calendar') setScreen('calendar');
    else if (!viewParam) setScreen('list');
  }, [viewParam, lessonContext, session]);

  const allTrainings = useMemo(
    () => categories.flatMap((category) => category.trainings),
    [categories],
  );

  const trainingById = useMemo(
    () => new Map(allTrainings.map((training) => [training.id, training])),
    [allTrainings],
  );

  const categoryFreeByTrainingId = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const category of categories) {
      for (const training of category.trainings) {
        map.set(training.id, category.isFree);
      }
    }
    return map;
  }, [categories]);

  const isTrainingLocked = useCallback((trainingId: string): boolean => {
    const isFree = categoryFreeByTrainingId.get(trainingId) ?? false;
    return !isFree && !isPremium;
  }, [categoryFreeByTrainingId, isPremium]);

  const activeGoalSet = useMemo(
    () => resolveActiveGoalSet(goalSets, selectedGoalSetId),
    [goalSets, selectedGoalSetId],
  );

  const findTraining = useCallback((trainingId: string): TrainingRow | null => (
    allTrainings.find((training) => training.id === trainingId) ?? null
  ), [allTrainings]);

  const updateViewParams = useCallback((next: Record<string, string | null>) => {
    const paramsCopy = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === '') paramsCopy.delete(key);
      else paramsCopy.set(key, value);
    });
    setSearchParams(paramsCopy);
  }, [searchParams, setSearchParams]);

  const openView = useCallback((view: Screen, extra: Record<string, string | null> = {}) => {
    setScreen(view);
    if (view === 'list' || view === 'game' || view === 'result' || view === 'ranking') {
      updateViewParams({ view: null, trainingId: null, date: null, month: null, ...extra });
      return;
    }
    updateViewParams({ view, ...extra });
  }, [updateViewParams]);

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
      if (meetsTrainingRankRequirement(score, requiredRank, session.training.kind)) {
        lessonClearedRef.current = true;
        void updateLessonRequirementProgress(
          lessonContext.lessonId,
          lessonContext.lessonSongId,
          scoreToTrainingRank(score, session.training.kind),
          lessonContext.clearConditions ?? { count: 1, rank: 'C' },
          { sourceType: 'training', lessonSongId: lessonContext.lessonSongId },
        );
      }
    }
    void reload();
  }, [lessonContext, session, reload]);

  const handleSelectGoal = useCallback(async (goalSetId: string) => {
    await setMyTrainingGoal(goalSetId);
    setSelectedGoalSetId(goalSetId);
    openView('goal');
  }, [openView]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col bg-slate-950">
      {screen !== 'game' && <GameHeader />}
      {screen === 'list' && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingList
            categories={categories}
            summaryByTrainingId={summaryMap}
            activeGoalSet={activeGoalSet}
            todayKey={todayKey}
            activeDays={activeDays}
            isPremium={isPremium}
            isEnglish={isEnglish}
            onSelectTraining={handleSelectTraining}
            onOpenRanking={() => setScreen('ranking')}
            onOpenGoal={() => openView('goal')}
            onOpenRecords={(trainingId) => openView('records', { trainingId })}
            onOpenCalendar={(dateKey) => openView('calendar', { date: dateKey })}
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
      {screen === 'goal' && activeGoalSet && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingGoalPage
            goalSet={activeGoalSet}
            summaryByTrainingId={summaryMap}
            trainingById={trainingById}
            isEnglish={isEnglish}
            onBack={() => openView('list')}
            onOpenGoals={() => openView('goals')}
            onSelectTraining={handleSelectTraining}
            onOpenRecords={(trainingId) => openView('records', { trainingId })}
            onLocked={() => setShowPaywall(true)}
            isTrainingLocked={isTrainingLocked}
          />
        </div>
      )}
      {screen === 'goals' && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingGoalListPage
            goalSets={goalSets}
            activeGoalSetId={selectedGoalSetId}
            summaryByTrainingId={summaryMap}
            isEnglish={isEnglish}
            onBack={() => openView('goal')}
            onSelectGoal={(goalSetId) => { void handleSelectGoal(goalSetId); }}
          />
        </div>
      )}
      {screen === 'records' && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingRecordsPage
            trainings={allTrainings}
            initialTrainingId={trainingIdParam}
            timezone={timezone}
            isEnglish={isEnglish}
            initialMonthKey={monthParam}
            onBack={() => openView(activeGoalSet ? 'goal' : 'list')}
            onTrainingChange={(trainingId) => updateViewParams({ trainingId })}
            onMonthChange={(monthKey) => updateViewParams({ month: monthKey })}
          />
        </div>
      )}
      {screen === 'calendar' && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingCalendarPage
            trainings={allTrainings}
            trainingById={trainingById}
            activeDays={activeDays}
            timezone={timezone}
            initialDateKey={dateParam ?? todayKey}
            isEnglish={isEnglish}
            onBack={() => openView('list')}
          />
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
            trainingKind={session.training.kind}
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
