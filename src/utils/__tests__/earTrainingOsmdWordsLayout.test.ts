import { describe, expect, it } from 'vitest';
import { enableEarTrainingOsmdWordsLayoutRules } from '@/utils/earTrainingOsmdWordsLayout';

describe('enableEarTrainingOsmdWordsLayoutRules', () => {
  it('PlaceWordsInsideStafflineFromXml を有効化する', () => {
    const rules: { PlaceWordsInsideStafflineFromXml?: boolean } = {};
    enableEarTrainingOsmdWordsLayoutRules({
      EngravingRules: rules,
    } as Parameters<typeof enableEarTrainingOsmdWordsLayoutRules>[0]);
    expect(rules.PlaceWordsInsideStafflineFromXml).toBe(true);
  });
});
