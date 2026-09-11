import { getDefenseEnemyCenterY } from '@/game/defense/defenseEnemyConfig';
import {
  createDefenseRuntime,
  DEFENSE_NO_IMPACT,
  DEFENSE_NO_SLASH,
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';
import {
  performDefenseSlash,
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

  it('slash instantly damages far enemy and applies knockback', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_SPAWN_X;
    enemy.y = getDefenseEnemyCenterY('goblin');
    enemy.hp = 2;
    runtime.activeEnemyCount = 1;

    const slashed = performDefenseSlash(runtime, 0.5);
    expect(slashed).toBe(true);
    expect(enemy.hp).toBe(1);
    expect(enemy.knockbackVx).toBe(180);
    expect(runtime.slashAt).toBe(0);
    expect(runtime.guardPoseUntilSec).toBeCloseTo(0.5);
    expect(runtime.slashToX).toBeCloseTo(DEFENSE_SPAWN_X);
    expect(runtime.slashY).toBeCloseTo(getDefenseEnemyCenterY('goblin'));
  });

  it('slash hits frontmost enemy by min x, not euclidean nearest', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const front = runtime.enemies[0];
    const back = runtime.enemies[1];
    if (!front || !back) throw new Error('missing enemy slots');

    front.active = true;
    front.type = 'goblin';
    front.x = DEFENSE_PLAYER_X + 80;
    front.y = getDefenseEnemyCenterY('goblin');
    front.hp = 2;

    back.active = true;
    back.type = 'bat';
    back.x = DEFENSE_PLAYER_X + 200;
    back.y = getDefenseEnemyCenterY('bat');
    back.hp = 2;

    runtime.activeEnemyCount = 2;

    performDefenseSlash(runtime);

    expect(front.hp).toBe(1);
    expect(back.hp).toBe(2);
    expect(runtime.slashToX).toBeCloseTo(front.x);
  });

  it('slash defeats enemy with 1 hp immediately', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.x = DEFENSE_PLAYER_X + 100;
    enemy.y = getDefenseEnemyCenterY('goblin');
    enemy.hp = 1;
    runtime.activeEnemyCount = 1;

    performDefenseSlash(runtime);

    expect(enemy.active).toBe(false);
    expect(runtime.enemiesDefeated).toBe(1);
    expect(runtime.activeEnemyCount).toBe(0);
  });

  it('returns false when no enemies and leaves slashAt unchanged', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const slashed = performDefenseSlash(runtime);
    expect(slashed).toBe(false);
    expect(runtime.slashAt).toBe(DEFENSE_NO_SLASH);
  });

  it('slash cancels pending enemy attack before peak', () => {
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

    performDefenseSlash(runtime);
    expect(enemy.attackHitPending).toBe(false);

    updateDefenseEnemies(runtime, easyDifficulty, 0.1);
    expect(runtime.playerHp).toBe(5);
    expect(runtime.impactAt).toBe(DEFENSE_NO_IMPACT);
  });

  it('clear after survive seconds', () => {
    const runtime = createDefenseRuntime(5, 2, 3);
    tickDefenseSimulation(runtime, easyDifficulty, 2.1);
    expect(runtime.result).toBe('clear');
  });
});
