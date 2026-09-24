/** 5ms フレーム × 12 秒 */
export const PITCH_FRAME_TRACE_CAPACITY = 2400;

export interface PitchFrameTraceEntry {
  frameIndex: number;
  prediction: number;
  confidence: number;
  volumeDb: number;
  attackDb: number;
  expectedMask: number;
  repeatMask: number;
  currentNote: number;
  event: string | null;
}

export class PitchFrameTraceBuffer {
  private readonly entries: PitchFrameTraceEntry[];
  private writeIndex = 0;
  private count = 0;

  constructor(capacity = PITCH_FRAME_TRACE_CAPACITY) {
    this.entries = Array.from({ length: capacity }, () => ({
      frameIndex: 0,
      prediction: 0,
      confidence: 0,
      volumeDb: -120,
      attackDb: -120,
      expectedMask: 0,
      repeatMask: 0,
      currentNote: -1,
      event: null,
    }));
  }

  reset(): void {
    this.writeIndex = 0;
    this.count = 0;
  }

  record(entry: PitchFrameTraceEntry): void {
    this.entries[this.writeIndex] = entry;
    this.writeIndex = (this.writeIndex + 1) % this.entries.length;
    this.count = Math.min(this.entries.length, this.count + 1);
  }

  snapshot(): PitchFrameTraceEntry[] {
    if (this.count === 0) {
      return [];
    }
    const result: PitchFrameTraceEntry[] = [];
    const start = this.count < this.entries.length
      ? 0
      : this.writeIndex;
    for (let index = 0; index < this.count; index += 1) {
      result.push(this.entries[(start + index) % this.entries.length]);
    }
    return result;
  }
}

let activeTraceBuffer: PitchFrameTraceBuffer | null = null;

export const ensurePitchFrameTraceBuffer = (): PitchFrameTraceBuffer => {
  if (!activeTraceBuffer) {
    activeTraceBuffer = new PitchFrameTraceBuffer();
  }
  return activeTraceBuffer;
};

export const resetPitchFrameTraceBuffer = (): void => {
  activeTraceBuffer?.reset();
};

export const downloadPitchFrameTraceEntries = (entries: PitchFrameTraceEntry[]): void => {
  if (typeof document === 'undefined') {
    return;
  }
  const payload = JSON.stringify({
    capturedAt: new Date().toISOString(),
    frameDurationMs: 5,
    entries,
  });
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pitch-frame-trace-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadPitchFrameTrace = (): void => {
  if (!activeTraceBuffer) {
    return;
  }
  downloadPitchFrameTraceEntries(activeTraceBuffer.snapshot());
};
