import {
  LEARNING_NOTES_PER_QUEST,
  NOTATION_COURSE_ALL_TOPICS,
  NOTATION_COURSE_TOPICS_BY_BLOCK,
  assertTopicsOrderedByLowestNote,
  getNotationCourseTopicsForBlocks,
  getTopicLowestMidi,
  isLearningTopic,
  toRandomChordEntries,
} from '@/utils/notationCourseNotePools';
import { parseNoteNameToMidi } from '@/utils/survivalLessonConfig';

describe('notationCourseNotePools', () => {
  it('全32トピックが定義されている', () => {
    expect(NOTATION_COURSE_ALL_TOPICS).toHaveLength(32);
  });

  it('各ブロックのトピック数が仕様どおり', () => {
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[1]).toHaveLength(5);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[2]).toHaveLength(3);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[3]).toHaveLength(3);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[4]).toHaveLength(1);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[6]).toHaveLength(3);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[9]).toHaveLength(1);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[10]).toHaveLength(3);
    expect(NOTATION_COURSE_TOPICS_BY_BLOCK[12]).toHaveLength(1);
  });

  it('学習クエストは5音（まとめ・総合除く）', () => {
    const learningTopics = NOTATION_COURSE_ALL_TOPICS.filter(isLearningTopic);
    expect(learningTopics.length).toBeGreaterThan(0);
    for (const topic of learningTopics) {
      expect(topic.notes).toHaveLength(LEARNING_NOTES_PER_QUEST);
    }
  });

  it('ブロック内クエスト（まとめ除く）は最低音から昇順', () => {
    for (const blockNumber of [1, 2, 3, 5, 6, 7]) {
      const topics = (NOTATION_COURSE_TOPICS_BY_BLOCK[blockNumber] ?? []).filter(
        t => !t.titleJa.startsWith('まとめ'),
      );
      assertTopicsOrderedByLowestNote(topics);
    }
  });

  it('B1 ミファソラシは E4〜B4・ト音譜', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[1]?.[0];
    expect(topic?.titleJa).toBe('ミファソラシ');
    const entries = toRandomChordEntries(topic?.notes ?? []);
    expect(entries.map(e => e.voicingNames?.[0])).toEqual(['E4', 'F4', 'G4', 'A4', 'B4']);
    expect(entries.every(e => e.voicingStaves?.[0] === 1)).toBe(true);
    expect(getTopicLowestMidi(topic!)).toBe(parseNoteNameToMidi('E4'));
  });

  it('B2 は3クエスト（2学習+まとめ）', () => {
    const topics = NOTATION_COURSE_TOPICS_BY_BLOCK[2] ?? [];
    expect(topics).toHaveLength(3);
    expect(topics[0]?.notes).toHaveLength(5);
    expect(topics[1]?.notes).toHaveLength(5);
    expect(topics[2]?.notes).toHaveLength(6);
  });

  it('B5 最初のトピックは G2 から・ヘ音譜', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[5]?.[0];
    const entries = toRandomChordEntries(topic?.notes ?? []);
    expect(entries[0]?.voicingNames?.[0]).toBe('G2');
    expect(entries.every(e => e.voicingStaves?.[0] === 2)).toBe(true);
    expect(entries).toHaveLength(5);
  });

  it('B9 はト音とヘ音が混在', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[9]?.[0];
    const staves = new Set(topic?.notes.map(n => n.staff));
    expect(staves.has(1)).toBe(true);
    expect(staves.has(2)).toBe(true);
  });

  it('B10 ト音シャープは5音', () => {
    const topic = NOTATION_COURSE_TOPICS_BY_BLOCK[10]?.[0];
    expect(topic?.notes).toHaveLength(5);
    expect(topic?.notes.map(n => n.noteName)).toContain('A#4');
  });

  it('Phase1 ブロック1-4 は12トピック', () => {
    expect(getNotationCourseTopicsForBlocks([1, 2, 3, 4])).toHaveLength(12);
  });

  it('Phase2 ブロック5-12 は20トピック', () => {
    expect(getNotationCourseTopicsForBlocks([5, 6, 7, 8, 9, 10, 11, 12])).toHaveLength(20);
  });
});
