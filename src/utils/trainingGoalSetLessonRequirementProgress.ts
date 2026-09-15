import {
  computeTrainingGoalProgressFromItems,
} from '@/game/training/trainingGoalProgress';
import type { TrainingLetterRank } from '@/game/training/trainingRank';
import type { TrainingGoalSetItem, TrainingScoreSummary } from '@/game/training/trainingTypes';
import type { TrainingGoalSetItemRow } from '@/types';

const LETTER_RANKS: readonly TrainingLetterRank[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

const isLetterRank = (value: string): value is TrainingLetterRank => (
  LETTER_RANKS.includes(value as TrainingLetterRank)
);

export const mapTrainingGoalSetItemRows = (
  rows: readonly TrainingGoalSetItemRow[] | null | undefined,
): readonly TrainingGoalSetItem[] => (rows ?? [])
  .slice()
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((row) => ({
    trainingId: row.training_id,
    targetRank: isLetterRank(row.target_rank) ? row.target_rank : 'C',
    sortOrder: row.sort_order,
  }));

export interface TrainingGoalSetLessonRequirementProgress {
  readonly cleared: number;
  readonly total: number;
  readonly percent: number;
}

export const computeTrainingGoalSetLessonRequirementProgress = (
  itemRows: readonly TrainingGoalSetItemRow[] | null | undefined,
  summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>,
  isCompletedFallback: boolean,
): TrainingGoalSetLessonRequirementProgress => {
  const items = mapTrainingGoalSetItemRows(itemRows);
  if (items.length === 0) {
    return {
      cleared: isCompletedFallback ? 1 : 0,
      total: isCompletedFallback ? 1 : 0,
      percent: isCompletedFallback ? 100 : 0,
    };
  }

  const progress = computeTrainingGoalProgressFromItems(items, summaryByTrainingId);
  return {
    cleared: progress.cleared,
    total: progress.total,
    percent: progress.percent,
  };
};
