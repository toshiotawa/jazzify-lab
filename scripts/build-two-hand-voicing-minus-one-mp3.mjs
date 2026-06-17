#!/usr/bin/env node
/**
 * 両手ヴォイシング中級 chord_voicing 用マイナスワン MP3 を生成する。
 *
 * 構成:
 * - ドラム: public/sozai/Cblues_24bars_100BPM_Drum.mp3
 * - 出題ヴォイシング: 合成音（triangle / sine）
 * - ベース ルート全音符: FingerBass SF2（サバイバル正解音）
 *
 * Usage:
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --all
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --all --course intermediate
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --lesson b3-m7 --progression p1
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --lesson b1-q1 --phrase 0
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --lesson b1-m7 --progression p1 --course advanced
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --also-sine
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --synth-variant sine
 *   node scripts/build-two-hand-voicing-minus-one-mp3.mjs --out-dir ./public/sozai
 *
 * 前提: ffmpeg / ffprobe が PATH にあること。
 */
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const entry = join(repoRoot, 'src', 'utils', 'twoHandVoicingMinusOneCliEntry.ts');

const tmpDir = mkdtempSync(join(tmpdir(), 'thvi-minus-one-'));
const outfile = join(tmpDir, 'cli.cjs');

try {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent',
  });

  const result = spawnSync(process.execPath, [outfile, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, THVI_REPO_ROOT: repoRoot },
  });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
