#!/usr/bin/env node
/**
 * MQ Block2 用 MP3 の先頭に 1 小節のドラムスティックカウントインを付加する。
 *
 * Usage:
 *   node scripts/build-mq-b2-count-in-mp3.mjs --input public/sozai/mq-b2-domifa.mp3 --output public/sozai/mq-b2-domifa_count-in.mp3 --bpm 120
 */
import { existsSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CLICK_MP3 = join(ROOT, 'public', 'drumstick-count.mp3');

const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const inputPath = resolve(arg('--input') ?? '');
const outputPath = resolve(arg('--output') ?? '');
const bpm = Number.parseFloat(arg('--bpm') ?? '120');
const dryRun = args.includes('--dry-run');

const BEATS = 4;
const SPB = 60 / bpm;
const COUNT_IN_SEC = SPB * BEATS;
const FIRST_CLICK_GAIN = 1;
const CLICK_GAIN = 0.82;

function run(cmd, cmdArgs, label) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
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
  const v = Number.parseFloat((r.stdout || '').trim());
  return Number.isFinite(v) ? v : null;
}

function main() {
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/build-mq-b2-count-in-mp3.mjs --input <body.mp3> --output <out.mp3> [--bpm 120]');
    process.exit(1);
  }
  if (!existsSync(inputPath)) {
    console.error(`Missing: ${inputPath}`);
    process.exit(1);
  }
  if (!existsSync(CLICK_MP3)) {
    console.error(`Missing: ${CLICK_MP3}`);
    process.exit(1);
  }

  const bodyDur = probeDuration(inputPath);
  console.log(`BPM=${bpm} count-in=${COUNT_IN_SEC}s body=${bodyDur?.toFixed(3) ?? '?'}s -> ${outputPath}`);

  if (dryRun) {
    console.log('[dry-run] ok');
    return;
  }

  const leadPath = join(dirname(outputPath), `.tmp-${Date.now()}-ci-lead.mp3`);
  try {
    buildDrumstickCountInTrack(leadPath);
    concatMp3(leadPath, inputPath, outputPath);
    const outDur = probeDuration(outputPath);
    console.log(`OK (${outDur?.toFixed(3) ?? '?'}s)`);
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
