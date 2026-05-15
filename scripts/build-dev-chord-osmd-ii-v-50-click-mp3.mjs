/**
 * 開発者 chord_osmd II-V 50（01–05,C）テスト用: BPM160・全40小節分のクリックのみ MP3（60s）。
 * MusicXML と同様の時間軸前提: 4/4 × 40 × (60/BPM)。
 *
 * 前提: ffmpeg / ffprobe が PATH ににあること。
 *
 * Usage:
 *   node scripts/build-dev-chord-osmd-ii-v-50-click-mp3.mjs
 *
 * R2:
 *   node scripts/upload-dev-chord-osmd-ii-v-50-assets-to-r2.mjs --purge-cdn
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BPM = 160;
const BEATS_PER_MEASURE = 4;
const MEASURES_TOTAL = 40;
const TOTAL_SEC = (MEASURES_TOTAL * BEATS_PER_MEASURE * 60) / BPM;
const BEAT_SEC = 60 / BPM;

const OUT_NAME = 'ear-training-dev-chord-osmd-ii-v-50-01-05-c-v1.mp3';
const OUT_DIR_DEFAULT = join(ROOT, 'public', 'fantasy-bgm');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) {
    return process.argv[i + 1];
  }
  return null;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) {
    throw r.error;
  }
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  }
}

function ffprobeDuration(filePath) {
  const r = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    throw new Error(`ffprobe: ${r.stderr}`);
  }
  return Number.parseFloat(r.stdout.trim());
}

function main() {
  const outDir = resolve(argValue('--out-dir') ?? OUT_DIR_DEFAULT);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, OUT_NAME);

  const pulse = 0.03;
  const expr = `0.85*sin(2*PI*1200*t)*lt(mod(t\\,${BEAT_SEC})\\,${pulse})`;
  console.log(`BPM=${BPM}, total=${TOTAL_SEC}s (${MEASURES_TOTAL} measures × ${BEATS_PER_MEASURE})`);
  run('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `aevalsrc='${expr}':s=44100:d=${TOTAL_SEC}`,
    '-c:a',
    'libmp3lame',
    '-q:a',
    '2',
    outPath,
  ]);
  const d = ffprobeDuration(outPath);
  if (Math.abs(d - TOTAL_SEC) > 0.12) {
    throw new Error(`duration expected ~${TOTAL_SEC}, got ${d}`);
  }
  console.log(`Wrote ${outPath}`);
}

main();
