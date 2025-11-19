import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FantasyGameEngine from '../FantasyGameEngine';
import { getStageMonsterIds } from '@/data/monsters';

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

  class MockImage {
    static shouldFail = false;
    static created = 0;
    onload: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    crossOrigin: string | null = null;

    set src(_value: string) {
      MockImage.created += 1;
      setTimeout(() => {
        if (MockImage.shouldFail) {
          this.onerror?.(new Event('error'));
        } else {
          this.onload?.(new Event('load'));
        }
      }, 0);
    }
  }

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

    let originalImage: typeof Image;

    beforeEach(() => {
      vi.clearAllMocks();
      MockImage.shouldFail = false;
      MockImage.created = 0;
      originalImage = global.Image;
      // @ts-expect-error - override global Image for tests
      global.Image = MockImage as unknown as typeof Image;
  });

  afterEach(() => {
    vi.clearAllMocks();
      global.Image = originalImage;
  });

    it('should preload monster images successfully', async () => {
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

      await waitFor(() => {
        expect(MockImage.created).toBeGreaterThan(0);
      });
    expect(container).toBeTruthy();
  });

    it('should handle errors gracefully when image loading fails', async () => {
      MockImage.shouldFail = true;
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