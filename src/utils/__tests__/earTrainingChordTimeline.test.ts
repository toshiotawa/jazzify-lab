import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import { createChordVoicingAttempt } from '@/utils/earTrainingChordVoicingEngine';
import {
  getEarTrainingChordDisplayAtTime,
  getEarTrainingHalfBeatSec,
  getEarTrainingHarmonyHudRows,
  getEarTrainingNextChordDisplayBoundarySec,
  getHarmonyRowForChordId,
  isHarmonySegmentFullyCompleted,
} from '@/utils/earTrainingChordTimeline';

const buildChord = (
  overrides: Partial<EarTrainingPhraseChord> & { id: string; start_time_sec: number; end_time_sec?: number | null },
): EarTrainingPhraseChord => ({
  id: overrides.id,
  phrase_id: overrides.phrase_id ?? 'phrase-1',
  order_index: overrides.order_index ?? 0,
  chord_name: overrides.chord_name ?? 'Dm7',
  start_time_sec: overrides.start_time_sec,
  end_time_sec: overrides.end_time_sec ?? overrides.start_time_sec + 2,
  voicing: overrides.voicing ?? ['D4', 'F4', 'A4', 'C5'],
  voicing_staves: overrides.voicing_staves ?? [1, 1, 1, 1],
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

describe('earTrainingChordTimeline', () => {
  it('開始前とコード区間外は判定対象なし、区間内だけ現在コードを返す', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', start_time_sec: 1, end_time_sec: 2 }),
      buildChord({ id: 'c2', start_time_sec: 3, end_time_sec: 4 }),
    ]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 0.5, 120, new Set())).toBeNull();
    expect(getEarTrainingChordDisplayAtTime(phrase, 1.5, 120, new Set())?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 2.5, 120, new Set())).toBeNull();
    expect(getEarTrainingChordDisplayAtTime(phrase, 3.5, 120, new Set())?.id).toBe('c2');
  });

  it('別harmony（終端が異なる）では時刻が進めば次コードへ移る', () => {
    const first = buildChord({ id: 'c1', start_time_sec: 0, end_time_sec: 1 });
    const second = buildChord({ id: 'c2', start_time_sec: 1, end_time_sec: 2 });
    const third = buildChord({ id: 'c3', start_time_sec: 2, end_time_sec: 3 });
    const phrase = buildPhrase([first, second, third]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 0.5, 120, new Set())?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 1.5, 120, new Set())?.id).toBe('c2');
    expect(getEarTrainingChordDisplayAtTime(phrase, 2.5, 120, new Set())?.id).toBe('c3');
  });

  it('同一harmony内は未完成があれば時刻が進んでも先頭未完成に留まる', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'C', start_time_sec: 1, end_time_sec: 4 }),
      buildChord({ id: 'c3', chord_name: 'C', start_time_sec: 2, end_time_sec: 4 }),
      buildChord({ id: 'm2-1', chord_name: 'CM7', start_time_sec: 4, end_time_sec: 8 }),
    ]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 1.5, 120, new Set())?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 2.5, 120, new Set())?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 2.5, 120, new Set(['c1']))?.id).toBe('c2');
    expect(getEarTrainingChordDisplayAtTime(phrase, 4.1, 120, new Set())?.id).toBe('m2-1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 3.8, 120, new Set(['c1', 'c2', 'c3']))?.id).toBe('m2-1');
  });

  it('harmony終端を過ぎたら次harmonyの先頭へ移る（未完成が残っていても）', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'C', start_time_sec: 1, end_time_sec: 4 }),
      buildChord({ id: 'm2-1', chord_name: 'CM7', start_time_sec: 4, end_time_sec: 8 }),
    ]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 4.05, 120, new Set(['c1']))?.id).toBe('m2-1');
  });

  it('voicing が空の harmony は区間内だけ休符コードを返し、前区間完成による早進はしない', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'G7', start_time_sec: 0, end_time_sec: 2 }),
      buildChord({ id: 'rest', chord_name: 'CM7', start_time_sec: 2, end_time_sec: 4, voicing: [], voicing_staves: [] }),
      buildChord({ id: 'c2', chord_name: 'CM7', start_time_sec: 4, end_time_sec: 6 }),
    ]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 1.8, 120, new Set(['c1']))?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 2.2, 120, new Set(['rest']))?.id).toBe('rest');
    expect(getEarTrainingChordDisplayAtTime(phrase, 4.1, 120, new Set(['rest']))?.id).toBe('c2');
  });

  it('グループ完成後は次プレイアブル開始の半拍前まで現在コードを保持し、その後次コードへ切り替える', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'DM7', start_time_sec: 4, end_time_sec: 8 }),
    ]);
    const bpm = 120;
    const half = getEarTrainingHalfBeatSec(bpm);
    const completed = new Set(['c1']);
    expect(getEarTrainingChordDisplayAtTime(phrase, 4 - half - 0.02, bpm, completed)?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 4 - half + 0.02, bpm, completed)?.id).toBe('c2');
    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 1, bpm, completed)).toBeCloseTo(4 - half, 10);
  });

  it('未完成時は半拍オフセットをかけず標準の時間境界で次グループへ移る', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'DM7', start_time_sec: 4, end_time_sec: 8 }),
    ]);
    const bpm = 120;
    expect(getEarTrainingChordDisplayAtTime(phrase, 3.9, bpm, new Set())?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 4.05, bpm, new Set())?.id).toBe('c2');
  });

  it('次の表示境界はharmony終端など次にアクティブが変わり得る時刻', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'CM7', start_time_sec: 4, end_time_sec: 8 }),
    ]);

    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 1.2, 120, new Set())).toBe(4);
    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 4.1, 120, new Set())).toBe(8);
  });

  it('休符グループを挟む場合、完成済みでも次プレイアブル半拍前までは当該グループ終端でクリップされる', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'G7', start_time_sec: 0, end_time_sec: 2 }),
      buildChord({ id: 'rest', chord_name: 'CM7', start_time_sec: 2, end_time_sec: 4, voicing: [], voicing_staves: [] }),
      buildChord({ id: 'c2', chord_name: 'CM7', start_time_sec: 4, end_time_sec: 6 }),
    ]);
    const bpm = 120;
    const half = getEarTrainingHalfBeatSec(bpm);
    const completed = new Set(['c1', 'rest']);
    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 2.1, bpm, completed)).toBeCloseTo(4 - half, 10);
  });

  it('コード終端と次コード開始にギャップがある場合は両方を境界として返す', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', start_time_sec: 1, end_time_sec: 2 }),
      buildChord({ id: 'c2', start_time_sec: 3, end_time_sec: 4 }),
    ]);

    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 1.2, 120, new Set())).toBe(2);
    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 2.2, 120, new Set())).toBe(3);
  });

  it('HUD行はharmonyごとに1行（代表IDとvoicing列）', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'C', start_time_sec: 1, end_time_sec: 4 }),
      buildChord({ id: 'm2-1', chord_name: 'CM7', start_time_sec: 4, end_time_sec: 8 }),
    ]);

    expect(getEarTrainingHarmonyHudRows(phrase)).toEqual([
      { representativeId: 'c1', chordName: 'C', voicingIds: ['c1', 'c2'] },
      { representativeId: 'm2-1', chordName: 'CM7', voicingIds: ['m2-1'] },
    ]);
  });

  it('getHarmonyRowForChordId は同一 harmony 内のどの voicing ID でも代表行を返す', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'C', start_time_sec: 1, end_time_sec: 4 }),
    ]);
    const rowC2 = getHarmonyRowForChordId(phrase, 'c2');
    expect(rowC2).toEqual({
      representativeId: 'c1',
      chordName: 'C',
      voicingIds: ['c1', 'c2'],
    });
  });

  it('isHarmonySegmentFullyCompleted は行内の全 voicing が completed のときだけ true', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', chord_name: 'C', start_time_sec: 0, end_time_sec: 4 }),
      buildChord({ id: 'c2', chord_name: 'C', start_time_sec: 1, end_time_sec: 4 }),
    ]);
    const row = getHarmonyRowForChordId(phrase, 'c1');
    expect(row).not.toBeNull();
    const partial = createChordVoicingAttempt(phrase);
    partial.completedChordIds.add('c1');
    expect(isHarmonySegmentFullyCompleted(partial, row!)).toBe(false);
    const full = createChordVoicingAttempt(phrase);
    full.completedChordIds.add('c1');
    full.completedChordIds.add('c2');
    expect(isHarmonySegmentFullyCompleted(full, row!)).toBe(true);
  });
});
