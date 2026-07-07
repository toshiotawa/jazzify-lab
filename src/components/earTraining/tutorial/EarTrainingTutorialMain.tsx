import React, { useCallback, useMemo, useRef } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';

import { getAppRouteSearchParams } from '@/utils/appPaths';

import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import { recordAssignmentStartFireAndForget } from '@/utils/analytics/assignmentStarts';
import { EarTrainingLessonTutorialExperience } from './EarTrainingLessonTutorialExperience';

function parseRouteParams(): Record<string, string> {
  return Object.fromEntries(getAppRouteSearchParams(window.location));
}

const EarTrainingTutorialMain: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const params = useMemo(() => parseRouteParams(), []);

  const lessonId = params.lessonId ?? '';
  const lessonSongId = params.lessonSongId ?? '';
  const scriptId = params.scriptId ?? 'developer-full-v1';
  const clearedThisSessionRef = useRef(false);
  const assignmentStartRecordedRef = useRef(false);
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
        { sourceType: 'ear_training', lessonSongId },
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

  const handlePlayable = useCallback(() => {
    if (assignmentStartRecordedRef.current || !profile?.id || !lessonId || !lessonSongId) {
      return;
    }
    assignmentStartRecordedRef.current = true;
    recordAssignmentStartFireAndForget(profile.id, {
      lessonId,
      lessonSongId,
      isPractice: false,
    });
  }, [profile?.id, lessonId, lessonSongId]);

  return (
    <EarTrainingLessonTutorialExperience
      scriptId={scriptId}
      lessonId={lessonId}
      lessonSongId={lessonSongId}
      embeddedFullHeight
      onPlayable={handlePlayable}
      onLessonTutorialCompleted={handleTutorialCompleted}
      onExit={handleExit}
    />
  );
};

export default EarTrainingTutorialMain;
