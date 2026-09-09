/**
 * Defense mode combat simulation (pure functions, mutable runtime).
 */
import type {
  DefenseDifficulty,
  DefenseEnemy,
  DefenseEnemyType,
  DefenseFireball,
  DefenseRuntime,
} from '@/game/defense/defenseTypes';
import {
  DEFENSE_FIREBALL_SPEED,
  DEFENSE_MAP_HEIGHT,
  DEFENSE_PLAYER_X,
  DEFENSE_PLAYER_Y,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';

const ENEMY_TYPES: readonly DefenseEnemyType[] = [
  'slime', 'goblin', 'skeleton', 'zombie', 'bat', 'ghost', 'orc', 'demon', 'dragon',
];

const KNOCKBACK_DECAY = 0.9;
const FIREBALL_HIT_RADIUS = 28;
const FIREBALL_LIFETIME_SEC = 2;
const KNOCKBACK_IMPULSE = 180;

const pickEnemyType = (index: number): DefenseEnemyType => (
  ENEMY_TYPES[index % ENEMY_TYPES.length] ?? 'slime'
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

  const jitterY = ((runtime.nextEnemyIndex % 7) - 3) * 12;
  slot.active = true;
  slot.type = pickEnemyType(runtime.nextEnemyIndex);
  slot.x = DEFENSE_SPAWN_X;
  slot.y = Math.max(40, Math.min(DEFENSE_MAP_HEIGHT - 40, DEFENSE_PLAYER_Y + jitterY));
  slot.hp = difficulty.enemyHp;
  slot.maxHp = difficulty.enemyHp;
  slot.knockbackVx = 0;
  slot.knockbackVy = 0;
  slot.lastAttackAt = runtime.elapsedSec;
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

    const dx = runtime.playerX - enemy.x;
    const dy = runtime.playerY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const inRange = dist <= difficulty.attackRangePx;

    if (!inRange) {
      const speed = difficulty.enemySpeedPxPerSec * dt;
      enemy.x += (dx / dist) * speed;
      enemy.y += (dy / dist) * speed;
    } else if (runtime.elapsedSec - enemy.lastAttackAt >= difficulty.attackIntervalSec) {
      runtime.playerHp = Math.max(0, runtime.playerHp - difficulty.enemyDamage);
      enemy.lastAttackAt = runtime.elapsedSec;
      if (runtime.playerHp <= 0) {
        runtime.result = 'gameover';
      }
    }

    if (enemy.knockbackVx !== 0 || enemy.knockbackVy !== 0) {
      enemy.x += enemy.knockbackVx * dt;
      enemy.y += enemy.knockbackVy * dt;
      enemy.knockbackVx *= KNOCKBACK_DECAY;
      enemy.knockbackVy *= KNOCKBACK_DECAY;
      if (Math.abs(enemy.knockbackVx) < 0.5) enemy.knockbackVx = 0;
      if (Math.abs(enemy.knockbackVy) < 0.5) enemy.knockbackVy = 0;
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
      const kbDy = hitEnemy.y - runtime.playerY;
      const kbDist = Math.sqrt(kbDx * kbDx + kbDy * kbDy) || 1;
      hitEnemy.knockbackVx = (kbDx / kbDist) * KNOCKBACK_IMPULSE;
      hitEnemy.knockbackVy = (kbDy / kbDist) * KNOCKBACK_IMPULSE;

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
