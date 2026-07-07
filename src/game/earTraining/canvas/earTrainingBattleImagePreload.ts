import type { EarTrainingBattleDrawRuntime } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  BATTLE_UI_SPRITE_URLS,
  EFFECT_IMAGE_URLS,
  getEarTrainingBattleCriticalUrls,
  getEarTrainingBattleDeferredUrls,
} from '@/game/earTraining/canvas/earTrainingBattleImageAssets';
import { BACKGROUND_IMAGE_URLS } from '@/game/earTraining/canvas/earTrainingBattleBackground';
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

export const applyEarTrainingBattleImageMap = (
  runtime: EarTrainingBattleDrawRuntime,
  map: Map<string, HTMLImageElement>,
  avatarUrls: readonly string[],
): void => {
  avatarUrls.forEach((url) => {
    const img = map.get(url);
    if (img) {
      runtime.loadedImages.set(url, img);
    }
  });
  Object.entries(BATTLE_UI_SPRITE_URLS).forEach(([key, url]) => {
    const img = map.get(url);
    if (img) {
      runtime.loadedImages.set(key, img);
    }
  });
  Object.entries(EFFECT_IMAGE_URLS).forEach(([key, url]) => {
    const img = map.get(url);
    if (img) {
      runtime.loadedImages.set(key, img);
    }
  });
  Object.entries(BACKGROUND_IMAGE_URLS).forEach(([key, url]) => {
    const img = map.get(url);
    if (img) {
      runtime.loadedImages.set(key, img);
    }
  });
};

export const preloadEarTrainingBattleCriticalImages = (
  avatarUrls: readonly string[],
): Promise<Map<string, HTMLImageElement>> =>
  preloadEarTrainingBattleImages(getEarTrainingBattleCriticalUrls(avatarUrls));

export const preloadEarTrainingBattleDeferredImages = (): Promise<Map<string, HTMLImageElement>> =>
  preloadEarTrainingBattleImages(getEarTrainingBattleDeferredUrls());

export const scheduleEarTrainingBattleDeferredImages = (
  runtime: EarTrainingBattleDrawRuntime,
  onReady: () => void,
  isCancelled: () => boolean,
): void => {
  const run = (): void => {
    void preloadEarTrainingBattleDeferredImages().then((map) => {
      if (isCancelled()) {
        return;
      }
      applyEarTrainingBattleImageMap(runtime, map, []);
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
