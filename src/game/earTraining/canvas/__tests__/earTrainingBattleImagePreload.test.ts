import { afterEach, describe, expect, it, vi } from 'vitest';
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
    vi.useRealTimers();
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
      removeAttribute(): void { this.src = ''; }

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
      removeAttribute(): void { this.src = ''; }

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
      removeAttribute(): void { this.src = ''; }

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
      removeAttribute(): void { this.src = ''; }

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
      removeAttribute(): void { this.src = ''; }

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
  it('publishes ready images and advances workers while an unrelated request is stalled', async () => {
    vi.useFakeTimers();
    const requests: MockImage[] = [];
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      removeAttribute(): void { this.src = ''; }
      constructor() { requests.push(this); }
    }
    global.Image = MockImage as unknown as typeof Image;
    const ready: string[] = [];
    const loading = preloadEarTrainingBattleImages(
      ['/stalled', '/player', '/enemy', '/pose', '/next'],
      (map) => { ready.splice(0, ready.length, ...map.keys()); },
    );
    expect(requests).toHaveLength(4);
    requests[1].onload?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(ready).toEqual(['/player']);
    expect(copyCachedBattleImages(['/player']).has('/player')).toBe(true);
    expect(requests[4].src).toBe('/next');
    for (const index of [2, 3, 4]) requests[index].onload?.();
    await vi.advanceTimersByTimeAsync(24000);
    const map = await loading;
    expect([...map.keys()]).toEqual(['/player', '/enemy', '/pose', '/next']);
    expect(requests).toHaveLength(7);
    expect(requests[0].onload).toBeNull();
    expect(requests[0].src).toBe('');
    expect(vi.getTimerCount()).toBe(0);

    // A failed URL is not kept as a permanently pending/cache entry.
    const retry = preloadEarTrainingBattleImages(['/stalled']);
    expect(requests[7].src).toBe('/stalled');
    requests[7].onload?.();
    expect((await retry).has('/stalled')).toBe(true);
  });

  it('notifies concurrent consumers separately while sharing the underlying request', async () => {
    const images: MockImage[] = [];
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      removeAttribute(): void { this.src = ''; }
      constructor() { images.push(this); }
    }
    global.Image = MockImage as unknown as typeof Image;
    const first = vi.fn();
    const second = vi.fn();
    const a = preloadEarTrainingBattleImages(['/shared'], first);
    const b = preloadEarTrainingBattleImages(['/shared'], second);
    images[0].onload?.();
    await Promise.all([a, b]);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    const cached = vi.fn();
    await preloadEarTrainingBattleImages(['/shared'], cached);
    expect(cached).toHaveBeenCalledTimes(1);
  });

});
