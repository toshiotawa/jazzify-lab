import {
  buildCanonicalPhraseNotes,
  canonicalNotesToPrecisionNotes,
} from '@/utils/earTrainingCanonicalPhraseNotes';
import {
  calibratePrecisionNotes,
  type PrecisionNote,
} from '@/utils/earTrainingPrecisionNotes';
import {
  loopPracticeUniqueSemitones,
  type LoopTransposeDirection,
} from '@/utils/earTrainingPrecisionLoop';

export interface BuildPrecisionNotesBySemitoneParams {
  xmlText: string | null;
  midiData: Uint8Array | null;
  bpm: number;
  beatsPerMeasure: number;
  isSwing: boolean;
  direction: LoopTransposeDirection;
  baseSemitone?: number;
  resolveCalibratedStartSec: (startSec: number) => number;
  practiceMode: boolean;
  practiceSpeedPercent: number;
  classificationBpm: number;
  audioAnchorMs?: number | null;
}

export const buildPrecisionNotesBySemitone = (
  params: BuildPrecisionNotesBySemitoneParams,
): Map<number, PrecisionNote[]> => {
  const semitones = loopPracticeUniqueSemitones(params.direction, params.baseSemitone ?? 0);
  const result = new Map<number, PrecisionNote[]>();

  for (const semitone of semitones) {
    const canonical = buildCanonicalPhraseNotes({
      musicXmlText: params.xmlText,
      midiData: params.midiData,
      bpm: params.bpm,
      beatsPerMeasure: params.beatsPerMeasure,
      isSwing: params.isSwing,
      transposeOffset: semitone,
      audioAnchorMs: params.audioAnchorMs,
    });
    const builtNotes = canonicalNotesToPrecisionNotes(canonical.notes, params.classificationBpm);
    const calibratedNotes = calibratePrecisionNotes(builtNotes, {
      resolveCalibratedStartSec: params.resolveCalibratedStartSec,
      practiceMode: params.practiceMode,
      practiceSpeedPercent: params.practiceSpeedPercent,
      classificationBpm: params.classificationBpm,
    });
    result.set(semitone, calibratedNotes);
  }

  return result;
};
