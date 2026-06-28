import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import type { ClearConditions, EarTrainingStage } from '@/types';
import {
  fetchEarTrainingStages,
} from '@/platform/supabaseEarTraining';
import { fetchEarTrainingStageDetailCached } from '@/platform/earTrainingStageDetailCache';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { getWindow } from '@/platform';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import {
  EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA,
  getEarTrainingMainCopy,
} from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  resolveEarTrainingBattleEnemy,
  type EarTrainingBattleEnemy,
} from '@/utils/earTrainingBattleAvatar';
import { getAppRouteSearchParams } from '@/utils/appPaths';
interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
  bgmUrl?: string | null;
}

const EarTrainingGameScreen = React.lazy(() => import('./EarTrainingGameScreen'));
const EarTrainingChordVoicingScreen = React.lazy(() => import('./EarTrainingChordVoicingScreen'));
const EarTrainingChordQuizScreen = React.lazy(() => import('./EarTrainingChordQuizScreen'));
const EarTrainingChordOSMDScreen = React.lazy(() => import('./EarTrainingChordOSMDScreen'));
const EarTrainingAdlibScreen = React.lazy(() => import('./EarTrainingAdlibScreen'));
const EarTrainingPhrasePairAdlibScreen = React.lazy(() => import('./EarTrainingPhrasePairAdlibScreen'));

