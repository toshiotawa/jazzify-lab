import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import type { ClearConditions, EarTrainingStage } from '@/types';
import { fetchEarTrainingStageById, fetchEarTrainingStages } from '@/platform/supabaseEarTraining';
import { fetchSurvivalCharacters, SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { getWindow } from '@/platform';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import {
  EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA,
  getEarTrainingMainCopy,
} from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

const EarTrainingGameScreen = React.lazy(() => import('./EarTrainingGameScreen'));

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

const getParamsFromHash = (): URLSearchParams => {
  const hash = getWindow().location.hash;
  return new URLSearchParams(hash.split('?')[1] ?? '');
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
  const [enemy, setEnemy] = useState<SurvivalCharacterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stagePicked, setStagePicked] = useState(false);

  const params = useMemo(() => getParamsFromHash(), []);
  const lessonContext = useMemo<EarTrainingLessonContext | null>(() => {
    const lessonId = params.get('lessonId');
    const lessonSongId = params.get('lessonSongId');
    if (!lessonId || !lessonSongId) {
      return null;
    }
    return {
      lessonId,
      lessonSongId,
      clearConditions: parseClearConditions(params.get('clearConditions')),
    };
  }, [params]);
  const initialPracticeMode = useMemo(() => params.get('practice') === '1', [params]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const copy = getEarTrainingMainCopy(isEnglishCopy);
      try {
        const stageId = params.get('stageId');
        const [stageData, stageList, characters] = await Promise.all([
          stageId ? fetchEarTrainingStageById(stageId) : Promise.resolve(null),
          stageId ? Promise.resolve([]) : fetchEarTrainingStages(),
          fetchSurvivalCharacters(),
        ]);

        if (cancelled) {
          return;
        }

        const selectedStage = stageData ?? stageList[0] ?? null;
        setStage(selectedStage);
        setStages(stageList);
        if (characters.length > 0) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          setEnemy(characters[randomIndex] ?? null);
        }

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
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isEnglishCopy, params]);

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

  return (
    <React.Suspense fallback={<LoadingScreen message={mainCopy.preparing} />}>
      <EarTrainingGameScreen
        stage={stage}
        enemy={enemy}
        lessonContext={lessonContext}
        initialPracticeMode={initialPracticeMode}
        onLessonStageClear={handleLessonStageClear}
        onBack={handleBack}
      />
    </React.Suspense>
  );
};

export default EarTrainingMain;
