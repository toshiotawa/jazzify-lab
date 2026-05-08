import { Note } from 'tonal';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import { resolveChord } from '@/utils/chord-utils';
import { midiToPitchClass } from '@/utils/earTrainingEngine';

/** 1 拍の秒長（BPM から）。 */
export const getEarTrainingBeatSec = (bpm: number): number => {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return 0;
  }
  return 60 / bpm;
};

/** 半拍の秒長（次コードの早期開始量）。 */
export const getEarTrainingHalfBeatSec = (bpm: number): number => getEarTrainingBeatSec(bpm) * 0.5;

/**
 * オーディオループ内時刻における「譜面・タイムライン上の」現在コード（従来の耳コピ HUD 用）。
 * `start_time_sec` / `end_time_sec` が無い場合は先頭コードを返す。
 */
export const getEarTrainingChordNominalAtTime = (
  phrase: EarTrainingPhrase | undefined,
  loopTimeSec: number,
): EarTrainingPhraseChord | null => {
  if (!phrase?.chords || phrase.chords.length === 0) {
    return null;
  }

  const explicit = phrase.chords.find(chord => {
    if (chord.start_time_sec === null || chord.start_time_sec === undefined) {
      return false;
    }
    const end = chord.end_time_sec ?? Number.POSITIVE_INFINITY;
    return loopTimeSec >= chord.start_time_sec && loopTimeSec < end;
  });
  if (explicit) {
    return explicit;
  }

  return phrase.chords[0] ?? null;
};

const sortChordsByTime = <T extends EarTrainingPhraseChord>(chords: T[]): T[] =>
  [...chords].sort((a, b) => {
    const as = a.start_time_sec ?? 0;
    const bs = b.start_time_sec ?? 0;
    if (as !== bs) {
      return as - bs;
    }
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });

type TimedEarTrainingPhraseChord = EarTrainingPhraseChord & { start_time_sec: number };

const DISPLAY_BOUNDARY_EPSILON_SEC = 0.001;
const getTimedChords = (
  phrase: EarTrainingPhrase | undefined,
): TimedEarTrainingPhraseChord[] => {
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return [];
  }

  const timed = chords.filter(
    (c): c is TimedEarTrainingPhraseChord =>
      c.start_time_sec !== null && c.start_time_sec !== undefined,
  );
  if (timed.length === 0) {
    return [];
  }

  return sortChordsByTime(timed);
};

const getChordEndSec = (
  chord: TimedEarTrainingPhraseChord,
  sortedChords: readonly TimedEarTrainingPhraseChord[],
  index: number,
): number => {
  const explicitEnd = chord.end_time_sec;
  if (
    explicitEnd !== null
    && explicitEnd !== undefined
    && Number.isFinite(explicitEnd)
    && explicitEnd > chord.start_time_sec
  ) {
    return explicitEnd;
  }
  return sortedChords[index + 1]?.start_time_sec ?? Number.POSITIVE_INFINITY;
};

/**
 * オーディオループ内時刻における現在コード。
 * コードの完成状態では止めず、MusicXML由来のタイムラインに沿って移動する。
 */
export const getEarTrainingChordDisplayAtTime = (
  phrase: EarTrainingPhrase | undefined,
  loopTimeSec: number,
  _bpm: number,
  _completedChordIds: ReadonlySet<string>,
): EarTrainingPhraseChord | null => {
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return null;
  }

  const timed = getTimedChords(phrase);
  if (timed.length === 0) {
    return chords[0] ?? null;
  }

  for (let index = 0; index < timed.length; index += 1) {
    const chord = timed[index];
    const endSec = getChordEndSec(chord, timed, index);
    if (loopTimeSec >= chord.start_time_sec && loopTimeSec < endSec) {
      return chord;
    }
  }
  return null;
};

export const getEarTrainingNextChordDisplayBoundarySec = (
  phrase: EarTrainingPhrase | undefined,
  loopTimeSec: number,
  _bpm: number,
  _completedChordIds: ReadonlySet<string>,
): number | null => {
  const timed = getTimedChords(phrase);
  if (timed.length === 0) {
    return null;
  }

  let nextBoundary = Number.POSITIVE_INFINITY;
  const threshold = loopTimeSec + DISPLAY_BOUNDARY_EPSILON_SEC;

  for (let index = 0; index < timed.length; index += 1) {
    const chord = timed[index];
    const endSec = getChordEndSec(chord, timed, index);
    if (chord.start_time_sec > threshold && chord.start_time_sec < nextBoundary) {
      nextBoundary = chord.start_time_sec;
    }
    if (Number.isFinite(endSec) && endSec > threshold && endSec < nextBoundary) {
      nextBoundary = endSec;
    }
  }

  return Number.isFinite(nextBoundary) ? nextBoundary : null;
};

/** `chord_name` をピッチクラス集合に解決（オクターブ非依存の判定用）。 */
export const getEarTrainingChordTargetPitchClasses = (chordName: string): number[] | null => {
  const trimmed = chordName.trim();
  if (!trimmed) {
    return null;
  }
  const resolved = resolveChord(trimmed, 4);
  if (!resolved) {
    return null;
  }
  const pcs = new Set<number>();
  for (const name of resolved.notes) {
    const chroma = Note.chroma(name);
    if (typeof chroma === 'number') {
      pcs.add(chroma);
    }
  }
  if (pcs.size === 0) {
    return null;
  }
  return [...pcs];
};

/** 入力ピッチクラス集合がターゲットをすべて含むか（重複・余分な音は許容）。 */
export const earTrainingChordPitchSetSatisfied = (target: readonly number[], pressed: ReadonlySet<number>): boolean =>
  target.every(pc => pressed.has(pc));

export const earTrainingChordUsesExplicitTimeline = (phrase: EarTrainingPhrase | undefined): boolean => {
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return false;
  }
  return chords.every(c => c.start_time_sec !== null && c.start_time_sec !== undefined);
};

/**
 * コード専用フレーズ: 単音 `notes` が無く、コードに明示タイムラインがあるときだけコード完成を追跡する。
 */
export const earTrainingPhraseIsChordOnlyTimeline = (phrase: EarTrainingPhrase | undefined): boolean => {
  if (!phrase) {
    return false;
  }
  if ((phrase.notes?.length ?? 0) > 0) {
    return false;
  }
  return earTrainingChordUsesExplicitTimeline(phrase);
};

export { midiToPitchClass };
