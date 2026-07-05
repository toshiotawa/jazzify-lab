import type { LessonRequirement } from '@/platform/supabaseLessonContent';
import { lessonSongHasInlineComposite, resolveLessonSurvivalMapCategory } from '@/utils/survivalLessonDisplay';

export type LessonRequirementLaunchInput = LessonRequirement & {
  is_fantasy?: boolean;
  is_survival?: boolean;
  is_survival_tutorial?: boolean;
  survival_tutorial_script_id?: string | null;
  is_ear_training_tutorial?: boolean;
  ear_training_tutorial_script_id?: string | null;
  survival_stage_number?: number;
  survival_map_category?: 'basic' | 'songs' | 'phrases' | 'lesson' | null;
  survival_composite_config?: Parameters<typeof lessonSongHasInlineComposite>[0];
  survival_lesson_overrides?: { bgmUrl?: string | null };
  is_ear_training?: boolean;
  is_balloon_rush?: boolean;
  balloon_rush_stage_id?: string | null;
  balloon_rush_stage?: { id?: string } | null;
  ear_training_stage?: { id?: string } | null;
  ear_training_stage_id?: string | null;
  fantasy_stage?: { id?: string } | null;
  fantasy_stage_id?: string | null;
};

/**
 * レッスン課題の「練習開始」ボタンと同じ起動先 hash を組み立てる。
 * 起動不能（ステージ未設定など）の場合は null。
 */
export function buildLessonRequirementLaunchHash(req: LessonRequirementLaunchInput): string | null {
  const isSurvivalTutorial = req.is_survival_tutorial === true;
  const isEarTrainingTutorial = req.is_ear_training_tutorial === true;
  const isSurvival = req.is_survival === true || isSurvivalTutorial;
  const isEarTraining = req.is_ear_training === true || isEarTrainingTutorial;
  const isBalloonRush = req.is_balloon_rush === true;
  const isFantasy = req.is_fantasy === true;

  if (isSurvivalTutorial) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('scriptId', req.survival_tutorial_script_id ?? 'onboarding-v1');
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    return `#survival-tutorial-lesson?${params.toString()}`;
  }

  if (isSurvival) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    const hasInlineComposite = lessonSongHasInlineComposite(req.survival_composite_config);
    if (!hasInlineComposite) {
      params.set('stageNumber', String(req.survival_stage_number ?? 0));
    }
    params.set(
      'mapCategory',
      resolveLessonSurvivalMapCategory(req.survival_map_category ?? undefined),
    );
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    return `#survival-lesson?${params.toString()}`;
  }

  if (isBalloonRush) {
    const stageId = req.balloon_rush_stage?.id ?? req.balloon_rush_stage_id ?? '';
    if (!stageId) {
      return null;
    }
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('stageId', stageId);
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    return `#balloon-rush-lesson?${params.toString()}`;
  }

  if (isFantasy) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('stageId', req.fantasy_stage?.id || req.fantasy_stage_id || '');
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    return `#fantasy?${params.toString()}`;
  }

  if (isEarTrainingTutorial) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('scriptId', req.ear_training_tutorial_script_id ?? 'developer-full-v1');
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    return `#ear-training-tutorial-lesson?${params.toString()}`;
  }

  if (isEarTraining) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('stageId', req.ear_training_stage?.id || req.ear_training_stage_id || '');
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    const lessonBgmUrl = req.survival_lesson_overrides?.bgmUrl?.trim();
    if (lessonBgmUrl && lessonBgmUrl.length > 0) {
      params.set('bgmUrl', lessonBgmUrl);
    }
    return `#ear-training-lesson?${params.toString()}`;
  }

  return null;
}
