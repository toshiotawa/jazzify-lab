/** 5ms フレーム × 60 秒 */
export const PITCH_FRAME_TRACE_CAPACITY = 12000;

/** @deprecated 列指向スナップショットを優先。ダウンロード互換用。 */
export interface PitchFrameTraceEntry {
  frameIndex: number;
  prediction: number;
  confidence: number;
  volumeDb: number;
  attackDb: number;
  rawLevelDb: number;
  expectedMask: number;
  repeatMask: number;
  currentNote: number;
  event: string | null;
}

export interface PitchFrameTraceColumns {
  frameIndex: number[];
  prediction: number[];
  confidence: number[];
  volumeDb: number[];
  attackDb: number[];
  rawLevelDb: number[];
  expectedMask: number[];
  repeatMask: number[];
  currentNote: number[];
  event: (string | null)[];
}

const emptyTraceColumns = (): PitchFrameTraceColumns => ({
  frameIndex: [],
  prediction: [],
  confidence: [],
  volumeDb: [],
  attackDb: [],
  rawLevelDb: [],
  expectedMask: [],
  repeatMask: [],
  currentNote: [],
  event: [],
});

export class PitchFrameTraceBuffer {
  private readonly capacity: number;
  private readonly frameIndex: number[];
  private readonly prediction: number[];
  private readonly confidence: number[];
  private readonly volumeDb: number[];
  private readonly attackDb: number[];
  private readonly rawLevelDb: number[];
  private readonly expectedMask: number[];
  private readonly repeatMask: number[];
  private readonly currentNote: number[];
  private readonly event: (string | null)[];
  private writeIndex = 0;
  private count = 0;

  constructor(capacity = PITCH_FRAME_TRACE_CAPACITY) {
    this.capacity = capacity;
    this.frameIndex = new Array(capacity);
    this.prediction = new Array(capacity);
    this.confidence = new Array(capacity);
    this.volumeDb = new Array(capacity);
    this.attackDb = new Array(capacity);
    this.rawLevelDb = new Array(capacity);
    this.expectedMask = new Array(capacity);
    this.repeatMask = new Array(capacity);
    this.currentNote = new Array(capacity);
    this.event = new Array(capacity);
  }

  reset(): void {
    this.writeIndex = 0;
    this.count = 0;
  }

  record(
    frameIndex: number,
    prediction: number,
    confidence: number,
    volumeDb: number,
    attackDb: number,
    rawLevelDb: number,
    expectedMask: number,
    repeatMask: number,
    currentNote: number,
    event: string | null,
  ): void {
    const slot = this.writeIndex;
    this.frameIndex[slot] = frameIndex;
    this.prediction[slot] = prediction;
    this.confidence[slot] = confidence;
    this.volumeDb[slot] = volumeDb;
    this.attackDb[slot] = attackDb;
    this.rawLevelDb[slot] = rawLevelDb;
    this.expectedMask[slot] = expectedMask;
    this.repeatMask[slot] = repeatMask;
    this.currentNote[slot] = currentNote;
    this.event[slot] = event;
    this.writeIndex = (slot + 1) % this.capacity;
    this.count = Math.min(this.capacity, this.count + 1);
  }

  snapshot(): PitchFrameTraceColumns {
    if (this.count === 0) {
      return emptyTraceColumns();
    }
    const cols = emptyTraceColumns();
    const start = this.count < this.capacity ? 0 : this.writeIndex;
    for (let index = 0; index < this.count; index += 1) {
      const slot = (start + index) % this.capacity;
      cols.frameIndex.push(this.frameIndex[slot] ?? 0);
      cols.prediction.push(this.prediction[slot] ?? 0);
      cols.confidence.push(this.confidence[slot] ?? 0);
      cols.volumeDb.push(this.volumeDb[slot] ?? -120);
      cols.attackDb.push(this.attackDb[slot] ?? -120);
      cols.rawLevelDb.push(this.rawLevelDb[slot] ?? -120);
      cols.expectedMask.push(this.expectedMask[slot] ?? 0);
      cols.repeatMask.push(this.repeatMask[slot] ?? 0);
      cols.currentNote.push(this.currentNote[slot] ?? -1);
      cols.event.push(this.event[slot] ?? null);
    }
    return cols;
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

const columnsToEntries = (columns: PitchFrameTraceColumns): PitchFrameTraceEntry[] => {
  const length = columns.frameIndex.length;
  const entries: PitchFrameTraceEntry[] = [];
  for (let index = 0; index < length; index += 1) {
    entries.push({
      frameIndex: columns.frameIndex[index] ?? 0,
      prediction: columns.prediction[index] ?? 0,
      confidence: columns.confidence[index] ?? 0,
      volumeDb: columns.volumeDb[index] ?? -120,
      attackDb: columns.attackDb[index] ?? -120,
      rawLevelDb: columns.rawLevelDb[index] ?? -120,
      expectedMask: columns.expectedMask[index] ?? 0,
      repeatMask: columns.repeatMask[index] ?? 0,
      currentNote: columns.currentNote[index] ?? -1,
      event: columns.event[index] ?? null,
    });
  }
  return entries;
};

export const downloadPitchFrameTraceEntries = (
  data: PitchFrameTraceColumns | PitchFrameTraceEntry[],
): void => {
  if (typeof document === 'undefined') {
    return;
  }
  const entries = Array.isArray(data) ? data : columnsToEntries(data);
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
