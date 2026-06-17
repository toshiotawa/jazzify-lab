import {
  buildAdvancedQuizItems,
  buildAdvancedSurvivalProgression,
  resolveAdvancedSurvivalStageNumberForProgression,
  resolveAdvancedVoicingStaves,
  SO_WHAT_MAJOR_M7_VOICINGS,
  SO_WHAT_M7_VOICINGS,
  TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
  TWO_HAND_VOICING_ADVANCED_LESSONS,
  UST_BVI_7ALT_VOICINGS,
  MM7_913_VOICINGS,
  M7B5_911_VOICINGS,
  LYDIAN_DOM7_VOICINGS,
} from '@/utils/twoHandVoicingAdvancedCourse';

describe('twoHandVoicingAdvancedCourse', () => {
  it('Cm7 は So What m7 基準ヴォイシングを持つ', () => {
    const entry = SO_WHAT_M7_VOICINGS.Cm7;
    expect(entry.notes).toEqual(['C3', 'F3', 'Bb3', 'Eb4', 'G4']);
    expect(entry.symbol).toBe('Cm7');
  });

  it('AbM7 は So What M7 基準ヴォイシングを持つ', () => {
    const entry = SO_WHAT_MAJOR_M7_VOICINGS.AbM7;
    expect(entry.notes).toEqual(['C3', 'F3', 'Bb3', 'E4', 'G4']);
    expect(entry.symbol).toBe('AbM7');
  });

  it('D7alt は b4th 表記（Gb3）を使う', () => {
    const entry = UST_BVI_7ALT_VOICINGS.D7alt;
    expect(entry.notes[1]).toBe('Gb3');
    expect(entry.notes).toEqual(['C3', 'Gb3', 'Bb3', 'D4', 'F4']);
  });

  it('resolveAdvancedVoicingStaves: Cm7 は [2,2,1,1,1]', () => {
    expect(resolveAdvancedVoicingStaves(SO_WHAT_M7_VOICINGS.Cm7.notes)).toEqual([2, 2, 1, 1, 1]);
  });

  it('resolveAdvancedVoicingStaves: Bm7 は左手2音目がト音 [2,1,1,1,1]', () => {
    expect(resolveAdvancedVoicingStaves(SO_WHAT_M7_VOICINGS.Bm7.notes)).toEqual([2, 1, 1, 1, 1]);
  });

  it('クイズは 4 コード = 4 問、measure 1〜4', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-m7');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = lesson.progressions[0];
    const items = buildAdvancedQuizItems(progression, lesson.category);
    expect(items).toHaveLength(4);
    expect(items.map((item) => item.measureNumber)).toEqual([1, 2, 3, 4]);
  });

  it('サバイバル進行は 4 コード、動的 voicing_staves 付き', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-m7');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = lesson.progressions[0];
    const chords = buildAdvancedSurvivalProgression(progression, lesson.category);
    expect(chords).toHaveLength(4);
    expect(chords[0]?.name).toBe('Cm7');
    expect(chords[0]?.voicing_staves).toEqual([2, 2, 1, 1, 1]);
    expect(chords[0]?.voicing_names).toHaveLength(5);
  });

  it('まとめサバイバルは 12 コード', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-7alt');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const summary = lesson.progressions.find((entry) => entry.isSummary);
    expect(summary).toBeDefined();
    if (!summary) {
      return;
    }
    const chords = buildAdvancedSurvivalProgression(summary, lesson.category);
    expect(chords).toHaveLength(12);
  });

  it('survival stage_number は 1253 から連番', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_LESSONS[0];
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    expect(resolveAdvancedSurvivalStageNumberForProgression(lesson, lesson.progressions[0])).toBe(1253);
    const lesson3 = TWO_HAND_VOICING_ADVANCED_LESSONS[2];
    expect(lesson3).toBeDefined();
    if (!lesson3) {
      return;
    }
    expect(resolveAdvancedSurvivalStageNumberForProgression(lesson3, lesson3.progressions[3])).toBe(1264);
  });

  it('EbmM7 は mM7(9,13) 基準ヴォイシングを持つ', () => {
    const entry = MM7_913_VOICINGS.EbmM7;
    expect(entry.notes).toEqual(['C3', 'Gb3', 'Bb3', 'D4', 'F4']);
    expect(entry.symbol).toBe('EbmM7');
  });

  it('Cm7b5 は m7b5(9,11) 基準ヴォイシングを持つ', () => {
    const entry = M7B5_911_VOICINGS.Cm7b5;
    expect(entry.notes).toEqual(['C3', 'Gb3', 'Bb3', 'D4', 'F4']);
    expect(entry.symbol).toBe('Cm7b5');
  });

  it('Ab7 Lydian dominant は黒鍵ルートフラット表記', () => {
    const entry = LYDIAN_DOM7_VOICINGS.Ab7;
    expect(entry.notes).toEqual(['C3', 'Gb3', 'Bb3', 'D4', 'F4']);
    expect(entry.notes[1]).toBe('Gb3');
  });

  it('拡張レッスン survival stage_number は 1272 から', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_EXT_LESSONS[0];
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    expect(resolveAdvancedSurvivalStageNumberForProgression(lesson, lesson.progressions[0])).toBe(1272);
    const lesson3 = TWO_HAND_VOICING_ADVANCED_EXT_LESSONS[2];
    expect(lesson3).toBeDefined();
    if (!lesson3) {
      return;
    }
    expect(resolveAdvancedSurvivalStageNumberForProgression(lesson3, lesson3.progressions[3])).toBe(1283);
  });

  it('フェーズ1+2 単体レッスンは合計6件', () => {
    expect(TWO_HAND_VOICING_ADVANCED_LESSONS).toHaveLength(3);
    expect(TWO_HAND_VOICING_ADVANCED_EXT_LESSONS).toHaveLength(3);
  });
});
