/**
 * II-V-I 1-5（C）耳コピバトル用 MP3 を生成する。
 * 元: 1 小節 CI + 5 フレーズ × (4 小節 + 4 小節の反復) = 61.5s @160 の `II-V-I_1-5_C_ci.mp3`
 * 出力: 各フレーズごとに「模範 4 小節」×3 と「クリックのみ 4 小節」×3 を交互に並べた 36s ファイル。
 *
 * 前提: ffmpeg / ffprobe が PATH にあること。
 *
 * Usage:
 *   node scripts/build-ii-v-i-ear-training-mp3.mjs
 *   node scripts/build-ii-v-i-ear-training-mp3.mjs --source /path/to/II-V-I_1-5_C_ci.mp3
 *   node scripts/build-ii-v-i-ear-training-mp3.mjs --out-dir ./public/II-V-I_1-50/ear-training-out
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_SOURCE = join(ROOT, 'public', 'II-V-I_1-50', 'II-V-I_1-5_C_ci.mp3');
const DEFAULT_OUT_DIR = join(ROOT, 'public', 'II-V-I_1-50', 'ear-training-out');
const BPM = 160;
const CI_SEC = (60 / BPM) * 1;
const PHRASE_PAIR_SEC = (60 / BPM) * 4 * 4;
const DEMO_SEC = (60 / BPM) * 4 * 4;
const BEAT_SEC = 60 / BPM;
const CLICK_SEGMENT_SEC = 4 * 4 * BEAT_SEC;

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) {
    return process.argv[i + 1];
  }
  return null;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  if (r.error) {
    throw r.error;
  }
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  }
}

function ffprobeDuration(filePath) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`ffprobe: ${r.stderr}`);
  }
  return Number.parseFloat(r.stdout.trim());
}

function buildClickMp3(outPath) {
  const expr =
    `0.85*sin(2*PI*1200*t)*lt(mod(t\\,${BEAT_SEC})\\,0.03)`;
  run('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${CLICK_SEGMENT_SEC}`,
    '-c:a', 'libmp3lame', '-q:a', '2',
    outPath,
  ]);
  const d = ffprobeDuration(outPath);
  if (Math.abs(d - CLICK_SEGMENT_SEC) > 0.05) {
    throw new Error(`click duration expected ${CLICK_SEGMENT_SEC}, got ${d}`);
  }
}

function phraseDemoStartSec(phraseIndex) {
  return CI_SEC + phraseIndex * PHRASE_PAIR_SEC;
}

function buildPhraseMp3(sourcePath, phraseIndex, clickPath, outPath, workDir) {
  const start = phraseDemoStartSec(phraseIndex);
  const tmpDemo = join(workDir, `_demo_p${phraseIndex}.mp3`);
  run('ffmpeg', [
    '-y', '-ss', String(start), '-t', String(DEMO_SEC), '-i', sourcePath,
    '-c:a', 'libmp3lame', '-q:a', '2',
    tmpDemo,
  ]);
  try {
    run('ffmpeg', [
      '-y',
      '-i', tmpDemo,
      '-i', clickPath,
      '-i', tmpDemo,
      '-i', clickPath,
      '-i', tmpDemo,
      '-i', clickPath,
      '-filter_complex', '[0:a][1:a][2:a][3:a][4:a][5:a]concat=n=6:v=0:a=1[aout]',
      '-map', '[aout]',
      '-c:a', 'libmp3lame', '-q:a', '2',
      outPath,
    ]);
  } finally {
    try {
      unlinkSync(tmpDemo);
    } catch {
      /* ignore */
    }
  }
  const d = ffprobeDuration(outPath);
  const expected = 6 * DEMO_SEC;
  if (Math.abs(d - expected) > 0.08) {
    throw new Error(`phrase ${phraseIndex + 1} duration expected ${expected}, got ${d}`);
  }
}

function main() {
  const sourcePath = resolve(argValue('--source') ?? DEFAULT_SOURCE);
  const outDir = resolve(argValue('--out-dir') ?? DEFAULT_OUT_DIR);
  if (!existsSync(sourcePath)) {
    console.error(`Source not found: ${sourcePath}`);
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  const clickPath = join(outDir, '_click-4bars.mp3');
  console.log('Building click…');
  buildClickMp3(clickPath);
  for (let p = 0; p < 5; p += 1) {
    const name = `ear-training-ii-v-i-1-5-c-phrase-${String(p + 1).padStart(2, '0')}.mp3`;
    const outPath = join(outDir, name);
    console.log(`Phrase ${p + 1}: ${outPath}`);
    buildPhraseMp3(sourcePath, p, clickPath, outPath, outDir);
  }
  console.log('Done.');
}

main();
