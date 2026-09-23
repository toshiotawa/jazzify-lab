import type { PrecisionLessonRank } from '@/types';
import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';
import { VOICE_JUDGMENT_ARRIVAL_GRACE_SEC } from '@/utils/earTrainingChordOsmd';
import {
  buildExpectedPitchCandidates,
  type ExpectedPitchCandidates,
} from '@/utils/pitchInput/expectedPitchCandidates';
import { minIntervalMsForWrittenSpacing } from '@/utils/pitchInput/samePitchRepeatGate';

export const PRECISION_JUDGMENT_WINDOW_SEC = 0.25;
export { VOICE_JUDGMENT_ARRIVAL_GRACE_SEC };

export type PrecisionNoteJudgment = 'pending' | 'good' | 'miss';

export interface PrecisionNoteRuntimeState {
  judgment: PrecisionNoteJudgment;
  /** good 判定時の phrase タイムライン秒 */
  hitAtSec?: number;
  /** ヒット後に鍵盤を離したか */
  releasedEarly?: boolean;
  /** レーンから非表示（早期 note off 等） */
  hiddenFromLane?: boolean;
}

export const createPrecisionRuntimeStates = (
  notes: readonly PrecisionNote[],
): Map<string, PrecisionNoteRuntimeState> => {
  const map = new Map<string, PrecisionNoteRuntimeState>();
  for (const note of notes) {
    map.set(note.id, { judgment: 'pending' });
  }
  return map;
};

export const resetPrecisionRuntimeStatesFromTime = (
  notes: readonly PrecisionNote[],
  states: Map<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
): void => {
  for (const note of notes) {
    const state = states.get(note.id);
    if (!state) {
      continue;
    }
    const endWindow = note.startSec + windowSec;
    if (phraseTimeSec <= endWindow) {
      state.judgment = 'pending';
      state.hitAtSec = undefined;
      state.releasedEarly = undefined;
      state.hiddenFromLane = undefined;
      continue;
    }
    // 練習モードのシーク: シーク位置以降（判定窓内）の good ノーツを pending に戻して復活させる
    if (note.startSec >= phraseTimeSec - windowSec) {
      state.judgment = 'pending';
      state.hitAtSec = undefined;
      state.releasedEarly = undefined;
      state.hiddenFromLane = undefined;
      continue;
    }
    if (state.judgment === 'good') {
      continue;
    }
    state.judgment = 'miss';
    state.hitAtSec = undefined;
    state.releasedEarly = undefined;
    state.hiddenFromLane = undefined;
  }
};

const pitchClassFromMidi = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12;

interface PrecisionSamePitchRepeatContext {
  pendingIndex: number;
  pendingNote: PrecisionNote;
}

const resolvePrecisionSamePitchRepeatContext = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
): PrecisionSamePitchRepeatContext | null => {
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index];
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    const delta = phraseTimeSec - note.startSec;
    if (delta > windowSec) {
      continue;
    }
    if (index === 0) {
      return null;
    }
    const previousNote = notes[index - 1];
    const previousState = states.get(previousNote.id);
    if (!previousState || previousState.judgment !== 'good') {
      return null;
    }
    const previousPc = pitchClassFromMidi(previousNote.midi);
    const pendingPc = pitchClassFromMidi(note.midi);
    if (previousPc !== pendingPc) {
      return null;
    }
    return { pendingIndex: index, pendingNote: note };
  }
  return null;
};

const resolvePrecisionRepeatPitchClassMask = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
): number => {
  const context = resolvePrecisionSamePitchRepeatContext(
    notes,
    states,
    phraseTimeSec,
    windowSec,
  );
  if (!context) {
    return 0;
  }
  const pendingPc = pitchClassFromMidi(context.pendingNote.midi);
  return 1 << pendingPc;
};

export const isPrecisionWaitingForSamePitchRepeat = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
): boolean => (
  resolvePrecisionRepeatPitchClassMask(notes, states, phraseTimeSec, windowSec) !== 0
);

export const resolvePrecisionSamePitchRepeatMinIntervalMs = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
): number | null => {
  const context = resolvePrecisionSamePitchRepeatContext(
    notes,
    states,
    phraseTimeSec,
    windowSec,
  );
  if (!context) {
    return null;
  }
  const previousNote = notes[context.pendingIndex - 1];
  return minIntervalMsForWrittenSpacing(previousNote.startSec, context.pendingNote.startSec);
};

export const collectPrecisionExpectedPitchCandidates = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
): ExpectedPitchCandidates => {
  const midis: number[] = [];
  for (const note of notes) {
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    const delta = phraseTimeSec - note.startSec;
    if (delta < -windowSec) {
      break;
    }
    if (delta > windowSec) {
      continue;
    }
    if (!midis.includes(note.midi)) {
      midis.push(note.midi);
    }
  }
  const repeatPitchClassMask = resolvePrecisionRepeatPitchClassMask(
    notes,
    states,
    phraseTimeSec,
    windowSec,
  );
  return buildExpectedPitchCandidates(midis, repeatPitchClassMask);
};

