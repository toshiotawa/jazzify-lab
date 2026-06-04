#!/usr/bin/env node
/**
 * 横スクロールコードラン:中級 マイグレーション SQL 生成。
 */
import * as esbuild from 'esbuild';
import { writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const entry = join(repoRoot, 'src', 'utils', 'chordRunIntermediateMigrationCliEntry.ts');
const outMigration = join(
  repoRoot,
  'supabase',
  'migrations',
  '20260805160000_chord_run_intermediate_course.sql',
);

const tmpDir = mkdtempSync(join(tmpdir(), 'cri-migration-'));
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
    process.stderr.write(result.stderr ?? 'Migration generation failed\n');
    process.exitCode = result.status ?? 1;
  } else if (result.stdout) {
    writeFileSync(outMigration, result.stdout, 'utf8');
    process.stdout.write(`Wrote ${outMigration}\n`);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
