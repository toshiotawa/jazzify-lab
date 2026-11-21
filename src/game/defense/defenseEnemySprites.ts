/**
 * Defense enemy sprite loading (preloaded once at mount; no gameplay allocations).
 */
import type { DefenseEnemyFrame } from '@/game/defense/defenseEnemyConfig';
import {
  DEFENSE_DANCE_FRAMES,
  DEFENSE_ENEMY_TYPES,
  DEFENSE_WALK_FRAMES,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemyType } from '@/game/defense/defenseTypes';
import { copyCachedBattleImages, preloadEarTrainingBattleImages } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';

type DefenseEnemyFrames = Readonly<Record<DefenseEnemyFrame, HTMLImageElement>>;

export type DefenseEnemySpriteAtlas = ReadonlyMap<DefenseEnemyType, DefenseEnemyFrames>;

const ALL_FRAMES = [...DEFENSE_WALK_FRAMES, ...DEFENSE_DANCE_FRAMES] as const;

const spriteUrl = (type: DefenseEnemyType, frame: DefenseEnemyFrame): string => (
  `${import.meta.env.BASE_URL}battle-pixels/pixel-${type}_${frame}.png`
);

const spriteUrls = (): string[] => {
  const urls: string[] = [];
  for (const type of DEFENSE_ENEMY_TYPES) {
    for (const frame of ALL_FRAMES) urls.push(spriteUrl(type, frame));
  }
  return urls;
};

let cachedAtlas: DefenseEnemySpriteAtlas | null = null;

const buildAtlasFromImageMap = (
  map: Map<string, HTMLImageElement>,
): DefenseEnemySpriteAtlas | null => {
  const atlas = new Map<DefenseEnemyType, DefenseEnemyFrames>();
  for (const type of DEFENSE_ENEMY_TYPES) {
    const idle = map.get(spriteUrl(type, 'idle'));
    const move = map.get(spriteUrl(type, 'move'));
    const passing = map.get(spriteUrl(type, 'passing'));
    const recoil = map.get(spriteUrl(type, 'recoil'));
    const dance1 = map.get(spriteUrl(type, 'dance_1'));
    const dance2 = map.get(spriteUrl(type, 'dance_2'));
    const dance3 = map.get(spriteUrl(type, 'dance_3'));
    const dance4 = map.get(spriteUrl(type, 'dance_4'));
    const available = idle ?? move ?? passing ?? recoil ?? dance1;
    if (available) {
      atlas.set(type, {
        idle: idle ?? available,
        passing: passing ?? available,
        move: move ?? available,
        recoil: recoil ?? available,
        dance_1: dance1 ?? available,
        dance_2: dance2 ?? available,
        dance_3: dance3 ?? available,
        dance_4: dance4 ?? available,
      });
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