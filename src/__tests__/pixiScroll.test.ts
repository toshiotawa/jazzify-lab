import { test, expect } from 'vitest';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';

test('spawnMs is 2 measures before target', () => {
  // Setup timeStore with readyDuration
  useTimeStore.setState({ readyDuration: 0 });
  
  const stage: any = {
    mode: 'rhythm',
    allowedChords: ['C'],
    measureCount: 4,
    bpm: 120,
    timeSignature: 4,
    count_in_measures: 0
  };
  useRhythmStore.getState().generate(stage);
  const q = useRhythmStore.getState().questions[0];
  const diff = q.targetMs - q.spawnMs;
  expect(Math.round(diff / 1000)).toBe(4); // 2 小節 (=8拍*0.5s) = 4s
});