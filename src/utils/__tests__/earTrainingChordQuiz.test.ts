import { describe, expect, it } from 'vitest';
import type { EarTrainingChordQuizItem, EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  buildEarTrainingChordQuizQuestions,
  getActiveChordInQuizQuestion,
  isChordQuizQuestionCompleted,
  pickNextQuizIndex,
  isQuizClear,
  quizEnemyHpAfterCorrect,
  shouldShowEarTrainingChordQuizPreview,
} from '@/utils/earTrainingChordQuiz';

const three = [{ order_index: 0 }, { order_index: 1 }, { order_index: 2 }];

describe('pickNextQuizIndex', () => {
  it('returns 0 for sequential with prev null', () => {
    expect(pickNextQuizIndex(three, 'sequential', null, () => 0)).toBe(0);
  });

  it('cycles sequential', () => {
    expect(pickNextQuizIndex(three, 'sequential', 0, () => 0)).toBe(1);
    expect(pickNextQuizIndex(three, 'sequential', 2, () => 0)).toBe(0);
  });

  it('returns 0 for single item random', () => {
    expect(pickNextQuizIndex([{ order_index: 0 }], 'random', 0, () => 0.99)).toBe(0);
  });

  it('random never equals prev when n>1 and rand avoids equality', () => {
    const seq = [0.99, 0.99, 0.66];
    let i = 0;
    const rand = () => {
      const v = seq[i] ?? 0.1;
      i += 1;
      return v;
    };
    const first = pickNextQuizIndex(three, 'random', null, rand);
    const second = pickNextQuizIndex(three, 'random', first, rand);
    expect(second).not.toBe(first);
    const third = pickNextQuizIndex(three, 'random', second, () => second / 10);
    expect(third).not.toBe(second);
  });

  it('random falls back (+1)%n after guard when rand stalls on prevIndex', () => {
    let call = 0;
    const stalledRand = () => {
      call += 1;
      return call <= 35 ? 0.5 : 0.1;
    };
    expect(pickNextQuizIndex(three, 'random', 1, stalledRand)).toBe(2);
  });
});

describe('isQuizClear', () => {
  it('checks threshold', () => {
    expect(isQuizClear(10, 10)).toBe(true);
    expect(isQuizClear(9, 10)).toBe(false);
  });
});

describe('quizEnemyHpAfterCorrect', () => {
  it('returns maxHp at zero correct and 0 at full clear', () => {
    expect(quizEnemyHpAfterCorrect(0, 20, 10_000)).toBe(10_000);
    expect(quizEnemyHpAfterCorrect(20, 20, 10_000)).toBe(0);
    expect(quizEnemyHpAfterCorrect(10, 20, 10_000)).toBe(5000);
  });

  it('returns 0 when required is 0 and correct meets guarded threshold', () => {
    expect(quizEnemyHpAfterCorrect(1, 0, 10_000)).toBe(0);
  });

  it('accumulated step damage equals maxHp and final HP is 0', () => {
    const verifyAccumulation = (required: number, maxHp: number) => {
      let prevHp = maxHp;
      let totalDamage = 0;
      for (let correct = 1; correct <= required; correct += 1) {
        const nextHp = quizEnemyHpAfterCorrect(correct, required, maxHp);
        totalDamage += prevHp - nextHp;
        prevHp = nextHp;
      }
      expect(totalDamage).toBe(maxHp);
      expect(prevHp).toBe(0);
    };
    verifyAccumulation(20, 10_000);
    verifyAccumulation(30, 10_000);
  });
});

describe('shouldShowEarTrainingChordQuizPreview', () => {
  const base = {
    practiceMode: true,
    isTutorial: false,
    activeQuestionId: 'q1',
    previewQuestionId: 'q2',
    correctCount: 0,
    quizRequiredCorrectCount: 10,
    tutorialQuestionsAnswered: 0,
    tutorialQuestionCount: 3,
  };

  it('returns false in production battle', () => {
    expect(shouldShowEarTrainingChordQuizPreview({
      ...base,
      practiceMode: false,
    })).toBe(false);
  });

  it('returns true in practice when not on final question', () => {
    expect(shouldShowEarTrainingChordQuizPreview(base)).toBe(true);
  });

  it('returns false in practice on final question', () => {
    expect(shouldShowEarTrainingChordQuizPreview({
      ...base,
      correctCount: 9,
    })).toBe(false);
  });

  it('returns true in tutorial even when not practice mode', () => {
    expect(shouldShowEarTrainingChordQuizPreview({
      ...base,
      practiceMode: false,
      isTutorial: true,
    })).toBe(true);
  });
});

