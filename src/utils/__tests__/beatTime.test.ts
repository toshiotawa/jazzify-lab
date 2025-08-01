import { describe, it, expect } from 'vitest';
import { beatToMs, measureBeatToMs } from '../beatTime';

describe('beatTime utilities', () => {
  describe('beatToMs', () => {
    it('converts beats to milliseconds at 120 BPM', () => {
      // At 120 BPM, 1 beat = 500ms
      expect(beatToMs(1, 120)).toBe(500);
      expect(beatToMs(2, 120)).toBe(1000);
      expect(beatToMs(4, 120)).toBe(2000);
    });

    it('converts beats to milliseconds at 60 BPM', () => {
      // At 60 BPM, 1 beat = 1000ms
      expect(beatToMs(1, 60)).toBe(1000);
      expect(beatToMs(2, 60)).toBe(2000);
    });

    it('converts beats to milliseconds at 180 BPM', () => {
      // At 180 BPM, 1 beat = 333.33...ms
      expect(beatToMs(1, 180)).toBeCloseTo(333.33, 2);
      expect(beatToMs(3, 180)).toBeCloseTo(1000, 2);
    });

    it('handles fractional beats', () => {
      expect(beatToMs(1.5, 120)).toBe(750);
      expect(beatToMs(3.75, 120)).toBe(1875);
    });
  });

  describe('measureBeatToMs', () => {
    it('converts measure 1 beat 1 to 0ms (no count-in)', () => {
      expect(measureBeatToMs(1, 1, 120, 4, 0)).toBe(0);
    });

    it('converts measure and beat to ms in 4/4 time', () => {
      // Measure 2, beat 1 = 4 beats elapsed
      expect(measureBeatToMs(2, 1, 120, 4, 0)).toBe(2000);
      // Measure 2, beat 3 = 6 beats elapsed
      expect(measureBeatToMs(2, 3, 120, 4, 0)).toBe(3000);
    });

    it('converts measure and beat to ms in 3/4 time', () => {
      // Measure 2, beat 1 = 3 beats elapsed
      expect(measureBeatToMs(2, 1, 120, 3, 0)).toBe(1500);
      // Measure 3, beat 2 = 7 beats elapsed
      expect(measureBeatToMs(3, 2, 120, 3, 0)).toBe(3500);
    });

    it('handles count-in measures', () => {
      // With 1 count-in measure in 4/4, measure 1 beat 1 = 4 beats elapsed
      expect(measureBeatToMs(1, 1, 120, 4, 1)).toBe(2000);
      // With 2 count-in measures in 4/4, measure 1 beat 1 = 8 beats elapsed
      expect(measureBeatToMs(1, 1, 120, 4, 2)).toBe(4000);
    });

    it('handles fractional beat positions', () => {
      // Measure 1, beat 1.5 (8th note after beat 1)
      expect(measureBeatToMs(1, 1.5, 120, 4, 0)).toBe(250);
      // Measure 1, beat 3.75 (16th note before beat 4)
      expect(measureBeatToMs(1, 3.75, 120, 4, 0)).toBe(1375);
    });
  });
});