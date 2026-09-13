import {
  DEFENSE_ATTACK_LUNGE_SEC,
  DEFENSE_GROUND_Y,
  DEFENSE_WAVE_COUNT,
  DEFENSE_WAVE_CUMULATIVE_ROSTERS,
  getDefenseEnemyAttackDx,
  getDefenseEnemyAttackDy,
  getDefenseEnemyCenterY,
  DEFENSE_DAMAGE_UNIT,
  getDefenseSlashDamage,
  getDefenseWaveHpMult,
  getDefenseWaveIndex,
  getDefenseWaveSpawnIntervalMult,
  isDefenseEnemyAttacking,
  pickDefenseEnemyFrame,
  pickDefenseWaveEnemyType,
  resolveDefenseEnemyStats,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseDifficulty } from '@/game/defense/defenseTypes';

describe('defenseEnemyConfig', () => {
  it('grounds non-flying enemies on shared ground line', () => {
    expect(getDefenseEnemyCenterY('goblin')).toBe(DEFENSE_GROUND_Y - 28);
    expect(getDefenseEnemyCenterY('dragon')).toBe(DEFENSE_GROUND_Y - 48);
    expect(getDefenseEnemyCenterY('bat')).toBe(DEFENSE_GROUND_Y - 90);
  });

  it('returns zero attack offset outside lunge window', () => {
    expect(getDefenseEnemyAttackDx(0)).toBe(0);
    expect(getDefenseEnemyAttackDy(0, false)).toBe(0);
    expect(getDefenseEnemyAttackDx(DEFENSE_ATTACK_LUNGE_SEC + 0.1)).toBe(0);
    expect(getDefenseEnemyAttackDy(DEFENSE_ATTACK_LUNGE_SEC + 0.1, false)).toBe(0);
  });

  it('lunges toward player (left) and rises during the first half', () => {
    const quarter = DEFENSE_ATTACK_LUNGE_SEC * 0.25;
    const mid = DEFENSE_ATTACK_LUNGE_SEC * 0.5;
    expect(getDefenseEnemyAttackDx(mid)).toBeCloseTo(-22);
    expect(getDefenseEnemyAttackDy(quarter, false)).toBeCloseTo(-14);
    expect(getDefenseEnemyAttackDy(quarter, true)).toBeCloseTo(-7);
    expect(getDefenseEnemyAttackDy(mid, false)).toBeCloseTo(0);
  });

  it('is attacking while hit pending or within lunge window', () => {
    expect(isDefenseEnemyAttacking(true, 5, 4.9)).toBe(true);
    expect(isDefenseEnemyAttacking(false, 5, 4.9)).toBe(true);
    expect(isDefenseEnemyAttacking(false, 5, 4)).toBe(false);
    expect(isDefenseEnemyAttacking(false, 0.1, 0)).toBe(false);
  });

  it('uses move frame while attacking', () => {
    expect(pickDefenseEnemyFrame(1, 0, false, false, true)).toBe('move');
  });

  it('alternates frames while moving and stays idle when stopped on ground', () => {
    expect(pickDefenseEnemyFrame(0, 0, true, false, false)).toBe('idle');
    expect(pickDefenseEnemyFrame(0.25, 0, true, false, false)).toBe('move');
    expect(pickDefenseEnemyFrame(0.25, 0, false, false, false)).toBe('idle');
    expect(pickDefenseEnemyFrame(0.25, 0, false, true, false)).toBe('move');
  });

  it('resolves enemy stats with hp floor of 1', () => {
    const difficulty: DefenseDifficulty = {
      level: 1,
      enemyHp: 1,
      spawnIntervalSec: 2,
      maxEnemies: 3,
      enemySpeedPxPerSec: 40,
      enemyDamage: 1,
      attackIntervalSec: 3,
      attackRangePx: 48,
    };
    expect(resolveDefenseEnemyStats('bat', difficulty).hp).toBe(50);
    expect(resolveDefenseEnemyStats('golem', difficulty).hp).toBe(100);
    expect(resolveDefenseEnemyStats('dragon', difficulty).damage).toBe(2);
  });

  it('computes wave index from elapsed time', () => {
    expect(getDefenseWaveIndex(0, 120)).toBe(0);
    expect(getDefenseWaveIndex(29.9, 120)).toBe(0);
    expect(getDefenseWaveIndex(30, 120)).toBe(1);
    expect(getDefenseWaveIndex(119, 120)).toBe(3);
    expect(getDefenseWaveIndex(200, 120)).toBe(DEFENSE_WAVE_COUNT - 1);
  });

  it('picks wave roster enemy types cyclically', () => {
    expect(pickDefenseWaveEnemyType(0, 0)).toBe('slime');
    expect(pickDefenseWaveEnemyType(0, 1)).toBe('bat');
    expect(pickDefenseWaveEnemyType(3, 2)).toBe('dragon');
  });

  it('picks cumulative roster including prior waves', () => {
    const wave1Cumulative = DEFENSE_WAVE_CUMULATIVE_ROSTERS[1];
    expect(wave1Cumulative?.[0]).toBe('slime');
    expect(pickDefenseWaveEnemyType(1, 0, true)).toBe('slime');
    expect(pickDefenseWaveEnemyType(1, 4, true)).toBe('goblin');
  });

  it('applies hp multiplier to resolved stats', () => {
    const difficulty: DefenseDifficulty = {
      level: 1,
      enemyHp: 2,
      spawnIntervalSec: 2,
      maxEnemies: 3,
      enemySpeedPxPerSec: 40,
      enemyDamage: 1,
      attackIntervalSec: 3,
      attackRangePx: 48,
    };
    expect(resolveDefenseEnemyStats('slime', difficulty, 1.5).hp).toBe(150);
  });

  it('returns wave-scaled slash damage when scaling enabled', () => {
    expect(getDefenseSlashDamage(0, true)).toBe(DEFENSE_DAMAGE_UNIT);
    expect(getDefenseSlashDamage(2, true)).toBe(3 * DEFENSE_DAMAGE_UNIT);
    expect(getDefenseSlashDamage(2, false)).toBe(DEFENSE_DAMAGE_UNIT);
  });

  it('returns wave hp and spawn interval multipliers', () => {
    expect(getDefenseWaveHpMult(0)).toBe(1);
    expect(getDefenseWaveHpMult(3)).toBe(2.0);
    expect(getDefenseWaveSpawnIntervalMult(1)).toBe(0.75);
    expect(getDefenseWaveSpawnIntervalMult(3)).toBe(0.4);
  });
});
