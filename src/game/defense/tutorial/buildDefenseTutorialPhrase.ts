import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type {
  DefensePhrase,
  DefensePhraseChord,
  DefenseStage,
  DefenseStaffLayout,
} from '@/game/defense/defenseTypes';
import type { NotationInstrumentId } from '@/utils/notationInstrument';
import {
  DEFENSE_TUTORIAL_BASS_WRITTEN_OCTAVE,
  DEFENSE_TUTORIAL_BEATS_PER_BAR,
  DEFENSE_TUTORIAL_BPM,
  DEFENSE_TUTORIAL_KEY_FIFTHS,
  DEFENSE_TUTORIAL_SOLFEGE_LABELS,
  DEFENSE_TUTORIAL_TARGET_CONCERT_MIDI,
  DEFENSE_TUTORIAL_WRITTEN_PITCH_CLASSES,
  type DefenseTutorialWrittenOctave,
} from '@/game/defense/tutorial/defenseTutorialConstants';
import {
  resolveTutorialClef,
  resolveTutorialVoicingStaff,
  resolveTutorialWrittenOffset,
  type DefenseTutorialNotationSettings,
} from '@/game/defense/tutorial/defenseTutorialNotation';

const CONCERT_NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const concertMidiToName = (midi: number): string => {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${CONCERT_NOTE_NAMES[pitchClass]}${octave}`;
};

const midiFromWritten = (octave: number, pitchClass: number): number => (
  (octave + 1) * 12 + pitchClass
);

/** Pick written octave: bass uses C3, otherwise closest concert C4. */
export const pickDefenseTutorialWrittenOctave = (
  settings: DefenseTutorialNotationSettings,
): DefenseTutorialWrittenOctave => {
  if (resolveTutorialClef(settings) === 'bass') {
    return DEFENSE_TUTORIAL_BASS_WRITTEN_OCTAVE;
  }

  const writtenOffset = resolveTutorialWrittenOffset(settings);
  const candidateOctaves: DefenseTutorialWrittenOctave[] = [3, 4, 5, 6];

  let bestOctave: DefenseTutorialWrittenOctave = 4;
  let bestDistance = Number.POSITIVE_INFINITY;

  candidateOctaves.forEach((octave) => {
    const concertMidiC = midiFromWritten(octave, 0) - writtenOffset;
    const distance = Math.abs(concertMidiC - DEFENSE_TUTORIAL_TARGET_CONCERT_MIDI);
    if (distance < bestDistance || (distance === bestDistance && octave > bestOctave)) {
      bestDistance = distance;
      bestOctave = octave;
    }
  });

  return bestOctave;
};

export interface DefenseTutorialPhraseBuildResult {
  readonly stage: DefenseStage;
  readonly phrase: DefensePhrase;
  readonly chord: DefensePhraseChord;
  readonly staffGroups: readonly ChordVoicingStaffGroup[];
  readonly concertMidis: readonly [number, number, number];
  readonly recommendedMidis: readonly [number, number, number];
  readonly writtenOctave: DefenseTutorialWrittenOctave;
}

const buildStaffGroups = (
  writtenNoteNames: readonly [string, string, string],
  voicingStaff: 1 | 2,
): readonly ChordVoicingStaffGroup[] => (
  writtenNoteNames.map((name, index) => ({
    id: `tutorial-note-${index}`,
    chordName: DEFENSE_TUTORIAL_SOLFEGE_LABELS[index] ?? '',
    voicing: [name],
    voicingStaves: [voicingStaff],
    measureOffset: 0,
    noteValue: 'whole' as const,
  }))
);

export const buildDefenseTutorialPhrase = (
  settings: DefenseTutorialNotationSettings,
  audioUrl: string,
): DefenseTutorialPhraseBuildResult => {
  const writtenOctave = pickDefenseTutorialWrittenOctave(settings);
  const clef = resolveTutorialClef(settings);
  const writtenOffset = resolveTutorialWrittenOffset(
    clef === 'bass'
      ? { ...settings, notationOctaveShift: 0 }
      : settings,
  );
  const voicingStaff = resolveTutorialVoicingStaff(clef);
  const staffLayout: DefenseStaffLayout = 'treble';

  const writtenMidis = DEFENSE_TUTORIAL_WRITTEN_PITCH_CLASSES.map(
    (pitchClass) => midiFromWritten(writtenOctave, pitchClass),
  ) as [number, number, number];

  const concertMidis = writtenMidis.map(
    (writtenMidi) => writtenMidi - writtenOffset,
  ) as [number, number, number];

  const writtenNoteNames = writtenMidis.map(concertMidiToName) as [string, string, string];
  const concertNoteNames = concertMidis.map(concertMidiToName) as [string, string, string];

  const notes = DEFENSE_TUTORIAL_WRITTEN_PITCH_CLASSES.map((_, stepIndex) => ({
    orderIndex: stepIndex,
    pitchMidi: concertMidis[stepIndex],
    pitchClass: ((concertMidis[stepIndex] % 12) + 12) % 12,
    noteName: concertNoteNames[stepIndex],
    staff: voicingStaff,
    stepIndex,
  }));

  const chord: DefensePhraseChord = {
    id: 'tutorial-cde-chord',
    orderIndex: 0,
    chordName: 'ドレミ',
    measureNumber: 1,
    notes,
  };

  const phrase: DefensePhrase = {
    id: 'tutorial-cde-phrase',
    orderIndex: 0,
    title: 'Input setup',
    audioUrl,
    loopStartMeasure: null,
    loopEndMeasure: null,
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
    audioRegistrationMode: 'per_phrase',
    audioUrl: null,
    melodyAudioUrl: null,
    progressionBars: null,
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
    progressionChords: [],
  };

  return {
    stage,
    phrase,
    chord,
    staffGroups: buildStaffGroups(writtenNoteNames, voicingStaff),
    concertMidis,
    recommendedMidis: concertMidis,
    writtenOctave,
  };
};

/** Placeholder URL; tutorial play uses synthesized buffer when this fails. */
export const DEFENSE_TUTORIAL_AUDIO_URL =
  'https://jazzify-cdn.com/sozai/defense-tutorial-cde-bpm60.mp3';

export const defaultTutorialNotationSettings = (
  notationInstrumentId: NotationInstrumentId,
  notationOctaveShift = 0,
): DefenseTutorialNotationSettings => ({
  notationInstrumentId,
  notationOctaveShift,
  clefOverride: null,
  transpositionOverride: null,
});
