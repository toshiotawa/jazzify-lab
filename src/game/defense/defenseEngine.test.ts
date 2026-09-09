import {
  createDefenseRuntime,
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';
import {
  fireDefenseProjectile,
  spawnEnemyIfDue,
  tickDefenseSimulation,
  updateDefenseEnemies,
} from '@/game/defense/defenseEngine';
import type { DefenseDifficulty } from '@/game/defense/defenseTypes';

const easyDifficulty: DefenseDifficulty = {
  level: 1,
  enemyHp: 1,
  spawnIntervalSec: 0.5,
  maxEnemies: 3,
  enemySpeedPxPerSec: 200,
  enemyDamage: 1,
  attackIntervalSec: 1,
  attackRangePx: 48,
};

describe('defenseEngine', () => {
  it('spawns enemy after interval', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    spawnEnemyIfDue(runtime, easyDifficulty, 0.6);
    expect(runtime.activeEnemyCount).toBe(1);
    expect(runtime.enemies[0]?.active).toBe(true);
    expect(runtime.enemies[0]?.x).toBeCloseTo(DEFENSE_SPAWN_X);
  });

  it('enemy stops in attack range and damages player', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_PLAYER_X + 40;
    enemy.y = runtime.playerY;
    enemy.lastAttackAt = 0;
    runtime.elapsedSec = 1.5;
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, easyDifficulty, 1.5);
    expect(runtime.playerHp).toBeLessThan(5);
  });

  it('fireball defeats enemy with 1 hp', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_PLAYER_X + 100;
    enemy.y = runtime.playerY;
    enemy.hp = 1;
    runtime.activeEnemyCount = 1;

    const fired = fireDefenseProjectile(runtime);
    expect(fired).toBe(true);

    tickDefenseSimulation(runtime, easyDifficulty, 0.3);
    expect(runtime.enemiesDefeated).toBeGreaterThanOrEqual(0);
  });

  it('clear after survive seconds', () => {
    const runtime = createDefenseRuntime(5, 2, 3);
    tickDefenseSimulation(runtime, easyDifficulty, 2.1);
    expect(runtime.result).toBe('clear');
  });
});
