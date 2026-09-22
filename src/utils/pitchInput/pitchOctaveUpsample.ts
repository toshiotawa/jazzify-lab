/**
 * pitchOctaveUpsample - 低音向けにマイク信号を stateful ローパス + 間引きで音高を上げる。
 * PESTO 推論直前に 240 サンプル単位で使う。
 */

import type { PitchOnsetTrackerConfig } from '@/utils/pitchInput/pitchOnsetTracker';

export type VoiceLowPitchShift = 0 | 12 | 24;

export const PITCH_CHUNK_SIZE = 240;
export const PITCH_SAMPLE_RATE = 48_000;

const FIR_TAPS = 31;

export const normalizeVoiceLowPitchShift = (value: unknown): VoiceLowPitchShift => {
  if (value === 12 || value === 24) return value;
  return 0;
};

export const decimationFactorFromShift = (shift: VoiceLowPitchShift): 1 | 2 | 4 => {
  if (shift === 12) return 2;
  if (shift === 24) return 4;
  return 1;
};

export const pitchShiftSemitonesFromShift = (shift: VoiceLowPitchShift): number => shift;

export const frameSecFromShift = (shift: VoiceLowPitchShift): number =>
  (PITCH_CHUNK_SIZE * decimationFactorFromShift(shift)) / PITCH_SAMPLE_RATE;

export const scaleOnsetConfigForDecimation = (
  config: PitchOnsetTrackerConfig,
  factor: 1 | 2 | 4,
): PitchOnsetTrackerConfig => {
  if (factor === 1) return config;
  const divide = (value: number): number => Math.max(1, Math.round(value / factor));
  return {
    ...config,
    pitchStableFrames: divide(config.pitchStableFrames),
    releaseFrames: divide(config.releaseFrames),
    minNoteFrames: divide(config.minNoteFrames),
    retriggerGuardFrames: divide(config.retriggerGuardFrames),
    retriggerLookbackFrames: divide(config.retriggerLookbackFrames),
  };
};

const buildLowpassCoefficients = (cutoffHz: number): Float32Array => {
  const coeffs = new Float32Array(FIR_TAPS);
  const normalizedCutoff = cutoffHz / PITCH_SAMPLE_RATE;
  const lastTap = FIR_TAPS - 1;
  const center = lastTap / 2;
  let sum = 0;

  for (let tap = 0; tap < FIR_TAPS; tap += 1) {
    const offset = tap - center;
    const sinc =
      offset === 0
        ? 2 * normalizedCutoff
        : Math.sin(2 * Math.PI * normalizedCutoff * offset) / (Math.PI * offset);
    const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * tap) / lastTap);
    coeffs[tap] = sinc * window;
    sum += coeffs[tap];
  }

  for (let tap = 0; tap < FIR_TAPS; tap += 1) {
    coeffs[tap] /= sum;
  }

  return coeffs;
};

const COEFFS_FACTOR_2 = buildLowpassCoefficients(10_000);
const COEFFS_FACTOR_4 = buildLowpassCoefficients(5_000);

export interface PitchUpsampleChunk {
  samples: Float32Array;
  audioContextTime: number;
}

export class PitchOctaveUpsampler {
  private factor: 1 | 2 | 4 = 1;
  private coeffs: Float32Array | null = null;
  private readonly delayLine = new Float32Array(FIR_TAPS);
  private delayWriteIndex = 0;
  private decimationCounter = 0;
  private readonly outputBuffer = new Float32Array(PITCH_CHUNK_SIZE);
  private outputWriteIndex = 0;

  reset(): void {
    this.delayLine.fill(0);
    this.delayWriteIndex = 0;
    this.decimationCounter = 0;
    this.outputWriteIndex = 0;
  }

  setShift(shift: VoiceLowPitchShift): void {
    const nextFactor = decimationFactorFromShift(shift);
    if (nextFactor === this.factor) return;
    this.factor = nextFactor;
    if (nextFactor === 1) {
      this.coeffs = null;
    } else if (nextFactor === 2) {
      this.coeffs = COEFFS_FACTOR_2;
    } else {
      this.coeffs = COEFFS_FACTOR_4;
    }
    this.reset();
  }

  getFactor(): 1 | 2 | 4 {
    return this.factor;
  }

  push(samples: Float32Array, audioContextTime: number): PitchUpsampleChunk[] {
    if (this.factor === 1) {
      return [{ samples, audioContextTime }];
    }

    const chunks: PitchUpsampleChunk[] = [];
    const coeffs = this.coeffs;
    if (!coeffs) return chunks;

    for (let index = 0; index < samples.length; index += 1) {
      const filtered = this.filterSample(samples[index] ?? 0, coeffs);
      this.decimationCounter += 1;
      if (this.decimationCounter < this.factor) continue;

      this.decimationCounter = 0;
      this.outputBuffer[this.outputWriteIndex] = filtered;
      this.outputWriteIndex += 1;
      if (this.outputWriteIndex < PITCH_CHUNK_SIZE) continue;

      const out = new Float32Array(PITCH_CHUNK_SIZE);
      out.set(this.outputBuffer);
      chunks.push({ samples: out, audioContextTime });
      this.outputWriteIndex = 0;
    }

    return chunks;
  }

  private filterSample(sample: number, coeffs: Float32Array): number {
    this.delayLine[this.delayWriteIndex] = sample;
    let acc = 0;
    let tapIndex = this.delayWriteIndex;

    for (let tap = 0; tap < FIR_TAPS; tap += 1) {
      acc += this.delayLine[tapIndex] * coeffs[tap];
      tapIndex = tapIndex === 0 ? FIR_TAPS - 1 : tapIndex - 1;
    }

    this.delayWriteIndex = (this.delayWriteIndex + 1) % FIR_TAPS;
    return acc;
  }
}
