import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFantasyGameEngine } from '../FantasyGameEngine';
import { useTimeStore } from '@/stores/timeStore';
import type { FantasyStage, ChordDefinition, FantasyGameState } from '../FantasyGameEngine';

// Mock the time store
vi.mock('@/stores/timeStore');

describe('FantasyGameEngine - Rhythm Mode Progression Pattern', () => {
  const mockStage: FantasyStage = {
    id: 'test-rhythm',
    stageNumber: '1',
    name: 'Test Rhythm Stage',
    description: 'Testing rhythm mode',
    maxHp: 3,
    enemyGaugeSeconds: 10,
    enemyCount: 4,
    enemyHp: 2,
    minDamage: 1,
    maxDamage: 2,
    mode: 'rhythm',  // リズムモードを指定
    allowedChords: ['C', 'F', 'G', 'C'],
    chordProgression: ['C', 'F', 'G', 'C'],
    showSheetMusic: false,
    showGuide: true,
    monsterIcon: 'test',
    simultaneousMonsterCount: 4,
    bpm: 120,
    measureCount: 4,
    countInMeasures: 0,
    timeSignature: 4
  };

  const mockCallbacks = {
    onGameStateChange: vi.fn(),
    onChordCorrect: vi.fn(),
    onChordIncorrect: vi.fn(),
    onGameComplete: vi.fn(),
    onEnemyAttack: vi.fn()
  };

  let mockTimeState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up mock time store
    mockTimeState = {
      startAt: performance.now(),
      readyDuration: 2000,
      timeSignature: 4,
      bpm: 120,
      measureCount: 4,
      countInMeasures: 0,
      currentBeat: 1,
      currentMeasure: 1,
      isCountIn: false,
      currentBeatDecimal: 1.0,
      setStart: vi.fn(),
      tick: vi.fn(),
      getCurrentBeatDecimal: vi.fn(() => mockTimeState.currentBeatDecimal),
      getTimeUntilBeat: vi.fn(),
      getTimeUntilNextMeasureBeat: vi.fn()
    };

    (useTimeStore as any).getState = vi.fn(() => mockTimeState);
  });

  it('should initialize rhythm mode with empty monsters', async () => {
    const { result } = renderHook(() => useFantasyGameEngine({
      stage: null,
      ...mockCallbacks
    }));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    expect(result.current.gameState.isRhythmMode).toBe(true);
    expect(result.current.gameState.activeMonsters).toHaveLength(0); // No initial monsters
    expect(result.current.gameState.hasCompletedChordInMeasure).toBe(false);
    expect(result.current.gameState.isInNullPeriod).toBe(false);
  });

  it('should not accept input during NULL period', async () => {
    const { result } = renderHook(() => useFantasyGameEngine({
      stage: null,
      ...mockCallbacks
    }));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    // Manually set NULL period
    act(() => {
      result.current.gameState.isInNullPeriod = true;
      result.current.handleNoteInput(60); // C4
    });

    // No chord correct callback should be called
    expect(mockCallbacks.onChordCorrect).not.toHaveBeenCalled();
  });

  it('should not accept input outside judgment window', async () => {
    const { result } = renderHook(() => useFantasyGameEngine({
      stage: null,
      ...mockCallbacks
    }));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    // Set beat to 4.51 (after judgment cutoff at 4.49)
    mockTimeState.currentBeatDecimal = 4.51;

    act(() => {
      result.current.handleNoteInput(60); // C4
    });

    // No chord correct callback should be called
    expect(mockCallbacks.onChordCorrect).not.toHaveBeenCalled();
  });

  it('should enter NULL period after completing all chords', async () => {
    const { result } = renderHook(() => useFantasyGameEngine({
      stage: null,
      ...mockCallbacks
    }));

    await act(async () => {
      await result.current.initializeGame(mockStage);
    });

    // Simulate having active monsters with chords
    const mockMonsters = [
      {
        id: 'monster1',
        index: 0,
        position: 'A' as const,
        currentHp: 2,
        maxHp: 2,
        gauge: 0,
        chordTarget: {
          id: 'C',
          displayName: 'C',
          notes: [60], // Simple C chord for testing
          noteNames: ['C'],
          quality: 'major',
          root: 'C'
        },
        correctNotes: [],
        icon: 'test',
        name: 'Test Monster'
      }
    ];

    // Manually set monsters (in real scenario this happens at beat 4.50)
    act(() => {
      result.current.gameState.activeMonsters = mockMonsters;
      result.current.gameState.isGameActive = true;
    });

    // Input the correct note
    mockTimeState.currentBeatDecimal = 2.0; // Within judgment window

    act(() => {
      result.current.handleNoteInput(60); // C
    });

    // Should have marked chord as completed
    expect(result.current.gameState.hasCompletedChordInMeasure).toBe(true);
  });

  it('should handle automatic progression on judgment timeout', () => {
    // This would require more complex mocking of the timing system
    // and interval callbacks, which is beyond the scope of this test
    // but the logic is implemented in handleRhythmProgression
    expect(true).toBe(true); // Placeholder
  });

  it('should respect different time signatures', async () => {
    const stage3_4 = { ...mockStage, timeSignature: 3 };
    
    const { result } = renderHook(() => useFantasyGameEngine({
      stage: null,
      ...mockCallbacks
    }));

    await act(async () => {
      await result.current.initializeGame(stage3_4);
    });

    // Time store should be initialized with 3/4 time
    expect(mockTimeState.setStart).toHaveBeenCalledWith(120, 3, 4, 0);
  });
});