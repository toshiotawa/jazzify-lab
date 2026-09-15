import { computeTrainingGoalProgress, resolveActiveGoalSet } from '@/game/training/trainingGoalProgress';
import type { TrainingGoalSet, TrainingScoreSummary } from '@/game/training/trainingTypes';

const goalSet: TrainingGoalSet = {
  id: 'goal-1',
  slug: 'goal-intro',
  titleJa: 'テスト目標',
  titleEn: 'Test Goal',
  descriptionJa: '',
  descriptionEn: '',
  targetInstrument: 'all',
  targetLevel: 'beginner',
  sortOrder: 1,
  isActive: true,
  items: [
    { trainingId: 't1', targetRank: 'C', sortOrder: 1 },
    { trainingId: 't2', targetRank: 'C', sortOrder: 2 },
  ],
};

describe('computeTrainingGoalProgress', () => {
  it('counts cleared items by best rank', () => {
    const summary = new Map<string, TrainingScoreSummary>([
      ['t1', { trainingId: 't1', bestScore: 35, bestRank: 'C', rankPosition: null }],
      ['t2', { trainingId: 't2', bestScore: 10, bestRank: 'E', rankPosition: null }],
    ]);

    const progress = computeTrainingGoalProgress(goalSet, summary);
    expect(progress.cleared).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.percent).toBe(50);
    expect(progress.isComplete).toBe(false);
    expect(progress.items[0]?.cleared).toBe(true);
    expect(progress.items[1]?.cleared).toBe(false);
  });

  it('marks complete when all items meet target rank', () => {
    const summary = new Map<string, TrainingScoreSummary>([
      ['t1', { trainingId: 't1', bestScore: 60, bestRank: 'S', rankPosition: null }],
      ['t2', { trainingId: 't2', bestScore: 30, bestRank: 'C', rankPosition: null }],
    ]);

    const progress = computeTrainingGoalProgress(goalSet, summary);
    expect(progress.cleared).toBe(2);
    expect(progress.percent).toBe(100);
    expect(progress.isComplete).toBe(true);
  });
});

describe('resolveActiveGoalSet', () => {
  const sets: TrainingGoalSet[] = [
    { ...goalSet, id: 'first', sortOrder: 1 },
    { ...goalSet, id: 'second', sortOrder: 2 },
  ];

  it('returns selected goal when present', () => {
    expect(resolveActiveGoalSet(sets, 'second')?.id).toBe('second');
  });

  it('falls back to first goal when selection is missing', () => {
    expect(resolveActiveGoalSet(sets, null)?.id).toBe('first');
  });
});
