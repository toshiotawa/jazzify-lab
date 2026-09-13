import {
  DEFENSE_WAVE_ROSTERS,
  getDefenseEnemyCenterY,
  resolveDefenseEnemyStats,
} from '@/game/defense/defenseEnemyConfig';
import {
  chargeDefenseSp,
  KNOCKBACK_IMPULSE,
  performDefenseSlash,
  spawnEnemyIfDue,
  tickDefenseSimulation,
  updateDefenseEnemies,
  updateDefenseFireballs,
} from '@/game/defense/defenseEngine';
import {
  createDefenseRuntime,
  DEFENSE_NO_IMPACT,
  DEFENSE_NO_SLASH,
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';
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

const applyGoblinStats = (
  enemy: NonNullable<ReturnType<typeof createDefenseRuntime>['enemies'][number]>,
): void => {
  const resolved = resolveDefenseEnemyStats('goblin', easyDifficulty);
  enemy.speedPxPerSec = resolved.speedPxPerSec;
  enemy.damage = resolved.damage;
  enemy.attackIntervalSec = resolved.attackIntervalSec;
  enemy.attackRangePx = resolved.attackRangePx;
  enemy.knockbackMult = resolved.knockbackMult;
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

  it('spawns wave roster enemies in performance mode', () => {
    const runtime = createDefenseRuntime(5, 120, 8);
    const wave1 = DEFENSE_WAVE_ROSTERS[0];
    if (!wave1) throw new Error('missing wave roster');

    for (let i = 0; i < wave1.length; i += 1) {
      spawnEnemyIfDue(runtime, easyDifficulty, 0.6);
      expect(runtime.enemies[i]?.type).toBe(wave1[i]);
    }
    expect(runtime.waveIndex).toBe(0);
  });

  it('practice mode cycles all enemy types without wave changes', () => {
    const runtime = createDefenseRuntime(5, 120, 12, true);
    for (let i = 0; i < 3; i += 1) {
      spawnEnemyIfDue(runtime, easyDifficulty, 0.6);
    }
    expect(runtime.enemies[0]?.type).toBe('slime');
    expect(runtime.enemies[1]?.type).toBe('bat');
    expect(runtime.enemies[2]?.type).toBe('goblin');
    expect(runtime.waveIndex).toBe(0);
    expect(runtime.waveSpawnCount).toBe(0);
  });

  it('practice mode stays playing after survive seconds', () => {
    const runtime = createDefenseRuntime(5, 2, 3, true);
    tickDefenseSimulation(runtime, easyDifficulty, 2.1);
    expect(runtime.result).toBe('playing');
    expect(runtime.elapsedSec).toBeGreaterThanOrEqual(2);
  });

  it('moves enemy on x axis only toward player', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_PLAYER_X + 120;
    enemy.y = getDefenseEnemyCenterY('goblin');
    applyGoblinStats(enemy);
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, 0.1);
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
    applyGoblinStats(enemy);
    enemy.lastAttackAt = 1.0;
    enemy.attackHitPending = true;
    runtime.elapsedSec = 1.19;
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, 0);
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
    applyGoblinStats(enemy);
    enemy.lastAttackAt = 1.0;
    enemy.attackHitPending = true;
    runtime.elapsedSec = 1.1;
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, 0);
    expect(runtime.playerHp).toBe(5);
    expect(runtime.impactAt).toBe(DEFENSE_NO_IMPACT);
  });

  it('slash instantly damages far enemy and applies knockback with type multiplier', () => {
    const runtime = createDefenseRuntime(5, 120, 3);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_SPAWN_X;
    enemy.y = getDefenseEnemyCenterY('goblin');
    enemy.hp = 2;
    applyGoblinStats(enemy);
    runtime.activeEnemyCount = 1;

    const slashed = performDefenseSlash(runtime, 0.5);
    expect(slashed).toBe(true);
    expect(enemy.hp).toBe(1);
    expect(enemy.knockbackVx).toBeCloseTo(KNOCKBACK_IMPULSE);
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
    applyGoblinStats(front);

    back.active = true;
    back.type = 'bat';
    back.x = DEFENSE_PLAYER_X + 200;
    back.y = getDefenseEnemyCenterY('bat');
    back.hp = 2;
    const batStats = resolveDefenseEnemyStats('bat', easyDifficulty);
    back.speedPxPerSec = batStats.speedPxPerSec;
    back.damage = batStats.damage;
    back.attackIntervalSec = batStats.attackIntervalSec;
    back.attackRangePx = batStats.attackRangePx;
    back.knockbackMult = batStats.knockbackMult;

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
    enemy.type = 'goblin';
    enemy.x = DEFENSE_PLAYER_X + 100;
    enemy.y = getDefenseEnemyCenterY('goblin');
    enemy.hp = 1;
    applyGoblinStats(enemy);
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
    enemy.type = 'goblin';
    enemy.x = DEFENSE_PLAYER_X + 40;
    enemy.y = getDefenseEnemyCenterY('goblin');
    applyGoblinStats(enemy);
    enemy.lastAttackAt = 1.0;
    enemy.attackHitPending = true;
    runtime.elapsedSec = 1.1;
    runtime.activeEnemyCount = 1;

    performDefenseSlash(runtime);
    expect(enemy.attackHitPending).toBe(false);

    updateDefenseEnemies(runtime, 0.1);
    expect(runtime.playerHp).toBe(5);
    expect(runtime.impactAt).toBe(DEFENSE_NO_IMPACT);
  });

  it('clear after survive seconds', () => {
    const runtime = createDefenseRuntime(5, 2, 3);
    tickDefenseSimulation(runtime, easyDifficulty, 2.1);
    expect(runtime.result).toBe('clear');
  });

  it('practice mode records impact without reducing player hp', () => {
    const runtime = createDefenseRuntime(5, 120, 3, true);
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_PLAYER_X + 40;
    enemy.y = getDefenseEnemyCenterY('goblin');
    applyGoblinStats(enemy);
    enemy.lastAttackAt = 1.0;
    enemy.attackHitPending = true;
    runtime.elapsedSec = 1.19;
    runtime.activeEnemyCount = 1;

    updateDefenseEnemies(runtime, 0);
    expect(runtime.playerHp).toBe(5);
    expect(runtime.impactAt).toBeCloseTo(1.19);
    expect(enemy.attackHitPending).toBe(false);
  });

  it('advances wave index and spawns immediately on wave change', () => {
    const runtime = createDefenseRuntime(5, 120, 8);
    runtime.elapsedSec = 30;
    runtime.spawnTimerSec = 0;
    spawnEnemyIfDue(runtime, easyDifficulty, 0);
    expect(runtime.waveIndex).toBe(1);
    expect(runtime.waveSpawnCount).toBe(1);
    expect(runtime.activeEnemyCount).toBe(1);
  });

  it('knockback distance is frame-rate independent', () => {
    const simulateKnockback = (steps: number, totalSec: number): number => {
      const runtime = createDefenseRuntime(5, 120, 3);
      const enemy = runtime.enemies[0];
      if (!enemy) throw new Error('missing enemy slot');
      enemy.active = true;
      enemy.type = 'goblin';
      enemy.x = DEFENSE_PLAYER_X + 200;
      applyGoblinStats(enemy);
      enemy.speedPxPerSec = 0;
      enemy.knockbackVx = KNOCKBACK_IMPULSE;
      runtime.activeEnemyCount = 1;

      const dt = totalSec / steps;
      for (let i = 0; i < steps; i += 1) {
        updateDefenseEnemies(runtime, dt);
      }
      return enemy.x - (DEFENSE_PLAYER_X + 200);
    };

    const moved60Fps = simulateKnockback(60, 1);
    const moved120Fps = simulateKnockback(120, 1);

    expect(Math.abs(moved60Fps - moved120Fps)).toBeLessThan(2);
    expect(moved60Fps).toBeGreaterThan(80);
  });

  it('phrase mode wave 2 deals 2 slash damage in performance mode', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    runtime.waveIndex = 1;
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_SPAWN_X;
    enemy.hp = 3;
    applyGoblinStats(enemy);
    runtime.activeEnemyCount = 1;

    performDefenseSlash(runtime);
    expect(enemy.hp).toBe(1);
  });

  it('measure mode always deals 1 slash damage regardless of wave', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'measure');
    runtime.waveIndex = 2;
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_SPAWN_X;
    enemy.hp = 3;
    applyGoblinStats(enemy);
    runtime.activeEnemyCount = 1;

    performDefenseSlash(runtime);
    expect(enemy.hp).toBe(2);
  });

  it('records hit flash and damage popup on phrase slash', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    const enemy = runtime.enemies[0];
    if (!enemy) throw new Error('missing enemy slot');
    enemy.active = true;
    enemy.type = 'goblin';
    enemy.x = DEFENSE_SPAWN_X;
    enemy.hp = 2;
    applyGoblinStats(enemy);
    runtime.activeEnemyCount = 1;

    performDefenseSlash(runtime);
    expect(enemy.hitFlashAt).toBe(0);
    expect(runtime.damagePopups.some((p) => p.active && p.value === 1)).toBe(true);
  });

  it('charges SP and spawns fireball after 5 measure completions', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    for (let i = 0; i < 4; i += 1) {
      expect(chargeDefenseSp(runtime)).toBe(false);
      expect(runtime.spGauge).toBe(i + 1);
    }
    expect(chargeDefenseSp(runtime)).toBe(true);
    expect(runtime.spGauge).toBe(0);
    expect(runtime.fireballs.some((fb) => fb.active)).toBe(true);
  });

  it('fireball pierces multiple enemies once each', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    const front = runtime.enemies[0];
    const back = runtime.enemies[1];
    if (!front || !back) throw new Error('missing enemy slots');

    front.active = true;
    front.type = 'goblin';
    front.x = DEFENSE_PLAYER_X + 100;
    front.hp = 10;
    applyGoblinStats(front);

    back.active = true;
    back.type = 'goblin';
    back.x = DEFENSE_PLAYER_X + 200;
    back.hp = 10;
    applyGoblinStats(back);

    runtime.activeEnemyCount = 2;
    chargeDefenseSp(runtime);
    chargeDefenseSp(runtime);
    chargeDefenseSp(runtime);
    chargeDefenseSp(runtime);
    chargeDefenseSp(runtime);

    const fb = runtime.fireballs.find((f) => f.active);
    if (!fb) throw new Error('missing fireball');
    fb.x = DEFENSE_PLAYER_X + 100;

    updateDefenseFireballs(runtime, 0);
    expect(front.hp).toBe(7);
    expect(back.hp).toBe(10);

    fb.x = DEFENSE_PLAYER_X + 200;
    updateDefenseFireballs(runtime, 0);
    expect(back.hp).toBe(7);
  });

});
