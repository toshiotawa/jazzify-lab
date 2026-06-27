export interface BluesyLicksCombatStats {
  player_hp: number;
  enemy_hp: number;
  per_correct_note_damage: number;
  good_completion_damage: number;
  great_completion_damage: number;
  perfect_completion_damage: number;
  miss_damage: number;
  fail_damage: number;
  perfect_max_misses: number;
  great_max_misses: number;
}

/** OSMD 1 ループ分のターゲット数から HP / ダメージを算出（Bluesy Licks コース用）。 */
export const computeBluesyLicksCombatStats = (targetCount: number): BluesyLicksCombatStats => {
  const safeTargetCount = Math.max(1, targetCount);
  const playerHp = 100;
  const perfectCompletion = Math.max(8, Math.round(100 * 0.35));
  const perCorrect = Math.max(1, Math.round((100 * 0.55) / safeTargetCount));
  const enemyHp = safeTargetCount * perCorrect + perfectCompletion;
  return {
    player_hp: playerHp,
    enemy_hp: enemyHp,
    per_correct_note_damage: perCorrect,
    good_completion_damage: Math.max(1, Math.round(perfectCompletion * 0.35)),
    great_completion_damage: Math.max(1, Math.round(perfectCompletion * 0.6)),
    perfect_completion_damage: perfectCompletion,
    miss_damage: 3,
    fail_damage: 10,
    perfect_max_misses: 0,
    great_max_misses: 2,
  };
};
