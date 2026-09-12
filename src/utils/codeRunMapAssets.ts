import { SURVIVAL_DEFAULT_SPRITE_PATHS } from '@/utils/survivalPlayerSprites';

export const CODE_RUN_MAP_ASSET_VERSION = '20260912d';

export const codeRunMapAssetUrl = (path: string): string => {
  const base = path.split('?')[0] ?? path;
  return `${base}?v=${CODE_RUN_MAP_ASSET_VERSION}`;
};

export const CODE_RUN_MAP_TEXTURE_URLS = {
  platformSmall: codeRunMapAssetUrl('/code-run-map/platform_small.png'),
  platformBig: codeRunMapAssetUrl('/code-run-map/platform_big.png'),
  nightCityBg: codeRunMapAssetUrl('/code-run-map/night_city_bg.webp'),
} as const;

export const CODE_RUN_MAP_PRELOAD_IMAGES: readonly string[] = [
  CODE_RUN_MAP_TEXTURE_URLS.platformSmall,
  CODE_RUN_MAP_TEXTURE_URLS.platformBig,
  CODE_RUN_MAP_TEXTURE_URLS.nightCityBg,
  codeRunMapAssetUrl(SURVIVAL_DEFAULT_SPRITE_PATHS.migi),
  codeRunMapAssetUrl(SURVIVAL_DEFAULT_SPRITE_PATHS.shita),
];
