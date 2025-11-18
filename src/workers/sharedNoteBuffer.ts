import type { NoteData } from '@/types';

const HEADER_ENTRIES = 4;
const NOTE_STRIDE = 8;
const ACTIVE_COUNT_INDEX = 1;

export interface SharedNoteBufferConfig {
  maxNotes?: number;
}

export enum SharedNoteState {
  Empty = 0,
  Visible = 1,
  Hit = 2,
  Missed = 3,
  Completed = 4
}

export interface SharedNoteViews {
  buffer: SharedArrayBuffer;
  header: Int32Array;
  data: Float32Array;
  maxNotes: number;
}

export interface SharedNoteSnapshot {
  id: string;
  noteIndex: number;
  base: NoteData;
  pitch: number;
  time: number;
  y: number;
  previousY: number;
  velocity: number;
  state: SharedNoteState;
  noteName?: string;
}

const createViews = (buffer: SharedArrayBuffer, maxNotes: number): SharedNoteViews => {
  const headerBytes = HEADER_ENTRIES * Int32Array.BYTES_PER_ELEMENT;
  const header = new Int32Array(buffer, 0, HEADER_ENTRIES);
  const data = new Float32Array(buffer, headerBytes, maxNotes * NOTE_STRIDE);
  return { buffer, header, data, maxNotes };
};

export const createSharedNoteBuffer = (config?: SharedNoteBufferConfig): SharedNoteViews => {
  const maxNotes = Math.max(128, config?.maxNotes ?? 512);
  const headerBytes = HEADER_ENTRIES * Int32Array.BYTES_PER_ELEMENT;
  const dataBytes = maxNotes * NOTE_STRIDE * Float32Array.BYTES_PER_ELEMENT;
  const sab = new SharedArrayBuffer(headerBytes + dataBytes);
  return createViews(sab, maxNotes);
};

export const attachSharedNoteBuffer = (buffer: SharedArrayBuffer, maxNotes: number): SharedNoteViews => {
  return createViews(buffer, maxNotes);
};

const getStrideOffset = (index: number): number => index * NOTE_STRIDE;

export const writeSharedNotes = (
  views: SharedNoteViews,
  activeNotes: Array<{
    noteIndex: number;
    pitch: number;
    time: number;
    y: number;
    previousY: number;
    velocity?: number;
    state: SharedNoteState;
  }>
): void => {
  const { data, header, maxNotes } = views;
  const count = Math.min(activeNotes.length, maxNotes);
  for (let i = 0; i < count; i += 1) {
    const note = activeNotes[i];
    const base = getStrideOffset(i);
    data[base] = note.noteIndex;
    data[base + 1] = note.pitch;
    data[base + 2] = note.time;
    data[base + 3] = note.y;
    data[base + 4] = note.previousY;
    data[base + 5] = note.velocity ?? 0;
    data[base + 6] = note.state;
    data[base + 7] = 0;
  }
    if (count < maxNotes) {
      const start = getStrideOffset(count);
      data.fill(0, start, maxNotes * NOTE_STRIDE);
    }
  Atomics.store(header, ACTIVE_COUNT_INDEX, count);
  Atomics.store(header, 0, Atomics.load(header, 0) + 1);
};

export class SharedNoteBufferReader {
  private metadata: NoteData[] = [];

  constructor(private readonly views: SharedNoteViews) {}

  setMetadata(metadata: NoteData[]): void {
    this.metadata = metadata;
  }

  forEach(callback: (snapshot: SharedNoteSnapshot) => void): void {
    const { header, data } = this.views;
    const count = Atomics.load(header, ACTIVE_COUNT_INDEX);
    for (let i = 0; i < count; i += 1) {
      const base = getStrideOffset(i);
      const noteIndex = data[base];
      const meta = this.metadata[noteIndex];
      if (!meta) {
        continue;
      }
      callback({
        id: meta.id,
        noteIndex,
        base: meta,
        pitch: data[base + 1],
        time: data[base + 2],
        y: data[base + 3],
        previousY: data[base + 4],
        velocity: data[base + 5],
        state: data[base + 6] as SharedNoteState,
        noteName: meta.noteName
      });
    }
  }
}
