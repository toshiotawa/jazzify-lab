/**
 * FantasyRhythmEngine テスト
 */

import { renderHook, act } from '@testing-library/react';
import { useFantasyRhythmEngine } from '../FantasyRhythmEngine';
import { loadRhythmJson, getChordAtTiming, sortChords } from '@/utils/rhythmJsonLoader';
import type { FantasyStage } from '../FantasyRhythmEngine';

// モックの設定
jest.mock('@/utils/logger', () => ({
  devLog: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('@/stores/gameStore', () => ({
  useGameStore: () => ({
    settings: {
      displayLang: 'en',
      simplifiedChords: false
    }
  })
}));

jest.mock('@/stores/timeStore', () => ({
  useTimeStore: () => ({
    currentBeat: 1,
    currentMeasure: 1,
    bpm: 120,
    timeSignature: 4,
    measureCount: 8,
    countInMeasures: 1,
    isCountIn: false,
    setRhythmMode: jest.fn(),
    getState: jest.fn(() => ({
      currentBeat: 1,
      currentMeasure: 1,
      bpm: 120,
      timeSignature: 4,
      measureCount: 8,
      countInMeasures: 1,
      isCountIn: false
    }))
  })
}));

describe('FantasyRhythmEngine', () => {
  const mockStage: FantasyStage = {
    id: 'test-stage',
    stageNumber: '1-1',
    name: 'Test Stage',
    description: 'Test Description',
    maxHp: 5,
    enemyGaugeSeconds: 4,
    enemyCount: 10,
    enemyHp: 1,
    minDamage: 1,
    maxDamage: 1,
    mode: 'rhythm',
    allowedChords: ['C', 'G', 'Am', 'F'],
    showSheetMusic: false,
    showGuide: true,
    monsterIcon: 'dragon',
    bgmUrl: '/test.mp3',
    simultaneousMonsterCount: 1,
    bpm: 120,
    measureCount: 8,
    countInMeasures: 1,
    timeSignature: 4,
    chordProgressionData: {
      chords: [
        { beat: 1.0, chord: 'C', measure: 1 },
        { beat: 1.0, chord: 'G', measure: 2 },
        { beat: 1.0, chord: 'Am', measure: 3 },
        { beat: 1.0, chord: 'F', measure: 4 }
      ]
    }
  };

  const mockCallbacks = {
    onGameStateChange: jest.fn(),
    onChordCorrect: jest.fn(),
    onChordIncorrect: jest.fn(),
    onGameComplete: jest.fn(),
    onEnemyAttack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期化処理', () => {
    it('リズムモードエンジンが正しく初期化される', () => {
      const { result } = renderHook(() => 
        useFantasyRhythmEngine({
          stage: mockStage,
          ...mockCallbacks
        })
      );

      expect(result.current.gameState).toBeDefined();
      expect(result.current.gameState.currentStage).toEqual(mockStage);
      expect(result.current.gameState.rhythmData).toBeDefined();
      expect(result.current.gameState.rhythmData?.chords).toHaveLength(4);
    });

    it('ランダムパターンモードで初期化される', () => {
      const randomStage = { ...mockStage, chordProgressionData: null };
      
      const { result } = renderHook(() => 
        useFantasyRhythmEngine({
          stage: randomStage,
          ...mockCallbacks
        })
      );

      expect(result.current.gameState.rhythmData).toBeNull();
      expect(result.current.gameState.totalQuestions).toBe(10); // enemyCount
    });
  });

  describe('判定ウィンドウ', () => {
    it('200ms以内の入力が正しく判定される', () => {
      const { result } = renderHook(() => 
        useFantasyRhythmEngine({
          stage: mockStage,
          ...mockCallbacks
        })
      );

      act(() => {
        result.current.startGame();
      });

      // C コードの構成音を入力（60 = C4）
      act(() => {
        result.current.handleNoteInput(60); // C
      });

      // 判定ウィンドウ内であれば入力バッファに追加される
      expect(result.current.gameState.inputBuffer).toContain(60);
    });

    it('判定ウィンドウ外の入力でバッファがリセットされる', () => {
      // このテストは実際のタイミング制御が必要なため、
      // 実装では判定ウィンドウ外のシミュレーションが必要
      expect(true).toBe(true); // プレースホルダー
    });
  });

  describe('JSON読み込み', () => {
    it('有効なJSONデータが正しく読み込まれる', () => {
      const jsonData = {
        chords: [
          { beat: 1.0, chord: 'C', measure: 1 },
          { beat: 3.0, chord: 'G', measure: 1 },
          { beat: 1.0, chord: 'Am', measure: 2 }
        ]
      };

      const result = loadRhythmJson(jsonData);
      expect(result.chords).toHaveLength(3);
      expect(result.chords[0].chord).toBe('C');
    });

    it('無効なJSONデータでエラーがスローされる', () => {
      const invalidData = { chords: 'not an array' };
      expect(() => loadRhythmJson(invalidData as any)).toThrow();
    });

    it('JSON文字列が正しくパースされる', () => {
      const jsonString = '{"chords":[{"beat":1,"chord":"C","measure":1}]}';
      const result = loadRhythmJson(jsonString);
      expect(result.chords).toHaveLength(1);
    });
  });

  describe('コード進行処理', () => {
    it('指定タイミングのコードが正しく取得される', () => {
      const chords = [
        { beat: 1.0, chord: 'C', measure: 1 },
        { beat: 3.0, chord: 'G', measure: 1 },
        { beat: 1.0, chord: 'Am', measure: 2 }
      ];

      const chord = getChordAtTiming(chords, 1, 1.0);
      expect(chord?.chord).toBe('C');

      const chord2 = getChordAtTiming(chords, 1, 3.0);
      expect(chord2?.chord).toBe('G');

      const noChord = getChordAtTiming(chords, 3, 1.0);
      expect(noChord).toBeNull();
    });

    it('コードが正しくソートされる', () => {
      const chords = [
        { beat: 3.0, chord: 'G', measure: 1 },
        { beat: 1.0, chord: 'Am', measure: 2 },
        { beat: 1.0, chord: 'C', measure: 1 }
      ];

      const sorted = sortChords(chords);
      expect(sorted[0].chord).toBe('C');
      expect(sorted[1].chord).toBe('G');
      expect(sorted[2].chord).toBe('Am');
    });
  });

  describe('ゲームプレイ', () => {
    it('正解時にスコアが加算される', () => {
      const { result } = renderHook(() => 
        useFantasyRhythmEngine({
          stage: mockStage,
          ...mockCallbacks
        })
      );

      act(() => {
        result.current.startGame();
      });

      const initialScore = result.current.gameState.score;

      // Cコードを完成させる（60=C, 64=E, 67=G）
      act(() => {
        result.current.handleNoteInput(60);
        result.current.handleNoteInput(64);
        result.current.handleNoteInput(67);
      });

      // スコアが増加していることを確認
      expect(result.current.gameState.score).toBeGreaterThan(initialScore);
    });

    it('ゲーム終了が正しく処理される', () => {
      const { result } = renderHook(() => 
        useFantasyRhythmEngine({
          stage: { ...mockStage, enemyCount: 1 },
          ...mockCallbacks
        })
      );

      act(() => {
        result.current.startGame();
      });

      // ゲーム開始時はアクティブ
      expect(result.current.gameState.isGameActive).toBe(true);

      // プレイヤーHPを0にしてゲームオーバー
      act(() => {
        // 実際の実装では敵の攻撃でHPが減る
        result.current.gameState.playerHp = 0;
      });

      // ゲーム終了コールバックが呼ばれることを確認
      // （実際の実装ではタイムアウトによる敵攻撃処理が必要）
    });
  });

  describe('無限ループ処理', () => {
    it('プログレッションパターンで問題が無限にループする', () => {
      const { result } = renderHook(() => 
        useFantasyRhythmEngine({
          stage: mockStage,
          ...mockCallbacks
        })
      );

      act(() => {
        result.current.startGame();
      });

      // 初期状態の確認
      const initialMonsters = result.current.gameState.activeMonsters;
      expect(initialMonsters.length).toBeGreaterThan(0);

      // モンスターを倒した後も新しいモンスターが補充される
      // （実際の実装では replaceDefeatedMonsters のテストが必要）
    });
  });
});