import { describe, it, expect } from 'vitest';
import { evaluateNote, findClosestNote, shouldAutoFail, detectAutoFailNotes } from '../rhythmJudge';
import { Note } from '@/constants/rhythm';

describe('rhythmJudge', () => {
  describe('evaluateNote', () => {
    const baseNote: Note = {
      id: 'test-1',
      chord: 'C',
      atMeasure: 1,
      atBeat: 1,
      spawnTimeMs: 0,
      hitTimeMs: 1000,
    };

    it('should return success when chord matches and timing is within window', () => {
      const result = evaluateNote(baseNote, 'C', 1100);
      expect(result.result).toBe('success');
      expect(result.timingDiff).toBe(100);
      expect(result.noteId).toBe('test-1');
    });

    it('should return miss when chord does not match even with good timing', () => {
      const result = evaluateNote(baseNote, 'D', 1050);
      expect(result.result).toBe('miss');
    });

    it('should return too_early when input is before the window', () => {
      const result = evaluateNote(baseNote, 'C', 700);
      expect(result.result).toBe('too_early');
      expect(result.timingDiff).toBe(-300);
    });

    it('should return too_late when input is after the window', () => {
      const result = evaluateNote(baseNote, 'C', 1300);
      expect(result.result).toBe('too_late');
      expect(result.timingDiff).toBe(300);
    });

    it('should handle edge cases at exactly ±200ms', () => {
      // Exactly at -200ms boundary
      const earlyResult = evaluateNote(baseNote, 'C', 800);
      expect(earlyResult.result).toBe('success');

      // Exactly at +200ms boundary
      const lateResult = evaluateNote(baseNote, 'C', 1200);
      expect(lateResult.result).toBe('success');
    });
  });

  describe('findClosestNote', () => {
    const notes: Note[] = [
      {
        id: 'note-1',
        chord: 'C',
        atMeasure: 1,
        atBeat: 1,
        spawnTimeMs: 0,
        hitTimeMs: 1000,
      },
      {
        id: 'note-2',
        chord: 'D',
        atMeasure: 1,
        atBeat: 2,
        spawnTimeMs: 500,
        hitTimeMs: 1500,
      },
      {
        id: 'note-3',
        chord: 'E',
        atMeasure: 1,
        atBeat: 3,
        spawnTimeMs: 1000,
        hitTimeMs: 2000,
      },
    ];

    it('should find the closest note', () => {
      const activeIds = new Set(['note-1', 'note-2', 'note-3']);
      const closest = findClosestNote(notes, 1400, activeIds);
      expect(closest?.id).toBe('note-2');
    });

    it('should return null when no notes are active', () => {
      const activeIds = new Set<string>();
      const closest = findClosestNote(notes, 1500, activeIds);
      expect(closest).toBeNull();
    });

    it('should only consider active notes', () => {
      const activeIds = new Set(['note-1', 'note-3']);
      const closest = findClosestNote(notes, 1400, activeIds);
      expect(closest?.id).toBe('note-1'); // note-2 is not active
    });
  });

  describe('shouldAutoFail', () => {
    const note: Note = {
      id: 'test-1',
      chord: 'C',
      atMeasure: 1,
      atBeat: 1,
      spawnTimeMs: 0,
      hitTimeMs: 1000,
    };

    it('should return true when current time is past the window', () => {
      expect(shouldAutoFail(note, 1201)).toBe(true);
      expect(shouldAutoFail(note, 1500)).toBe(true);
    });

    it('should return false when within or before the window', () => {
      expect(shouldAutoFail(note, 800)).toBe(false);
      expect(shouldAutoFail(note, 1000)).toBe(false);
      expect(shouldAutoFail(note, 1200)).toBe(false);
    });
  });

  describe('detectAutoFailNotes', () => {
    const notes: Note[] = [
      {
        id: 'note-1',
        chord: 'C',
        atMeasure: 1,
        atBeat: 1,
        spawnTimeMs: 0,
        hitTimeMs: 1000,
      },
      {
        id: 'note-2',
        chord: 'D',
        atMeasure: 1,
        atBeat: 2,
        spawnTimeMs: 500,
        hitTimeMs: 1500,
      },
    ];

    it('should detect notes that should auto-fail', () => {
      const activeIds = new Set(['note-1', 'note-2']);
      const failedIds = detectAutoFailNotes(notes, 1300, activeIds);
      expect(failedIds).toEqual(['note-1']);
    });

    it('should return empty array when no notes should fail', () => {
      const activeIds = new Set(['note-1', 'note-2']);
      const failedIds = detectAutoFailNotes(notes, 900, activeIds);
      expect(failedIds).toEqual([]);
    });

    it('should only check active notes', () => {
      const activeIds = new Set(['note-2']);
      const failedIds = detectAutoFailNotes(notes, 1300, activeIds);
      expect(failedIds).toEqual([]); // note-1 is not active
    });
  });
});