import type { TrainingKind } from '@/game/training/trainingTypes';

export type TrainingLetterRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const DEFAULT_RANK_THRESHOLDS: readonly { minScore: number; rank: TrainingLetterRank }[] = [
  { minScore: 60, rank: 'S' },
  { minScore: 50, rank: 'A' },
  { minScore: 40, rank: 'B' },
  { minScore: 30, rank: 'C' },
  { minScore: 20, rank: 'D' },
  { minScore: 10, rank: 'E' },
];

const SCALE_RANK_THRESHOLDS: readonly { minScore: number; rank: TrainingLetterRank }[] = [
  { minScore: 30, rank: 'S' },
  { minScore: 25, rank: 'A' },
  { minScore: 20, rank: 'B' },
  { minScore: 15, rank: 'C' },
  { minScore: 10, rank: 'D' },
  { minScore: 5, rank: 'E' },
];

const thresholdsForKind = (kind: TrainingKind): readonly { minScore: number; rank: TrainingLetterRank }[] => (
  kind === 'scale' ? SCALE_RANK_THRESHOLDS : DEFAULT_RANK_THRESHOLDS
);

export const scoreToTrainingRank = (score: number, kind: TrainingKind = 'chord'): TrainingLetterRank => {
  const normalized = Math.max(0, Math.floor(score));
  for (const entry of thresholdsForKind(kind)) {
    if (normalized >= entry.minScore) {
      return entry.rank;
    }
  }
  return 'F';
};

const RANK_ORDER: readonly TrainingLetterRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

export const meetsTrainingRankByLetter = (
  achievedRank: TrainingLetterRank,
  requiredRank: TrainingLetterRank,
): boolean => RANK_ORDER.indexOf(achievedRank) >= RANK_ORDER.indexOf(requiredRank);

export const meetsTrainingRankRequirement = (
  score: number,
  requiredRank: TrainingLetterRank,
  kind: TrainingKind = 'chord',
): boolean => {
  const achieved = scoreToTrainingRank(score, kind);
  return meetsTrainingRankByLetter(achieved, requiredRank);
};
