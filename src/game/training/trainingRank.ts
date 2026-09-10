export type TrainingLetterRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const TRAINING_RANK_THRESHOLDS: readonly { minScore: number; rank: TrainingLetterRank }[] = [
  { minScore: 60, rank: 'S' },
  { minScore: 50, rank: 'A' },
  { minScore: 40, rank: 'B' },
  { minScore: 30, rank: 'C' },
  { minScore: 20, rank: 'D' },
  { minScore: 10, rank: 'E' },
];

export const scoreToTrainingRank = (score: number): TrainingLetterRank => {
  const normalized = Math.max(0, Math.floor(score));
  for (const entry of TRAINING_RANK_THRESHOLDS) {
    if (normalized >= entry.minScore) {
      return entry.rank;
    }
  }
  return 'F';
};

export const meetsTrainingRankRequirement = (
  score: number,
  requiredRank: TrainingLetterRank,
): boolean => {
  const achieved = scoreToTrainingRank(score);
  const order: TrainingLetterRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
  return order.indexOf(achieved) >= order.indexOf(requiredRank);
};
