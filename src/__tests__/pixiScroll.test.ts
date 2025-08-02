import { useRhythmStore } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';

test('spawnMs is 2 measures before target', () => {
  // Initialize timeStore
  useTimeStore.getState().setStart(120, 4, 4, 0);
  const stage: any = {
    mode: 'rhythm',
    allowed_chords: ['C'],
    measure_count: 4,
    bpm: 120,
    time_signature: 4,
    count_in_measures: 0
  };
  useRhythmStore.getState().generate(stage);
  const q = useRhythmStore.getState().questions[0];
  const diff = q.targetMs - q.spawnMs;
  expect(Math.round(diff / 1000)).toBe(4); // 2 小節 at 120 BPM = 4 seconds
});