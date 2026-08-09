import { PRECISION_NOTE_FALL_LEAD_SEC } from '@/components/piano/PrecisionNotesRenderer';
import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';

export type LoopTransposeDirection = 'down' | 'up' | 'fourthUp' | 'none';

const LOOP_TRANSPOSE_STEP_SEMITONES: Record<LoopTransposeDirection, number> = {
  none: 0,
  down: -1,
  up: 1,
  fourthUp: 5,
};

export interface PrecisionLoopWindow {
  startMeasure: number;
  endMeasure: number;
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface PrecisionLoopPosition {
  cycleIndex: number;
  localSec: number;
}

export interface BuildLoopWindowNotesParams {
  notesBySemitone: ReadonlyMap<number, readonly PrecisionNote[]>;
  cycleIndex: number;
  windowSize: number;
  loopWindow: PrecisionLoopWindow;
  direction: LoopTransposeDirection;
  baseSemitone?: number;
  resolveCalibratedStartSec?: (startSec: number) => number;
}

export const resolveLoopWindow = (params: {
  startMeasure: number;
  endMeasure: number;
  measureDurationSec: number;
}): PrecisionLoopWindow => {
  const startMeasure = Math.max(1, Math.trunc(params.startMeasure));
  const endMeasure = Math.max(startMeasure, Math.trunc(params.endMeasure));
  const measureDurationSec = Math.max(1e-6, params.measureDurationSec);
  const startSec = (startMeasure - 1) * measureDurationSec;
  const endSec = endMeasure * measureDurationSec;
  return {
    startMeasure,
    endMeasure,
    startSec,
    endSec,
    durationSec: Math.max(1e-6, endSec - startSec),
  };
};

export const loopSemitoneForCycle = (
  cycleIndex: number,
  direction: LoopTransposeDirection,
  baseSemitone = 0,
): number => {
  const safeCycle = Math.max(0, Math.trunc(cycleIndex));
  const step = LOOP_TRANSPOSE_STEP_SEMITONES[direction] * safeCycle;
  const raw = baseSemitone + step;
  let wrapped = ((raw % 12) + 12) % 12;
  if (wrapped > 6 || (wrapped === 6 && raw < 0)) {
    wrapped -= 12;
  }
  return wrapped;
};

export const loopPracticeUniqueSemitones = (
  direction: LoopTransposeDirection,
  baseSemitone = 0,
): readonly number[] => {
  if (direction === 'none') {
    return [loopSemitoneForCycle(0, direction, baseSemitone)];
  }
  const seen = new Set<number>();
  const result: number[] = [];
  for (let cycle = 0; cycle < 12; cycle += 1) {
    const semitone = loopSemitoneForCycle(cycle, direction, baseSemitone);
    if (seen.has(semitone)) {
      continue;
    }
    seen.add(semitone);
    result.push(semitone);
  }
  return result;
};

export const globalToLoopPosition = (
  globalSec: number,
  durationSec: number,
): PrecisionLoopPosition => {
  const safeDuration = Math.max(1e-6, durationSec);
  const safeGlobal = Math.max(0, globalSec);
  const cycleIndex = Math.floor(safeGlobal / safeDuration);
  const localSec = safeGlobal - cycleIndex * safeDuration;
  return { cycleIndex, localSec };
};

export const loopCycleWindowSize = (durationSec: number): number => {
  const safeDuration = Math.max(1e-6, durationSec);
  return Math.max(2, Math.ceil(PRECISION_NOTE_FALL_LEAD_SEC / safeDuration) + 1);
};

const noteOverlapsLoopWindow = (
  note: PrecisionNote,
  loopWindow: PrecisionLoopWindow,
): boolean => {
  const noteEndSec = note.startSec + note.durationSec;
  return noteEndSec > loopWindow.startSec + 1e-9 && note.startSec < loopWindow.endSec - 1e-9;
};

export const buildLoopWindowNotes = ({
  notesBySemitone,
  cycleIndex,
  windowSize,
  loopWindow,
  direction,
  baseSemitone = 0,
  resolveCalibratedStartSec = (value) => value,
}: BuildLoopWindowNotesParams): PrecisionNote[] => {
  const safeCycle = Math.max(0, Math.trunc(cycleIndex));
  const safeWindowSize = Math.max(1, Math.trunc(windowSize));
  const built: PrecisionNote[] = [];

  for (let offset = 0; offset < safeWindowSize; offset += 1) {
    const cycle = safeCycle + offset;
    const semitone = loopSemitoneForCycle(cycle, direction, baseSemitone);
    const baseNotes = notesBySemitone.get(semitone) ?? [];
    const globalCycleOffsetSec = cycle * loopWindow.durationSec;

    for (const note of baseNotes) {
      if (!noteOverlapsLoopWindow(note, loopWindow)) {
        continue;
      }
      const localStartSec = note.startSec - loopWindow.startSec;
      const globalStartSec = resolveCalibratedStartSec(localStartSec + globalCycleOffsetSec);
      built.push({
        ...note,
        id: `${note.id}#c${cycle}`,
        startSec: globalStartSec,
        measureNumber: note.measureNumber,
      });
    }
  }

  built.sort((left, right) => {
    if (left.startSec !== right.startSec) {
      return left.startSec - right.startSec;
    }
    return left.id.localeCompare(right.id);
  });
  return built;
};

export const loopActiveMeasureNumber = (
  localSec: number,
  measureDurationSec: number,
  loopWindow: PrecisionLoopWindow,
  maxMeasure: number,
): number => {
  const measureInWindow = Math.floor(Math.max(0, localSec) / Math.max(1e-6, measureDurationSec)) + 1;
  const spanMeasures = loopWindow.endMeasure - loopWindow.startMeasure + 1;
  const clampedInWindow = Math.max(1, Math.min(spanMeasures, measureInWindow));
  const absoluteMeasure = loopWindow.startMeasure + clampedInWindow - 1;
  return Math.max(1, Math.min(maxMeasure, absoluteMeasure));
};

export const loopOsmdTimelineSec = (
  localSec: number,
  measureDurationSec: number,
  loopWindow: PrecisionLoopWindow,
): { measureNumber: number; phraseTimelineSec: number } => {
  const measureNumber = loopActiveMeasureNumber(
    localSec,
    measureDurationSec,
    loopWindow,
    loopWindow.endMeasure,
  );
  const measureInWindow = measureNumber - loopWindow.startMeasure + 1;
  const offsetInMeasure = localSec - (measureInWindow - 1) * measureDurationSec;
  const phraseTimelineSec = (measureNumber - 1) * measureDurationSec + offsetInMeasure;
  return { measureNumber, phraseTimelineSec };
};
