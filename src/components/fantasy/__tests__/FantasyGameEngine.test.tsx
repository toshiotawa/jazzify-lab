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
    mode: 'quiz' as const,
    allowedChords: ['C', 'G', 'Am', 'F'],
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