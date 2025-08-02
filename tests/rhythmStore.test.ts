import { useRhythmStore } from '@/stores/rhythmStore';
import { FantasyStage } from '@/types';

const mockStageRandom: FantasyStage = {
  id: '1',
  stage_number: '1-1',
  name: 'Test Stage',
  description: 'Test',
  max_hp: 5,
  enemy_gauge_seconds: 10,
  enemy_count: 10,
  enemy_hp: 3,
  min_damage: 1,
  max_damage: 1,
  mode: 'rhythm',
  allowed_chords: ['C', 'G', 'Am', 'F'],
  show_sheet_music: false,
  show_guide: true,
  bpm: 120,
  time_signature: 4,
  measure_count: 8,
  count_in_measures: 1,
  chord_progression_data: null,
};

const mockStageProgression: FantasyStage = {
  ...mockStageRandom,
  chord_progression_data: {
    chords: [
      { measure: 1, beat: 1, chord: 'C' },
      { measure: 2, beat: 1, chord: 'G' },
    ],
  },
};

describe('rhythmStore', () => {
  beforeEach(() => {
    useRhythmStore.getState().reset();
  });

  test('ランダムパターン生成', () => {
    useRhythmStore.getState().generate(mockStageRandom);
    const { questions, pattern } = useRhythmStore.getState();
    expect(pattern).toBe('random');
    expect(questions.length).toBe(8);
    questions.forEach(q => {
      expect(q.beat).toBe(1);
      expect(mockStageRandom.allowed_chords).toContain(q.chord);
    });
  });

  test('進行パターン生成', () => {
    useRhythmStore.getState().generate(mockStageProgression);
    const { questions, pattern } = useRhythmStore.getState();
    expect(pattern).toBe('progression');
    expect(questions.length).toBe(2);
    expect(questions[0].chord).toBe('C');
    expect(questions[1].chord).toBe('G');
  });

  test('targetMs 単調増加', () => {
    useRhythmStore.getState().generate(mockStageRandom);
    const qs = useRhythmStore.getState().questions;
    for (let i = 1; i < qs.length; i++) {
      expect(qs[i].targetMs).toBeGreaterThan(qs[i-1].targetMs);
    }
  });

  test('judgeSuccess でポインタが進む', () => {
    useRhythmStore.getState().generate(mockStageRandom);
    expect(useRhythmStore.getState().pointer).toBe(0);
    
    useRhythmStore.getState().judgeSuccess();
    expect(useRhythmStore.getState().pointer).toBe(1);
  });
});