import { resolvePlayMapDefenseDifficultyLevel } from '@/game/defense/playMapDefenseDifficulty';

describe('resolvePlayMapDefenseDifficultyLevel', () => {
  it('uses the node override when it is a valid 1–15 level', () => {
    expect(resolvePlayMapDefenseDifficultyLevel(3, 1)).toBe(3);
    expect(resolvePlayMapDefenseDifficultyLevel(10, 3)).toBe(10);
    expect(resolvePlayMapDefenseDifficultyLevel(15, 3)).toBe(15);
  });

  it('falls back to the stage level when the node has no override', () => {
    expect(resolvePlayMapDefenseDifficultyLevel(null, 3)).toBe(3);
  });

  it('ignores out-of-range node values', () => {
    expect(resolvePlayMapDefenseDifficultyLevel(0, 3)).toBe(3);
    expect(resolvePlayMapDefenseDifficultyLevel(16, 3)).toBe(3);
    expect(resolvePlayMapDefenseDifficultyLevel(3.5, 3)).toBe(3);
  });
});
