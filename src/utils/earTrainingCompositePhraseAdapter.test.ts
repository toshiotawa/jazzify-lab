import type { EarTrainingCompositePhraseBootstrap, EarTrainingPhrase, EarTrainingStage } from '@/types';
import {
  buildEarTrainingCompositeBootstrap,
  earTrainingPhraseToCompositeDefinition,
} from '@/utils/earTrainingCompositePhraseAdapter';

describe('earTrainingPhraseToCompositeDefinition', () => {
  const basePhrase = (partial: Partial<EarTrainingPhrase> & Pick<EarTrainingPhrase, 'id'>): EarTrainingPhrase => ({
    id: partial.id,
    stage_id: 's1',
    order_index: 0,
    title: '',
    audio_url: '',
    loop_duration_sec: 1,
    audio_duration_sec: 1,
    note_count: 0,
    chords: [],
    ...partial,
  });

  it('maps phrase notes in order as sequential pitches before chord voicings', () => {
    const phrase = basePhrase({
      id: 'p1',
      notes: [
        {
          id: 'n1',
          phrase_id: 'p1',
          note_index: 0,
          pitch_midi: 64,
          pitch_class: 4,
          note_name: 'E4',
          measure_number: 1,
        },
        {
          id: 'n2',
          phrase_id: 'p1',
          note_index: 1,
          pitch_midi: 62,
          pitch_class: 2,
          note_name: 'D4',
          measure_number: 1,
        },
      ],
      chords: [{
        id: 'c1',
        phrase_id: 'p1',
        order_index: 0,
        chord_name: 'Am7',
        measure_number: 1,
        voicing: ['C4', 'G4'],
        voicing_staves: [1, 1],
        created_at: '',
      }],
    });
    const def = earTrainingPhraseToCompositeDefinition(phrase);
    expect(def?.sourcePhraseId).toBe('p1');
    expect(def?.chords[0]?.chordName).toBe('Am7');
    expect(def?.chords[0]?.notes.map((n) => n.pitchClass)).toEqual([4, 2]);
  });

  it('falls back to voicing in order when phrase notes are missing', () => {
    const phrase = basePhrase({
      id: 'p1',
      chords: [{
        id: 'c1',
        phrase_id: 'p1',
        order_index: 0,
        chord_name: 'Am7',
        measure_number: 1,
        voicing: ['C4', 'E4'],
        voicing_staves: [1, 1],
        created_at: '',
      }],
    });
    const def = earTrainingPhraseToCompositeDefinition(phrase);
    expect(def?.chords[0]?.notes.map((n) => n.pitchClass)).toEqual([0, 4]);
  });

  it('returns null when voicing parses fail', () => {
    const phrase = basePhrase({
      id: 'p1',
      chords: [{
        id: 'c1',
        phrase_id: 'p1',
        order_index: 0,
        chord_name: 'X',
        voicing: [''],
        voicing_staves: [1],
        created_at: '',
      }],
    });
    expect(earTrainingPhraseToCompositeDefinition(phrase)).toBeNull();
  });
});

describe('buildEarTrainingCompositeBootstrap', () => {
  it('orders definitions by source_phrase_id list', () => {
    const pa: EarTrainingPhrase = {
      id: 'a',
      stage_id: 'st',
      order_index: 0,
      audio_url: '',
      loop_duration_sec: 1,
      audio_duration_sec: 1,
      note_count: 1,
      notes: [{
        id: 'na',
        phrase_id: 'a',
        note_index: 0,
        pitch_midi: 64,
        pitch_class: 4,
        note_name: 'E4',
        measure_number: 1,
      }],
      chords: [{
        id: 'ca',
        phrase_id: 'a',
        order_index: 0,
        chord_name: 'Dm7',
        voicing: ['D4'],
        voicing_staves: [1],
        created_at: '',
      }],
    };
    const pb: EarTrainingPhrase = {
      id: 'b',
      stage_id: 'st',
      order_index: 1,
      audio_url: '',
      loop_duration_sec: 1,
      audio_duration_sec: 1,
      note_count: 1,
      notes: [{
        id: 'nb',
        phrase_id: 'b',
        note_index: 0,
        pitch_midi: 65,
        pitch_class: 5,
        note_name: 'F4',
        measure_number: 1,
      }],
      chords: [{
        id: 'cb',
        phrase_id: 'b',
        order_index: 0,
        chord_name: 'Gm7',
        voicing: ['G4'],
        voicing_staves: [1],
        created_at: '',
      }],
    };
    const stage: Pick<EarTrainingStage, 'phrases'> & { phrases: EarTrainingPhrase[] } = {
      phrases: [pa, pb],
    };
    const boot = buildEarTrainingCompositeBootstrap(stage as EarTrainingStage, {
      id: 'cfg',
      bgm_url: 'https://example.com/loop.mp3',
      key_fifths: 1,
    }, ['b', 'a']);
    expect(boot).not.toBeNull();
    expect((boot as EarTrainingCompositePhraseBootstrap).definitions.map((d) => d.sourcePhraseId)).toEqual([
      'b',
      'a',
    ]);
  });

  it('returns null when a source id is missing from stage phrases', () => {
    const stage: Pick<EarTrainingStage, 'phrases'> & { phrases: EarTrainingPhrase[] } = {
      phrases: [],
    };
    expect(buildEarTrainingCompositeBootstrap(stage as EarTrainingStage, {
      id: 'cfg',
      bgm_url: 'https://example.com/a.mp3',
      key_fifths: 0,
    }, ['missing'])).toBeNull();
  });
});
