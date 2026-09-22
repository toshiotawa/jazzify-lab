import {
  PitchOctaveUpsampler,
  PITCH_CHUNK_SIZE,
  PITCH_SAMPLE_RATE,
  decimationFactorFromShift,
  frameSecFromShift,
  normalizeVoiceLowPitchShift,
  scaleOnsetConfigForDecimation,
} from '@/utils/pitchInput/pitchOctaveUpsample';
import { DEFAULT_ONSET_CONFIG } from '@/utils/pitchInput/pitchOnsetTracker';

const generateSine = (frequencyHz: number, sampleCount: number): Float32Array => {
  const samples = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = Math.sin((2 * Math.PI * frequencyHz * index) / PITCH_SAMPLE_RATE);
  }
  return samples;
};

const estimateFrequencyHz = (samples: Float32Array): number => {
  let zeroCrossings = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const prev = samples[index - 1] ?? 0;
    const current = samples[index] ?? 0;
    if ((prev <= 0 && current > 0) || (prev >= 0 && current < 0)) {
      zeroCrossings += 1;
    }
  }
  return (zeroCrossings * PITCH_SAMPLE_RATE) / (2 * samples.length);
};

const collectUpsampled = (
  upsampler: PitchOctaveUpsampler,
  samples: Float32Array,
): Float32Array => {
  const output: number[] = [];
  const chunkSize = 512;
  for (let offset = 0; offset < samples.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, samples.length);
    const chunk = samples.subarray(offset, end);
    const emitted = upsampler.push(chunk, 0);
    for (const item of emitted) {
      for (let index = 0; index < item.samples.length; index += 1) {
        output.push(item.samples[index] ?? 0);
      }
    }
  }
  return Float32Array.from(output);
};

describe('pitchOctaveUpsample', () => {
  it('normalizes invalid shift values to 0', () => {
    expect(normalizeVoiceLowPitchShift(12)).toBe(12);
    expect(normalizeVoiceLowPitchShift(24)).toBe(24);
    expect(normalizeVoiceLowPitchShift(6)).toBe(0);
    expect(normalizeVoiceLowPitchShift('24')).toBe(0);
  });

  it('maps shift to decimation factor and frame duration', () => {
    expect(decimationFactorFromShift(0)).toBe(1);
    expect(decimationFactorFromShift(12)).toBe(2);
    expect(decimationFactorFromShift(24)).toBe(4);
    expect(frameSecFromShift(0)).toBeCloseTo(0.005);
    expect(frameSecFromShift(12)).toBeCloseTo(0.01);
    expect(frameSecFromShift(24)).toBeCloseTo(0.02);
  });

  it('scales onset frame counts for slower inference frames', () => {
    const scaled = scaleOnsetConfigForDecimation(DEFAULT_ONSET_CONFIG, 4);
    expect(scaled.pitchStableFrames).toBe(1);
    expect(scaled.releaseFrames).toBe(1);
    expect(scaled.minNoteFrames).toBe(2);
    expect(scaled.retriggerGuardFrames).toBe(2);
    expect(scaled.retriggerLookbackFrames).toBe(1);
  });

  it('passes through samples unchanged when shift is off', () => {
    const upsampler = new PitchOctaveUpsampler();
    upsampler.setShift(0);
    const input = new Float32Array([0.1, -0.2, 0.3]);
    const emitted = upsampler.push(input, 1.25);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.samples).toBe(input);
    expect(emitted[0]?.audioContextTime).toBe(1.25);
  });

  it('upsamples 500 Hz sine by factor 2 to about 1000 Hz', () => {
    const upsampler = new PitchOctaveUpsampler();
    upsampler.setShift(12);
    const input = generateSine(500, PITCH_CHUNK_SIZE * 8);
    const output = collectUpsampled(upsampler, input);
    expect(output.length).toBeGreaterThan(PITCH_CHUNK_SIZE);
    const estimated = estimateFrequencyHz(output.subarray(PITCH_CHUNK_SIZE));
    expect(estimated).toBeGreaterThan(900);
    expect(estimated).toBeLessThan(1100);
  });

  it('upsamples 500 Hz sine by factor 4 to about 2000 Hz', () => {
    const upsampler = new PitchOctaveUpsampler();
    upsampler.setShift(24);
    const input = generateSine(500, PITCH_CHUNK_SIZE * 16);
    const output = collectUpsampled(upsampler, input);
    expect(output.length).toBeGreaterThan(PITCH_CHUNK_SIZE);
    const estimated = estimateFrequencyHz(output.subarray(PITCH_CHUNK_SIZE));
    expect(estimated).toBeGreaterThan(1800);
    expect(estimated).toBeLessThan(2200);
  });

  it('preserves DC when decimating', () => {
    const upsampler = new PitchOctaveUpsampler();
    upsampler.setShift(12);
    const input = new Float32Array(PITCH_CHUNK_SIZE * 4).fill(0.25);
    const output = collectUpsampled(upsampler, input);
    const tail = output.subarray(output.length - PITCH_CHUNK_SIZE);
    const average = tail.reduce((sum, value) => sum + value, 0) / tail.length;
    expect(average).toBeCloseTo(0.25, 2);
  });

  it('matches chunked and single-pass processing', () => {
    const input = generateSine(440, PITCH_CHUNK_SIZE * 12);
    const single = new PitchOctaveUpsampler();
    single.setShift(12);
    const singleOutput = collectUpsampled(single, input);

    const chunked = new PitchOctaveUpsampler();
    chunked.setShift(12);
    const parts: number[] = [];
    for (let offset = 0; offset < input.length; offset += 37) {
      const end = Math.min(offset + 37, input.length);
      const emitted = chunked.push(input.subarray(offset, end), 0);
      for (const item of emitted) {
        parts.push(...item.samples);
      }
    }

    expect(parts.length).toBe(singleOutput.length);
    for (let index = 0; index < singleOutput.length; index += 1) {
      expect(parts[index]).toBeCloseTo(singleOutput[index] ?? 0, 5);
    }
  });
});
