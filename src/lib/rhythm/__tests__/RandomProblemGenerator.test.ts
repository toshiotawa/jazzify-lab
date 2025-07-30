import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RandomProblemGenerator } from '../RandomProblemGenerator';
import { Timeline } from '../Timeline';
import { ChordDefinition } from '@/types';

describe('RandomProblemGenerator', () => {
  let timeline: Timeline;
  let generator: RandomProblemGenerator;
  
  beforeEach(() => {
    vi.useFakeTimers();
    timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
  });
  
  afterEach(() => {
    vi.useRealTimers();
    timeline.stop();
  });

  describe('基本機能', () => {
    it('正しく初期化される', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      expect(generator.getCurrentChord()).toBeNull();
    });

    it('開始時に最初のコードが生成される', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      const callback = vi.fn();
      generator.onChordChange(callback);
      
      timeline.start();
      generator.start();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          notes: expect.any(Array),
          root: expect.any(String)
        }),
        0
      );
    });
  });

  describe('1小節1出題', () => {
    it('小節ごとに新しいコードが出題される', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      const callback = vi.fn();
      generator.onChordChange(callback);
      
      timeline.start();
      generator.start();
      
      // 初回
      expect(callback).toHaveBeenCalledTimes(1);
      
      // 1小節後（2秒後）
      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(2);
      
      // さらに1小節後
      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('小節の途中では新しいコードが出題されない', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      const callback = vi.fn();
      generator.onChordChange(callback);
      
      timeline.start();
      generator.start();
      
      // 初回
      expect(callback).toHaveBeenCalledTimes(1);
      
      // 0.5秒後（2拍目）
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // さらに0.5秒後（3拍目）
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // さらに0.5秒後（4拍目）
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // さらに0.5秒後（次の小節）
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('重複回避', () => {
    it('直前のコードと異なるコードが選択される', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      const chords: string[] = [];
      generator.onChordChange((chord) => {
        chords.push(chord.name);
      });
      
      timeline.start();
      generator.start();
      
      // 10回分のコードを生成
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(2000);
      }
      
      // 連続して同じコードが出ていないことを確認
      for (let i = 1; i < chords.length; i++) {
        expect(chords[i]).not.toBe(chords[i - 1]);
      }
    });

    it('1種類のコードしかない場合は常に同じコードが返される', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C'],
        timeline
      });
      
      const chords: string[] = [];
      generator.onChordChange((chord) => {
        chords.push(chord.name);
      });
      
      timeline.start();
      generator.start();
      
      // 3回分のコードを生成
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(2000);
      }
      
      // すべて同じコード
      expect(chords).toEqual(['C', 'C', 'C', 'C']);
    });
  });

  describe('コードパース', () => {
    it('メジャーコードが正しくパースされる', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C'],
        timeline
      });
      
      let generatedChord: ChordDefinition | null = null;
      generator.onChordChange((chord) => {
        generatedChord = chord;
      });
      
      timeline.start();
      generator.start();
      
      expect(generatedChord).not.toBeNull();
      expect(generatedChord!.name).toBe('C');
      expect(generatedChord!.root).toBe('C');
      // C4, E4, G4 (MIDI: 60, 64, 67)
      expect(generatedChord!.notes).toEqual([60, 64, 67]);
    });

    it('マイナーコードが正しくパースされる', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['Am'],
        timeline
      });
      
      let generatedChord: ChordDefinition | null = null;
      generator.onChordChange((chord) => {
        generatedChord = chord;
      });
      
      timeline.start();
      generator.start();
      
      expect(generatedChord!.name).toBe('Am');
      expect(generatedChord!.root).toBe('A');
      // A4, C5, E5 (MIDI: 69, 72, 76)
      expect(generatedChord!.notes).toEqual([69, 72, 76]);
    });

    it('7thコードが正しくパースされる', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['G7'],
        timeline
      });
      
      let generatedChord: ChordDefinition | null = null;
      generator.onChordChange((chord) => {
        generatedChord = chord;
      });
      
      timeline.start();
      generator.start();
      
      expect(generatedChord!.name).toBe('G7');
      expect(generatedChord!.root).toBe('G');
      // G4, B4, D5, F5 (MIDI: 67, 71, 74, 77)
      expect(generatedChord!.notes).toEqual([67, 71, 74, 77]);
    });
  });

  describe('コールバック管理', () => {
    it('複数のコールバックが登録・実行される', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      generator.onChordChange(callback1);
      generator.onChordChange(callback2);
      
      timeline.start();
      generator.start();
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('コールバックの登録解除が機能する', () => {
      generator = new RandomProblemGenerator({
        allowedChords: ['C', 'F', 'G'],
        timeline
      });
      
      const callback = vi.fn();
      
      generator.onChordChange(callback);
      timeline.start();
      generator.start();
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      generator.offChordChange(callback);
      vi.advanceTimersByTime(2000);
      
      expect(callback).toHaveBeenCalledTimes(1); // 増えない
    });
  });
});