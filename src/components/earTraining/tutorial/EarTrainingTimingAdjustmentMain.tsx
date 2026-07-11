import React, { useCallback, useMemo, useRef } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';
import { getAppRouteSearchParams } from '@/utils/appPaths';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import {
  parseEarTrainingTimingAdjustmentReturnHash,
  type EarTrainingTimingAdjustmentEntry,
} from '@/utils/earTrainingTimingAdjustmentLaunch';
import { setAppHash } from '@/utils/appNavigation';

import { EarTrainingTimingAdjustmentExperience } from './EarTrainingTimingAdjustmentExperience';

function parseRouteParams(): Record<string, string> {
  return Object.fromEntries(getAppRouteSearchParams(window.location));
}

const EarTrainingTimingAdjustmentMain: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const params = useMemo(() => parseRouteParams(), []);

  const entry = (params.entry === 'settings' ? 'settings' : 'quest') as EarTrainingTimingAdjustmentEntry;
  const lessonId = params.lessonId ?? '';
  const lessonSongId = params.lessonSongId ?? '';
  const clearedThisSessionRef = useRef(false);
  const clearConditions: ClearConditions = useMemo(() => {
    try {
      return JSON.parse(params.clearConditions ?? '{"count":1,"rank":"S"}') as ClearConditions;
    } catch {
      return { count: 1, rank: 'S' };
    }
  }, [params.clearConditions]);

  const handleQuestCompleted = useCallback(async () => {
    if (entry !== 'quest' || !profile || !lessonId || !lessonSongId) return;
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
  }, [clearConditions, entry, lessonId, lessonSongId, profile]);

  const handleExit = useCallback(() => {
    if (entry === 'settings') {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          searchParams.set(key, value);
        }
      }
      const returnHash = parseEarTrainingTimingAdjustmentReturnHash(searchParams);
      if (returnHash) {
        setAppHash(returnHash);
        return;
      }
    }
    if (lessonId) {
      window.location.hash = buildLessonDetailHash(lessonId, {
        justCleared: clearedThisSessionRef.current ? lessonSongId : undefined,
      });
    } else {
      window.location.hash = '#lessons';
    }
  }, [entry, lessonId, lessonSongId, params]);

  return (
    <EarTrainingTimingAdjustmentExperience
      entry={entry}
      lessonId={lessonId}
      lessonSongId={lessonSongId}
      embeddedFullHeight
      onQuestCompleted={entry === 'quest' ? handleQuestCompleted : undefined}
      onExit={handleExit}
    />
  );
};

export default EarTrainingTimingAdjustmentMain;
