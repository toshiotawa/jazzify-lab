import {
  ALT7_RESOLUTION_VOICINGS,
  buildBlock3QuizItems,
  buildBlock3SurvivalProgression,
  buildBlock3SummarySurvivalProgression,
  buildBlock3VoicingPhrase,
  DOM7_LYDIAN_RESOLUTION_VOICINGS,
  M7B5_RESOLUTION_VOICINGS,
  M7_RESOLUTION_VOICINGS,
  MM7_RESOLUTION_VOICINGS,
  resolveBlock3SurvivalStageNumber,
  resolveBlock3SurvivalStageNumberForProgression,
  TWO_HAND_VOICING_BLOCK3_EXT_LESSONS,
  TWO_HAND_VOICING_BLOCK3_LESSONS,
  TWO_HAND_VOICING_GRAND_STAFF,
} from '@/utils/twoHandVoicingBlock3Course';

describe('twoHandVoicingBlock3Course', () => {
  it('CM7 は M7 Drop2 と 6th Drop2 の2ヴォイシングを持つ', () => {
    const entry = M7_RESOLUTION_VOICINGS.CM7;
    expect(entry.voicingA).toEqual(['B3', 'E4', 'G4', 'D5']);
    expect(entry.voicingB).toEqual(['A3', 'E4', 'G4', 'C5']);
    expect(entry.symbol).toBe('CM7');
  });

  it('F7alt は b4th 表記（Bbb3）を使う', () => {
    const entry = ALT7_RESOLUTION_VOICINGS.F7alt;
    expect(entry.voicingA[1]).toBe('Bbb3');
    expect(entry.voicingB[1]).toBe('Bbb3');
  });

  it('クイズは 4コード × 2ヴォイシング = 8行、measure 1〜4', () => {
    const lesson = TWO_HAND_VOICING_BLOCK3_LESSONS.find((entry) => entry.lessonKey === 'b3-m7');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = lesson.progressions[0];
    const items = buildBlock3QuizItems(progression, lesson.category);
    expect(items).toHaveLength(8);
    expect(items.map((item) => item.measureNumber)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(items.map((item) => item.beatOffset)).toEqual([1, 3, 1, 3, 1, 3, 1, 3]);
    expect(items.every((item) => item.chordName === progression.chordSymbols[Math.floor(item.orderIndex / 2)])).toBe(true);
  });

  it('サバイバル進行は 2ヴォイシングを別コードとして 8 件', () => {
    const lesson = TWO_HAND_VOICING_BLOCK3_LESSONS.find((entry) => entry.lessonKey === 'b3-m7');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = lesson.progressions[0];
    const chords = buildBlock3SurvivalProgression(progression, lesson.category);
    expect(chords).toHaveLength(8);
    expect(chords[0]?.name).toBe('CM7');
    expect(chords[0]?.voicing_staves).toEqual([...TWO_HAND_VOICING_GRAND_STAFF]);
    expect(chords[1]?.name).toBe('CM7');
    expect(chords[1]?.voicing_names).toEqual(['A3', 'E4', 'G4', 'C5']);
  });

  it('まとめサバイバルは 12キー × 2 = 24 コード', () => {
    const chords = buildBlock3SummarySurvivalProgression('m7');
    expect(chords).toHaveLength(24);
    expect(chords[0]?.name).toBe('Am7');
    expect(chords[23]?.name).toBe('Em7');
  });

  it('まとめクイズは 24 行プール', () => {
    const lesson = TWO_HAND_VOICING_BLOCK3_LESSONS.find((entry) => entry.lessonKey === 'b3-7alt');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const summary = lesson.progressions.find((entry) => entry.isSummary);
    expect(summary).toBeDefined();
    if (!summary) {
      return;
    }
    const items = buildBlock3QuizItems(summary, lesson.category);
    expect(items).toHaveLength(24);
  });

  it('耳コピフレーズは 4 小節 × 各 2 コード = 8 行', () => {
    const lesson = TWO_HAND_VOICING_BLOCK3_LESSONS.find((entry) => entry.lessonKey === 'b3-mn7');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = lesson.progressions[1];
    const phrase = buildBlock3VoicingPhrase(progression, lesson.category);
    expect(phrase.chords).toHaveLength(8);
    expect(phrase.chords[0]?.measureNumber).toBe(1);
    expect(phrase.chords[0]?.startTimeSec).toBe(0);
    expect(phrase.chords[0]?.endTimeSec).toBe(2.4);
    expect(phrase.chords[7]?.measureNumber).toBe(4);
  });

  it('サバイバル stage_number は 1215 から 12 件連番', () => {
    const stageNumbers = TWO_HAND_VOICING_BLOCK3_LESSONS.flatMap((lesson, lessonIndex) => (
      lesson.progressions.map((_progression, progressionIndex) => (
        resolveBlock3SurvivalStageNumber(lessonIndex, progressionIndex)
      ))
    ));
    expect(stageNumbers).toEqual([
      1215, 1216, 1217, 1218,
      1219, 1220, 1221, 1222,
      1223, 1224, 1225, 1226,
    ]);
  });

  it('resolveBlock3SurvivalStageNumberForProgression は p1 を 1215 に割り当てる', () => {
    const lesson = TWO_HAND_VOICING_BLOCK3_LESSONS[0];
    const progression = lesson.progressions[0];
    expect(resolveBlock3SurvivalStageNumberForProgression(lesson, progression)).toBe(1215);
  });
});

describe('twoHandVoicingBlock3ExtLessons', () => {
  it('FmM7 は mM7(9) と m6 の2ヴォイシングを持つ', () => {
    const entry = MM7_RESOLUTION_VOICINGS.FmM7;
    expect(entry.voicingA).toEqual(['E3', 'Ab3', 'C4', 'G4']);
    expect(entry.voicingB).toEqual(['D3', 'Ab3', 'C4', 'F4']);
  });

  it('C7 Lydian dominant は 7(9,#11,13) と 7(9) を持つ', () => {
    const entry = DOM7_LYDIAN_RESOLUTION_VOICINGS.C7;
    expect(entry.voicingA).toEqual(['F#3', 'Bb3', 'D4', 'A4']);
    expect(entry.voicingB).toEqual(['E3', 'Bb3', 'D4', 'G4']);
  });

  it('Dm7b5 は m7b5(9,11) と m7b5 を持つ', () => {
    const entry = M7B5_RESOLUTION_VOICINGS.Dm7b5;
    expect(entry.voicingA).toEqual(['E3', 'Ab3', 'C4', 'G4']);
    expect(entry.voicingB).toEqual(['D3', 'Ab3', 'C4', 'F4']);
  });

  it('拡張レッスンのサバイバル stage_number は 1234 から 12 件連番', () => {
    const stageNumbers = TWO_HAND_VOICING_BLOCK3_EXT_LESSONS.flatMap((lesson) => (
      lesson.progressions.map((progression) => (
        resolveBlock3SurvivalStageNumberForProgression(lesson, progression)
      ))
    ));
    expect(stageNumbers).toEqual([
      1234, 1235, 1236, 1237,
      1238, 1239, 1240, 1241,
      1242, 1243, 1244, 1245,
    ]);
  });
});
