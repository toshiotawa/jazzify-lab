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

const sortChordsByTime = (chords: EarTrainingPhraseChord[]): EarTrainingPhraseChord[] =>
  [...chords].sort((a, b) => {
    const as = a.start_time_sec ?? 0;
    const bs = b.start_time_sec ?? 0;
    if (as !== bs) {
      return as - bs;
    }
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });

/**
 * 直前コードがウィンドウ内で完成済みのとき、次コードの表示・判定開始を半拍早める。
 * 完成していないコード区間は nominal と同じ境界を使う。
 */
export const getEarTrainingChordDisplayAtTime = (
  phrase: EarTrainingPhrase | undefined,
  loopTimeSec: number,
  bpm: number,
  completedChordIds: ReadonlySet<string>,
): EarTrainingPhraseChord | null => {
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return null;
  }

  const timed = chords.filter(
    (c): c is EarTrainingPhraseChord & { start_time_sec: number } =>
      c.start_time_sec !== null && c.start_time_sec !== undefined,
  );
  if (timed.length === 0) {
    return chords[0] ?? null;
  }

  const sorted = sortChordsByTime(timed);
  const half = getEarTrainingHalfBeatSec(bpm);
  const n = sorted.length;

  const adjStart: number[] = new Array(n);
  const adjEnd: number[] = new Array(n);

  for (let j = 0; j < n; j += 1) {
    const start = sorted[j].start_time_sec ?? 0;
    if (j === 0) {
      adjStart[j] = start;
    } else {
      const prevComplete = completedChordIds.has(sorted[j - 1].id);
      adjStart[j] = start - (prevComplete ? half : 0);
    }
  }

  for (let j = 0; j < n; j += 1) {
    const nextStart = j + 1 < n ? (sorted[j + 1].start_time_sec ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
    const endNominal = sorted[j].end_time_sec ?? nextStart;
    if (completedChordIds.has(sorted[j].id) && j + 1 < n) {
      adjEnd[j] = nextStart - half;
    } else {
      adjEnd[j] = Number.isFinite(endNominal) ? endNominal : Number.POSITIVE_INFINITY;
    }
  }

  let best = -1;
  for (let j = 0; j < n; j += 1) {
    if (adjStart[j] <= loopTimeSec && loopTimeSec < adjEnd[j]) {
      best = j;
    }
  }

  if (best >= 0) {
    return sorted[best];
  }
  return chords[0] ?? null;
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
