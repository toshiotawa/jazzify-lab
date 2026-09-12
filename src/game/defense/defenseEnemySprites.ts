/**
 * Defense enemy sprite loading (preloaded once at mount; no gameplay allocations).
 */
import type { DefenseEnemyFrame } from '@/game/defense/defenseEnemyConfig';
import { DEFENSE_ENEMY_TYPES } from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemyType } from '@/game/defense/defenseTypes';
import { preloadEarTrainingBattleImages } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';

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
let atlasLoadPromise: Promise<DefenseEnemySpriteAtlas | null> | null = null;

const buildAtlasFromImageMap = (
  map: Map<string, HTMLImageElement>,
): DefenseEnemySpriteAtlas | null => {
  const atlas = new Map<DefenseEnemyType, DefenseEnemySpritePair>();
  for (const type of DEFENSE_ENEMY_TYPES) {
    const idle = map.get(spriteUrl(type, 'idle'));
    const move = map.get(spriteUrl(type, 'move'));
    if (!idle || !move) {
      return null;
    }
    atlas.set(type, { idle, move });
  }
  return atlas;
};

export const getCachedDefenseEnemySprites = (): DefenseEnemySpriteAtlas | null => cachedAtlas;

export const clearDefenseEnemySpriteCacheForTests = (): void => {
  cachedAtlas = null;
  atlasLoadPromise = null;
};

/** Resolves to null when any sprite failed to load (renderer then skips enemies). */
export const loadDefenseEnemySprites = async (): Promise<DefenseEnemySpriteAtlas | null> => {
  if (cachedAtlas) {
    return cachedAtlas;
  }
  if (atlasLoadPromise) {
    return atlasLoadPromise;
  }

  atlasLoadPromise = preloadEarTrainingBattleImages(spriteUrls()).then((map) => {
    const atlas = buildAtlasFromImageMap(map);
    if (atlas) {
      cachedAtlas = atlas;
    }
    atlasLoadPromise = null;
    return atlas;
  });

  return atlasLoadPromise;
};
