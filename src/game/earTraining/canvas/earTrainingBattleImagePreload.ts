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

const loadBattleImage = (url: string, attempt: number): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (attempt < MAX_RETRIES) {
        void loadBattleImage(url, attempt + 1).then(resolve);
        return;
      }
      resolve(null);
    };
    const retrySuffix = attempt === 0 ? '' : `${url.includes('?') ? '&' : '?'}_retry=${attempt}`;
    img.src = `${url}${retrySuffix}`;
  });

export const preloadEarTrainingBattleImages = async (
  urls: readonly string[],
): Promise<Map<string, HTMLImageElement>> => {
  const map = new Map<string, HTMLImageElement>();
  const unique = [...new Set(urls.filter(Boolean))];

  for (let index = 0; index < unique.length; index += MAX_CONCURRENT) {
    const batch = unique.slice(index, index + MAX_CONCURRENT);
    const results = await Promise.all(batch.map((url) => loadBattleImage(url, 0)));
    batch.forEach((url, batchIndex) => {
      const img = results[batchIndex];
      if (img) {
        map.set(url, img);
      }
    });
  }

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
): Promise<Map<string, HTMLImageElement>> =>
  preloadEarTrainingBattleImages(getEarTrainingBattleCriticalUrls(avatarUrls, mode));

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
