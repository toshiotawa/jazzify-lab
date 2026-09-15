import { buildTrainingQuestion } from '@/game/training/trainingQuestionBuilder';
import { mapTrainingConfig } from '@/game/training/mapTrainingConfig';
import type { TrainingRow } from '@/game/training/trainingTypes';

describe('mapTrainingConfig', () => {
  it('maps snake_case voicing fields from DB JSONB', () => {
    const config = mapTrainingConfig({
      voicing_notes: ['E3', 'A3', 'D4', 'G4', 'B4'],
      staves: [2, 2, 1, 1, 1],
      roots: ['C', 'D', 'E'],
      min_lowest_note: 'E3',
      reference_root: 'C',
    });

    expect(config).toEqual({
      voicingNotes: ['E3', 'A3', 'D4', 'G4', 'B4'],
      staves: [2, 2, 1, 1, 1],
      roots: ['C', 'D', 'E'],
      minLowestNote: 'E3',
      referenceRoot: 'C',
    });
  });

  it('prefers camelCase when both snake_case and camelCase are present', () => {
    const config = mapTrainingConfig({
      voicing_notes: ['C3'],
      voicingNotes: ['E3', 'A3'],
      include_accidentals: false,
      includeAccidentals: true,
      min_lowest_note: 'C3',
      minLowestNote: 'E3',
      reference_root: 'D',
      referenceRoot: 'C',
    });

    expect(config.voicingNotes).toEqual(['E3', 'A3']);
    expect(config.includeAccidentals).toBe(true);
    expect(config.minLowestNote).toBe('E3');
    expect(config.referenceRoot).toBe('C');
  });

  it('maps include_accidentals for note reading configs', () => {
    const config = mapTrainingConfig({
      clef: 'treble',
      include_accidentals: true,
    });

    expect(config).toEqual({
      clef: 'treble',
      includeAccidentals: true,
    });
  });

  it('maps progression config from DB JSONB', () => {
    const config = mapTrainingConfig({
      unit_size: 3,
      shuffle_units: true,
      reference_key: 'F',
      reference_chords: [
        { name: 'Gm7(9)', notes: ['F3', 'Bb3', 'D4', 'A4'] },
      ],
      progression: [
        {
          name: 'Dm7(9)',
          voicing: [53, 57, 60, 64],
          voicing_names: ['F3', 'A3', 'C4', 'E4'],
          key_fifths: 0,
        },
      ],
    });

    expect(config.unitSize).toBe(3);
    expect(config.shuffleUnits).toBe(true);
    expect(config.referenceKey).toBe('F');
    expect(config.referenceChords?.[0]?.name).toBe('Gm7(9)');
    expect(config.progression?.[0]?.voicingNames).toEqual(['F3', 'A3', 'C4', 'E4']);
    expect(config.progression?.[0]?.keyFifths).toBe(0);
  });

  it('returns empty config for non-object input', () => {
    expect(mapTrainingConfig(null)).toEqual({});
    expect(mapTrainingConfig(undefined)).toEqual({});
    expect(mapTrainingConfig('invalid')).toEqual({});
  });

  it('builds two-hand-m7-so-what questions after mapping DB config', () => {
    const dbConfig = {
      voicing_notes: ['E3', 'A3', 'D4', 'G4', 'B4'],
      staves: [2, 2, 1, 1, 1],
      roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'],
      min_lowest_note: 'E3',
      reference_root: 'C',
    };

    const training: TrainingRow = {
      id: 't1',
      categoryId: 'c1',
      slug: 'two-hand-m7-so-what',
      titleJa: 'M7 So What',
      titleEn: 'M7 So What',
      sortOrder: 1,
      kind: 'voicing',
      clefMode: 'grand_concert',
      useKeySignature: false,
      playRootOnCorrect: true,
      bgmUrl: '',
      config: mapTrainingConfig(dbConfig),
      isActive: true,
    };

    const question = buildTrainingQuestion({
      training: {
        ...training,
        config: { ...training.config, roots: ['C'] },
      },
      notationInstrumentId: 'piano',
      notationOctaveShift: 0,
      ignoreNotationInstrument: true,
    });

    expect(question.notes.map((note) => note.noteName)).toEqual(['E3', 'A3', 'D4', 'G4', 'B4']);
    expect(question.notes.map((note) => note.staff)).toEqual([2, 2, 1, 1, 1]);
    expect(question.promptLabel).toBe('CM7 So What');
  });
});
