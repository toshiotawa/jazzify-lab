import {
  buildSixNoteScaleTrainingSpecs,
  MINOR6_PATTERN_IDS,
  PROG_II_V_PATTERN_IDS,
} from '@/game/training/sixNoteScalePatterns';
import {
  buildTrainingProgressionUnits,
  parseProgressionChordRoot,
  rootMidiBelow,
} from '@/game/training/trainingProgression';
import { mapTrainingConfig } from '@/game/training/mapTrainingConfig';
import type { TrainingRow } from '@/game/training/trainingTypes';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

const midiOf = (name: string): number => parseVoicingNoteName(name).midi;

const baseScaleTraining = (config: Record<string, unknown>): TrainingRow => ({
  id: 't-six-note',
  categoryId: 'c-six-note',
  slug: 'six-note-scale-m7-abc',
  titleJa: 'm7 A-B-C',
  titleEn: 'm7 A-B-C',
  sortOrder: 1,
  kind: 'scale',
  clefMode: 'instrument',
  useKeySignature: true,
  playRootOnCorrect: true,
  bgmUrl: '',
  config: mapTrainingConfig(config),
  isActive: true,
});

describe('sixNoteScalePatterns', () => {
  it('keeps reference Dm7 A-B-C notes at C major', () => {
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7-abc');
    const cMajorAbc = m7?.progression.find(
      (entry) => entry.name === 'Dm7' && entry.voicingNames[0] === 'D4',
    );
    expect(cMajorAbc?.voicingNames).toEqual(['D4', 'E4', 'F4', 'G4', 'A4', 'C5']);
  });

  it('keeps B-C-A third pair within first two pairs at C major', () => {
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7-bca');
    const cMajorBca = m7?.progression.find((entry) => entry.name === 'Dm7');
    expect(cMajorBca?.voicingNames).toEqual(['G5', 'F5', 'C5', 'A4', 'E5', 'D5']);

    const prog = buildSixNoteScaleTrainingSpecs().find(
      (spec) => spec.slug === 'six-note-scale-prog-ii-v7alt-m7b5-bca',
    );
    const dm7 = prog?.progression.find((entry) => entry.name === 'Dm7');
    const g7 = prog?.progression.find((entry) => entry.name === 'G7alt(Fm7♭5)');
    expect(dm7?.voicingNames).toEqual(['G5', 'F5', 'C5', 'A4', 'E5', 'D5']);
    expect(g7?.voicingNames).toEqual(['Bb5', 'Ab5', 'Eb5', 'Cb5', 'G5', 'F5']);
  });

  it('builds 66 training specs (54 singles + 12 progressions)', () => {
    const specs = buildSixNoteScaleTrainingSpecs();
    expect(specs).toHaveLength(66);
    expect(specs.filter((spec) => spec.unitSize === 1)).toHaveLength(54);
    expect(specs.filter((spec) => spec.unitSize === 2)).toHaveLength(6);
    expect(specs.filter((spec) => spec.unitSize === 3)).toHaveLength(6);
  });

  it('transposes single-chord entries to 12 keys per pattern', () => {
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7-abc');
    expect(m7?.progression).toHaveLength(12);
    const cMajorAbc = m7?.progression.find(
      (entry) => entry.name === 'Dm7' && entry.voicingNames[0] === 'D4',
    );
    expect(cMajorAbc?.keyFifths).toBe(0);
  });

  it('uses original chord root for substitution symbols', () => {
    expect(parseProgressionChordRoot('G7(Dm7)')).toBe('G');
    expect(parseProgressionChordRoot('Am7♭5(CmM7 omit 6)')).toBe('A');
    const gRootMidi = rootMidiBelow('G', midiOf('F4'));
    expect(gRootMidi).toBeLessThan(midiOf('F4'));
    expect(gRootMidi % 12).toBe(7);
  });

  it('builds horizontal ordered questions with key signature and auto placement', () => {
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7-abc');
    expect(m7).toBeDefined();
    const training = baseScaleTraining({
      progression: m7?.progression,
      unit_size: 1,
      shuffle_units: true,
      ordered: true,
      play_root_on_first_correct: true,
    });
    const units = buildTrainingProgressionUnits(training, { concertStaffBottom: 60 });
    expect(units.length).toBeGreaterThan(0);
    const question = units[0]?.questions[0];
    expect(question?.layout).toBe('horizontal');
    expect(question?.ordered).toBe(true);
    expect(question?.playRootOnFirstCorrect).toBe(true);
    expect(question?.keyFifths).toBe(0);
    const lowest = Math.min(...(question?.notes.map((note) => note.midi) ?? [999]));
    expect(lowest).toBeGreaterThanOrEqual(60);
    expect(lowest).toBeLessThan(72);
  });

  it('keeps one key signature per progression unit', () => {
    const prog = buildSixNoteScaleTrainingSpecs().find(
      (spec) => spec.slug === 'six-note-scale-prog-minor-ii-v-i-abc',
    );
    expect(prog).toBeDefined();
    const training = baseScaleTraining({
      progression: prog?.progression,
      unit_size: 3,
      shuffle_units: true,
      ordered: true,
      play_root_on_first_correct: true,
    });
    const units = buildTrainingProgressionUnits(training, { concertStaffBottom: 60 });
    const ebUnit = units.find((unit) => unit.keyFifths === -3);
    expect(ebUnit?.questions).toHaveLength(3);
    for (const question of ebUnit?.questions ?? []) {
      expect(question.keyFifths).toBe(-3);
      expect(question.layout).toBe('horizontal');
    }
  });

  it('repositions each chord independently in scale progressions', () => {
    const prog = buildSixNoteScaleTrainingSpecs().find(
      (spec) => spec.slug === 'six-note-scale-prog-ii-v7alt-mm7-omit6-abc',
    );
    expect(prog).toBeDefined();
    const training = baseScaleTraining({
      progression: prog?.progression,
      unit_size: 2,
      shuffle_units: true,
      ordered: true,
      play_root_on_first_correct: true,
    });
    const units = buildTrainingProgressionUnits(training, { concertStaffBottom: 60 });
    const highKeyUnit = units.find((unit) => unit.keyFifths === 5);
    expect(highKeyUnit?.questions).toHaveLength(2);
    for (const question of highKeyUnit?.questions ?? []) {
      const lowest = Math.min(...question.notes.map((note) => note.midi));
      expect(lowest).toBeGreaterThanOrEqual(60);
      expect(lowest).toBeLessThan(72);
    }
  });

  it('generates migration SQL when GENERATE_SIX_NOTE_SCALE_SQL=1', async () => {
    if (process.env.GENERATE_SIX_NOTE_SCALE_SQL !== '1') return;

    const mod = await import('@/game/training/__tests__/generateSixNoteScaleMigration');
    mod.writeSixNoteScaleMigrationFile();
    mod.writeSixNoteScalePatchMigrationFile();
  });

  it('covers all expected pattern counts', () => {
    const specs = buildSixNoteScaleTrainingSpecs();
    const singlesWithSix = specs.filter(
      (spec) => spec.unitSize === 1 && spec.slug.includes('-ada'),
    );
    expect(singlesWithSix.length).toBeGreaterThan(0);
    expect(MINOR6_PATTERN_IDS).toHaveLength(6);
    expect(PROG_II_V_PATTERN_IDS).toHaveLength(3);
  });
});
