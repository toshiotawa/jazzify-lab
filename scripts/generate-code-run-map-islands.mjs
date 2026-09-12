#!/usr/bin/env node
/** Code Run ワールドマップ用の浮島スプライトを Kenney タイルから合成する。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TILE = 48;
const KENNEY = path.join(
  ROOT,
  'public/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default',
);
const WEB_OUT = path.join(ROOT, 'public/code-run-map');
const IOS_OUT = path.join(ROOT, 'ios/Jazzify/Assets.xcassets/CodeRunMap');
const BIOMES = ['grass', 'sand', 'snow', 'stone', 'purple'];

const tilePath = (biome, name) => path.join(KENNEY, `terrain_${biome}_${name}.png`);

async function loadTile(biome, name) {
  return sharp(tilePath(biome, name)).ensureAlpha().png().toBuffer();
}

async function composeIsland(biome, cols, topNames, bottomNames) {
  const width = cols * TILE;
  const height = 2 * TILE;
  const composites = [];
  for (let col = 0; col < cols; col += 1) {
    const top = await loadTile(biome, topNames[col]);
    composites.push({ input: top, left: col * TILE, top: 0 });
  }
  for (let col = 0; col < cols; col += 1) {
    const bottom = await loadTile(biome, bottomNames[col]);
    composites.push({ input: bottom, left: col * TILE, top: TILE });
  }
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function saveWeb(buffer, name) {
  fs.mkdirSync(WEB_OUT, { recursive: true });
  const out = path.join(WEB_OUT, name);
  await sharp(buffer).webp({ quality: 92 }).toFile(out);
  console.log(out);
}

async function saveIos(buffer, assetName) {
  const imageset = path.join(IOS_OUT, `${assetName}.imageset`);
  fs.mkdirSync(imageset, { recursive: true });
  const pngPath = path.join(imageset, `${assetName}.png`);
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(pngPath);
  const contents = {
    images: [{ filename: `${assetName}.png`, idiom: 'universal', scale: '1x' }],
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(path.join(imageset, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
  console.log(pngPath);
}

async function copySkyAssets() {
  const bgDir = path.join(KENNEY, '../../Backgrounds/Default');
  const skySrc = path.join(bgDir, 'background_solid_sky.png');
  const cloudsSrc = path.join(bgDir, 'background_clouds.png');
  if (fs.existsSync(skySrc)) {
    const sky = await sharp(skySrc).ensureAlpha().png().toBuffer();
    await saveWeb(sky, 'sky.webp');
    await saveIos(sky, 'code_run_map_sky');
  }
  if (fs.existsSync(cloudsSrc)) {
    const clouds = await sharp(cloudsSrc).ensureAlpha().png().toBuffer();
    await saveWeb(clouds, 'clouds.webp');
    await saveIos(clouds, 'code_run_map_clouds');
  }
}

async function main() {
  for (const biome of BIOMES) {
    const smallTop = ['block_top_left', 'block_top', 'block_top_right'];
    const smallBottom = ['block_left', 'block_center', 'block_right'];
    const bigTop = ['block_top_left', 'block_top', 'block_top', 'block_top', 'block_top_right'];
    const bigBottom = ['block_left', 'block_center', 'block_center', 'block_center', 'block_right'];

    const small = await composeIsland(biome, 3, smallTop, smallBottom);
    const big = await composeIsland(biome, 5, bigTop, bigBottom);
    await saveWeb(small, `island_small_${biome}.webp`);
    await saveWeb(big, `island_big_${biome}.webp`);
    await saveIos(small, `code_run_map_island_small_${biome}`);
    await saveIos(big, `code_run_map_island_big_${biome}`);
  }
  await copySkyAssets();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
