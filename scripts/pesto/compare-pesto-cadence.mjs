#!/usr/bin/env node
// Real deployed WASM + production Worker/tracker. Sequential replay, not a browser/real-time benchmark.
import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import * as ort from 'onnxruntime-web';

const root = new URL('../../', import.meta.url);
const output = new URL('temp/pesto-cadence/worker.mjs', root);
await mkdir(new URL('./', output), { recursive: true });
await build({
  entryPoints: [new URL('src/workers/pestoPitchWorker.ts', root).pathname],
  outfile: output.pathname, bundle: true, platform: 'node', format: 'esm',
  external: ['onnxruntime-web'], alias: { '@': new URL('src', root).pathname, 'onnxruntime-web/wasm': 'onnxruntime-web' },
  define: { 'import.meta.env.DEV': 'true' },
});
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, ...options) => {
  if (typeof url === 'string' && url.startsWith('/models/pesto/')) {
    return new Response(await readFile(new URL(`dist${url}`, root)));
  }
  return originalFetch(url, ...options);
};
const fixtures = [
  { name: 'sustain', duration: 2, note: () => 64, amplitude: () => 0.08, repeat: true },
  ...[100, 125, 200].flatMap((period) => [0, 5, 10, 15].map((phase) => ({
    name: `repeat-${period}ms-phase-${phase}`, duration: 2,
    note: () => 64, repeat: true,
    amplitude: (t) => {
      const ms = t * 1000 - 200 - phase;
      return ms < 0 ? 0 : 0.08 * Math.exp(-(ms % period) / 22);
    },
  }))),
  { name: 'legato', duration: 2, note: (t) => [60, 62, 64, 65, 67, 64, 62, 60][Math.floor(t * 4) % 8], amplitude: () => 0.08 },
  { name: 'mixed-range', duration: 2, note: (t) => [45, 57, 69, 81][Math.floor(t * 2) % 4], amplitude: () => 0.04 },
  { name: 'low-input', duration: 2, note: () => 64, amplitude: (t) => t < 1 ? 0.08 : 0.00003 },
];
const pcmFor = (fixture) => Float32Array.from({ length: fixture.duration * 48000 }, (_, i) => {
  const t = i / 48000;
  const phase = 2 * Math.PI * 440 * 2 ** ((fixture.note(t) - 69) / 12) * t;
  return fixture.amplitude(t) * (Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase));
});
const percentile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.floor(values.length * fraction)] ?? 0;
const modes = [];
for (const interval of [5, 10, 20]) {
  const messages = [];
  let receivedSample = 0;
  let onRecycle;
  const worker = { postMessage: (message) => messages.push({ ...message, receivedSample }) };
  const port = { postMessage: (message) => { if (message.type === 'recycle') onRecycle?.(); } };
  globalThis.self = worker;
  await import(`${output.href}?interval=${interval}`);
  // Browser Worker uses /ort/; Node resolves the same runtime binaries here.
  ort.env.wasm.wasmPaths = new URL('node_modules/onnxruntime-web/dist/', root).href;
  const control = async (data) => worker.onmessage({ data, ports: [port] });
  await control({ type: 'connectPort' });
  const results = [];
  for (const fixture of fixtures) {
    process.stderr.write(`${interval}ms: ${fixture.name}\n`);
    messages.length = 0;
    await control({ type: 'init', sensitivity: 5, generationId: 1, shiftSemitones: 0,
      inferenceIntervalMs: interval, config: { pitchStableFrames: 2 },
      diagnostics: { deviceLabel: 'synthetic', sampleRate: 48000, requestedEchoCancellation: false, actualEchoCancellation: false },
    });
    await control({ type: 'setExpectedPitchCandidates', mask: fixture.repeat ? 1 << 4 : 0,
      midis: fixture.repeat ? [64] : [], repeatPitchClassMask: fixture.repeat ? 1 << 4 : 0 });
    const pcm = pcmFor(fixture);
    const processMs = [];
    for (let start = 0, sequence = 0; start < pcm.length; start += 240, sequence += 1) {
      const samples = pcm.slice(start, start + 240);
      const sumSq = samples.reduce((sum, x) => sum + x * x, 0);
      receivedSample = start + 240;
      const beginning = performance.now();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Worker did not recycle at ${interval}ms/${fixture.name}/${sequence}`)), 10000);
        onRecycle = () => { clearTimeout(timeout); resolve(); };
        port.onmessage({ data: {
          type: 'audioChunk', generationId: 1, sequence, sourceStartSample: start,
          sourceEndSample: receivedSample, sourceEndTimeSec: receivedSample / 48000,
          samples, rawRmsDbfs: 10 * Math.log10(Math.max(sumSq / 240, 1e-24)), rawPeak: 0, clipCount: 0,
        } });
      });
      processMs.push(performance.now() - beginning);
    }
    await control({ type: 'dumpFrameTrace' });
    await control({ type: 'dumpDiagnostics' });
    const trace = messages.findLast((message) => message.type === 'frameTrace').entries;
    const state = messages.findLast((message) => message.type === 'diagnosticState');
    const notes = messages.filter((message) => message.type === 'noteOn').map((message) => ({
      note: message.note, onsetMs: message.audioContextTime * 1000, receivedMs: message.receivedSample / 48,
    }));
    if (state.diagnostics.droppedSamples !== 0) throw new Error('Sequential replay lost audio');
    results.push({ fixture: fixture.name, notes, trace, diagnostics: state.diagnostics,
      totalProcessingMs: processMs.reduce((a, b) => a + b, 0), processingMsP50: percentile(processMs, 0.5),
      processingMsP95: percentile(processMs, 0.95) });
  }
  modes.push({ interval, results });
}
const comparisons = modes.slice(1).map((mode) => ({ intervalMs: mode.interval,
  fixtures: mode.results.map((result, i) => {
    const baseline = modes[0].results[i];
    const maxDifference = { prediction: 0, confidence: 0, volumeDb: 0, attackDb: 0 };
    const bySample = new Map(baseline.trace.map((frame) => [Math.round(frame.frameIndex * 5), frame]));
    for (const frame of result.trace) {
      const ref = bySample.get(Math.round(frame.frameIndex * mode.interval));
      if (!ref) throw new Error('No baseline observation for matching source time');
      for (const key of Object.keys(maxDifference)) {
        maxDifference[key] = Math.max(maxDifference[key], Math.abs(frame[key] - ref[key]));
      }
    }
    for (const key of ['prediction', 'confidence', 'volumeDb']) {
      if (maxDifference[key] !== 0) throw new Error(`${result.fixture}: ${key} changed at ${mode.interval}ms`);
    }
    if (result.fixture === 'sustain' && result.notes.length !== 1) throw new Error('False sustained retrigger');
    return { fixture: result.fixture, comparedObservations: result.trace.length, baselineNoteCount: baseline.notes.length, noteCount: result.notes.length,
      maxDifference, firstNote: result.notes[0] ?? null, baselineFirstNote: baseline.notes[0] ?? null,
      totalProcessingMs: result.totalProcessingMs, baselineProcessingMs: baseline.totalProcessingMs,
      diagnostics: result.diagnostics };
  }),
}));
const report = { environment: { node: process.version, platform: process.platform, arch: process.arch,
  runtime: 'onnxruntime-web single-thread WASM', realtime: false }, comparisons };
const json = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv[2]) await writeFile(process.argv[2], json);
process.stdout.write(`${JSON.stringify({ environment: report.environment, results: comparisons.map((mode) => ({
  intervalMs: mode.intervalMs, fixtures: mode.fixtures.map((fixture) => ({ fixture: fixture.fixture,
    notes: `${fixture.baselineNoteCount}→${fixture.noteCount}`, maxDifference: fixture.maxDifference,
    processMs: Math.round(fixture.totalProcessingMs), baselineMs: Math.round(fixture.baselineProcessingMs),
  })),
})) }, null, 2)}\n`);
