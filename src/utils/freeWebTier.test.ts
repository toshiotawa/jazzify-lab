import {
  FREE_WEB_DAILY_CHALLENGE_DIFFICULTY,
  isFreeWebDailyChallengeDifficulty,
} from '@/utils/freeWebTier';

describe('freeWebTier', () => {
  it('uses super_beginner as the free daily challenge tier', () => {
    expect(FREE_WEB_DAILY_CHALLENGE_DIFFICULTY).toBe('super_beginner');
  });

  it('isFreeWebDailyChallengeDifficulty matches only that tier', () => {
    expect(isFreeWebDailyChallengeDifficulty('super_beginner')).toBe(true);
    expect(isFreeWebDailyChallengeDifficulty('beginner')).toBe(false);
  });
});
