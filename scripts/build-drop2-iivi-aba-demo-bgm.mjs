#!/usr/bin/env node
/**
 * Drop2 II-V-I ABA デモ BGM を生成する。
 * - ピアノ: public/sozai/.minus-one-work/drop2_iivi_aba_demo_100bpm.mp3
 * - ドラム: Cblues_24bars_100BPM_Drum.mp3 の先頭2小節（100BPM・4/4 = 4.8s）をループ
 *
 * Usage:
 *   node scripts/build-drop2-iivi-aba-demo-bgm.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SOZAI = join(ROOT, 'public', 'sozai');
const WORK = join(SOZAI, '.minus-one-work');

const DEMO_SRC = join(WORK, 'drop2_iivi_aba_demo_100bpm.mp3');
const DRUM_SRC = join(SOZAI, 'Cblues_24bars_100BPM_Drum.mp3');
const OUT = join(SOZAI, 'drop2_iivi_aba_demo_100bpm_bgm.mp3');

const BPM = 100;
const BEATS_PER_MEASURE = 4;
const DRUM_LOOP_MEASURES = 2;
const DRUM_LOOP_SEC = (60 / BPM) * BEATS_PER_MEASURE * DRUM_LOOP_MEASURES;
const DRUM_MIX_GAIN = 0.28;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function probeDurationSec(path) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    console.error(`ffprobe failed: ${path}`);
    process.exit(1);
  }
  const sec = Number.parseFloat(r.stdout.trim());
  if (!Number.isFinite(sec) || sec <= 0) {
    console.error(`Invalid duration: ${path}`);
    process.exit(1);
  }
  return sec;
}

for (const path of [DEMO_SRC, DRUM_SRC]) {
  if (!existsSync(path)) {
    console.error(`Missing: ${path}`);
    process.exit(1);
  }
}

mkdirSync(SOZAI, { recursive: true });

const demoSec = probeDurationSec(DEMO_SRC);
console.log(`Demo: ${demoSec.toFixed(3)}s, drum loop: ${DRUM_LOOP_SEC.toFixed(3)}s`);

run('ffmpeg', [
  '-y',
  '-i', DEMO_SRC,
  '-stream_loop', '-1',
  '-i', DRUM_SRC,
  '-filter_complex',
  `[1:a]atrim=0:${DRUM_LOOP_SEC},asetpts=PTS-STARTPTS,aloop=loop=-1:size=2e+09,volume=${DRUM_MIX_GAIN}[drum];[0:a][drum]amix=inputs=2:duration=first:dropout_transition=0[out]`,
  '-map', '[out]',
  '-t', String(demoSec),
  '-c:a', 'libmp3lame',
  '-q:a', '2',
  OUT,
]);

console.log(`Wrote ${OUT}`);
