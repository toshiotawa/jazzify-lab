import {
  applyPlayerProjectileToBoss,
  createBossBattleState,
} from './SurvivalBossEngine';
import type { BossBattleState } from './SurvivalBossTypes';

const makeOngoingBossState = (): BossBattleState => {
  const state = createBossBattleState('A', 0);
  state.boss.x = 100;
  state.boss.y = 100;
  return state;
};

describe('applyPlayerProjectileToBoss attackInstanceId', () => {
  it('allows only one boss hit per attackInstanceId', () => {
    const state = makeOngoingBossState();
    const attackId = 'atk_test_1';

    const first = applyPlayerProjectileToBoss(state, 100, 100, 50, undefined, attackId);
    const second = applyPlayerProjectileToBoss(state, 100, 100, 50, undefined, attackId);

    expect(first.hitBoss).toBe(true);
    expect(second.hitBoss).toBe(false);
    expect(state.boss.hp).toBe(state.boss.maxHp - 50);
  });

  it('allows separate hits for different attackInstanceIds', () => {
    const state = makeOngoingBossState();

    const first = applyPlayerProjectileToBoss(state, 100, 100, 40, undefined, 'atk_a');
    const second = applyPlayerProjectileToBoss(state, 100, 100, 30, undefined, 'atk_b');

    expect(first.hitBoss).toBe(true);
    expect(second.hitBoss).toBe(true);
    expect(state.boss.hp).toBe(state.boss.maxHp - 70);
  });
});

describe('resolveBossMaxHp via createBossBattleState', () => {
  it('uses custom maxHp when provided', () => {
    const state = createBossBattleState('A', 0, { maxHp: 75000 });
    expect(state.boss.maxHp).toBe(75000);
    expect(state.boss.hp).toBe(75000);
  });
});
