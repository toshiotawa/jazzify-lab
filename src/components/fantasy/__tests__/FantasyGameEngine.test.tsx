import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FantasyGameEngine from '../FantasyGameEngine';
import { getStageMonsterIds } from '@/data/monsters';

interface MockCallbacks {
  onGameEnd: () => void;
  onChordCorrect: () => void;
  onChordIncorrect: () => void;
  onPlayerDamage: () => void;
  onEnemyDeath: () => void;
  onEnemyAttack: () => void;
  onKeyPress: () => void;
  onKeyRelease: () => void;
}

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
    mode: 'single' as const,
    allowedChords: ['C', 'G', 'Am'],
    showSheetMusic: true,
    showGuide: true,
    monsterIcon: 'dragon',
    simultaneousMonsterCount: 1,
  };

  const mockCallbacks: MockCallbacks = {
    onGameEnd: vi.fn(),
    onChordCorrect: vi.fn(),
    onChordIncorrect: vi.fn(),
    onPlayerDamage: vi.fn(),
    onEnemyDeath: vi.fn(),
    onEnemyAttack: vi.fn(),
    onKeyPress: vi.fn(),
    onKeyRelease: vi.fn(),
  };

  const loadedSources: string[] = [];
  let failAll = false;
  let failSecond = false;

  class MockImage {
    onload: ((event?: unknown) => void) | null = null;
    onerror: ((event?: unknown) => void) | null = null;
    width = 100;
    height = 100;
    decode = vi.fn(async () => undefined);

    set src(value: string) {
      loadedSources.push(value);
      setTimeout(() => {
        const shouldFail = failAll || (failSecond && value.includes('monster_02'));
        if (shouldFail) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      }, 0);
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    loadedSources.length = 0;
    failAll = false;
    failSecond = false;
    vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preloads monster images for the current stage', async () => {
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
      expect(getStageMonsterIds).toHaveBeenCalledWith(mockStage.enemyCount);
    });

    expect(loadedSources.filter(src => src.endsWith('.png') || src.endsWith('.webp')).length).toBeGreaterThan(0);
    expect(container).toBeTruthy();
  });

  it('continues initialization when some images fail to load', async () => {
    failSecond = true;

    render(
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
      expect(loadedSources.length).toBeGreaterThan(0);
    });
  });

  it('does not crash when all images fail to load', async () => {
    failAll = true;

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
      expect(getStageMonsterIds).toHaveBeenCalled();
    });

    expect(container).toBeTruthy();
  });
});
