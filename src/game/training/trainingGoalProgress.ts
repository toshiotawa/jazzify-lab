import { meetsTrainingRankByLetter } from '@/game/training/trainingRank';
import type { TrainingGoalSet, TrainingGoalSetItem, TrainingScoreSummary } from '@/game/training/trainingTypes';
import type { TrainingLetterRank } from '@/game/training/trainingRank';

export interface TrainingGoalItemState {
  readonly trainingId: string;
  readonly targetRank: TrainingLetterRank;
  readonly bestRank: TrainingLetterRank | null;
  readonly bestScore: number | null;
  readonly cleared: boolean;
}

export interface TrainingGoalProgress {
  readonly cleared: number;
  readonly total: number;
  readonly percent: number;
  readonly isComplete: boolean;
  readonly items: readonly TrainingGoalItemState[];
}

export const computeTrainingGoalProgress = (
  goalSet: TrainingGoalSet,
  summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>,
): TrainingGoalProgress => {
  const items: TrainingGoalItemState[] = goalSet.items.map((item: TrainingGoalSetItem) => {
    const summary = summaryByTrainingId.get(item.trainingId);
    const bestRank = summary?.bestRank ?? null;
    const cleared = bestRank != null && meetsTrainingRankByLetter(bestRank, item.targetRank);
    return {
      trainingId: item.trainingId,
      targetRank: item.targetRank,
      bestRank,
      bestScore: summary?.bestScore ?? null,
      cleared,
    };
  });

  const total = items.length;
  const cleared = items.filter((item) => item.cleared).length;
  const percent = total > 0 ? Math.round((cleared / total) * 100) : 0;

  return {
    cleared,
    total,
    percent,
    isComplete: total > 0 && cleared === total,
    items,
  };
};

export const resolveActiveGoalSet = (
  goalSets: readonly TrainingGoalSet[],
  selectedGoalSetId: string | null,
): TrainingGoalSet | null => {
  if (goalSets.length === 0) return null;
  if (selectedGoalSetId) {
    const selected = goalSets.find((set) => set.id === selectedGoalSetId);
    if (selected) return selected;
  }
  return goalSets[0] ?? null;
};
