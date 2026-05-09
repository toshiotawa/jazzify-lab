import { describe, expect, it } from 'vitest';
import {
  clampBattleCharacterX,
  getBattleCharacterMinDistance,
  getBattleCharacterMotionRange,
} from './battleCharacterMotion';

describe('battleCharacterMotion', () => {
  it('keeps player and enemy movement ranges on their own side of the stage', () => {
    const player = getBattleCharacterMotionRange('player', 1536);
    const enemy = getBattleCharacterMotionRange('enemy', 1536);

    expect(player.homeX).toBeCloseTo(353.28);
    expect(player.minX).toBeLessThan(player.homeX);
    expect(player.maxX).toBeGreaterThan(player.homeX);
    expect(player.maxX).toBeLessThan(1536 / 2);

    expect(enemy.homeX).toBeCloseTo(1182.72);
    expect(enemy.minX).toBeGreaterThan(1536 / 2);
    expect(enemy.maxX).toBeGreaterThan(enemy.homeX);
  });

  it('uses a responsive minimum distance on narrow stages', () => {
    expect(getBattleCharacterMinDistance(320)).toBe(96);
    expect(getBattleCharacterMinDistance(1536)).toBe(220);
  });

  it('clamps knockback and target positions to the character range', () => {
    const range = getBattleCharacterMotionRange('player', 1536);

    expect(clampBattleCharacterX(range.minX - 100, range)).toBe(range.minX);
    expect(clampBattleCharacterX(range.maxX + 100, range)).toBe(range.maxX);
    expect(clampBattleCharacterX(range.homeX, range)).toBe(range.homeX);
  });
});
