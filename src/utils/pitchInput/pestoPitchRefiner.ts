const SEMITONE_RATIO = 2 ** (1 / 12);

/** Reuses the model's PCM history; no extra inference, buffering or hot-path allocation. */
export class PestoPitchRefiner {
  private anchor = 0;
  private previousMidi = 0;
  private stableSamples = 0;
  private correction = 0;

  reset(): void {
    this.anchor = 0;
    this.previousMidi = 0;
    this.stableSamples = 0;
    this.correction = 0;
  }

  refine(samples: Float32Array, midi: number, elapsedSamples: number, confidence = 1): number {
    // 0.28 is the lowest supported tracker threshold (sensitivity 10).
    if (!Number.isFinite(midi) || midi < 24 || midi > 96 || !Number.isFinite(confidence) || confidence < 0.28
      || !Number.isInteger(elapsedSamples) || elapsedSamples <= 0 || elapsedSamples > samples.length) {
      this.reset();
      return midi;
    }
    if (Math.abs(midi - this.previousMidi) > 0.5) this.reset();
    this.previousMidi = midi;
    if (this.correction === 0 && Math.abs(midi - this.anchor) > 0.5) {
      this.anchor = midi;
      this.stableSamples = elapsedSamples;
    } else {
      this.stableSamples = Math.min(4800, this.stableSamples + elapsedSamples);
    }
    // Start only near ambiguous rounding boundaries; do not delay baseline attack detection.
    if (this.stableSamples < 4800 || (this.correction === 0 && Math.abs(midi - Math.round(midi)) <= 0.25)) return midi;
    const period = 48000 / (440 * 2 ** ((midi - 69) / 12));
    const low = Math.floor(period / SEMITONE_RATIO);
    const high = Math.ceil(period * SEMITONE_RATIO);
    const length = Math.max(192, Math.round(2 * period));
    if (length + high + 1 > samples.length) return midi;
    let recentEnergy = 0;
    for (let i = samples.length - elapsedSamples; i < samples.length; i += 1) recentEnergy += samples[i] * samples[i];
    // Preserve an established correction during the model's release tail, until voicing drops.
    if (!(recentEnergy / elapsedSamples > 1e-6)) return midi + this.correction;
    const start = samples.length - length;
    let sum = 0;
    let sumSquares = 0;
    for (let i = start; i < samples.length; i += 1) {
      sum += samples[i];
      sumSquares += samples[i] * samples[i];
    }
    const energy = sumSquares - sum * sum / length;
    if (!(energy / length > 1e-6)) return midi + this.correction;
    const originalCorrelation = this.correlation(samples, start, length, Math.round(period), sum, energy);
    const step = Math.max(1, Math.floor((high - low) / 24));
    let peak = low;
    let best = -1;
    for (let lag = low; lag <= high; lag += step) {
      const value = this.correlation(samples, start, length, lag, sum, energy);
      if (value > best) { best = value; peak = lag; }
    }
    const first = Math.max(low, peak - step);
    const last = Math.min(high, peak + step);
    for (let lag = first; lag <= last; lag += 1) {
      const value = this.correlation(samples, start, length, lag, sum, energy);
      if (value > best) { best = value; peak = lag; }
    }
    if (peak > low && peak < high && best >= 0.95 && best - originalCorrelation >= 0.02) {
      const left = this.correlation(samples, start, length, peak - 1, sum, energy);
      const right = this.correlation(samples, start, length, peak + 1, sum, energy);
      const curvature = left - 2 * best + right;
      const lag = peak + 0.5 * (left - right) / curvature;
      const refined = 69 + 12 * Math.log2(48000 / (440 * lag));
      if (curvature < 0 && Number.isFinite(refined) && Math.abs(refined - midi) <= 0.75) {
        this.correction = refined - midi;
        return refined;
      }
    }
    // A temporary periodicity dip must not alternate a held note with its old model error.
    // Release the correction when the waveform actually supports the model pitch again.
    if (originalCorrelation >= 0.95) this.correction = 0;
    return midi + this.correction;
  }

  private correlation(samples: Float32Array, start: number, length: number, lag: number, sum: number, energy: number): number {
    let delayedSum = 0;
    let delayedSquares = 0;
    let product = 0;
    for (let i = start; i < samples.length; i += 1) {
      const delayed = samples[i - lag];
      delayedSum += delayed;
      delayedSquares += delayed * delayed;
      product += samples[i] * delayed;
    }
    const delayedEnergy = delayedSquares - delayedSum * delayedSum / length;
    return (product - sum * delayedSum / length) / Math.sqrt(Math.max(1e-30, energy * delayedEnergy));
  }
}
