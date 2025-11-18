import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as Engine from '../FantasyGameEngine';

vi.mock('@/utils/logger', () => ({
  devLog: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('preloadMonsterImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

    it('loads the first successful image for each monster id', async () => {
      const mockImage = { width: 100 } as HTMLImageElement;
      const spy = vi.spyOn(Engine, 'loadMonsterImageAsset').mockResolvedValue(mockImage);
      const textures = await Engine.preloadMonsterImages(['monster_01', 'monster_02']);
      expect(spy).toHaveBeenCalled();
      expect(textures.size).toBe(2);
      expect(textures.get('monster_01')).toBe(mockImage);
    });

    it('continues when image loading fails', async () => {
      const error = new Error('fail');
      const spy = vi.spyOn(Engine, 'loadMonsterImageAsset')
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({} as HTMLImageElement);
      const textures = await Engine.preloadMonsterImages(['monster_01']);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(textures.size).toBe(1);
    });
});