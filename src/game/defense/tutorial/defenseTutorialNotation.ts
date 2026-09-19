import {
  formatNotationClefLabel,
  getNotationInstrumentPreset,
  getWrittenSemitoneOffset,
  transposeKeyFifths,
  type NotationInstrumentClef,
  type NotationInstrumentId,
} from '@/utils/notationInstrument';
export interface DefenseTutorialNotationSettings {
  readonly notationInstrumentId: NotationInstrumentId;
  readonly notationOctaveShift: number;
  readonly clefOverride: NotationInstrumentClef | null;
  /** Written transposition semitones; null = use preset.transposition */
  readonly transpositionOverride: number | null;
}

export const resolveTutorialClef = (
  settings: DefenseTutorialNotationSettings,
): NotationInstrumentClef => {
  if (settings.clefOverride) {
    return settings.clefOverride;
  }
  return getNotationInstrumentPreset(settings.notationInstrumentId).clef;
};

export const resolveTutorialTransposition = (
  settings: DefenseTutorialNotationSettings,
): number => {
  if (settings.transpositionOverride !== null) {
    return settings.transpositionOverride;
  }
  return getNotationInstrumentPreset(settings.notationInstrumentId).transposition;
};

const resolveTutorialPresetWithTransposition = (
  settings: DefenseTutorialNotationSettings,
) => {
  const preset = getNotationInstrumentPreset(settings.notationInstrumentId);
  const transposition = resolveTutorialTransposition(settings);
  return transposition === preset.transposition
    ? preset
    : { ...preset, transposition };
};

export const resolveTutorialWrittenOffset = (
  settings: DefenseTutorialNotationSettings,
): number => getWrittenSemitoneOffset(
  resolveTutorialPresetWithTransposition(settings),
  settings.notationOctaveShift,
);

/** Concert key signature for the instrument's sounding do-re-mi (Bb=-2, F=-1, Eb=-3). */
export const resolveTutorialConcertKeyFifths = (
  settings: DefenseTutorialNotationSettings,
): number => transposeKeyFifths(0, resolveTutorialTransposition(settings));

const WRITTEN_KEY_BY_TRANSPOSITION: Readonly<Record<number, string>> = {
  0: 'C',
  [-2]: 'B♭',
  [-7]: 'F',
  [-9]: 'E♭',
};

const formatWrittenKeyLabel = (transpositionSemitones: number): string => {
  const key = WRITTEN_KEY_BY_TRANSPOSITION[transpositionSemitones];
  if (key) {
    return `in ${key}`;
  }
  const sign = transpositionSemitones > 0 ? '+' : '';
  return `in C${sign}${transpositionSemitones}`;
};

/** e.g. "in E♭・ト音記号" */
export const formatTutorialNotationLabel = (
  settings: DefenseTutorialNotationSettings,
  isEnglishCopy: boolean,
): string => {
  const clef = resolveTutorialClef(settings);
  const clefLabel = formatNotationClefLabel(clef === 'grand' ? 'treble' : clef, isEnglishCopy);
  const transposition = resolveTutorialTransposition(settings);
  const keyLabel = formatWrittenKeyLabel(transposition);
  const sep = isEnglishCopy ? ' · ' : '・';
  return `${keyLabel}${sep}${clefLabel}`;
};

export const formatTutorialPlaySubtitle = (
  concertMidis: readonly [number, number, number],
  isEnglishCopy: boolean,
): string => {
  const label = formatTutorialSoundNoteNames(concertMidis);
  return isEnglishCopy ? `Sound: ${label}` : `音：${label}`;
};

export const formatTutorialSoundNoteNames = (
  concertMidis: readonly [number, number, number],
): string => (
  concertMidis.map((midi) => formatMidiNoteName(midi)).join(' · ')
);

const formatMidiNoteName = (midi: number): string => {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
  return `${names[pitchClass]}${octave}`;
};
