/**
 * rhythmStore のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useRhythmStore } from '../rhythmStore';
import type { FantasyStage } from '@/components/fantasy/FantasyGameEngine';

describe('rhythmStore', () => {
  // テスト用のステージデータ
  const mockStageRandom: FantasyStage = {
    id: 'test-1',
    stageNumber: '1-1',
    name: 'Test Stage Random',
    description: 'Test',
    maxHp: 100,
    enemyGaugeSeconds: 10,
    enemyCount: 1,
    enemyHp: 50,
    minDamage: 10,
    maxDamage: 20,
    mode: 'rhythm',
    allowedChords: ['C', 'G', 'Am', 'F'],
    showSheetMusic: false,
    showGuide: false,
    monsterIcon: 'dragon',
    simultaneousMonsterCount: 1,
    bpm: 120,
    measureCount: 8,
    countInMeasures: 2,
    timeSignature: 4
  };

  const mockStageProgression: FantasyStage = {
    ...mockStageRandom,
    id: 'test-2',
    stageNumber: '1-2',
    name: 'Test Stage Progression',
    chordProgressionData: ['C', 'Am', 'F', 'G']
  };

  beforeEach(() => {
    // ストアをリセット
    useRhythmStore.getState().reset();
  });

  describe('generate', () => {
    it('ランダムパターンで譜面を生成する', () => {
      const store = useRhythmStore.getState();
      const startAt = 1000;
      const readyTime = 3000;
      
      store.generate(mockStageRandom, startAt, readyTime);
      
      const state = useRhythmStore.getState();
      expect(state.pattern).toBe('random');
      expect(state.questions.length).toBe(8); // 2小節 × 4拍
      expect(state.isActive).toBe(true);
    });

    it('進行パターンで譜面を生成する', () => {
      const store = useRhythmStore.getState();
      const startAt = 1000;
      const readyTime = 3000;
      
      store.generate(mockStageProgression, startAt, readyTime);
      
      const state = useRhythmStore.getState();
      expect(state.pattern).toBe('progression');
      expect(state.questions.length).toBe(8); // 2小節 × 4拍
    });

    it('正しいtargetMsを計算する', () => {
      const store = useRhythmStore.getState();
      const startAt = 0;
      const readyTime = 0;
      
      store.generate(mockStageRandom, startAt, readyTime);
      
      const state = useRhythmStore.getState();
      const msPerBeat = 60000 / 120; // 500ms per beat at 120BPM
      
      // カウントイン2小節後の最初のビート
      const expectedFirstBeat = (2 * 4) * msPerBeat; // 4000ms
      expect(state.questions[0].targetMs).toBe(expectedFirstBeat);
    });

    it('targetMsが単調増加する', () => {
      const store = useRhythmStore.getState();
      store.generate(mockStageRandom, 0, 0);
      
      const questions = useRhythmStore.getState().questions;
      for (let i = 1; i < questions.length; i++) {
        expect(questions[i].targetMs).toBeGreaterThan(questions[i - 1].targetMs);
      }
    });
  });

  describe('tick', () => {
    it('時間内のquestionを返す', () => {
      const store = useRhythmStore.getState();
      store.generate(mockStageRandom, 0, 0);
      
      const question = store.tick(4000); // 最初のビートの時刻
      expect(question).not.toBeNull();
      expect(question?.id).toBe('0-1');
    });

    it('判定時刻を過ぎたらポインタを進める', () => {
      const store = useRhythmStore.getState();
      store.generate(mockStageRandom, 0, 0);
      
      // 最初のビートの判定時刻を過ぎた時刻
      store.tick(4201); // 4000 + 201ms
      
      const state = useRhythmStore.getState();
      expect(state.pointer).toBe(1);
    });

    it('非アクティブ時はnullを返す', () => {
      const store = useRhythmStore.getState();
      const question = store.tick(1000);
      expect(question).toBeNull();
    });

    it('全questions処理後はnullを返す', () => {
      const store = useRhythmStore.getState();
      store.generate(mockStageRandom, 0, 0);
      
      // ポインタを最後まで進める
      const state = useRhythmStore.getState();
      state.pointer = state.questions.length;
      
      const question = store.tick(10000);
      expect(question).toBeNull();
    });
  });

  describe('reset', () => {
    it('初期状態にリセットする', () => {
      const store = useRhythmStore.getState();
      store.generate(mockStageRandom, 0, 0);
      
      store.reset();
      
      const state = useRhythmStore.getState();
      expect(state.questions).toHaveLength(0);
      expect(state.pointer).toBe(0);
      expect(state.isActive).toBe(false);
      expect(state.pattern).toBe('random');
    });
  });

  describe('setActive', () => {
    it('アクティブ状態を設定できる', () => {
      const store = useRhythmStore.getState();
      
      store.setActive(true);
      expect(useRhythmStore.getState().isActive).toBe(true);
      
      store.setActive(false);
      expect(useRhythmStore.getState().isActive).toBe(false);
    });
  });
});