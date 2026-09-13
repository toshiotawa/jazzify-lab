/**
 * Defense mode combat simulation (pure functions, mutable runtime).
 */
import {
  DEFENSE_ATTACK_LUNGE_SEC,
  DEFENSE_DAMAGE_POPUP_SEC,
  DEFENSE_FIREBALL_HIT_RADIUS,
  DEFENSE_FIREBALL_SPAWN_DELAY_SEC,
  DEFENSE_FIREBALL_SPEED_PX,
  DEFENSE_GROUND_Y,
  DEFENSE_HIT_FLASH_SEC,
  DEFENSE_SP_MAX,
  getDefenseEnemyCenterY,
  getDefenseSlashDamage,
  getDefenseWaveHpMult,
  getDefenseWaveIndex,
  getDefenseWaveSpawnIntervalMult,
  pickDefenseWaveEnemyType,
  resolveDefenseEnemyStats,
} from '@/game/defense/defenseEnemyConfig';
import type {
  DefenseDifficulty,
  DefenseEnemy,
  DefenseEnemyType,
  DefenseRuntime,
} from '@/game/defense/defenseTypes';
import {
  DEFENSE_MAP_WIDTH,
  DEFENSE_NO_HIT_FLASH,
  DEFENSE_NO_PENDING_FIREBALL,
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';

const KNOCKBACK_DECAY_TAU_SEC = 0.3;
export const KNOCKBACK_IMPULSE = 320;
const ATTACK_HIT_PHASE = DEFENSE_ATTACK_LUNGE_SEC * 0.5;
const KNOCKBACK_STOP_VX = 0.5;
const FIREBALL_SPAWN_OFFSET_X = 40;
const FIREBALL_SPAWN_OFFSET_Y = 40;
const FIREBALL_DESPAWN_X = DEFENSE_MAP_WIDTH + 40;

const isWaveScaling = (runtime: DefenseRuntime): boolean => (
  runtime.attackTrigger === 'note'
);

const isPhraseMode = (runtime: DefenseRuntime): boolean => (
  runtime.attackTrigger === 'note'
);

const findInactiveEnemySlot = (runtime: DefenseRuntime): DefenseEnemy | null => {
  for (const enemy of runtime.enemies) {
    if (!enemy.active) return enemy;
  }
  return null;
};

const getSpawnIntervalSec = (
  runtime: DefenseRuntime,
  difficulty: DefenseDifficulty,
): number => {
  if (!isWaveScaling(runtime)) {
    return difficulty.spawnIntervalSec;
  }
  return difficulty.spawnIntervalSec * getDefenseWaveSpawnIntervalMult(runtime.waveIndex);
};

const applyResolvedStatsToEnemy = (
  enemy: DefenseEnemy,
  type: DefenseEnemyType,
  difficulty: DefenseDifficulty,
  runtime: DefenseRuntime,
): void => {
  const hpMult = isWaveScaling(runtime) ? getDefenseWaveHpMult(runtime.waveIndex) : 1;
  const resolved = resolveDefenseEnemyStats(type, difficulty, hpMult);
  enemy.type = type;
  enemy.hp = resolved.hp;
  enemy.maxHp = resolved.hp;
  enemy.speedPxPerSec = resolved.speedPxPerSec;
  enemy.damage = resolved.damage;
  enemy.attackIntervalSec = resolved.attackIntervalSec;
  enemy.attackRangePx = resolved.attackRangePx;
  enemy.knockbackMult = resolved.knockbackMult;
};

const syncWaveState = (
  runtime: DefenseRuntime,
  spawnIntervalSec: number,
): void => {
  if (runtime.practiceMode) return;

  const nextWaveIndex = getDefenseWaveIndex(runtime.elapsedSec, runtime.surviveSeconds);
  if (nextWaveIndex === runtime.waveIndex) return;

  runtime.waveIndex = nextWaveIndex;
  runtime.waveSpawnCount = 0;
  runtime.waveStartedAt = runtime.elapsedSec;
  runtime.spawnTimerSec = spawnIntervalSec;
};

const pushDamagePopup = (
  runtime: DefenseRuntime,
  x: number,
  y: number,
  value: number,
): void => {
  const popup = runtime.damagePopups[runtime.nextPopupIndex];
  if (!popup) return;
  popup.active = true;
  popup.x = x;
  popup.y = y;
  popup.value = value;
  popup.spawnedAt = runtime.elapsedSec;
  runtime.nextPopupIndex = (runtime.nextPopupIndex + 1) % runtime.damagePopups.length;
};

const applyEnemyDamage = (
  runtime: DefenseRuntime,
  target: DefenseEnemy,
  damage: number,
  knockbackImpulse: number,
  showPopup: boolean,
): void => {
  target.attackHitPending = false;
  target.hp -= damage;
  target.hitFlashAt = runtime.elapsedSec;

  if (showPopup) {
    pushDamagePopup(runtime, target.x, target.y, damage);
  }

  const kbDx = target.x - runtime.playerX;
  target.knockbackVx = (kbDx >= 0 ? 1 : -1) * knockbackImpulse * target.knockbackMult;

  if (target.hp <= 0) {
    target.active = false;
    runtime.activeEnemyCount = Math.max(0, runtime.activeEnemyCount - 1);
    runtime.enemiesDefeated += 1;
  }
};

export const spawnDefenseFireball = (runtime: DefenseRuntime): boolean => {
  for (const fb of runtime.fireballs) {
    if (fb.active) continue;
    fb.active = true;
    fb.x = runtime.playerX + FIREBALL_SPAWN_OFFSET_X;
    fb.y = DEFENSE_GROUND_Y - FIREBALL_SPAWN_OFFSET_Y;
    fb.hitSlotMask = 0;
    return true;
  }
  return false;
};

export const chargeDefenseSp = (runtime: DefenseRuntime): boolean => {
  if (!isPhraseMode(runtime)) return false;
  runtime.spGauge += 1;
  if (runtime.spGauge < DEFENSE_SP_MAX) return false;
  runtime.spGauge = 0;
  runtime.skillPoseStartSec = runtime.elapsedSec;
  runtime.fireballSpawnAtSec = runtime.elapsedSec + DEFENSE_FIREBALL_SPAWN_DELAY_SEC;
  return true;
};

const spawnPendingFireball = (runtime: DefenseRuntime): void => {
  if (runtime.fireballSpawnAtSec < 0) return;
  if (runtime.elapsedSec + 1e-6 < runtime.fireballSpawnAtSec) return;
  runtime.fireballSpawnAtSec = DEFENSE_NO_PENDING_FIREBALL;
  spawnDefenseFireball(runtime);
};

export const updateDefenseFireballs = (
  runtime: DefenseRuntime,
  dt: number,
): void => {
  const showPopup = isPhraseMode(runtime);

  for (const fb of runtime.fireballs) {
    if (!fb.active) continue;

    fb.x += DEFENSE_FIREBALL_SPEED_PX * dt;

    for (const enemy of runtime.enemies) {
      if (!enemy.active) continue;
      const slotBit = 1 << enemy.slotIndex;
      if ((fb.hitSlotMask & slotBit) !== 0) continue;
      if (Math.abs(enemy.x - fb.x) > DEFENSE_FIREBALL_HIT_RADIUS) continue;

      fb.hitSlotMask |= slotBit;
      applyEnemyDamage(
        runtime,
        enemy,
        enemy.hp,
        KNOCKBACK_IMPULSE * 0.5,
        showPopup,
      );
    }

    if (fb.x > FIREBALL_DESPAWN_X) {
      fb.active = false;
    }
  }
};

export const updateDefensePopups = (runtime: DefenseRuntime): void => {
  for (const popup of runtime.damagePopups) {
    if (!popup.active) continue;
    if (runtime.elapsedSec - popup.spawnedAt > DEFENSE_DAMAGE_POPUP_SEC) {
      popup.active = false;
    }
  }
};

export const spawnEnemyIfDue = (
  runtime: DefenseRuntime,
  difficulty: DefenseDifficulty,
  dt: number,
): void => {
  if (runtime.result !== 'playing') return;

  const spawnIntervalSec = getSpawnIntervalSec(runtime, difficulty);
  syncWaveState(runtime, spawnIntervalSec);

  if (runtime.activeEnemyCount >= difficulty.maxEnemies) return;

  runtime.spawnTimerSec += dt;
  if (runtime.spawnTimerSec < spawnIntervalSec) return;
  runtime.spawnTimerSec = 0;

  const slot = findInactiveEnemySlot(runtime);
  if (!slot) return;

  const cumulative = isWaveScaling(runtime) && !runtime.practiceMode;
  const waveIndex = runtime.practiceMode ? 0 : runtime.waveIndex;
  const enemyType = pickDefenseWaveEnemyType(
    waveIndex,
    runtime.practiceMode ? runtime.nextEnemyIndex : runtime.waveSpawnCount,
    cumulative,
  );

  slot.active = true;
  slot.x = DEFENSE_SPAWN_X;
  slot.y = getDefenseEnemyCenterY(enemyType);
  slot.knockbackVx = 0;
  slot.lastAttackAt = 0;
  slot.moving = false;
  slot.attackHitPending = false;
  slot.hitFlashAt = DEFENSE_NO_HIT_FLASH;
  applyResolvedStatsToEnemy(slot, enemyType, difficulty, runtime);

  runtime.nextEnemyIndex += 1;
  if (!runtime.practiceMode) {
    runtime.waveSpawnCount += 1;
  }
  runtime.activeEnemyCount += 1;
};

export const updateDefenseEnemies = (
  runtime: DefenseRuntime,
  dt: number,
): void => {
  if (runtime.result !== 'playing') return;

  for (const enemy of runtime.enemies) {
    if (!enemy.active) continue;

    const absDx = Math.abs(runtime.playerX - enemy.x);
    const inRange = absDx <= enemy.attackRangePx;
    const attackElapsed = runtime.elapsedSec - enemy.lastAttackAt;

    if (enemy.attackHitPending && attackElapsed >= ATTACK_HIT_PHASE) {
      runtime.impactAt = runtime.elapsedSec;
      runtime.impactX = runtime.playerX;
      runtime.impactY = runtime.playerY;
      enemy.attackHitPending = false;
      if (!runtime.practiceMode) {
        runtime.playerHp = Math.max(0, runtime.playerHp - enemy.damage);
        if (runtime.playerHp <= 0) {
          runtime.result = 'gameover';
        }
      }
    }

    const isLunging = enemy.attackHitPending
      || (enemy.lastAttackAt > 0 && attackElapsed < DEFENSE_ATTACK_LUNGE_SEC);

    if (!isLunging && !inRange) {
      const speed = enemy.speedPxPerSec * dt;
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
      && runtime.elapsedSec - enemy.lastAttackAt >= enemy.attackIntervalSec
    ) {
      enemy.lastAttackAt = runtime.elapsedSec;
      enemy.attackHitPending = true;
      enemy.moving = false;
    } else {
      enemy.moving = false;
    }

    if (enemy.knockbackVx !== 0) {
      enemy.x += enemy.knockbackVx * dt;
      enemy.x = Math.min(DEFENSE_SPAWN_X, enemy.x);
      enemy.knockbackVx *= Math.exp(-dt / KNOCKBACK_DECAY_TAU_SEC);
      if (Math.abs(enemy.knockbackVx) < KNOCKBACK_STOP_VX) {
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

const applySlashHit = (runtime: DefenseRuntime, target: DefenseEnemy, damage: number): void => {
  applyEnemyDamage(
    runtime,
    target,
    damage,
    KNOCKBACK_IMPULSE,
    isPhraseMode(runtime),
  );

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

  const damage = getDefenseSlashDamage(runtime.waveIndex, isWaveScaling(runtime));
  applySlashHit(runtime, target, damage);
  if (guardPoseSec > 0) {
    runtime.guardPoseUntilSec = runtime.elapsedSec + guardPoseSec;
  }
  return true;
};

const tickDefenseTimer = (runtime: DefenseRuntime, dt: number): void => {
  if (runtime.result !== 'playing') return;
  runtime.elapsedSec += dt;
  if (!runtime.practiceMode && runtime.elapsedSec >= runtime.surviveSeconds) {
    runtime.result = 'clear';
  }
};

export const tickDefenseSimulation = (
  runtime: DefenseRuntime,
  difficulty: DefenseDifficulty,
  dt: number,
): void => {
  tickDefenseTimer(runtime, dt);
  spawnPendingFireball(runtime);
  spawnEnemyIfDue(runtime, difficulty, dt);
  updateDefenseEnemies(runtime, dt);
  updateDefenseFireballs(runtime, dt);
  updateDefensePopups(runtime);
};
