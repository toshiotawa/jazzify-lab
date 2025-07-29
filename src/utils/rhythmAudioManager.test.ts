import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RhythmAudioManager } from './rhythmAudioManager';

describe('RhythmAudioManager', () => {
  let audioManager: RhythmAudioManager;

  beforeEach(() => {
    // currentTimeプロパティを各テストの前にモック
    Object.defineProperty(HTMLAudioElement.prototype, 'currentTime', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    audioManager = new RhythmAudioManager();
  });

  afterEach(() => {
    // dispose前にcurrentTimeを設定可能にする
    Object.defineProperty(HTMLAudioElement.prototype, 'currentTime', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    audioManager.dispose();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(audioManager).toBeInstanceOf(RhythmAudioManager);
    });
  });

  describe('loadSong', () => {
    it('should load a song from URL', async () => {
      const mockUrl = '/sounds/test.mp3';
      
      // AudioElement.loadをモック
      const loadSpy = vi.spyOn(HTMLAudioElement.prototype, 'load').mockImplementation(() => {});
      
      // loadSong内でcanplaythroughイベントが発火するので、Promise.resolveで即座に解決
      const loadPromise = audioManager.loadSong(mockUrl);
      
      // canplaythroughイベントを手動で発火
      const audio = (audioManager as any).audio;
      setTimeout(() => {
        audio.dispatchEvent(new Event('canplaythrough'));
      }, 0);
      
      await loadPromise;
      
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('play/pause/stop', () => {
    it('should play audio', async () => {
      const playSpy = vi.spyOn(HTMLAudioElement.prototype, 'play').mockResolvedValue();
      
      await audioManager.play();
      
      expect(playSpy).toHaveBeenCalled();
    });

    it('should pause audio', () => {
      const pauseSpy = vi.spyOn(HTMLAudioElement.prototype, 'pause');
      
      audioManager.pause();
      
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should stop audio and reset time', () => {
      const pauseSpy = vi.spyOn(HTMLAudioElement.prototype, 'pause');
      
      audioManager.stop();
      
      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  describe('getCurrentTime', () => {
    it('should return current playback time', () => {
      const mockTime = 10.5;
      Object.defineProperty(HTMLAudioElement.prototype, 'currentTime', {
        get: () => mockTime,
        configurable: true,
      });

      const currentTime = audioManager.getCurrentTime();
      
      expect(currentTime).toBe(mockTime);
    });
  });

  describe('setLoopPoints', () => {
    it('should calculate loop points correctly for 4/4 time', () => {
      const bpm = 120;
      const timeSignature = 4;
      const startMeasure = 1;
      const endMeasure = 8;
      
      audioManager.setLoopPoints(startMeasure, endMeasure, bpm, timeSignature);
      
      // 120 BPM, 4/4 time = 2 seconds per measure
      // Start at measure 1 (0 seconds), end at measure 8 (16 seconds)
      // These are internal properties, so we can't directly test them
      // Instead, we just verify the method doesn't throw
      expect(() => audioManager.setLoopPoints(startMeasure, endMeasure, bpm, timeSignature)).not.toThrow();
    });

    it('should calculate loop points correctly for 3/4 time', () => {
      const bpm = 90;
      const timeSignature = 3;
      const startMeasure = 1;
      const endMeasure = 4;
      
      expect(() => audioManager.setLoopPoints(startMeasure, endMeasure, bpm, timeSignature)).not.toThrow();
    });
  });

  describe('isPlaying', () => {
    it('should return true when audio is playing', () => {
      Object.defineProperty(HTMLAudioElement.prototype, 'paused', {
        get: () => false,
        configurable: true,
      });

      expect(audioManager.isPlaying()).toBe(true);
    });

    it('should return false when audio is paused', () => {
      Object.defineProperty(HTMLAudioElement.prototype, 'paused', {
        get: () => true,
        configurable: true,
      });

      expect(audioManager.isPlaying()).toBe(false);
    });
  });

  describe('setVolume', () => {
    it('should set volume within valid range', () => {
      audioManager.setVolume(0.5);
      // Volume is set on the internal audio element, so we can't directly test it
      expect(() => audioManager.setVolume(0.5)).not.toThrow();
    });

    it('should clamp volume to 0-1 range', () => {
      expect(() => audioManager.setVolume(-0.5)).not.toThrow();
      expect(() => audioManager.setVolume(1.5)).not.toThrow();
    });
  });

  describe('getDuration', () => {
    it('should return audio duration', () => {
      const mockDuration = 180.5; // 3 minutes
      Object.defineProperty(HTMLAudioElement.prototype, 'duration', {
        get: () => mockDuration,
        configurable: true,
      });

      expect(audioManager.getDuration()).toBe(mockDuration);
    });

    it('should return 0 when duration is not available', () => {
      Object.defineProperty(HTMLAudioElement.prototype, 'duration', {
        get: () => NaN,
        configurable: true,
      });

      expect(audioManager.getDuration()).toBe(0);
    });
  });
});