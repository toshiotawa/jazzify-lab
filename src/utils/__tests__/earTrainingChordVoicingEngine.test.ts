import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  acknowledgeChordAward,
  countChordVoicingMisses,
  createChordVoicingAttempt,
  getVoicingPitchClasses,
  handleChordVoicingNoteOn,
  isAllChordsCompleted,
  selectChordVoicingJudgmentChord,
} from '@/utils/earTrainingChordVoicingEngine';

const damage = {
  perCorrectNote: 1,
  good: 8,
  great: 12,
  perfect: 16,
  miss: 3,
  fail: 10,
};

const buildChord = (overrides: Partial<EarTrainingPhraseChord> & { id: string }): EarTrainingPhraseChord => ({
  id: overrides.id,
  phrase_id: overrides.phrase_id ?? 'phrase-1',
  order_index: overrides.order_index ?? 0,
  chord_name: overrides.chord_name ?? 'Dm7',
  voicing: overrides.voicing ?? ['D4', 'F4', 'A4', 'C5'],
  voicing_staves: overrides.voicing_staves ?? [1, 1, 1, 1],
  start_time_sec: overrides.start_time_sec ?? 0,
  end_time_sec: overrides.end_time_sec ?? 2,
});

const buildPhrase = (chords: EarTrainingPhraseChord[]): EarTrainingPhrase => ({
  id: 'phrase-1',
  stage_id: 'stage-1',
  order_index: 0,
  audio_url: 'https://example.com/phrase.mp3',
  loop_duration_sec: 8,
  audio_duration_sec: 48,
  note_count: 0,
  chords,
});

