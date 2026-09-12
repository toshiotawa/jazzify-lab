#!/usr/bin/env node
/** Kenney の浮島タイル (terrain_*_cloud) を iOS Asset Catalog へそのままコピーする。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KENNEY_TILES = path.join(
  ROOT,
  'public/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default',
);
const KENNEY_BG = path.join(
  ROOT,
  'public/RUN/kenney_new-platformer-pack-1/Sprites/Backgrounds/Default',
);
const IOS_OUT = path.join(ROOT, 'ios/Jazzify/Assets.xcassets/CodeRunMap');
const BIOMES = ['grass', 'sand', 'snow', 'stone', 'purple'];

function writeImageset(assetName, srcPath) {
  const imageset = path.join(IOS_OUT, `${assetName}.imageset`);
  fs.mkdirSync(imageset, { recursive: true });
  const dest = path.join(imageset, `${assetName}.png`);
  fs.copyFileSync(srcPath, dest);
  const contents = {
    images: [{ filename: `${assetName}.png`, idiom: 'universal', scale: '1x' }],
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(path.join(imageset, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
  console.log(dest);
}

function main() {
  for (const biome of BIOMES) {
    const src = path.join(KENNEY_TILES, `terrain_${biome}_cloud.png`);
    writeImageset(`code_run_map_island_small_${biome}`, src);
    writeImageset(`code_run_map_island_big_${biome}`, src);
  }
  writeImageset('code_run_map_sky', path.join(KENNEY_BG, 'background_solid_sky.png'));
  writeImageset('code_run_map_clouds', path.join(KENNEY_BG, 'background_clouds.png'));
  console.log('Done.');
}

main();
