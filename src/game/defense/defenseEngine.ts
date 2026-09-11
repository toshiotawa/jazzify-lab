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
  DefenseRuntime,
} from '@/game/defense/defenseTypes';
import {
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';

const KNOCKBACK_DECAY = 0.9;
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

const findFrontmostActiveEnemy = (runtime: DefenseRuntime): DefenseEnemy | null => {
  let frontmost: DefenseEnemy | null = null;
  let minX = Number.POSITIVE_INFINITY;
  for (const enemy of runtime.enemies) {
    if (!enemy.active) continue;
    if (enemy.x < minX) {
      minX = enemy.x;
      frontmost = enemy;
    }
  }
  return frontmost;
};

const applySlashHit = (runtime: DefenseRuntime, target: DefenseEnemy): void => {
  // Interrupt any in-progress lunge so its peak damage never lands.
  target.attackHitPending = false;
  target.hp -= 1;
  const kbDx = target.x - runtime.playerX;
  target.knockbackVx = (kbDx >= 0 ? 1 : -1) * KNOCKBACK_IMPULSE;

  if (target.hp <= 0) {
    target.active = false;
    runtime.activeEnemyCount = Math.max(0, runtime.activeEnemyCount - 1);
    runtime.enemiesDefeated += 1;
  }

  runtime.slashAt = runtime.elapsedSec;
  runtime.slashFromX = runtime.playerX;
  runtime.slashToX = target.x;
  runtime.slashY = target.y;
};

export const performDefenseSlash = (
  runtime: DefenseRuntime,
  guardPoseSec = 0,
): boolean => {
  if (runtime.result !== 'playing') return false;
  const target = findFrontmostActiveEnemy(runtime);
  if (!target) return false;

  applySlashHit(runtime, target);
  if (guardPoseSec > 0) {
    runtime.guardPoseUntilSec = runtime.elapsedSec + guardPoseSec;
  }
  return true;
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
};
