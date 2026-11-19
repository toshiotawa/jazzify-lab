/** Install one of the reviewed sheets in both clients. Run from any directory. */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const palettes = new Map([['A', 32], ['B', 12], ['C', 24]]);
const variant = process.argv[2];
if (!palettes.has(variant)) throw new Error('Usage: node scripts/select-battle-hero.mjs A|B|C');

const asset = (path) => new URL('../' + path, import.meta.url);
const sheet = await readFile(asset(`assets-src/battle-hero-variants/${variant}.png`));
const { width, height } = await sharp(sheet).metadata();
if (!width || width !== height || width % 4 !== 0) throw new Error('Expected a square 4 × 4 sheet');
const size = width / 4;
const poses = [
  'idle-1', 'idle-2', 'idle-3', 'idle-4',
  'slash-1', 'slash-2', 'slash-3', 'slash-4',
  'guard-d', 'guard-e', 'finish', 'cast',
  'skill-1', 'skill-2', 'skill-3', 'skill-4',
];

for (const [index, pose] of poses.entries()) {
  const name = `pixel-hero-${pose}`;
  const frame = await sharp(sheet)
    .extract({ left: (index % 4) * size, top: Math.floor(index / 4) * size, width: size, height: size })
    .png({ palette: true, colours: palettes.get(variant), dither: 0 })
    .toBuffer();
  await Promise.all([
    writeFile(asset(`public/battle-pixels/${name}.png`), frame),
    writeFile(asset(`ios/Jazzify/Assets.xcassets/BattlePixels/${name}.imageset/${name}.png`), frame),
  ]);
}
