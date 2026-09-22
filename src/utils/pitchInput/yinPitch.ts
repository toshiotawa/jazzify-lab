/**
 * yinPitch - 低音向け YIN（累積平均正規化差分）F0 推定。
 * Web / iOS で同一係数・同一探索帯域を使う。
 */

import type { PitchOnsetTrackerConfig } from '@/utils/pitchInput/pitchOnsetTracker';
import {
  PITCH_SAMPLE_RATE,
  type VoiceLowPitchShift,
} from '@/utils/pitchInput/pitchOctaveUpsample';

export const YIN_WINDOW_SIZE = 4096;
export const YIN_HOP_SIZE = 480;
export const YIN_FRAME_SEC = YIN_HOP_SIZE / PITCH_SAMPLE_RATE;
export const YIN_THRESHOLD = 0.15;

export interface YinFrequencyRange {
  readonly minHz: number;
  readonly maxHz: number;
}

export interface YinAnalysisResult {
  readonly frequencyHz: number | null;
  readonly confidence: number;
  readonly volume: number;
}

export const yinFrequencyRangeForShift = (shift: VoiceLowPitchShift): YinFrequencyRange => {
  if (shift === 12) {
    return { minHz: 55, maxHz: 700 };
  }
  if (shift === 24) {
    return { minHz: 30, maxHz: 400 };
  }
  return { minHz: 80, maxHz: 700 };
};

export const usesYinPitchDetection = (shift: VoiceLowPitchShift): boolean => shift !== 0;

export const hzToMidi = (frequencyHz: number): number =>
  69 + (12 * Math.log2(frequencyHz / 440));

export const scaleOnsetConfigForYin = (
  config: PitchOnsetTrackerConfig,
): PitchOnsetTrackerConfig => {
  const halve = (value: number): number => Math.max(1, Math.round(value / 2));
  return {
    ...config,
    pitchStableFrames: halve(config.pitchStableFrames),
    releaseFrames: halve(config.releaseFrames),
    minNoteFrames: halve(config.minNoteFrames),
    retriggerGuardFrames: halve(config.retriggerGuardFrames),
    retriggerLookbackFrames: halve(config.retriggerLookbackFrames),
  };
};

const computeRms = (window: Float32Array): number => {
  let sum = 0;
  for (let index = 0; index < window.length; index += 1) {
    const sample = window[index] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / window.length);
};

const parabolicInterpolation = (
  cmndf: Float64Array,
  tau: number,
): number => {
  if (tau <= 0 || tau >= cmndf.length - 1) {
    return tau;
  }
  const s0 = cmndf[tau - 1] ?? 0;
  const s1 = cmndf[tau] ?? 0;
  const s2 = cmndf[tau + 1] ?? 0;
  const denominator = 2 * s1 - s2 - s0;
  if (denominator === 0) {
    return tau;
  }
  return tau + (s2 - s0) / (2 * denominator);
};

export const analyzeYinWindow = (
  window: Float32Array,
  sampleRate: number,
  range: YinFrequencyRange,
  threshold = YIN_THRESHOLD,
): YinAnalysisResult => {
  const volume = computeRms(window);
  if (volume < 1e-6) {
    return { frequencyHz: null, confidence: 0, volume };
  }

  const minPeriod = Math.max(2, Math.floor(sampleRate / range.maxHz));
  const maxPeriod = Math.min(
    window.length - 1,
    Math.ceil(sampleRate / range.minHz),
  );
  if (minPeriod >= maxPeriod) {
    return { frequencyHz: null, confidence: 0, volume };
  }

  const difference = new Float64Array(maxPeriod + 1);
  for (let tau = 1; tau <= maxPeriod; tau += 1) {
    let sum = 0;
    for (let index = 0; index < window.length - tau; index += 1) {
      const delta = (window[index] ?? 0) - (window[index + tau] ?? 0);
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  const cmndf = new Float64Array(maxPeriod + 1);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxPeriod; tau += 1) {
    runningSum += difference[tau] ?? 0;
    cmndf[tau] = runningSum > 0 ? ((difference[tau] ?? 0) * tau) / runningSum : 1;
  }

  let bestTau = -1;
  let bestValue = 1;
  for (let tau = minPeriod; tau <= maxPeriod; tau += 1) {
    const value = cmndf[tau] ?? 1;
    if (value >= threshold) {
      continue;
    }
    while (tau + 1 <= maxPeriod && (cmndf[tau + 1] ?? 1) < value) {
      tau += 1;
    }
    bestTau = tau;
    bestValue = cmndf[tau] ?? 1;
    break;
  }

  if (bestTau < 0) {
    for (let tau = minPeriod; tau <= maxPeriod; tau += 1) {
      const value = cmndf[tau] ?? 1;
      if (value < bestValue) {
        bestValue = value;
        bestTau = tau;
      }
    }
  }

  if (bestTau <= 0 || bestValue >= 0.4) {
    return { frequencyHz: null, confidence: 0, volume };
  }

  const refinedTau = parabolicInterpolation(cmndf, bestTau);
  const frequencyHz = sampleRate / refinedTau;
  if (!Number.isFinite(frequencyHz) || frequencyHz < range.minHz || frequencyHz > range.maxHz) {
    return { frequencyHz: null, confidence: 0, volume };
  }

  const confidence = Math.max(0, Math.min(1, 1 - bestValue));
  return { frequencyHz, confidence, volume };
};

export class YinPitchProcessor {
  private readonly windowSize = YIN_WINDOW_SIZE;
  private readonly hopSize = YIN_HOP_SIZE;
  private readonly ring = new Float32Array(YIN_WINDOW_SIZE);
  private ringWriteIndex = 0;
  private filledSamples = 0;
  private samplesSinceHop = 0;
  private shift: VoiceLowPitchShift = 0;

  reset(): void {
    this.ring.fill(0);
    this.ringWriteIndex = 0;
    this.filledSamples = 0;
    this.samplesSinceHop = 0;
  }

  setShift(shift: VoiceLowPitchShift): void {
    if (shift === this.shift) {
      return;
    }
    this.shift = shift;
    this.reset();
  }

  push(samples: Float32Array): YinAnalysisResult[] {
    const results: YinAnalysisResult[] = [];
    const range = yinFrequencyRangeForShift(this.shift);

    for (let index = 0; index < samples.length; index += 1) {
      this.ring[this.ringWriteIndex] = samples[index] ?? 0;
      this.ringWriteIndex = (this.ringWriteIndex + 1) % this.windowSize;
      if (this.filledSamples < this.windowSize) {
        this.filledSamples += 1;
      }

      this.samplesSinceHop += 1;
      if (this.samplesSinceHop < this.hopSize || this.filledSamples < this.windowSize) {
        continue;
      }
      this.samplesSinceHop = 0;

      const window = new Float32Array(this.windowSize);
      let readIndex = this.ringWriteIndex;
      for (let offset = 0; offset < this.windowSize; offset += 1) {
        window[offset] = this.ring[readIndex] ?? 0;
        readIndex = (readIndex + 1) % this.windowSize;
      }
      results.push(analyzeYinWindow(window, PITCH_SAMPLE_RATE, range));
    }

    return results;
  }
}
