#!/usr/bin/env node
/**
 * thvi-demo-b1-q1 Drop2 デモプレイ台本パッチ SQL を stdout に出力。
 */
import * as esbuild from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const entry = join(repoRoot, 'src', 'utils', 'twoHandVoicingDrop2DemoPatchCliEntry.ts');

const tmpDir = mkdtempSync(join(tmpdir(), 'thvi-drop2-demo-patch-'));
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

  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, [outfile], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? 'Patch SQL generation failed\n');
    process.exitCode = result.status ?? 1;
  } else if (result.stdout) {
    process.stdout.write(result.stdout);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
