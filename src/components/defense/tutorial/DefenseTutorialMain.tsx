import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import {
  DefenseTutorial,
  type DefenseTutorialLessonContext,
} from '@/components/defense/tutorial/DefenseTutorial';
import { getWindow } from '@/platform';
import type { ClearConditions } from '@/types';
import { getAppRouteSearchParams, APP_BASE_PATH } from '@/utils/appPaths';
import { buildReturnFromAssignmentHash } from '@/utils/lessonNavigation';

const defaultClearConditions: ClearConditions = {
  count: 1,
  rank: 'C',
};

const isNotationSetting = (
  value: unknown,
): value is NonNullable<ClearConditions['notation_setting']> =>
  value === 'notes_chords' || value === 'chords_only' || value === 'both';

const readFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const parseClearConditions = (raw: string | null): ClearConditions => {
  if (!raw) {
    return defaultClearConditions;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultClearConditions;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return defaultClearConditions;
  }
  const fields = new Map<string, unknown>(Object.entries(parsed));
  const count = readFiniteNumber(fields.get('count'));
  const key = readFiniteNumber(fields.get('key'));
  const speed = readFiniteNumber(fields.get('speed'));
  const dailyCount = readFiniteNumber(fields.get('daily_count'));
  const rankValue = fields.get('rank');
  const requiresDays = fields.get('requires_days');
  const notation = fields.get('notation_setting');
  return {
    ...defaultClearConditions,
    ...(count !== undefined ? { count } : {}),
    ...(key !== undefined ? { key } : {}),
    ...(speed !== undefined ? { speed } : {}),
    ...(dailyCount !== undefined ? { daily_count: dailyCount } : {}),
    ...(typeof rankValue === 'string' ? { rank: rankValue } : {}),
    ...(typeof requiresDays === 'boolean' ? { requires_days: requiresDays } : {}),
    ...(isNotationSetting(notation) ? { notation_setting: notation } : {}),
  };
};

const DefenseTutorialMain: React.FC = () => {
  const navigate = useNavigate();
  const params = useMemo(() => getAppRouteSearchParams(getWindow().location), []);
  const lessonContext = useMemo<DefenseTutorialLessonContext | null>(() => {
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

  const handleExit = (): void => {
    if (lessonContext) {
      getWindow().location.hash = buildReturnFromAssignmentHash({
        lessonId: lessonContext.lessonId,
      });
      return;
    }
    navigate(`${APP_BASE_PATH}/play`);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
      <GameHeader />
      <DefenseTutorial lessonContext={lessonContext} onExit={handleExit} />
    </div>
  );
};

export default DefenseTutorialMain;
