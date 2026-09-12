import { SURVIVAL_DEFAULT_SPRITE_PATHS } from '@/utils/survivalPlayerSprites';

export const CODE_RUN_MAP_ASSET_VERSION = '20260912c';

export const codeRunMapAssetUrl = (path: string): string => {
  const base = path.split('?')[0] ?? path;
  return `${base}?v=${CODE_RUN_MAP_ASSET_VERSION}`;
};

const KENNEY_BG_BASE = '/RUN/kenney_new-platformer-pack-1/Sprites/Backgrounds/Default';

export const CODE_RUN_MAP_TEXTURE_URLS = {
  sky: codeRunMapAssetUrl(`${KENNEY_BG_BASE}/background_solid_sky.png`),
  clouds: codeRunMapAssetUrl(`${KENNEY_BG_BASE}/background_clouds.png`),
  platform: codeRunMapAssetUrl('/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png'),
} as const;

export const CODE_RUN_MAP_PRELOAD_IMAGES: readonly string[] = [
  CODE_RUN_MAP_TEXTURE_URLS.sky,
  CODE_RUN_MAP_TEXTURE_URLS.clouds,
  CODE_RUN_MAP_TEXTURE_URLS.platform,
  codeRunMapAssetUrl(SURVIVAL_DEFAULT_SPRITE_PATHS.migi),
  codeRunMapAssetUrl(SURVIVAL_DEFAULT_SPRITE_PATHS.shita),
];
