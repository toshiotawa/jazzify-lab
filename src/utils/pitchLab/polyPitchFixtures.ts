import type { PolyPitchTrialLabel } from './polyPitchTypes';

export interface SyntheticMonophonicFixture {
  id: string;
  nominalMidi: number;
  durationSec: number;
  sampleRate: number;
}

export const LAB_MONO_FIXTURES: readonly SyntheticMonophonicFixture[] = [
  { id: 'synth-c4', nominalMidi: 60, durationSec: 0.45, sampleRate: 48_000 },
  { id: 'synth-e4', nominalMidi: 64, durationSec: 0.45, sampleRate: 48_000 },
  { id: 'synth-g4', nominalMidi: 67, durationSec: 0.45, sampleRate: 48_000 },
];

export const buildSineFixtureBuffer = (
  context: BaseAudioContext,
  midi: number,
  durationSec: number,
  sampleRate: number,
): AudioBuffer => {
  const length = Math.round(durationSec * sampleRate);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const hz = 440 * 2 ** ((midi - 69) / 12);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.01) * Math.min(1, (durationSec - t) / 0.05);
    data[i] = Math.sin(2 * Math.PI * hz * t) * env * 0.35;
  }
  return buffer;
};

/** 演奏ではない加算混合（ファイル名・レポートで明示する） */
export const buildAdditiveMixBuffer = (
  context: BaseAudioContext,
  midis: readonly number[],
  durationSec: number,
  sampleRate: number,
): AudioBuffer => {
  const length = Math.round(durationSec * sampleRate);
  const buffer = context.createBuffer(1, length, sampleRate);
  const out = buffer.getChannelData(0);
  for (const midi of midis) {
    const hz = 440 * 2 ** ((midi - 69) / 12);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const env = Math.min(1, t / 0.01) * Math.min(1, (durationSec - t) / 0.05);
      out[i] += Math.sin(2 * Math.PI * hz * t) * env * (0.35 / midis.length);
    }
  }
  return buffer;
};

export const labelForMonophonic = (
  midi: number,
  durationSec: number,
): PolyPitchTrialLabel => ({
  onsetTimeSec: 0.02,
  sustainEndTimeSec: durationSec - 0.05,
  expectedMidis: [midi],
});

export const labelForAdditiveMix = (
  midis: readonly number[],
  durationSec: number,
): PolyPitchTrialLabel => ({
  onsetTimeSec: 0.02,
  sustainEndTimeSec: durationSec - 0.05,
  expectedMidis: [...midis].sort((a, b) => a - b),
  additiveMix: true,
});

export const additiveMixFixtureDescription = (midis: readonly number[]): string =>
  `additive-mix-NOT-performance:${midis.join('-')}`;
