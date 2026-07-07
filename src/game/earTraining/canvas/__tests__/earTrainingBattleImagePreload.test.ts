import { afterEach, describe, expect, it } from 'vitest';
import {
  getEarTrainingBattleCriticalUrls,
  getEarTrainingBattleDeferredUrls,
} from '@/game/earTraining/canvas/earTrainingBattleImageAssets';
import { preloadEarTrainingBattleImages } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';

describe('earTrainingBattleImagePreload', () => {
  const originalImage = global.Image;

  afterEach(() => {
    global.Image = originalImage;
  });

  it('getEarTrainingBattleCriticalUrls はアバターと UI スプライトのみ含む', () => {
    const urls = getEarTrainingBattleCriticalUrls([
      '/avatar/player.webp',
      '/avatar/enemy.webp',
    ]);
    expect(urls).toContain('/avatar/player.webp');
    expect(urls).toContain('/avatar/enemy.webp');
    expect(urls.some((url) => url.includes('hammer'))).toBe(true);
    expect(urls.some((url) => url.includes('fireball'))).toBe(false);
  });

  it('getEarTrainingBattleDeferredUrls はエフェクトと背景を含む', () => {
    const urls = getEarTrainingBattleDeferredUrls();
    expect(urls.some((url) => url.includes('fireball'))).toBe(true);
    expect(urls.some((url) => url.includes('hammer'))).toBe(false);
  });

  it('preloadEarTrainingBattleImages は失敗時にリトライする', async () => {
    let attempts = 0;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        attempts += 1;
        queueMicrotask(() => {
          if (attempts === 1) {
            this.onerror?.();
            return;
          }
          this.onload?.();
        });
      }
    }
    global.Image = MockImage as unknown as typeof Image;

    const map = await preloadEarTrainingBattleImages(['/test/sprite.webp']);
    expect(attempts).toBe(2);
    expect(map.get('/test/sprite.webp')).toBeInstanceOf(MockImage);
  });
});
