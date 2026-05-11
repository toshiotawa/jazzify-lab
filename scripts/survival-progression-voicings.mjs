#!/usr/bin/env node
/**
 * サバイバル progression 用ヴォイシングの JSON 出力（esbuild で TS を一度 bundle）。
 */
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const entry = join(repoRoot, 'src', 'utils', 'survivalProgressionVoicingsCliEntry.ts');

const tmpDir = mkdtempSync(join(tmpdir(), 'survival-progression-voicings-'));
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
  });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