export const findPrecisionNoteForInput = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  midi: number,
  phraseTimeSec: number,
  windowSec: number,
  allowOctaveError = false,
): PrecisionNote | null => {
  const roundedMidi = Math.round(midi);
  const inputPitchClass = ((roundedMidi % 12) + 12) % 12;
  let bestNote: PrecisionNote | null = null;
  let bestAbsDelta = Number.POSITIVE_INFINITY;
  for (const note of notes) {
    const midiMatches = allowOctaveError
      ? ((note.midi % 12) + 12) % 12 === inputPitchClass
      : note.midi === roundedMidi;
    if (!midiMatches) {
      continue;
    }
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    const absDelta = Math.abs(phraseTimeSec - note.startSec);
    if (absDelta <= windowSec && absDelta < bestAbsDelta) {
      bestAbsDelta = absDelta;
      bestNote = note;
    }
  }
  return bestNote;
};

export const findNearestPendingPrecisionNote = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  midi: number,
  phraseTimeSec: number,
  allowOctaveError = false,
): { note: PrecisionNote; deltaSec: number } | null => {
  const roundedMidi = Math.round(midi);
  const inputPitchClass = ((roundedMidi % 12) + 12) % 12;
  let bestNote: PrecisionNote | null = null;
  let bestAbsDelta = Number.POSITIVE_INFINITY;
  for (const note of notes) {
    const midiMatches = allowOctaveError
      ? ((note.midi % 12) + 12) % 12 === inputPitchClass
      : note.midi === roundedMidi;
    if (!midiMatches) {
      continue;
    }
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    const absDelta = Math.abs(phraseTimeSec - note.startSec);
    if (absDelta < bestAbsDelta) {
      bestAbsDelta = absDelta;
      bestNote = note;
    }
  }
  if (!bestNote) {
    return null;
  }
  return {
    note: bestNote,
    deltaSec: phraseTimeSec - bestNote.startSec,
  };
};

export const PRECISION_NOTE_CULL_MARGIN_PX = 20;

/** レーン描画から除外するか（pending / miss / good でカリング境界が異なる） */
export const shouldCullPrecisionNoteFromLane = (
  judgment: PrecisionNoteJudgment,
  bottom: number,
  top: number,
  noteLaneHeight: number,
  canvasHeight: number,
  margin = PRECISION_NOTE_CULL_MARGIN_PX,
): boolean => {
  if (bottom < -margin) {
    return true;
  }
  if (judgment === 'pending') {
    return top > noteLaneHeight + margin;
  }
  return top > canvasHeight + margin;
};

export const markExpiredPrecisionNotesAsMiss = (
  notes: readonly PrecisionNote[],
  states: Map<string, PrecisionNoteRuntimeState>,
  phraseTimeSec: number,
  windowSec: number,
  arrivalGraceSec = 0,
): number => {
  let newlyMissed = 0;
  for (const note of notes) {
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    if (phraseTimeSec > note.startSec + windowSec + arrivalGraceSec) {
      state.judgment = 'miss';
      newlyMissed += 1;
    }
  }
  return newlyMissed;
};

export const countPrecisionJudgments = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
): { good: number; miss: number; pending: number; total: number } => {
  let good = 0;
  let miss = 0;
  let pending = 0;
  for (const note of notes) {
    const state = states.get(note.id);
    if (!state || state.judgment === 'pending') {
      pending += 1;
      continue;
    }
    if (state.judgment === 'good') {
      good += 1;
    } else {
      miss += 1;
    }
  }
  return { good, miss, pending, total: notes.length };
};

export const precisionGoodRate = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
): number => {
  const { good, total } = countPrecisionJudgments(notes, states);
  if (total <= 0) {
    return 0;
  }
  return good / total;
};

export const precisionRankForGoodRate = (goodRate: number): PrecisionLessonRank => {
  if (goodRate >= 0.95) {
    return 'S';
  }
  if (goodRate >= 0.9) {
    return 'A';
  }
  if (goodRate >= 0.8) {
    return 'B';
  }
  if (goodRate >= 0.7) {
    return 'C';
  }
  return 'D';
};

/** 音源 onEnded 時、フレーズタイムラインが loopEnd に達したときだけ終了する（OSMD と同型）。 */
export const shouldFinishPrecisionPhraseOnAudioEnded = (
  phraseTimeSec: number | null,
  phraseLoopEndSec: number,
): boolean => (
  phraseTimeSec !== null
  && Number.isFinite(phraseTimeSec)
  && phraseTimeSec + 1e-9 >= phraseLoopEndSec
);

export const isPrecisionClearRank = (rank: PrecisionLessonRank): boolean => rank !== 'D';

export const mapPrecisionRankToLessonRank = (
  rank: PrecisionLessonRank,
): 'S' | 'A' | 'B' | 'C' => {
  if (rank === 'S') {
    return 'S';
  }
  if (rank === 'A') {
    return 'A';
  }
  if (rank === 'B') {
    return 'B';
  }
  return 'C';
};
