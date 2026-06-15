#!/usr/bin/env node
/**
 * Cブルース BGM の先頭に 1 小節（100BPM / 4拍 = 2.4秒）のメトロノーム4クリックを付加する。
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
const OUT_MP3 = join(SOZAI, 'Cblues_24bars_100BPM_count-in.mp3');

const BPM = 100;
const BEATS = 4;
const SPB = 60 / BPM;
const COUNT_IN_SEC = SPB * BEATS;

const dryRun = process.argv.includes('--dry-run');

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${label} failed (${r.status}): ${r.stderr || r.stdout || ''}`);
  }
}

function buildClickTrackSimple(outPath) {
  const clickExprs = Array.from({ length: BEATS }, (_, i) => {
    const start = i * SPB;
    const freq = i === 0 ? 1100 : 880;
    const vol = i === 0 ? 0.55 : 0.38;
    return `if(between(t,${start},${start + 0.07}),${vol}*sin(2*PI*${freq}*t)*exp(-30*(t-${start})),0)`;
  }).join('+');
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `aevalsrc='${clickExprs}':sample_rate=44100:duration=${COUNT_IN_SEC}`,
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg click track');
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
    buildClickTrackSimple(leadPath);
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
