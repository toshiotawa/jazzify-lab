import { describe, expect, it } from 'vitest';

import {
  isDefenseAudioRegistrationMode,
  parseDefenseAudioRegistrationMode,
  validateDefenseSeparateTracksStage,
  validateDefenseSharedProgressionStage,
} from '@/game/defense/defenseAudioRegistrationMode';
import type { DefenseStage } from '@/game/defense/defenseTypes';

const baseStage = (overrides: Partial<DefenseStage> = {}): DefenseStage => ({
  id: 'stage-1',
  slug: 'stage-1',
  stageNumber: 1,
  title: 'Stage',
  titleEn: 'Stage',
  bpm: 120,
  beatsPerBar: 4,
  audioRegistrationMode: 'per_phrase',
  audioUrl: null,
  melodyAudioUrl: null,
  progressionBars: null,
  phraseBars: 2,
  staffLayout: 'treble',
  attackTrigger: 'note',
  keyFifths: 0,
  requiredCompletionCount: 1,
  difficultyLevel: 1,
  surviveSeconds: 120,
  playerHp: 5,
  productionStaffHintMode: 'fade_15s',
  productionKeyboardHintMode: 'fade_15s',
  playStyle: 'phrase',
  voicingKeyMode: null,
  voicingLowestKey: null,
  voicingStartKey: null,
  voicingMinLowestNote: null,
  playRootOnChordChange: false,
  phrases: [],
  progressionChords: [],
  ...overrides,
});

describe('defenseAudioRegistrationMode', () => {
  it('parses known modes and rejects unknown values', () => {
    expect(parseDefenseAudioRegistrationMode('per_phrase')).toBe('per_phrase');
    expect(parseDefenseAudioRegistrationMode('single_source')).toBe('single_source');
    expect(parseDefenseAudioRegistrationMode('shared_progression')).toBe('shared_progression');
    expect(parseDefenseAudioRegistrationMode('shared_progression_separate_tracks'))
      .toBe('shared_progression_separate_tracks');
    expect(parseDefenseAudioRegistrationMode('legacy')).toBeNull();
    expect(isDefenseAudioRegistrationMode('shared_progression')).toBe(true);
  });

  it('validates shared progression stage configuration', () => {
    expect(validateDefenseSharedProgressionStage(baseStage({
      audioRegistrationMode: 'shared_progression',
      progressionBars: 12,
      phraseBars: 4,
    }))).toBeNull();

    expect(validateDefenseSharedProgressionStage(baseStage({
      audioRegistrationMode: 'shared_progression',
      progressionBars: null,
      phraseBars: 4,
    }))).not.toBeNull();

    expect(validateDefenseSharedProgressionStage(baseStage({
      audioRegistrationMode: 'shared_progression',
      progressionBars: 10,
      phraseBars: 4,
    }))).not.toBeNull();
  });

  it('validates separate tracks URLs and contiguous loop windows', () => {
    const phrases = [
      {
        id: 'p1',
        orderIndex: 0,
        title: 'A',
        audioUrl: '',
        loopStartMeasure: 1,
        loopEndMeasure: 2,
        keyFifths: 0,
        requiredCompletionCount: 1,
        chords: [],
      },
      {
        id: 'p2',
        orderIndex: 1,
        title: 'B',
        audioUrl: '',
        loopStartMeasure: 3,
        loopEndMeasure: 4,
        keyFifths: 0,
        requiredCompletionCount: 1,
        chords: [],
      },
    ];

    expect(validateDefenseSeparateTracksStage(baseStage({
      audioRegistrationMode: 'shared_progression_separate_tracks',
      audioUrl: 'https://cdn.example/bgm.wav',
      melodyAudioUrl: 'https://cdn.example/melody.wav',
      progressionBars: 12,
      phraseBars: 2,
      phrases,
    }))).toBeNull();

    expect(validateDefenseSeparateTracksStage(baseStage({
      audioRegistrationMode: 'shared_progression_separate_tracks',
      audioUrl: 'https://cdn.example/bgm.wav',
      melodyAudioUrl: null,
      progressionBars: 12,
      phraseBars: 2,
      phrases,
    }))).not.toBeNull();
  });
});
