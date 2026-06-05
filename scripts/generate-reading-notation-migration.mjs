#!/usr/bin/env node
/**
 * 「音符の読み方」コース マイグレーション SQL 生成。
 * Usage:
 *   node scripts/generate-reading-notation-migration.mjs [1|2|patch]
 */
import * as esbuild from 'esbuild';
import { writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const entry = join(repoRoot, 'src', 'utils', 'notationCourseMigrationCliEntry.ts');
const arg = process.argv[2] ?? '1';
const phase = arg === '2' || arg === 'patch' ? arg : '1';
const outMigration = join(
  repoRoot,
  'supabase',
  'migrations',
  phase === 'patch'
    ? '20260805200000_reading_notation_course_5_notes_patch.sql'
    : phase === '2'
      ? '20260805190000_reading_notation_course_blocks_5_12.sql'
      : '20260805180000_reading_notation_course_blocks_1_4.sql',
);

const tmpDir = mkdtempSync(join(tmpdir(), 'rn-migration-'));
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
  const result = spawnSync(process.execPath, [outfile, phase], { encoding: 'utf8' });
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
