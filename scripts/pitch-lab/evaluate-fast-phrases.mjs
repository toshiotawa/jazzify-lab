/**
 * 速いフレーズ合成音で PitchPlease / EffeTune と onset ゲートを評価する。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@markusstrasser/pitchplease';
import { createChain, createNoteSpectrogram } from '@effetune/dsp';

const SAMPLE_RATE = 48_000;
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSET_BASE = `file://${join(root, 'public/vendor/pitchplease/')}`;

const DEFAULT_ONSET = Object.freeze({
  strongLevel: 0.9,
  fastConfirmFrames: 1,
  slowConfirmFrames: 2,
  releaseFrames: 5,
  neighborYoungFrames: 2,
});

const THR = {
  'pitchplease-fast': { on: 0.7, off: 0.42 },
  'pitchplease-piano': { on: 0.6, off: 0.36 },
  effetune: { on: 0.7, off: 0.45 },
};

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

const renderPhrase = (strikes, releaseTau = 0.2) => {
  const last = strikes[strikes.length - 1];
  const dur = last.on + last.hold + 0.8;
  const data = new Float32Array(Math.round(dur * SAMPLE_RATE));
  for (const strike of strikes) {
    const f0 = hz(strike.midi);
    const s0 = Math.round(strike.on * SAMPLE_RATE);
    const g = strike.gain ?? 1;
    for (let i = s0; i < data.length; i += 1) {
      const t = i / SAMPLE_RATE - strike.on;
      let env = Math.min(1, t / 0.004) * Math.exp(-t / 0.7);
      if (t > strike.hold) env *= Math.exp(-(t - strike.hold) / releaseTau);
      if (env < 1e-4 && t > strike.hold) break;
      let v = 0;
      for (let k = 1; k <= 8; k += 1) {
        const fk = f0 * k * Math.sqrt(1 + 0.0004 * k * k);
        if (fk > SAMPLE_RATE / 2) break;
        v += Math.sin(2 * Math.PI * fk * t) / k ** 1.3 * Math.exp(-t * k * 0.8);
      }
      data[i] += v * env * 0.18 * g;
    }
  }
  return { pcm: data, dur, strikes };
};

const buildStrikes = (midis, ioi, hold, loops, rest, gains) => {
  const strikes = [];
  let t = 0.3;
  for (let l = 0; l < loops; l += 1) {
    for (let i = 0; i < midis.length; i += 1) {
      strikes.push({ midi: midis[i], on: t, hold, gain: gains?.[i] });
      t += ioi;
    }
    t += rest;
  }
  return strikes;
};

const neighborSuppresses = (midi, level, levels, thr, tracker, cfg) => {
  for (const delta of [-1, 1]) {
    const n = midi + delta;
    if (n < 21 || n > 108) continue;
    const pn = levels[n];
    if (pn < thr.on) continue;
    const stronger = delta < 0 ? pn >= level : pn > level;
    if (!stronger) continue;
    if (tracker.emitted[n] === 1 && tracker.framesSinceOn[n] > cfg.neighborYoungFrames) continue;
    return true;
  }
  return false;
};

const createTracker = () => ({
  emitted: new Uint8Array(128),
  confirmFrames: new Int32Array(128),
  releaseFrames: new Int32Array(128),
  framesSinceOn: new Int32Array(128),
  events: [],
});

const stepOnset = (tracker, levels, thr, cfg) => {
  for (let midi = 21; midi <= 108; midi += 1) {
    if (tracker.emitted[midi] === 1) tracker.framesSinceOn[midi] += 1;
  }
  for (let midi = 21; midi <= 108; midi += 1) {
    const level = levels[midi];
    if (tracker.emitted[midi] !== 1) {
      if (level < thr.on) {
        tracker.confirmFrames[midi] = 0;
        continue;
      }
      if (neighborSuppresses(midi, level, levels, thr, tracker, cfg)) {
        tracker.confirmFrames[midi] = 0;
        continue;
      }
      tracker.confirmFrames[midi] += 1;
      const need = level >= cfg.strongLevel ? cfg.fastConfirmFrames : cfg.slowConfirmFrames;
      if (tracker.confirmFrames[midi] < need) continue;
      tracker.emitted[midi] = 1;
      tracker.confirmFrames[midi] = 0;
      tracker.framesSinceOn[midi] = 0;
      tracker.events.push({ time: tracker.frameTime, midi, kind: 'on' });
      continue;
    }
    if (level >= thr.off) {
      tracker.releaseFrames[midi] = 0;
      continue;
    }
    tracker.releaseFrames[midi] += 1;
    if (tracker.releaseFrames[midi] < cfg.releaseFrames) continue;
    tracker.emitted[midi] = 0;
    tracker.events.push({ time: tracker.frameTime, midi, kind: 'off' });
  }
};

const levelsFromProbs = (probs) => {
  const levels = new Float32Array(128);
  for (let i = 0; i < probs.length; i += 1) levels[21 + i] = probs[i];
  return levels;
};

const effeTuneLevelsToMidi = (frameLevels, firstMidi = 21, dps = 5) => {
  const levels = new Float32Array(128);
  for (let midi = 21; midi <= 108; midi += 1) {
    const center = 2 + (midi - firstMidi) * dps;
    let max = 0;
    for (let d = 0; d < dps; d += 1) {
      const v = frameLevels[center + d];
      if (v > max) max = v;
    }
    levels[midi] = max;
  }
  return levels;
};

const scoreEvents = (strikes, events) => {
  const onEvents = events.filter((e) => e.kind === 'on');
  const used = new Set();
  let hit = 0;
  const miss = {};
  const latencies = [];
  for (const s of strikes) {
    const idx = onEvents.findIndex((e, j) => !used.has(j)
      && e.midi === s.midi
      && e.time >= s.on - 0.03
      && e.time <= s.on + 0.12);
    if (idx >= 0) {
      used.add(idx);
      hit += 1;
      latencies.push((onEvents[idx].time - s.on) * 1000);
    } else {
      const name = s.midi;
      miss[name] = (miss[name] ?? 0) + 1;
    }
  }
  latencies.sort((a, b) => a - b);
  const extra = onEvents.filter((_, j) => !used.has(j)).length;
  return {
    hit,
    total: strikes.length,
    medianLatencyMs: latencies.length ? Math.round(latencies[latencies.length >> 1]) : null,
    miss,
    extraOnEvents: extra,
  };
};

const runPitchPlease = async (pcm, model, strikes) => {
  const frames = await analyze(
    {
      sampleRate: SAMPLE_RATE,
      length: pcm.length,
      numberOfChannels: 1,
      getChannelData: () => pcm,
    },
    { model, assetBaseUrl: ASSET_BASE },
  );
  const thr = THR[`pitchplease-${model}`];
  const tracker = createTracker();
  for (const frame of frames) {
    tracker.frameTime = frame.time;
    stepOnset(tracker, levelsFromProbs(frame.probs), thr, DEFAULT_ONSET);
  }
  return scoreEvents(strikes, tracker.events);
};

const runEffetune = async (pcm, strikes) => {
  const chain = await createChain([createNoteSpectrogram()]);
  const telemetry = [];
  await chain.process([pcm], {
    sampleRate: SAMPLE_RATE,
    onTelemetry: (frame) => {
      if (frame.kind === 'noteSpectrogram') telemetry.push(frame);
    },
  });
  chain.close();
  const tracker = createTracker();
  for (const frame of telemetry) {
    tracker.frameTime = frame.timeSeconds;
    stepOnset(
      tracker,
      effeTuneLevelsToMidi(frame.levels, frame.firstMidi, frame.divisionsPerSemitone),
      THR.effetune,
      DEFAULT_ONSET,
    );
  }
  return scoreEvents(strikes, tracker.events);
};

const cases = [
  {
    id: 'mifaradomire-pedal',
    strikes: buildStrikes([64, 65, 69, 72, 76, 74], 0.105, 0.12, 8, 0),
    releaseTau: 0.5,
  },
  {
    id: 'mifaradomire-dry',
    strikes: buildStrikes([64, 65, 69, 72, 76, 74], 0.105, 0.12, 8, 0.2),
    releaseTau: 0.04,
  },
  {
    id: 'remifasomire-dry',
    strikes: buildStrikes([74, 76, 77, 79, 76, 74], 0.105, 0.12, 8, 0.25),
    releaseTau: 0.04,
  },
  {
    id: 'ceg-chord-repeat',
    strikes: (() => {
      const strikes = [];
      let t = 0.3;
      for (let l = 0; l < 4; l += 1) {
        for (const midi of [60, 64, 67]) strikes.push({ midi, on: t, hold: 1.0 });
        t += 1.2;
      }
      return strikes;
    })(),
    releaseTau: 0.08,
  },
  {
    id: 'semitone-legato',
    strikes: (() => {
      const strikes = [];
      let t = 0.3;
      for (let l = 0; l < 6; l += 1) {
        strikes.push({ midi: 64, on: t, hold: 0.42 });
        t += 0.4;
        strikes.push({ midi: 65, on: t, hold: 0.42 });
        t += 0.4;
      }
      return strikes;
    })(),
    releaseTau: 0.08,
  },
];

const report = { generatedAt: new Date().toISOString(), onset: DEFAULT_ONSET, cases: [] };

for (const testCase of cases) {
  const { pcm, strikes } = renderPhrase(testCase.strikes, testCase.releaseTau);
  const row = { id: testCase.id, strikeCount: strikes.length, engines: {} };
  for (const model of ['fast', 'piano']) {
    row.engines[`pitchplease-${model}`] = await runPitchPlease(pcm, model, strikes);
  }
  row.engines.effetune = await runEffetune(pcm, strikes);
  report.cases.push(row);
}

const outPath = join(root, 'docs/pitch-mpe-fast-phrases.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`Wrote ${outPath}\n`);
