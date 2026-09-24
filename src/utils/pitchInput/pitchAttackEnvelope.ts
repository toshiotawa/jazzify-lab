/** 48kHz 直近窓の Goertzel 包絡。同音連打の再発音検出用。 */
export const PITCH_ATTACK_ENVELOPE_WINDOW_SAMPLES = 1024;
export const PITCH_ATTACK_SAMPLE_RATE = 48_000;

const MIN_ENERGY = 1e-12;

const midiToHz = (midi: number): number => (
  440 * Math.pow(2, (midi - 69) / 12)
);

const energyToDb = (energy: number): number => (
  10 * Math.log10(Math.max(energy, MIN_ENERGY))
);

const pitchClassFromMidi = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12;

const buildHannWindow = (size: number): Float32Array => {
  const window = new Float32Array(size);
  if (size <= 1) {
    window[0] = 1;
    return window;
  }
  for (let index = 0; index < size; index += 1) {
    window[index] = 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)));
  }
  return window;
};

const goertzelEnergy = (
  samples: Float32Array,
  window: Float32Array,
  sampleCount: number,
  targetHz: number,
): number => {
  const normalizedHz = targetHz * sampleCount / PITCH_ATTACK_SAMPLE_RATE;
  const k = Math.round(normalizedHz);
  const w = (2 * Math.PI * k) / sampleCount;
  const coeff = 2 * Math.cos(w);
  let sPrev = 0;
  let sPrev2 = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = samples[index] * window[index];
    const s = sample + coeff * sPrev - sPrev2;
    sPrev2 = sPrev;
    sPrev = s;
  }
  const real = sPrev - sPrev2 * Math.cos(w);
  const imag = sPrev2 * Math.sin(w);
  return (real * real + imag * imag) / sampleCount;
};

const computeWindowRmsEnergy = (
  samples: Float32Array,
  window: Float32Array,
  sampleCount: number,
): number => {
  let sumSq = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = samples[index] * window[index];
    sumSq += sample * sample;
  }
  return sumSq / Math.max(1, sampleCount);
};

export interface PitchAttackEnvelopeTargets {
  repeatPitchClassMask: number;
  expectedPitchMidis: readonly number[];
}

export class PitchAttackEnvelope {
  private readonly ring: Float32Array;
  private readonly hannWindow: Float32Array;
  private readonly orderedScratch: Float32Array;
  private writeIndex = 0;
  private filled = 0;

  constructor(
    windowSamples = PITCH_ATTACK_ENVELOPE_WINDOW_SAMPLES,
  ) {
    this.ring = new Float32Array(windowSamples);
    this.hannWindow = buildHannWindow(windowSamples);
    this.orderedScratch = new Float32Array(windowSamples);
  }

  reset(): void {
    this.ring.fill(0);
    this.writeIndex = 0;
    this.filled = 0;
  }

  pushSamples(samples: Float32Array): void {
    for (let index = 0; index < samples.length; index += 1) {
      this.ring[this.writeIndex] = samples[index];
      this.writeIndex = (this.writeIndex + 1) % this.ring.length;
      this.filled = Math.min(this.ring.length, this.filled + 1);
    }
  }

  computeAttackDb(targets: PitchAttackEnvelopeTargets): number {
    const sampleCount = this.filled;
    if (sampleCount <= 0) {
      return -120;
    }

    const ordered = this.orderedWindow(sampleCount);
    const targetMidis = this.resolveTargetMidis(targets);
    if (targetMidis.length === 0) {
      return energyToDb(computeWindowRmsEnergy(ordered, this.hannWindow, sampleCount));
    }

    let combinedEnergy = 0;
    for (const midi of targetMidis) {
      const fundamentalHz = midiToHz(midi);
      combinedEnergy += goertzelEnergy(ordered, this.hannWindow, sampleCount, fundamentalHz);
      combinedEnergy += goertzelEnergy(ordered, this.hannWindow, sampleCount, fundamentalHz * 2) * 0.5;
    }
    return energyToDb(combinedEnergy / targetMidis.length);
  }

  private orderedWindow(sampleCount: number): Float32Array {
    const start = this.filled < this.ring.length
      ? 0
      : this.writeIndex;
    for (let index = 0; index < sampleCount; index += 1) {
      this.orderedScratch[index] = this.ring[(start + index) % this.ring.length];
    }
    return this.orderedScratch;
  }

  private resolveTargetMidis(targets: PitchAttackEnvelopeTargets): number[] {
    const repeatMidis: number[] = [];
    if (targets.repeatPitchClassMask !== 0) {
      for (const midi of targets.expectedPitchMidis) {
        const pitchClass = pitchClassFromMidi(midi);
        if ((targets.repeatPitchClassMask & (1 << pitchClass)) !== 0) {
          repeatMidis.push(Math.round(midi));
        }
      }
    }
    if (repeatMidis.length > 0) {
      return repeatMidis;
    }
    if (targets.expectedPitchMidis.length > 0) {
      return targets.expectedPitchMidis.map((midi) => Math.round(midi));
    }
    return [];
  }
}
