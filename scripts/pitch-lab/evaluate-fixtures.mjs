/**
 * 多声ラボ用: 単音サインと加算混合を PitchPlease / EffeTune で順実行し JSON レポートを出す。
 * PESTO はブラウザ Worker 前提のためここでは含めない。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@markusstrasser/pitchplease';
import { createChain, createNoteSpectrogram } from '@effetune/dsp';

const SAMPLE_RATE = 48_000;
const DURATION_SEC = 0.45;
const THRESHOLD = 0.5;
const FIRST_MIDI = 21;
const DPS = 5;

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSET_BASE = `file://${join(root, 'public/vendor/pitchplease/')}`;

const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

const buildSine = (midi) => {
  const length = Math.round(DURATION_SEC * SAMPLE_RATE);
  const data = new Float32Array(length);
  const hz = midiToHz(midi);
  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const env = Math.min(1, t / 0.01) * Math.min(1, (DURATION_SEC - t) / 0.05);
    data[i] = Math.sin(2 * Math.PI * hz * t) * env * 0.35;
  }
  return data;
};

const buildAdditive = (midis) => {
  const length = Math.round(DURATION_SEC * SAMPLE_RATE);
  const data = new Float32Array(length);
  for (const midi of midis) {
    const hz = midiToHz(midi);
    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, t / 0.01) * Math.min(1, (DURATION_SEC - t) / 0.05);
      data[i] += Math.sin(2 * Math.PI * hz * t) * env * (0.35 / midis.length);
    }
  }
  return data;
};

const levelsToMidis = (levels) => {
  const active = [];
  for (let midi = 21; midi <= 108; midi += 1) {
    const center = 2 + (midi - FIRST_MIDI) * DPS;
    let max = 0;
    for (let d = 0; d < DPS; d += 1) {
      const v = levels[center + d];
      if (v > max) max = v;
    }
    if (max >= THRESHOLD) active.push(midi);
  }
  return active;
};

const cases = [
  { id: 'synth-c4', kind: 'monophonic', midis: [60], pcm: buildSine(60) },
  { id: 'synth-e4', kind: 'monophonic', midis: [64], pcm: buildSine(64) },
  { id: 'synth-g4', kind: 'monophonic', midis: [67], pcm: buildSine(67) },
  {
    id: 'additive-mix-c-e-g-NOT-performance',
    kind: 'additiveMix',
    midis: [60, 64, 67],
    pcm: buildAdditive([60, 64, 67]),
  },
  {
    id: 'additive-mix-am7-NOT-performance',
    kind: 'additiveMix',
    midis: [57, 60, 64, 67],
    pcm: buildAdditive([57, 60, 64, 67]),
  },
];

const runEffetune = async (pcm) => {
  const chain = await createChain([createNoteSpectrogram()]);
  const telemetry = [];
  await chain.process([pcm], {
    sampleRate: SAMPLE_RATE,
    onTelemetry: (frame) => {
      if (frame.kind === 'noteSpectrogram') telemetry.push(frame);
    },
  });
  chain.close();
  const sustained = telemetry.filter((f) => f.timeSeconds >= 0.05 && f.timeSeconds <= 0.35);
  const withNotes = sustained.filter((f) => levelsToMidis(f.levels).length > 0);
  return { telemetryCount: telemetry.length, sustainedWithNotes: withNotes.length };
};

const report = { generatedAt: new Date().toISOString(), cases: [] };

for (const testCase of cases) {
  const row = {
    id: testCase.id,
    kind: testCase.kind,
    expectedMidis: testCase.midis,
    engines: {},
  };
  for (const model of ['fast', 'piano']) {
    const pp = await analyze(
      { sampleRate: SAMPLE_RATE, length: testCase.pcm.length, numberOfChannels: 1, getChannelData: () => testCase.pcm },
      { model, assetBaseUrl: ASSET_BASE },
    );
    const sustain = pp.filter((f) => f.time >= 0.05 && f.time <= 0.35);
    const maxSpurious = sustain.reduce((acc, f) => {
      const midis = f.notes.map((n) => n.midi);
      const extra = midis.filter((m) => !testCase.midis.includes(m)).length;
      return Math.max(acc, extra);
    }, 0);
    const missing = testCase.midis.filter(
      (m) => !sustain.some((f) => f.notes.some((n) => n.midi === m)),
    );
    row.engines[`pitchplease-${model}`] = {
      sustainFrames: sustain.length,
      maxSpuriousNotesPerFrame: maxSpurious,
      missingExpectedMidis: missing,
    };
  }
  const eff = await runEffetune(testCase.pcm);
  const chain = await createChain([createNoteSpectrogram()]);
  const telemetry = [];
  await chain.process([testCase.pcm], {
    sampleRate: SAMPLE_RATE,
    onTelemetry: (frame) => {
      if (frame.kind === 'noteSpectrogram') telemetry.push(frame);
    },
  });
  chain.close();
  const sustain = telemetry.filter((f) => f.timeSeconds >= 0.05 && f.timeSeconds <= 0.35);
  const missing = testCase.midis.filter(
    (m) => !sustain.some((f) => levelsToMidis(f.levels).includes(m)),
  );
  row.engines['effetune-immediate'] = {
    ...eff,
    missingExpectedMidis: missing,
  };
  report.cases.push(row);
}

const outDir = join(root, 'docs');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'pitch-mpe-lab-fixtures.json');
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`Wrote ${outPath}\n`);
