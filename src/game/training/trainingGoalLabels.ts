import { minScoreForTrainingRank } from '@/game/training/trainingRank';
import type { TrainingLetterRank } from '@/game/training/trainingRank';
import type { TrainingGoalSet, TrainingRow } from '@/game/training/trainingTypes';

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
      return isEnglish ? 'Trainer' : 'トレーナー';
    case 'advanced':
      return isEnglish ? 'Master' : 'マスター';
    default:
      return isEnglish ? 'Beginner' : 'ビギナー';
  }
};

export const formatTrainingGoalRank = (
  rank: TrainingLetterRank,
  questionCount: number,
  isEnglish: boolean,
): string => (
  isEnglish
    ? `${rank} (${questionCount} questions)`
    : `${rank}(${questionCount}問)`
);

export interface TrainingGoalRankInfo {
  readonly rank: TrainingLetterRank;
  readonly questionCount: number;
}

export const resolveTrainingGoalRankInfo = (
  goalSet: TrainingGoalSet,
  trainingById: ReadonlyMap<string, TrainingRow>,
): TrainingGoalRankInfo | null => {
  const firstItem = goalSet.items[0];
  if (!firstItem) {
    return null;
  }
  const training = trainingById.get(firstItem.trainingId);
  if (!training) {
    return null;
  }
  return {
    rank: firstItem.targetRank,
    questionCount: minScoreForTrainingRank(firstItem.targetRank, training.kind),
  };
};
