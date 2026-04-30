import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase } from '@/types';
import {
  calculateEarTrainingRank,
  createPhraseAttempt,
  getNextMeasureDelaySec,
  handleEarTrainingNoteInput,
  isMatchingPitchClass,
  resolveEarTrainingOutcome,
} from '@/utils/earTrainingEngine';

const phrase: EarTrainingPhrase = {
  id: 'phrase-1',
  stage_id: 'stage-1',
  order_index: 0,
  audio_url: 'https://example.com/phrase.mp3',
  loop_duration_sec: 4,
  audio_duration_sec: 24,
  note_count: 3,
  notes: [
    {
      id: 'n1',
      phrase_id: 'phrase-1',
      note_index: 0,
      pitch_midi: 62,
      pitch_class: 2,
      note_name: 'D4',
    },
    {
      id: 'n2',
      phrase_id: 'phrase-1',
      note_index: 1,
      pitch_midi: 63,
      pitch_class: 3,
      note_name: 'Eb4',
    },
    {
      id: 'n3',
      phrase_id: 'phrase-1',
      note_index: 2,
      pitch_midi: 65,
      pitch_class: 5,
      note_name: 'F4',
    },
  ],
};

const damage = {
  perCorrectNote: 1,
  good: 8,
  great: 12,
  perfect: 16,
  miss: 3,
  fail: 10,
};

describe('earTrainingEngine', () => {
  it('オクターブ違いを正解にする', () => {
    expect(isMatchingPitchClass(phrase.notes![0], 50)).toBe(true);
  });

  it('異名同音を同じpitch classとして扱う', () => {
    expect(isMatchingPitchClass(phrase.notes![1], 75)).toBe(true);
  });

  it('同じ音でのミスダメージと評価ミスを5回まで加算する', () => {
    const attempt = createPhraseAttempt(phrase);
    const first = handleEarTrainingNoteInput(phrase, attempt, 60, damage);
    const second = handleEarTrainingNoteInput(phrase, first.attempt, 61, damage);
    const third = handleEarTrainingNoteInput(phrase, second.attempt, 64, damage);
    const fourth = handleEarTrainingNoteInput(phrase, third.attempt, 65, damage);
    const fifth = handleEarTrainingNoteInput(phrase, fourth.attempt, 66, damage);
    const sixth = handleEarTrainingNoteInput(phrase, fifth.attempt, 67, damage);

    expect(first.playerDamage).toBe(3);
    expect(first.evaluationMissAdded).toBe(true);
    expect(second.playerDamage).toBe(3);
    expect(second.evaluationMissAdded).toBe(true);
    expect(third.playerDamage).toBe(3);
    expect(third.evaluationMissAdded).toBe(true);
    expect(fourth.playerDamage).toBe(3);
    expect(fourth.evaluationMissAdded).toBe(true);
    expect(fifth.playerDamage).toBe(3);
    expect(fifth.evaluationMissAdded).toBe(true);
    expect(sixth.playerDamage).toBe(0);
    expect(sixth.evaluationMissAdded).toBe(false);
    expect(sixth.attempt.missedNoteCounts.get(0)).toBe(5);
  });

  it('ダメージ0設定では正解とミスのダメージを発生させない', () => {
    const noDamage = {
      perCorrectNote: 0,
      good: 0,
      great: 0,
      perfect: 0,
      miss: 0,
      fail: 0,
    };
    const correct = handleEarTrainingNoteInput(phrase, createPhraseAttempt(phrase), 62, noDamage);
    const miss = handleEarTrainingNoteInput(phrase, createPhraseAttempt(phrase), 60, noDamage);

    expect(correct.enemyDamage).toBe(0);
    expect(miss.playerDamage).toBe(0);
    expect(miss.evaluationMissAdded).toBe(true);
    expect(miss.attempt.missedNoteCounts.get(0)).toBe(1);
  });

  it('現在の次音だけを開示し、最後の正解で完了にする', () => {
    const first = handleEarTrainingNoteInput(phrase, createPhraseAttempt(phrase), 62, damage);
    const second = handleEarTrainingNoteInput(phrase, first.attempt, 75, damage);
    const third = handleEarTrainingNoteInput(phrase, second.attempt, 77, damage);

    expect(first.revealedNote).toBe('D');
    expect(second.revealedNote).toBe('Eb');
    expect(third.completed).toBe(true);
    expect(third.attempt.revealedNotes).toEqual(['D', 'Eb', 'F']);
  });

  it('ミス数から評価ランクを算出する', () => {
    expect(calculateEarTrainingRank(new Map(), { perfectMaxMisses: 0, greatMaxMisses: 2 })).toBe('Perfect');
    expect(calculateEarTrainingRank(new Map([[1, 1], [2, 1]]), { perfectMaxMisses: 0, greatMaxMisses: 2 })).toBe('Great');
    expect(calculateEarTrainingRank(new Map([[0, 3]]), { perfectMaxMisses: 0, greatMaxMisses: 2 })).toBe('Good');
  });

  it('同時イベントの優先順位を守る', () => {
    expect(resolveEarTrainingOutcome({
      enemyHp: 0,
      playerHp: 0,
      timeRemainingSec: 0,
      phraseCompleted: true,
      phraseFailed: true,
    })).toBe('stageClear');

    expect(resolveEarTrainingOutcome({
      enemyHp: 10,
      playerHp: 0,
      timeRemainingSec: 0,
      phraseCompleted: true,
      phraseFailed: true,
    })).toBe('gameOver');
  });

  it('次小節頭までの待ち時間を計算する', () => {
    expect(getNextMeasureDelaySec(1.25, 4, 2)).toBeCloseTo(0.75);
  });
});
