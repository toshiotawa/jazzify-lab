import { Note } from 'tonal';
import type {
  EarTrainingChordVoicingAttempt,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
} from '@/types';
import { resolveChord } from '@/utils/chord-utils';
import { midiToPitchClass } from '@/utils/earTrainingEngine';

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
const HARMONY_GROUP_EPSILON_SEC = 0.001;
/** harmony 終端と判定する閾値（同一小節の時間ウィンドウ終わり） */
const HARMONY_TIME_WINDOW_EPSILON_SEC = 0.0005;

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

const isFiniteExplicitEndSec = (chord: TimedEarTrainingPhraseChord): chord is TimedEarTrainingPhraseChord & { end_time_sec: number } =>
  chord.end_time_sec !== null
  && chord.end_time_sec !== undefined
  && Number.isFinite(chord.end_time_sec);

const isSameHarmonyGroup = (
  chord: TimedEarTrainingPhraseChord,
  nextChord: TimedEarTrainingPhraseChord,
): boolean => {
  if (chord.chord_name !== nextChord.chord_name) {
    return false;
  }
  if (!isFiniteExplicitEndSec(chord) || !isFiniteExplicitEndSec(nextChord)) {
    return false;
  }
  return Math.abs(chord.end_time_sec - nextChord.end_time_sec) <= HARMONY_GROUP_EPSILON_SEC;
};

export interface EarTrainingHarmonyHudRow {
  representativeId: string;
  chordName: string;
  voicingIds: readonly string[];
}

interface HarmonyTimelineGroup {
  readonly chords: readonly TimedEarTrainingPhraseChord[];
  readonly segmentStart: number;
  readonly segmentEnd: number;
}

const buildHarmonyTimelineGroups = (sorted: readonly TimedEarTrainingPhraseChord[]): HarmonyTimelineGroup[] => {
  if (sorted.length === 0) {
    return [];
  }
  const groups: HarmonyTimelineGroup[] = [];
  let run: TimedEarTrainingPhraseChord[] = [sorted[0]];
  const flushRun = (chords: TimedEarTrainingPhraseChord[]) => {
    if (chords.length === 0) {
      return;
    }
    const end = chords[0];
    if (!isFiniteExplicitEndSec(end)) {
      return;
    }
    const segmentStart = Math.min(...chords.map(c => c.start_time_sec));
    groups.push({
      chords,
      segmentStart,
      segmentEnd: end.end_time_sec,
    });
  };

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const curr = sorted[index];
    if (isSameHarmonyGroup(prev, curr)) {
      run.push(curr);
    } else {
      flushRun(run);
      run = [curr];
    }
  }
  flushRun(run);
  return groups;
};

export const getEarTrainingHarmonyHudRows = (
  phrase: EarTrainingPhrase | undefined,
): EarTrainingHarmonyHudRow[] => {
  const timed = getTimedChords(phrase);
  if (timed.length === 0) {
    return [];
  }
  return buildHarmonyTimelineGroups(timed).map(group => ({
    representativeId: group.chords[0].id,
    chordName: group.chords[0].chord_name,
    voicingIds: group.chords.map(c => c.id),
  }));
};

/** タイムラインが無いフレーズではコード1つを1行とみなす（HUD・報酬キー用）。 */
export const getHarmonyRowForChordId = (
  phrase: EarTrainingPhrase | undefined,
  chordId: string,
): EarTrainingHarmonyHudRow | null => {
  const rows = getEarTrainingHarmonyHudRows(phrase);
  const match = rows.find(row => row.voicingIds.includes(chordId));
  if (match) {
    return match;
  }
  const chord = phrase?.chords?.find(c => c.id === chordId);
  if (!chord) {
    return null;
  }
  return {
    representativeId: chord.id,
    chordName: chord.chord_name,
    voicingIds: [chord.id],
  };
};

export const isHarmonySegmentFullyCompleted = (
  attempt: EarTrainingChordVoicingAttempt,
  row: EarTrainingHarmonyHudRow,
): boolean => row.voicingIds.every(id => attempt.completedChordIds.has(id));

/**
 * オーディオループ内時刻における現在ヴォイシング行。
 * - 同一 harmony（同一 chord_name + 同一 end_time_sec の連鎖）では、手前から順に未完成の行だけが対象。
 * - harmony の時間終端に達すると、未完成が残っていても次 harmony の先頭行へ移る。
 * - harmony 内で全行完成済みなら、次 harmony の先頭行へ早進する。
 */
export const getEarTrainingChordDisplayAtTime = (
  phrase: EarTrainingPhrase | undefined,
  loopTimeSec: number,
  _bpm: number,
  completedChordIds: ReadonlySet<string>,
): EarTrainingPhraseChord | null => {
  void _bpm;
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return null;
  }

  const timed = getTimedChords(phrase);
  if (timed.length === 0) {
    return chords[0] ?? null;
  }

  const groups = buildHarmonyTimelineGroups(timed);

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const { chords: groupChords, segmentStart, segmentEnd } = groups[groupIndex];

    if (loopTimeSec < segmentStart - HARMONY_TIME_WINDOW_EPSILON_SEC) {
      return null;
    }

    if (loopTimeSec >= segmentEnd - HARMONY_TIME_WINDOW_EPSILON_SEC) {
      continue;
    }

    for (const chord of groupChords) {
      if (!completedChordIds.has(chord.id)) {
        return chord;
      }
    }

    const nextGroup = groups[groupIndex + 1];
    if (nextGroup) {
      return nextGroup.chords[0] ?? null;
    }
    return null;
  }

  return null;
};

export const getEarTrainingNextChordDisplayBoundarySec = (
  phrase: EarTrainingPhrase | undefined,
  loopTimeSec: number,
  _bpm: number,
  _completedChordIds: ReadonlySet<string>,
): number | null => {
  void _bpm;
  void _completedChordIds;
  const timed = getTimedChords(phrase);
  if (timed.length === 0) {
    return null;
  }

  const groups = buildHarmonyTimelineGroups(timed);
  let nextBoundary = Number.POSITIVE_INFINITY;
  const threshold = loopTimeSec + DISPLAY_BOUNDARY_EPSILON_SEC;

  for (const group of groups) {
    const segEnd = group.segmentEnd;
    if (segEnd > threshold && segEnd < nextBoundary) {
      nextBoundary = segEnd;
    }
    const segStart = group.chords[0]?.start_time_sec;
    if (
      typeof segStart === 'number'
      && Number.isFinite(segStart)
      && segStart > threshold
      && segStart < nextBoundary
    ) {
      nextBoundary = segStart;
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
