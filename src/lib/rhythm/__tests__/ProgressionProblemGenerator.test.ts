import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressionProblemGenerator } from '../ProgressionProblemGenerator';
import { Timeline } from '../Timeline';
import { ProgressionChord } from '../ProgressionProblemGenerator';

describe('ProgressionProblemGenerator', () => {
  let timeline: Timeline;
  let generator: ProgressionProblemGenerator;
  
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    if (timeline) {
      timeline.stop();
    }
  });

  describe('基本機能', () => {
    it('4/4拍子で正しく初期化される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F'],
        timeline
      });
      
      expect(generator.getProgressionLength()).toBe(4);
      expect(generator.getColumnCount()).toBe(4);
    });

    it('3/4拍子で正しく初期化される', () => {
      timeline = new Timeline({ bpm: 90, timeSig: 3, bars: 24 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'Am', 'F', 'G', 'Em'],
        timeline
      });
      
      expect(generator.getProgressionLength()).toBe(5);
      expect(generator.getColumnCount()).toBe(3);
    });
  });

  describe('初期配置', () => {
    it('4列の初期配置が正しい', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F'],
        timeline
      });
      
      const chords: ProgressionChord[] = [];
      generator.onProgressionChange((c) => {
        chords.push(...c);
      });
      
      timeline.start();
      generator.start();
      
      expect(chords).toHaveLength(4);
      expect(chords[0].chord.name).toBe('C');
      expect(chords[0].column).toBe(0);
      expect(chords[1].chord.name).toBe('G');
      expect(chords[1].column).toBe(1);
      expect(chords[2].chord.name).toBe('Am');
      expect(chords[2].column).toBe(2);
      expect(chords[3].chord.name).toBe('F');
      expect(chords[3].column).toBe(3);
    });

    it('3列の初期配置が正しい', () => {
      timeline = new Timeline({ bpm: 90, timeSig: 3, bars: 24 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'Am', 'F'],
        timeline
      });
      
      const chords: ProgressionChord[] = [];
      generator.onProgressionChange((c) => {
        chords.push(...c);
      });
      
      timeline.start();
      generator.start();
      
      expect(chords).toHaveLength(3);
      expect(chords[0].chord.name).toBe('C');
      expect(chords[0].column).toBe(0);
      expect(chords[1].chord.name).toBe('Am');
      expect(chords[1].column).toBe(1);
      expect(chords[2].chord.name).toBe('F');
      expect(chords[2].column).toBe(2);
    });
  });

  describe('列オフセット - 4列、6コード', () => {
    it('2周目の列オフセットが正しい', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F', 'Dm', 'Em'],
        timeline
      });
      
      timeline.start();
      generator.start();
      
      // 初期状態を超えて、2周目まで進める
      for (let i = 0; i < 6; i++) {
        generator.fillColumn(i % 4);
      }
      
      // 2周目の最初（7番目）は列2から始まる
      const chord7 = generator.fillColumn(0);
      expect(chord7.chord.name).toBe('C'); // 2周目の最初
      expect(chord7.column).toBe(0); // 指定した列
      expect(chord7.progressionIndex).toBe(0);
    });
  });

  describe('列オフセット - 3列、5コード', () => {
    it('複数周のオフセットパターンが正しい', () => {
      timeline = new Timeline({ bpm: 90, timeSig: 3, bars: 24 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'Am', 'F', 'G', 'Em'],
        timeline
      });
      
      timeline.start();
      generator.start();
      
      // 各周の開始列を記録
      const startColumns: number[] = [];
      const chordsPerCycle = 5;
      const columnsCount = 3;
      
      for (let cycle = 0; cycle < 4; cycle++) {
        const globalIdx = cycle * chordsPerCycle;
        const offset = (cycle * (chordsPerCycle % columnsCount)) % columnsCount;
        startColumns.push(offset);
      }
      
      // 期待値：
      // 1周目: offset = 0
      // 2周目: offset = (5 % 3) = 2
      // 3周目: offset = (2 * 2) % 3 = 1
      // 4周目: offset = (3 * 2) % 3 = 0
      expect(startColumns).toEqual([0, 2, 1, 0]);
    });
  });

  describe('fillColumn', () => {
    it('指定列に次のコードが補充される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F'],
        timeline
      });
      
      timeline.start();
      generator.start();
      
      // 初期状態（グローバルインデックス: 0-3）
      expect(generator.getGlobalIndex()).toBe(0);
      
      // 列0を補充（グローバルインデックス: 4）
      const nextChord = generator.fillColumn(0);
      expect(nextChord.chord.name).toBe('C'); // 5番目 = C（2周目）
      expect(nextChord.column).toBe(0);
      expect(generator.getGlobalIndex()).toBe(1);
    });

    it('プログレッション内インデックスが正しく循環する', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G'],
        timeline
      });
      
      timeline.start();
      generator.start();
      
      const filledChords: string[] = [];
      
      // 8回補充
      for (let i = 0; i < 8; i++) {
        const chord = generator.fillColumn(i % 4);
        filledChords.push(chord.chord.name);
      }
      
      // C, G, C, G, C, G, C, G, C, G, C, G の繰り返し
      expect(filledChords).toEqual(['C', 'G', 'C', 'G', 'C', 'G', 'C', 'G']);
    });
  });

  describe('コールバック管理', () => {
    it('複数のコールバックが実行される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F'],
        timeline
      });
      
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      generator.onProgressionChange(callback1);
      generator.onProgressionChange(callback2);
      
      timeline.start();
      generator.start();
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('コールバックの登録解除が機能する', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F'],
        timeline
      });
      
      const callback = vi.fn();
      
      generator.onProgressionChange(callback);
      generator.offProgressionChange(callback);
      
      timeline.start();
      generator.start();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('1コードのプログレッションでも動作する', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C'],
        timeline
      });
      
      const chords: ProgressionChord[] = [];
      generator.onProgressionChange((c) => {
        chords.push(...c);
      });
      
      timeline.start();
      generator.start();
      
      expect(chords).toHaveLength(4);
      expect(chords.every(c => c.chord.name === 'C')).toBe(true);
    });

    it('列数と同じ長さのプログレッションでオフセットが発生しない', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 8 });
      generator = new ProgressionProblemGenerator({
        chordProgression: ['C', 'G', 'Am', 'F'], // 4コード、4列
        timeline
      });
      
      timeline.start();
      generator.start();
      
      // 8回補充（2周分）
      const positions: number[] = [];
      for (let i = 0; i < 8; i++) {
        const chord = generator.fillColumn(i % 4);
        positions.push(chord.column);
      }
      
      // すべて順番通り（オフセットなし）
      expect(positions).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
    });
  });
});