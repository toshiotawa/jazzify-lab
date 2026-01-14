import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { preloadMonsterImages } from '../FantasyGameEngine';
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
  static sources: string[] = [];
  static failingSources: Set<string> = new Set();
  onload: (() => void) | null = null;
  onerror: ((event?: Event) => void) | null = null;

  set src(value: string) {
    MockImage.sources.push(value);
    setTimeout(() => {
      if (MockImage.failingSources.has(value)) {
        this.onerror?.(new Event('error'));
      } else {
        this.onload?.();
      }
    }, 0);
  }

  static reset(): void {
    MockImage.sources = [];
    MockImage.failingSources.clear();
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

    const OriginalImage = global.Image;

    beforeEach(() => {
      vi.clearAllMocks();
      MockImage.reset();
      // @ts-expect-error override for test
      global.Image = MockImage;
    });

    afterAll(() => {
      global.Image = OriginalImage;
    });

    // 🚀 パフォーマンス最適化: PNG直接読み込み（WebPフォールバック不要）
    it('should preload monster images using PNG directly', async () => {
      const monsterIds = getStageMonsterIds(mockStage.enemyCount);
      await preloadMonsterImages(monsterIds, new Map());

      expect(getStageMonsterIds).toHaveBeenCalledWith(mockStage.enemyCount);
      expect(MockImage.sources.length).toBe(3);
      const expectedPaths = ['monster_01', 'monster_02', 'monster_03'].map(
        (id) => expect.stringContaining(`monster_icons/${id}.png`)
      );
      expect(MockImage.sources).toEqual(expect.arrayContaining(expectedPaths));
    });

    it('should handle PNG load failure', async () => {
      ['monster_01', 'monster_02', 'monster_03'].forEach((id) => {
        MockImage.failingSources.add(`${import.meta.env.BASE_URL}monster_icons/${id}.png`);
      });
      const monsterIds = getStageMonsterIds(mockStage.enemyCount);
      await expect(preloadMonsterImages(monsterIds, new Map())).rejects.toBeTruthy();
      expect(getStageMonsterIds).toHaveBeenCalledWith(mockStage.enemyCount);
    });
});