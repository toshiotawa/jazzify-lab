import React, { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';
import { SurvivalTutorialExperience } from './SurvivalTutorialExperience';

function parseHashParams(): Record<string, string> {
  const raw = window.location.hash.split('?')[1] ?? '';
  return Object.fromEntries(new URLSearchParams(raw));
}

const SurvivalTutorialMain: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const params = useMemo(() => parseHashParams(), []);

  const lessonId = params.lessonId ?? '';
  const lessonSongId = params.lessonSongId ?? '';
  const scriptId = params.scriptId ?? 'onboarding-v1';
  const clearConditions: ClearConditions = useMemo(() => {
    try {
      return JSON.parse(params.clearConditions ?? '{"count":1,"rank":"S"}') as ClearConditions;
    } catch {
      return { count: 1, rank: 'S' };
    }
  }, [params.clearConditions]);

  const handleComplete = useCallback(async () => {
    if (!profile || !lessonId || !lessonSongId) return;
    try {
      await updateLessonRequirementProgress(
        lessonId,
        lessonSongId,
        clearConditions.rank ?? 'S',
        clearConditions,
        { sourceType: 'survival', lessonSongId },
      );
    } catch {
      /* ignore */
    }
  }, [profile, lessonId, lessonSongId, clearConditions]);

  const handleExit = useCallback(() => {
    if (lessonId) {
      window.location.hash = `#lesson-detail?id=${lessonId}`;
    } else {
      window.location.hash = '#lessons';
    }
  }, [lessonId]);

  return (
    <SurvivalTutorialExperience
      scriptId={scriptId}
      embeddedFullHeight
      showSkip
      onComplete={() => {
        void handleComplete();
        handleExit();
      }}
      ctaLabel={undefined}
    />
  );
};

export default SurvivalTutorialMain;
