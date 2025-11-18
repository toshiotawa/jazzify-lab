export const DEFAULT_MAX_SHARED_NOTES = 1024;
export const NOTE_STRIDE = 8;
export const CONTROL_BUFFER_LENGTH = 8;
export const CLOCK_BUFFER_LENGTH = 4;

export enum ControlIndex {
  FrameId = 0,
  ActiveCount = 1,
  Flags = 2,
}

export enum ControlFlag {
  None = 0,
  Dirty = 1 << 0,
}

export enum SharedNoteField {
  Id = 0,
  Pitch = 1,
  StartTime = 2,
  TargetTime = 3,
  Y = 4,
  State = 5,
  Velocity = 6,
  Spare = 7,
}

export enum SharedNoteState {
  Hidden = 0,
  Visible = 1,
  Hit = 2,
  Missed = 3,
}

export enum ClockIndex {
  AudioTimeNs = 0,
  LogicalTimeNs = 1,
  LatencyNs = 2,
  Reserved = 3,
}

export interface LegendSharedMemoryBuffers {
  control: SharedArrayBuffer;
  notes: SharedArrayBuffer;
  clock: SharedArrayBuffer;
  maxNotes: number;
  noteStride: number;
}

export interface LegendSharedMemoryViews {
  control: Int32Array;
  notes: Float32Array;
  clock: BigInt64Array;
  maxNotes: number;
  noteStride: number;
}

export const createLegendSharedMemory = (
  maxNotes: number = DEFAULT_MAX_SHARED_NOTES
): { buffers: LegendSharedMemoryBuffers; views: LegendSharedMemoryViews } => {
  const control = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * CONTROL_BUFFER_LENGTH);
  const notes = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * maxNotes * NOTE_STRIDE);
  const clock = new SharedArrayBuffer(BigInt64Array.BYTES_PER_ELEMENT * CLOCK_BUFFER_LENGTH);

  const views = {
    control: new Int32Array(control),
    notes: new Float32Array(notes),
    clock: new BigInt64Array(clock),
    maxNotes,
    noteStride: NOTE_STRIDE,
  } satisfies LegendSharedMemoryViews;

  return {
    buffers: {
      control,
      notes,
      clock,
      maxNotes,
      noteStride: NOTE_STRIDE,
    },
    views,
  };
};

export const createLegendSharedMemoryViews = (
  buffers: LegendSharedMemoryBuffers
): LegendSharedMemoryViews => {
  return {
    control: new Int32Array(buffers.control),
    notes: new Float32Array(buffers.notes),
    clock: new BigInt64Array(buffers.clock),
    maxNotes: buffers.maxNotes,
    noteStride: buffers.noteStride,
  };
};

export const encodeTimeNs = (seconds: number): bigint => {
  return BigInt(Math.round(seconds * 1_000_000_000));
};

export const decodeTimeNs = (nanoseconds: bigint): number => {
  return Number(nanoseconds) / 1_000_000_000;
};

export const markFrameReady = (control: Int32Array, frameId: number, activeCount: number): void => {
  Atomics.store(control, ControlIndex.ActiveCount, activeCount);
  Atomics.store(control, ControlIndex.FrameId, frameId);
};

export const readFrameId = (control: Int32Array): number => Atomics.load(control, ControlIndex.FrameId);
export const readActiveCount = (control: Int32Array): number => Atomics.load(control, ControlIndex.ActiveCount);

export const writeClockValue = (clock: BigInt64Array, index: ClockIndex, seconds: number): void => {
  Atomics.store(clock, index, encodeTimeNs(seconds));
};

export const readClockValue = (clock: BigInt64Array, index: ClockIndex): number => {
  const raw = Atomics.load(clock, index);
  return decodeTimeNs(raw);
};

