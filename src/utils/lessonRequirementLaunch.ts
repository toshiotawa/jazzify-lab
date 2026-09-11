import type { LessonRequirement } from '@/platform/supabaseLessonContent';
import { OSMD_TIMING_ADJUSTMENT_SCRIPT_ID } from '@/components/earTraining/tutorial/buildOsmdTimingAdjustmentV1Script';
import { buildEarTrainingTimingAdjustmentHash } from '@/utils/earTrainingTimingAdjustmentLaunch';
import { lessonSongHasInlineComposite, resolveLessonSurvivalMapCategory } from '@/utils/survivalLessonDisplay';

type LessonRequirementPlayMapContext = {
  playMapNodeId?: string;
  playMapMode?: 'code_run' | 'defense';
};

const appendPlayMapContext = (
  params: URLSearchParams,
  playMap?: LessonRequirementPlayMapContext,
): void => {
  if (playMap?.playMapNodeId) {
    params.set('playMapNodeId', playMap.playMapNodeId);
  }
  if (playMap?.playMapMode) {
    params.set('playMapMode', playMap.playMapMode);
  }
};

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
  is_video_lesson?: boolean;
  video_lesson_stage_id?: string | null;
  video_lesson_stage?: { id?: string } | null;
  is_defense?: boolean;
  defense_stage_id?: string | null;
  defense_stage?: { id?: string } | null;
  is_training?: boolean;
  training_id?: string | null;
  training?: { id?: string } | null;
  ear_training_stage?: { id?: string } | null;
  ear_training_stage_id?: string | null;
  fantasy_stage?: { id?: string } | null;
  fantasy_stage_id?: string | null;
};

/**
 * レッスン課題の「練習開始」ボタンと同じ起動先 hash を組み立てる。
 * 起動不能（ステージ未設定など）の場合は null。
 */
export function buildLessonRequirementLaunchHash(
  req: LessonRequirementLaunchInput,
  playMap?: LessonRequirementPlayMapContext,
): string | null {
  const isSurvivalTutorial = req.is_survival_tutorial === true;
  const isEarTrainingTutorial = req.is_ear_training_tutorial === true;
  const isSurvival = req.is_survival === true || isSurvivalTutorial;
  const isEarTraining = req.is_ear_training === true || isEarTrainingTutorial;
  const isBalloonRush = req.is_balloon_rush === true;
  const isFantasy = req.is_fantasy === true;
  const isVideoLesson = req.is_video_lesson === true;
  const isDefense = req.is_defense === true;
  const isTraining = req.is_training === true;

  if (isTraining) {
    const trainingId = req.training?.id ?? req.training_id ?? '';
    if (!trainingId) {
      return null;
    }
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('trainingId', trainingId);
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    appendPlayMapContext(params, playMap);
    return `#training-lesson?${params.toString()}`;
  }

  if (isDefense) {
    const stageId = req.defense_stage?.id ?? req.defense_stage_id ?? '';
    if (!stageId) {
      return null;
    }
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('stageId', stageId);
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    appendPlayMapContext(params, playMap);
    return `#defense-lesson?${params.toString()}`;
  }

  if (isSurvivalTutorial) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('scriptId', req.survival_tutorial_script_id ?? 'onboarding-v1');
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    appendPlayMapContext(params, playMap);
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
    appendPlayMapContext(params, playMap);
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
    appendPlayMapContext(params, playMap);
    return `#balloon-rush-lesson?${params.toString()}`;
  }

  if (isFantasy) {
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('stageId', req.fantasy_stage?.id || req.fantasy_stage_id || '');
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    appendPlayMapContext(params, playMap);
    return `#fantasy?${params.toString()}`;
  }

  if (isEarTrainingTutorial) {
    const scriptId = req.ear_training_tutorial_script_id ?? 'developer-full-v1';
    if (scriptId === OSMD_TIMING_ADJUSTMENT_SCRIPT_ID) {
      const timingHash = buildEarTrainingTimingAdjustmentHash({
        entry: 'quest',
        lessonId: req.lesson_id,
        lessonSongId: req.lesson_song_id ?? '',
        clearConditions: JSON.stringify(req.clear_conditions),
      });
      if (!playMap?.playMapNodeId && !playMap?.playMapMode) {
        return timingHash;
      }
      const timingParams = new URLSearchParams(timingHash.split('?')[1] ?? '');
      appendPlayMapContext(timingParams, playMap);
      return `#ear-training-timing-adjustment?${timingParams.toString()}`;
    }
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('scriptId', scriptId);
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    appendPlayMapContext(params, playMap);
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
    appendPlayMapContext(params, playMap);
    return `#ear-training-lesson?${params.toString()}`;
  }

  if (isVideoLesson) {
    const stageId = req.video_lesson_stage?.id ?? req.video_lesson_stage_id ?? '';
    if (!stageId) {
      return null;
    }
    const params = new URLSearchParams();
    params.set('lessonId', req.lesson_id);
    params.set('lessonSongId', req.lesson_song_id ?? '');
    params.set('stageId', stageId);
    params.set('clearConditions', JSON.stringify(req.clear_conditions));
    appendPlayMapContext(params, playMap);
    return `#video-lesson?${params.toString()}`;
  }

  return null;
}
