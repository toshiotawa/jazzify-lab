/**
 * MQ Ch4 (b3) / Ch5 (b4): Voice4 cue 生成 + 精密用 Voice4 削除。
 *
 * Usage:
 *   node scripts/prepare-mq-b3-b4-assets.mjs
 */
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const GUIDE = join(ROOT, 'scripts', 'build-mq-b1-q1-guide-voice4-musicxml.mjs');
const STRIP = join(ROOT, 'scripts', 'strip-musicxml-voice4.mjs');
const SOZAI = join(ROOT, 'public', 'sozai');

/** OSMD 本番用ソース（cue 生成元）。精密は cue から Voice4 削除。 */
const OSMD_SOURCES = [
  'mq-b3-4-1-2',
  'mq-b3-4-1-3',
  'mq-b3-4-1-4',
  'mq-b3-4-2-2',
  'mq-b3-4-2-4',
  'mq-b4-5-1-1',
  'mq-b4-5-2-2',
  'mq-b4-5-2-4',
  'mq-b4-5-3-2',
  'mq-b4-5-3-3',
];

let errors = 0;

for (const base of OSMD_SOURCES) {
  const source = join(SOZAI, `${base}.musicxml`);
  const cue = join(SOZAI, `${base}-guide-voice4-cue.musicxml`);
  const precision = join(SOZAI, `${base}-precision.musicxml`);

  const guideResult = spawnSync(
    process.execPath,
    [GUIDE, '--cue', '--source', source, '--output', cue],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (guideResult.status !== 0) {
    errors += 1;
    continue;
  }

  const stripResult = spawnSync(
    process.execPath,
    [STRIP, '--source', cue, '--output', precision],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (stripResult.status !== 0) {
    errors += 1;
  }
}

if (errors > 0) {
  process.exit(1);
}

console.log(`Prepared ${OSMD_SOURCES.length} cue + precision MusicXML pairs.`);
