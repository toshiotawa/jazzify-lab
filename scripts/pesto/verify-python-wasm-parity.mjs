#!/usr/bin/env node
// Same inputs and shipped model as the Python audit; no tracker or pitch correction.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import * as ort from 'onnxruntime-web';
const [manifestPath, auditPath, referencePath, outputPath] = process.argv.slice(2);
if (!outputPath) throw Error('Usage: node verify-python-wasm-parity.mjs manifest.json audit.json web-reference.json output.json');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = await readFile(manifestPath);
const manifest = JSON.parse(manifestBytes);
const audit = JSON.parse(await readFile(auditPath, 'utf8'));
if (!audit.passed || audit.inputManifestSha256 !== sha(manifestBytes)) throw Error('Unverified or mismatched Python oracle');
const reference = JSON.parse(await readFile(referencePath, 'utf8'));
const byId = new Map(reference.map((item) => [item.id, item]));
if (byId.size !== manifest.cases.length || reference.length !== byId.size) throw Error('Different oracle coverage');
const model = await readFile(new URL('../../dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx', import.meta.url));
if (sha(model) !== audit.modelSha256.shipped_compact) throw Error('Different Web model');
ort.env.wasm.numThreads = 1;
const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
const audio = new Float32Array(240), cache = new Float32Array(3976);
const audioTensor = new ort.Tensor('float32', audio, [1, 240]), cacheTensor = new ort.Tensor('float32', cache, [1, 3976]);
const maxima = { pitchCents: 0, confidenceAbs: 0, volumeRelative: 0, cacheAbs: 0 };
const rows = [];
try {
  for (const item of manifest.cases) {
    const oracle = byId.get(item.id);
    const bytes = await readFile(resolve(dirname(manifestPath), item.file));
    if (!oracle || oracle.pcmSha256 !== item.pcmSha256 || sha(bytes) !== item.pcmSha256) throw Error('Different PCM');
    const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
    if (oracle.frames.length * 240 !== pcm.length) throw Error('Different frame coverage');
    cache.fill(0);
    const errors = { pitchCents: 0, confidenceAbs: 0, volumeRelative: 0, cacheAbs: 0 };
    for (let frame = 0; frame < oracle.frames.length; frame += 1) {
      audio.set(pcm.subarray(frame * 240, (frame + 1) * 240));
      const result = await session.run({ audio: audioTensor, cache: cacheTensor }, ['prediction', 'confidence', 'volume', 'cache_out']);
      try {
        const output = [Number(result.prediction.data[0]), Number(result.confidence.data[0]), Number(result.volume.data[0])];
        if (!output.every(Number.isFinite)) throw Error('Nonfinite Web output');
        errors.pitchCents = Math.max(errors.pitchCents, Math.abs(output[0] - oracle.frames[frame][0]) * 100);
        errors.confidenceAbs = Math.max(errors.confidenceAbs, Math.abs(output[1] - oracle.frames[frame][1]));
        errors.volumeRelative = Math.max(errors.volumeRelative, Math.abs(output[2] - oracle.frames[frame][2]) / Math.max(1, Math.abs(oracle.frames[frame][2])));
        cache.set(result.cache_out.data);
        const start = (frame + 1) * 240 - 3976;
        for (let i = 0; i < cache.length; i += 1) {
          if (!Number.isFinite(cache[i])) throw Error('Nonfinite Web cache');
          errors.cacheAbs = Math.max(errors.cacheAbs, Math.abs(cache[i] - (start + i < 0 ? 0 : pcm[start + i])));
        }
      } finally { for (const tensor of Object.values(result)) tensor.dispose(); }
    }
    for (const key of Object.keys(maxima)) maxima[key] = Math.max(maxima[key], errors[key]);
    rows.push({ id: item.id, frames: oracle.frames.length, errors });
    process.stderr.write(`Compared WASM ${item.id}\n`);
  }
} finally { audioTensor.dispose(); cacheTensor.dispose(); await session.release(); }
const passed = maxima.pitchCents <= 1 && maxima.confidenceAbs < 1e-3 && maxima.volumeRelative < 1e-4 && maxima.cacheAbs === 0;
await writeFile(outputPath, JSON.stringify({ passed, modelSha256: sha(model), runtime: `onnxruntime-web ${ort.env.versions.web}, single-thread WASM`, maxima, rows }, null, 2) + '\n');
process.stdout.write(JSON.stringify({ passed, maxima }) + '\n');
if (!passed) process.exitCode = 1;
