import { describe, it, expect } from 'vitest';
import { beatToMs, measureBeatToMs } from '../beatTime';

describe('beatTime utils', () => {
  describe('beatToMs', () => {
    it('converts beats to milliseconds at 120 BPM', () => {
      expect(beatToMs(1, 120)).toBe(500);
      expect(beatToMs(2, 120)).toBe(1000);
      expect(beatToMs(4, 120)).toBe(2000);
    });

    it('converts beats to milliseconds at 60 BPM', () => {
      expect(beatToMs(1, 60)).toBe(1000);
      expect(beatToMs(2, 60)).toBe(2000);
      expect(beatToMs(4, 60)).toBe(4000);
    });

    it('handles fractional beats', () => {
      expect(beatToMs(1.5, 120)).toBe(750);
      expect(beatToMs(3.75, 120)).toBe(1875);
    });
  });

  describe('measureBeatToMs', () => {
    it('converts measure and beat to milliseconds', () => {
      // 120 BPM, 4/4 time
      expect(measureBeatToMs(1, 1, 120, 4, 0)).toBe(0);
      expect(measureBeatToMs(1, 2, 120, 4, 0)).toBe(500);
      expect(measureBeatToMs(1, 3, 120, 4, 0)).toBe(1000);
      expect(measureBeatToMs(1, 4, 120, 4, 0)).toBe(1500);
      expect(measureBeatToMs(2, 1, 120, 4, 0)).toBe(2000);
    });

    it('handles count-in measures', () => {
      // With 1 count-in measure
      expect(measureBeatToMs(1, 1, 120, 4, 1)).toBe(2000); // After 1 measure
      expect(measureBeatToMs(2, 1, 120, 4, 1)).toBe(4000); // After 2 measures
    });

    it('handles different time signatures', () => {
      // 3/4 time
      expect(measureBeatToMs(1, 1, 120, 3, 0)).toBe(0);
      expect(measureBeatToMs(1, 3, 120, 3, 0)).toBe(1000);
      expect(measureBeatToMs(2, 1, 120, 3, 0)).toBe(1500);
    });
  });
});