import {
  advanceTrainingProgressionCursor,
  buildTrainingProgressionUnits,
  collectTrainingProgressionMidis,
  pickInitialProgressionCursor,
} from '@/game/training/trainingProgression';
import type { TrainingRow } from '@/game/training/trainingTypes';
import { mapTrainingConfig } from '@/game/training/mapTrainingConfig';
import {
  ABA_VOICINGS_BY_KEY,
  ALL_MAJOR_KEYS,
  BAB_VOICINGS_BY_KEY,
} from '@/utils/twoHandVoicingIntermediateCourse';

const baseTraining = (overrides: Partial<TrainingRow>): TrainingRow => ({
  id: 't-progression',
  categoryId: 'c1',
  slug: 'test-progression',
  titleJa: 'テスト進行',
  titleEn: 'Test Progression',
  sortOrder: 1,
  kind: 'progression',
  clefMode: 'grand_concert',
  useKeySignature: true,
  playRootOnCorrect: true,
  bgmUrl: '',
  config: {},
  isActive: true,
  ...overrides,
});

describe('trainingProgression', () => {
  describe('reference-key transposition (A-B-A)', () => {
    const abaTraining = baseTraining({
      config: mapTrainingConfig({
        reference_key: 'F',
        voicing_form: 'aba',
        shuffle_units: true,
        staves: [2, 1, 1, 1],
        reference_chords: [
          { name: 'Gm7(9)', notes: ['F3', 'Bb3', 'D4', 'A4'] },
          { name: 'C7(9.13)', notes: ['E3', 'Bb3', 'D4', 'A4'] },
          { name: 'FM7(9)', notes: ['E3', 'A3', 'C4', 'G4'] },
        ],
      }),
    });

    it('builds 12 keys matching ABA_VOICINGS_BY_KEY spellings and chord names', () => {
      const units = buildTrainingProgressionUnits(abaTraining);
      expect(units).toHaveLength(12);
      for (const key of ALL_MAJOR_KEYS) {
        const unit = units.find((u) => u.keyFifths === ABA_VOICINGS_BY_KEY[key].keyFifths);
        expect(unit).toBeDefined();
        const expected = ABA_VOICINGS_BY_KEY[key];
        expect(unit?.questions).toHaveLength(3);
        expect(unit?.questions[0]?.promptLabel).toBe(expected.ii.displayName);
        expect(unit?.questions[0]?.notes.map((n) => n.noteName)).toEqual([...expected.ii.notes]);
        expect(unit?.questions[1]?.promptLabel).toBe(expected.v.displayName);
        expect(unit?.questions[1]?.notes.map((n) => n.noteName)).toEqual([...expected.v.notes]);
        expect(unit?.questions[2]?.promptLabel).toBe(expected.i.displayName);
        expect(unit?.questions[2]?.notes.map((n) => n.noteName)).toEqual([...expected.i.notes]);
        expect(unit?.questions[0]?.notes.map((n) => n.staff)).toEqual([2, 1, 1, 1]);
      }
    });

    it('sets keyFifths from major key table when useKeySignature is true', () => {
      const units = buildTrainingProgressionUnits(abaTraining);
      const cUnit = units.find((u) => u.keyFifths === 0);
      expect(cUnit?.questions[0]?.keyFifths).toBe(0);
    });

    it('zeros keyFifths when useKeySignature is false', () => {
      const units = buildTrainingProgressionUnits({
        ...abaTraining,
        useKeySignature: false,
      });
      expect(units[0]?.questions[0]?.keyFifths).toBe(0);
    });
  });

  describe('reference-key transposition (B-A-B, Bb reference)', () => {
    const babTraining = baseTraining({
      config: mapTrainingConfig({
        reference_key: 'Bb',
        voicing_form: 'bab',
        shuffle_units: true,
        staves: [2, 1, 1, 1],
        reference_chords: [
          { name: 'Cm7(9)', notes: ['Eb3', 'Bb3', 'D4', 'G4'] },
          { name: 'F7(9.13)', notes: ['Eb3', 'A3', 'D4', 'G4'] },
          { name: 'BbM7(9)', notes: ['D3', 'A3', 'C4', 'F4'] },
        ],
      }),
    });

    it('matches BAB_VOICINGS_BY_KEY for all keys', () => {
      const units = buildTrainingProgressionUnits(babTraining);
      for (const key of ALL_MAJOR_KEYS) {
        const expected = BAB_VOICINGS_BY_KEY[key];
        const unit = units.find((u) => u.keyFifths === expected.keyFifths);
        expect(unit?.questions[0]?.notes.map((n) => n.noteName)).toEqual([...expected.ii.notes]);
        expect(unit?.questions[1]?.notes.map((n) => n.noteName)).toEqual([...expected.v.notes]);
        expect(unit?.questions[2]?.notes.map((n) => n.noteName)).toEqual([...expected.i.notes]);
      }
    });
  });

  describe('precomputed progression units', () => {
    const iiViTraining = baseTraining({
      clefMode: 'bass_concert',
      config: mapTrainingConfig({
        unit_size: 3,
        shuffle_units: true,
        progression: [
          {
            name: 'Dm7(9)',
            voicing: [53, 57, 60, 64],
            voicing_names: ['F3', 'A3', 'C4', 'E4'],
            key_fifths: 0,
          },
          {
            name: 'G7(9.13)',
            voicing: [51, 55, 57, 62],
            voicing_names: ['Eb3', 'G3', 'A3', 'D4'],
            key_fifths: 0,
          },
          {
            name: 'CM7(9)',
            voicing: [52, 55, 59, 62],
            voicing_names: ['E3', 'G3', 'B3', 'D4'],
            key_fifths: 0,
          },
          {
            name: 'Gm7(9)',
            voicing: [50, 55, 58, 62],
            voicing_names: ['D3', 'G3', 'Bb3', 'D4'],
            key_fifths: -1,
          },
          {
            name: 'C7(9.13)',
            voicing: [48, 53, 55, 60],
            voicing_names: ['C3', 'F3', 'G3', 'C4'],
            key_fifths: -1,
          },
          {
            name: 'FM7(9)',
            voicing: [52, 55, 57, 60],
            voicing_names: ['E3', 'G3', 'A3', 'C4'],
            key_fifths: -1,
          },
        ],
      }),
    });

    it('splits progression into units of unit_size', () => {
      const units = buildTrainingProgressionUnits(iiViTraining);
      expect(units).toHaveLength(2);
      expect(units[0]?.questions).toHaveLength(3);
      expect(units[1]?.questions).toHaveLength(3);
      expect(units[0]?.questions[0]?.promptLabel).toBe('Dm7(9)');
      expect(units[1]?.questions[0]?.promptLabel).toBe('Gm7(9)');
    });

    it('assigns bass staff when voicing_staves is missing on bass_concert progression', () => {
      const units = buildTrainingProgressionUnits(iiViTraining);
      for (const unit of units) {
        for (const question of unit.questions) {
          expect(question.notes.every((note) => note.staff === 2)).toBe(true);
        }
      }
    });

    it('collects all midis from units', () => {
      const units = buildTrainingProgressionUnits(iiViTraining);
      const midis = collectTrainingProgressionMidis(units);
      expect(midis.length).toBe(24);
      expect(midis).toContain(53);
      expect(midis).toContain(50);
    });
  });

  describe('cursor advancement', () => {
    const units = buildTrainingProgressionUnits(baseTraining({
      config: mapTrainingConfig({
        reference_key: 'F',
        voicing_form: 'aba',
        reference_chords: [
          { name: 'Gm7(9)', notes: ['F3', 'Bb3', 'D4', 'A4'] },
          { name: 'C7(9.13)', notes: ['E3', 'Bb3', 'D4', 'A4'] },
          { name: 'FM7(9)', notes: ['E3', 'A3', 'C4', 'G4'] },
        ],
        staves: [2, 1, 1, 1],
      }),
    }));

    it('advances within a unit sequentially', () => {
      const start = pickInitialProgressionCursor(units, false);
      expect(start).toEqual({ unitIndex: 0, chordIndex: 0 });
      const step1 = advanceTrainingProgressionCursor(units, start, false);
      expect(step1).toEqual({ unitIndex: 0, chordIndex: 1 });
      const step2 = advanceTrainingProgressionCursor(units, step1, false);
      expect(step2).toEqual({ unitIndex: 0, chordIndex: 2 });
    });

    it('wraps to next unit when shuffle is false', () => {
      let cursor = { unitIndex: 0, chordIndex: 2 };
      cursor = advanceTrainingProgressionCursor(units, cursor, false);
      expect(cursor).toEqual({ unitIndex: 1, chordIndex: 0 });
    });

    it('picks a different unit when shuffle is true at unit boundary', () => {
      const start = { unitIndex: 0, chordIndex: 2 };
      let sawDifferent = false;
      for (let i = 0; i < 30; i += 1) {
        const next = advanceTrainingProgressionCursor(units, start, true);
        if (next.unitIndex !== 0) {
          sawDifferent = true;
          break;
        }
      }
      expect(sawDifferent).toBe(true);
    });
  });

  describe('scale progression per-chord repositioning', () => {
    it('repositions each chord to staff bottom independently for kind=scale', () => {
      const scaleTraining = baseTraining({
        kind: 'scale',
        config: mapTrainingConfig({
          unit_size: 2,
          shuffle_units: true,
          ordered: true,
          play_root_on_first_correct: true,
          progression: [
            {
              name: 'Dm7',
              voicing: [67, 65, 60, 57, 64, 62],
              voicing_names: ['G5', 'F5', 'C5', 'A4', 'E5', 'D5'],
              key_fifths: 7,
            },
            {
              name: 'G7alt(Fm7♭5)',
              voicing: [82, 80, 75, 71, 79, 77],
              voicing_names: ['Bb5', 'Ab5', 'Eb5', 'Cb5', 'G5', 'F5'],
              key_fifths: 7,
            },
          ],
        }),
      });
      const units = buildTrainingProgressionUnits(scaleTraining, { concertStaffBottom: 60 });
      const unit = units[0];
      expect(unit?.questions).toHaveLength(2);
      for (const question of unit?.questions ?? []) {
        const lowest = Math.min(...question.notes.map((note) => note.midi));
        expect(lowest).toBeGreaterThanOrEqual(60);
        expect(lowest).toBeLessThan(72);
      }
    });

    it('keeps unit-wide repositioning for kind=progression', () => {
      const progTraining = baseTraining({
        kind: 'progression',
        clefMode: 'grand_concert',
        config: mapTrainingConfig({
          unit_size: 2,
          shuffle_units: true,
          progression: [
            {
              name: 'Dm7',
              voicing: [50, 55],
              voicing_names: ['D3', 'G3'],
              key_fifths: 0,
            },
            {
              name: 'G7',
              voicing: [67, 71],
              voicing_names: ['G4', 'B4'],
              key_fifths: 0,
            },
          ],
        }),
      });
      const units = buildTrainingProgressionUnits(progTraining, { concertStaffBottom: 60 });
      const question = units[0]?.questions[1];
      expect(question?.notes[0]?.midi).toBeGreaterThanOrEqual(60);
    });
  });

  describe('grouped voicing slots', () => {
    const groupedTraining = baseTraining({
      clefMode: 'grand_concert',
      config: mapTrainingConfig({
        unit_size: 1,
        shuffle_units: true,
        score_per_voicing: true,
        play_root_on_first_correct: true,
        progression: [
          {
            name: 'Cm7',
            voicing: [50, 55, 58, 65],
            voicing_names: ['D3', 'G3', 'Bb3', 'F4'],
            key_fifths: 0,
            voicing_slots: [['D3', 'G3', 'Bb3', 'F4'], ['C3', 'Eb4']],
          },
        ],
      }),
    });

    it('builds grouped question with voicing slots', () => {
      const units = buildTrainingProgressionUnits(groupedTraining);
      const question = units[0]?.questions[0];
      expect(question?.layout).toBe('grouped');
      expect(question?.voicingGroupCount).toBe(2);
      expect(question?.scorePerVoicing).toBe(true);
      expect(question?.notes).toHaveLength(6);
      expect(question?.notes.map((note) => note.groupIndex)).toEqual([0, 0, 0, 0, 1, 1]);
    });
  });
});
