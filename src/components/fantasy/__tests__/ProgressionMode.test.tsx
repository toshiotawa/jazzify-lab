import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFantasyGameEngine } from '../FantasyGameEngine';
import { FantasyStage } from '@/types';
import useTimeStore from '@/stores/timeStore';

// モックの設定
vi.mock('@/hooks/useInstrument', () => ({
  useInstrumentContext: () => ({
    playNote: vi.fn(),
    stopNote: vi.fn(),
  }),
}));

vi.mock('@/stores/timeStore', () => ({
  default: {
    getState: vi.fn(() => ({
      currentBeatDecimal: 1,
      currentMeasure: 1,
    })),
  },
}));

describe('ProgressionMode タイミング制御テスト', () => {
  let mockOnGameStateChange: ReturnType<typeof vi.fn>;
  let mockOnChordCorrect: ReturnType<typeof vi.fn>;
  let mockOnChordIncorrect: ReturnType<typeof vi.fn>;
  let mockOnGameComplete: ReturnType<typeof vi.fn>;
  let mockOnEnemyAttack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnGameStateChange = vi.fn();
    mockOnChordCorrect = vi.fn();
    mockOnChordIncorrect = vi.fn();
    mockOnGameComplete = vi.fn();
    mockOnEnemyAttack = vi.fn();
    vi.clearAllMocks();
  });

  describe('chord_progression_dataを使用したタイミング制御', () => {
    const stageWithTimingData: FantasyStage = {
      id: 'test-stage',
      stage_number: '1',
      name: 'Test Stage',
      description: 'Test',
      max_hp: 5,
      enemy_gauge_seconds: 10,
      enemy_count: 1,
      enemy_hp: 3,
      min_damage: 10,
      max_damage: 20,
      mode: 'progression',
      allowed_chords: ['C', 'F', 'G'],
      chord_progression_data: [
        { bar: 1, beats: 3, chord: 'C' },
        { bar: 2, beats: 1, chord: 'F' },
        { bar: 2, beats: 3, chord: 'G' },
        { bar: 3, beats: 1, chord: 'C' },
      ],
      show_sheet_music: false,
      show_guide: false,
      simultaneous_monster_count: 1,
      bpm: 120,
      time_signature: 4,
    };

    it('指定されたタイミングでコードが出現する', async () => {
      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage: stageWithTimingData,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      // ゲーム開始
      await act(async () => {
        await result.current.startGame();
      });

      // 1小節3拍目でCコードが出現
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 3,
        currentMeasure: 1,
      } as any);

      await act(async () => {
        // ゲーム状態の更新をトリガー
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockOnGameStateChange).toHaveBeenCalled();
      const gameState = mockOnGameStateChange.mock.calls[mockOnGameStateChange.mock.calls.length - 1][0];
      expect(gameState.activeMonsters[0]?.chordTarget?.id).toBe('C');
    });

    it('判定受付終了タイミング（次コードの0.49拍前）でNULL時間に入る', async () => {
      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage: stageWithTimingData,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      await act(async () => {
        await result.current.startGame();
      });

      // 1小節3拍目のCコードを設定
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 3,
        currentMeasure: 1,
      } as any);

      // 2小節0.51拍目（Fコードの0.49拍前）でNULL時間に入るはず
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 0.51,
        currentMeasure: 2,
      } as any);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const gameState = mockOnGameStateChange.mock.calls[mockOnGameStateChange.mock.calls.length - 1][0];
      expect(gameState.isNullPhase).toBe(true);
    });
  });

  describe('従来の配列ベースのプログレッション', () => {
    const stageWithArray: FantasyStage = {
      id: 'test-stage',
      stage_number: '1',
      name: 'Test Stage',
      description: 'Test',
      max_hp: 5,
      enemy_gauge_seconds: 10,
      enemy_count: 1,
      enemy_hp: 3,
      min_damage: 10,
      max_damage: 20,
      mode: 'progression',
      allowed_chords: ['C', 'F', 'G', 'Am'],
      chord_progression: ['C', 'F', 'G', 'C'],
      show_sheet_music: false,
      show_guide: false,
      simultaneous_monster_count: 1,
      bpm: 120,
      time_signature: 4,
    };

    it('4拍目のウラ（4.5）で新しい問題が出題される', async () => {
      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage: stageWithArray,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      await act(async () => {
        await result.current.startGame();
      });

      // 4.5拍目で出題
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 4.5,
        currentMeasure: 1,
      } as any);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const gameState = mockOnGameStateChange.mock.calls[mockOnGameStateChange.mock.calls.length - 1][0];
      expect(gameState.isQuestionPresented).toBe(true);
    });

    it('4.49拍で判定受付が終了し、失敗の場合は自動で次へ進む', async () => {
      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage: stageWithArray,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      await act(async () => {
        await result.current.startGame();
      });

      // 問題を提示
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 4.5,
        currentMeasure: 1,
      } as any);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // 4.49拍で判定終了
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 4.49,
        currentMeasure: 1,
      } as any);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const gameState = mockOnGameStateChange.mock.calls[mockOnGameStateChange.mock.calls.length - 1][0];
      expect(gameState.isNullPhase).toBe(true);
      expect(gameState.isQuestionPresented).toBe(false);
    });

    it('3拍子の場合は3.5拍で出題、3.49拍で判定終了', async () => {
      const stage3Beat: FantasyStage = {
        ...stageWithArray,
        time_signature: 3,
      };

      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage: stage3Beat,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      await act(async () => {
        await result.current.startGame();
      });

      // 3.5拍目で出題
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 3.5,
        currentMeasure: 1,
      } as any);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let gameState = mockOnGameStateChange.mock.calls[mockOnGameStateChange.mock.calls.length - 1][0];
      expect(gameState.isQuestionPresented).toBe(true);

      // 3.49拍で判定終了
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 3.49,
        currentMeasure: 1,
      } as any);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      gameState = mockOnGameStateChange.mock.calls[mockOnGameStateChange.mock.calls.length - 1][0];
      expect(gameState.isNullPhase).toBe(true);
    });
  });

  describe('入力タイミング制御', () => {
    const stage: FantasyStage = {
      id: 'test-stage',
      stage_number: '1',
      name: 'Test Stage',
      description: 'Test',
      max_hp: 5,
      enemy_gauge_seconds: 10,
      enemy_count: 1,
      enemy_hp: 3,
      min_damage: 10,
      max_damage: 20,
      mode: 'progression',
      allowed_chords: ['C'],
      chord_progression: ['C'],
      show_sheet_music: false,
      show_guide: false,
      simultaneous_monster_count: 1,
      bpm: 120,
      time_signature: 4,
    };

    it('NULL時間中は入力が無効化される', async () => {
      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      await act(async () => {
        await result.current.startGame();
      });

      // NULL時間を設定
      act(() => {
        mockOnGameStateChange.mockImplementation((state) => {
          if (state.isNullPhase) {
            result.current.handleNoteInput(60); // C4
          }
        });
      });

      // 入力が処理されないことを確認
      expect(mockOnChordCorrect).not.toHaveBeenCalled();
      expect(mockOnChordIncorrect).not.toHaveBeenCalled();
    });

    it('判定受付タイミング外では入力が無効化される', async () => {
      const { result } = renderHook(() =>
        useFantasyGameEngine({
          stage,
          onGameStateChange: mockOnGameStateChange,
          onChordCorrect: mockOnChordCorrect,
          onChordIncorrect: mockOnChordIncorrect,
          onGameComplete: mockOnGameComplete,
          onEnemyAttack: mockOnEnemyAttack,
        })
      );

      await act(async () => {
        await result.current.startGame();
      });

      // 判定受付終了後（4.5拍以降）
      vi.mocked(useTimeStore.getState).mockReturnValue({
        currentBeatDecimal: 4.6,
        currentMeasure: 1,
      } as any);

      act(() => {
        result.current.handleNoteInput(60); // C4
      });

      // 入力が処理されないことを確認
      expect(mockOnChordCorrect).not.toHaveBeenCalled();
      expect(mockOnChordIncorrect).not.toHaveBeenCalled();
    });
  });
});