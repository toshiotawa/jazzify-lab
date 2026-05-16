import type { EarTrainingStage } from '@/types';

type EarTrainingClearConditionMode = Pick<EarTrainingStage, 'mode'>;

export const getEarTrainingLessonClearConditionText = (
  stage: EarTrainingClearConditionMode | null | undefined,
  isEnglishCopy: boolean,
): string => {
  if (isEnglishCopy) {
    if (stage?.mode === 'chord_quiz') {
      return 'Answer at least 10 questions correctly and survive for 90 seconds.';
    }
    if (stage?.mode === 'chord_osmd') {
      return 'Reduce the enemy HP to 0.';
    }
    return 'Reduce the enemy HP to 0 within the time limit.';
  }

  if (stage?.mode === 'chord_quiz') {
    return '10問以上正解かつ、90秒間生存';
  }
  if (stage?.mode === 'chord_osmd') {
    return '敵HPを0にする。';
  }
  return '制限時間以内に敵HPを0にする';
};
