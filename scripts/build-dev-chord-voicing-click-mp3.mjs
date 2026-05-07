/**
 * 開発者用 chord_voicing テスト用: BPM100・4小節×6ループ分のクリックのみ MP3（57.6s）を2本出力。
 * マイグレーション [supabase/migrations/20260507140000_developer_course_chord_voicing_test_lesson.sql]
 * の audio_url と同じファイル名に合わせる。
 *
 * 前提: ffmpeg / ffprobe が PATH にあること。
 *
 * Usage:
 *   node scripts/build-dev-chord-voicing-click-mp3.mjs
 *   node scripts/build-dev-chord-voicing-click-mp3.mjs --out-dir ./public/fantasy-bgm
 *
 * その後 R2: `node scripts/upload-dev-chord-voicing-mp3-to-r2.mjs`
 * （CDN 反映が必要なら同コマンドに `--purge-cdn`。要 CF_ZONE_ID + CF_API_TOKEN）
 * キーは fantasy-bgm/ear-training-dev-chord-voicing-phrase-01|02.mp3（SQL の audio_url と一致）。
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BPM = 100;
const BEATS_PER_MEASURE = 4;
const MEASURES_PER_LOOP = 4;
const LOOPS = 6;
const BEAT_SEC = 60 / BPM;
const LOOP_SEC = MEASURES_PER_LOOP * BEATS_PER_MEASURE * BEAT_SEC;
const TOTAL_SEC = LOOPS * LOOP_SEC;

const DEFAULT_OUT_DIR = join(ROOT, 'public', 'fantasy-bgm');

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

function buildClickSixLoopsMp3(outPath) {
  const pulse = 0.03;
  const expr =
    `0.85*sin(2*PI*1200*t)*lt(mod(t\\,${BEAT_SEC})\\,${pulse})`;
  run('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${TOTAL_SEC}`,
    '-c:a', 'libmp3lame', '-q:a', '2',
    outPath,
  ]);
  const d = ffprobeDuration(outPath);
  if (Math.abs(d - TOTAL_SEC) > 0.08) {
    throw new Error(`duration expected ${TOTAL_SEC}, got ${d}`);
  }
}

function main() {
  const outDir = resolve(argValue('--out-dir') ?? DEFAULT_OUT_DIR);
  mkdirSync(outDir, { recursive: true });
  const tmp = join(outDir, '_dev-chord-voicing-click-6loops.mp3');
  const name1 = 'ear-training-dev-chord-voicing-phrase-01.mp3';
  const name2 = 'ear-training-dev-chord-voicing-phrase-02.mp3';
  const path1 = join(outDir, name1);
  const path2 = join(outDir, name2);

  console.log(`BPM=${BPM}, loop=${LOOP_SEC}s, total=${TOTAL_SEC}s`);
  console.log(`Building click → ${tmp}`);
  buildClickSixLoopsMp3(tmp);
  copyFileSync(tmp, path1);
  copyFileSync(tmp, path2);
  try {
    unlinkSync(tmp);
  } catch {
    /* ignore */
  }
  console.log(`Wrote ${path1}`);
  console.log(`Wrote ${path2}`);
  console.log('Done.');
}

main();
