import {
  DEFENSE_ATTACK_LUNGE_SEC,
  DEFENSE_GROUND_Y,
  getDefenseEnemyAttackDx,
  getDefenseEnemyAttackDy,
  getDefenseEnemyCenterY,
  isDefenseEnemyAttacking,
  pickDefenseEnemyFrame,
} from '@/game/defense/defenseEnemyConfig';

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
});
