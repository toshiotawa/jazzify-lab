#!/usr/bin/env node
/**
 * サバイバル降下マップ / ゲーム用スプライトを WebP に変換する。
 * - キャラ (muki): 256px（マップ ~88px・ゲーム 48px 表示の 2〜3x）
 * - ボスシルエット: 256px（マップ ~110px 表示の 2x）
 */
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mukiDir = join(root, 'public', 'default_avater', 'muki');
const monsterDir = join(root, 'public', 'monster_icons');

const SPRITE_MAX_SIZE = 256;
const BOSS_MAX_SIZE = 256;
const WEBP_QUALITY = 82;

const BOSS_FILES = ['monster_45.png', 'monster_50.png', 'monster_63.png'];

const convertToWebp = async (srcPath, destPath, maxSize) => {
  await sharp(srcPath)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(destPath);
};

let bytesBefore = 0;
let bytesAfter = 0;

const mukiPngs = readdirSync(mukiDir).filter((f) => f.endsWith('.png'));
for (const file of mukiPngs) {
  const src = join(mukiDir, file);
  const destName = file.replace(/\.png$/i, '.webp');
  const dest = join(mukiDir, destName);
  await convertToWebp(src, dest, SPRITE_MAX_SIZE);
  const srcSize = statSync(src).size;
  const destSize = statSync(dest).size;
  bytesBefore += srcSize;
  bytesAfter += destSize;
  console.log(`muki ${file}: ${(srcSize / 1024).toFixed(1)} KiB -> ${destName} ${(destSize / 1024).toFixed(1)} KiB`);
}

for (const file of BOSS_FILES) {
  const src = join(monsterDir, file);
  const destName = file.replace(/\.png$/i, '.webp');
  const dest = join(monsterDir, destName);
  await convertToWebp(src, dest, BOSS_MAX_SIZE);
  const srcSize = statSync(src).size;
  const destSize = statSync(dest).size;
  bytesBefore += srcSize;
  bytesAfter += destSize;
  console.log(`boss ${file}: ${(srcSize / 1024).toFixed(1)} KiB -> ${destName} ${(destSize / 1024).toFixed(1)} KiB`);
}

console.log(
  `Done: ${mukiPngs.length} muki + ${BOSS_FILES.length} boss webp. `
    + `Total ${(bytesBefore / 1024 / 1024).toFixed(2)} MiB -> ${(bytesAfter / 1024 / 1024).toFixed(2)} MiB`,
);
