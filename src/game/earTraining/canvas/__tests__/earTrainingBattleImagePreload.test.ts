import { afterEach, describe, expect, it } from 'vitest';
import {
  getEarTrainingBattleCriticalUrls,
  getEarTrainingBattleDeferredUrls,
  getEarTrainingBattleSecondaryUrls,
} from '@/game/earTraining/canvas/earTrainingBattleImageAssets';
import {
  clearBattleImageCacheForTests,
  copyCachedBattleImages,
  preloadEarTrainingBattleImages,
} from '@/game/earTraining/canvas/earTrainingBattleImagePreload';

describe('earTrainingBattleImagePreload', () => {
  const originalImage = global.Image;

  afterEach(() => {
    global.Image = originalImage;
    clearBattleImageCacheForTests();
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

  it('OSMD クリティカルにはパリィ用ポーズを含む（3レイヤーVFXは火花に置換済み）', () => {
    const urls = getEarTrainingBattleCriticalUrls([], 'chord_osmd');
    expect(urls.some((url) => url.includes('GuardD'))).toBe(true);
    expect(urls.some((url) => url.includes('GuardE'))).toBe(true);
    expect(urls.some((url) => url.includes('finish'))).toBe(true);
    expect(urls.some((url) => url.includes('eishou'))).toBe(true);
    expect(urls.some((url) => url.includes('parry-flash'))).toBe(false);
    expect(urls.some((url) => url.includes('parry-ring'))).toBe(false);
    expect(urls.some((url) => url.includes('parry-splash'))).toBe(false);
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

  it('2回目の preload は Image を新規作成しない', async () => {
    let attempts = 0;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        attempts += 1;
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }
    global.Image = MockImage as unknown as typeof Image;

    await preloadEarTrainingBattleImages(['/cache/a.webp']);
    expect(attempts).toBe(1);

    await preloadEarTrainingBattleImages(['/cache/a.webp']);
    expect(attempts).toBe(1);

    const sync = copyCachedBattleImages(['/cache/a.webp']);
    expect(sync.get('/cache/a.webp')).toBeInstanceOf(MockImage);
  });

  it('同一 URL の並行 preload は 1 回だけ Image を作成する', async () => {
    let attempts = 0;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        attempts += 1;
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }
    global.Image = MockImage as unknown as typeof Image;

    const url = '/cache/parallel.webp';
    await Promise.all([
      preloadEarTrainingBattleImages([url]),
      preloadEarTrainingBattleImages([url]),
    ]);
    expect(attempts).toBe(1);
  });

  it('失敗 URL はキャッシュしない（リトライ後の成功はキャッシュする）', async () => {
    let failAttempts = 0;
    class AlwaysFailImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        failAttempts += 1;
        queueMicrotask(() => {
          this.onerror?.();
        });
      }
    }
    global.Image = AlwaysFailImage as unknown as typeof Image;

    const failedMap = await preloadEarTrainingBattleImages(['/cache/fail.webp']);
    expect(failedMap.has('/cache/fail.webp')).toBe(false);
    expect(failAttempts).toBe(3);

    const attemptsBeforeRetry = failAttempts;
    const retryMap = await preloadEarTrainingBattleImages(['/cache/fail.webp']);
    expect(retryMap.has('/cache/fail.webp')).toBe(false);
    expect(failAttempts).toBe(attemptsBeforeRetry + 3);

    let successAttempts = 0;
    class FailOnceImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';

      constructor() {
        successAttempts += 1;
        queueMicrotask(() => {
          if (successAttempts === 1) {
            this.onerror?.();
            return;
          }
          this.onload?.();
        });
      }
    }
    global.Image = FailOnceImage as unknown as typeof Image;
    clearBattleImageCacheForTests();

    const firstSuccessMap = await preloadEarTrainingBattleImages(['/cache/retry-success.webp']);
    expect(successAttempts).toBe(2);
    expect(firstSuccessMap.get('/cache/retry-success.webp')).toBeInstanceOf(FailOnceImage);

    await preloadEarTrainingBattleImages(['/cache/retry-success.webp']);
    expect(successAttempts).toBe(2);
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
