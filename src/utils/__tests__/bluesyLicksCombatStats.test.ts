import { computeBluesyLicksCombatStats } from '@/utils/bluesyLicksCombatStats';

describe('computeBluesyLicksCombatStats', () => {
  it('100% 1 ループ撃破を目安に enemy_hp をターゲット数から算出する', () => {
    const stats = computeBluesyLicksCombatStats(40);
    expect(stats.per_correct_note_damage).toBeGreaterThan(0);
    expect(stats.enemy_hp).toBe(
      40 * stats.per_correct_note_damage + stats.perfect_completion_damage,
    );
    expect(stats.miss_damage).toBe(3);
    expect(stats.fail_damage).toBe(10);
  });

  it('ターゲット数 1 でも minimum values を返す', () => {
    const stats = computeBluesyLicksCombatStats(1);
    expect(stats.enemy_hp).toBeGreaterThan(0);
    expect(stats.per_correct_note_damage).toBeGreaterThanOrEqual(1);
  });
});
