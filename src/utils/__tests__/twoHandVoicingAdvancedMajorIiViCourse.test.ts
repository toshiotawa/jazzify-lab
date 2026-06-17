import {
  SO_WHAT_MAJOR_M7_VOICINGS,
  SO_WHAT_M7_VOICINGS,
  UST_BVI_7ALT_VOICINGS,
} from '@/utils/twoHandVoicingAdvancedCourse';
import {
  buildMajorIiViQuizItems,
  getMajorIiViProgressionChords,
  MAJOR_II_VI_VOICINGS_BY_KEY,
  resolveAdvancedMajorIiViSurvivalStageNumberForProgression,
  TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON,
} from '@/utils/twoHandVoicingAdvancedMajorIiViCourse';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

describe('twoHandVoicingAdvancedMajorIiViCourse', () => {
  it('C キー 251 は 3 コード・ユーザー指定ヴォイシング', () => {
    const keySet = MAJOR_II_VI_VOICINGS_BY_KEY.C;
    expect(keySet.chords[0]?.symbol).toBe('Dm7');
    expect(keySet.chords[0]?.notes).toEqual(['D3', 'G3', 'C4', 'F4', 'A4']);
    expect(keySet.chords[1]?.symbol).toBe('G7alt');
    expect(keySet.chords[1]?.notes).toEqual(['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']);
    expect(keySet.chords[2]?.symbol).toBe('CM7');
    expect(keySet.chords[2]?.notes).toEqual(['E3', 'A3', 'D4', 'G#4', 'B4']);
  });

  it('C キー トップラインは 6度 → ♭7/#9 → 7度 (A → Bb → B)', () => {
    const keySet = MAJOR_II_VI_VOICINGS_BY_KEY.C;
    const topNotes = keySet.chords.map((chordSpec) => {
      const topName = chordSpec.notes[chordSpec.notes.length - 1];
      return parseVoicingNoteName(topName).midi % 12;
    });
    expect(topNotes).toEqual([9, 10, 11]);
  });

  it('Ab キー IIm7 は低域 Bb2 始まり', () => {
    const keySet = MAJOR_II_VI_VOICINGS_BY_KEY.Ab;
    expect(keySet.chords[0]?.notes).toEqual(['Bb2', 'Eb3', 'Ab3', 'Db4', 'F4']);
    expect(keySet.chords[2]?.notes).toEqual(SO_WHAT_MAJOR_M7_VOICINGS.AbM7?.notes);
  });

  it('lookup キー（C/D/E/G）は単体表と一致', () => {
    expect(MAJOR_II_VI_VOICINGS_BY_KEY.D.chords[0]?.notes).toEqual(SO_WHAT_M7_VOICINGS.Em7?.notes);
    expect(MAJOR_II_VI_VOICINGS_BY_KEY.D.chords[1]?.notes).toEqual(UST_BVI_7ALT_VOICINGS.A7alt?.notes);
    expect(MAJOR_II_VI_VOICINGS_BY_KEY.D.chords[2]?.notes).toEqual(SO_WHAT_MAJOR_M7_VOICINGS.DM7?.notes);
  });

  it('キーペア進行は 6 コード', () => {
    const progression = TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON.progressions[0];
    const chords = getMajorIiViProgressionChords(progression);
    expect(chords).toHaveLength(6);
  });

  it('まとめ進行は 36 コード', () => {
    const summary = TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON.progressions.find(
      (entry) => entry.isSummary,
    );
    expect(summary).toBeDefined();
    if (!summary) {
      return;
    }
    const chords = getMajorIiViProgressionChords(summary);
    expect(chords).toHaveLength(36);
  });

  it('クイズは sequential、キーペア 6 問', () => {
    const progression = TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON.progressions[0];
    const items = buildMajorIiViQuizItems(progression);
    expect(items).toHaveLength(6);
    expect(items.map((item) => item.measureNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('survival stage_number は 1265〜1271', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON;
    expect(resolveAdvancedMajorIiViSurvivalStageNumberForProgression(lesson.progressions[0])).toBe(1265);
    expect(resolveAdvancedMajorIiViSurvivalStageNumberForProgression(lesson.progressions[6])).toBe(1271);
  });

  it('F7alt は Bbb3 表記', () => {
    const keySet = MAJOR_II_VI_VOICINGS_BY_KEY.Bb;
    expect(keySet.chords[1]?.notes[1]).toBe('Bbb3');
  });
});
