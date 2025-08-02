import { useRhythmStore } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';

const dummyStage = {
  id: 's',
  stage_number: '0-0',
  name: 't',
  description: '',
  max_hp: 1,
  enemy_gauge_seconds: 4,
  enemy_count: 1,
  enemy_hp: 1,
  min_damage: 1,
  max_damage: 1,
  mode: 'rhythm',
  allowed_chords: ['C'],
  show_sheet_music: false,
  show_guide: true,
  measure_count: 4,
  bpm: 120,
  count_in_measures: 0,
  time_signature: 4
} as any;

describe('rhythmStore', () => {
  beforeEach(() => {
    // Initialize timeStore with test values
    useTimeStore.getState().setStart(120, 4, 4, 0);
  });

  it('generates 4 random questions', () => {
    const { generate } = useRhythmStore.getState();
    generate(dummyStage);
    expect(useRhythmStore.getState().questions).toHaveLength(4);
  });
});