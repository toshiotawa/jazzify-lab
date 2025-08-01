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
  rhythmType: 'random',
  allowed_chords: ['C'],
  chord_progression_data: undefined,
  show_sheet_music: false,
  show_guide: false,
  monster_icon: 'monster_01',
  bpm: 120,
  simultaneous_monster_count: 1,
  measure_count: 8,
  time_signature: 4,
  count_in_measures: 0,
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

  it('generates correct number of questions for random mode', () => {
    const stage: RhythmStage = {
      ...dummyStage,
      measure_count: 4,
      rhythmType: 'random',
    };
    const eng = new RhythmGameEngine(stage, {
      onAttackSuccess: vi.fn(),
      onAttackFail: vi.fn(),
    });
    // Private property access for testing
    const questions = (eng as unknown as { questions: unknown[] }).questions;
    expect(questions).toHaveLength(4); // 1 per measure
  });

  it('generates questions from progression data', () => {
    const stage: RhythmStage = {
      ...dummyStage,
      rhythmType: 'progression',
      chord_progression_data: {
        chords: [
          { chord: 'C', measure: 1, beat: 1 },
          { chord: 'G', measure: 2, beat: 1 },
          { chord: 'Am', measure: 3, beat: 1 },
          { chord: 'F', measure: 4, beat: 1 },
        ],
      },
    };
    const eng = new RhythmGameEngine(stage, {
      onAttackSuccess: vi.fn(),
      onAttackFail: vi.fn(),
    });
    const questions = (eng as unknown as { questions: Array<{ chord: string }> }).questions;
    expect(questions).toHaveLength(4);
    expect(questions[0].chord).toBe('C');
    expect(questions[1].chord).toBe('G');
    expect(questions[2].chord).toBe('Am');
    expect(questions[3].chord).toBe('F');
  });

  it('clears buffer on success', () => {
    const success = vi.fn();
    const eng = new RhythmGameEngine(dummyStage, {
      onAttackSuccess: success,
      onAttackFail: vi.fn(),
    });
    eng.start(0);
    
    // Add some notes
    eng.handleInput(60, 50); // C
    const playedNotes = (eng as unknown as { playedNotes: Set<number> }).playedNotes;
    expect(playedNotes.size).toBe(1);
    
    // Complete the chord (C major triad would need C, E, G)
    // But our test chord is just 'C' so it should succeed with just C
    expect(success).toHaveBeenCalled();
    expect(playedNotes.size).toBe(0); // Buffer cleared
  });
});