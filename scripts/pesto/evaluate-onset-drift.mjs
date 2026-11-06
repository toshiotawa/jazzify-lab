#!/usr/bin/env node
// Offline-only replay: both trackers consume identical raw model outputs.
import assert from 'node:assert/strict';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import * as ort from 'onnxruntime-web';
import { makeCondition, rangeFor } from './multi-instrument-metrics.mjs';

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw Error('Usage: node evaluate-onset-drift.mjs manifest.json report.json');
const root = new URL('../../', import.meta.url);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const loadTs = async (source) => {
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputText).toString('base64'));
};
const candidateSource = await readFile(new URL('src/utils/pitchInput/pitchOnsetTracker.ts', root), 'utf8');
const guard = '        quantized !== this.currentNote\r\n        && !pitchMatch(frame.prediction, this.currentNote, this.config.centsTolerance)';
assert.equal(candidateSource.split(guard).length, 2, 'Expected the precise same-MIDI guard once');
const baselineSource = candidateSource.replace(guard, '        !pitchMatch(frame.prediction, this.currentNote, this.config.centsTolerance)');
const baselineBytes = Buffer.from(baselineSource);
const baselineBlob = createHash('sha1').update('blob ' + baselineBytes.length + '\0').update(baselineBytes).digest('hex');
assert.equal(baselineBlob, '0a3b786295c3c8d5709bdf0f59372bd802a8214c', 'Baseline must match cf144d2 exactly');
const [baselineModule, candidateModule, envelopeModule] = await Promise.all([
  loadTs(baselineSource), loadTs(candidateSource),
  loadTs(await readFile(new URL('src/utils/pitchInput/pitchAttackEnvelope.ts', root), 'utf8')),
]);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
assert.equal(manifest.version, 1);
assert.equal(manifest.sampleRate, 48000);
assert.ok(manifest.cases.length > 0);
assert.equal(new Set(manifest.cases.map((item) => item.id)).size, manifest.cases.length);
const conditions = ['clean', 'quiet-24dB', 'noise20dB', 'twoTapEcho', 'short100ms', 'short200ms'];
const model = await readFile(new URL('dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx', root));
const modelSha256 = sha(model);
assert.equal(modelSha256, 'c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8');
ort.env.wasm.numThreads = 1;
const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
const audio = new Float32Array(240), cache = new Float32Array(3976);
const audioTensor = new ort.Tensor('float32', audio, [1, 240]);
const cacheTensor = new ort.Tensor('float32', cache, [1, 3976]);
const trials = [], regressions = [];
let frameCount = 0;
const metrics = (events, midi) => {
  const correct = events.filter(([note]) => note === midi);
  return { noteOns: events.length, wrongNoteOns: events.length - correct.length,
    duplicateCorrectOns: Math.max(0, correct.length - 1), firstCorrectMs: correct[0]?.[1] ?? null };
};
try {
  for (const item of manifest.cases) {
    assert.ok(Number.isInteger(item.midi) && item.midi > 0 && item.midi < 128);
    const bytes = await readFile(resolve(dirname(manifestPath), item.file));
    assert.equal(sha(bytes), item.pcmSha256, 'PCM checksum: ' + item.id);
    assert.equal(bytes.length % 4, 0);
    const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    assert.ok(pcm.length >= 28800 && pcm.every(Number.isFinite), 'Invalid PCM');
    for (const condition of conditions) {
      const input = makeCondition(pcm, condition);
      const trackers = [new baselineModule.PitchOnsetTracker(), new candidateModule.PitchOnsetTracker()];
      const envelopes = trackers.map(() => new envelopeModule.PitchAttackEnvelope());
      const events = [[], []];
      // A shared clean-energy mask and the default free-play start thresholds.
      const gates = { audible: 0, correctPitch: 0, correctAndLoud: 0, correctAndConfident: 0, all: 0 };
      cache.fill(0);
      for (let start = 0, index = 0; start + 240 <= input.audio.length; start += 240, index += 1) {
        audio.set(input.audio.subarray(start, start + 240));
        for (const envelope of envelopes) envelope.pushSamples(audio);
        const output = await session.run({ audio: audioTensor, cache: cacheTensor });
        try {
          assert.equal(output.cache_out.data.length, 3976);
          cache.set(output.cache_out.data);
          const frame = {};
          for (const name of ['prediction', 'confidence', 'volume']) {
            assert.equal(output[name].data.length, 1);
            frame[name] = Number(output[name].data[0]);
            assert.ok(Number.isFinite(frame[name]), 'Nonfinite ' + name);
          }
          frameCount += 1;
          // Match the worker's four-frame cold-start suppression at 5ms, shift=0.
          if (index < 4) continue;
          if ((start + 240) / 48000 <= input.duration) {
            const energy = input.clean.subarray(start, start + 240).reduce((sum, x) => sum + x * x, 0) / 240;
            if (energy > 1e-6) {
              gates.audible += 1;
              if (Math.round(frame.prediction) === item.midi) {
                gates.correctPitch += 1;
                const config = candidateModule.DEFAULT_ONSET_CONFIG;
                const loud = 10 * Math.log10(Math.max(frame.volume, 1e-12)) > config.onsetLevelDb;
                const confident = frame.confidence >= config.minConfidence;
                if (loud) gates.correctAndLoud += 1;
                if (confident) gates.correctAndConfident += 1;
                if (loud && confident) gates.all += 1;
              }
            }
          }
          for (let variant = 0; variant < trackers.length; variant += 1) {
            const tracker = trackers[variant];
            const attackMidi = tracker.getAttackReferenceNote();
            const attackDb = envelopes[variant].computeAttackDb(attackMidi);
            for (const event of tracker.processFrame({ ...frame, attackMidi, attackDb }, index + 1)) {
              if (event.type === 'noteOn') events[variant].push([event.note, event.frameIndex * 5]);
            }
          }
        } finally { for (const tensor of Object.values(output)) tensor.dispose(); }
      }
      const before = metrics(events[0], item.midi), after = metrics(events[1], item.midi);
      let missReason = null;
      if (after.firstCorrectMs === null) {
        if (!gates.audible) missReason = 'no-active-reference';
        else if (!gates.correctPitch) missReason = 'no-correct-raw-pitch';
        else if (gates.all) missReason = 'eligible-frame-without-notification';
        else if (!gates.correctAndLoud && !gates.correctAndConfident) missReason = 'level-and-confidence';
        else if (!gates.correctAndLoud) missReason = 'level';
        else if (!gates.correctAndConfident) missReason = 'confidence';
        else missReason = 'gates-passed-on-different-frames';
      }
      const trial = { gates, missReason, id: item.id, family: item.family, instrument: item.instrument, midi: item.midi,
        range: rangeFor(item.midi), velocity: item.velocity, condition,
        conditionPcmSha256: sha(new Uint8Array(input.audio.buffer)), before, after,
        baselineEvents: events[0], candidateEvents: events[1] };
      if (before.firstCorrectMs !== null && (after.firstCorrectMs === null || after.firstCorrectMs > before.firstCorrectMs)) {
        regressions.push({ id: item.id, condition, reason: 'first-correct-note-lost-or-delayed', before, after });
      }
      if (after.wrongNoteOns > before.wrongNoteOns) {
        regressions.push({ id: item.id, condition, reason: 'more-nominally-wrong-notifications', before, after });
      }
      trials.push(trial);
    }
    process.stderr.write('Replayed ' + item.id + '\n');
  }
} finally { audioTensor.dispose(); cacheTensor.dispose(); await session.release(); }
const totals = (rows, side) => ({ trials: rows.length,
  correctTrials: rows.filter((row) => row[side].firstCorrectMs !== null).length,
  ...Object.fromEntries(['noteOns', 'wrongNoteOns', 'duplicateCorrectOns'].map((field) => [
    field, rows.reduce((sum, row) => sum + row[side][field], 0),
  ])) });
