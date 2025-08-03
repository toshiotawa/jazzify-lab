import { describe, it, expect } from 'vitest';
import {
  RHYTHM_TIMING,
  getQuestionAppearanceBeat,
  getJudgmentCutoffBeat,
  isWithinJudgmentWindow,
  getTimeUntilNextQuestion,
  getRhythmTimingState
} from '../rhythm-timing';

describe('rhythm-timing utilities', () => {
  describe('getQuestionAppearanceBeat', () => {
    it('should return correct beat for 4/4 time signature', () => {
      expect(getQuestionAppearanceBeat(4)).toBe(4.5);
    });

    it('should return correct beat for 3/4 time signature', () => {
      expect(getQuestionAppearanceBeat(3)).toBe(3.5);
    });
  });

  describe('getJudgmentCutoffBeat', () => {
    it('should return correct cutoff beat for 4/4 time signature', () => {
      expect(getJudgmentCutoffBeat(4)).toBe(4.49);
    });

    it('should return correct cutoff beat for 3/4 time signature', () => {
      expect(getJudgmentCutoffBeat(3)).toBe(3.49);
    });
  });

  describe('isWithinJudgmentWindow', () => {
    it('should return true when within judgment window (4/4)', () => {
      expect(isWithinJudgmentWindow(1.0, 4)).toBe(true);
      expect(isWithinJudgmentWindow(2.5, 4)).toBe(true);
      expect(isWithinJudgmentWindow(4.0, 4)).toBe(true);
      expect(isWithinJudgmentWindow(4.49, 4)).toBe(true);
    });

    it('should return false when outside judgment window (4/4)', () => {
      expect(isWithinJudgmentWindow(4.5, 4)).toBe(false);
      expect(isWithinJudgmentWindow(4.99, 4)).toBe(false);
    });

    it('should handle beat wrapping correctly', () => {
      // Beat 5.0 should wrap to 1.0
      expect(isWithinJudgmentWindow(5.0, 4)).toBe(true);
      // Beat 8.49 should wrap to 4.49
      expect(isWithinJudgmentWindow(8.49, 4)).toBe(true);
      // Beat 8.5 should wrap to 4.5 (outside window)
      expect(isWithinJudgmentWindow(8.5, 4)).toBe(false);
    });
  });

  describe('getTimeUntilNextQuestion', () => {
    const bpm120 = 120; // 500ms per beat
    const bpm60 = 60;   // 1000ms per beat

    it('should calculate time within same measure (BPM 120)', () => {
      // At beat 1.0, next question at 4.5 = 3.5 beats away
      expect(getTimeUntilNextQuestion(1.0, 4, bpm120)).toBe(3.5 * 500);
      
      // At beat 3.0, next question at 4.5 = 1.5 beats away
      expect(getTimeUntilNextQuestion(3.0, 4, bpm120)).toBe(1.5 * 500);
    });

    it('should calculate time to next measure (BPM 120)', () => {
      // At beat 4.6, already past 4.5, so next measure's 4.5
      // = (4 - 4.6) + 4.5 = 3.9 beats away
      expect(getTimeUntilNextQuestion(4.6, 4, bpm120)).toBeCloseTo(3.9 * 500);
    });

    it('should work with different BPM (BPM 60)', () => {
      // At beat 2.0, next question at 4.5 = 2.5 beats away
      expect(getTimeUntilNextQuestion(2.0, 4, bpm60)).toBe(2.5 * 1000);
    });

    it('should work with 3/4 time signature', () => {
      // At beat 1.0, next question at 3.5 = 2.5 beats away
      expect(getTimeUntilNextQuestion(1.0, 3, bpm120)).toBe(2.5 * 500);
      
      // At beat 3.6, next measure's 3.5 = (3 - 3.6) + 3.5 = 2.9 beats
      expect(getTimeUntilNextQuestion(3.6, 3, bpm120)).toBeCloseTo(2.9 * 500);
    });
  });

  describe('getRhythmTimingState', () => {
    const bpm120 = 120;

    it('should return judgment phase when in normal play', () => {
      const state = getRhythmTimingState(2.0, 4, bpm120, false);
      expect(state.currentPhase).toBe('judgment');
      expect(state.isQuestionActive).toBe(true);
      expect(state.isJudgmentActive).toBe(true);
      expect(state.isInNullPeriod).toBe(false);
    });

    it('should return null phase when chord is completed', () => {
      const state = getRhythmTimingState(3.0, 4, bpm120, true);
      expect(state.currentPhase).toBe('null');
      expect(state.isQuestionActive).toBe(false);
      expect(state.isJudgmentActive).toBe(false);
      expect(state.isInNullPeriod).toBe(true);
    });

    it('should return transition phase after judgment cutoff', () => {
      const state = getRhythmTimingState(4.495, 4, bpm120, false);
      expect(state.currentPhase).toBe('transition');
      expect(state.isQuestionActive).toBe(true);
      expect(state.isJudgmentActive).toBe(false);
    });

    it('should return transition phase after question appearance', () => {
      const state = getRhythmTimingState(4.55, 4, bpm120, false);
      expect(state.currentPhase).toBe('transition');
      expect(state.isQuestionActive).toBe(false);
      expect(state.isJudgmentActive).toBe(false);
    });

    it('should calculate correct time until next question', () => {
      const state = getRhythmTimingState(1.0, 4, bpm120, false);
      // From beat 1.0 to 4.5 = 3.5 beats = 1750ms at 120 BPM
      expect(state.timeUntilNextQuestion).toBe(1750);
    });
  });
});