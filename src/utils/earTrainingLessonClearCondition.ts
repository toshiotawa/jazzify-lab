import type { EarTrainingStage } from '@/types';

/** `EarTrainingChordQuizScreen` の本番既定 `quiz_required_correct_count ?? 80` と同一 */
const DEFAULT_QUIZ_REQUIRED_CORRECT = 80;

export type EarTrainingLessonClearConditionInput = Pick<EarTrainingStage, 'mode'> &
  Partial<Pick<EarTrainingStage, 'quiz_duration_seconds' | 'quiz_required_correct_count'>>;

export const getEarTrainingLessonClearConditionText = (
  stage: EarTrainingLessonClearConditionInput | null | undefined,
  isEnglishCopy: boolean,
): string => {
  const mode = stage?.mode;

  if (mode === 'chord_quiz') {
    const required = Math.max(1, stage?.quiz_required_correct_count ?? DEFAULT_QUIZ_REQUIRED_CORRECT);
    if (isEnglishCopy) {
      return `Answer at least ${required} questions correctly.`;
    }
    return `${required}問以上正解`;
  }

  if (mode === 'chord_precision') {
    if (isEnglishCopy) {
      return 'Achieve 70% or more GOOD notes.';
    }
    return 'GOOD率70%以上でクリア';
  }

  if (isEnglishCopy) {
    if (mode === 'chord_osmd') {
      return 'Reduce the enemy HP to 0. Clearing all targets in two passes is the default goal.';
    }
    return 'Reduce the enemy HP to 0 within the time limit.';
  }

  if (mode === 'chord_osmd') {
    return '敵HPを0にする。全問正解なら譜面2周が目安。';
  }
  return '制限時間以内に敵HPを0にする';
};
