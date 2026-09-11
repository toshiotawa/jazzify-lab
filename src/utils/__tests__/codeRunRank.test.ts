import {
  meetsCodeRunRankRequirement,
  scoreToCodeRunRank,
} from '@/utils/codeRunRank';

describe('codeRunRank', () => {
  it('maps elapsed seconds to letter ranks', () => {
    expect(scoreToCodeRunRank(59)).toBe('S');
    expect(scoreToCodeRunRank(60)).toBe('S');
    expect(scoreToCodeRunRank(61)).toBe('A');
    expect(scoreToCodeRunRank(150)).toBe('C');
    expect(scoreToCodeRunRank(200)).toBe('F');
  });

  it('checks rank requirement', () => {
    expect(meetsCodeRunRankRequirement('B', 'C')).toBe(true);
    expect(meetsCodeRunRankRequirement('D', 'C')).toBe(false);
    expect(meetsCodeRunRankRequirement('C', 'C')).toBe(true);
  });
});
