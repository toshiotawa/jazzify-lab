/**
 * Separate-tracks defense mode: K-cycle grid, phrase windows, reservation math.
 */

export type SeparateTracksPhraseBars = 1 | 2 | 4;

export interface SeparateTracksGrid {
  readonly cycleFrames: number;
  readonly cyclesPerForm: number;
  readonly bgmFrames: number;
  readonly beatFrames: number;
  readonly sampleRate: number;
  readonly phraseBars: SeparateTracksPhraseBars;
  readonly progressionBars: number;
  readonly playbackRatio: number;
}

export interface PhraseLoopWindow {
  readonly rank: number;
  readonly startMeasure: number;
  readonly endMeasure: number;
  readonly sourceStartFrame: number;
  readonly sourceEndFrame: number;
}

export interface PhraseSchedule {
  readonly targetCycle: number;
  readonly phraseIndex: number;
  readonly revision: number;
  readonly generation: number;
  readonly immediate: boolean;
}

export interface PlanPhraseReservationParams {
  readonly absoluteCycle: number;
  readonly phaseFrame: number;
  readonly cycleFrames: number;
  readonly beatFrames: number;
  readonly phraseIndex: number;
  readonly revision: number;
  readonly generation: number;
}

const PHRASE_BARS_VALUES: readonly SeparateTracksPhraseBars[] = [1, 2, 4];

export const isSeparateTracksPhraseBars = (value: number): value is SeparateTracksPhraseBars => (
  PHRASE_BARS_VALUES.includes(value as SeparateTracksPhraseBars)
);

export const computeIdealCycleFrames = (
  sampleRate: number,
  bpm: number,
  beatsPerBar: number,
  phraseBars: number,
  playbackRatio: number,
): number => {
  const safeFs = Math.max(1, sampleRate);
  const safeBpm = Math.max(1, bpm);
  const safeBeats = Math.max(1, beatsPerBar);
  const safeK = Math.max(1, phraseBars);
  const safeRatio = Math.max(0.0001, playbackRatio);
  return (safeFs * 60 / safeBpm * safeBeats * safeK) / safeRatio;
};

export const computeSeparateTracksGrid = (params: {
  readonly sampleRate: number;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly phraseBars: SeparateTracksPhraseBars;
  readonly progressionBars: number;
  readonly playbackRatio: number;
}): SeparateTracksGrid => {
  const {
    sampleRate,
    bpm,
    beatsPerBar,
    phraseBars,
    progressionBars,
    playbackRatio,
  } = params;

  const cycleFrames = Math.round(computeIdealCycleFrames(
    sampleRate,
    bpm,
    beatsPerBar,
    phraseBars,
    playbackRatio,
  ));
  const safeF = Math.max(1, cycleFrames);
  const safeN = Math.max(1, progressionBars);
  const safeBeats = Math.max(1, beatsPerBar);
  const cyclesPerForm = Math.max(1, Math.trunc(safeN / phraseBars));
  const beatFrames = Math.max(1, Math.round(safeF / (safeBeats * phraseBars)));

  return {
    cycleFrames: safeF,
    cyclesPerForm,
    bgmFrames: cyclesPerForm * safeF,
    beatFrames,
    sampleRate,
    phraseBars,
    progressionBars: safeN,
    playbackRatio,
  };
};

export const computeMeasureSourceFrame = (
  measureNumber: number,
  bpm: number,
  beatsPerBar: number,
  sampleRate: number,
): number => {
  const safeMeasure = Math.max(0, measureNumber);
  const safeBpm = Math.max(1, bpm);
  const safeBeats = Math.max(1, beatsPerBar);
  const safeFs = Math.max(1, sampleRate);
  return Math.round((safeMeasure * safeBeats * 60 / safeBpm) * safeFs);
};

export const computePhraseLoopWindow = (
  rank: number,
  phraseBars: SeparateTracksPhraseBars,
  bpm: number,
  beatsPerBar: number,
  sampleRate: number,
): PhraseLoopWindow => {
  const startMeasure = rank * phraseBars + 1;
  const endMeasure = (rank + 1) * phraseBars;
  return {
    rank,
    startMeasure,
    endMeasure,
    sourceStartFrame: computeMeasureSourceFrame(startMeasure - 1, bpm, beatsPerBar, sampleRate),
    sourceEndFrame: computeMeasureSourceFrame(endMeasure, bpm, beatsPerBar, sampleRate),
  };
};

export const computeAllPhraseLoopWindows = (
  phraseCount: number,
  phraseBars: SeparateTracksPhraseBars,
  bpm: number,
  beatsPerBar: number,
  sampleRate: number,
): readonly PhraseLoopWindow[] => {
  const windows: PhraseLoopWindow[] = [];
  for (let rank = 0; rank < phraseCount; rank += 1) {
    windows.push(computePhraseLoopWindow(rank, phraseBars, bpm, beatsPerBar, sampleRate));
  }
  return windows;
};

export const computeExpectedSourceFrames = (
  barCount: number,
  bpm: number,
  beatsPerBar: number,
  sampleRate: number,
): number => (
  computeMeasureSourceFrame(barCount, bpm, beatsPerBar, sampleRate)
);

