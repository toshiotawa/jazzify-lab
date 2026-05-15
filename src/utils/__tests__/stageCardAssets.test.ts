import { describe, expect, it } from 'vitest';
import { stageCardRectangularPath, stageCardSquarePath } from '@/utils/stageCardAssets';

describe('stageCardAssets', () => {
  it('returns matching rectangular and square paths for a stage', () => {
    expect(stageCardRectangularPath(2)).toBe('/stage_cards_collection/rectangular_cards/stage_02_forest_card.png');
    expect(stageCardSquarePath(2)).toBe('/stage_cards_collection/square_backgrounds/stage_02_forest_bg.png');
  });

  it('wraps stage numbers beyond the available collection', () => {
    expect(stageCardRectangularPath(51)).toBe('/stage_cards_collection/rectangular_cards/stage_01_cave_card.png');
    expect(stageCardSquarePath(52)).toBe('/stage_cards_collection/square_backgrounds/stage_02_forest_bg.png');
    expect(stageCardRectangularPath(100)).toBe('/stage_cards_collection/rectangular_cards/stage_50_ice_dragon_lair_card.png');
  });

  it('falls back to the first card for invalid low values', () => {
    expect(stageCardSquarePath(0)).toBe('/stage_cards_collection/square_backgrounds/stage_01_cave_bg.png');
  });
});
