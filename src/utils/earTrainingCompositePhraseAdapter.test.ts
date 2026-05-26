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

  it('maps voicing in order as sequential pitches', () => {
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
    expect(def?.sourcePhraseId).toBe('p1');
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
      note_count: 0,
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
      note_count: 0,
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
