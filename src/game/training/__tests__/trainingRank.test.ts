import { meetsTrainingRankRequirement, scoreToTrainingRank } from '@/game/training/trainingRank';

describe('trainingRank', () => {
  it('maps scores to letter ranks', () => {
    expect(scoreToTrainingRank(60)).toBe('S');
    expect(scoreToTrainingRank(50)).toBe('A');
    expect(scoreToTrainingRank(40)).toBe('B');
    expect(scoreToTrainingRank(30)).toBe('C');
    expect(scoreToTrainingRank(20)).toBe('D');
    expect(scoreToTrainingRank(10)).toBe('E');
    expect(scoreToTrainingRank(9)).toBe('F');
  });

  it('checks rank requirements', () => {
    expect(meetsTrainingRankRequirement(30, 'C')).toBe(true);
    expect(meetsTrainingRankRequirement(29, 'C')).toBe(false);
  });
});