const buildQuizItem = (
  overrides: Partial<EarTrainingChordQuizItem> & { id: string; order_index: number },
): EarTrainingChordQuizItem => ({
  id: overrides.id,
  stage_id: overrides.stage_id ?? 'stage-1',
  order_index: overrides.order_index,
  measure_number: overrides.measure_number,
  beat_offset: overrides.beat_offset,
  duration_beats: overrides.duration_beats,
  chord_name: overrides.chord_name ?? 'CM7',
  voicing: overrides.voicing ?? ['C4', 'E4', 'G4', 'B4'],
  voicing_staves: overrides.voicing_staves ?? [1, 1, 1, 1],
});

const buildPhraseChord = (
  overrides: Partial<EarTrainingPhraseChord> & { id: string; order_index: number },
): EarTrainingPhraseChord => ({
  id: overrides.id,
  phrase_id: overrides.phrase_id ?? 'phrase-1',
  order_index: overrides.order_index,
  chord_name: overrides.chord_name ?? 'CM7',
  measure_number: overrides.measure_number,
  beat_offset: overrides.beat_offset,
  duration_beats: overrides.duration_beats,
  start_time_sec: overrides.start_time_sec,
  end_time_sec: overrides.end_time_sec,
  voicing: overrides.voicing ?? ['C4', 'E4', 'G4', 'B4'],
  voicing_staves: overrides.voicing_staves ?? [1, 1, 1, 1],
});

const buildPhrase = (
  chords: EarTrainingPhraseChord[],
  overrides: Partial<EarTrainingPhrase> = {},
): EarTrainingPhrase => ({
  id: overrides.id ?? 'phrase-1',
  stage_id: overrides.stage_id ?? 'stage-1',
  order_index: overrides.order_index ?? 0,
  key_fifths: overrides.key_fifths,
  audio_url: overrides.audio_url ?? 'https://example.com/phrase.mp3',
  loop_duration_sec: overrides.loop_duration_sec ?? 4,
  audio_duration_sec: overrides.audio_duration_sec ?? 4,
  note_count: overrides.note_count ?? 0,
  chords,
});

describe('buildEarTrainingChordQuizQuestions', () => {
  it('groups quiz items with the same measure_number into one question', () => {
    const questions = buildEarTrainingChordQuizQuestions({
      chord_quiz_items: [
        buildQuizItem({ id: 'm1-b2', order_index: 1, measure_number: 1, beat_offset: 3, chord_name: 'G7' }),
        buildQuizItem({ id: 'm2-b1', order_index: 2, measure_number: 2, beat_offset: 1, chord_name: 'FM7' }),
        buildQuizItem({ id: 'm1-b1', order_index: 0, measure_number: 1, beat_offset: 1, chord_name: 'CM7' }),
      ],
    });

    expect(questions).toHaveLength(2);
    expect(questions[0].measure_number).toBe(1);
    expect(questions[0].chords.map(chord => chord.id)).toEqual(['m1-b1', 'm1-b2']);
    expect(questions[1].measure_number).toBe(2);
    expect(questions[1].chords.map(chord => chord.id)).toEqual(['m2-b1']);
  });

  it('keeps legacy quiz items without measure_number as one chord per question', () => {
    const questions = buildEarTrainingChordQuizQuestions({
      chord_quiz_items: [
        buildQuizItem({ id: 'c1', order_index: 0 }),
        buildQuizItem({ id: 'c2', order_index: 1 }),
      ],
    });

    expect(questions).toHaveLength(2);
    expect(questions.map(question => question.chords.length)).toEqual([1, 1]);
  });

  it('falls back to phrase chords and treats a completed measure as one question', () => {
    const first = buildPhraseChord({ id: 'c1', order_index: 0, measure_number: 1, beat_offset: 1 });
    const second = buildPhraseChord({ id: 'c2', order_index: 1, measure_number: 1, beat_offset: 3 });
    const third = buildPhraseChord({ id: 'c3', order_index: 2, measure_number: 2, beat_offset: 1 });
    const questions = buildEarTrainingChordQuizQuestions({
      chord_quiz_items: [],
      phrases: [buildPhrase([third, second, first], { key_fifths: -1 })],
    });

    expect(questions).toHaveLength(2);
    expect(questions[0].key_fifths).toBe(-1);
    expect(getActiveChordInQuizQuestion(questions[0], new Set())).toBe(first);
    expect(isChordQuizQuestionCompleted(questions[0], new Set(['c1']))).toBe(false);
    expect(getActiveChordInQuizQuestion(questions[0], new Set(['c1']))).toBe(second);
    expect(isChordQuizQuestionCompleted(questions[0], new Set(['c1', 'c2']))).toBe(true);
    expect(questions[1].chords.map(chord => chord.id)).toEqual(['c3']);
  });
});
