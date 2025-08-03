import { describe, it, expect } from 'vitest';
import {
  getCurrentBeatPosition,
  getAbsoluteBeatPosition,
  parseProgressionData,
  parseProgressionText,
  ChordTiming
} from '@/utils/progression-timing';

describe('Progression Timing Utilities', () => {
  describe('getCurrentBeatPosition', () => {
    it('should return 1.0 during ready phase', () => {
      const startAt = performance.now();
      const result = getCurrentBeatPosition(startAt, 120, 4, 2000, 0);
      expect(result).toBe(1.0);
    });

    it('should calculate correct beat position after ready phase', () => {
      const startAt = performance.now() - 3000; // 3 seconds ago
      const bpm = 120; // 2 beats per second
      const result = getCurrentBeatPosition(startAt, bpm, 4, 2000, 0);
      // After 3 seconds, with 2 seconds ready, we have 1 second = 2 beats
      // So we should be at beat 3.0
      expect(result).toBeCloseTo(3.0, 1);
    });

    it('should handle count-in measures correctly', () => {
      const startAt = performance.now() - 5000; // 5 seconds ago
      const bpm = 60; // 1 beat per second
      const result = getCurrentBeatPosition(startAt, bpm, 4, 2000, 1); // 1 count-in measure
      // After 5 seconds, with 2 seconds ready, we have 3 seconds = 3 beats
      // With 1 count-in measure (4 beats), we skip the first 4 beats
      // So we're at -1 beats, which should be 0
      expect(result).toBeCloseTo(1.0, 1);
    });
  });

  describe('parseProgressionData', () => {
    it('should parse chord timing correctly', () => {
      const progressionData: ChordTiming[] = [
        { bar: 1, beats: 1, chord: 'C' },
        { bar: 2, beats: 1, chord: 'F' },
        { bar: 3, beats: 1, chord: 'G' }
      ];

      // At measure 2, beat 2
      const result = parseProgressionData(progressionData, 2, 2, 4);
      expect(result.currentChord).toBe('F');
      expect(result.isAcceptingInput).toBe(true);
    });

    it('should handle NULL periods', () => {
      const progressionData: ChordTiming[] = [
        { bar: 1, beats: 3, chord: 'C' },
        { bar: 2, beats: 1, chord: null }, // NULL period
        { bar: 2, beats: 3, chord: 'F' }
      ];

      // At measure 2, beat 2 (during NULL period)
      const result = parseProgressionData(progressionData, 2, 2, 4);
      expect(result.currentChord).toBe(null);
      expect(result.isAcceptingInput).toBe(true);
    });

    it('should calculate judgment deadline correctly', () => {
      const progressionData: ChordTiming[] = [
        { bar: 1, beats: 1, chord: 'C' },
        { bar: 2, beats: 1, chord: 'F' }
      ];

      // At measure 1, beat 4.6 (past judgment deadline for next chord)
      const result = parseProgressionData(progressionData, 1, 4.6, 4);
      expect(result.currentChord).toBe('C');
      expect(result.isAcceptingInput).toBe(false); // Past deadline
    });
  });

  describe('parseProgressionText', () => {
    it('should parse text format correctly', () => {
      const text = `bar 1 beats 3 chord C
bar 2 beats 1 chord F
bar 2 beats 3 chord NULL`;

      const result = parseProgressionText(text);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ bar: 1, beats: 3, chord: 'C' });
      expect(result[1]).toEqual({ bar: 2, beats: 1, chord: 'F' });
      expect(result[2]).toEqual({ bar: 2, beats: 3, chord: null });
    });

    it('should handle decimal beat values', () => {
      const text = 'bar 1 beats 2.5 chord Am';
      const result = parseProgressionText(text);
      expect(result[0].beats).toBe(2.5);
    });
  });
});