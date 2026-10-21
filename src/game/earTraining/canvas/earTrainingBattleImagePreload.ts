import type { EarTrainingMode } from '@/types';
import type { EarTrainingBattleDrawRuntime } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  getEarTrainingBattleCriticalUrls,
  getEarTrainingBattleDeferredUrls,
  getEarTrainingBattleSecondaryUrls,
  getEarTrainingBattleSpriteRegistryForMode,
} from '@/game/earTraining/canvas/earTrainingBattleImageAssets';
import { invalidateBackgroundCache } from '@/game/earTraining/canvas/earTrainingBattleBackground';

const MAX_CONCURRENT = 4;
const MAX_RETRIES = 2;
const IMAGE_TIMEOUT_MS = 8000;

/** Survives canvas remounts so replay does not re-decode battle sprites. */
const battleImageCache = new Map<string, HTMLImageElement>();
const battleImageInFlight = new Map<string, Promise<HTMLImageElement | null>>();

export const copyCachedBattleImages = (urls: readonly string[]): Map<string, HTMLImageElement> => {
  const map = new Map<string, HTMLImageElement>();
  urls.forEach((url) => {
    if (!url) return;
    const cached = battleImageCache.get(url);
    if (cached) {
      map.set(url, cached);
    }
  });
  return map;
};

export const clearBattleImageCacheForTests = (): void => {
  battleImageCache.clear();
  battleImageInFlight.clear();
};

const loadBattleImageUncached = (url: string, attempt: number): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    // The initial URL shares the browser cache with map <img> elements.
    // A stalled request must not hold every subsequent sprite indefinitely.
    const finish = (loaded: boolean): void => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      if (loaded) {
        resolve(img);
      } else {
        img.removeAttribute('src');
        if (attempt < MAX_RETRIES) {
          void loadBattleImageUncached(url, attempt + 1).then(resolve);
        } else {
          resolve(null);
        }
      }
    };
    const timeout = setTimeout(() => finish(false), IMAGE_TIMEOUT_MS);
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    const retrySuffix = attempt === 0 ? '' : `${url.includes('?') ? '&' : '?'}_retry=${attempt}`;
    img.src = `${url}${retrySuffix}`;
  });

const loadBattleImage = (url: string): Promise<HTMLImageElement | null> => {
  const cached = battleImageCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = battleImageInFlight.get(url);
  if (inFlight) {
    return inFlight;
  }

  const promise = loadBattleImageUncached(url, 0).then((img) => {
    battleImageInFlight.delete(url);
    if (img) {
      battleImageCache.set(url, img);
    }
    return img;
  });
  battleImageInFlight.set(url, promise);
  return promise;
};

export const preloadEarTrainingBattleImages = async (
  urls: readonly string[],
  onLoaded?: (images: Map<string, HTMLImageElement>) => void,
): Promise<Map<string, HTMLImageElement>> => {
  const map = new Map<string, HTMLImageElement>();
  const unique = [...new Set(urls.filter(Boolean))];
  const toLoad: string[] = [];

  unique.forEach((url) => {
    const cached = battleImageCache.get(url);
    if (cached) {
      map.set(url, cached);
    } else {
      toLoad.push(url);
    }
  });

  if (map.size > 0) onLoaded?.(map);

  // Workers advance independently: one slow URL cannot block an entire batch.
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < toLoad.length) {
      const url = toLoad[nextIndex++];
      const img = await loadBattleImage(url);
      if (img) {
        map.set(url, img);
        onLoaded?.(map);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, toLoad.length) }, worker));

  return map;
};

const applySpriteRecord = (
  runtime: EarTrainingBattleDrawRuntime,
  map: Map<string, HTMLImageElement>,
  sprites: Record<string, string>,
): void => {
  Object.entries(sprites).forEach(([key, url]) => {
    const img = map.get(url);
    if (img) {
      runtime.loadedImages.set(key, img);
    }
  });
};

export const applyEarTrainingBattleImageMap = (
  runtime: EarTrainingBattleDrawRuntime,
  map: Map<string, HTMLImageElement>,
  avatarUrls: readonly string[],
  mode?: EarTrainingMode,
): void => {
  avatarUrls.forEach((url) => {
    const img = map.get(url);
    if (img) {
      runtime.loadedImages.set(url, img);
    }
  });

  const registry = getEarTrainingBattleSpriteRegistryForMode(mode);
  applySpriteRecord(runtime, map, registry.uiSprites);
  applySpriteRecord(runtime, map, registry.effectSprites);
  applySpriteRecord(runtime, map, registry.poseSprites);
  applySpriteRecord(runtime, map, registry.backgroundSprites);
};

export const preloadEarTrainingBattleCriticalImages = (
  avatarUrls: readonly string[],
  mode?: EarTrainingMode,
  onLoaded?: (images: Map<string, HTMLImageElement>) => void,
): Promise<Map<string, HTMLImageElement>> =>
  preloadEarTrainingBattleImages(getEarTrainingBattleCriticalUrls(avatarUrls, mode), onLoaded);

export const preloadEarTrainingBattleSecondaryImages = (
  mode?: EarTrainingMode,
): Promise<Map<string, HTMLImageElement>> =>
  preloadEarTrainingBattleImages(getEarTrainingBattleSecondaryUrls(mode));

export const preloadEarTrainingBattleDeferredImages = (
  mode?: EarTrainingMode,
): Promise<Map<string, HTMLImageElement>> =>
  preloadEarTrainingBattleImages(getEarTrainingBattleDeferredUrls(mode));

export const scheduleEarTrainingBattleDeferredImages = (
  runtime: EarTrainingBattleDrawRuntime,
  onReady: () => void,
  isCancelled: () => boolean,
  mode?: EarTrainingMode,
): void => {
  const run = (): void => {
    void preloadEarTrainingBattleDeferredImages(mode).then((map) => {
      if (isCancelled()) {
        return;
      }
      applyEarTrainingBattleImageMap(runtime, map, [], mode);
      invalidateBackgroundCache(runtime.backgroundCache);
      onReady();
    });
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 50);
  }
};
