/**
 * メインクエスト第3章（mq-b2-domifa / mq-b2-soshido）に voice 4 ガイド豆譜を追加。
 *
 * Usage:
 *   node scripts/build-mq-b2-guide-voice4-musicxml.mjs
 *   node scripts/build-mq-b2-guide-voice4-musicxml.mjs --cue
 */
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BUILD_SCRIPT = join(ROOT, 'scripts', 'build-mq-b1-q1-guide-voice4-musicxml.mjs');
const useCue = process.argv.includes('--cue');
const cueFlag = useCue ? ['--cue'] : [];

/** @type {readonly { source: string; output: string }[]} */
const TARGETS = [
  {
    source: 'public/sozai/mq-b2-domifa.musicxml',
    output: useCue
      ? 'public/sozai/mq-b2-domifa-guide-voice4-cue.musicxml'
      : 'public/sozai/mq-b2-domifa-guide-voice4.musicxml',
  },
  {
    source: 'public/sozai/mq-b2-soshido.musicxml',
    output: useCue
      ? 'public/sozai/mq-b2-soshido-guide-voice4-cue.musicxml'
      : 'public/sozai/mq-b2-soshido-guide-voice4.musicxml',
  },
];

let errors = 0;

for (const { source, output } of TARGETS) {
  const result = spawnSync(
    process.execPath,
    [BUILD_SCRIPT, ...cueFlag, '--source', source, '--output', output],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (result.status !== 0) {
    errors += 1;
  }
}

if (errors > 0) {
  process.exit(1);
}
