import { BOSS_SPRITE_PATH } from '@/components/survival/boss/SurvivalBossTypes';
import { SURVIVAL_DEFAULT_SPRITE_PATHS } from '@/utils/survivalPlayerSprites';

/** 降下マップ静的アセットのキャッシュバスター（WebP 化時に更新） */
export const DESCENT_MAP_ASSET_VERSION = '20260707a';

export const descentMapAssetUrl = (path: string): string => {
  const base = path.split('?')[0] ?? path;
  return `${base}?v=${DESCENT_MAP_ASSET_VERSION}`;
};

export const DESCENT_MAP_TEXTURE_URLS = {
  background: descentMapAssetUrl('/background.webp'),
  odoriba: descentMapAssetUrl('/odoriba.webp'),
  bigOdoriba: descentMapAssetUrl('/big_odoriba.webp'),
  door: descentMapAssetUrl('/door.webp'),
} as const;

const descentMapBossPreloadUrls = (): string[] =>
  (Object.values(BOSS_SPRITE_PATH) as string[]).map((path) => descentMapAssetUrl(path));

/** マップ表示前に先読みする画像（環境テクスチャ + 最前線キャラ + ボス） */
export const DESCENT_MAP_PRELOAD_IMAGES: readonly string[] = [
  DESCENT_MAP_TEXTURE_URLS.background,
  DESCENT_MAP_TEXTURE_URLS.bigOdoriba,
  DESCENT_MAP_TEXTURE_URLS.odoriba,
  DESCENT_MAP_TEXTURE_URLS.door,
  descentMapAssetUrl(SURVIVAL_DEFAULT_SPRITE_PATHS.migi),
  descentMapAssetUrl(SURVIVAL_DEFAULT_SPRITE_PATHS.shita),
  ...descentMapBossPreloadUrls(),
];
