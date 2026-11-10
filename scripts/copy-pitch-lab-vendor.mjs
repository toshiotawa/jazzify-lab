/**
 * PitchPlease piano の Worklet とモデルを public/vendor へコピーする。
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pitchPleaseRoot = join(root, 'node_modules/@markusstrasser/pitchplease');
const pitchDest = join(root, 'public/vendor/pitchplease');

if (!existsSync(pitchPleaseRoot)) {
  throw new Error(`@markusstrasser/pitchplease が見つかりません: ${pitchPleaseRoot}. npm install を実行してください。`);
}

mkdirSync(pitchDest, { recursive: true });
cpSync(join(pitchPleaseRoot, 'engine'), join(pitchDest, 'engine'), { recursive: true });
const modelDir = join(pitchDest, 'models');
mkdirSync(modelDir, { recursive: true });
copyFileSync(join(pitchPleaseRoot, 'models', 'piano.bin'), join(modelDir, 'piano.bin'));

const versions = {
  pitchplease: JSON.parse(readFileSync(join(pitchPleaseRoot, 'package.json'), 'utf8')).version,
  copiedAt: new Date().toISOString(),
};
mkdirSync(join(root, 'public/vendor'), { recursive: true });
writeFileSync(join(root, 'public/vendor/pitch-lab-versions.json'), `${JSON.stringify(versions, null, 2)}\n`);
