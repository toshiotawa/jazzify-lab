import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TrainingCalendarPage } from '@/components/training/TrainingCalendarPage';
import { TrainingGameScreen } from '@/components/training/TrainingGameScreen';
import { TrainingGoalListPage } from '@/components/training/TrainingGoalListPage';
import { TrainingGoalPage } from '@/components/training/TrainingGoalPage';
import { TrainingInfoModal } from '@/components/training/TrainingInfoModal';
import { TrainingList } from '@/components/training/TrainingList';
import { TrainingRanking } from '@/components/training/TrainingRanking';
import { TrainingRecordsPage } from '@/components/training/TrainingRecordsPage';
import { TrainingResult } from '@/components/training/TrainingResult';
import { TrainingRunPrepPanel } from '@/components/training/TrainingRunPrepPanel';
import { EnharmonicDisplaySection } from '@/components/settings/EnharmonicDisplaySection';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import { resolveActiveGoalSet, trainingGoalStageNumber } from '@/game/training/trainingGoalProgress';
import type { TrainingRow, TrainingUiText } from '@/game/training/trainingTypes';
import { meetsTrainingRankRequirement, scoreToTrainingRank, type TrainingLetterRank } from '@/game/training/trainingRank';
import {
  fetchMyTrainingGoalId,
  fetchMyTrainingSummary,
  fetchTrainingActivityDays,
  fetchTrainingById,
  fetchTrainingCatalog,
  fetchTrainingGoalSets,
  fetchTrainingUiTexts,
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
import { recordAssignmentStartFireAndForget } from '@/utils/analytics/assignmentStarts';
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
  const lessonReturnId = searchParams.get('lessonId')?.trim()
    ?? params.get('lessonId')?.trim()
    ?? '';
  const forcedGoalSetId = searchParams.get('goalSetId')?.trim() ?? '';
  const viewParam = searchParams.get('view');
  const trainingIdParam = searchParams.get('trainingId');
  const dateParam = searchParams.get('date');
  const monthParam = searchParams.get('month');

  const [screen, setScreen] = useState<Screen>(() => {
    if (viewParam === 'goal' || forcedGoalSetId) return 'goal';
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
  const [pageInfo, setPageInfo] = useState<TrainingUiText | null>(null);
  const [switchedGoalTitle, setSwitchedGoalTitle] = useState<string | null>(null);
  const [resumeTrainingId, setResumeTrainingId] = useState<string | null>(null);
  const lessonClearedRef = useRef(false);
  const [lessonTraining, setLessonTraining] = useState<TrainingRow | null>(null);
  const [lessonTrainingError, setLessonTrainingError] = useState<string | null>(null);

  const todayKey = useMemo(() => getLocalDateKey(new Date(), timezone), [timezone]);

  const reload = useCallback(async () => {
    invalidateTrainingCaches();
    const [catalog, summary, goals, myGoalId, activityDays, uiTexts] = await Promise.all([
      fetchTrainingCatalog(),
      profile?.id ? fetchMyTrainingSummary() : Promise.resolve([]),
      fetchTrainingGoalSets(),
      profile?.id ? fetchMyTrainingGoalId() : Promise.resolve(null),
      profile?.id ? fetchTrainingActivityDays(timezone) : Promise.resolve([]),
      fetchTrainingUiTexts().catch(() => [] as readonly TrainingUiText[]),
    ]);
    setCategories(catalog);
    setSummaryMap(new Map(summary.map((row) => [row.trainingId, row])));
    setGoalSets(goals);
    setSelectedGoalSetId(myGoalId);
    setActiveDays(activityDays);
    setPageInfo(uiTexts.find((row) => row.key === 'page_info') ?? null);
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
    if (forcedGoalSetId) {
      setScreen('goal');
      return;
    }
    if (viewParam === 'goal') setScreen('goal');
    else if (viewParam === 'goals') setScreen('goals');
    else if (viewParam === 'records') setScreen('records');
    else if (viewParam === 'calendar') setScreen('calendar');
    else if (!viewParam) setScreen('list');
  }, [viewParam, lessonContext, session, forcedGoalSetId]);

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

  const displayedGoalSet = useMemo(() => {
    if (forcedGoalSetId) {
      return goalSets.find((set) => set.id === forcedGoalSetId) ?? null;
    }
    return activeGoalSet;
  }, [activeGoalSet, forcedGoalSetId, goalSets]);

  const displayedGoalStageNumber = useMemo(
    () => (displayedGoalSet ? trainingGoalStageNumber(goalSets, displayedGoalSet.id) : 1),
    [displayedGoalSet, goalSets],
  );

  const activeGoalStageNumber = useMemo(
    () => (activeGoalSet ? trainingGoalStageNumber(goalSets, activeGoalSet.id) : 1),
    [activeGoalSet, goalSets],
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
    if (!lessonContext) {
      return undefined;
    }
    if (!forcedTrainingId) {
      setLessonTrainingError(
        isEnglish ? 'Training is not configured.' : 'トレーニングが設定されていません。',
      );
      return undefined;
    }
    if (loading) {
      return undefined;
    }

    const catalogTraining = findTraining(forcedTrainingId);
    if (catalogTraining) {
      setLessonTraining(catalogTraining);
      setLessonTrainingError(null);
      return undefined;
    }

    let cancelled = false;
    void fetchTrainingById(forcedTrainingId)
      .then((training) => {
        if (cancelled) {
          return;
        }
        if (!training) {
          setLessonTrainingError(
            isEnglish ? 'Training could not be loaded.' : 'トレーニングを読み込めませんでした。',
          );
          return;
        }
        setLessonTraining(training);
        setLessonTrainingError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setLessonTrainingError(
            isEnglish ? 'Failed to load training.' : 'トレーニングの取得に失敗しました。',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [forcedTrainingId, lessonContext, loading, findTraining, isEnglish]);

  const startLessonSession = useCallback((practiceMode: boolean) => {
    if (!lessonTraining) {
      return;
    }
    lessonClearedRef.current = false;
    setResumeTrainingId(lessonTraining.id);
    setSession({ training: lessonTraining, practiceMode, nonce: Date.now() });
    setScreen('game');
    if (lessonContext && profile?.id) {
      recordAssignmentStartFireAndForget(profile.id, {
        lessonId: lessonContext.lessonId,
        lessonSongId: lessonContext.lessonSongId,
        isPractice: practiceMode,
      });
    }
  }, [lessonTraining, lessonContext, profile?.id]);

  const handleSelectTraining = useCallback((trainingId: string, practiceMode: boolean) => {
    const training = findTraining(trainingId);
    if (!training) return;
    lessonClearedRef.current = false;
    setResumeTrainingId(trainingId);
    setSession({ training, practiceMode, nonce: Date.now() });
    setScreen('game');
  }, [findTraining]);

  const leaveLessonIfNeeded = useCallback(() => {
    if (lessonReturnId) {
      getWindow().location.hash = `#lesson-detail?id=${encodeURIComponent(lessonReturnId)}`;
      return true;
    }
    if (!lessonContext) {
      return false;
    }
    getWindow().location.hash = buildReturnFromAssignmentHash({
      lessonId: lessonContext.lessonId,
      justClearedLessonSongId: lessonClearedRef.current ? lessonContext.lessonSongId : undefined,
      searchParams: params,
    });
    return true;
  }, [lessonContext, lessonReturnId, params]);

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

  useEffect(() => {
    if (screen !== 'list' && screen !== 'game' && screen !== 'result') {
      setResumeTrainingId(null);
    }
  }, [screen]);

  const handleSelectGoal = useCallback(async (goalSetId: string) => {
    const nextGoalSet = goalSets.find((set) => set.id === goalSetId);
    await setMyTrainingGoal(goalSetId);
    setSelectedGoalSetId(goalSetId);
    if (nextGoalSet) {
      setSwitchedGoalTitle(isEnglish ? nextGoalSet.titleEn : nextGoalSet.titleJa);
    }
    openView('goal');
  }, [goalSets, isEnglish, openView]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col bg-slate-950">
      {screen !== 'game' && <GameHeader />}
      {screen === 'list' && lessonContext && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="mx-auto max-w-lg px-4 py-6">
            <h1 className="text-2xl font-bold">{isEnglish ? 'Training' : 'トレーニング'}</h1>
            {lessonTrainingError && (
              <p className="mt-4 rounded bg-red-900/40 px-3 py-2 text-sm text-red-200">
                {lessonTrainingError}
              </p>
            )}
            {lessonTraining && (
              <div className="mt-6">
                <TrainingRunPrepPanel
                  training={lessonTraining}
                  isEnglish={isEnglish}
                  onStartPractice={() => startLessonSession(true)}
                  onStartPerformance={() => startLessonSession(false)}
                />
              </div>
            )}
            {!lessonTraining && !lessonTrainingError && (
              <LoadingScreen compact />
            )}
            <button
              type="button"
              className="mt-6 text-sm text-slate-400 underline hover:text-slate-200"
              onClick={() => {
                leaveLessonIfNeeded();
              }}
            >
              {isEnglish ? 'Back to quest' : 'クエストに戻る'}
            </button>
          </div>
        </div>
      )}
      {screen === 'list' && !lessonContext && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingList
            categories={categories}
            summaryByTrainingId={summaryMap}
            activeGoalSet={activeGoalSet}
            goalStageNumber={activeGoalStageNumber}
            lastPlayedTrainingId={resumeTrainingId}
            todayKey={todayKey}
            activeDays={activeDays}
            pageInfo={pageInfo}
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
      {screen === 'goal' && displayedGoalSet && (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TrainingGoalPage
            goalSet={displayedGoalSet}
            stageNumber={displayedGoalStageNumber}
            summaryByTrainingId={summaryMap}
            trainingById={trainingById}
            isEnglish={isEnglish}
            onBack={() => {
              if (lessonReturnId) {
                getWindow().location.hash = `#lesson-detail?id=${encodeURIComponent(lessonReturnId)}`;
                return;
              }
              openView('list');
            }}
            onOpenGoals={forcedGoalSetId ? undefined : () => openView('goals')}
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
              setSession(null);
              setScreen('list');
            }}
          />
        </div>
      )}
      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglish} source="training" />
      {switchedGoalTitle && (
        <TrainingInfoModal
          title={isEnglish ? 'Goal set switched' : '目標セットを切り替えました'}
          description={
            isEnglish
              ? `Switched to "${switchedGoalTitle}".`
              : `目標セットを「${switchedGoalTitle}」に切り替えました。`
          }
          onClose={() => setSwitchedGoalTitle(null)}
        />
      )}
    </div>
  );
};

export default TrainingMain;
