#!/usr/bin/env node
// Optional Playwright runner against the production build; no app/account connection.
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
const { chromium } = await import(process.env.PESTO_PLAYWRIGHT_MODULE ?? 'playwright');
const root = new URL('../../dist/', import.meta.url);
const workerFile = (await readdir(new URL('assets/', root))).find((file) => /^pestoPitchWorker-.*\.js$/.test(file));
if (!workerFile) throw new Error('Run npm run build:app first');
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    // Match the isolated /main document and its Worker scripts in Netlify.
    if (process.env.PESTO_BENCHMARK_ISOLATED === '1') {
      response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    }
    if (path === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><title>Pitch production pipeline benchmark</title>');
      return;
    }
    const file = new URL(`.${path}`, root);
    if (!file.href.startsWith(root.href)) throw new Error('Invalid path');
    const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' };
    response.setHeader('Content-Type', mime[extname(file.pathname)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No server address');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PESTO_CHROME_PATH,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const durationSec = Number(process.env.PESTO_BENCHMARK_SECONDS ?? 120);
const pitchEngine = process.env.PESTO_BENCHMARK_ENGINE ?? 'pesto';
if (!['pesto', 'pitchy'].includes(pitchEngine)) throw new Error('Invalid pitch engine');
const intervals = (process.env.PESTO_BENCHMARK_INTERVALS ?? '5,10,20').split(',').map(Number);
if (!intervals.length || intervals.some((value) => ![5, 10, 20].includes(value))) throw new Error('Invalid intervals');
if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error('Invalid duration');
const results = [];
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/`);
  for (const interval of intervals) {
    process.stderr.write(`Browser ${pitchEngine} ${interval}ms, ${durationSec}s\n`);
    results.push(await page.evaluate(async ({ interval, durationSec, workerFile, pitchEngine }) => {
      const messages = [];
      const worker = new Worker(`/assets/${workerFile}`, { type: 'module' });
      const context = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
      const channel = new MessageChannel();
      worker.postMessage({ type: 'connectPort' }, [channel.port1]);
      worker.onmessage = (event) => messages.push({ ...event.data, receivedMs: performance.now() });
      worker.postMessage({ type: 'init', pitchEngine, generationId: 1, sensitivity: 5, shiftSemitones: 0,
        inferenceIntervalMs: interval, config: { pitchStableFrames: 2 },
        diagnostics: { deviceLabel: 'synthetic oscillator', sampleRate: 48000, requestedEchoCancellation: false, actualEchoCancellation: false },
      });
      const waitFor = async (predicate) => {
        const start = performance.now();
        while (!predicate()) {
          if (performance.now() - start > 30000) throw new Error(`Worker timeout: ${JSON.stringify(messages.slice(-2))}`);
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      };
      await waitFor(() => messages.some((message) => message.type === 'ready' || message.type === 'error'));
      const error = messages.find((message) => message.type === 'error');
      if (error) throw new Error(error.message);
      worker.postMessage({ type: 'setExpectedPitchCandidates', mask: 1 << 9, midis: [69], repeatPitchClassMask: 1 << 9 });
      await context.audioWorklet.addModule('/js/audio/pesto-capture-worklet.js');
      const worklet = new AudioWorkletNode(context, 'pesto-capture-processor');
      worklet.port.postMessage({ type: 'connectWorker', port: channel.port2 }, [channel.port2]);
      worklet.port.postMessage({ type: 'resetCapture', generationId: 1 });
      const oscillator = context.createOscillator();
      oscillator.frequency.value = 440;
      const volume = context.createGain();
      volume.gain.value = 0.05;
      const mute = context.createGain();
      mute.gain.value = 0;
      oscillator.connect(volume).connect(worklet).connect(mute).connect(context.destination);
      await context.resume();
      const start = performance.now();
      oscillator.start();
      await new Promise((resolve) => setTimeout(resolve, durationSec * 1000));
      worker.postMessage({ type: 'dumpDiagnostics' });
      await waitFor(() => messages.some((message) => message.type === 'diagnosticState'));
      const state = messages.findLast((message) => message.type === 'diagnosticState');
      const monitors = messages.filter((message) => message.type === 'monitor');
      const notes = messages.filter((message) => message.type === 'noteOn');
      const errors = messages.filter((message) => message.type === 'error');
      oscillator.stop();
      worklet.disconnect();
      worker.terminate();
      await context.close();
      const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor(values.length * p)] ?? 0;
      return { pitchEngine, intervalMs: interval, durationSec, crossOriginIsolated, userAgent: navigator.userAgent,
        elapsedMs: performance.now() - start, noteCount: notes.length, wrongNotes: notes.filter((note) => note.note !== 69).length,
        errors, diagnostics: state.diagnostics,
        inferenceP50: percentile(monitors.map((message) => message.diagnostics.inferenceMsP50), 0.5),
        inferenceP95: percentile(monitors.map((message) => message.diagnostics.inferenceMsP95), 0.95),
        processingP95: percentile(monitors.map((message) => message.diagnostics.processingMsP95), 0.95),
        queueAgeP95: percentile(monitors.map((message) => message.diagnostics.queueAgeMsP95), 0.95),
        firstNoteMs: notes.length ? notes[0].receivedMs - start : null,
      };
    }, { interval, durationSec, workerFile, pitchEngine }));
    process.stderr.write(`${JSON.stringify(results.at(-1))}\n`);
  }
  const json = `${JSON.stringify({ results }, null, 2)}\n`;
  if (process.argv[2]) await writeFile(process.argv[2], json);
  process.stdout.write(json);
} finally {
  await browser.close();
  server.close();
}
