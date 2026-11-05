#!/usr/bin/env node
// Offline bridge: preserve the exact float32 inputs used by the Web evaluator.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { makeCondition } from './multi-instrument-metrics.mjs';
const [manifestPath, outputDirectory] = process.argv.slice(2);
if (!manifestPath || !outputDirectory) throw Error('Usage: node prepare-parity-inputs.mjs manifest.json output-directory');
const calibration = manifestPath === '--calibration';
const manifest = calibration ? { version: 1, sampleRate: 48000, cases: [] } : JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.version !== 1 || manifest.sampleRate !== 48000 || (!calibration && !manifest.cases?.length)) throw Error('Invalid manifest');
await mkdir(outputDirectory, { recursive: true });
const sha = (data) => createHash('sha256').update(data).digest('hex');
const items = [];
const storeInput = async (item, pcm) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(item.id)) throw Error('Invalid case ID');
  const input = makeCondition(pcm, 'clean');
  const data = new Uint8Array(input.audio.buffer);
  const file = item.id + '.f32';
  await writeFile(resolve(outputDirectory, file), data);
  items.push({ ...item, file, sourcePcmSha256: item.pcmSha256, pcmSha256: sha(data), noteEnd: input.duration });
};
for (const item of manifest.cases) {
  const bytes = await readFile(resolve(dirname(manifestPath), item.file));
  if (sha(bytes) !== item.pcmSha256) throw Error('PCM checksum mismatch');
  const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  await storeInput(item, pcm);
}
if (calibration) {
  for (const midi of [21, 36, 48, 60, 69, 72, 84, 96]) {
    for (const timbre of ['sine', 'harmonics']) {
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      const pcm = Float32Array.from({ length: 38400 }, (_, index) => {
        const phase = 2 * Math.PI * frequency * index / 48000;
        return 0.1 * (Math.sin(phase) + (timbre === 'harmonics' ? 0.35 * Math.sin(2 * phase) + 0.12 * Math.sin(3 * phase) : 0));
      });
      await storeInput({ id: `calibration-${timbre}-${midi}`, family: 'artificial-calibration', instrument: `analytic-${timbre}`,
        midi, velocity: 'fixed-amplitude', pcmSha256: sha(new Uint8Array(pcm.buffer)), source: 'analytical signal, not an instrument recording' }, pcm);
    }
  }
}
await writeFile(resolve(outputDirectory, 'manifest.json'), JSON.stringify({ version: 1, sampleRate: 48000,
  condition: 'clean: 600ms with 2ms end fade + 200ms zero tail; same makeCondition as Web evaluation', cases: items }, null, 2) + '\n');
process.stdout.write(`Prepared ${items.length} exact Web-evaluation inputs.\n`);
