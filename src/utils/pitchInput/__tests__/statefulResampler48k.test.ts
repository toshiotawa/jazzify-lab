import {
  createResampler48kState,
  resampleTo48kBatch,
  resampleTo48kStateful,
} from '@/utils/pitchInput/statefulResampler48k';

const makeSine = (length: number, rate: number, freq: number): Float32Array => {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    out[i] = Math.sin((2 * Math.PI * freq * i) / rate);
  }
  return out;
};

const resampleSplit = (input: Float32Array, inputRate: number, split: number): Float32Array => {
  const reference = resampleTo48kBatch(input, inputRate);
  const state = createResampler48kState(inputRate);
  const output = new Float32Array(reference.length + split);
  let written = 0;
  for (let offset = 0; offset < input.length; offset += split) {
    const chunk = input.subarray(offset, Math.min(offset + split, input.length));
    written += resampleTo48kStateful(chunk, output, written, state);
  }
  return output.subarray(0, written);
};

describe('statefulResampler48k', () => {
  it('matches batch resampling for a single chunk', () => {
    const inputRate = 44_100;
    const input = makeSine(44_100, inputRate, 440);
    const reference = resampleTo48kBatch(input, inputRate);
    const splitOut = resampleSplit(input, inputRate, input.length);
    expect(splitOut.length).toBe(reference.length);
    for (let i = 0; i < reference.length; i += 1) {
      expect(splitOut[i]).toBeCloseTo(reference[i], 5);
    }
  });

  it('keeps approximate length across split boundaries', () => {
    const inputRate = 44_100;
    const input = makeSine(44_100, inputRate, 440);
    const reference = resampleTo48kBatch(input, inputRate);
    for (const split of [64, 128, 256, 512, 1000]) {
      const splitOut = resampleSplit(input, inputRate, split);
      expect(Math.abs(splitOut.length - reference.length)).toBeLessThanOrEqual(2);
      let maxDiff = 0;
      const compareLen = Math.min(reference.length, splitOut.length);
      for (let i = 0; i < compareLen; i += 1) {
        maxDiff = Math.max(maxDiff, Math.abs(reference[i] - splitOut[i]));
      }
      expect(maxDiff).toBeLessThan(0.1);
    }
  });

  it('passes through 48kHz input unchanged', () => {
    const input = makeSine(480, 48_000, 220);
    const state = createResampler48kState(48_000);
    const output = new Float32Array(input.length);
    const written = resampleTo48kStateful(input, output, 0, state);
    expect(written).toBe(input.length);
    expect(Array.from(output)).toEqual(Array.from(input));
  });
});
