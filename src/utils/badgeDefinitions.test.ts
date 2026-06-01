import { describe, expect, it } from 'vitest';
import { BADGE_CATEGORIES, BADGE_DEFINITIONS, BADGE_TOTAL_COUNT } from './badgeDefinitions';

describe('badgeDefinitions', () => {
  it('defines five categories with three ranks each', () => {
    expect(BADGE_CATEGORIES).toHaveLength(5);
    expect(BADGE_TOTAL_COUNT).toBe(15);

    for (const category of BADGE_CATEGORIES) {
      const badges = BADGE_DEFINITIONS.filter(badge => badge.categoryId === category.id);
      expect(badges.map(badge => badge.rank)).toEqual([1, 2, 3]);
    }
  });

  it('uses the requested thresholds for each category', () => {
    const thresholdsFor = (categoryId: string) =>
      BADGE_DEFINITIONS
        .filter(badge => badge.categoryId === categoryId)
        .map(badge => badge.conditionValue);

    expect(thresholdsFor('survival_basic')).toEqual([1, 50, 100]);
    expect(thresholdsFor('survival_songs')).toEqual([1, 50, 100]);
    expect(thresholdsFor('survival_phrases')).toEqual([1, 50, 100]);
    expect(thresholdsFor('player_level')).toEqual([2, 50, 100]);
    expect(thresholdsFor('quest_clear')).toEqual([1, 50, 100]);
  });

  it('has unique ids and medal images', () => {
    expect(new Set(BADGE_DEFINITIONS.map(badge => badge.id)).size).toBe(BADGE_TOTAL_COUNT);
    expect(new Set(BADGE_DEFINITIONS.map(badge => badge.imagePath)).size).toBe(BADGE_TOTAL_COUNT);
  });
});
