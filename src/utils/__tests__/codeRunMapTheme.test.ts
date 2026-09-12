import {
  getCodeRunMapBiome,
  getCodeRunMapTheme,
} from '@/utils/codeRunMapTheme';

describe('codeRunMapTheme', () => {
  it('assigns biomes in order and loops', () => {
    expect(getCodeRunMapBiome(0)).toBe('grass');
    expect(getCodeRunMapBiome(1)).toBe('sand');
    expect(getCodeRunMapBiome(2)).toBe('snow');
    expect(getCodeRunMapBiome(3)).toBe('stone');
    expect(getCodeRunMapBiome(4)).toBe('purple');
    expect(getCodeRunMapBiome(5)).toBe('grass');
  });

  it('returns theme matching biome', () => {
    expect(getCodeRunMapTheme(0).biome).toBe('grass');
    expect(getCodeRunMapTheme(3).biome).toBe('stone');
    expect(getCodeRunMapTheme(0).skyTop).toBe('#7ec8f0');
  });
});
