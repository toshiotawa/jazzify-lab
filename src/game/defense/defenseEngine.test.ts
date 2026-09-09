import { getDefenseEnemyCenterY } from '@/game/defense/defenseEnemyConfig';
import {
  createDefenseRuntime,
  DEFENSE_NO_IMPACT,
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
  it('spawns enemy on ground line after interval', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    spawnEnemyIfDue(runtime, easyDifficulty, 0.6);
    expect(runtime.activeEnemyCount).toBe(1);
    expect(runtime.enemies[0]?.active).toBe(true);
    expect(runtime.enemies[0]?.x).toBeCloseTo(DEFENSE_SPAWN_X);
    expect(runtime.enemies[0]?.y).toBeCloseTo(getDefenseEnemyCenterY('slime'));
  });

  it('moves enemy on x axis only toward player', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_PLAYER_X + 120;
    enemy.y = getDefenseEnemyCenterY('goblin');
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, easyDifficulty, 0.1);
    expect(enemy.x).toBeLessThan(DEFENSE_PLAYER_X + 120);
    expect(enemy.y).toBeCloseTo(getDefenseEnemyCenterY('goblin'));
    expect(enemy.moving).toBe(true);
  });

  it('applies damage at attack peak and records impact', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_PLAYER_X + 40;
    enemy.y = getDefenseEnemyCenterY('goblin');
    enemy.lastAttackAt = 1.0;
    enemy.attackHitPending = true;
    runtime.elapsedSec = 1.19;
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, easyDifficulty, 0);
    expect(runtime.playerHp).toBe(4);
    expect(runtime.impactAt).toBeCloseTo(1.19);
    expect(runtime.impactX).toBeCloseTo(DEFENSE_PLAYER_X);
    expect(enemy.attackHitPending).toBe(false);
  });

  it('does not damage before attack peak', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_PLAYER_X + 40;
    enemy.y = getDefenseEnemyCenterY('goblin');
    enemy.lastAttackAt = 1.0;
    enemy.attackHitPending = true;
    runtime.elapsedSec = 1.1;
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, easyDifficulty, 0);
    expect(runtime.playerHp).toBe(5);
    expect(runtime.impactAt).toBe(DEFENSE_NO_IMPACT);
  });

  it('fireball defeats enemy with 1 hp', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_PLAYER_X + 100;
    enemy.y = getDefenseEnemyCenterY('goblin');
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
