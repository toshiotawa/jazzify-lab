import {
  applyLessonRandomChords,
  buildLessonRandomChordDefinition,
  parseSurvivalLessonRandomChords,
} from './survivalLessonRandomChords';

describe('survivalLessonRandomChords', () => {
  it('parseSurvivalLessonRandomChords は voicing_staves を正規化する', () => {
    const parsed = parseSurvivalLessonRandomChords([
      {
        name: 'G7',
        voicing: [53, 57, 59, 64],
        voicing_names: ['F3', 'A3', 'B3', 'E4'],
        voicing_staves: [2, 2, 2, 1],
        key_fifths: 0,
      },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.voicingStaves).toEqual([2, 2, 2, 1]);
  });

  it('buildLessonRandomChordDefinition は譜面用フィールドを付与する', () => {
    const def = buildLessonRandomChordDefinition({
      name: 'Dm7',
      voicing: [53, 57, 60, 64],
      voicingNames: ['F3', 'A3', 'C4', 'E4'],
      voicingStaves: [2, 2, 1, 1],
      keyFifths: 0,
    });
    expect(def?.id).toBe('Dm7');
    expect(def?.quality).not.toBe('progression');
    expect(def?.progressionStaffVoicingNames).toEqual(['F3', 'A3', 'C4', 'E4']);
    expect(def?.progressionStaffVoicingStaves).toEqual([2, 2, 1, 1]);
  });

  it('applyLessonRandomChords は Random 時のみプールを置き換える', () => {
    const applied = applyLessonRandomChords(
      ['CM7', 'Dm7'],
      [{ name: 'G7', voicing: [55, 59, 62, 65] }],
      'random',
    );
    expect(applied.allowedChordIds).toEqual(['G7']);
    expect(applied.overrides.get('G7')?.id).toBe('G7');
  });

  it('applyLessonRandomChords は progression ではステージ既定を維持', () => {
    const applied = applyLessonRandomChords(
      ['CM7'],
      [{ name: 'G7', voicing: [55, 59, 62, 65] }],
      'progression',
    );
    expect(applied.allowedChordIds).toEqual(['CM7']);
    expect(applied.overrides.size).toBe(0);
  });
});
