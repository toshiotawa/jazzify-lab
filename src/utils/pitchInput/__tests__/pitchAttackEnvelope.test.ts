import {
  PitchAttackEnvelope,
  PITCH_ATTACK_ENVELOPE_WINDOW_SAMPLES,
  PITCH_ATTACK_SAMPLE_RATE,
} from '@/utils/pitchInput/pitchAttackEnvelope';

const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

const synthesizeBurst = (
  midi: number,
  burstMs: number,
  gapMs: number,
  burstCount: number,
): Float32Array => {
  const burstSamples = Math.round((burstMs / 1000) * PITCH_ATTACK_SAMPLE_RATE);
  const gapSamples = Math.round((gapMs / 1000) * PITCH_ATTACK_SAMPLE_RATE);
  const totalSamples = burstCount * burstSamples + Math.max(0, burstCount - 1) * gapSamples;
  const output = new Float32Array(totalSamples);
  let cursor = 0;
  for (let burst = 0; burst < burstCount; burst += 1) {
    for (let sample = 0; sample < burstSamples; sample += 1) {
      const t = sample / PITCH_ATTACK_SAMPLE_RATE;
      const envelope = Math.min(1, t * 80) * Math.exp(-t * 18);
      output[cursor] = Math.sin(2 * Math.PI * midiToHz(midi) * t) * envelope * 0.35;
      cursor += 1;
    }
    cursor += gapSamples;
  }
  return output;
};

const feedEnvelope = (
  envelope: PitchAttackEnvelope,
  samples: Float32Array,
  chunkSize = 240,
): number[] => {
  const readings: number[] = [];
  for (let offset = 0; offset < samples.length; offset += chunkSize) {
    const chunk = samples.subarray(offset, Math.min(offset + chunkSize, samples.length));
    envelope.pushSamples(chunk);
    readings.push(envelope.computeAttackDb({
      repeatPitchClassMask: 1 << (67 % 12),
      expectedPitchMidis: [67],
    }));
  }
  return readings;
};

describe('PitchAttackEnvelope', () => {
  it('G4 の 4 連バーストで包絡が 4 回立ち上がる', () => {
    const envelope = new PitchAttackEnvelope();
    const samples = synthesizeBurst(67, 35, 25, 4);
    const readings = feedEnvelope(envelope, samples);
    expect(readings.length).toBeGreaterThan(8);

    const maxReading = Math.max(...readings);
    const minReading = Math.min(...readings);
    expect(maxReading - minReading).toBeGreaterThan(8);
    expect(maxReading).toBeGreaterThan(-20);
  });

  it('広帯域ノイズでは G 帯域エネルギーが立ち上がらない', () => {
    const envelope = new PitchAttackEnvelope();
    const noise = new Float32Array(PITCH_ATTACK_ENVELOPE_WINDOW_SAMPLES);
    for (let index = 0; index < noise.length; index += 1) {
      noise[index] = (Math.random() * 2 - 1) * 0.02;
    }
    envelope.pushSamples(noise);
    const noiseDb = envelope.computeAttackDb({
      repeatPitchClassMask: 1 << (67 % 12),
      expectedPitchMidis: [67],
    });

    const toneEnvelope = new PitchAttackEnvelope();
    const tone = synthesizeBurst(67, 40, 0, 1);
    feedEnvelope(toneEnvelope, tone);
    const toneDb = toneEnvelope.computeAttackDb({
      repeatPitchClassMask: 1 << (67 % 12),
      expectedPitchMidis: [67],
    });
    expect(toneDb - noiseDb).toBeGreaterThan(8);
  });
});
