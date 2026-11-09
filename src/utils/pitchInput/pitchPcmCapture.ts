export const PITCH_PCM_CAPTURE_SAMPLE_RATE = 48_000;

export const PITCH_PCM_CAPTURE_CAPACITY_SAMPLES = PITCH_PCM_CAPTURE_SAMPLE_RATE * 60;

const floatToInt16 = (value: number): number => {
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.round(clamped * 32767);
};

export interface PitchPcmCaptureSnapshot {
  samples: Int16Array;
  endSourceSample: number;
  endSourceTimeSec: number;
  totalWritten: number;
}

export class PitchPcmCaptureRing {
  private readonly buffer = new Int16Array(PITCH_PCM_CAPTURE_CAPACITY_SAMPLES);

  private writePos = 0;

  private lastSourceEndSample: number | null = null;

  private endSourceSample = 0;

  private endSourceTimeSec = 0;

  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  reset(): void {
    this.writePos = 0;
    this.lastSourceEndSample = null;
    this.endSourceSample = 0;
    this.endSourceTimeSec = 0;
  }

  private appendZeros(count: number): void {
    const capped = Math.min(count, PITCH_PCM_CAPTURE_CAPACITY_SAMPLES - this.writePos);
    for (let index = 0; index < capped; index += 1) {
      this.buffer[this.writePos] = 0;
      this.writePos += 1;
    }
  }

  write(
    samples: Float32Array,
    sourceStartSample: number,
    sourceEndSample: number,
    sourceEndTimeSec: number,
  ): void {
    if (!this.enabled) {
      return;
    }
    if (
      this.lastSourceEndSample !== null
      && sourceStartSample > this.lastSourceEndSample
    ) {
      this.appendZeros(sourceStartSample - this.lastSourceEndSample);
    }
    for (let index = 0; index < samples.length; index += 1) {
      if (this.writePos >= PITCH_PCM_CAPTURE_CAPACITY_SAMPLES) {
        break;
      }
      this.buffer[this.writePos] = floatToInt16(samples[index]);
      this.writePos += 1;
    }
    this.lastSourceEndSample = sourceEndSample;
    this.endSourceSample = sourceEndSample;
    this.endSourceTimeSec = sourceEndTimeSec;
  }

  snapshot(): PitchPcmCaptureSnapshot {
    return {
      samples: this.buffer.subarray(0, this.writePos),
      endSourceSample: this.endSourceSample,
      endSourceTimeSec: this.endSourceTimeSec,
      totalWritten: this.writePos,
    };
  }
}
