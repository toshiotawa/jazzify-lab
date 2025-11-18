import type { ActiveNote, NoteData } from '@/types';

export const SHARED_NOTES_HEADER_INTS = 4;
export const SHARED_NOTES_HEADER_BYTES = SHARED_NOTES_HEADER_INTS * 4 + 8; // Int32 * 4 + Float64 time
export const SHARED_NOTE_RECORD_BYTES = 32;
export const DEFAULT_MAX_SHARED_NOTES = 4096;

const HEADER_FRAME_INDEX = 0;
const HEADER_ACTIVE_COUNT_INDEX = 1;
const CURRENT_TIME_OFFSET = SHARED_NOTES_HEADER_INTS * 4;
const NOTES_OFFSET = SHARED_NOTES_HEADER_BYTES;

const STATE_HIDDEN = 0;
const STATE_VISIBLE = 1;
const STATE_HIT = 2;
const STATE_MISSED = 3;
const STATE_COMPLETED = 4;
const STATE_GOOD = 5;
const STATE_PERFECT = 6;

type NoteIndexResolver = (noteId: string) => number;

export interface SharedNotesFrame {
  frameId: number;
  currentTime: number;
  activeNotes: ActiveNote[];
}

export interface NoteMetadataProvider {
  getNotes(): NoteData[];
  getNoteIds(): string[];
}

export const createSharedNotesBuffer = (maxNotes: number = DEFAULT_MAX_SHARED_NOTES): SharedArrayBuffer => {
  const byteLength = SHARED_NOTES_HEADER_BYTES + maxNotes * SHARED_NOTE_RECORD_BYTES;
  return new SharedArrayBuffer(byteLength);
};

const encodeState = (state: ActiveNote['state']): number => {
  switch (state) {
    case 'visible':
      return STATE_VISIBLE;
    case 'hit':
      return STATE_HIT;
    case 'good':
      return STATE_GOOD;
    case 'perfect':
      return STATE_PERFECT;
    case 'missed':
      return STATE_MISSED;
    case 'completed':
      return STATE_COMPLETED;
    default:
      return STATE_HIDDEN;
  }
};

const decodeState = (value: number): ActiveNote['state'] => {
  switch (value) {
    case STATE_VISIBLE:
      return 'visible';
    case STATE_HIT:
      return 'hit';
    case STATE_GOOD:
      return 'good';
    case STATE_PERFECT:
      return 'perfect';
    case STATE_MISSED:
      return 'missed';
    case STATE_COMPLETED:
      return 'completed';
    default:
      return 'hidden';
  }
};

export class LegendSharedNotesWriter {
  private readonly dataView: DataView;
  private readonly headerView: Int32Array;
  private frameId = 0;

  constructor(
    private readonly buffer: SharedArrayBuffer,
    private readonly maxNotes: number,
    private readonly resolveNoteIndex: NoteIndexResolver
  ) {
    this.dataView = new DataView(buffer);
    this.headerView = new Int32Array(buffer, 0, SHARED_NOTES_HEADER_INTS);
  }

  write(notes: ActiveNote[], currentTime: number): void {
    const cappedCount = Math.min(notes.length, this.maxNotes);
    let writeIndex = 0;

    for (let i = 0; i < cappedCount; i++) {
      const note = notes[i];
      const noteIndex = this.resolveNoteIndex(note.id);
      if (noteIndex < 0) {
        continue;
      }

      const offset = NOTES_OFFSET + writeIndex * SHARED_NOTE_RECORD_BYTES;
      this.dataView.setInt32(offset, noteIndex, true);
      this.dataView.setInt32(offset + 4, encodeState(note.state), true);
      this.dataView.setFloat32(offset + 8, note.pitch, true);
      this.dataView.setFloat32(offset + 12, note.y ?? 0, true);
      this.dataView.setFloat32(offset + 16, note.previousY ?? note.y ?? 0, true);
      this.dataView.setFloat32(offset + 20, note.hitTime ?? -1, true);
      this.dataView.setFloat32(offset + 24, note.timingError ?? 0, true);
      this.dataView.setInt32(offset + 28, note.crossingLogged ? 1 : 0, true);
      writeIndex += 1;
    }

    this.dataView.setFloat64(CURRENT_TIME_OFFSET, currentTime, true);
    Atomics.store(this.headerView, HEADER_ACTIVE_COUNT_INDEX, writeIndex);
    this.frameId = (this.frameId + 1) | 0;
    Atomics.store(this.headerView, HEADER_FRAME_INDEX, this.frameId);
    Atomics.notify(this.headerView, HEADER_FRAME_INDEX);
  }
}

export class LegendSharedNotesReader {
  private readonly dataView: DataView;
  private readonly headerView: Int32Array;
  private lastFrameId = -1;

  constructor(
    private readonly buffer: SharedArrayBuffer,
    private readonly metadataProvider: NoteMetadataProvider
  ) {
    this.dataView = new DataView(buffer);
    this.headerView = new Int32Array(buffer, 0, SHARED_NOTES_HEADER_INTS);
  }

  readFrame(): SharedNotesFrame | null {
    const frameId = Atomics.load(this.headerView, HEADER_FRAME_INDEX);
    if (frameId === this.lastFrameId) {
      return null;
    }

    this.lastFrameId = frameId;
    const activeCount = Atomics.load(this.headerView, HEADER_ACTIVE_COUNT_INDEX);
    const currentTime = this.dataView.getFloat64(CURRENT_TIME_OFFSET, true);

    const notesMeta = this.metadataProvider.getNotes();
    const noteIds = this.metadataProvider.getNoteIds();
    const activeNotes: ActiveNote[] = [];

    for (let i = 0; i < activeCount; i++) {
      const offset = NOTES_OFFSET + i * SHARED_NOTE_RECORD_BYTES;
      const noteIndex = this.dataView.getInt32(offset, true);
      if (noteIndex < 0 || noteIndex >= notesMeta.length) {
        continue;
      }

      const metadata = notesMeta[noteIndex];
      const id = noteIds[noteIndex] ?? metadata.id ?? `note-${noteIndex}`;
      const pitch = this.dataView.getFloat32(offset + 8, true);
      const stateCode = this.dataView.getInt32(offset + 4, true);

      const activeNote: ActiveNote = {
        ...metadata,
        id,
        pitch,
        y: this.dataView.getFloat32(offset + 12, true),
        previousY: this.dataView.getFloat32(offset + 16, true),
        hitTime: this.dataView.getFloat32(offset + 20, true),
        timingError: this.dataView.getFloat32(offset + 24, true),
        crossingLogged: this.dataView.getInt32(offset + 28, true) === 1,
        state: decodeState(stateCode)
      };

      activeNotes.push(activeNote);
    }

    return {
      frameId,
      currentTime,
      activeNotes
    };
  }
}
