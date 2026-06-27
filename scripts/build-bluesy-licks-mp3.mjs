#!/usr/bin/env node
/**
 * Bluesy Licks MP3: 4 ループ + ドラムスティック CI、slow 版 (atempo 0.5)。
 *
 * Usage:
 *   node scripts/build-bluesy-licks-mp3.mjs --phrase 1 [--slow]
 *   node scripts/build-bluesy-licks-mp3.mjs --all
 */
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  OUT_DIR,
  PHRASE_SPECS,
  LOOP_COUNT,
  phraseAssetBase,
  sourceMp3Path,
  expectedTotalSec,
} from './bluesy-licks-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLICK_MP3 = join(ROOT, 'public', 'drumstick-count.mp3');

const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const slow = args.includes('--slow');
const phraseArg = args.includes('--phrase') ? Number.parseInt(args[args.indexOf('--phrase') + 1], 10) : null;

function run(cmd, cmdArgs, label) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${label} failed (${r.status}): ${r.stderr || r.stdout || ''}`);
  }
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

function buildDrumstickCountInTrack(outPath, bpm) {
  const beats = 4;
  const spb = 60 / bpm;
  const countInSec = spb * beats;
  const delayMs = Math.round(spb * 1000);
  const delays = Array.from({ length: beats }, (_, i) => i * delayMs);
  const gains = delays.map((_, i) => (i === 0 ? 1 : 0.82));
  const splitLabels = delays.map((_, i) => `[d${i}]`).join('');
  const delayed = delays.map((ms, i) => `[d${i}]adelay=${ms}|${ms},volume=${gains[i]}[c${i}]`).join(';');
  const mixInputs = ['[0:a]', ...delays.map((_, i) => `[c${i}]`)].join('');
  const filter = [
    `[1:a]asplit=${beats}${splitLabels}`,
    delayed,
    `${mixInputs}amix=inputs=${beats + 1}:duration=first:dropout_transition=0[out]`,
  ].join(';');
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `anullsrc=r=44100:cl=stereo:d=${countInSec}`,
    '-i', CLICK_MP3,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg drumstick count-in');
}

function concatMp3(inputs, outPath) {
  const n = inputs.length;
  const labels = inputs.map((_, i) => `[${i}:a]`).join('');
  run('ffmpeg', [
    '-y',
    ...inputs.flatMap((p) => ['-i', p]),
    '-filter_complex', `${labels}concat=n=${n}:v=0:a=1[out]`,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg concat');
}

/**
 * @param {import('./bluesy-licks-config.mjs').BluesyLicksPhraseSpec} spec
 * @param {boolean} isSlow
 */
function buildPhraseMp3(spec, isSlow) {
  const inputPath = sourceMp3Path(spec.phraseIndex);
  if (!existsSync(inputPath)) {
    throw new Error(`Missing source MP3: ${inputPath}`);
  }
  if (!existsSync(CLICK_MP3)) {
    throw new Error(`Missing drumstick: ${CLICK_MP3}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const bpm = isSlow ? spec.bpm / 2 : spec.bpm;
  const base = phraseAssetBase(spec.phraseIndex, isSlow);
  const outPath = join(OUT_DIR, `${base}_loop4_ci.mp3`);
  const workDir = OUT_DIR;
  const bodyPath = join(workDir, `.tmp-bl-${spec.phraseIndex}-${isSlow ? 'slow' : 'normal'}-body.mp3`);
  const loopPath = join(workDir, `.tmp-bl-${spec.phraseIndex}-${isSlow ? 'slow' : 'normal'}-loop4.mp3`);
  const leadPath = join(workDir, `.tmp-bl-${spec.phraseIndex}-${isSlow ? 'slow' : 'normal'}-ci.mp3`);

  try {
    if (isSlow) {
      run('ffmpeg', [
        '-y', '-i', inputPath,
        '-filter:a', 'atempo=0.5',
        '-c:a', 'libmp3lame', '-q:a', '2',
        bodyPath,
      ], 'ffmpeg atempo slow');
    } else {
      run('ffmpeg', ['-y', '-i', inputPath, '-c:a', 'copy', bodyPath], 'ffmpeg copy body');
    }

    const loopInputs = Array.from({ length: LOOP_COUNT }, () => bodyPath);
    concatMp3(loopInputs, loopPath);
    buildDrumstickCountInTrack(leadPath, bpm);
    concatMp3([leadPath, loopPath], outPath);

    const expected = expectedTotalSec(bpm, spec.bodyMeasures, LOOP_COUNT);
    const actual = probeDuration(outPath);
    if (actual == null) {
      throw new Error(`ffprobe failed: ${outPath}`);
    }
    if (Math.abs(actual - expected) > 0.25) {
      throw new Error(
        `${base}: duration ${actual.toFixed(3)}s != expected ${expected.toFixed(3)}s (bpm=${bpm})`,
      );
    }
    console.log(`OK ${base}_loop4_ci.mp3 (${actual.toFixed(3)}s)`);
  } finally {
    for (const p of [bodyPath, loopPath, leadPath]) {
      if (existsSync(p)) {
        try {
          unlinkSync(p);
        } catch {
          /* ignore */
        }
      }
    }
  }
}

function main() {
  const specs = buildAll
    ? PHRASE_SPECS
    : PHRASE_SPECS.filter((p) => p.phraseIndex === phraseArg);
  if (specs.length === 0 || (phraseArg != null && !Number.isFinite(phraseArg))) {
    console.error('Usage: node scripts/build-bluesy-licks-mp3.mjs --phrase <1-11> [--slow] | --all [--slow]');
    process.exit(1);
  }
  for (const spec of specs) {
    buildPhraseMp3(spec, slow);
  }
}

main();
