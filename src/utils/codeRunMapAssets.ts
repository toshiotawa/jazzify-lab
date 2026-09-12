import { CODE_RUN_HERO_SPRITE_URL } from '@/components/survival/codeRun/codeRunSpriteUrls';
import type { CodeRunMapBiome } from '@/utils/codeRunMapTheme';

export const CODE_RUN_MAP_ASSET_VERSION = '20260912a';

export const codeRunMapAssetUrl = (path: string): string => {
  const base = path.split('?')[0] ?? path;
  return `${base}?v=${CODE_RUN_MAP_ASSET_VERSION}`;
};

export const CODE_RUN_MAP_TEXTURE_URLS = {
  sky: codeRunMapAssetUrl('/code-run-map/sky.webp'),
  clouds: codeRunMapAssetUrl('/code-run-map/clouds.webp'),
} as const;

export const codeRunMapIslandUrl = (
  biome: CodeRunMapBiome,
  size: 'small' | 'big',
): string => codeRunMapAssetUrl(`/code-run-map/island_${size}_${biome}.webp`);

export const CODE_RUN_MAP_PRELOAD_IMAGES: readonly string[] = [
  CODE_RUN_MAP_TEXTURE_URLS.sky,
  CODE_RUN_MAP_TEXTURE_URLS.clouds,
  codeRunMapAssetUrl('/code-run-map/island_small_grass.webp'),
  codeRunMapAssetUrl('/code-run-map/island_big_grass.webp'),
  codeRunMapAssetUrl('/code-run-map/island_small_sand.webp'),
  codeRunMapAssetUrl('/code-run-map/island_big_sand.webp'),
  codeRunMapAssetUrl('/code-run-map/island_small_snow.webp'),
  codeRunMapAssetUrl('/code-run-map/island_big_snow.webp'),
  codeRunMapAssetUrl('/code-run-map/island_small_stone.webp'),
  codeRunMapAssetUrl('/code-run-map/island_big_stone.webp'),
  codeRunMapAssetUrl('/code-run-map/island_small_purple.webp'),
  codeRunMapAssetUrl('/code-run-map/island_big_purple.webp'),
  codeRunMapAssetUrl(CODE_RUN_HERO_SPRITE_URL),
];
