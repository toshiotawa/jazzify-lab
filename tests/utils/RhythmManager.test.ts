import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RhythmManager } from '@/utils/RhythmManager';

describe('RhythmManager', () => {
  let rhythmManager: RhythmManager;
  let mockAudio: any;

  beforeEach(() => {
    // AudioオブジェクトのモックCommon用の型定義が必要です
    mockAudio = {
      currentTime: 0,
      volume: 1,
      loop: false,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    };

    // globalのAudioをモック
    global.Audio = vi.fn(() => mockAudio) as any;

    rhythmManager = new RhythmManager({
      audioUrl: '/demo-1.mp3',
      bpm: 120,
      timeSignature: 4,
      loopMeasures: 8,
      volume: 0.7
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentPosition', () => {
    it('calculates beat and measure correctly at start', () => {
      mockAudio.currentTime = 0;
      const pos = rhythmManager.getCurrentPosition();
      
      expect(pos.measure).toBe(1);
      expect(pos.beat).toBeCloseTo(1, 2);
      expect(pos.absoluteBeat).toBe(0);
    });

    it('calculates beat and measure correctly after 1 beat (120 BPM = 0.5s per beat)', () => {
      mockAudio.currentTime = 0.5;
      const pos = rhythmManager.getCurrentPosition();
      
      expect(pos.measure).toBe(1);
      expect(pos.beat).toBeCloseTo(2, 2);
      expect(pos.absoluteBeat).toBe(1);
    });

    it('calculates measure correctly after 4 beats', () => {
      mockAudio.currentTime = 2; // 4 beats at 120 BPM
      const pos = rhythmManager.getCurrentPosition();
      
      expect(pos.measure).toBe(2);
      expect(pos.beat).toBeCloseTo(1, 2);
      expect(pos.absoluteBeat).toBe(4);
    });
  });

  describe('getJudgmentWindow', () => {
    it('returns correct judgment window for first beat', () => {
      mockAudio.currentTime = 0;
      const window = rhythmManager.getJudgmentWindow(1, 1);
      
      expect(window.start).toBe(-200);
      expect(window.end).toBe(200);
      expect(window.perfect).toBe(false); // currentTime is not close enough
    });

    it('returns correct judgment window for later beats', () => {
      // BPM 120 = 500ms per beat
      const window = rhythmManager.getJudgmentWindow(2, 3);
      
      // (1-1)*4 + (3-1) = 2 beats = 1000ms
      const expectedTime = ((1 * 4) + 2) * 500;
      expect(window.start).toBe(expectedTime - 200);
      expect(window.end).toBe(expectedTime + 200);
    });

    it('detects perfect timing', () => {
      mockAudio.currentTime = 0.5; // exactly 1 beat at 120 BPM
      const window = rhythmManager.getJudgmentWindow(1, 2);
      
      expect(window.perfect).toBe(true);
    });
  });

  describe('getTimeToNextBeat', () => {
    it('calculates time to next beat correctly', () => {
      mockAudio.currentTime = 0.3; // 300ms into first beat
      const timeToNext = rhythmManager.getTimeToNextBeat();
      
      // At 120 BPM, beat duration is 0.5s
      expect(timeToNext).toBeCloseTo(0.2, 2);
    });

    it('returns full beat duration at exact beat', () => {
      mockAudio.currentTime = 0.5; // exactly on beat
      const timeToNext = rhythmManager.getTimeToNextBeat();
      
      expect(timeToNext).toBeCloseTo(0.5, 2);
    });
  });

  describe('audio control', () => {
    it('starts audio playback', () => {
      rhythmManager.start();
      
      expect(mockAudio.play).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
    });

    it('starts audio playback with offset', () => {
      rhythmManager.start(2.5);
      
      expect(mockAudio.play).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(2.5);
    });

    it('stops audio playback', () => {
      rhythmManager.start();
      rhythmManager.stop();
      
      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });

  describe('volume control', () => {
    it('sets volume correctly', () => {
      expect(mockAudio.volume).toBe(0.7);
    });

    it('uses default volume when not specified', () => {
      const rm = new RhythmManager({
        audioUrl: '/demo-1.mp3',
        bpm: 120,
        timeSignature: 4,
        loopMeasures: 8
      });
      
      expect(mockAudio.volume).toBe(0.7); // default
    });
  });
});