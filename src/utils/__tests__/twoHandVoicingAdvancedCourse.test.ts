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

  it('key_fifths は機能度数で解決される', () => {
    const m7Lesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-m7');
    expect(m7Lesson).toBeDefined();
    if (!m7Lesson) {
      return;
    }
    const m7Items = buildAdvancedQuizItems(m7Lesson.progressions[0], m7Lesson.category);
    expect(m7Items[0]?.keyFifths).toBe(-3);

    const altLesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-7alt');
    expect(altLesson).toBeDefined();
    if (!altLesson) {
      return;
    }
    const altItems = buildAdvancedQuizItems(altLesson.progressions[0], altLesson.category);
    expect(altItems[0]?.keyFifths).toBe(-3);

    const m7b5Lesson = TWO_HAND_VOICING_ADVANCED_EXT_LESSONS.find((entry) => entry.lessonKey === 'b1-m7b5');
    expect(m7b5Lesson).toBeDefined();
    if (!m7b5Lesson) {
      return;
    }
    const m7b5Items = buildAdvancedQuizItems(m7b5Lesson.progressions[0], m7b5Lesson.category);
    expect(m7b5Items[0]?.keyFifths).toBe(1);

    const dom7Lesson = TWO_HAND_VOICING_ADVANCED_EXT_LESSONS.find((entry) => entry.lessonKey === 'b1-7s11');
    expect(dom7Lesson).toBeDefined();
    if (!dom7Lesson) {
      return;
    }
    const dom7Items = buildAdvancedQuizItems(dom7Lesson.progressions[0], dom7Lesson.category);
    expect(dom7Items[0]?.keyFifths).toBe(2);

    const mm7Lesson = TWO_HAND_VOICING_ADVANCED_EXT_LESSONS.find((entry) => entry.lessonKey === 'b1-mm7');
    expect(mm7Lesson).toBeDefined();
    if (!mm7Lesson) {
      return;
    }
    const mm7Items = buildAdvancedQuizItems(mm7Lesson.progressions[0], mm7Lesson.category);
    expect(mm7Items[0]?.keyFifths).toBe(-3);
  });

  it('AbM7 は So What M7 P5 基準ヴォイシングを持つ', () => {
    const entry = SO_WHAT_MAJOR_M7_VOICINGS.AbM7;
    expect(entry.notes).toEqual(['C3', 'F3', 'Bb3', 'Eb4', 'G4']);
    expect(entry.symbol).toBe('AbM7');
  });

  it('CM7 は P5（G4）を使う', () => {
    expect(SO_WHAT_MAJOR_M7_VOICINGS.CM7.notes).toEqual(['E3', 'A3', 'D4', 'G4', 'B4']);
  });

  it('M7 進行は Block3 と同じ完全4度循環', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-M7');
    expect(lesson?.progressions[0]?.chordSymbols).toEqual(['CM7', 'FM7', 'BbM7', 'EbM7']);
    expect(lesson?.progressions[1]?.chordSymbols).toEqual(['AbM7', 'DbM7', 'GbM7', 'BM7']);
    expect(lesson?.progressions[2]?.chordSymbols).toEqual(['EM7', 'AM7', 'DM7', 'GM7']);
  });

  it('7alt 進行は Block3 と同じ完全4度循環', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_LESSONS.find((entry) => entry.lessonKey === 'b1-7alt');
    expect(lesson?.progressions[0]?.chordSymbols).toEqual(['G7alt', 'C7alt', 'F7alt', 'Bb7alt']);
    expect(lesson?.progressions[1]?.chordSymbols).toEqual(['Eb7alt', 'Ab7alt', 'Db7alt', 'F#7alt']);
    expect(lesson?.progressions[2]?.chordSymbols).toEqual(['B7alt', 'E7alt', 'A7alt', 'D7alt']);
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
