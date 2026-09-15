import type { TrainingGoalSet } from '@/game/training/trainingTypes';

export const formatTrainingGoalInstrument = (
  instrument: TrainingGoalSet['targetInstrument'],
  isEnglish: boolean,
): string => {
  if (instrument === 'piano') {
    return isEnglish ? 'Piano' : 'ピアノ';
  }
  return isEnglish ? 'All instruments' : '全楽器';
};

export const formatTrainingGoalLevel = (
  level: TrainingGoalSet['targetLevel'],
  isEnglish: boolean,
): string => {
  switch (level) {
    case 'intermediate':
      return isEnglish ? 'Intermediate' : '中級者';
    case 'advanced':
      return isEnglish ? 'Advanced' : '上級者';
    default:
      return isEnglish ? 'Beginner' : '初心者';
  }
};
