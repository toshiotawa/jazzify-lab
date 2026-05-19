import React, { useCallback, useMemo } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';

import { EarTrainingLessonTutorialExperience } from './EarTrainingLessonTutorialExperience';

function parseHashParams(): Record<string, string> {
  const raw = window.location.hash.split('?')[1] ?? '';
  return Object.fromEntries(new URLSearchParams(raw));
}

const EarTrainingTutorialMain: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const params = useMemo(() => parseHashParams(), []);

  const lessonId = params.lessonId ?? '';
  const lessonSongId = params.lessonSongId ?? '';
  const scriptId = params.scriptId ?? 'developer-full-v1';
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
      await updateLessonRequirementProgress(
        lessonId,
        lessonSongId,
        clearConditions.rank ?? 'S',
        clearConditions,
        { sourceType: 'ear_training', lessonSongId },
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
    <EarTrainingLessonTutorialExperience
      scriptId={scriptId}
      embeddedFullHeight
      onLessonTutorialCompleted={handleTutorialCompleted}
      onExit={handleExit}
    />
  );
};

export default EarTrainingTutorialMain;