const defaultClearConditions: ClearConditions = {
  count: 1,
  rank: 'B',
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

const EarTrainingMain: React.FC = () => {
  const { profile } = useAuthStore(state => ({ profile: state.profile }));
  const geoCountry = useGeoStore(state => state.country);
  const audienceContext = useMemo(
    () => ({
      rank: profile?.rank,
      country: profile?.country ?? geoCountry,
      preferredLocale: profile?.preferred_locale,
    }),
    [profile?.rank, profile?.country, profile?.preferred_locale, geoCountry],
  );
  const isEnglishCopy = shouldUseEnglishCopy(audienceContext);
  const mainCopy = useMemo(() => getEarTrainingMainCopy(isEnglishCopy), [isEnglishCopy]);

  const [stage, setStage] = useState<EarTrainingStage | null>(null);
  const [stages, setStages] = useState<EarTrainingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stagePicked, setStagePicked] = useState(false);

  const params = useMemo(() => getAppRouteSearchParams(getWindow().location), []);
  const lessonContext = useMemo<EarTrainingLessonContext | null>(() => {
    const lessonId = params.get('lessonId');
    const lessonSongId = params.get('lessonSongId');
    if (!lessonId || !lessonSongId) {
      return null;
    }
    const bgmUrlRaw = params.get('bgmUrl');
    return {
      lessonId,
      lessonSongId,
      clearConditions: parseClearConditions(params.get('clearConditions')),
      bgmUrl: bgmUrlRaw && bgmUrlRaw.length > 0 ? bgmUrlRaw : null,
    };
  }, [params]);
  const initialPracticeMode = useMemo(
    () => params.get('practice') === '1',
    [params],
  );

  const [confirmedPracticeMode, setConfirmedPracticeMode] = useState(initialPracticeMode);
  const [earSessionNonce, setEarSessionNonce] = useState(0);

  useEffect(() => {
    if (lessonContext) {
      setConfirmedPracticeMode(initialPracticeMode);
      setEarSessionNonce(0);
    }
  }, [lessonContext?.lessonId, lessonContext?.lessonSongId, initialPracticeMode, lessonContext]);

  const effectivePracticeMode = lessonContext ? confirmedPracticeMode : initialPracticeMode;

  const handlePracticeModeRestartFromSettings = useCallback((nextPracticeMode: boolean) => {
    setConfirmedPracticeMode(nextPracticeMode);
    setEarSessionNonce(n => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const copy = getEarTrainingMainCopy(isEnglishCopy);
      try {
        const stageId = params.get('stageId');
        const [stageData, stageList] = await Promise.all([
          stageId ? fetchEarTrainingStageDetailCached(stageId) : Promise.resolve(null),
          stageId ? Promise.resolve<EarTrainingStage[]>([]) : fetchEarTrainingStages(),
        ]);

        if (cancelled) {
          return;
        }

        const selectedStage = stageData ?? stageList[0] ?? null;
        setStage(selectedStage);
        setStages(stageList);

        if (!selectedStage) {
          setError(copy.noStagesRegistered);
        }
      } catch (loadError) {
        if (!cancelled) {
          const raw = loadError instanceof Error ? loadError.message : '';
          const resolved = raw === EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA
            ? copy.stageNotFoundFromFetch
            : (raw || copy.loadFailedDefault);
          setError(resolved);
        }
      } finally {
        if (!cancelled) {
          if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark('ear-training:main-loaded');
          }
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isEnglishCopy, params]);

  const enemy = useMemo<EarTrainingBattleEnemy | null>(
    () => (stage ? resolveEarTrainingBattleEnemy(stage, isEnglishCopy) : null),
    [stage, isEnglishCopy],
  );

  const handleBack = useCallback(() => {
    if (lessonContext) {
      getWindow().location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    getWindow().location.hash = '#lessons';
  }, [lessonContext]);

  const handleLessonStageClear = useCallback(async (lessonRank: 'S' | 'A' | 'B' | 'C') => {
    if (!lessonContext) {
      return;
    }
    await updateLessonRequirementProgress(
      lessonContext.lessonId,
      lessonContext.lessonSongId,
      lessonRank,
      lessonContext.clearConditions,
      { sourceType: 'ear_training', lessonSongId: lessonContext.lessonSongId },
    );
  }, [lessonContext]);

  const lessonRestartProps =
    lessonContext !== null
      ? { onPracticeModeRestartFromSettings: handlePracticeModeRestartFromSettings }
      : {};

  if (loading) {
    return <LoadingScreen message={mainCopy.loading} />;
  }

  if (error || !stage) {
    return (
      <div className="flex h-[100dvh] flex-col bg-slate-950 text-white">
        <GameHeader />
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-6">
            <h1 className="mb-3 text-xl font-bold">{mainCopy.title}</h1>
            <p className="mb-4 text-sm text-red-100">{error ?? mainCopy.stageNotFound}</p>
            <button type="button" onClick={handleBack} className="btn btn-primary">
              {mainCopy.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!params.get('stageId') && stages.length > 1 && !stagePicked) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
        <GameHeader />
        <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto p-4">
          <h1 className="mb-4 text-2xl font-bold">{mainCopy.title}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {stages.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStage(item);
                  setStagePicked(true);
                }}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left hover:border-blue-400"
              >
                <div className="font-bold">{item.title}</div>
                <div className="mt-1 text-sm text-slate-400">{item.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage.mode === 'chord_voicing') {
    return (
      <React.Suspense key={`${stage.id}-${earSessionNonce}`} fallback={<LoadingScreen message={mainCopy.preparing} />}>
        <EarTrainingChordVoicingScreen
          stage={stage}
          enemy={enemy}
          lessonContext={lessonContext}
          initialPracticeMode={stage.chord_voicing_composite_phrase ? false : effectivePracticeMode}
          onLessonStageClear={handleLessonStageClear}
          onBack={handleBack}
          {...lessonRestartProps}
        />
      </React.Suspense>
    );
  }

  if (stage.mode === 'chord_quiz') {
    return (
      <React.Suspense key={`${stage.id}-${earSessionNonce}`} fallback={<LoadingScreen message={mainCopy.preparing} />}>
        <EarTrainingChordQuizScreen
          stage={stage}
          enemy={enemy}
          lessonContext={lessonContext}
          initialPracticeMode={effectivePracticeMode}
          onLessonStageClear={handleLessonStageClear}
          onBack={handleBack}
          {...lessonRestartProps}
        />
      </React.Suspense>
    );
  }

  if (stage.mode === 'chord_osmd') {
    return (
      <React.Suspense key={`${stage.id}-${earSessionNonce}`} fallback={<LoadingScreen message={mainCopy.preparing} />}>
        <EarTrainingChordOSMDScreen
          stage={stage}
          enemy={enemy}
          lessonContext={lessonContext}
          initialPracticeMode={effectivePracticeMode}
          onLessonStageClear={handleLessonStageClear}
          onBack={handleBack}
          {...lessonRestartProps}
        />
      </React.Suspense>
    );
  }

  if (stage.mode === 'adlib') {
    return (
      <React.Suspense key={`${stage.id}-${earSessionNonce}`} fallback={<LoadingScreen message={mainCopy.preparing} />}>
        <EarTrainingAdlibScreen
          stage={stage}
          enemy={enemy}
          lessonContext={lessonContext}
          initialPracticeMode={effectivePracticeMode}
          onLessonStageClear={handleLessonStageClear}
          onBack={handleBack}
          {...lessonRestartProps}
        />
      </React.Suspense>
    );
  }

  if (stage.mode === 'phrase_pair_adlib') {
    return (
      <React.Suspense key={`${stage.id}-${earSessionNonce}`} fallback={<LoadingScreen message={mainCopy.preparing} />}>
        <EarTrainingPhrasePairAdlibScreen
          stage={stage}
          enemy={enemy}
          lessonContext={lessonContext}
          initialPracticeMode={effectivePracticeMode}
          onLessonStageClear={handleLessonStageClear}
          onBack={handleBack}
          {...lessonRestartProps}
        />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense key={`${stage.id}-${earSessionNonce}`} fallback={<LoadingScreen message={mainCopy.preparing} />}>
      <EarTrainingGameScreen
        stage={stage}
        enemy={enemy}
        lessonContext={lessonContext}
        initialPracticeMode={effectivePracticeMode}
        onLessonStageClear={handleLessonStageClear}
        onBack={handleBack}
        {...lessonRestartProps}
      />
    </React.Suspense>
  );
};

export default EarTrainingMain;
