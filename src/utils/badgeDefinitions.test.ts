import { describe, expect, it } from 'vitest';
import {
  ACTIVE_BADGE_DEFINITIONS,
  BADGE_CATEGORIES,
  BADGE_TOTAL_COUNT,
  isActiveBadgeCategory,
} from './badgeDefinitions';

describe('badgeDefinitions', () => {
  it('defines active categories with three ranks each where applicable', () => {
    const activeCategories = BADGE_CATEGORIES.filter((category) => isActiveBadgeCategory(category.id));
    expect(activeCategories.length).toBeGreaterThan(5);
    expect(BADGE_TOTAL_COUNT).toBe(ACTIVE_BADGE_DEFINITIONS.length);

    for (const category of activeCategories) {
      const badges = ACTIVE_BADGE_DEFINITIONS.filter((badge) => badge.categoryId === category.id);
      expect(badges.length).toBeGreaterThan(0);
      if (badges.length === 3) {
        expect(badges.map((badge) => badge.rank)).toEqual([1, 2, 3]);
      }
    }
  });

  it('uses expected thresholds for core categories', () => {
    const thresholdsFor = (categoryId: string) =>
      ACTIVE_BADGE_DEFINITIONS
        .filter((badge) => badge.categoryId === categoryId)
        .map((badge) => badge.conditionValue);

    expect(thresholdsFor('code_run')).toEqual([1, 2, 3]);
    expect(thresholdsFor('defense')).toEqual([1, 2, 3]);
    expect(thresholdsFor('player_level')).toEqual([2, 50, 100]);
    expect(thresholdsFor('quest_clear')).toEqual([1, 50, 100]);
  });

  it('has unique active ids', () => {
    expect(new Set(ACTIVE_BADGE_DEFINITIONS.map((badge) => badge.id)).size).toBe(BADGE_TOTAL_COUNT);
  });
});
