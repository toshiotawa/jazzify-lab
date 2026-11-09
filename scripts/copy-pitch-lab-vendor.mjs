/**
 * PitchPlease / EffeTune の Worklet・WASM を public/vendor へコピーする。
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const pitchPleaseRoot = join(root, 'node_modules/@markusstrasser/pitchplease');
const effetuneRoot = join(root, 'node_modules/@effetune/dsp/dist');

const pitchDest = join(root, 'public/vendor/pitchplease');
const effetuneDest = join(root, 'public/vendor/effetune');

const requirePath = (path, label) => {
  if (!existsSync(path)) {
    throw new Error(`${label} が見つかりません: ${path}. npm install を実行してください。`);
  }
};

requirePath(pitchPleaseRoot, '@markusstrasser/pitchplease');
requirePath(effetuneRoot, '@effetune/dsp/dist');

mkdirSync(pitchDest, { recursive: true });
mkdirSync(effetuneDest, { recursive: true });

cpSync(join(pitchPleaseRoot, 'engine'), join(pitchDest, 'engine'), { recursive: true });
const modelDir = join(pitchDest, 'models');
mkdirSync(modelDir, { recursive: true });
for (const name of ['fast.bin', 'piano.bin']) {
  copyFileSync(join(pitchPleaseRoot, 'models', name), join(modelDir, name));
}

cpSync(effetuneRoot, effetuneDest, { recursive: true });

const versions = {
  pitchplease: JSON.parse(readFileSync(join(pitchPleaseRoot, 'package.json'), 'utf8')).version,
  effetune: JSON.parse(readFileSync(join(effetuneRoot, '../package.json'), 'utf8')).version,
  copiedAt: new Date().toISOString(),
};
mkdirSync(join(root, 'public/vendor'), { recursive: true });
writeFileSync(join(root, 'public/vendor/pitch-lab-versions.json'), `${JSON.stringify(versions, null, 2)}\n`);
