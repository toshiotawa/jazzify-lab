import {
  meetsTrainingRankRequirement,
  minScoreForTrainingRank,
  scoreToTrainingRank,
} from '@/game/training/trainingRank';

describe('trainingRank', () => {
  it('maps scores to letter ranks for chord-like trainings', () => {
    expect(scoreToTrainingRank(60, 'chord')).toBe('S');
    expect(scoreToTrainingRank(50, 'chord')).toBe('A');
    expect(scoreToTrainingRank(40, 'chord')).toBe('B');
    expect(scoreToTrainingRank(30, 'chord')).toBe('C');
    expect(scoreToTrainingRank(20, 'chord')).toBe('D');
    expect(scoreToTrainingRank(10, 'chord')).toBe('E');
    expect(scoreToTrainingRank(9, 'chord')).toBe('F');
  });

  it('maps scores to letter ranks for scale trainings at half thresholds', () => {
    expect(scoreToTrainingRank(30, 'scale')).toBe('S');
    expect(scoreToTrainingRank(25, 'scale')).toBe('A');
    expect(scoreToTrainingRank(20, 'scale')).toBe('B');
    expect(scoreToTrainingRank(15, 'scale')).toBe('C');
    expect(scoreToTrainingRank(10, 'scale')).toBe('D');
    expect(scoreToTrainingRank(5, 'scale')).toBe('E');
    expect(scoreToTrainingRank(4, 'scale')).toBe('F');
  });

  it('checks rank requirements', () => {
    expect(meetsTrainingRankRequirement(30, 'C', 'chord')).toBe(true);
    expect(meetsTrainingRankRequirement(29, 'C', 'chord')).toBe(false);
    expect(meetsTrainingRankRequirement(15, 'C', 'scale')).toBe(true);
    expect(meetsTrainingRankRequirement(14, 'C', 'scale')).toBe(false);
  });

  it('returns minimum score for a rank', () => {
    expect(minScoreForTrainingRank('C', 'chord')).toBe(30);
    expect(minScoreForTrainingRank('C', 'scale')).toBe(15);
    expect(minScoreForTrainingRank('S', 'chord')).toBe(60);
    expect(minScoreForTrainingRank('S', 'scale')).toBe(30);
    expect(minScoreForTrainingRank('F', 'chord')).toBe(0);
  });
});
