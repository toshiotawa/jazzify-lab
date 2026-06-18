import {
  ABA_VOICINGS_BY_KEY,
  BAB_VOICINGS_BY_KEY,
  TWO_HAND_VOICING_GRAND_STAFF,
  TWO_HAND_VOICING_LESSONS,
  buildQuizItemsForLesson,
  buildSurvivalChordJson,
  buildVoicingPhrasesForLesson,
  getLessonProgressionChords,
  noteNamesToMidi,
  resolveSurvivalStageNumber,
} from '@/utils/twoHandVoicingIntermediateCourse';

describe('twoHandVoicingIntermediateCourse', () => {
  it('noteNamesToMidi は指定音名を MIDI に変換する', () => {
    expect(noteNamesToMidi(['C4', 'E4', 'G4', 'B4'])).toEqual([60, 64, 67, 71]);
  });

  it('buildSurvivalChordJson は大譜表分割の voicing_staves を付与する', () => {
    const json = buildSurvivalChordJson('Dm7(9)', ['C4', 'F4', 'A4', 'E5'], 0);
    expect(json.voicing_staves).toEqual([...TWO_HAND_VOICING_GRAND_STAFF]);
    expect(json.key_fifths).toBe(0);
    expect(json.voicing_names).toEqual(['C4', 'F4', 'A4', 'E5']);
  });

  it('A-B-A と B-A-B で C キーのヴォイシングが異なる', () => {
    const aba = ABA_VOICINGS_BY_KEY.C.ii.notes;
    const bab = BAB_VOICINGS_BY_KEY.C.ii.notes;
    expect(aba).toEqual(['C4', 'F4', 'A4', 'E5']);
    expect(bab).toEqual(['F3', 'C4', 'E4', 'A4']);
    expect(aba).not.toEqual(bab);
  });

  it('レッスン1 (C & F) は 6 コードの進行を生成する', () => {
    const lesson = TWO_HAND_VOICING_LESSONS.find((entry) => entry.lessonKey === 'b1-q1');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = getLessonProgressionChords(lesson, 'aba');
    expect(progression).toHaveLength(6);
    expect(progression[0]?.name).toBe('Dm7(9)');
    expect(progression[1]?.name).toBe('G7(9.13)');
    expect(progression[2]?.name).toBe('CM7(9)');
    expect(progression[3]?.name).toBe('Gm7(9)');
    expect(progression[3]?.voicing_names[0]).toBe('F3');
  });

  it('クイズは measure_number 1〜6 を sequential 出題用に付与する', () => {
    const lesson = TWO_HAND_VOICING_LESSONS.find((entry) => entry.lessonKey === 'b1-q1');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const items = buildQuizItemsForLesson(lesson, 'aba');
    expect(items).toHaveLength(6);
    expect(items.map((item) => item.measureNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('まとめレッスンは 36 コードプールを生成する', () => {
    const lesson = TWO_HAND_VOICING_LESSONS.find((entry) => entry.lessonKey === 'b1-q7');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const progression = getLessonProgressionChords(lesson, 'aba');
    expect(progression).toHaveLength(36);
    const quizItems = buildQuizItemsForLesson(lesson, 'aba');
    expect(quizItems).toHaveLength(36);
    expect(quizItems.map((item) => item.measureNumber)).toEqual([
      1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3,
      1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3,
      1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3,
    ]);
  });

  it('耳コピフレーズは各 4 小節 × 2 フレーズ', () => {
    const lesson = TWO_HAND_VOICING_LESSONS.find((entry) => entry.lessonKey === 'b2-q3');
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const phrases = buildVoicingPhrasesForLesson(lesson, 'bab');
    expect(phrases).toHaveLength(2);
    expect(phrases[0]?.chords).toHaveLength(4);
    expect(phrases[0]?.chords[0]?.startTimeSec).toBe(0);
    expect(phrases[0]?.chords[0]?.endTimeSec).toBe(2.4);
    expect(phrases[0]?.chords[3]?.measureNumber).toBe(4);
  });

  it('サバイバル stage_number は 1201 から 14 件連番', () => {
    const stageNumbers = TWO_HAND_VOICING_LESSONS.map(resolveSurvivalStageNumber);
    expect(stageNumbers).toEqual([
      1201, 1202, 1203, 1204, 1205, 1206, 1207,
      1208, 1209, 1210, 1211, 1212, 1213, 1214,
    ]);
  });
});
