import { describe, expect, it } from 'vitest';

import type { TrainingScoreSummary } from '@/game/training/trainingTypes';
import {
  buildTrainingGoalSetRequirementDisplay,
  formatTrainingGoalSetProgressLabel,
} from '@/utils/lessonRequirementDisplay';
import {
  computeTrainingGoalSetLessonRequirementProgress,
  mapTrainingGoalSetItemRows,
} from '@/utils/trainingGoalSetLessonRequirementProgress';

describe('mapTrainingGoalSetItemRows', () => {
  it('sorts items by sort_order', () => {
    const rows = mapTrainingGoalSetItemRows([
      { training_id: 't2', target_rank: 'C', sort_order: 2 },
      { training_id: 't1', target_rank: 'B', sort_order: 1 },
    ]);
    expect(rows.map((row) => row.trainingId)).toEqual(['t1', 't2']);
    expect(rows[1]?.targetRank).toBe('C');
  });
});

describe('computeTrainingGoalSetLessonRequirementProgress', () => {
  const itemRows = [
    { training_id: 't1', target_rank: 'C', sort_order: 1 },
    { training_id: 't2', target_rank: 'C', sort_order: 2 },
  ];
  const summary = new Map<string, TrainingScoreSummary>([
    ['t1', { trainingId: 't1', bestScore: 35, bestRank: 'C', rankPosition: null }],
    ['t2', { trainingId: 't2', bestScore: 10, bestRank: 'E', rankPosition: null }],
  ]);

  it('returns percent from cleared items', () => {
    const progress = computeTrainingGoalSetLessonRequirementProgress(itemRows, summary, false);
    expect(progress).toEqual({ cleared: 1, total: 2, percent: 50 });
  });

  it('falls back to 100% when completed and items are missing', () => {
    const progress = computeTrainingGoalSetLessonRequirementProgress(null, summary, true);
    expect(progress).toEqual({ cleared: 1, total: 1, percent: 100 });
  });

  it('falls back to 0% when not completed and items are missing', () => {
    const progress = computeTrainingGoalSetLessonRequirementProgress(undefined, summary, false);
    expect(progress).toEqual({ cleared: 0, total: 0, percent: 0 });
  });
});

describe('training goal set requirement display copy', () => {
  it('formats JA badge and progress label', () => {
    expect(buildTrainingGoalSetRequirementDisplay(false).badgeLabel).toBe('トレーニング目標セット');
    expect(formatTrainingGoalSetProgressLabel(38, 3, 8)).toBe('38% (3/8)');
  });

  it('formats EN badge and progress label', () => {
    expect(buildTrainingGoalSetRequirementDisplay(true).badgeLabel).toBe('Training goal set');
    expect(formatTrainingGoalSetProgressLabel(100, 8, 8)).toBe('100% (8/8)');
  });
});
