import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  buildChordOsmdRhythmTargets,
  chordOsmdRankForAccuracy,
  chordOsmdTargetIsComplete,
  consumeChordOsmdMidi,
  createChordOsmdRemainingCounts,
} from '@/utils/earTrainingChordOsmd';

const chord = (overrides: Partial<EarTrainingPhraseChord> & { id: string; order_index: number }): EarTrainingPhraseChord => ({
  id: overrides.id,
  phrase_id: 'phrase-1',
  order_index: overrides.order_index,
  chord_name: overrides.chord_name ?? 'C',
  measure_number: overrides.measure_number ?? 1,
  beat_offset: overrides.beat_offset ?? 1,
  duration_beats: overrides.duration_beats ?? 1,
  start_time_sec: overrides.start_time_sec ?? null,
  end_time_sec: overrides.end_time_sec ?? null,
  voicing: overrides.voicing ?? ['C4'],
  voicing_staves: overrides.voicing_staves ?? [1],
});

const phrase = (chords: EarTrainingPhraseChord[]): EarTrainingPhrase => ({
  id: 'phrase-1',
  stage_id: 'stage-1',
  order_index: 0,
  audio_url: '/phrase.mp3',
  loop_duration_sec: 8,
  audio_duration_sec: 8,
  note_count: chords.length,
  chords,
});

describe('buildChordOsmdRhythmTargets', () => {
  it('start_time_sec=0 の1拍目を 0 秒ターゲットとして保持する', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 't0', order_index: 0, chord_name: 'Dm7', start_time_sec: 0, voicing: ['D3'] }),
      ]),
      120,
      4,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].targetTimeSec).toBe(0);
    expect(targets[0].measureNumber).toBe(1);
    expect(targets[0].midiCounts).toEqual([{ midi: 50, count: 1 }]);
  });

  it('同じタイミングの複数行を1ターゲットにまとめ、MIDI重複数も保持する', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'a', order_index: 0, chord_name: 'C', start_time_sec: 1, voicing: ['C4', 'E4'] }),
        chord({ id: 'b', order_index: 1, chord_name: 'G', start_time_sec: 1, voicing: ['C4', 'G4'] }),
      ]),
      120,
      4,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].label).toBe('C / G');
    expect(targets[0].midiCounts).toEqual([
      { midi: 60, count: 2 },
      { midi: 64, count: 1 },
      { midi: 67, count: 1 },
    ]);
  });

  it('beat_offset のフォールバックは MusicXML 風の1始まりで計算する', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'b1', order_index: 0, measure_number: 2, beat_offset: 1, start_time_sec: null }),
        chord({ id: 'b4', order_index: 1, measure_number: 2, beat_offset: 4, start_time_sec: null }),
      ]),
      120,
      4,
    );

    expect(targets.map(target => target.targetTimeSec)).toEqual([2, 3.5]);
  });
});

describe('Chord OSMD target consumption', () => {
  it('完全一致のMIDIだけを消費し、必要数が0になると完了扱いにする', () => {
    const [target] = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'a', order_index: 0, voicing: ['C4', 'C4'] }),
      ]),
      120,
      4,
    );
    const first = createChordOsmdRemainingCounts(target);
    const second = consumeChordOsmdMidi(first, 60);
    const third = second ? consumeChordOsmdMidi(second, 60) : null;

    expect(consumeChordOsmdMidi(first, 72)).toBeNull();
    expect(second ? chordOsmdTargetIsComplete(second) : true).toBe(false);
    expect(third ? chordOsmdTargetIsComplete(third) : false).toBe(true);
  });
});

describe('chordOsmdRankForAccuracy', () => {
  it('OSMDの正答率を耳コピランクに変換する', () => {
    expect(chordOsmdRankForAccuracy(1)).toBe('Perfect');
    expect(chordOsmdRankForAccuracy(0.85)).toBe('Great');
    expect(chordOsmdRankForAccuracy(0.4)).toBe('Good');
    expect(chordOsmdRankForAccuracy(0.39)).toBe('Fail');
  });
});
