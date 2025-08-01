import { describe, it, expect, vi } from 'vitest';
import RhythmGameEngine from '../rhythmGameEngine';
import type { RhythmStage } from '@/types';

const dummyStage: RhythmStage = {
  id: 's1',
  stage_number: '1-1',
  name: 'test',
  description: '',
  max_hp: 5,
  enemy_gauge_seconds: 4,
  enemy_count: 1,
  enemy_hp: 1,
  min_damage: 1,
  max_damage: 1,
  mode: 'rhythm',
  rhythm_type: 'random',
  allowed_chords: ['C'],
  chord_progression_data: undefined,
  show_sheet_music: false,
  show_guide: false,
  monster_icon: 'monster_01',
  bpm: 120,
  simultaneous_monster_count: 1,
  measure_count: 1,
  time_signature: 4,
  count_in_measures: 0
};

describe('RhythmGameEngine', () => {
  it('fires success inside 200ms window', () => {
    const success = vi.fn();
    const fail = vi.fn();
    const eng = new RhythmGameEngine(dummyStage, {
      onAttackSuccess: success,
      onAttackFail: fail,
    });
    eng.start(0);
    // question 1 center = 0ms (beat1), window -200~+200
    eng.handleInput(60, 100); // C4
    expect(success).toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
  });

  it('fires fail outside window', () => {
    const success = vi.fn();
    const fail = vi.fn();
    const eng = new RhythmGameEngine(dummyStage, {
      onAttackSuccess: success,
      onAttackFail: fail,
    });
    eng.start(0);
    // wait until after +200ms
    eng.handleInput(60, 500);
    expect(success).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalled();
  });

  it('handles chord progression pattern', () => {
    const progressionStage: RhythmStage = {
      ...dummyStage,
      rhythm_type: 'progression',
      chord_progression_data: {
        chords: [
          { chord: 'C', measure: 1, beat: 1 },
          { chord: 'G', measure: 1, beat: 3 },
        ]
      }
    };

    const success = vi.fn();
    const eng = new RhythmGameEngine(progressionStage, {
      onAttackSuccess: success,
      onAttackFail: vi.fn(),
    });
    eng.start(0);
    
    // Beat 1 window: -200 to +200
    eng.handleInput(60, 50); // C
    expect(success).toHaveBeenCalledTimes(1);
    
    // Beat 3 window: 800 to 1200 (at 120bpm, beat = 500ms)
    eng.handleInput(67, 1000); // G
    expect(success).toHaveBeenCalledTimes(2);
  });

  it('resets questions after loop', () => {
    const success = vi.fn();
    const fail = vi.fn();
    const eng = new RhythmGameEngine(dummyStage, {
      onAttackSuccess: success,
      onAttackFail: fail,
    });
    eng.start(0);

    // First time through
    eng.handleInput(60, 100);
    expect(success).toHaveBeenCalledTimes(1);

    // Wait for loop (4 beats * 500ms = 2000ms)
    eng.handleInput(60, 2100);
    expect(success).toHaveBeenCalledTimes(2);
  });
});