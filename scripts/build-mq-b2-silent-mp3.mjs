#!/usr/bin/env node
/**
 * 指定秒数の無音 MP3 を生成する（サバイバル demo / playalong タイミング用）。
 *
 * Usage:
 *   node scripts/build-mq-b2-silent-mp3.mjs --output public/sozai/mq-b2-motif-demo-silent.mp3 --duration 92
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const outputPath = resolve(arg('--output') ?? '');
const durationSec = Number.parseFloat(arg('--duration') ?? '0');
const dryRun = args.includes('--dry-run');

function main() {
  if (!outputPath || !Number.isFinite(durationSec) || durationSec <= 0) {
    console.error('Usage: node scripts/build-mq-b2-silent-mp3.mjs --output <path.mp3> --duration <seconds>');
    process.exit(1);
  }

  console.log(`silent ${durationSec}s -> ${outputPath}`);
  if (dryRun) {
    return;
  }

  const r = spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=44100:cl=stereo',
    '-t', String(durationSec),
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outputPath,
  ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || 'ffmpeg failed');
    process.exit(1);
  }
  console.log('OK');
}

main();
