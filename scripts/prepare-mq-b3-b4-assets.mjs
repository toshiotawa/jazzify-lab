/**
 * MQ Ch4 (b3) / Ch5 (b4): Voice4 cue 生成。
 * Q2 精密は OSMD と同じ cue 譜（voice 4 豆譜・非ターゲット）を使う。
 * その他の精密は cue から Voice4 を削除する。
 *
 * Usage:
 *   node scripts/prepare-mq-b3-b4-assets.mjs
 */
import { copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const GUIDE = join(ROOT, 'scripts', 'build-mq-b1-q1-guide-voice4-musicxml.mjs');
const BUILD_CR = join(ROOT, 'scripts', 'build-mq-b5-call-response-musicxml.mjs');
const STRIP = join(ROOT, 'scripts', 'strip-musicxml-voice4.mjs');
const SOZAI = join(ROOT, 'public', 'sozai');

/** 1小節先行の voice1→voice4 cue。Q1 は cue なし（原譜を OSMD に使う）。 */
const AHEAD_CUE_SOURCES = [
  'mq-b4-5-1-1',
  'mq-b4-5-2-2',
  'mq-b4-5-2-4',
  'mq-b4-5-3-2',
  'mq-b4-5-3-3',
];

/** 旧 cue ファイルが残っていても Voice4 が出ないよう、原譜で上書きする。 */
const Q1_NO_CUE_SOURCES = [
  'mq-b3-4-1-2',
  'mq-b3-4-1-3',
  'mq-b3-4-1-4',
];

/**
 * Q2 コール&レスポンス: 右手 call（voice 2）を voice 4 cue へ。
 * 1小節先行コピーはしない（同一メロディが call 小節で重なるため）。
 */
const CALL_RESPONSE_CUE_SOURCES = [
  'mq-b3-4-2-2',
  'mq-b3-4-2-4',
];

let errors = 0;

const run = (args) => {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    errors += 1;
    return false;
  }
  return true;
};

for (const base of AHEAD_CUE_SOURCES) {
  const source = join(SOZAI, `${base}.musicxml`);
  const cue = join(SOZAI, `${base}-guide-voice4-cue.musicxml`);
  const precision = join(SOZAI, `${base}-precision.musicxml`);
  if (!run([GUIDE, '--cue', '--source', source, '--output', cue])) {
    continue;
  }
  run([STRIP, '--source', cue, '--output', precision]);
}

for (const base of CALL_RESPONSE_CUE_SOURCES) {
  const source = join(SOZAI, `${base}.musicxml`);
  const cue = join(SOZAI, `${base}-guide-voice4-cue.musicxml`);
  const precision = join(SOZAI, `${base}-precision.musicxml`);
  if (!run([BUILD_CR, '--voice2-to-voice4', '--source', source, '--output', cue])) {
    continue;
  }
  copyFileSync(cue, precision);
}

for (const base of Q1_NO_CUE_SOURCES) {
  copyFileSync(join(SOZAI, `${base}.musicxml`), join(SOZAI, `${base}-guide-voice4-cue.musicxml`));
}

if (errors > 0) {
  process.exit(1);
}

console.log(
  `Prepared ${AHEAD_CUE_SOURCES.length} ahead-cue + ${CALL_RESPONSE_CUE_SOURCES.length} call-response cue MusicXML pairs. Overwrote ${Q1_NO_CUE_SOURCES.length} Q1 cue files with originals.`,
);
