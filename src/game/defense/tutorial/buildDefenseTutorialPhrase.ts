import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type {
  DefensePhrase,
  DefensePhraseChord,
  DefenseStage,
  DefenseStaffLayout,
} from '@/game/defense/defenseTypes';
import type { NotationInstrumentId } from '@/utils/notationInstrument';
import {
  getNotationInstrumentPreset,
  transposeWrittenNoteName,
} from '@/utils/notationInstrument';
import {
  DEFENSE_TUTORIAL_BEATS_PER_BAR,
  DEFENSE_TUTORIAL_BPM,
  DEFENSE_TUTORIAL_KEY_FIFTHS,
  DEFENSE_TUTORIAL_LOOP_SEC,
  DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES,
  type DefenseTutorialConcertOctave,
} from '@/game/defense/tutorial/defenseTutorialConstants';
import {
  resolveTutorialClef,
  resolveTutorialLayoutWrittenOffset,
  resolveTutorialWrittenOffset,
  type DefenseTutorialNotationSettings,
} from '@/game/defense/tutorial/defenseTutorialNotation';

const CONCERT_NOTE_NAMES = ['C', 'D', 'E'] as const;

const midiFromConcert = (octave: DefenseTutorialConcertOctave, pitchClass: number): number => (
  (octave + 1) * 12 + pitchClass
);

/** Pick readable concert octave for written display after transposition. */
export const pickDefenseTutorialConcertOctave = (
  settings: DefenseTutorialNotationSettings,
): DefenseTutorialConcertOctave => {
  const clef = resolveTutorialClef(settings);
  const writtenOffset = resolveTutorialLayoutWrittenOffset(settings);
  if (clef === 'bass') {
    return 3;
  }

  const trialOctaves: DefenseTutorialConcertOctave[] = [4, 3, 5];
  for (const octave of trialOctaves) {
    const writtenMidis = DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES.map((pc) => {
      const concertMidi = midiFromConcert(octave, pc);
      return concertMidi + writtenOffset;
    });
    const maxWritten = Math.max(...writtenMidis);
    const minWritten = Math.min(...writtenMidis);
    if (clef === 'treble' && maxWritten <= 84 && minWritten >= 55) {
      return octave;
    }
    if (maxWritten <= 84 && minWritten >= 48) {
      return octave;
    }
  }

  const presetOctaveOffset = getNotationInstrumentPreset(settings.notationInstrumentId).octaveOffset;
  if (presetOctaveOffset < 0 || writtenOffset >= 12) {
    return 3;
  }
  return 4;
};

export interface DefenseTutorialPhraseBuildResult {
  readonly stage: DefenseStage;
  readonly phrase: DefensePhrase;
  readonly chord: DefensePhraseChord;
  readonly staffGroups: readonly ChordVoicingStaffGroup[];
  readonly concertMidis: readonly [number, number, number];
  readonly recommendedMidis: readonly [number, number, number];
  readonly concertOctave: DefenseTutorialConcertOctave;
}

const buildStaffGroups = (
  writtenNoteNames: readonly [string, string, string],
): readonly ChordVoicingStaffGroup[] => {
  const noteGroups: ChordVoicingStaffGroup[] = writtenNoteNames.map((name, index) => ({
    id: `tutorial-note-${index}`,
    chordName: index === 0 ? 'CDE' : '',
    voicing: [name],
    voicingStaves: [1],
    measureOffset: 0,
    noteValue: 'quarter' as const,
    beatIndex: index,
  }));
  return [
    ...noteGroups,
    {
      id: 'tutorial-rest',
      chordName: '',
      voicing: [],
      measureOffset: 0,
      isRest: true,
      noteValue: 'quarter' as const,
      beatIndex: 3,
    },
  ];
};

export const buildDefenseTutorialPhrase = (
  settings: DefenseTutorialNotationSettings,
  audioUrl: string,
): DefenseTutorialPhraseBuildResult => {
  const concertOctave = pickDefenseTutorialConcertOctave(settings);
  const writtenOffset = resolveTutorialWrittenOffset(settings);
  const clef = resolveTutorialClef(settings);
  const staffLayout: DefenseStaffLayout = clef === 'bass' ? 'treble' : 'treble';

  const concertMidis = DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES.map(
    (pc) => midiFromConcert(concertOctave, pc),
  ) as [number, number, number];

  const writtenNoteNames = concertMidis.map((concertMidi, index) => {
    const concertName = `${CONCERT_NOTE_NAMES[index]}${concertOctave}`;
    return transposeWrittenNoteName(concertName, writtenOffset, DEFENSE_TUTORIAL_KEY_FIFTHS);
  }) as [string, string, string];

  const notes = DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES.map((pitchClass, stepIndex) => ({
    orderIndex: stepIndex,
    pitchMidi: concertMidis[stepIndex],
    pitchClass,
    noteName: writtenNoteNames[stepIndex],
    staff: 1 as const,
    stepIndex,
  }));

  const chord: DefensePhraseChord = {
    id: 'tutorial-cde-chord',
    orderIndex: 0,
    chordName: 'CDE',
    measureNumber: 1,
    notes,
  };

  const phrase: DefensePhrase = {
    id: 'tutorial-cde-phrase',
    orderIndex: 0,
    title: 'Input setup',
    audioUrl,
    keyFifths: DEFENSE_TUTORIAL_KEY_FIFTHS,
    requiredCompletionCount: 1,
    chords: [chord],
  };

  const stage: DefenseStage = {
    id: 'defense-tutorial-input-setup',
    slug: 'defense-tutorial-input-setup',
    stageNumber: 0,
    title: 'はじめての設定',
    titleEn: 'First-time setup',
    bpm: DEFENSE_TUTORIAL_BPM,
    beatsPerBar: DEFENSE_TUTORIAL_BEATS_PER_BAR,
    phraseBars: 1,
    staffLayout,
    attackTrigger: 'note',
    keyFifths: DEFENSE_TUTORIAL_KEY_FIFTHS,
    requiredCompletionCount: 1,
    difficultyLevel: 1,
    surviveSeconds: 9999,
    playerHp: 100,
    productionStaffHintMode: 'always',
    productionKeyboardHintMode: 'always',
    phrases: [phrase],
  };

  return {
    stage,
    phrase,
    chord,
    staffGroups: buildStaffGroups(writtenNoteNames),
    concertMidis,
    recommendedMidis: concertMidis,
    concertOctave,
  };
};

/** Placeholder URL; tutorial play uses synthesized buffer when this fails. */
export const DEFENSE_TUTORIAL_AUDIO_URL =
  'https://jazzify-cdn.com/sozai/defense-tutorial-cde-bpm100.mp3';

export const defaultTutorialNotationSettings = (
  notationInstrumentId: NotationInstrumentId,
  notationOctaveShift = 0,
): DefenseTutorialNotationSettings => ({
  notationInstrumentId,
  notationOctaveShift,
  clefOverride: null,
  transpositionOverride: null,
});