const summary = { before: totals(trials, 'before'), after: totals(trials, 'after') };
const missed = (rows) => {
  const counts = {};
  for (const row of rows) if (row.missReason) counts[row.missReason] = (counts[row.missReason] ?? 0) + 1;
  return counts;
};
const groups = {};
for (const dimension of ['family', 'instrument', 'range', 'condition', 'velocity']) {
  groups[dimension] = {};
  for (const value of new Set(trials.map((row) => String(row[dimension])))) {
    const rows = trials.filter((row) => String(row[dimension]) === value);
    groups[dimension][value] = { before: totals(rows, 'before'), after: totals(rows, 'after'), misses: missed(rows) };
  }
}
const report = {
  version: 1, modelSha256, baselineCommit: 'cf144d2dd6534dc86979b44e76de2676a4e20b68',
  baselineBlob, candidateSourceSha256: sha(candidateSource), frameCount,
  runtime: 'onnxruntime-web ' + ort.env.versions.web + '; single-thread WASM',
  protocol: 'same raw prediction/confidence/volume; separate actual TS trackers and envelopes; default sensitivity 5; 5ms; four cold-start frames; no expected/repeat masks or pitch shift',
  limitations: [
    'Nominal sample MIDI is not manually annotated framewise F0.',
    'Extra correct-note notifications in single-note clips are a diagnostic proxy, not onset precision.',
    'Existing inspected source groups, not a fresh blind test or live-microphone evaluation.',
    'No raw pitch or model-weight change; this comparison evaluates event handling only.',
  ],
  misses: missed(trials), decoder: manifest.decoder, fixtures: manifest.cases, summary, groups, regressions, trials,
};
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
const brief = JSON.stringify({ frameCount, summary, misses: missed(trials), family: groups.family, regressions }, null, 2);
process.stdout.write(brief + '\n');
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, '### Same-note drift replay\n\n~~~json\n' + brief + '\n~~~\n');
if (regressions.length) process.exitCode = 1;
