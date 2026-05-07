import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  getEarTrainingChordDisplayAtTime,
  getEarTrainingNextChordDisplayBoundarySec,
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
  it('明示されたコード区間外は判定対象なしにする', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', start_time_sec: 1, end_time_sec: 2 }),
      buildChord({ id: 'c2', start_time_sec: 3, end_time_sec: 4 }),
    ]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 0.5, 120, new Set())).toBeNull();
    expect(getEarTrainingChordDisplayAtTime(phrase, 2.5, 120, new Set())).toBeNull();
    expect(getEarTrainingChordDisplayAtTime(phrase, 4.5, 120, new Set())).toBeNull();
  });

  it('直前コードが完成済みなら次コードの判定開始を半拍早める', () => {
    const first = buildChord({ id: 'c1', start_time_sec: 0, end_time_sec: 2 });
    const second = buildChord({ id: 'c2', start_time_sec: 2, end_time_sec: 4 });
    const phrase = buildPhrase([first, second]);

    expect(getEarTrainingChordDisplayAtTime(phrase, 1.8, 120, new Set())?.id).toBe('c1');
    expect(getEarTrainingChordDisplayAtTime(phrase, 1.8, 120, new Set(['c1']))?.id).toBe('c2');
  });

  it('次の表示境界も半拍早めた時刻で返す', () => {
    const first = buildChord({ id: 'c1', start_time_sec: 0, end_time_sec: 2 });
    const second = buildChord({ id: 'c2', start_time_sec: 2, end_time_sec: 4 });
    const phrase = buildPhrase([first, second]);

    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 1.2, 120, new Set())).toBe(2);
    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 1.2, 120, new Set(['c1']))).toBe(1.75);
  });

  it('明示区間の終端を次の境界として返す', () => {
    const phrase = buildPhrase([
      buildChord({ id: 'c1', start_time_sec: 1, end_time_sec: 2 }),
      buildChord({ id: 'c2', start_time_sec: 3, end_time_sec: 4 }),
    ]);

    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 1.2, 120, new Set())).toBe(2);
    expect(getEarTrainingNextChordDisplayBoundarySec(phrase, 2.2, 120, new Set())).toBe(3);
  });
});
