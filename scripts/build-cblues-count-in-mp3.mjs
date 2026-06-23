#!/usr/bin/env node
/**
 * Cブルース BGM の先頭に 1 小節（100BPM / 4拍 = 2.4秒）のドラムスティック4打を付加する。
 * クリック音源は public/drumstick-count.mp3（ゲーム内カウントインと同じ）。
 *
 * Usage:
 *   node scripts/build-cblues-count-in-mp3.mjs
 *   node scripts/build-cblues-count-in-mp3.mjs --dry-run
 */
import { existsSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOZAI = join(ROOT, 'public', 'sozai');
const BODY_MP3 = join(SOZAI, 'Cblues_24bars_100BPM.mp3');
const CLICK_MP3 = join(ROOT, 'public', 'drumstick-count.mp3');
const OUT_MP3 = join(SOZAI, 'Cblues_24bars_100BPM_count-in.mp3');

const BPM = 100;
const BEATS = 4;
const SPB = 60 / BPM;
const COUNT_IN_SEC = SPB * BEATS;
/** earTrainingChordVoicingPhrasePlayer と同じ係数 */
const FIRST_CLICK_GAIN = 1;
const CLICK_GAIN = 0.82;

const dryRun = process.argv.includes('--dry-run');

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${label} failed (${r.status}): ${r.stderr || r.stdout || ''}`);
  }
}

function buildDrumstickCountInTrack(outPath) {
  const delayMs = Math.round(SPB * 1000);
  const delays = Array.from({ length: BEATS }, (_, i) => i * delayMs);
  const gains = delays.map((_, i) => (i === 0 ? FIRST_CLICK_GAIN : CLICK_GAIN));
  const splitLabels = delays.map((_, i) => `[d${i}]`).join('');
  const delayed = delays.map((ms, i) => `[d${i}]adelay=${ms}|${ms},volume=${gains[i]}[c${i}]`).join(';');
  const mixInputs = ['[0:a]', ...delays.map((_, i) => `[c${i}]`)].join('');
  const filter = [
    `[1:a]asplit=${BEATS}${splitLabels}`,
    delayed,
    `${mixInputs}amix=inputs=${BEATS + 1}:duration=first:dropout_transition=0[out]`,
  ].join(';');
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `anullsrc=r=44100:cl=stereo:d=${COUNT_IN_SEC}`,
    '-i', CLICK_MP3,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg drumstick count-in');
}

function concatMp3(leadPath, bodyPath, outPath) {
  run('ffmpeg', [
    '-y',
    '-i', leadPath,
    '-i', bodyPath,
    '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1[out]',
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg concat');
}

function probeDuration(path) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    path,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    return null;
  }
  const v = parseFloat((r.stdout || '').trim());
  return Number.isFinite(v) ? v : null;
}

function main() {
  if (!existsSync(BODY_MP3)) {
    console.error(`Missing: ${BODY_MP3}`);
    process.exit(1);
  }
  if (!existsSync(CLICK_MP3)) {
    console.error(`Missing: ${CLICK_MP3}`);
    process.exit(1);
  }
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    console.error('ffmpeg が見つかりません。');
    process.exit(1);
  }

  const bodyDur = probeDuration(BODY_MP3);
  console.log(`BPM=${BPM} count-in=${COUNT_IN_SEC}s body=${bodyDur?.toFixed(3) ?? '?'}s -> out≈${((bodyDur ?? 57.6) + COUNT_IN_SEC).toFixed(3)}s`);

  if (dryRun) {
    console.log(`[dry-run] ${BODY_MP3} -> ${OUT_MP3}`);
    return;
  }

  const leadPath = join(SOZAI, '.tmp-count-in-lead.mp3');
  try {
    buildDrumstickCountInTrack(leadPath);
    concatMp3(leadPath, BODY_MP3, OUT_MP3);
    const outDur = probeDuration(OUT_MP3);
    console.log(`OK ${OUT_MP3} (${outDur?.toFixed(3) ?? '?'}s)`);
  } finally {
    if (existsSync(leadPath)) {
      try {
        unlinkSync(leadPath);
      } catch {
        /* ignore */
      }
    }
  }
}

main();
