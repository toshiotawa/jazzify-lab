import { getStageNumbersOfFirstBlock } from '../survivalFreeTier';

describe('getStageNumbersOfFirstBlock', () => {
  it('returns empty array when there are no blocks', () => {
    expect(getStageNumbersOfFirstBlock([])).toEqual([]);
  });

  it('returns stage numbers from the first block', () => {
    expect(
      getStageNumbersOfFirstBlock([
        { stageNumbers: [1, 2, 3, 4, 5] },
        { stageNumbers: [6, 7, 8, 9, 10] },
      ]),
    ).toEqual([1, 2, 3, 4, 5]);
  });
});
