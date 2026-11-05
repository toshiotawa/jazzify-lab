// Actual deployed WASM integration; artificial tone is a smoke test, not instrument evidence.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = new URL('../../', import.meta.url);
const temporary = await mkdtemp(join(tmpdir(), 'pesto-evaluation-smoke-'));
try {
  const pcm = Float32Array.from({ length: 38400 }, (_, i) => Math.sin(2 * Math.PI * 440 * i / 48000) * 0.1);
  const bytes = new Uint8Array(pcm.buffer);
  await writeFile(join(temporary, 'tone.f32'), bytes);
  const manifest = { version: 1, sampleRate: 48000, dataset: 'artificial smoke only', cases: [{ id: 'tone',
    family: 'artificial', instrument: 'smoke-tone', midi: 69, velocity: 100, file: 'tone.f32',
    pcmSha256: createHash('sha256').update(bytes).digest('hex') }] };
  const manifestPath = join(temporary, 'manifest.json'), reportPath = join(temporary, 'report.json');
  await writeFile(manifestPath, JSON.stringify(manifest));
  await writeFile(join(temporary, 'training.json'), '[]');
  const model = new URL('dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx', root).pathname;
  execFileSync(process.execPath, ['scripts/pesto/evaluate-multi-instrument.mjs', manifestPath, reportPath, model, join(temporary, 'training.json')],
    { cwd: root, timeout: 120000, stdio: ['ignore', 'pipe', 'inherit'] });
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  assert.equal(report.comparison.status, 'no-regression-in-this-subset');
  assert.equal(report.baseline.rows.length, 18);
  const clean = report.baseline.rows.find((row) => row.condition === 'clean' && row.phase === 'sustain');
  assert.ok(clean.metrics.rawRpa50 > 0.9, '440Hz sine should be recognized as A4');
  manifest.cases[0].pcmSha256 = '0'.repeat(64);
  await writeFile(manifestPath, JSON.stringify(manifest));
  assert.throws(() => execFileSync(process.execPath, ['scripts/pesto/evaluate-multi-instrument.mjs', manifestPath, reportPath],
    { cwd: root, timeout: 30000, stdio: 'pipe' }), /Command failed/);
  process.stdout.write('Real WASM baseline/candidate replay and corrupted-fixture rejection passed.\n');
} finally { await rm(temporary, { recursive: true, force: true }); }
