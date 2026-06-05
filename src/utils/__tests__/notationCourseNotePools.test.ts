import {
  NOTATION_COURSE_ALL_TOPICS,
  NOTATION_COURSE_TOPICS_BY_BLOCK,
  assertTopicsOrderedByLowestNote,
  getNotationCourseTopicsForBlocks,
  getTopicLowestMidi,
  toRandomChordEntries,
} from '@/utils/notationCourseNotePools';
import { parseNoteNameToMidi } from '@/utils/survivalLessonConfig';

describe('notationCourseNotePools', () => {
  it('全40トピックが定義されている', () => {
    expect(NOTATION_COURSE_ALL_TOPICS).toHaveLength(40);
  });

  it('各ブロックのトピック数が仕様どおり', () => {
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[1]).toHaveLength(5);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[4]).toHaveLength(1);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[9]).toHaveLength(1);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[10]).toHaveLength(3);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[12]).toHaveLength(1);
  });

  it('ブロック内クエスト（まとめ除く）は最低音から昇順', () => {
    for (const blockNumber of [1, 2, 3, 5, 6, 7]) {
      const topics = (NOTATION_COURSE_TOPICS_BY_BLOCK[blockNumber] ?? []).filter(
        t => !t.titleJa.startsWith('まとめ'),
      );
      assertTopicsOrderedByLowestNote(topics);
    }
  });

  it('B1 ミファソは E4/F4/G4・ト音譜', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[1]?.[0];
    expect(topic?.titleJa).toBe('ミファソ');
    const entries = toRandomChordEntries(topic?.notes ?? []);
    expect(entries.map(e => e.voicingNames?.[0])).toEqual(['E4', 'F4', 'G4']);
    expect(entries.every(e => e.voicingStaves?.[0] === 1)).toBe(true);
    expect(getTopicLowestMidi(topic!)).toBe(parseNoteNameToMidi('E4'));
  });

  it('B5 最初のトピックは G2 から・ヘ音譜', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[5]?.[0];
    const entries = toRandomChordEntries(topic?.notes ?? []);
    expect(entries[0]?.voicingNames?.[0]).toBe('G2');
    expect(entries.every(e => e.voicingStaves?.[0] === 2)).toBe(true);
  });

  it('B9 はト音とヘ音が混在', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[9]?.[0];
    const staves = new Set(topic?.notes.map(n => n.staff));
    expect(staves.has(1)).toBe(true);
    expect(staves.has(2)).toBe(true);
  });

  it('Phase1 ブロック1-4 は16トピック', () => {
    expect(getNotationCourseTopicsForBlocks([1, 2, 3, 4])).toHaveLength(16);
  });

  it('Phase2 ブロック5-12 は24トピック', () => {
    expect(getNotationCourseTopicsForBlocks([5, 6, 7, 8, 9, 10, 11, 12])).toHaveLength(24);
  });
});
