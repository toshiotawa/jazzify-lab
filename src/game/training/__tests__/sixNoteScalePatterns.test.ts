import { buildSixNoteScaleTrainingSpecs } from '@/game/training/sixNoteScalePatterns';
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
  slug: 'six-note-scale-m7',
  titleJa: 'm7',
  titleEn: 'm7',
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
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7');
    const cMajorAbc = m7?.progression.find(
      (entry) => entry.name === 'Dm7' && entry.voicingNames[0] === 'D4',
    );
    expect(cMajorAbc?.voicingNames).toEqual(['D4', 'E4', 'F4', 'G4', 'A4', 'C5']);
  });

  it('builds 13 training specs (10 singles + 3 progressions)', () => {
    const specs = buildSixNoteScaleTrainingSpecs();
    expect(specs).toHaveLength(13);
    expect(specs.filter((spec) => spec.unitSize === 1)).toHaveLength(10);
    expect(specs.filter((spec) => spec.unitSize > 1)).toHaveLength(3);
  });

  it('transposes single-chord entries to 12 keys × 6 patterns', () => {
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7');
    expect(m7?.progression).toHaveLength(72);
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
    const m7 = buildSixNoteScaleTrainingSpecs().find((spec) => spec.slug === 'six-note-scale-m7');
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
      (spec) => spec.slug === 'six-note-scale-prog-minor-ii-v-i',
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
});
