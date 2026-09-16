import {
  buildSingleChordProgression,
  buildTensionResolveTrainingSpecs,
  TENSION_RESOLVE_PROGRESSION_TEMPLATES,
  TENSION_RESOLVE_SINGLE_TEMPLATES,
  buildKeyProgression,
} from '@/game/training/tensionResolveVoicings';
import { writeTensionResolveMigrationFile } from '@/game/training/__tests__/generateTensionResolveMigration';

describe('tensionResolveVoicings', () => {
  it('builds Cm7 reference voicing slots', () => {
    const [cm7] = buildSingleChordProgression(TENSION_RESOLVE_SINGLE_TEMPLATES.m7);
    expect(cm7?.name).toBe('Cm7');
    expect(cm7?.voicingSlots).toEqual([
      ['D3', 'G3', 'Bb3', 'F4'],
      ['C3', 'Eb4'],
    ]);
    expect(cm7?.keyFifths).toBe(0);
  });

  it('builds F7(alt) with diminished 4th spelling in II-V-I Bb key', () => {
    const chords = buildKeyProgression(TENSION_RESOLVE_PROGRESSION_TEMPLATES.iiV_i, 'Bb');
    expect(chords[1]?.name).toBe('F7(alt)');
    expect(chords[1]?.voicingSlots?.[0]).toEqual(['F3', 'Bbb3', 'Db4', 'Ab4']);
  });

  it('builds G7(alt) with Cb4 in I-VI-II-V Bb key', () => {
    const chords = buildKeyProgression(TENSION_RESOLVE_PROGRESSION_TEMPLATES.iViIiV, 'Bb');
    expect(chords[1]?.name).toBe('G7(alt)');
    expect(chords[1]?.voicingSlots?.[0]).toEqual(['G3', 'Cb4', 'Eb4', 'Bb4']);
  });

  it('builds Ab7(#11) at reference pitch', () => {
    const ab7 = buildSingleChordProgression(TENSION_RESOLVE_SINGLE_TEMPLATES.sharp11_7)
      .find((entry) => entry.name === 'Ab7(#11)');
    expect(ab7?.voicingSlots?.[0]).toEqual(['D3', 'Gb3', 'Bb3', 'F4']);
  });

  it('builds 12 single-chord units and 36 progression units total', () => {
    const specs = buildTensionResolveTrainingSpecs();
    expect(specs).toHaveLength(10);
    expect(specs[0]?.progression).toHaveLength(12);
    expect(specs[7]?.progression).toHaveLength(36);
    expect(specs[8]?.progression).toHaveLength(48);
    expect(specs[9]?.progression).toHaveLength(36);
  });

  it('generates migration SQL when GENERATE_TENSION_RESOLVE_SQL=1', () => {
    if (process.env.GENERATE_TENSION_RESOLVE_SQL !== '1') return;

    writeTensionResolveMigrationFile();
  });
});