describe('earTrainingChordVoicingEngine', () => {
  it('voicing からピッチクラス集合を生成する（重複除去）', () => {
    const chord = buildChord({ id: 'c1', voicing: ['D4', 'D5', 'F4', 'A4', 'C5'] });
    const pcs = getVoicingPitchClasses(chord);
    expect(pcs.sort()).toEqual([0, 2, 5, 9]);
  });

  it('オクターブ違いを許容して順不同で完成する', () => {
    const chord = buildChord({ id: 'c1' }); // D F A C
    const phrase = buildPhrase([chord]);
    let attempt = createChordVoicingAttempt(phrase);

    const results: ReturnType<typeof handleChordVoicingNoteOn>[] = [];
    [69, 65, 60, 50].forEach(note => {
      const result = handleChordVoicingNoteOn(attempt, chord, note, damage);
      attempt = result.attempt;
      results.push(result);
    });

    expect(results[0].chordJustCompleted).toBe(false);
    expect(results[0].firstWrongJustHappened).toBe(false);
    expect(results[3].chordJustCompleted).toBe(true);
    expect(results[3].enemyDamage).toBe(damage.perCorrectNote);
    expect(results[3].firstWrongJustHappened).toBe(false);
    expect(attempt.completedChordIds.has('c1')).toBe(true);
  });

  it('構成音外のミスタッチは5回まで評価に加算し、被ダメは発生しない', () => {
    const chord = buildChord({ id: 'c1' });
    const phrase = buildPhrase([chord]);
    let attempt = createChordVoicingAttempt(phrase);

    for (let index = 0; index < 7; index += 1) {
      const result = handleChordVoicingNoteOn(attempt, chord, 61, damage);
      attempt = result.attempt;
      expect(result.evaluationMissAdded).toBe(index < 5);
      expect(result.playerDamage).toBe(0);
      expect(result.firstWrongJustHappened).toBe(index === 0);
    }
    expect(countChordVoicingMisses(attempt)).toBe(5);
  });

  it('suppressMissRecording でミスの記録のみ抑止できる', () => {
    const chord = buildChord({ id: 'c1' });
    const phrase = buildPhrase([chord]);
    const attempt = createChordVoicingAttempt(phrase);
    const r = handleChordVoicingNoteOn(attempt, chord, 61, damage, {
      suppressMissRecording: true,
    });
    expect(r.attempt).toBe(attempt);
    expect(r.firstWrongJustHappened).toBe(false);
    expect(countChordVoicingMisses(r.attempt)).toBe(0);
  });

  it('wrongNotesPolicy first_only_per_chord は1コードにつき1回だけミス記録する', () => {
    const chord = buildChord({ id: 'c1' });
    const phrase = buildPhrase([chord]);
    let attempt = createChordVoicingAttempt(phrase);

    const first = handleChordVoicingNoteOn(attempt, chord, 61, damage, {
      wrongNotesPolicy: 'first_only_per_chord',
    });
    expect(first.firstWrongJustHappened).toBe(true);
    expect(first.evaluationMissAdded).toBe(true);
    attempt = first.attempt;

    const second = handleChordVoicingNoteOn(attempt, chord, 63, damage, {
      wrongNotesPolicy: 'first_only_per_chord',
    });
    expect(second.attempt).toBe(attempt);
    expect(second.firstWrongJustHappened).toBe(false);
    expect(second.evaluationMissAdded).toBe(false);
    expect(countChordVoicingMisses(second.attempt)).toBe(1);
  });

  it('完成済みコードに対する追加入力は無視される', () => {
    const chord = buildChord({ id: 'c1' });
    const phrase = buildPhrase([chord]);
    let attempt = createChordVoicingAttempt(phrase);
    [50, 53, 57, 60].forEach(note => {
      attempt = handleChordVoicingNoteOn(attempt, chord, note, damage).attempt;
    });
    expect(attempt.completedChordIds.has('c1')).toBe(true);

    const extra = handleChordVoicingNoteOn(attempt, chord, 50, damage);
    expect(extra.attempt).toBe(attempt);
    expect(extra.chordJustCompleted).toBe(false);
  });

  it('全コード完成検知 isAllChordsCompleted', () => {
    const c1 = buildChord({ id: 'c1', chord_name: 'Dm7' });
    const c2 = buildChord({ id: 'c2', chord_name: 'G7', voicing: ['G3', 'B3', 'D4', 'F4'], voicing_staves: [2, 2, 1, 1] });
    const phrase = buildPhrase([c1, c2]);
    let attempt = createChordVoicingAttempt(phrase);
    expect(isAllChordsCompleted(phrase, attempt)).toBe(false);

    [62, 65, 69, 60].forEach(note => {
      attempt = handleChordVoicingNoteOn(attempt, c1, note, damage).attempt;
    });
    expect(isAllChordsCompleted(phrase, attempt)).toBe(false);

    [55, 59, 62, 65].forEach(note => {
      attempt = handleChordVoicingNoteOn(attempt, c2, note, damage).attempt;
    });
    expect(isAllChordsCompleted(phrase, attempt)).toBe(true);
  });

  it('acknowledgeChordAward は同一コードに対して冪等', () => {
    const phrase = buildPhrase([buildChord({ id: 'c1' })]);
    const attempt = createChordVoicingAttempt(phrase);
    const first = acknowledgeChordAward(attempt, 'c1');
    expect(first.awardedChordIds.has('c1')).toBe(true);
    const second = acknowledgeChordAward(first, 'c1');
    expect(second).toBe(first);
  });

  it('voicing が空のコードは完成済み扱いになり、入力してもミス判定しない', () => {
    const restChord = buildChord({ id: 'rest', chord_name: 'CM7', voicing: [], voicing_staves: [] });
    const playableChord = buildChord({ id: 'playable', chord_name: 'CM7' });
    const phrase = buildPhrase([restChord, playableChord]);
    const attempt = createChordVoicingAttempt(phrase);

    expect(attempt.completedChordIds.has('rest')).toBe(true);
    expect(isAllChordsCompleted(phrase, attempt)).toBe(false);

    const result = handleChordVoicingNoteOn(attempt, restChord, 60, damage);
    expect(result.attempt).toBe(attempt);
    expect(result.evaluationMissAdded).toBe(false);
    expect(result.firstWrongJustHappened).toBe(false);
    expect(result.chordJustCompleted).toBe(false);
    expect(countChordVoicingMisses(result.attempt)).toBe(0);
  });

  it('重ね合わせ判定では同じピッチクラスなら現在voicingの未正解音を優先する', () => {
    const current = buildChord({ id: 'current', chord_name: 'C', voicing: ['C4', 'E4', 'G4'] });
    const overlap = buildChord({ id: 'overlap', chord_name: 'G7', voicing: ['G3', 'B3', 'D4'] });
    const phrase = buildPhrase([current, overlap]);
    const attempt = createChordVoicingAttempt(phrase);

    expect(selectChordVoicingJudgmentChord(attempt, current, overlap, 67)?.id).toBe('current');
  });

  it('現在voicing側で同じピッチクラスが正解済みなら重ね合わせ先を判定する', () => {
    const current = buildChord({ id: 'current', chord_name: 'C', voicing: ['C4', 'E4', 'G4'] });
    const overlap = buildChord({ id: 'overlap', chord_name: 'G7', voicing: ['G3', 'B3', 'D4'] });
    const phrase = buildPhrase([current, overlap]);
    const attempt = createChordVoicingAttempt(phrase);
    attempt.pressedByChord.set(current.id, new Set([7]));

    expect(selectChordVoicingJudgmentChord(attempt, current, overlap, 67)?.id).toBe('overlap');
  });
});
