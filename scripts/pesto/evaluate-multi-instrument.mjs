#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import * as ort from 'onnxruntime-web';
import { compareReports, makeCondition, rangeFor, scoreFrames, summarize } from './multi-instrument-metrics.mjs';

const [manifestPath, outputPath, candidatePath, trainingGroupsPath] = process.argv.slice(2);
if (!manifestPath || !outputPath || Boolean(candidatePath) !== Boolean(trainingGroupsPath)) {
  throw Error('Usage: node scripts/pesto/evaluate-multi-instrument.mjs manifest.json report.json [candidate.onnx training-groups.json]');
}
const traceDirectory = process.env.PESTO_EVAL_TRACE_DIR;
if (traceDirectory) await mkdir(traceDirectory, { recursive: true });
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.version !== 1 || manifest.sampleRate !== 48000 || !manifest.cases?.length) throw Error('Invalid manifest');
const ids = new Set();
for (const item of manifest.cases) {
  if (ids.has(item.id) || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(item.id) || typeof item.family !== 'string'
      || typeof item.instrument !== 'string' || !Number.isInteger(item.midi) || item.midi < 1 || item.midi > 127
      || !/^[a-f0-9]{64}$/.test(item.pcmSha256)) throw Error('Invalid/duplicate fixture');
  ids.add(item.id);
}
const conditions = ['clean', 'quiet-24dB', 'noise20dB', 'twoTapEcho', 'short100ms', 'short200ms'];
const protocol = { version: 1, sampleRate: 48000, hopSamples: 240, cacheSamples: 3976, confidenceThreshold: 0.5,
  centsTolerance: 50, conditions, timeAlignment: 'current audio chunk end; no tuned latency shift',
  referenceMask: 'clean pre-degradation chunk RMS > -60dBFS, nominal note active interval',
  phases: 'attack:0-100ms; sustain:100ms-noteEnd; silence:last50ms of 200ms zero tail',
  expectedNoteAssist: false, tracker: false, pitchShift: false, inputNormalization: false };
ort.env.wasm.numThreads = 1;
const productionPath = new URL('../../dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx', import.meta.url);
const evaluate = async (modelPath, production) => {
  const model = await readFile(modelPath);
  const modelSha256 = sha(model);
  if (production && modelSha256 !== 'c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8') throw Error('Unexpected production model');
  const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
  const audio = new Float32Array(240), cache = new Float32Array(3976);
  const audioTensor = new ort.Tensor('float32', audio, [1, 240]), cacheTensor = new ort.Tensor('float32', cache, [1, 3976]);
  const rows = [], timings = [];
  try {
    for (const item of manifest.cases) {
      const bytes = await readFile(resolve(dirname(manifestPath), item.file));
      if (sha(bytes) !== item.pcmSha256 || bytes.length % 4 !== 0) throw Error('PCM checksum/format: ' + item.id);
      const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      if (pcm.length < 28800 || pcm.some((x) => !Number.isFinite(x))) throw Error('Invalid PCM: ' + item.id);
      for (const condition of conditions) {
        const input = makeCondition(pcm, condition);
        cache.fill(0);
        const phases = { attack: [], sustain: [], silence: [] };
        const trace = traceDirectory ? [] : null;
        for (let start = 0; start + 240 <= input.audio.length; start += 240) {
          audio.set(input.audio.subarray(start, start + 240));
          const begin = performance.now();
          const result = await session.run({ audio: audioTensor, cache: cacheTensor }, ['prediction', 'confidence', 'volume', 'cache_out']);
          timings.push(performance.now() - begin);
          try {
            if (result.cache_out.data.length !== 3976 || ['prediction', 'confidence', 'volume'].some((name) => result[name].data.length !== 1)) throw Error('Incompatible model output shape');
            cache.set(result.cache_out.data);
            if (cache.some((x) => !Number.isFinite(x))) throw Error('Nonfinite model cache');
            const frame = { time: (start + 240) / 48000, prediction: Number(result.prediction.data[0]), confidence: Number(result.confidence.data[0]), referenceMidi: item.midi };
            if (![frame.prediction, frame.confidence, Number(result.volume.data[0])].every(Number.isFinite)) throw Error('Nonfinite model output');
            const energy = input.clean.subarray(start, start + 240).reduce((sum, x) => sum + x * x, 0) / 240;
            if (trace) trace.push({ time: frame.time, prediction: frame.prediction, confidence: frame.confidence,
              volume: Number(result.volume.data[0]), cleanEnergy: energy, nominalMidi: item.midi });
            if (frame.time <= input.duration && energy > 1e-6) phases[frame.time <= 0.1 ? 'attack' : 'sustain'].push(frame);
            if (frame.time > input.duration + 0.15) phases.silence.push({ ...frame, referenceMidi: null });
          } finally { for (const tensor of Object.values(result)) tensor.dispose(); }
        }
        if (trace) await writeFile(resolve(traceDirectory, `${modelSha256}-${item.id}-${condition}.json`), JSON.stringify(trace) + '\n');
        for (const [phase, frames] of Object.entries(phases)) rows.push({ id: item.id, family: item.family, instrument: item.instrument,
          range: rangeFor(item.midi), midi: item.midi, velocity: item.velocity, pcmSha256: item.pcmSha256, condition, phase,
          metrics: scoreFrames(frames) });
      }
      process.stderr.write(`Evaluated ${item.id}\n`);
    }
  } finally { audioTensor.dispose(); cacheTensor.dispose(); await session.release(); }
  timings.sort((a, b) => a - b);
  return { schemaVersion: 1, protocol, dataset: manifest.dataset, source: manifest.source, license: manifest.license,
    preparationVersion: manifest.preparationVersion, decoder: manifest.decoder, fixtures: manifest.cases,
    modelSha256, modelBytes: model.length, runtime: `onnxruntime-web ${ort.env.versions.web}; single-thread WASM; sequential offline replay`,
    inferenceMs: { p50: timings[Math.floor(timings.length * 0.5)], p95: timings[Math.floor(timings.length * 0.95)] },
    limitations: ['Nominal MIDI reference, not measured framewise F0.', 'Sample-library notes, not live microphone or continuous singing.',
      'NSynth subset, not an exhaustive instrument benchmark; no training performed.', 'No warmup exclusion; attack contains causal model settling.',
      'Reference mask fixed from clean audio; excluded quiet frames are not voiced ground truth.', 'Timing is offline inference only, not end-to-end latency.'],
    rows, summary: summarize(rows) };
};
const baseline = await evaluate(productionPath, true);
const output = { baseline, candidate: null, comparison: { status: 'not-run-no-candidate', trainingPerformed: false } };
if (candidatePath) {
  const trainingGroups = JSON.parse(await readFile(trainingGroupsPath, 'utf8'));
  // Reject train/test overlap before running a candidate.
  compareReports(baseline, baseline, trainingGroups);
  output.candidate = await evaluate(candidatePath, false);
  output.comparison = compareReports(baseline, output.candidate, trainingGroups);
}
await writeFile(outputPath, JSON.stringify(output, null, 2) + '\n');
process.stdout.write(JSON.stringify({ outputPath, family: baseline.summary.family, comparison: output.comparison }, null, 2) + '\n');
if (['regression', 'inconclusive-no-reference-coverage'].includes(output.comparison.status)) process.exitCode = 1;
