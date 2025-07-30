import { describe, it, expect } from 'vitest';
import { ProgressionManager, ChordProgressionData } from '@/utils/ProgressionManager';

describe('ProgressionManager', () => {
  const sampleProgression: ChordProgressionData = {
    chords: [
      { chord: 'C', measure: 1, beat: 1 },
      { chord: 'G', measure: 2, beat: 1 },
      { chord: 'Am', measure: 3, beat: 1 },
      { chord: 'F', measure: 4, beat: 1 },
      { chord: 'C', measure: 5, beat: 1 },
      { chord: 'Am', measure: 6, beat: 1 },
      { chord: 'Dm', measure: 7, beat: 1 },
      { chord: 'G', measure: 8, beat: 1 }
    ]
  };

  describe('getInitialChords', () => {
    it('returns first 4 chords for columns A-D', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      const initialChords = manager.getInitialChords();

      expect(initialChords).toHaveLength(4);
      expect(initialChords[0]).toEqual({
        questionNumber: 1,
        chord: 'C',
        timing: { measure: 1, beat: 1, cycleNumber: 0 },
        column: 'A'
      });
      expect(initialChords[1]).toEqual({
        questionNumber: 2,
        chord: 'G',
        timing: { measure: 2, beat: 1, cycleNumber: 0 },
        column: 'B'
      });
      expect(initialChords[2]).toEqual({
        questionNumber: 3,
        chord: 'Am',
        timing: { measure: 3, beat: 1, cycleNumber: 0 },
        column: 'C'
      });
      expect(initialChords[3]).toEqual({
        questionNumber: 4,
        chord: 'F',
        timing: { measure: 4, beat: 1, cycleNumber: 0 },
        column: 'D'
      });
    });
  });

  describe('getNextChordForColumn', () => {
    it('follows the replenishment table correctly', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      manager.getInitialChords(); // Initialize

      // Defeat monster in column A (question 1)
      const nextA = manager.getNextChordForColumn('A');
      expect(nextA.questionNumber).toBe(5);
      expect(nextA.chord).toBe('C'); // index 4
      expect(nextA.column).toBe('A');

      // Defeat monster in column B (question 2)
      const nextB = manager.getNextChordForColumn('B');
      expect(nextB.questionNumber).toBe(6);
      expect(nextB.chord).toBe('Am'); // index 5
      expect(nextB.column).toBe('B');

      // Defeat monster in column C (question 3)
      const nextC = manager.getNextChordForColumn('C');
      expect(nextC.questionNumber).toBe(7);
      expect(nextC.chord).toBe('Dm'); // index 6
      expect(nextC.column).toBe('C');

      // Defeat monster in column D (question 4)
      const nextD = manager.getNextChordForColumn('D');
      expect(nextD.questionNumber).toBe(8);
      expect(nextD.chord).toBe('G'); // index 7
      expect(nextD.column).toBe('D');
    });

    it('handles wraparound correctly when exceeding chord count', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      manager.getInitialChords();

      // Defeat all initial monsters
      manager.getNextChordForColumn('A'); // 5
      manager.getNextChordForColumn('B'); // 6
      manager.getNextChordForColumn('C'); // 7
      manager.getNextChordForColumn('D'); // 8

      // Next set should wrap around
      const next = manager.getNextChordForColumn('A');
      expect(next.questionNumber).toBe(9);
      expect(next.chord).toBe('C'); // index 0 (wraparound)
      expect(next.timing.cycleNumber).toBe(1); // Second cycle
    });

    it('maintains correct column offsets in subsequent sets', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      manager.getInitialChords();

      // Skip some defeats to test offset calculation
      manager.getNextChordForColumn('A'); // 5
      manager.getNextChordForColumn('C'); // 7

      // Now defeat B - should get question 10 (not 6)
      const nextB = manager.getNextChordForColumn('B');
      expect(nextB.questionNumber).toBe(10);
      expect(nextB.chord).toBe('G'); // index 1 in second cycle
    });
  });

  describe('timing calculations', () => {
    it('calculates absolute measure correctly for wrapped chords', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      manager.getInitialChords();

      // Go through 8 chords to complete first cycle
      for (let i = 0; i < 8; i++) {
        manager.getNextChordForColumn(['A', 'B', 'C', 'D'][i % 4]);
      }

      // Next chord should be in cycle 1
      const wrapped = manager.getNextChordForColumn('A');
      expect(wrapped.timing.cycleNumber).toBe(1);
      expect(wrapped.timing.measure).toBe(9); // 1 + 1 * 8
    });
  });

  describe('state management', () => {
    it('tracks answered count correctly', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      manager.getInitialChords();

      const initialState = manager.getState();
      expect(initialState.answeredCount).toBe(0);

      manager.getNextChordForColumn('A');
      manager.getNextChordForColumn('B');

      const updatedState = manager.getState();
      expect(updatedState.answeredCount).toBe(2);
    });

    it('maintains column assignments correctly', () => {
      const manager = new ProgressionManager(sampleProgression, 8);
      manager.getInitialChords();

      manager.getNextChordForColumn('A');
      manager.getNextChordForColumn('C');

      const state = manager.getState();
      expect(state.columnAssignments.get('A')).toBe(5);
      expect(state.columnAssignments.get('B')).toBe(2); // unchanged
      expect(state.columnAssignments.get('C')).toBe(7);
      expect(state.columnAssignments.get('D')).toBe(4); // unchanged
    });
  });
});