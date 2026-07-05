import React, { useCallback, useMemo, useRef } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';

import { getAppRouteSearchParams } from '@/utils/appPaths';

import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import { SurvivalLessonTutorialExperience } from './SurvivalLessonTutorialExperience';

function parseRouteParams(): Record<string, string> {
  return Object.fromEntries(getAppRouteSearchParams(window.location));
}

const SurvivalTutorialMain: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const params = useMemo(() => parseRouteParams(), []);

  const lessonId = params.lessonId ?? '';
  const lessonSongId = params.lessonSongId ?? '';
  const scriptId = params.scriptId ?? 'onboarding-v1';
  const clearedThisSessionRef = useRef(false);
  const clearConditions: ClearConditions = useMemo(() => {
    try {
      return JSON.parse(params.clearConditions ?? '{"count":1,"rank":"S"}') as ClearConditions;
    } catch {
      return { count: 1, rank: 'S' };
    }
  }, [params.clearConditions]);

  const handleTutorialCompleted = useCallback(async () => {
    if (!profile || !lessonId || !lessonSongId) return;
    try {
      const completed = await updateLessonRequirementProgress(
        lessonId,
        lessonSongId,
        clearConditions.rank ?? 'S',
        clearConditions,
        { sourceType: 'survival', lessonSongId },
      );
      if (completed) {
        clearedThisSessionRef.current = true;
      }
    } catch {
      /* ignore */
    }
  }, [profile, lessonId, lessonSongId, clearConditions]);

  const handleExit = useCallback(() => {
    if (lessonId) {
      window.location.hash = buildLessonDetailHash(lessonId, {
        justCleared: clearedThisSessionRef.current ? lessonSongId : undefined,
      });
    } else {
      window.location.hash = '#lessons';
    }
  }, [lessonId, lessonSongId]);

  return (
    <SurvivalLessonTutorialExperience
      scriptId={scriptId}
      embeddedFullHeight
      showSkip={false}
      onLessonTutorialCompleted={handleTutorialCompleted}
      onExit={handleExit}
    />
  );
};

export default SurvivalTutorialMain;
