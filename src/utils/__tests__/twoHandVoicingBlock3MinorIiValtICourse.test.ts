import {
  MINOR_II_VALT_I_VOICINGS_BY_KEY,
  TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON,
  TWO_HAND_VOICING_GRAND_STAFF,
  buildMinorIiValtIQuizItems,
  getMinorIiValtIProgressionChords,
  resolveBlock3MinorIiValtISurvivalStageNumber,
  resolveBlock3MinorIiValtISurvivalStageNumberForProgression,
  resolveMinorIiValtIQuizLoopMeasures,
} from '@/utils/twoHandVoicingBlock3MinorIiValtICourse';

describe('twoHandVoicingBlock3MinorIiValtICourse', () => {
  it('Cm キーは 7 コードのマイナー II-Valt-I 進行を持つ', () => {
    const keySet = MINOR_II_VALT_I_VOICINGS_BY_KEY.Cm;
    expect(keySet.chords).toHaveLength(7);
    expect(keySet.chords[0]?.symbol).toBe('Dm7b5(9,11)');
    expect(keySet.chords[0]?.notes).toEqual(['E3', 'Ab3', 'C4', 'G4']);
    expect(keySet.chords[4]?.notes).toEqual(['Eb3', 'A3', 'D4', 'G4']);
    expect(keySet.chords[5]?.notes).toEqual(['B3', 'Eb4', 'G4', 'D5']);
    expect(keySet.chords[6]?.symbol).toBe('Cm6');
  });

  it('G#m は F##3 表記を使う', () => {
    const keySet = MINOR_II_VALT_I_VOICINGS_BY_KEY['G#m'];
    expect(keySet.chords[5]?.notes[0]).toBe('F##3');
  });

  it('Key of Cm & Fm は 14 コードの進行を生成する', () => {
    const progression = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON.progressions[0];
    expect(progression).toBeDefined();
    if (!progression) {
      return;
    }
    const chords = getMinorIiValtIProgressionChords(progression);
    expect(chords).toHaveLength(14);
    expect(chords[0]?.name).toBe('Dm7b5(9,11)');
    expect(chords[6]?.name).toBe('Cm6');
    expect(chords[7]?.name).toBe('Gm7b5(9,11)');
    expect(chords[13]?.name).toBe('Fm6');
    expect(chords.every((entry) => (
      entry.voicing_staves.length === TWO_HAND_VOICING_GRAND_STAFF.length
      && entry.voicing_staves.every((staff, index) => staff === TWO_HAND_VOICING_GRAND_STAFF[index])
    ))).toBe(true);
  });

  it('まとめクイズは 251 複合（3 コード × 12 キー）', () => {
    const summary = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON.progressions.find(
      (entry) => entry.isSummary,
    );
    expect(summary).toBeDefined();
    if (!summary) {
      return;
    }
    const chords = getMinorIiValtIProgressionChords(summary);
    expect(chords).toHaveLength(84);
    const items = buildMinorIiValtIQuizItems(summary);
    expect(items).toHaveLength(36);
    expect(items[0]?.chordName).toBe('Dm7b5');
    expect(items[1]?.chordName).toBe('G7alt');
    expect(items[2]?.chordName).toBe('CmM7');
    expect(resolveMinorIiValtIQuizLoopMeasures(summary)).toBe(3);
  });

  it('サバイバル stage_number は 1246 から 7 件連番', () => {
    const stageNumbers = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON.progressions.map(
      (_progression, progressionIndex) => resolveBlock3MinorIiValtISurvivalStageNumber(progressionIndex),
    );
    expect(stageNumbers).toEqual([1246, 1247, 1248, 1249, 1250, 1251, 1252]);
  });

  it('resolveBlock3MinorIiValtISurvivalStageNumberForProgression は p1 を 1246 に割り当てる', () => {
    const progression = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON.progressions[0];
    expect(progression).toBeDefined();
    if (!progression) {
      return;
    }
    expect(resolveBlock3MinorIiValtISurvivalStageNumberForProgression(progression)).toBe(1246);
  });
});
