import { afterEach, describe, expect, it } from 'vitest';
import {
  getEarTrainingBattleCriticalUrls,
  getEarTrainingBattleDeferredUrls,
  getEarTrainingBattleSecondaryUrls,
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

  it('OSMD クリティカルにはパリィ用ポーズとパリィVFXを含む', () => {
    const urls = getEarTrainingBattleCriticalUrls([], 'chord_osmd');
    expect(urls.some((url) => url.includes('GuardD'))).toBe(true);
    expect(urls.some((url) => url.includes('GuardE'))).toBe(true);
    expect(urls.some((url) => url.includes('finish'))).toBe(true);
    expect(urls.some((url) => url.includes('eishou'))).toBe(true);
    expect(urls.some((url) => url.includes('parry-flash'))).toBe(true);
    expect(urls.some((url) => url.includes('parry-ring'))).toBe(true);
    expect(urls.some((url) => url.includes('parry-splash'))).toBe(true);
    expect(urls.some((url) => url.includes('fireball'))).toBe(false);
  });

  it('OSMD secondary はフレーズ終了エフェクトとスキルポーズのみ', () => {
    const urls = getEarTrainingBattleSecondaryUrls('chord_osmd');
    expect(urls.some((url) => url.includes('meteor'))).toBe(true);
    expect(urls.some((url) => url.includes('Frame2'))).toBe(true);
    expect(urls.some((url) => url.includes('parry-flash'))).toBe(false);
    expect(urls.some((url) => url.includes('GuardD'))).toBe(false);
  });

  it('OSMD deferred は背景のみ', () => {
    const urls = getEarTrainingBattleDeferredUrls('chord_osmd');
    expect(urls.some((url) => url.includes('bg-drum-kit'))).toBe(true);
    expect(urls.some((url) => url.includes('fireball'))).toBe(false);
    expect(urls.some((url) => url.includes('Frame2'))).toBe(false);
  });

  it('getEarTrainingBattleDeferredUrls はモード未指定時に従来どおり全件', () => {
    const urls = getEarTrainingBattleDeferredUrls();
    expect(urls.some((url) => url.includes('fireball'))).toBe(true);
    expect(urls.some((url) => url.includes('Frame2'))).toBe(true);
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
