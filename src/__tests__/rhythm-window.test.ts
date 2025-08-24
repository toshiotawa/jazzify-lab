import { RhythmGameEngine } from '@/engines/RhythmGameEngine';

describe('判定ウィンドウ ±200ms', () => {
  it('in-window と out-window を正しく判定', () => {
    const w = RhythmGameEngine.buildWindow(1.0); // 0.8 – 1.2
    expect(w.start).toBeCloseTo(0.8);
    expect(w.end).toBeCloseTo(1.2);
  });
});