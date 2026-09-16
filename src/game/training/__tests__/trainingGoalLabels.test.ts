import {
  formatTrainingGoalLevel,
  formatTrainingGoalRank,
  resolveTrainingGoalRankInfo,
} from '@/game/training/trainingGoalLabels';
import type { TrainingGoalSet, TrainingRow } from '@/game/training/trainingTypes';

const makeGoalSet = (overrides: Partial<TrainingGoalSet> = {}): TrainingGoalSet => ({
  id: 'goal-1',
  slug: 'goal-triad',
  titleJa: 'トライアドをマスターしよう',
  titleEn: 'Master Triads',
  descriptionJa: '説明',
  descriptionEn: 'Description',
  targetInstrument: 'all',
  targetLevel: 'beginner',
  sortOrder: 1,
  items: [{ trainingId: 't1', targetRank: 'C', sortOrder: 1 }],
  ...overrides,
});

const makeTraining = (kind: TrainingRow['kind']): TrainingRow => ({
  id: 't1',
  categoryId: 'c1',
  slug: 'triad-major',
  titleJa: 'メジャー',
  titleEn: 'Major',
  sortOrder: 1,
  kind,
  clefMode: 'instrument',
  useKeySignature: false,
  playRootOnCorrect: true,
  bgmUrl: '',
  config: {},
  isActive: true,
});

describe('trainingGoalLabels', () => {
  it('formats intermediate level as trainee', () => {
    expect(formatTrainingGoalLevel('intermediate', false)).toBe('トレーニー');
    expect(formatTrainingGoalLevel('intermediate', true)).toBe('Trainee');
  });

  it('formats goal rank with question count', () => {
    expect(formatTrainingGoalRank('C', 30, false)).toBe('C(30問)');
    expect(formatTrainingGoalRank('C', 15, true)).toBe('C (15 questions)');
  });

  it('resolves rank info from first goal set item', () => {
    const trainingById = new Map<string, TrainingRow>([
      ['t1', makeTraining('chord')],
    ]);
    expect(resolveTrainingGoalRankInfo(makeGoalSet(), trainingById)).toEqual({
      rank: 'C',
      questionCount: 30,
    });
  });

  it('uses scale thresholds for scale trainings', () => {
    const trainingById = new Map<string, TrainingRow>([
      ['t1', makeTraining('scale')],
    ]);
    expect(resolveTrainingGoalRankInfo(makeGoalSet(), trainingById)).toEqual({
      rank: 'C',
      questionCount: 15,
    });
  });

  it('returns null when goal set has no items or training is missing', () => {
    expect(resolveTrainingGoalRankInfo(makeGoalSet({ items: [] }), new Map())).toBeNull();
    expect(resolveTrainingGoalRankInfo(makeGoalSet(), new Map())).toBeNull();
  });
});
