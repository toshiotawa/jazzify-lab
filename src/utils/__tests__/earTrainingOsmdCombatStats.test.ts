import {
  osmdEnemyMaxHpForTargetCount,
  rollOsmdHitDamage,
} from '@/utils/earTrainingOsmdCombatStats';

const HIT_DAMAGE_MIN = 40;
const HIT_DAMAGE_MAX = 60;

describe('earTrainingOsmdCombatStats', () => {
  it('maps target count to enemy max HP (N × 100)', () => {
    expect(osmdEnemyMaxHpForTargetCount(10)).toBe(1000);
    expect(osmdEnemyMaxHpForTargetCount(0)).toBe(0);
    expect(osmdEnemyMaxHpForTargetCount(3.7)).toBe(300);
  });

  it('2 loops × expected average damage equals max HP per target', () => {
    const n = 12;
    const maxHp = osmdEnemyMaxHpForTargetCount(n);
    const perfectLoopDamage = n * 50;
    expect(perfectLoopDamage * 2).toBe(maxHp);
  });

  it('rolls hit damage within 40..60', () => {
    expect(rollOsmdHitDamage(() => 0)).toBe(HIT_DAMAGE_MIN);
    expect(rollOsmdHitDamage(() => 0.999)).toBe(HIT_DAMAGE_MAX);
    for (let i = 0; i < 200; i += 1) {
      const d = rollOsmdHitDamage();
      expect(d).toBeGreaterThanOrEqual(HIT_DAMAGE_MIN);
      expect(d).toBeLessThanOrEqual(HIT_DAMAGE_MAX);
    }
  });
});
