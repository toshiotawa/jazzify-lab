#!/usr/bin/env node
/**
 * Copies self-hosted web font files from @fontsource packages into public/fonts/lp/.
 * Run after npm install: node scripts/subset-lp-fonts.mjs
 */
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts', 'lp');

const fontSources = [
  {
    dir: join(root, 'node_modules', '@fontsource', 'space-grotesk', 'files'),
    packageName: '@fontsource/space-grotesk',
    files: [
      'space-grotesk-latin-600-normal.woff2',
      'space-grotesk-latin-700-normal.woff2',
    ],
  },
  {
    dir: join(root, 'node_modules', '@fontsource', 'zen-kaku-gothic-new', 'files'),
    packageName: '@fontsource/zen-kaku-gothic-new',
    files: [
      'zen-kaku-gothic-new-latin-400-normal.woff2',
      'zen-kaku-gothic-new-latin-700-normal.woff2',
      'zen-kaku-gothic-new-latin-900-normal.woff2',
      'zen-kaku-gothic-new-japanese-400-normal.woff2',
      'zen-kaku-gothic-new-japanese-700-normal.woff2',
      'zen-kaku-gothic-new-japanese-900-normal.woff2',
    ],
  },
];

mkdirSync(outDir, { recursive: true });

let copied = 0;

for (const { dir, packageName, files } of fontSources) {
  if (!existsSync(dir)) {
    console.error(`Missing ${packageName}. Run: npm install`);
    process.exit(1);
  }

  for (const file of files) {
    const src = join(dir, file);
    if (!existsSync(src)) {
      console.error(`Missing font file: ${src}`);
      process.exit(1);
    }
    cpSync(src, join(outDir, file));
    copied += 1;
  }
}

const zenKakuCssSrc = join(root, 'src', 'zenKakuFontFaces.css');
const zenKakuCssDest = join(outDir, 'zen-kaku-font-faces.css');
if (!existsSync(zenKakuCssSrc)) {
  console.error(`Missing font CSS: ${zenKakuCssSrc}`);
  process.exit(1);
}
cpSync(zenKakuCssSrc, zenKakuCssDest);

console.log(`Copied ${copied} font files and zen-kaku-font-faces.css to public/fonts/lp/`);
