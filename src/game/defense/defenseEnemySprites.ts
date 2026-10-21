/**
 * Defense enemy sprite loading (preloaded once at mount; no gameplay allocations).
 */
import type { DefenseEnemyFrame } from '@/game/defense/defenseEnemyConfig';
import { DEFENSE_ENEMY_TYPES } from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemyType } from '@/game/defense/defenseTypes';
import { copyCachedBattleImages, preloadEarTrainingBattleImages } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';

interface DefenseEnemySpritePair {
  readonly idle: HTMLImageElement;
  readonly move: HTMLImageElement;
}

export type DefenseEnemySpriteAtlas = ReadonlyMap<DefenseEnemyType, DefenseEnemySpritePair>;

const spriteUrl = (type: DefenseEnemyType, frame: DefenseEnemyFrame): string => (
  `${import.meta.env.BASE_URL}defense/enemies/${type}_${frame}.webp`
);

const spriteUrls = (): string[] => {
  const urls: string[] = [];
  for (const type of DEFENSE_ENEMY_TYPES) {
    urls.push(spriteUrl(type, 'idle'), spriteUrl(type, 'move'));
  }
  return urls;
};

let cachedAtlas: DefenseEnemySpriteAtlas | null = null;

const buildAtlasFromImageMap = (
  map: Map<string, HTMLImageElement>,
): DefenseEnemySpriteAtlas | null => {
  const atlas = new Map<DefenseEnemyType, DefenseEnemySpritePair>();
  for (const type of DEFENSE_ENEMY_TYPES) {
    const idle = map.get(spriteUrl(type, 'idle'));
    const move = map.get(spriteUrl(type, 'move'));
    const available = idle ?? move;
    if (available) {
      atlas.set(type, { idle: idle ?? available, move: move ?? available });
    }
  }
  return atlas.size > 0 ? atlas : null;
};

export const getCachedDefenseEnemySprites = (): DefenseEnemySpriteAtlas | null => (
  cachedAtlas ?? buildAtlasFromImageMap(copyCachedBattleImages(spriteUrls()))
);

export const clearDefenseEnemySpriteCacheForTests = (): void => {
  cachedAtlas = null;
};

/** Publish each available species independently; failed frames remain retryable. */
export const loadDefenseEnemySprites = async (
  onLoaded?: (atlas: DefenseEnemySpriteAtlas) => void,
): Promise<DefenseEnemySpriteAtlas | null> => {
  if (cachedAtlas) {
    onLoaded?.(cachedAtlas);
    return cachedAtlas;
  }
  const urls = spriteUrls();
  const map = await preloadEarTrainingBattleImages(urls, (images) => {
    const atlas = buildAtlasFromImageMap(images);
    if (atlas) onLoaded?.(atlas);
  });
  const atlas = buildAtlasFromImageMap(map);
  if (map.size === urls.length) cachedAtlas = atlas;
  return atlas;
};
