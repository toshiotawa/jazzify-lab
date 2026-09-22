import {
  YIN_WINDOW_SIZE,
  YinPitchProcessor,
  analyzeYinWindow,
  hzToMidi,
  yinFrequencyRangeForShift,
} from '@/utils/pitchInput/yinPitch';
import { PITCH_SAMPLE_RATE } from '@/utils/pitchInput/pitchOctaveUpsample';

const generateSine = (frequencyHz: number, sampleCount: number, amplitude = 0.5): Float32Array => {
  const samples = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / PITCH_SAMPLE_RATE);
  }
  return samples;
};

const buildOrderedWindow = (frequencyHz: number): Float32Array =>
  generateSine(frequencyHz, YIN_WINDOW_SIZE);

describe('yinPitch', () => {
  it('detects E1 at 41.2 Hz as MIDI 28', () => {
    const window = buildOrderedWindow(41.2);
    const result = analyzeYinWindow(window, PITCH_SAMPLE_RATE, yinFrequencyRangeForShift(24));
    expect(result.frequencyHz).not.toBeNull();
    expect(hzToMidi(result.frequencyHz ?? 0)).toBeCloseTo(28, 0);
  });

  it('detects G2 at 98 Hz as MIDI 43', () => {
    const window = buildOrderedWindow(98);
    const result = analyzeYinWindow(window, PITCH_SAMPLE_RATE, yinFrequencyRangeForShift(12));
    expect(result.frequencyHz).not.toBeNull();
    expect(hzToMidi(result.frequencyHz ?? 0)).toBeCloseTo(43, 0);
  });

  it('returns no candidate for silence', () => {
    const window = new Float32Array(YIN_WINDOW_SIZE);
    const result = analyzeYinWindow(window, PITCH_SAMPLE_RATE, yinFrequencyRangeForShift(24));
    expect(result.frequencyHz).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('emits analysis every 10 ms once the window is full', () => {
    const processor = new YinPitchProcessor();
    processor.setShift(24);
    const warmup = generateSine(55, YIN_WINDOW_SIZE + 480);
    const results = processor.push(warmup);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.frequencyHz).not.toBeNull();
  });
});
