import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useFantasyGameEngine } from '../FantasyGameEngine';
import { useTimeStore } from '@/stores/timeStore';
import { bgmManager } from '@/utils/BGMManager';

// モックの設定
vi.mock('@/utils/BGMManager', () => ({
  bgmManager: {
    addBeatCallback: vi.fn(),
    removeBeatCallback: vi.fn(),
    getCurrentBeatFraction: vi.fn(() => 1.0),
    getCurrentMeasure: vi.fn(() => 1),
    getTimeUntilBeat: vi.fn(() => 500),
  }
}));

vi.mock('@/utils/logger', () => ({
  devLog: {
    debug: vi.fn(),
    error: vi.fn(),
  }
}));

describe('プログレッションモードの拡張機能', () => {
  const mockStage = {
    id: 'test',
    stageNumber: '1-1',
    name: 'Test Stage',
    description: 'Test',
    maxHp: 5,
    enemyGaugeSeconds: 10,
    enemyCount: 1,
    enemyHp: 1,
    minDamage: 1,
    maxDamage: 1,
    mode: 'progression' as const,
    allowedChords: ['C', 'F', 'G'],
    chordProgression: ['C', 'F', 'G', 'C'],
    showSheetMusic: false,
    showGuide: true,
    monsterIcon: 'test',
    simultaneousMonsterCount: 1,
    bpm: 120,
    measureCount: 4,
    timeSignature: 4,
    countInMeasures: 0,
  };

  const mockCallbacks = {
    onGameStateChange: vi.fn(),
    onChordCorrect: vi.fn(),
    onChordIncorrect: vi.fn(),
    onGameComplete: vi.fn(),
    onEnemyAttack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // timeStoreをリセット
    useTimeStore.getState().setProgressionTimings([]);
    useTimeStore.getState().setNullPhase(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('デフォルトプログレッションモードでタイミングが設定される', async () => {
    const { result } = renderHook(() => useFantasyGameEngine(mockCallbacks));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    const timings = useTimeStore.getState().progressionTimings;
    expect(timings).toHaveLength(4); // 4小節分
    expect(timings[0]).toEqual({ bar: 1, beat: 4.5, chord: 'C' });
    expect(timings[1]).toEqual({ bar: 2, beat: 4.5, chord: 'F' });
    expect(timings[2]).toEqual({ bar: 3, beat: 4.5, chord: 'G' });
    expect(timings[3]).toEqual({ bar: 4, beat: 4.5, chord: 'C' });
  });

  it('拡張プログレッションモードでカスタムタイミングが設定される', async () => {
    const customStage = {
      ...mockStage,
      chordProgressionData: [
        { bar: 1, beat: 3, chord: 'C' },
        { bar: 2, beat: 1, chord: 'F' },
      ],
    };

    const { result } = renderHook(() => useFantasyGameEngine(mockCallbacks));

    await act(async () => {
      await result.current.initializeGame(customStage);
    });

    const timings = useTimeStore.getState().progressionTimings;
    expect(timings).toHaveLength(2);
    expect(timings[0]).toEqual({ bar: 1, beat: 3, chord: 'C' });
    expect(timings[1]).toEqual({ bar: 2, beat: 1, chord: 'F' });
  });

  it('NULL時間中は入力が無視される', async () => {
    const { result } = renderHook(() => useFantasyGameEngine(mockCallbacks));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    // NULL時間を有効化
    act(() => {
      useTimeStore.getState().setNullPhase(true);
    });

    const beforeState = result.current.gameState;

    // 入力を試みる
    act(() => {
      result.current.handleNoteInput(60); // C4
    });

    // 状態が変化していないことを確認
    expect(result.current.gameState).toEqual(beforeState);
  });

  it('判定受付期間外の入力は無視される', async () => {
    const { result } = renderHook(() => useFantasyGameEngine(mockCallbacks));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    // 判定受付期間を設定（2.5 - 4.0）
    act(() => {
      const state = useTimeStore.getState();
      state.setProgressionTimings([{ bar: 1, beat: 4.5, chord: 'C' }]);
      state.acceptStartBeat = 2.5;
      state.acceptEndBeat = 4.0;
      state.currentBeatFraction = 1.5; // 判定期間前
    });

    const beforeState = result.current.gameState;

    // 入力を試みる
    act(() => {
      result.current.handleNoteInput(60); // C4
    });

    // 状態が変化していないことを確認
    expect(result.current.gameState).toEqual(beforeState);
  });

  it('判定受付終了時に未完成の場合、敵が攻撃する', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFantasyGameEngine(mockCallbacks));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    // 判定受付期間を終了させる
    act(() => {
      const state = useTimeStore.getState();
      state.currentBeatFraction = 4.5; // 判定終了
      state.acceptEndBeat = 4.49;
    });

    // updateEnemyGaugeを呼び出して判定チェックを実行
    act(() => {
      // プライベートメソッドを直接呼べないので、時間経過をシミュレート
      vi.advanceTimersByTime(100);
    });

    // 敵の攻撃コールバックが呼ばれたことを確認
    expect(mockCallbacks.onEnemyAttack).toHaveBeenCalled();
  });

  it('シングルモードには影響しない', async () => {
    const singleStage = {
      ...mockStage,
      mode: 'single' as const,
    };

    const { result } = renderHook(() => useFantasyGameEngine(mockCallbacks));

    await act(async () => {
      await result.current.initializeGame(singleStage);
    });

    // プログレッションタイミングが設定されていないことを確認
    const timings = useTimeStore.getState().progressionTimings;
    expect(timings).toHaveLength(0);

    // 通常通り入力できることを確認
    act(() => {
      result.current.handleNoteInput(60); // C4
    });

    // 入力が処理されたことを確認（correctNotesが更新される）
    expect(result.current.gameState.activeMonsters[0]?.correctNotes).toContain(0); // C = 0 (mod 12)
  });
});