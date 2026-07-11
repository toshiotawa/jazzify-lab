import { OSMD_TIMING_ADJUSTMENT_SCRIPT_ID } from '@/components/earTraining/tutorial/buildOsmdTimingAdjustmentV1Script';

export type EarTrainingTimingAdjustmentEntry = 'quest' | 'settings';

export interface EarTrainingTimingAdjustmentReturnContext {
  stageId?: string;
  lessonId?: string;
  lessonSongId?: string;
  practiceMode?: boolean;
  clearConditions?: string;
  bgmUrl?: string;
  tutorialScriptId?: string;
  tutorialSceneIndex?: number;
}

export interface EarTrainingTimingAdjustmentLaunchParams {
  entry: EarTrainingTimingAdjustmentEntry;
  lessonId?: string;
  lessonSongId?: string;
  clearConditions?: string;
  returnContext?: EarTrainingTimingAdjustmentReturnContext;
}

export const buildEarTrainingTimingAdjustmentHash = (
  params: EarTrainingTimingAdjustmentLaunchParams,
): string => {
  const search = new URLSearchParams();
  search.set('scriptId', OSMD_TIMING_ADJUSTMENT_SCRIPT_ID);
  search.set('entry', params.entry);
  if (params.lessonId) {
    search.set('lessonId', params.lessonId);
  }
  if (params.lessonSongId) {
    search.set('lessonSongId', params.lessonSongId);
  }
  if (params.clearConditions) {
    search.set('clearConditions', params.clearConditions);
  }
  const returnContext = params.returnContext;
  if (returnContext) {
    if (returnContext.stageId) {
      search.set('returnStageId', returnContext.stageId);
    }
    if (returnContext.lessonId) {
      search.set('returnLessonId', returnContext.lessonId);
    }
    if (returnContext.lessonSongId) {
      search.set('returnLessonSongId', returnContext.lessonSongId);
    }
    if (returnContext.practiceMode) {
      search.set('returnPractice', '1');
    }
    if (returnContext.clearConditions) {
      search.set('returnClearConditions', returnContext.clearConditions);
    }
    if (returnContext.bgmUrl) {
      search.set('returnBgmUrl', returnContext.bgmUrl);
    }
    if (returnContext.tutorialScriptId) {
      search.set('returnTutorialScriptId', returnContext.tutorialScriptId);
    }
    if (returnContext.tutorialSceneIndex !== undefined) {
      search.set('returnTutorialSceneIndex', String(returnContext.tutorialSceneIndex));
    }
  }
  return `#ear-training-timing-adjustment?${search.toString()}`;
};

export const parseEarTrainingTimingAdjustmentReturnHash = (
  params: URLSearchParams,
): string | null => {
  const tutorialScriptId = params.get('returnTutorialScriptId');
  if (tutorialScriptId) {
    const search = new URLSearchParams();
    search.set('scriptId', tutorialScriptId);
    const lessonId = params.get('returnLessonId');
    const lessonSongId = params.get('returnLessonSongId');
    if (lessonId) {
      search.set('lessonId', lessonId);
    }
    if (lessonSongId) {
      search.set('lessonSongId', lessonSongId);
    }
    const clearConditions = params.get('returnClearConditions');
    if (clearConditions) {
      search.set('clearConditions', clearConditions);
    }
    const sceneIndexRaw = params.get('returnTutorialSceneIndex');
    if (sceneIndexRaw) {
      search.set('sceneIndex', sceneIndexRaw);
    }
    return `#ear-training-tutorial-lesson?${search.toString()}`;
  }

  const stageId = params.get('returnStageId');
  if (!stageId) {
    return null;
  }
  const search = new URLSearchParams();
  search.set('stageId', stageId);
  const lessonId = params.get('returnLessonId');
  const lessonSongId = params.get('returnLessonSongId');
  if (lessonId) {
    search.set('lessonId', lessonId);
  }
  if (lessonSongId) {
    search.set('lessonSongId', lessonSongId);
  }
  if (params.get('returnPractice') === '1') {
    search.set('practice', '1');
  }
  const clearConditions = params.get('returnClearConditions');
  if (clearConditions) {
    search.set('clearConditions', clearConditions);
  }
  const bgmUrl = params.get('returnBgmUrl');
  if (bgmUrl) {
    search.set('bgmUrl', bgmUrl);
  }
  search.set('restart', '1');
  return `#ear-training-lesson?${search.toString()}`;
};
