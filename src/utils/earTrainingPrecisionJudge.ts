import type { PrecisionLessonRank } from '@/types';
import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';

export const PRECISION_JUDGMENT_WINDOW_SEC = 0.25;

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

export const findPrecisionNoteForInput = (
  notes: readonly PrecisionNote[],
  states: ReadonlyMap<string, PrecisionNoteRuntimeState>,
  midi: number,
  phraseTimeSec: number,
  windowSec: number,
): PrecisionNote | null => {
  const roundedMidi = Math.round(midi);
  for (const note of notes) {
    if (note.midi !== roundedMidi) {
      continue;
    }
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    if (Math.abs(phraseTimeSec - note.startSec) <= windowSec) {
      return note;
    }
  }
  return null;
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
): number => {
  let newlyMissed = 0;
  for (const note of notes) {
    const state = states.get(note.id);
    if (!state || state.judgment !== 'pending') {
      continue;
    }
    if (phraseTimeSec > note.startSec + windowSec) {
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
