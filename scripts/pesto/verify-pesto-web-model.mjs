#!/usr/bin/env node
// Verify the actual checked-in patch + Web WASM outputs/cache and timing.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as ort from 'onnxruntime-web';
ort.env.wasm.numThreads = 1;
const directory = new URL('../../public/models/pesto/', import.meta.url);
const originalModel = new Uint8Array(readFileSync(new URL('pesto-mir1k-g7-48000-240-refill.onnx', directory)));
const patch = JSON.parse(readFileSync(new URL('pesto-mir1k-g7-48000-240-refill-compact-v1.patch.json', directory), 'utf8'));
const compactModel = new Uint8Array(patch.targetSize);
let offset = 0;
for (const operation of patch.operations) {
  const bytes = operation.data === undefined
    ? originalModel.subarray(operation.sourceStart, operation.sourceStart + operation.length)
    : Buffer.from(operation.data, 'base64');
  compactModel.set(bytes, offset);
  offset += bytes.length;
}
if (offset !== compactModel.length || createHash('sha256').update(compactModel).digest('hex') !== patch.targetSha256) throw new Error('Model reconstruction differs');
const outputs = ['prediction', 'confidence', 'volume', 'cache_out'];
const frames = 2400;
const sessions = [];
const states = [];
const timings = [[], []];
const maxDifference = [0, 0, 0, 0];
let randomState = 123456789;
const random = () => {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 2 ** 32 * 2 - 1;
};
const audio = new Float32Array(240);
const audioTensor = new ort.Tensor('float32', audio, [1, 240]);
try {
  for (const model of [originalModel, compactModel]) {
    sessions.push(await ort.InferenceSession.create(model, { executionProviders: ['wasm'] }));
    const cache = new Float32Array(3976);
    states.push({ cache, tensor: new ort.Tensor('float32', cache, [1, 3976]) });
  }
  for (let frame = 0; frame < frames; frame += 1) {
    const segment = Math.floor(frame / 120) % 10;
    const note = [36, 48, 60, 64, 67, 69, 81, 60, 60, 60][segment];
    const frequency = 440 * 2 ** ((note - 69) / 12);
    for (let i = 0; i < audio.length; i += 1) {
      const phase = 2 * Math.PI * frequency * (frame * 240 + i) / 48000;
      const tone = Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.12 * Math.sin(3 * phase);
      audio[i] = segment === 7 ? 0 : segment === 8 ? random() * 0.03
        : segment === 9 ? (i === 0 && frame % 20 === 0 ? 0.9 : 0)
        : tone * (frame < 1200 ? 0.1 : 0.002);
    }
    if (frame % 173 === 0) for (const state of states) state.cache.fill(0);
    const results = [];
    try {
      // Alternate order so changing CPU load does not favor one model.
      for (const index of frame % 2 === 0 ? [0, 1] : [1, 0]) {
        const start = performance.now();
        results[index] = await sessions[index].run({ audio: audioTensor, cache: states[index].tensor }, outputs);
        if (frame >= 100) timings[index].push(performance.now() - start);
        states[index].cache.set(results[index].cache_out.data);
      }
      for (let outputIndex = 0; outputIndex < outputs.length; outputIndex += 1) {
        const name = outputs[outputIndex];
        const original = results[0][name].data;
        const compact = results[1][name].data;
        if (original.length !== compact.length) throw new Error(`${name}: different output shape`);
        for (let i = 0; i < original.length; i += 1) {
          if (!Number.isFinite(original[i]) || !Number.isFinite(compact[i])) throw new Error(`${name}: nonfinite`);
          const difference = Math.abs(original[i] - compact[i]);
          maxDifference[outputIndex] = Math.max(maxDifference[outputIndex], difference);
          // float32 reductions can change slightly; recurrent cache must be exact.
          const tolerance = name === 'prediction' ? 0.0001 : name === 'confidence' ? 0.00001
            : name === 'volume' ? 0.000001 * (1 + Math.abs(original[i])) : 0;
          if (difference > tolerance) throw new Error(`${name}: mismatch at frame ${frame}: ${original[i]} vs ${compact[i]}`);
        }
      }
    } finally {
      for (const result of results) if (result) for (const tensor of Object.values(result)) tensor.dispose();
    }
  }
  const report = ['original', 'compact'].map((model, index) => {
    timings[index].sort((a, b) => a - b);
    return { model, medianMs: timings[index][Math.floor(timings[index].length * 0.5)],
      p95Ms: timings[index][Math.floor(timings[index].length * 0.95)] };
  });
  process.stdout.write(`${JSON.stringify({ frames, maxDifference: Object.fromEntries(outputs.map((name, i) => [name, maxDifference[i]])), timings: report }, null, 2)}\n`);
} finally {
  for (const state of states) state.tensor.dispose();
  audioTensor.dispose();
  for (const session of sessions) await session.release();
}
