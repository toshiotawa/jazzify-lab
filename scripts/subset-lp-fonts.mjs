#!/usr/bin/env node
/**
 * Copies self-hosted LP font files from @fontsource packages into public/fonts/lp/.
 * Run after npm install: node scripts/subset-lp-fonts.mjs
 */
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts', 'lp');
const spaceGroteskDir = join(root, 'node_modules', '@fontsource', 'space-grotesk', 'files');

const files = [
  'space-grotesk-latin-600-normal.woff2',
  'space-grotesk-latin-700-normal.woff2',
];

if (!existsSync(spaceGroteskDir)) {
  console.error('Missing @fontsource/space-grotesk. Run: npm install');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const src = join(spaceGroteskDir, file);
  if (!existsSync(src)) {
    console.error(`Missing font file: ${src}`);
    process.exit(1);
  }
  cpSync(src, join(outDir, file));
}

console.log(`Copied ${files.length} Space Grotesk files to public/fonts/lp/`);
