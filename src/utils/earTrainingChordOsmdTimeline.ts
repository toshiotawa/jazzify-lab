import {
  CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC,
  CHORD_OSMD_HAMMER_LEAD_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_SEC,
  type ChordOsmdRhythmTarget,
} from '@/utils/earTrainingChordOsmd';

export const CHORD_OSMD_PHRASE_END_PADDING_SEC = 0.08;

const normalizeAudioUrl = (url: string | null | undefined): string => (
  url?.trim() ?? ''
);

/** チュートリアル OSMD: フレーズ MP3 がある、または URL が同一なら補助ドラムループは不要。 */
export const shouldStartTutorialOsmdDrumLoop = (
  phraseAudioUrl: string | null | undefined,
  drumLoopUrl: string | null | undefined,
): boolean => {
  const phrase = normalizeAudioUrl(phraseAudioUrl);
  const drum = normalizeAudioUrl(drumLoopUrl);
  if (!drum) {
    return false;
  }
  if (phrase) {
    return false;
  }
  return phrase !== drum;
};

export const computeChordOsmdPhraseLoopEndSec = (
  phraseLoopDurationSec: number,
  targets: readonly Pick<ChordOsmdRhythmTarget, 'targetTimeSec'>[],
): number => {
  const lastTarget = targets[targets.length - 1];
  const lastTargetEnd = (lastTarget?.targetTimeSec ?? 0)
    + CHORD_OSMD_JUDGMENT_WINDOW_SEC
    + CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC;
  const safeLoop = Number.isFinite(phraseLoopDurationSec) && phraseLoopDurationSec > 0
    ? phraseLoopDurationSec
    : 0;
  return Math.max(safeLoop, lastTargetEnd) + CHORD_OSMD_PHRASE_END_PADDING_SEC;
};

/** `startIndex` 以降で `phraseTimeSec` 時点までに投擲すべきハンマー数（テスト用）。 */
export const countChordOsmdHammersDueFromIndex = (
  targets: readonly Pick<ChordOsmdRhythmTarget, 'targetTimeSec'>[],
  phraseTimeSec: number,
  startIndex: number,
): number => {
  let count = 0;
  for (let i = Math.max(0, startIndex); i < targets.length; i += 1) {
    const throwTime = targets[i].targetTimeSec - CHORD_OSMD_HAMMER_LEAD_SEC;
    if (phraseTimeSec + 1e-9 < throwTime) {
      break;
    }
    count += 1;
  }
  return count;
};

export const computeChordOsmdScoreMaxMeasure = (
  phraseLoopDurationSec: number,
  bpm: number,
  beatsPerMeasure: number,
  loopMeasures: number,
  targets: readonly Pick<ChordOsmdRhythmTarget, 'measureNumber'>[],
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  const targetMaxMeasure = targets.reduce((max, t) => Math.max(max, t.measureNumber), 1);
  const loopMeasureCapFromPhraseDuration = phraseLoopDurationSec > 0
    ? Math.min(512, Math.max(1, Math.ceil(phraseLoopDurationSec / measureDurationSec)))
    : loopMeasures;
  return Math.max(loopMeasureCapFromPhraseDuration, loopMeasures, targetMaxMeasure);
};

export const computeChordOsmdActiveMeasureNumber = (
  phraseTimeSec: number,
  bpm: number,
  beatsPerMeasure: number,
  phraseLoopDurationSec: number,
  loopMeasures: number,
  targets: readonly Pick<ChordOsmdRhythmTarget, 'measureNumber'>[],
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  if (measureDurationSec <= 0) {
    return 1;
  }
  const rawMeasure = Math.floor(phraseTimeSec / measureDurationSec) + 1;
  const maxMeasure = computeChordOsmdScoreMaxMeasure(
    phraseLoopDurationSec,
    bpm,
    beatsPerMeasure,
    loopMeasures,
    targets,
  );
  return Math.max(1, Math.min(maxMeasure, rawMeasure));
};

export interface OsmdMeasurePlayheadState {
  measureNumber: number;
  progressInMeasure: number;
}

/** フレーズ時刻から OSMD 小節番号と小節内進捗（0..1）を算出する。 */
export const computeOsmdMeasurePlayheadState = (
  phraseTimeSec: number,
  bpm: number,
  beatsPerMeasure: number,
  phraseLoopDurationSec: number,
  loopMeasures: number,
  targets: readonly Pick<ChordOsmdRhythmTarget, 'measureNumber'>[],
): OsmdMeasurePlayheadState => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  if (measureDurationSec <= 0) {
    return { measureNumber: 1, progressInMeasure: 0 };
  }
  const measureNumber = computeChordOsmdActiveMeasureNumber(
    phraseTimeSec,
    bpm,
    beatsPerMeasure,
    phraseLoopDurationSec,
    loopMeasures,
    targets,
  );
  const timeInMeasure = phraseTimeSec - (measureNumber - 1) * measureDurationSec;
  const progressInMeasure = Math.max(0, Math.min(1, timeInMeasure / measureDurationSec));
  return { measureNumber, progressInMeasure };
};
