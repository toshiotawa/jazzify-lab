import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';

import { fetchSurvivalTutorialV4Manifest } from './fetchSurvivalTutorialScript';
import { SurvivalLessonTutorialExperience } from './SurvivalLessonTutorialExperience';
import { SurvivalTutorialV4Player } from './v4/SurvivalTutorialV4Player';
import type { SurvivalTutorialV4Manifest } from './v4/survivalTutorialV4Types';

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

  const [v4Manifest, setV4Manifest] = useState<SurvivalTutorialV4Manifest | null>(null);
  const [v4Resolved, setV4Resolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setV4Resolved(false);
    void fetchSurvivalTutorialV4Manifest(scriptId)
      .then((manifest) => {
        if (!cancelled) {
          setV4Manifest(manifest);
          setV4Resolved(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setV4Manifest(null);
          setV4Resolved(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scriptId]);

  const handleTutorialCompleted = useCallback(async () => {
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

  if (!v4Resolved) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white/70">
        Loading…
      </div>
    );
  }

  if (v4Manifest) {
    return (
      <SurvivalTutorialV4Player
        manifest={v4Manifest}
        onExit={handleExit}
        onCompleted={handleTutorialCompleted}
      />
    );
  }

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
