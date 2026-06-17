import {
  II_VALT_I_VOICINGS_BY_KEY,
  TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON,
  TWO_HAND_VOICING_GRAND_STAFF,
  buildIiValtIQuizItems,
  getIiValtIProgressionChords,
  resolveBlock3IiValtISurvivalStageNumber,
  resolveBlock3IiValtISurvivalStageNumberForProgression,
  resolveIiValtIQuizLoopMeasures,
} from '@/utils/twoHandVoicingBlock3IiValtICourse';

describe('twoHandVoicingBlock3IiValtICourse', () => {
  it('C キーは 7 コードの II-Valt-I 進行を持つ', () => {
    const keySet = II_VALT_I_VOICINGS_BY_KEY.C;
    expect(keySet.chords).toHaveLength(7);
    expect(keySet.chords[0]?.symbol).toBe('Dm7(9,11)');
    expect(keySet.chords[0]?.notes).toEqual(['E3', 'A3', 'C4', 'G4']);
    expect(keySet.chords[3]?.notes).toEqual(['F3', 'Cb4', 'Eb4', 'Ab4']);
    expect(keySet.chords[5]?.notes).toEqual(['B3', 'E4', 'G4', 'D5']);
    expect(keySet.chords[6]?.symbol).toBe('C6');
  });

  it('Ab7alt は Dbb4 表記を使う', () => {
    const keySet = II_VALT_I_VOICINGS_BY_KEY.Db;
    expect(keySet.chords[2]?.notes[1]).toBe('Dbb4');
    expect(keySet.chords[3]?.notes[1]).toBe('Dbb4');
  });

  it('Db7alt は Gbb4 表記を使う', () => {
    const keySet = II_VALT_I_VOICINGS_BY_KEY.Gb;
    expect(keySet.chords[2]?.notes[1]).toBe('Gbb4');
    expect(keySet.chords[3]?.notes[1]).toBe('Gbb4');
  });

  it('Key of C & F は 14 コードの進行を生成する', () => {
    const progression = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON.progressions[0];
    expect(progression).toBeDefined();
    if (!progression) {
      return;
    }
    const chords = getIiValtIProgressionChords(progression);
    expect(chords).toHaveLength(14);
    expect(chords[0]?.name).toBe('Dm7(9,11)');
    expect(chords[6]?.name).toBe('C6');
    expect(chords[7]?.name).toBe('Gm7(9,11)');
    expect(chords[13]?.name).toBe('F6');
    expect(chords.every((entry) => (
      entry.voicing_staves.length === TWO_HAND_VOICING_GRAND_STAFF.length
      && entry.voicing_staves.every((staff, index) => staff === TWO_HAND_VOICING_GRAND_STAFF[index])
    ))).toBe(true);
  });

  it('クイズは measure 1〜14 を sequential 出題用に付与する', () => {
    const progression = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON.progressions[0];
    expect(progression).toBeDefined();
    if (!progression) {
      return;
    }
    const items = buildIiValtIQuizItems(progression);
    expect(items).toHaveLength(14);
    expect(items.map((item) => item.measureNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ]);
    expect(resolveIiValtIQuizLoopMeasures(progression)).toBe(14);
  });

  it('まとめは 84 コードプールを生成する', () => {
    const summary = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON.progressions.find(
      (entry) => entry.isSummary,
    );
    expect(summary).toBeDefined();
    if (!summary) {
      return;
    }
    const chords = getIiValtIProgressionChords(summary);
    expect(chords).toHaveLength(84);
    const items = buildIiValtIQuizItems(summary);
    expect(items).toHaveLength(84);
    expect(items[0]?.measureNumber).toBe(1);
    expect(items[6]?.measureNumber).toBe(7);
    expect(items[7]?.measureNumber).toBe(1);
    expect(resolveIiValtIQuizLoopMeasures(summary)).toBe(7);
  });

  it('サバイバル stage_number は 1227 から 7 件連番', () => {
    const stageNumbers = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON.progressions.map(
      (_progression, progressionIndex) => resolveBlock3IiValtISurvivalStageNumber(progressionIndex),
    );
    expect(stageNumbers).toEqual([1227, 1228, 1229, 1230, 1231, 1232, 1233]);
  });

  it('resolveBlock3IiValtISurvivalStageNumberForProgression は p1 を 1227 に割り当てる', () => {
    const progression = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON.progressions[0];
    expect(progression).toBeDefined();
    if (!progression) {
      return;
    }
    expect(resolveBlock3IiValtISurvivalStageNumberForProgression(progression)).toBe(1227);
  });
});
