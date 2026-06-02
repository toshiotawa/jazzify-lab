import { computeTutorialMeasureClearDelayMs } from '@/utils/earTrainingTutorialMeasureClear';

describe('computeTutorialMeasureClearDelayMs', () => {
  it('counts count-in beats plus required measures at bpm', () => {
    // 120 bpm → 0.5s/beat, 4/4 → 2s/measure, count-in 4 beats = 2s, 2 measures = 4s → 6000ms
    expect(computeTutorialMeasureClearDelayMs(120, 4, 4, 2)).toBe(6000);
  });

  it('clamps required measures to at least 1', () => {
    expect(computeTutorialMeasureClearDelayMs(60, 4, 0, 0)).toBe(4000);
  });
});
