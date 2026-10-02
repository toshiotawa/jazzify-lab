#!/usr/bin/env node
// Prove that restoring captured PCM reproduces uninterrupted model outputs.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads = 1;
const directory = new URL('../../public/models/pesto/', import.meta.url);
const source = new Uint8Array(readFileSync(new URL('pesto-mir1k-g7-48000-240-refill.onnx', directory)));
const patch = JSON.parse(readFileSync(new URL('pesto-mir1k-g7-48000-240-refill-compact-v1.patch.json', directory), 'utf8'));
const model = new Uint8Array(patch.targetSize);
let position = 0;
for (const operation of patch.operations) {
  const bytes = operation.data === undefined
    ? source.subarray(operation.sourceStart, operation.sourceStart + operation.length)
    : Buffer.from(operation.data, 'base64');
  model.set(bytes, position);
  position += bytes.length;
}
if (position !== model.length || createHash('sha256').update(model).digest('hex') !== patch.targetSha256) {
  throw new Error('Production model reconstruction differs');
}

const frameCount = 3200;
const cacheSize = 3976;
const chunkSize = 240;
const pcm = new Float32Array(frameCount * chunkSize);
const notes = [45, 57, 60, 64, 69, 81, 57, 45];
for (let frame = 0; frame < frameCount; frame += 1) {
  const frequency = 440 * 2 ** ((notes[Math.floor(frame / 400)] - 69) / 12);
  for (let i = 0; i < chunkSize; i += 1) {
    const sample = frame * chunkSize + i;
    const phase = 2 * Math.PI * frequency * sample / 48000;
    pcm[sample] = (Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.12 * Math.sin(3 * phase)) * 0.004;
  }
}
const sessions = [];
const states = [];
const outputs = ['prediction', 'confidence', 'volume', 'cache_out'];
const maxDifference = [0, 0, 0, 0];
let retained = 0;
let restored = 0;
let dropped = 0;
let lastRetained = -1;
let coldLowConfidence = 0;
let recoveredLowConfidence = 0;
const audio = new Float32Array(chunkSize);
const audioTensor = new ort.Tensor('float32', audio, [1, chunkSize]);
const refill = (cache, endSample) => {
  cache.fill(0);
  const start = Math.max(0, endSample - cacheSize);
  cache.set(pcm.subarray(start, endSample), cacheSize - (endSample - start));
};
try {
  for (let i = 0; i < 3; i += 1) {
    sessions.push(await ort.InferenceSession.create(model, { executionProviders: ['wasm'] }));
    const cache = new Float32Array(cacheSize);
    states.push({ cache, tensor: new ort.Tensor('float32', cache, [1, cacheSize]) });
  }
  for (let frame = 0; frame < frameCount; frame += 1) {
    const results = [];
    try {
      audio.set(pcm.subarray(frame * chunkSize, (frame + 1) * chunkSize));
      results[0] = await sessions[0].run({ audio: audioTensor, cache: states[0].tensor }, outputs);
      states[0].cache.set(results[0].cache_out.data);
      // Check the deployed model's cache contract, not just the upstream source.
      const expectedCache = new Float32Array(cacheSize);
      refill(expectedCache, (frame + 1) * chunkSize);
      for (let i = 0; i < cacheSize; i += 1) {
        if (states[0].cache[i] !== expectedCache[i]) throw new Error(`Cache is not raw PCM at frame ${frame}`);
      }
      // Repeated 35ms drops plus two 200ms stalls; capture itself remains continuous.
      if (frame % 47 >= 40 || (frame >= 1000 && frame < 1040) || (frame >= 2000 && frame < 2040)) {
        dropped += 1;
        continue;
      }
      retained += 1;
      if (frame !== lastRetained + 1) {
        restored += 1;
        states[1].cache.fill(0);
        refill(states[2].cache, frame * chunkSize);
      }
      lastRetained = frame;
      for (const index of [1, 2]) {
        results[index] = await sessions[index].run({ audio: audioTensor, cache: states[index].tensor }, outputs);
        states[index].cache.set(results[index].cache_out.data);
      }
      if (results[1].confidence.data[0] < 0.1) coldLowConfidence += 1;
      if (results[2].confidence.data[0] < 0.1) recoveredLowConfidence += 1;
      for (let outputIndex = 0; outputIndex < outputs.length; outputIndex += 1) {
        const name = outputs[outputIndex];
        const baseline = results[0][name].data;
        const recovered = results[2][name].data;
        if (baseline.length !== recovered.length) throw new Error(`${name}: different shape`);
        for (let i = 0; i < baseline.length; i += 1) {
          const difference = Math.abs(baseline[i] - recovered[i]);
          if (!Number.isFinite(difference)) throw new Error(`${name}: nonfinite`);
          maxDifference[outputIndex] = Math.max(maxDifference[outputIndex], difference);
          if (difference !== 0) throw new Error(`${name}: gap recovery differs at frame ${frame}`);
        }
      }
    } finally {
      for (const result of results) if (result) for (const tensor of Object.values(result)) tensor.dispose();
    }
  }
  process.stdout.write(`${JSON.stringify({ frameCount, retained, dropped, restored,
    maxDifference: Object.fromEntries(outputs.map((name, i) => [name, maxDifference[i]])),
    confidenceBelowPointOne: { coldReset: coldLowConfidence, pcmRecovery: recoveredLowConfidence },
  }, null, 2)}\n`);
} finally {
  audioTensor.dispose();
  for (const state of states) state.tensor.dispose();
  for (const session of sessions) await session.release();
}