export const isSeparateTracksSourceFrameCountValid = (
  actualFrames: number,
  expectedFrames: number,
): boolean => Math.abs(actualFrames - expectedFrames) <= 1;

export interface PhraseLoopMeasureRow {
  readonly loopStartMeasure: number | null;
  readonly loopEndMeasure: number | null;
}

export const validatePhraseLoopMeasures = (
  phrasesSortedByOrderIndex: readonly PhraseLoopMeasureRow[],
  phraseBars: SeparateTracksPhraseBars,
): string | null => {
  if (phrasesSortedByOrderIndex.length === 0) {
    return 'separate tracks requires at least one phrase';
  }
  for (let rank = 0; rank < phrasesSortedByOrderIndex.length; rank += 1) {
    const expectedStart = rank * phraseBars + 1;
    const expectedEnd = (rank + 1) * phraseBars;
    const phrase = phrasesSortedByOrderIndex[rank];
    if (phrase.loopStartMeasure !== expectedStart || phrase.loopEndMeasure !== expectedEnd) {
      return `phrase rank ${rank} loop measures must be ${expectedStart}-${expectedEnd}`;
    }
  }
  return null;
};

export const validateSeparateTracksStageNumbers = (params: {
  readonly progressionBars: number | null;
  readonly phraseBars: number;
}): string | null => {
  const { progressionBars, phraseBars } = params;
  if (progressionBars === null || progressionBars <= 0) {
    return 'shared_progression_separate_tracks requires progressionBars';
  }
  if (!isSeparateTracksPhraseBars(phraseBars)) {
    return 'shared_progression_separate_tracks requires phraseBars in (1, 2, 4)';
  }
  if (progressionBars % phraseBars !== 0) {
    return 'progressionBars must be divisible by phraseBars';
  }
  return null;
};

export const planPhraseReservation = (
  params: PlanPhraseReservationParams,
): PhraseSchedule => {
  const {
    absoluteCycle,
    phaseFrame,
    cycleFrames,
    beatFrames,
    phraseIndex,
    revision,
    generation,
  } = params;

  const safeF = Math.max(1, cycleFrames);
  const safeBeat = Math.max(1, beatFrames);
  const safePhase = Math.max(0, Math.min(phaseFrame, safeF));

  if (safePhase <= safeBeat) {
    return {
      targetCycle: absoluteCycle,
      phraseIndex,
      revision,
      generation,
      immediate: true,
    };
  }

  const remainingFrames = safeF - safePhase;
  if (remainingFrames <= 0) {
    return {
      targetCycle: absoluteCycle,
      phraseIndex,
      revision,
      generation,
      immediate: true,
    };
  }

  return {
    targetCycle: absoluteCycle + 1,
    phraseIndex,
    revision,
    generation,
    immediate: false,
  };
};

export const computeBeatInForm = (
  absoluteCycle: number,
  phaseFrame: number,
  cycleFrames: number,
  phraseBars: number,
  beatsPerBar: number,
  cyclesPerForm: number,
): number => {
  const safeF = Math.max(1, cycleFrames);
  const safeQ = Math.max(1, cyclesPerForm);
  const safeK = Math.max(1, phraseBars);
  const safeBeats = Math.max(1, beatsPerBar);
  const cycleInForm = ((absoluteCycle % safeQ) + safeQ) % safeQ;
  const fraction = Math.max(0, Math.min(phaseFrame, safeF)) / safeF;
  return (cycleInForm * safeK + fraction * safeK) * safeBeats;
};

export const mapPhaseFrameForSpeedChange = (
  phaseFrame: number,
  oldCycleFrames: number,
  newCycleFrames: number,
): number => {
  const safeOld = Math.max(1, oldCycleFrames);
  const safeNew = Math.max(1, newCycleFrames);
  const fraction = Math.max(0, Math.min(phaseFrame, safeOld)) / safeOld;
  return Math.round(fraction * safeNew) % safeNew;
};

export const advanceTransportByElapsedFrames = (
  absoluteCycle: number,
  phaseFrame: number,
  cycleFrames: number,
  elapsedFrames: number,
): { readonly absoluteCycle: number; readonly phaseFrame: number } => {
  const safeF = Math.max(1, cycleFrames);
  const safePhase = Math.max(0, Math.min(phaseFrame, safeF));
  const safeElapsed = Math.max(0, elapsedFrames);
  const total = safePhase + safeElapsed;
  return {
    absoluteCycle: absoluteCycle + Math.floor(total / safeF),
    phaseFrame: total % safeF,
  };
};

export const computeBgmReadFrame = (
  absoluteCycle: number,
  phaseFrame: number,
  cycleFrames: number,
  cyclesPerForm: number,
): number => {
  const safeF = Math.max(1, cycleFrames);
  const safeQ = Math.max(1, cyclesPerForm);
  const cycleInForm = ((absoluteCycle % safeQ) + safeQ) % safeQ;
  const safePhase = Math.max(0, Math.min(phaseFrame, safeF - 1));
  return cycleInForm * safeF + safePhase;
};
