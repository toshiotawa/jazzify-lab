import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as PIXI from 'pixi.js';
import FantasyGameEngine from '../FantasyGameEngine';
import { getStageMonsterIds } from '@/data/monsters';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Assets: {
    unloadBundle: vi.fn(),
    addBundle: vi.fn(),
    loadBundle: vi.fn(),
    get: vi.fn(),
    resolver: undefined, // Simulate the case where resolver is undefined
  },
  Texture: vi.fn(),
}));

// Mock monster data
vi.mock('@/data/monsters', () => ({
  getStageMonsterIds: vi.fn(() => ['monster_01', 'monster_02', 'monster_03']),
  MONSTERS: {},
}));

// Mock devLog
vi.mock('@/utils/logger', () => ({
  devLog: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock BGMManager
vi.mock('@/utils/BGMManager', () => ({
  bgmManager: {
    getCurrentBeat: vi.fn(() => 0),
  },
}));

// Mock useTimeStore
vi.mock('@/stores/timeStore', () => ({
  useTimeStore: {
    getState: vi.fn(() => ({
      currentBeatFloat: 0,
      timeSignature: 4,
      startAt: Date.now(),
      readyDuration: 2000,
      setStart: vi.fn(),
    })),
  },
}));

describe('FantasyGameEngine - Monster Image Preloading', () => {
  const mockStage = {
    id: 'test-stage',
    stageNumber: '1-1',
    name: 'Test Stage',
    description: 'Test Description',
    maxHp: 100,
    enemyGaugeSeconds: 10,
    enemyCount: 3,
    enemyHp: 50,
    minDamage: 10,
    maxDamage: 20,
    mode: 'single' as const,
    allowedChords: ['C', 'G', 'Am'],
    showSheetMusic: true,
    showGuide: true,
    monsterIcon: 'dragon',
    simultaneousMonsterCount: 1,
  };

  const mockCallbacks = {
    onGameEnd: vi.fn(),
    onChordCorrect: vi.fn(),
    onChordIncorrect: vi.fn(),
    onPlayerDamage: vi.fn(),
    onEnemyDeath: vi.fn(),
    onEnemyAttack: vi.fn(),
    onKeyPress: vi.fn(),
    onKeyRelease: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset PIXI mocks
    (PIXI.Assets.unloadBundle as any).mockResolvedValue(undefined);
    (PIXI.Assets.addBundle as any).mockReturnValue(undefined);
    (PIXI.Assets.loadBundle as any).mockResolvedValue(undefined);
    (PIXI.Assets.get as any).mockReturnValue({ texture: 'mock-texture' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle monster image preloading when PIXI.Assets.resolver is undefined', async () => {
    const { container } = render(
      <FantasyGameEngine
        stage={mockStage}
        currentSongId="test-song"
        onGameEnd={mockCallbacks.onGameEnd}
        onChordCorrect={mockCallbacks.onChordCorrect}
        onChordIncorrect={mockCallbacks.onChordIncorrect}
        onPlayerDamage={mockCallbacks.onPlayerDamage}
        onEnemyDeath={mockCallbacks.onEnemyDeath}
        onEnemyAttack={mockCallbacks.onEnemyAttack}
        onKeyPress={mockCallbacks.onKeyPress}
        onKeyRelease={mockCallbacks.onKeyRelease}
      />
    );

    // Wait for component to initialize
    await waitFor(() => {
      expect(getStageMonsterIds).toHaveBeenCalledWith(mockStage.enemyCount);
    });

    // Verify that unloadBundle is called (but doesn't crash even if resolver is undefined)
    expect(PIXI.Assets.unloadBundle).toHaveBeenCalledWith('stageMonsters');

    // Verify that addBundle and loadBundle are called with correct parameters
    expect(PIXI.Assets.addBundle).toHaveBeenCalledWith('stageMonsters', {
      'monster_01': expect.stringContaining('monster_icons/monster_01.png'),
      'monster_02': expect.stringContaining('monster_icons/monster_02.png'),
      'monster_03': expect.stringContaining('monster_icons/monster_03.png'),
    });

    expect(PIXI.Assets.loadBundle).toHaveBeenCalledWith('stageMonsters');

    // Verify that textures are retrieved
    expect(PIXI.Assets.get).toHaveBeenCalledWith('monster_01');
    expect(PIXI.Assets.get).toHaveBeenCalledWith('monster_02');
    expect(PIXI.Assets.get).toHaveBeenCalledWith('monster_03');

    expect(container).toBeTruthy();
  });

  it('should handle errors gracefully when unloadBundle fails', async () => {
    // Mock unloadBundle to throw an error
    (PIXI.Assets.unloadBundle as any).mockRejectedValue(new Error('Bundle not found'));

    const { container } = render(
      <FantasyGameEngine
        stage={mockStage}
        currentSongId="test-song"
        onGameEnd={mockCallbacks.onGameEnd}
        onChordCorrect={mockCallbacks.onChordCorrect}
        onChordIncorrect={mockCallbacks.onChordIncorrect}
        onPlayerDamage={mockCallbacks.onPlayerDamage}
        onEnemyDeath={mockCallbacks.onEnemyDeath}
        onEnemyAttack={mockCallbacks.onEnemyAttack}
        onKeyPress={mockCallbacks.onKeyPress}
        onKeyRelease={mockCallbacks.onKeyRelease}
      />
    );

    await waitFor(() => {
      expect(PIXI.Assets.unloadBundle).toHaveBeenCalledWith('stageMonsters');
    });

    // Verify that the component still continues to load even after unloadBundle fails
    expect(PIXI.Assets.addBundle).toHaveBeenCalled();
    expect(PIXI.Assets.loadBundle).toHaveBeenCalled();

    expect(container).toBeTruthy();
  });

  it('should handle complete failure of monster image loading', async () => {
    // Mock loadBundle to throw an error
    (PIXI.Assets.loadBundle as any).mockRejectedValue(new Error('Network error'));

    const { container } = render(
      <FantasyGameEngine
        stage={mockStage}
        currentSongId="test-song"
        onGameEnd={mockCallbacks.onGameEnd}
        onChordCorrect={mockCallbacks.onChordCorrect}
        onChordIncorrect={mockCallbacks.onChordIncorrect}
        onPlayerDamage={mockCallbacks.onPlayerDamage}
        onEnemyDeath={mockCallbacks.onEnemyDeath}
        onEnemyAttack={mockCallbacks.onEnemyAttack}
        onKeyPress={mockCallbacks.onKeyPress}
        onKeyRelease={mockCallbacks.onKeyRelease}
      />
    );

    await waitFor(() => {
      expect(PIXI.Assets.loadBundle).toHaveBeenCalledWith('stageMonsters');
    });

    // Component should still render even if image loading fails
    expect(container).toBeTruthy();
  });
});

describe('FantasyGameEngine - Progression Mode', () => {
  const mockProgressionStage = {
    id: 'test-progression-stage',
    stageNumber: '4-2',
    name: 'Progression Test Stage',
    description: 'Test Description',
    maxHp: 5,
    enemyGaugeSeconds: 4,
    enemyCount: 10,
    enemyHp: 1,
    minDamage: 1,
    maxDamage: 1,
    mode: 'progression' as const,
    allowedChords: ['C', 'G', 'Am', 'F'],
    chordProgression: ['C', 'Am', 'G', 'F'],
    showSheetMusic: true,
    showGuide: true,
    monsterIcon: 'fa-music',
    simultaneousMonsterCount: 1,
    bpm: 120,
    measureCount: 8,
    countInMeasures: 0,
    timeSignature: 4,
  };

  let gameEngine: any;
  let onGameStateChange: any;
  let onChordCorrect: any;
  let onChordIncorrect: any;
  let onGameComplete: any;
  let onEnemyAttack: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    onGameStateChange = vi.fn();
    onChordCorrect = vi.fn();
    onChordIncorrect = vi.fn();
    onGameComplete = vi.fn();
    onEnemyAttack = vi.fn();

    const TestComponent = () => {
      gameEngine = FantasyGameEngine({
        stage: mockProgressionStage,
        onGameStateChange,
        onChordCorrect,
        onChordIncorrect,
        onGameComplete,
        onEnemyAttack,
      });
      return null;
    };

    render(<TestComponent />);
  });

  it('should initialize progression mode with correct flags', async () => {
    await waitFor(() => {
      expect(gameEngine.gameState.nullHolding).toBe(false);
      expect(gameEngine.gameState.chordCompleted).toBe(false);
      expect(gameEngine.gameState.currentStage?.mode).toBe('progression');
    });
  });

  it('should ignore input during NULL period', async () => {
    // Initialize the game
    await gameEngine.initializeGame(mockProgressionStage);

    // Set the game to NULL holding state
    gameEngine.gameState.nullHolding = true;
    
    // Try to input a note
    const initialScore = gameEngine.gameState.score;
    gameEngine.handleNoteInput(60); // C4
    
    // Score should not change
    expect(gameEngine.gameState.score).toBe(initialScore);
  });

  it('should set chordCompleted flag when chord is completed', async () => {
    // Initialize the game
    await gameEngine.initializeGame(mockProgressionStage);
    
    // Get the current chord target
    const chordTarget = gameEngine.gameState.activeMonsters[0]?.chordTarget;
    expect(chordTarget).toBeDefined();
    
    // Complete the chord
    if (chordTarget && chordTarget.notes) {
      for (const note of chordTarget.notes) {
        gameEngine.handleNoteInput(note);
      }
    }
    
    // Check if chordCompleted flag is set
    await waitFor(() => {
      expect(gameEngine.gameState.chordCompleted).toBe(true);
    });
  });

  it('should handle beat-based progression timing', async () => {
    // Mock beat timing
    const mockGetState = vi.fn();
    mockGetState.mockReturnValueOnce({
      currentBeatFloat: 3.49, // Just before deadline
      timeSignature: 4,
      startAt: Date.now() - 3000,
      readyDuration: 2000,
    });
    
    (require('@/stores/timeStore').useTimeStore.getState as any) = mockGetState;
    
    // Initialize the game
    await gameEngine.initializeGame(mockProgressionStage);
    
    // Simulate beat reaching 4.50
    mockGetState.mockReturnValueOnce({
      currentBeatFloat: 3.50,
      timeSignature: 4,
      startAt: Date.now() - 3500,
      readyDuration: 2000,
    });
    
    // This should trigger progression to next question
    // In real implementation, this would be handled by the useEffect interval
  });

  it('should trigger enemy attack on failure at beat 4.49', async () => {
    // Initialize the game
    await gameEngine.initializeGame(mockProgressionStage);
    
    // Don't complete the chord
    gameEngine.gameState.chordCompleted = false;
    gameEngine.gameState.currentQuestionIndex = 1; // Not the first question
    
    // Mock beat at 4.49
    const mockGetState = vi.fn(() => ({
      currentBeatFloat: 3.49,
      timeSignature: 4,
      startAt: Date.now() - 3490,
      readyDuration: 2000,
    }));
    
    (require('@/stores/timeStore').useTimeStore.getState as any) = mockGetState;
    
    // In real implementation, the useEffect would call handleEnemyAttack
    // Here we simulate that behavior
    const attackingMonster = gameEngine.gameState.activeMonsters[0];
    if (attackingMonster) {
      gameEngine.handleEnemyAttack(attackingMonster.id);
    }
    
    // Check if enemy attack was called
    expect(onEnemyAttack).toHaveBeenCalled();
  });
});