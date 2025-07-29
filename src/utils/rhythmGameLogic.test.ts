import { describe, it, expect } from 'vitest';
import {
  calculateMeasureProgress,
  calculateGaugePercent,
  calculateTimeToNextBeat,
  judgeInputTiming,
  calculateDamageMultiplier,
  calculateScoreBonus,
  initializeLanes,
  updateLaneChord,
  selectRandomChord,
  isWithinJudgmentWindow,
  hasMissedTiming,
  GAUGE_MARKER_PERCENT,
  JUDGMENT_WINDOW_MS,
} from './rhythmGameLogic';

describe('rhythmGameLogic', () => {
  describe('calculateMeasureProgress', () => {
    it('should calculate measure progress correctly for 4/4 time', () => {
      const bpm = 120;
      const timeSignature = 4;
      // 120 BPM, 4/4 = 2 seconds per measure
      
      expect(calculateMeasureProgress(0, bpm, timeSignature)).toBe(0);
      expect(calculateMeasureProgress(0.5, bpm, timeSignature)).toBe(0.25); // 1拍目の途中
      expect(calculateMeasureProgress(1, bpm, timeSignature)).toBe(0.5); // 2拍目
      expect(calculateMeasureProgress(2, bpm, timeSignature)).toBe(0); // 次の小節
    });

    it('should calculate measure progress correctly for 3/4 time', () => {
      const bpm = 90;
      const timeSignature = 3;
      // 90 BPM, 3/4 = 2 seconds per measure
      
      expect(calculateMeasureProgress(0, bpm, timeSignature)).toBe(0);
      expect(calculateMeasureProgress(1, bpm, timeSignature)).toBeCloseTo(0.5);
      expect(calculateMeasureProgress(2, bpm, timeSignature)).toBe(0);
    });
  });

  describe('calculateGaugePercent', () => {
    it('should convert measure progress to percentage', () => {
      expect(calculateGaugePercent(0)).toBe(0);
      expect(calculateGaugePercent(0.5)).toBe(50);
      expect(calculateGaugePercent(0.8)).toBe(80);
      expect(calculateGaugePercent(1)).toBe(100);
    });
  });

  describe('judgeInputTiming', () => {
    it('should judge perfect timing', () => {
      expect(judgeInputTiming(0)).toBe('perfect');
      expect(judgeInputTiming(0.04)).toBe('perfect');
      expect(judgeInputTiming(-0.04)).toBe('perfect');
    });

    it('should judge good timing', () => {
      expect(judgeInputTiming(0.08)).toBe('good');
      expect(judgeInputTiming(-0.08)).toBe('good');
    });

    it('should judge early/late timing', () => {
      expect(judgeInputTiming(-0.15)).toBe('early');
      expect(judgeInputTiming(0.15)).toBe('late');
    });

    it('should judge miss timing', () => {
      expect(judgeInputTiming(0.3)).toBe('miss');
      expect(judgeInputTiming(-0.3)).toBe('miss');
    });
  });

  describe('calculateDamageMultiplier', () => {
    it('should return correct multipliers', () => {
      expect(calculateDamageMultiplier('perfect')).toBe(1.5);
      expect(calculateDamageMultiplier('good')).toBe(1.0);
      expect(calculateDamageMultiplier('early')).toBe(0.7);
      expect(calculateDamageMultiplier('late')).toBe(0.7);
      expect(calculateDamageMultiplier('miss')).toBe(0);
    });
  });

  describe('calculateScoreBonus', () => {
    it('should return correct score bonuses', () => {
      expect(calculateScoreBonus('perfect')).toBe(100);
      expect(calculateScoreBonus('good')).toBe(50);
      expect(calculateScoreBonus('early')).toBe(20);
      expect(calculateScoreBonus('late')).toBe(20);
      expect(calculateScoreBonus('miss')).toBe(0);
    });
  });

  describe('initializeLanes', () => {
    it('should initialize lanes for 4 beat pattern', () => {
      const chordProgression = ['C', 'Am', 'F', 'G'];
      const lanes = initializeLanes(4, chordProgression);
      
      expect(lanes).toHaveLength(4);
      expect(lanes[0].currentChord).toBe('C');
      expect(lanes[1].currentChord).toBe('Am');
      expect(lanes[2].currentChord).toBe('F');
      expect(lanes[3].currentChord).toBe('G');
    });

    it('should handle progression shorter than lane count', () => {
      const chordProgression = ['C', 'F'];
      const lanes = initializeLanes(4, chordProgression);
      
      expect(lanes[0].currentChord).toBe('C');
      expect(lanes[1].currentChord).toBe('F');
      expect(lanes[2].currentChord).toBe('C'); // Wraps around
      expect(lanes[3].currentChord).toBe('F');
    });
  });

  describe('updateLaneChord', () => {
    it('should update defeated lane with next chord', () => {
      const chordProgression = ['C', 'Am', 'F', 'G'];
      const lanes = initializeLanes(4, chordProgression);
      const progressionIndex = 3; // Currently at 'G'
      
      const { updatedLanes, newProgressionIndex } = updateLaneChord(
        lanes,
        1, // Defeat lane 1 (Am)
        chordProgression,
        progressionIndex
      );
      
      expect(updatedLanes[1].currentChord).toBe('C'); // Wraps to beginning
      expect(newProgressionIndex).toBe(0); // Index wraps to 0
    });
  });

  describe('selectRandomChord', () => {
    it('should select a chord from allowed list', () => {
      const allowedChords = ['C', 'F', 'G'];
      const selected = selectRandomChord(allowedChords);
      
      expect(allowedChords).toContain(selected);
    });

    it('should avoid previous chord when possible', () => {
      const allowedChords = ['C', 'F', 'G'];
      const previousChord = 'C';
      
      // Run multiple times to verify it avoids 'C'
      for (let i = 0; i < 10; i++) {
        const selected = selectRandomChord(allowedChords, previousChord);
        expect(selected).not.toBe('C');
      }
    });

    it('should return the only chord when no alternatives', () => {
      const allowedChords = ['C'];
      const selected = selectRandomChord(allowedChords, 'C');
      
      expect(selected).toBe('C');
    });
  });

  describe('isWithinJudgmentWindow', () => {
    it('should detect when gauge is within judgment window', () => {
      const bpm = 120;
      const timeSignature = 4;
      // 120 BPM, 4/4 = 2秒/小節
      // 200ms = 0.2秒 = 10%のウィンドウ
      
      // At exact marker
      expect(isWithinJudgmentWindow(80, bpm, timeSignature)).toBe(true);
      
      // Just before marker (within 10%)
      expect(isWithinJudgmentWindow(71, bpm, timeSignature)).toBe(true);
      expect(isWithinJudgmentWindow(70, bpm, timeSignature)).toBe(true);
      
      // Just after marker (within 10%)
      expect(isWithinJudgmentWindow(89, bpm, timeSignature)).toBe(true);
      expect(isWithinJudgmentWindow(90, bpm, timeSignature)).toBe(true);
      
      // Too far before (> 10%)
      expect(isWithinJudgmentWindow(69, bpm, timeSignature)).toBe(false);
      
      // Too far after (> 10%)
      expect(isWithinJudgmentWindow(91, bpm, timeSignature)).toBe(false);
    });
  });

  describe('hasMissedTiming', () => {
    it('should detect when timing has been missed', () => {
      const bpm = 120;
      const timeSignature = 4;
      // 80% + 10% = 90%を超えたらミス
      
      // Still in window
      expect(hasMissedTiming(89, bpm, timeSignature)).toBe(false);
      expect(hasMissedTiming(90, bpm, timeSignature)).toBe(false);
      
      // Just past window
      expect(hasMissedTiming(91, bpm, timeSignature)).toBe(true);
      
      // Way past window
      expect(hasMissedTiming(95, bpm, timeSignature)).toBe(true);
    });
  });
});