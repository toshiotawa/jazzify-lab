import type { TutorialLocalizedText } from './earTrainingTutorialScriptTypes';
import { localizedText } from './earTrainingTutorialScriptTypes';

export interface DialogueScheduleHandle {
  cancel: () => void;
}

export interface ScheduleDialogueIntervalParams {
  lines: TutorialLocalizedText[];
  intervalSeconds: number;
  isEnglishCopy: boolean;
  onLine: (text: string) => void;
}

/** dialogue_only: 固定秒間隔でセリフを順に表示 */
export const scheduleDialogueInterval = (
  params: ScheduleDialogueIntervalParams,
): DialogueScheduleHandle => {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const { lines, intervalSeconds, isEnglishCopy, onLine } = params;
  if (lines.length === 0) {
    return { cancel: () => undefined };
  }
  onLine(localizedText(lines[0], isEnglishCopy));
  for (let i = 1; i < lines.length; i += 1) {
    const timer = setTimeout(() => {
      onLine(localizedText(lines[i], isEnglishCopy));
    }, i * intervalSeconds * 1000);
    timers.push(timer);
  }
  return {
    cancel: () => {
      timers.forEach(t => clearTimeout(t));
    },
  };
};

export interface ScheduleOsmdTimedLinesParams {
  bpm: number;
  beatsPerMeasure: number;
  countInBeats: number;
  loopMeasures: number;
  phraseLoopDurationSec: number;
  timedLines: ReadonlyArray<
    | { phase: 'count_in'; loop?: number; beat: number; text: TutorialLocalizedText }
    | { at: { loop: number; measure: number; beat: number }; text: TutorialLocalizedText }
  >;
  isEnglishCopy: boolean;
  onLine: (text: string) => void;
  /** 2 ループ目以降はカウントイン省略 */
  skipCountInForLoop?: (loopIndex: number) => boolean;
}

export const computeOsmdTimedLineDelayMs = (
  params: ScheduleOsmdTimedLinesParams,
  line: ScheduleOsmdTimedLinesParams['timedLines'][number],
  loopIndex: number,
): number | null => {
  const beatDurationSec = 60 / Math.max(1, params.bpm);
  const measureDurationSec = beatDurationSec * Math.max(1, params.beatsPerMeasure);
  const countInDurationSec = params.countInBeats * beatDurationSec;
  const skipCountIn = params.skipCountInForLoop?.(loopIndex) ?? loopIndex > 0;

  if ('phase' in line && line.phase === 'count_in') {
    if (skipCountIn) {
      return null;
    }
    const targetLoop = line.loop ?? 0;
    if (targetLoop !== loopIndex) {
      return null;
    }
    const beat = Math.max(1, Math.trunc(line.beat));
    if (beat > params.countInBeats) {
      return null;
    }
    return (beat - 1) * beatDurationSec * 1000;
  }

  if (!('at' in line)) {
    return null;
  }
  const atLoop = line.at.loop;
  if (atLoop !== loopIndex) {
    return null;
  }
  const countInOffset = skipCountIn ? 0 : countInDurationSec;
  const measureIndex = Math.max(1, Math.trunc(line.at.measure)) - 1;
  const beatIndex = Math.max(1, Math.trunc(line.at.beat)) - 1;
  const phraseOffsetSec =
    measureIndex * measureDurationSec + beatIndex * beatDurationSec;
  const loopOffsetSec = loopIndex * params.phraseLoopDurationSec;
  return (loopOffsetSec + countInOffset + phraseOffsetSec) * 1000;
};

export const scheduleOsmdTimedLinesForLoop = (
  params: ScheduleOsmdTimedLinesParams & { loopIndex: number },
): DialogueScheduleHandle => {
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const line of params.timedLines) {
    const delayMs = computeOsmdTimedLineDelayMs(params, line, params.loopIndex);
    if (delayMs === null) {
      continue;
    }
    const timer = setTimeout(() => {
      params.onLine(localizedText(line.text, params.isEnglishCopy));
    }, delayMs);
    timers.push(timer);
  }
  return {
    cancel: () => {
      timers.forEach(t => clearTimeout(t));
    },
  };
};

export interface ScheduleSelfPacedTimedLinesParams {
  lines: ReadonlyArray<{ afterLoopStartSeconds: number; text: TutorialLocalizedText }>;
  isEnglishCopy: boolean;
  onLine: (text: string) => void;
}

export const scheduleSelfPacedTimedLines = (
  params: ScheduleSelfPacedTimedLinesParams,
): DialogueScheduleHandle => {
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const line of params.lines) {
    const delayMs = Math.max(0, line.afterLoopStartSeconds) * 1000;
    const timer = setTimeout(() => {
      params.onLine(localizedText(line.text, params.isEnglishCopy));
    }, delayMs);
    timers.push(timer);
  }
  return {
    cancel: () => {
      timers.forEach(t => clearTimeout(t));
    },
  };
};
