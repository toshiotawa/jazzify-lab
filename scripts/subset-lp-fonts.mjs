#!/usr/bin/env node
/**
 * LP 用フォントを public/fonts/lp/ に配置する。
 * 日本語 Zen Kaku は landingCopy / HTML から抽出したグリフだけにサブセットする。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts', 'lp');

const GLYPH_SAFETY =
  '、。・「」『』（）—￥…！？♪→％＋：；'
  + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  + ' \n\t\u00a0';

const extractStringLiterals = (text) => {
  const values = [];
  const patterns = [
    /'((?:\\.|[^'\\])*)'/g,
    /"((?:\\.|[^"\\])*)"/g,
    /`((?:\\.|[^`\\])*)`/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      values.push(match[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
    }
  }
  return values;
};

const collectLpGlyphs = () => {
  const glyphs = new Set([...GLYPH_SAFETY]);
  const landingCopyPath = join(root, 'src', 'components', 'landing', 'landingCopy.ts');
  const landingCopy = readFileSync(landingCopyPath, 'utf8');
  for (const value of extractStringLiterals(landingCopy)) {
    for (const char of value) {
      glyphs.add(char);
    }
  }

  for (const fileName of ['index.html', 'index-en.html']) {
    const html = readFileSync(join(root, fileName), 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
    for (const char of html) {
      glyphs.add(char);
    }
  }

  return [...glyphs].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
};

const fontSources = [
  {
    dir: join(root, 'node_modules', '@fontsource', 'space-grotesk', 'files'),
    packageName: '@fontsource/space-grotesk',
    files: [
      'space-grotesk-latin-600-normal.woff2',
      'space-grotesk-latin-700-normal.woff2',
    ],
    subset: false,
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
    subset: (fileName) => fileName.includes('japanese'),
  },
];

mkdirSync(outDir, { recursive: true });

const glyphText = collectLpGlyphs();
let copied = 0;

for (const { dir, packageName, files, subset } of fontSources) {
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

    const dest = join(outDir, file);
    const shouldSubset = typeof subset === 'function' ? subset(file) : subset;
    if (!shouldSubset) {
      cpSync(src, dest);
      copied += 1;
      continue;
    }

    const original = readFileSync(src);
    const subsetted = await subsetFont(original, glyphText, { targetFormat: 'woff2' });
    writeFileSync(dest, subsetted);
    copied += 1;
    console.log(
      `Subset ${file}: ${(original.length / 1024).toFixed(1)} KiB -> ${(subsetted.length / 1024).toFixed(1)} KiB (${glyphText.length} glyphs)`,
    );
  }
}

const zenKakuCssSrc = join(root, 'src', 'zenKakuFontFaces.css');
const zenKakuCssDest = join(outDir, 'zen-kaku-font-faces.css');
if (!existsSync(zenKakuCssSrc)) {
  console.error(`Missing font CSS: ${zenKakuCssSrc}`);
  process.exit(1);
}
cpSync(zenKakuCssSrc, zenKakuCssDest);

const zenKaku900CssSrc = join(root, 'src', 'zenKakuFontFaces900.css');
const zenKaku900CssDest = join(outDir, 'zen-kaku-font-faces-900.css');
if (!existsSync(zenKaku900CssSrc)) {
  console.error(`Missing font CSS: ${zenKaku900CssSrc}`);
  process.exit(1);
}
cpSync(zenKaku900CssSrc, zenKaku900CssDest);

console.log(`Prepared ${copied} font files and zen-kaku-font-faces.css in public/fonts/lp/`);
