import {
  MM7_913_VOICINGS,
  M7B5_911_VOICINGS,
  UST_BVI_7ALT_VOICINGS,
} from '@/utils/twoHandVoicingAdvancedCourse';
import {
  buildMinorIiViQuizItems,
  getMinorIiViProgressionChords,
  MINOR_II_VI_VOICINGS_BY_KEY,
  resolveAdvancedMinorIiViSurvivalStageNumberForProgression,
  TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON,
} from '@/utils/twoHandVoicingAdvancedMinorIiViCourse';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

describe('twoHandVoicingAdvancedMinorIiViCourse', () => {
  it('Cm キー 251 は 3 コード・ユーザー指定ヴォイシング', () => {
    const keySet = MINOR_II_VI_VOICINGS_BY_KEY.Cm;
    expect(keySet.chords[0]?.symbol).toBe('Dm7b5');
    expect(keySet.chords[0]?.notes).toEqual(['D3', 'Ab3', 'C4', 'E4', 'G4']);
    expect(keySet.chords[1]?.symbol).toBe('G7alt');
    expect(keySet.chords[1]?.notes).toEqual(['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']);
    expect(keySet.chords[2]?.symbol).toBe('CmM7');
    expect(keySet.chords[2]?.notes).toEqual(['A3', 'Eb4', 'G4', 'B4', 'D5']);
  });

  it('Cm キー トップラインは 5度 → ♭7/#9 → 9度 (G → Bb → D)', () => {
    const keySet = MINOR_II_VI_VOICINGS_BY_KEY.Cm;
    const topNotes = keySet.chords.map((chordSpec) => {
      const topName = chordSpec.notes[chordSpec.notes.length - 1];
      return parseVoicingNoteName(topName).midi % 12;
    });
    expect(topNotes).toEqual([7, 10, 2]);
  });

  it('Am キー IIm7b5 は低域 B2 始まり', () => {
    const keySet = MINOR_II_VI_VOICINGS_BY_KEY.Am;
    expect(keySet.chords[0]?.notes).toEqual(['B2', 'F3', 'A3', 'C#4', 'E4']);
    expect(keySet.chords[2]?.notes).toEqual(MM7_913_VOICINGS.AmM7?.notes);
  });

  it('キーペア進行は 6 コード', () => {
    const progression = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON.progressions[0];
    const chords = getMinorIiViProgressionChords(progression);
    expect(chords).toHaveLength(6);
  });

  it('まとめ進行は 36 コード', () => {
    const summary = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON.progressions.find(
      (entry) => entry.isSummary,
    );
    expect(summary).toBeDefined();
    if (!summary) {
      return;
    }
    const chords = getMinorIiViProgressionChords(summary);
    expect(chords).toHaveLength(36);
  });

  it('Dm キーは単体表 lookup と一致', () => {
    const keySet = MINOR_II_VI_VOICINGS_BY_KEY.Dm;
    expect(keySet.chords[0]?.notes).toEqual(M7B5_911_VOICINGS.Em7b5?.notes);
    expect(keySet.chords[1]?.notes).toEqual(UST_BVI_7ALT_VOICINGS.A7alt?.notes);
    expect(keySet.chords[2]?.notes).toEqual(MM7_913_VOICINGS.DmM7?.notes);
  });

  it('survival stage_number は 1284〜1290', () => {
    const lesson = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON;
    expect(resolveAdvancedMinorIiViSurvivalStageNumberForProgression(lesson.progressions[0])).toBe(1284);
    expect(resolveAdvancedMinorIiViSurvivalStageNumberForProgression(lesson.progressions[6])).toBe(1290);
  });

  it('F7alt は Bbb3 表記', () => {
    const keySet = MINOR_II_VI_VOICINGS_BY_KEY.Bbm;
    expect(keySet.chords[1]?.notes[1]).toBe('Bbb3');
  });

  it('クイズは sequential、キーペア 6 問', () => {
    const progression = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON.progressions[0];
    const items = buildMinorIiViQuizItems(progression);
    expect(items).toHaveLength(6);
  });
});
