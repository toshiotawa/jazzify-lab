/**
 * Defense mode combat simulation (pure functions, mutable runtime).
 */
import {
  DEFENSE_ATTACK_LUNGE_SEC,
  DEFENSE_ENEMY_TYPES,
  getDefenseEnemyCenterY,
} from '@/game/defense/defenseEnemyConfig';
import type {
  DefenseDifficulty,
  DefenseEnemy,
  DefenseEnemyType,
  DefenseFireball,
  DefenseRuntime,
} from '@/game/defense/defenseTypes';
import {
  DEFENSE_FIREBALL_SPEED,
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';

const KNOCKBACK_DECAY = 0.9;
const FIREBALL_HIT_RADIUS = 28;
const KNOCKBACK_IMPULSE = 180;
const ATTACK_HIT_PHASE = DEFENSE_ATTACK_LUNGE_SEC * 0.5;

const pickEnemyType = (index: number): DefenseEnemyType => (
  DEFENSE_ENEMY_TYPES[index % DEFENSE_ENEMY_TYPES.length] ?? 'slime'
);

const findInactiveEnemySlot = (runtime: DefenseRuntime): DefenseEnemy | null => {
  for (const enemy of runtime.enemies) {
    if (!enemy.active) return enemy;
  }
  return null;
};

const findInactiveFireballSlot = (runtime: DefenseRuntime): DefenseFireball | null => {
  for (const ball of runtime.fireballs) {
    if (!ball.active) return ball;
  }
  return null;
};

const distanceSq = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export const spawnEnemyIfDue = (
  runtime: DefenseRuntime,
  difficulty: DefenseDifficulty,
  dt: number,
): void => {
  if (runtime.result !== 'playing') return;
  if (runtime.activeEnemyCount >= difficulty.maxEnemies) return;

  runtime.spawnTimerSec += dt;
  if (runtime.spawnTimerSec < difficulty.spawnIntervalSec) return;
  runtime.spawnTimerSec = 0;

  const slot = findInactiveEnemySlot(runtime);
  if (!slot) return;

  const enemyType = pickEnemyType(runtime.nextEnemyIndex);
  slot.active = true;
  slot.type = enemyType;
  slot.x = DEFENSE_SPAWN_X;
  slot.y = getDefenseEnemyCenterY(enemyType);
  slot.hp = difficulty.enemyHp;
  slot.maxHp = difficulty.enemyHp;
  slot.knockbackVx = 0;
  slot.lastAttackAt = 0;
  slot.moving = false;
  slot.attackHitPending = false;
  runtime.nextEnemyIndex += 1;
  runtime.activeEnemyCount += 1;
};

export const updateDefenseEnemies = (
  runtime: DefenseRuntime,
  difficulty: DefenseDifficulty,
  dt: number,
): void => {
  if (runtime.result !== 'playing') return;

  for (const enemy of runtime.enemies) {
    if (!enemy.active) continue;

    const absDx = Math.abs(runtime.playerX - enemy.x);
    const inRange = absDx <= difficulty.attackRangePx;
    const attackElapsed = runtime.elapsedSec - enemy.lastAttackAt;

    if (enemy.attackHitPending && attackElapsed >= ATTACK_HIT_PHASE) {
      runtime.playerHp = Math.max(0, runtime.playerHp - difficulty.enemyDamage);
      runtime.impactAt = runtime.elapsedSec;
      runtime.impactX = runtime.playerX;
      runtime.impactY = runtime.playerY;
      enemy.attackHitPending = false;
      if (runtime.playerHp <= 0) {
        runtime.result = 'gameover';
      }
    }

    const isLunging = enemy.attackHitPending
      || (enemy.lastAttackAt > 0 && attackElapsed < DEFENSE_ATTACK_LUNGE_SEC);

    if (!isLunging && !inRange) {
      const speed = difficulty.enemySpeedPxPerSec * dt;
      if (enemy.x > runtime.playerX) {
        enemy.x -= speed;
      } else if (enemy.x < runtime.playerX) {
        enemy.x += speed;
      }
      enemy.moving = true;
    } else if (
      inRange
      && !enemy.attackHitPending
      && !isLunging
      && runtime.elapsedSec - enemy.lastAttackAt >= difficulty.attackIntervalSec
    ) {
      enemy.lastAttackAt = runtime.elapsedSec;
      enemy.attackHitPending = true;
      enemy.moving = false;
    } else {
      enemy.moving = false;
    }

    if (enemy.knockbackVx !== 0) {
      enemy.x += enemy.knockbackVx * dt;
      enemy.knockbackVx *= KNOCKBACK_DECAY;
      if (Math.abs(enemy.knockbackVx) < 0.5) {
        enemy.knockbackVx = 0;
      }
    }
  }
};

const findNearestActiveEnemy = (runtime: DefenseRuntime): DefenseEnemy | null => {
  let nearest: DefenseEnemy | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;
  for (const enemy of runtime.enemies) {
    if (!enemy.active) continue;
    const distSq = distanceSq(runtime.playerX, runtime.playerY, enemy.x, enemy.y);
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = enemy;
    }
  }
  return nearest;
};

