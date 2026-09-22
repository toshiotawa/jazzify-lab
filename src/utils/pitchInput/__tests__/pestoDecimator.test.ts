import {
  createPestoDecimatorState,
  feedPestoDecimator,
  resetPestoDecimator,
} from '@/utils/pitchInput/pestoDecimator';
import { PESTO_CHUNK_SIZE } from '@/utils/pitchInput/pitchInputTypes';

const makeSineChunk = (freq: number, sampleRate = 48_000): Float32Array => {
  const out = new Float32Array(PESTO_CHUNK_SIZE);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return out;
};

const zeroCrossings = (samples: Float32Array): number => {
  let count = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if ((samples[i - 1] <= 0 && samples[i] > 0) || (samples[i - 1] >= 0 && samples[i] < 0)) {
      count += 1;
    }
  }
  return count;
};

describe('pestoDecimator', () => {
  it('requires q chunks at q=2 before emitting 240 model samples', () => {
    const state = createPestoDecimatorState(2);
    expect(feedPestoDecimator(makeSineChunk(110), state)).toBeNull();
    const modelInput = feedPestoDecimator(makeSineChunk(110), state);
    expect(modelInput?.length).toBe(240);
  });

  it('increases zero-crossing rate approximately 2x at q=2', () => {
    const source = makeSineChunk(110);
    const state = createPestoDecimatorState(2);
    feedPestoDecimator(source, state);
    const modelInput = feedPestoDecimator(source, state);
    expect(modelInput).not.toBeNull();
    if (!modelInput) return;
    const sourceCrossings = zeroCrossings(source);
    const modelCrossings = zeroCrossings(modelInput);
    expect(modelCrossings).toBeGreaterThan(sourceCrossings * 1.5);
  });

  it('produces consistent output across chunk boundaries', () => {
    const stateA = createPestoDecimatorState(2);
    const stateB = createPestoDecimatorState(2);
    const long = new Float32Array(PESTO_CHUNK_SIZE * 2);
    for (let i = 0; i < long.length; i += 1) {
      long[i] = Math.sin((2 * Math.PI * 130 * i) / 48_000);
    }

    feedPestoDecimator(long.subarray(0, PESTO_CHUNK_SIZE), stateA);
    const batchOut = feedPestoDecimator(long, stateB);
    const splitFinal = feedPestoDecimator(long.subarray(PESTO_CHUNK_SIZE), stateA);
    expect(splitFinal).not.toBeNull();
    expect(batchOut).not.toBeNull();
    if (!splitFinal || !batchOut) return;
    for (let i = 0; i < 240; i += 1) {
      expect(splitFinal[i]).toBeCloseTo(batchOut[i], 2);
    }
  });

  it('resets filter state', () => {
    const state = createPestoDecimatorState(2);
    feedPestoDecimator(makeSineChunk(100), state);
    resetPestoDecimator(state);
    expect(feedPestoDecimator(makeSineChunk(100), state)).toBeNull();
  });
});
