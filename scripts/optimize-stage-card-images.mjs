#!/usr/bin/env node
/**
 * レッスン用ステージカード PNG を WebP サムネに変換する。
 * - rectangular: 幅 640px（「続きから」カード表示用）
 * - square: 128px 正方形（チャプター一覧 44px 表示の 2x）
 */
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rectangularDir = join(root, 'public', 'stage_cards_collection', 'rectangular_cards');
const squareDir = join(root, 'public', 'stage_cards_collection', 'square_backgrounds');

const RECTANGULAR_MAX_WIDTH = 640;
const SQUARE_THUMB_SIZE = 128;
const WEBP_QUALITY = 82;

const optimizeRectangular = async (fileName) => {
  const src = join(rectangularDir, fileName);
  const destName = fileName.replace(/\.png$/i, '.webp');
  const dest = join(rectangularDir, destName);
  await sharp(src)
    .resize({ width: RECTANGULAR_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(dest);
  return { destName, before };
};

const optimizeSquare = async (fileName) => {
  const src = join(squareDir, fileName);
  const destName = fileName.replace(/\.png$/i, '.webp');
  const dest = join(squareDir, destName);
  await sharp(src)
    .resize(SQUARE_THUMB_SIZE, SQUARE_THUMB_SIZE, { fit: 'cover' })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(dest);
  return destName;
};

mkdirSync(rectangularDir, { recursive: true });
mkdirSync(squareDir, { recursive: true });

const rectangularPngs = readdirSync(rectangularDir).filter((f) => f.endsWith('.png'));
const squarePngs = readdirSync(squareDir).filter((f) => f.endsWith('.png'));

let rectBytesBefore = 0;
let rectBytesAfter = 0;
for (const file of rectangularPngs) {
  const { destName } = await optimizeRectangular(file);
  const srcSize = statSync(join(rectangularDir, file)).size;
  const destSize = statSync(join(rectangularDir, destName)).size;
  rectBytesBefore += srcSize;
  rectBytesAfter += destSize;
  console.log(`rect ${file}: ${(srcSize / 1024).toFixed(1)} KiB -> ${destName} ${(destSize / 1024).toFixed(1)} KiB`);
}

let squareBytesBefore = 0;
let squareBytesAfter = 0;
for (const file of squarePngs) {
  const destName = await optimizeSquare(file);
  const srcSize = statSync(join(squareDir, file)).size;
  const destSize = statSync(join(squareDir, destName)).size;
  squareBytesBefore += srcSize;
  squareBytesAfter += destSize;
  console.log(`square ${file}: ${(srcSize / 1024).toFixed(1)} KiB -> ${destName} ${(destSize / 1024).toFixed(1)} KiB`);
}

console.log(
  `Done: ${rectangularPngs.length} rectangular + ${squarePngs.length} square webp. `
  + `Total ${(rectBytesBefore / 1024 / 1024).toFixed(2)} MiB -> ${(rectBytesAfter / 1024 / 1024).toFixed(2)} MiB`,
);