export const fireDefenseProjectile = (runtime: DefenseRuntime): boolean => {
  if (runtime.result !== 'playing') return false;
  const target = findNearestActiveEnemy(runtime);
  if (!target) return false;

  const slot = findInactiveFireballSlot(runtime);
  if (!slot) return false;

  const dx = target.x - runtime.playerX;
  const dy = target.y - runtime.playerY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  slot.active = true;
  slot.x = runtime.playerX;
  slot.y = runtime.playerY;
  slot.vx = (dx / dist) * DEFENSE_FIREBALL_SPEED;
  slot.vy = (dy / dist) * DEFENSE_FIREBALL_SPEED;
  slot.targetEnemyId = target.id;
  runtime.activeFireballCount += 1;
  return true;
};

const updateDefenseFireballs = (
  runtime: DefenseRuntime,
  dt: number,
): void => {
  for (const ball of runtime.fireballs) {
    if (!ball.active) continue;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    let hitEnemy: DefenseEnemy | null = null;
    for (const enemy of runtime.enemies) {
      if (!enemy.active) continue;
      if (ball.targetEnemyId && enemy.id !== ball.targetEnemyId) continue;
      const hitRadius = FIREBALL_HIT_RADIUS;
      if (distanceSq(ball.x, ball.y, enemy.x, enemy.y) <= hitRadius * hitRadius) {
        hitEnemy = enemy;
        break;
      }
    }

    if (hitEnemy) {
      hitEnemy.hp -= 1;
      const kbDx = hitEnemy.x - runtime.playerX;
      hitEnemy.knockbackVx = (kbDx >= 0 ? 1 : -1) * KNOCKBACK_IMPULSE;

      if (hitEnemy.hp <= 0) {
        hitEnemy.active = false;
        runtime.activeEnemyCount = Math.max(0, runtime.activeEnemyCount - 1);
        runtime.enemiesDefeated += 1;
      }

      ball.active = false;
      runtime.activeFireballCount = Math.max(0, runtime.activeFireballCount - 1);
      continue;
    }

    const outOfBounds = ball.x < -40 || ball.x > 900 || ball.y < -40 || ball.y > 640;
    if (outOfBounds) {
      ball.active = false;
      runtime.activeFireballCount = Math.max(0, runtime.activeFireballCount - 1);
    }
  }
};

const tickDefenseTimer = (runtime: DefenseRuntime, dt: number): void => {
  if (runtime.result !== 'playing') return;
  runtime.elapsedSec += dt;
  if (runtime.elapsedSec >= runtime.surviveSeconds) {
    runtime.result = 'clear';
  }
};

export const tickDefenseSimulation = (
  runtime: DefenseRuntime,
  difficulty: DefenseDifficulty,
  dt: number,
): void => {
  tickDefenseTimer(runtime, dt);
  spawnEnemyIfDue(runtime, difficulty, dt);
  updateDefenseEnemies(runtime, difficulty, dt);
  updateDefenseFireballs(runtime, dt);
};
