import {
  buildPrecisionNotesFromMidi,
} from '@/utils/earTrainingPrecisionMidi';
import {
  buildPrecisionNotesFromMusicXml,
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
  resolveCalibratedStartSec: (startSec: number) => number;
  practiceMode: boolean;
  practiceSpeedPercent: number;
  classificationBpm: number;
}

export const buildPrecisionNotesBySemitone = (
  params: BuildPrecisionNotesBySemitoneParams,
): Map<number, PrecisionNote[]> => {
  const semitones = loopPracticeUniqueSemitones(params.direction);
  const result = new Map<number, PrecisionNote[]>();

  for (const semitone of semitones) {
    let builtNotes: PrecisionNote[] = [];
    if (params.midiData) {
      builtNotes = buildPrecisionNotesFromMidi(
        params.midiData,
        params.bpm,
        semitone,
      ).notes;
    } else if (params.xmlText) {
      builtNotes = buildPrecisionNotesFromMusicXml(
        params.xmlText,
        params.bpm,
        params.beatsPerMeasure,
        semitone,
        params.isSwing,
      ).notes;
    }
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
