#!/usr/bin/env node
/**
 * Defense プレイヤー待機・縦斬りスプライトを WebP / iOS imageset に変換する。
 * - 待機 3 枚: マゼンタ背景 (235,13,241) をクロマキー透過
 * - 縦斬り: 既存 alpha 付き PNG をそのまま利用
 */
import { copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEBP_QUALITY = 82;
const SPRITE_MAX_SIZE = 256;
const CHROMA_KEY = { r: 235, g: 13, b: 241 };
const CHROMA_HARD = 42;
const CHROMA_SOFT = 72;

const idleSources = [
  {
    src: join(root, 'assets', 'defense-player', 'idle_1.png'),
    webName: 'idle_1',
    iosName: 'defense_player_idle_1',
  },
  {
    src: join(root, 'assets', 'defense-player', 'idle_2.png'),
    webName: 'idle_2',
    iosName: 'defense_player_idle_2',
  },
  {
    src: join(root, 'assets', 'defense-player', 'idle_3.png'),
    webName: 'idle_3',
    iosName: 'defense_player_idle_3',
  },
];

const slashSource = {
  src: join(root, 'assets', 'defense-player', 'slash.png'),
  webName: 'slash',
  iosName: 'defense_player_slash',
};

const webOutDir = join(root, 'public', 'defense', 'player');
const iosOutDir = join(root, 'ios', 'Jazzify', 'Assets.xcassets', 'Defense');

const chromaKeyDistance = (r, g, b) => {
  const dr = r - CHROMA_KEY.r;
  const dg = g - CHROMA_KEY.g;
  const db = b - CHROMA_KEY.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const applyChromaKey = async (srcPath) => {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = chromaKeyDistance(r, g, b);
    if (dist <= CHROMA_HARD) {
      data[i + 3] = 0;
    } else if (dist < CHROMA_SOFT) {
      const t = (dist - CHROMA_HARD) / (CHROMA_SOFT - CHROMA_HARD);
      data[i + 3] = Math.round(data[i + 3] * t);
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  });
};

const writeWebp = async (pipeline, destPath) => {
  await pipeline
    .clone()
    .resize(SPRITE_MAX_SIZE, SPRITE_MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(destPath);
};

const writeIosImageset = async (pipeline, assetName) => {
  const imagesetDir = join(iosOutDir, `${assetName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });
  const pngName = `${assetName}.png`;
  await pipeline
    .clone()
    .resize(SPRITE_MAX_SIZE, SPRITE_MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toFile(join(imagesetDir, pngName));
  writeFileSync(
    join(imagesetDir, 'Contents.json'),
    `${JSON.stringify({
      images: [
        { filename: pngName, idiom: 'universal', scale: '1x' },
        { idiom: 'universal', scale: '2x' },
        { idiom: 'universal', scale: '3x' },
      ],
      info: { author: 'xcode', version: 1 },
    }, null, 2)}\n`,
  );
};

const logConversion = (label, src, webDest) => {
  const srcSize = statSync(src).size;
  const destSize = statSync(webDest).size;
  console.log(
    `${label}: ${(srcSize / 1024).toFixed(1)} KiB -> ${webDest.split('/').pop()} `
    + `${(destSize / 1024).toFixed(1)} KiB`,
  );
};

mkdirSync(webOutDir, { recursive: true });
mkdirSync(join(root, 'assets', 'defense-player'), { recursive: true });

const downloadIdleSources = [
  join(process.env.HOME ?? '', 'Downloads', 'ChatGPT Image 2026年9月13日 16_33_22 (1).png'),
  join(process.env.HOME ?? '', 'Downloads', 'ChatGPT Image 2026年9月13日 16_33_22 (2).png'),
  join(process.env.HOME ?? '', 'Downloads', 'ChatGPT Image 2026年9月13日 16_33_22 (3).png'),
];

for (let i = 0; i < downloadIdleSources.length; i += 1) {
  const dest = join(root, 'assets', 'defense-player', `idle_${i + 1}.png`);
  if (!statSync(dest, { throwIfNoEntry: false })) {
    copyFileSync(downloadIdleSources[i], dest);
  }
}

const slashAssetSrc = join(root, 'assets', 'defense-player', 'slash.png');
if (!statSync(slashAssetSrc, { throwIfNoEntry: false })) {
  copyFileSync(join(root, 'public', 'GuardD_vertical_slash_transparent.png'), slashAssetSrc);
}

for (const entry of idleSources) {
  const pipeline = await applyChromaKey(entry.src);
  const webDest = join(webOutDir, `${entry.webName}.webp`);
  await writeWebp(pipeline, webDest);
  await writeIosImageset(pipeline, entry.iosName);
  logConversion(entry.webName, entry.src, webDest);
}

{
  const pipeline = sharp(slashSource.src).ensureAlpha();
  const webDest = join(webOutDir, `${slashSource.webName}.webp`);
  await writeWebp(pipeline, webDest);
  await writeIosImageset(pipeline, slashSource.iosName);
  logConversion(slashSource.webName, slashSource.src, webDest);
}

const legacySlashPng = join(root, 'public', 'GuardD_vertical_slash_transparent.png');
if (statSync(legacySlashPng, { throwIfNoEntry: false })) {
  rmSync(legacySlashPng);
}

console.log(`Done: ${idleSources.length} idle + 1 slash -> ${webOutDir}`);
