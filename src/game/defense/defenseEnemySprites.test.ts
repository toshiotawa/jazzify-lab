import { afterEach, describe, expect, it } from 'vitest';
import {
  clearDefenseEnemySpriteCacheForTests,
  getCachedDefenseEnemySprites,
  loadDefenseEnemySprites,
} from './defenseEnemySprites';
import { clearBattleImageCacheForTests } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';

describe('defense enemy sprite loading', () => {
  const originalImage = global.Image;
  afterEach(() => {
    global.Image = originalImage;
    clearDefenseEnemySpriteCacheForTests();
    clearBattleImageCacheForTests();
  });

  it('retains healthy enemies and a usable frame, then repairs missing frames on the next load', async () => {
    let failMove = true;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      removeAttribute(): void { this.src = ''; }
      constructor() {
        queueMicrotask(() => {
          if (failMove && this.src.split('?')[0].endsWith('goblin_move.webp')) this.onerror?.();
          else this.onload?.();
        });
      }
    }
    global.Image = MockImage as unknown as typeof Image;
    const sizes: number[] = [];
    const atlas = await loadDefenseEnemySprites((partial) => sizes.push(partial.size));
    expect(sizes[0]).toBe(1);
    expect(atlas?.get('bat')).toBeDefined();
    expect(atlas?.get('goblin')?.move).toBe(atlas?.get('goblin')?.idle);
    expect(getCachedDefenseEnemySprites()?.get('bat')).toBeDefined();
    failMove = false;
    const repaired = await loadDefenseEnemySprites();
    expect(repaired?.get('goblin')?.move).not.toBe(repaired?.get('goblin')?.idle);
    expect(getCachedDefenseEnemySprites()).toBe(repaired);
  });
});
