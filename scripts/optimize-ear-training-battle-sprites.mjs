#!/usr/bin/env node
/**
 * 耳コピバトル用キャラ・ポーズ・敵アイコンを WebP に変換する。
 * - 立ち絵・ポーズ: 192px（96px 表示の 2x）
 * - stage_icons: 192px
 */
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEBP_QUALITY = 82;
const BATTLE_SPRITE_MAX_SIZE = 192;

const convertToWebp = async (srcPath, destPath, maxSize) => {
  await sharp(srcPath)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(destPath);
};

let bytesBefore = 0;
let bytesAfter = 0;

const logConversion = (label, src, dest) => {
  const srcSize = statSync(src).size;
  const destSize = statSync(dest).size;
  bytesBefore += srcSize;
  bytesAfter += destSize;
  const destName = dest.split('/').pop() ?? dest;
  console.log(`${label}: ${(srcSize / 1024).toFixed(1)} KiB -> ${destName} ${(destSize / 1024).toFixed(1)} KiB`);
};

const poseFiles = [
  join(root, 'public', 'GuardD.png'),
  join(root, 'public', 'finish.png'),
  join(root, 'public', 'data', 'eishou.png'),
];

for (const src of poseFiles) {
  const dest = src.replace(/\.png$/i, '.webp');
  await convertToWebp(src, dest, BATTLE_SPRITE_MAX_SIZE);
  logConversion('pose', src, dest);
}

const stageIconsDir = join(root, 'public', 'stage_icons');
const stagePngs = readdirSync(stageIconsDir).filter((f) => /^(\d+)\.png$/i.test(f));
for (const file of stagePngs) {
  const src = join(stageIconsDir, file);
  const dest = join(stageIconsDir, file.replace(/\.png$/i, '.webp'));
  await convertToWebp(src, dest, BATTLE_SPRITE_MAX_SIZE);
  logConversion('stage_icon', src, dest);
}

const hammerSrc = join(
  root,
  'public',
  'ear-training',
  'tutorial-earcopy-test',
  'effect-hammer-transparent.png',
);
const hammerDest = hammerSrc.replace(/\.png$/i, '.webp');
await convertToWebp(hammerSrc, hammerDest, 128);
logConversion('hammer', hammerSrc, hammerDest);

console.log(
  `Done: ${poseFiles.length} poses + ${stagePngs.length} stage icons + hammer. `
    + `Total ${(bytesBefore / 1024 / 1024).toFixed(2)} MiB -> ${(bytesAfter / 1024 / 1024).toFixed(2)} MiB`,
);
