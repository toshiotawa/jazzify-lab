import { PitchDetector } from 'pitchy';
import type { PitchFrame } from './pitchOnsetTracker';
import { PESTO_TARGET_SAMPLE_RATE } from './pitchInputTypes';

export const PITCHY_WINDOW_SIZE = 4096;
export const PITCHY_MODEL_ID = 'pitchy-4.1.0-mpm-4096-48000';

/** Worker専用。検出器とPCM窓は接続時に確保し、5msの入力ごとに再利用する。 */
export class PitchyEstimator {
  private readonly detector = PitchDetector.forFloat32Array(PITCHY_WINDOW_SIZE);
  private readonly samples = new Float32Array(PITCHY_WINDOW_SIZE);
  private readonly frame: PitchFrame = { prediction: 0, confidence: 0, volume: 0 };
  private filled = 0;

  reset(): void {
    this.samples.fill(0);
    this.filled = 0;
    this.frame.prediction = 0;
    this.frame.confidence = 0;
    this.frame.volume = 0;
  }

  push(input: Float32Array): void {
    this.samples.copyWithin(0, input.length);
    this.samples.set(input, this.samples.length - input.length);
    this.filled = Math.min(this.samples.length, this.filled + input.length);
    // 最新チャンクのエネルギーで離鍵を判定し、85ms窓の残響でnoteOffを遅らせない。
    let energy = 0;
    for (let i = 0; i < input.length; i += 1) energy += input[i] * input[i];
    this.frame.volume = energy / input.length;
  }

  estimate(): PitchFrame {
    this.frame.prediction = 0;
    this.frame.confidence = 0;
    if (this.filled < this.samples.length || this.frame.volume < 1e-12) return this.frame;
    const [frequency, clarity] = this.detector.findPitch(this.samples, PESTO_TARGET_SAMPLE_RATE);
    const midi = 69 + 12 * Math.log2(frequency / 440);
    if (frequency >= 2 * PESTO_TARGET_SAMPLE_RATE / PITCHY_WINDOW_SIZE && Number.isFinite(midi) && midi >= 0 && midi <= 127 && Number.isFinite(clarity)) {
      this.frame.prediction = midi;
      // MPMの周期性指標。PESTOのconfidenceと同じ確率を意味するものではない。
      this.frame.confidence = Math.max(0, Math.min(1, clarity));
    }
    return this.frame;
  }
}
