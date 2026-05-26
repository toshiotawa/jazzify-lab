import {
  applyPlayerProjectileToBoss,
  createBossBattleState,
  tickBossBattle,
} from './SurvivalBossEngine';
import type { BossBattleState } from './SurvivalBossTypes';
import type { PlayerState } from '../SurvivalTypes';

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

describe('tickBossBattle chargeActive hazard', () => {
  const makePlayer = (x: number, y: number): PlayerState => ({
    x,
    y,
    direction: 'right',
    stats: {
      aAtk: 10,
      bAtk: 10,
      cAtk: 10,
      speed: 300,
      reloadMagic: 0,
      hp: 100,
      maxHp: 100,
      def: 0,
      time: 0,
      aBulletCount: 1,
      luck: 0,
    },
    skills: {
      aPenetration: false,
      bKnockbackBonus: 0,
      bRangeBonus: 0,
      bDeflect: false,
      multiHitLevel: 0,
      expBonusLevel: 0,
      haisuiNoJin: false,
      zekkouchou: false,
      alwaysHaisuiNoJin: false,
      alwaysZekkouchou: false,
      autoSelect: false,
    },
    magics: {
      thunder: 0,
      ice: 0,
      fire: 0,
      heal: 0,
      buffer: 0,
      hint: 0,
    },
    statusEffects: [],
    level: 1,
    exp: 0,
    expToNextLevel: 100,
  });

  it('damages the player when they stand on the charge line', () => {
    const now = performance.now();
    const state = createBossBattleState('A', now);
    state.boss.x = 100;
    state.boss.y = 100;
    state.hazards.push({
      id: 'hz_charge_test',
      kind: 'chargeActive',
      x: 100,
      y: 100,
      angle: 0,
      length: 520,
      thickness: 70,
      startAt: now - 50,
      endAt: now + 500,
      damage: 110,
      hitOnce: true,
    });

    const player = makePlayer(250, 100);
    tickBossBattle(state, 16, player);

    expect(state.player.hp).toBe(state.player.maxHp - 110);
  });

  it('does not damage the player outside the charge line thickness', () => {
    const now = performance.now();
    const state = createBossBattleState('A', now);
    state.boss.x = 100;
    state.boss.y = 100;
    const hpBefore = state.player.hp;
    state.hazards.push({
      id: 'hz_charge_miss',
      kind: 'chargeActive',
      x: 100,
      y: 100,
      angle: 0,
      length: 520,
      thickness: 70,
      startAt: now - 50,
      endAt: now + 500,
      damage: 110,
      hitOnce: true,
    });

    const player = makePlayer(250, 250);
    tickBossBattle(state, 16, player);

    expect(state.player.hp).toBe(hpBefore);
  });
});
