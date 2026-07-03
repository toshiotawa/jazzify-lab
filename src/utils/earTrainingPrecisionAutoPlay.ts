import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';
import type { PrecisionNoteRuntimeState } from '@/utils/earTrainingPrecisionJudge';

export const EAR_TRAINING_PRECISION_AUTO_PLAY_STORAGE_KEY =
  'earTraining.precision.autoPlayEnabled';

export interface PrecisionAutoPlayCallbacks {
  onNoteOn: (midi: number, noteId: string) => void;
  onNoteOff: (midi: number, noteId: string) => void;
}

interface ActiveAutoPlayNote {
  noteId: string;
  midi: number;
  endSec: number;
}

export class PrecisionAutoPlayScheduler {
  private notes: readonly PrecisionNote[] = [];
  private nextOnIndex = 0;
  private activeNotes: ActiveAutoPlayNote[] = [];

  setNotes(notes: readonly PrecisionNote[]): void {
    this.notes = notes;
  }

  reset(): void {
    this.nextOnIndex = 0;
    this.activeNotes = [];
  }

  /** シーク後: カーソルを先頭に戻し、現在 sustain 中の good ロングノーツを復元 */
  syncAfterSeek(
    phraseTimeSec: number,
    states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  ): void {
    this.nextOnIndex = 0;
    this.activeNotes = [];
    for (const note of this.notes) {
      if (note.startSec > phraseTimeSec) {
        break;
      }
      const state = states.get(note.id);
      if (
        state?.judgment === 'good'
        && phraseTimeSec < note.startSec + note.durationSec - 0.001
      ) {
        this.activeNotes.push({
          noteId: note.id,
          midi: note.midi,
          endSec: note.startSec + note.durationSec,
        });
      }
    }
  }

  tick(
    phraseTimeSec: number,
    states: Map<string, PrecisionNoteRuntimeState>,
    callbacks: PrecisionAutoPlayCallbacks,
  ): boolean {
    let changed = false;

    while (this.nextOnIndex < this.notes.length) {
      const note = this.notes[this.nextOnIndex];
      if (!note || note.startSec > phraseTimeSec) {
        break;
      }
      const state = states.get(note.id);
      if (state && state.judgment === 'pending') {
        state.judgment = 'good';
        state.hitAtSec = note.startSec;
        if (note.isShortNote) {
          state.hiddenFromLane = true;
        }
        this.activeNotes.push({
          noteId: note.id,
          midi: note.midi,
          endSec: note.startSec + note.durationSec,
        });
        callbacks.onNoteOn(note.midi, note.id);
        changed = true;
      }
      this.nextOnIndex += 1;
    }

    for (let i = this.activeNotes.length - 1; i >= 0; i -= 1) {
      const active = this.activeNotes[i];
      if (!active || phraseTimeSec < active.endSec - 0.001) {
        continue;
      }
      const state = states.get(active.noteId);
      if (state && state.judgment === 'good') {
        if (!(state.hiddenFromLane ?? false)) {
          state.hiddenFromLane = true;
        }
        callbacks.onNoteOff(active.midi, active.noteId);
        changed = true;
      }
      this.activeNotes.splice(i, 1);
    }

    return changed;
  }

  /** Auto Play OFF 時など: sustain 中のノーツへ note off を送る */
  releaseAllActive(callbacks: PrecisionAutoPlayCallbacks): void {
    for (const active of this.activeNotes) {
      callbacks.onNoteOff(active.midi, active.noteId);
    }
    this.activeNotes = [];
  }
}

export const loadEarTrainingPrecisionAutoPlayEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem(EAR_TRAINING_PRECISION_AUTO_PLAY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveEarTrainingPrecisionAutoPlayEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      EAR_TRAINING_PRECISION_AUTO_PLAY_STORAGE_KEY,
      enabled ? '1' : '0',
    );
  } catch {
    /* ignore storage errors */
  }
};
