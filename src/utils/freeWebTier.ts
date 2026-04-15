import type { DailyChallengeDifficulty } from '@/types';

/**
 * Lowest daily-challenge tier playable on the Web free plan (Super Beginner / 超初級).
 */
export const FREE_WEB_DAILY_CHALLENGE_DIFFICULTY: DailyChallengeDifficulty = 'super_beginner';

export const isFreeWebDailyChallengeDifficulty = (d: DailyChallengeDifficulty): boolean =>
  d === FREE_WEB_DAILY_CHALLENGE_DIFFICULTY;
