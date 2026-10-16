#!/usr/bin/env node
// Production Worker/Worklet + the same sampled-piano PCM used by the comparison.
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const { chromium } = await import(process.env.PESTO_PLAYWRIGHT_MODULE ?? 'playwright');
const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error('Usage: node scripts/pesto/benchmark-pesto-headroom.mjs <fixtures.json> <output.json>');
const durationSec = Number(process.env.PESTO_BENCHMARK_SECONDS ?? 120);
const intervalMs = Number(process.env.PESTO_BENCHMARK_INTERVALS ?? 10);
const stressMs = Number(process.env.PESTO_HEADROOM_STRESS_MS ?? 0);
const stressPeriodMs = 50;
const variants = (process.env.PESTO_HEADROOM_VARIANTS ?? 'candidate').split(',');
if (!(durationSec > 0) || ![5, 10, 20].includes(intervalMs)
    || !(stressMs >= 0 && stressMs < stressPeriodMs)
    || variants.some((variant) => !['baseline', 'candidate'].includes(variant))) throw new Error('Invalid benchmark options');
const dist = new URL('../../dist/', import.meta.url);
const currentWorker = (await readdir(new URL('assets/', dist))).find((file) => /^pestoPitchWorker-.*\.js$/.test(file));
if (!currentWorker) throw new Error('Run npm run build:app first');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const sampleIds = ['salamander-phrase-250', 'felt-phrase-250', 'salamander-repeat-200-0', 'felt-repeat-200-0'];
const parts = [], events = [], hashes = {};
let length = 0;
for (const id of sampleIds) {
  const fixture = manifest.cases.find((item) => item.id === id);
  if (!fixture) throw new Error(`Missing ${id}`);
  const bytes = await readFile(resolve(dirname(manifestPath), 'fixtures', basename(fixture.file)));
  hashes[id] = createHash('sha256').update(bytes).digest('hex');
  if (hashes[id] !== fixture.pcmSha256) throw new Error(`PCM checksum mismatch: ${id}`);
  const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  parts.push(pcm);
  events.push(...fixture.events.map((event) => ({ ...event, onset: event.onset + length / 48000, offset: event.offset + length / 48000 })));
  length += pcm.length;
}
const combined = new Float32Array(length);
let offset = 0;
for (const part of parts) { combined.set(part, offset); offset += part.length; }
const workers = {};
for (const variant of variants) {
  const file = variant === 'baseline' ? process.env.PESTO_HEADROOM_BASELINE_WORKER : new URL(`assets/${currentWorker}`, dist);
  if (!file) throw new Error('Set PESTO_HEADROOM_BASELINE_WORKER to a saved baseline production Worker bundle');
  workers[variant] = await readFile(file, 'utf8');
  // Test-only contention in the same Worker; no stress timer enters the app build.
  if (stressMs) workers[variant] += `\nsetInterval(() => { const until = performance.now() + ${stressMs}; while (performance.now() < until) {} }, ${stressPeriodMs});\n`;
}
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>PESTO piano headroom benchmark</title>'); return; }
    if (path === '/piano.f32') { response.end(Buffer.from(combined.buffer)); return; }
    const variant = /^\/assets\/(baseline|candidate)-benchmark-worker\.js$/.exec(path)?.[1];
    if (variant && workers[variant]) { response.setHeader('Content-Type', 'text/javascript'); response.end(workers[variant]); return; }
    const file = new URL(`.${path}`, dist);
    if (!file.href.startsWith(dist.href)) throw new Error('Invalid path');
    response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' })[extname(file.pathname)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: process.env.PESTO_CHROME_PATH,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  for (const variant of variants) {
    process.stdout.write(`Starting ${variant}: ${durationSec}s, ${intervalMs}ms, test stall ${stressMs}/${stressPeriodMs}ms\n`);
    const result = await page.evaluate(async ({ variant, durationSec, intervalMs, events }) => {
      const messages = [], context = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
      const worker = new Worker(`/assets/${variant}-benchmark-worker.js`, { type: 'module' });
      const channel = new MessageChannel();
      worker.postMessage({ type: 'connectPort' }, [channel.port1]);
      worker.onmessage = (event) => messages.push({ ...event.data, receivedMs: performance.now(), receivedContextTime: context.currentTime });
      const waitFor = async (predicate) => {
        const start = performance.now();
        while (!predicate()) { if (performance.now() - start > 30000) throw new Error('Worker timeout'); await new Promise((resolve) => setTimeout(resolve, 10)); }
      };
      try {
        worker.postMessage({ type: 'init', pitchEngine: 'pesto', generationId: 1, sensitivity: 5, shiftSemitones: 0,
          inferenceIntervalMs: intervalMs, config: { pitchStableFrames: 4, fastResponse: false },
          diagnostics: { deviceLabel: 'two sampled piano banks', sampleRate: 48000, requestedEchoCancellation: false, actualEchoCancellation: false } });
        await waitFor(() => messages.some((message) => message.type === 'ready' || message.type === 'error'));
        if (messages.some((message) => message.type === 'error')) throw new Error('Worker initialization failed');
        const pcm = new Float32Array(await (await fetch('/piano.f32')).arrayBuffer());
        const audio = context.createBuffer(1, pcm.length, 48000); audio.copyToChannel(pcm, 0);
        const source = context.createBufferSource(); source.buffer = audio; source.loop = true;
        await context.audioWorklet.addModule('/js/audio/pesto-capture-worklet.js');
        const worklet = new AudioWorkletNode(context, 'pesto-capture-processor');
        worklet.port.postMessage({ type: 'connectWorker', port: channel.port2 }, [channel.port2]);
        worklet.port.postMessage({ type: 'resetCapture', generationId: 1 });
        const mute = context.createGain(); mute.gain.value = 0;
        source.connect(worklet).connect(mute).connect(context.destination); await context.resume();
        const startAt = context.currentTime + 0.05; source.start(startAt);
        await new Promise((resolve) => setTimeout(resolve, durationSec * 1000));
        worker.postMessage({ type: 'dumpDiagnostics' });
        await waitFor(() => messages.some((message) => message.type === 'diagnosticState'));
        const diagnostics = messages.findLast((message) => message.type === 'diagnosticState').diagnostics;
        const ons = messages.filter((message) => message.type === 'noteOn'), expected = [];
        for (let loop = 0; loop * audio.duration < durationSec; loop += 1) for (const event of events) {
          const onset = startAt + loop * audio.duration + event.onset;
          if (onset + 0.25 < context.currentTime) expected.push({ ...event, onset });
        }
        const used = new Set(), delays = [];
        for (let i = 0; i < expected.length; i += 1) {
          const event = expected[i], deadline = Math.min(event.onset + 0.25, expected[i + 1]?.onset ?? Infinity);
          const index = ons.findIndex((message, index) => !used.has(index) && message.note === event.midi && message.receivedContextTime >= event.onset && message.receivedContextTime < deadline);
          if (index >= 0) { used.add(index); delays.push((ons[index].receivedContextTime - event.onset) * 1000); }
        }
        const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))] ?? null;
        const monitors = messages.filter((message) => message.type === 'monitor');
        const pipelineLag = monitors.map((message) => Math.max(0, (message.receivedContextTime - message.diagnostics.lastSourceEndTimeSec) * 1000));
        const windows = {};
        for (const key of ['inferenceMsP50', 'inferenceMsP95', 'processingMsP95', 'queueAgeMsP95', 'captureQueueAgeMsP95', 'workerQueueAgeMsP95', 'preprocessMsP95']) {
          const values = monitors.map((message) => message.diagnostics[key]).filter(Number.isFinite);
          windows[key] = { median: percentile(values, 0.5), p95: percentile(values, 0.95), max: values.length ? Math.max(...values) : null };
        }
        const dropEvents = []; let previousDrops = 0;
        for (const message of monitors) if (message.diagnostics.droppedSamples !== previousDrops) {
          dropEvents.push({ sourceEndSec: message.diagnostics.lastSourceEndTimeSec, droppedSamples: message.diagnostics.droppedSamples, queueAgeMsP95: message.diagnostics.queueAgeMsP95 }); previousDrops = message.diagnostics.droppedSamples;
        }
        const monitorGapsOver600Ms = [];
        for (let i = 1; i < monitors.length; i += 1) if (monitors[i].receivedMs - monitors[i - 1].receivedMs > 600) monitorGapsOver600Ms.push(monitors[i].receivedMs - monitors[i - 1].receivedMs);
        source.stop(); worklet.disconnect();
        return { variant, intervalMs, durationSec, userAgent: navigator.userAgent, crossOriginIsolated,
          expected: expected.length, matched: used.size, detected: ons.length, delayMsP50: percentile(delays, 0.5), delayMsP95: percentile(delays, 0.95),
          diagnostics, windows, monitorCount: monitors.length, monitorGapsOver600Ms, dropEvents,
          pipelineLagMs: { p50: percentile(pipelineLag, 0.5), p95: percentile(pipelineLag, 0.95), max: Math.max(...pipelineLag) },
          errors: messages.filter((message) => message.type === 'error') };
      } finally { worker.terminate(); await context.close(); }
    }, { variant, durationSec, intervalMs, events });
    results.push(result);
    await writeFile(outputPath, JSON.stringify({ sampleIds, pcmSha256: hashes, stressMs, stressPeriodMs, results }, null, 2) + '\n');
    process.stdout.write(JSON.stringify(result) + '\n');
  }
} finally { await browser.close(); server.close(); }
