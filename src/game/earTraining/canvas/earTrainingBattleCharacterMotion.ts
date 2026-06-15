import {
  clampBattleCharacterX,
  getBattleCharacterMinDistance,
  getBattleCharacterMotionRange,
} from '@/game/earTraining/battleCharacterMotion';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import { EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS } from '@/utils/constants';
import { getFloorY } from './earTrainingBattleLayout';
import type { CanvasCharacterRuntime } from './earTrainingBattleDrawState';
import { easeCubicOut, easeSineInOut } from './earTrainingBattleDrawState';

const AUTO_IDLE_MIN_MS = 1000;
const AUTO_IDLE_MAX_MS = 2500;
const RECOVER_IDLE_MIN_MS = 500;
const RECOVER_IDLE_MAX_MS = 1200;
const ACTION_RESUME_IDLE_MS = 900;
const KNOCKBACK_LIFT_PX = 10;
const KNOCKBACK_ROTATION_DEG = 4;
const CHARACTER_RECOVER_MS = 360;

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const easeBackOut = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

const pickCharacterTargetX = (
  view: CanvasCharacterRuntime,
  otherX: number | null,
  stageWidth: number,
): number => {
  const minDistance = getBattleCharacterMinDistance(stageWidth);
  const rangeSpan = view.maxX - view.minX;
  const homeSpread = Math.min(84, rangeSpan * 0.78);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const offset = randomBetween(-homeSpread, homeSpread);
    const candidate = clampBattleCharacterX(view.homeX + offset, {
      homeX: view.homeX,
      minX: view.minX,
      maxX: view.maxX,
      speed: view.speed,
    });
    if (otherX === null || Math.abs(candidate - otherX) >= minDistance) {
      return candidate;
    }
  }

  if (otherX === null) return view.homeX;
  const fallback = view.side === 'player'
    ? Math.min(view.maxX, otherX - minDistance)
    : Math.max(view.minX, otherX + minDistance);
  return clampBattleCharacterX(fallback, {
    homeX: view.homeX,
    minX: view.minX,
    maxX: view.maxX,
    speed: view.speed,
  });
};

export const createCharacterRuntime = (
  side: 'player' | 'enemy',
  width: number,
  snapshot: EarTrainingBattleSnapshot,
): CanvasCharacterRuntime => {
  const range = getBattleCharacterMotionRange(side, width);
  const x = range.homeX;
  const avatarUrl = side === 'player' ? snapshot.playerAvatarUrl : snapshot.enemyAvatarUrl;
  const flipX = side === 'enemy' && (
    snapshot.enemyAvatarFlipX || EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS.has(avatarUrl)
  );
  return {
    side,
    x,
    yOffset: 0,
    rotation: 0,
    homeX: range.homeX,
    minX: range.minX,
    maxX: range.maxX,
    speed: range.speed,
    motionState: 'idle',
    motionToken: 0,
    walkFromX: x,
    walkToX: x,
    walkStartedAt: 0,
    walkDurationMs: 0,
    knockbackFromX: x,
    knockbackToX: x,
    knockbackFromY: 0,
    knockbackToY: 0,
    knockbackRotation: 0,
    knockbackStartedAt: 0,
    knockbackPushDurationMs: 0,
    knockbackReturnDurationMs: 0,
    knockbackPhase: 'none',
    flashStartedAt: 0,
    flashDurationMs: 0,
    flashRepeat: 0,
    tintColor: null,
    tintUntil: 0,
    poseKey: null,
    poseUntil: 0,
    avatarUrl,
    flipX,
  };
};

export interface CharacterMotionTimers {
  idleTimer: ReturnType<typeof setTimeout> | null;
  resumeTimer: ReturnType<typeof setTimeout> | null;
}

export const createCharacterMotionTimers = (): CharacterMotionTimers => ({
  idleTimer: null,
  resumeTimer: null,
});

export const clearCharacterMotionTimers = (timers: CharacterMotionTimers): void => {
  if (timers.idleTimer) clearTimeout(timers.idleTimer);
  if (timers.resumeTimer) clearTimeout(timers.resumeTimer);
  timers.idleTimer = null;
  timers.resumeTimer = null;
};

export const shouldRunCharacterAutoMotion = (snapshot: EarTrainingBattleSnapshot): boolean =>
  !snapshot.fixedCharacterPositions;

const isCharacterMotionSettled = (view: CanvasCharacterRuntime): boolean =>
  view.motionState === 'idle'
  && view.knockbackPhase === 'none';

export const ensureCharacterAutoMotion = (
  runtime: { player: CanvasCharacterRuntime; enemy: CanvasCharacterRuntime },
  snapshot: EarTrainingBattleSnapshot,
  width: number,
  playerTimers: CharacterMotionTimers,
  enemyTimers: CharacterMotionTimers,
  onDirty: () => void,
): void => {
  if (!shouldRunCharacterAutoMotion(snapshot)) {
    clearCharacterMotionTimers(playerTimers);
    clearCharacterMotionTimers(enemyTimers);
    return;
  }

  if (
    isCharacterMotionSettled(runtime.player)
    && !playerTimers.idleTimer
    && !playerTimers.resumeTimer
  ) {
    scheduleCharacterIdle(
      runtime.player,
      runtime.enemy.x,
      width,
      playerTimers,
      onDirty,
    );
  }

  if (
    isCharacterMotionSettled(runtime.enemy)
    && !enemyTimers.idleTimer
    && !enemyTimers.resumeTimer
  ) {
    scheduleCharacterIdle(
      runtime.enemy,
      runtime.player.x,
      width,
      enemyTimers,
      onDirty,
    );
  }
};

export const scheduleCharacterIdle = (
  view: CanvasCharacterRuntime,
  otherX: number | null,
  width: number,
  timers: CharacterMotionTimers,
  onDirty: () => void,
  idleMinMs = AUTO_IDLE_MIN_MS,
  idleMaxMs = AUTO_IDLE_MAX_MS,
): void => {
  clearCharacterMotionTimers(timers);
  view.motionState = 'idle';
  view.x = clampBattleCharacterX(view.x, {
    homeX: view.homeX,
    minX: view.minX,
    maxX: view.maxX,
    speed: view.speed,
  });
  const token = view.motionToken;
  const delayMs = Math.round(randomBetween(idleMinMs, idleMaxMs));
  timers.idleTimer = setTimeout(() => {
    if (view.motionToken !== token || view.motionState !== 'idle') return;
    startCharacterWalk(view, otherX, width, timers, onDirty);
  }, delayMs);
};

export const startCharacterWalk = (
  view: CanvasCharacterRuntime,
  otherX: number | null,
  width: number,
  timers: CharacterMotionTimers,
  onDirty: () => void,
): void => {
  clearCharacterMotionTimers(timers);
  view.motionState = 'walk';
  view.walkToX = pickCharacterTargetX(view, otherX, width);
  view.walkFromX = clampBattleCharacterX(view.x, {
    homeX: view.homeX,
    minX: view.minX,
    maxX: view.maxX,
    speed: view.speed,
  });
  const distance = Math.abs(view.walkToX - view.walkFromX);
  if (distance < 2) {
    scheduleCharacterIdle(view, otherX, width, timers, onDirty, RECOVER_IDLE_MIN_MS, RECOVER_IDLE_MAX_MS);
    return;
  }
  view.walkStartedAt = performance.now();
  view.walkDurationMs = Math.max(140, Math.round((distance / view.speed) * 1000));
  onDirty();
  const token = view.motionToken;
  timers.resumeTimer = setTimeout(() => {
    if (view.motionToken !== token || view.motionState !== 'walk') return;
    view.x = view.walkToX;
    scheduleCharacterIdle(view, otherX, width, timers, onDirty);
    onDirty();
  }, view.walkDurationMs);
};

export const holdCharacterForAction = (
  view: CanvasCharacterRuntime,
  state: 'cast' | 'attack',
  durationMs: number,
  snapshot: EarTrainingBattleSnapshot,
  otherX: number | null,
  width: number,
  timers: CharacterMotionTimers,
  onDirty: () => void,
): void => {
  clearCharacterMotionTimers(timers);
  view.motionToken += 1;
  view.motionState = state;
  view.knockbackPhase = 'none';
  view.yOffset = 0;
  view.rotation = 0;
  view.x = clampBattleCharacterX(view.x, {
    homeX: view.homeX,
    minX: view.minX,
    maxX: view.maxX,
    speed: view.speed,
  });
  const token = view.motionToken;
  timers.resumeTimer = setTimeout(() => {
    if (view.motionToken !== token || view.motionState !== state) return;
    if (snapshot.fixedCharacterPositions) {
      view.motionState = 'idle';
      view.x = clampBattleCharacterX(view.homeX, {
        homeX: view.homeX,
        minX: view.minX,
        maxX: view.maxX,
        speed: view.speed,
      });
      onDirty();
      return;
    }
    scheduleCharacterIdle(view, otherX, width, timers, onDirty, ACTION_RESUME_IDLE_MS, ACTION_RESUME_IDLE_MS);
    onDirty();
  }, durationMs);
  onDirty();
};

export const scheduleCharacterRecover = (
  view: CanvasCharacterRuntime,
  otherX: number | null,
  width: number,
  snapshot: EarTrainingBattleSnapshot,
  timers: CharacterMotionTimers,
  onDirty: () => void,
): void => {
  clearCharacterMotionTimers(timers);
  view.motionState = 'recover';
  const token = view.motionToken;
  timers.resumeTimer = setTimeout(() => {
    if (view.motionToken !== token || view.motionState !== 'recover') return;
    if (snapshot.fixedCharacterPositions) {
      view.motionState = 'idle';
      view.x = clampBattleCharacterX(view.homeX, {
        homeX: view.homeX,
        minX: view.minX,
        maxX: view.maxX,
        speed: view.speed,
      });
      view.yOffset = 0;
      view.rotation = 0;
      onDirty();
      return;
    }
    scheduleCharacterIdle(view, otherX, width, timers, onDirty, RECOVER_IDLE_MIN_MS, RECOVER_IDLE_MAX_MS);
    onDirty();
  }, CHARACTER_RECOVER_MS);
};

export const knockCharacter = (
  view: CanvasCharacterRuntime,
  distance: number,
  durationMs: number,
  snapshot: EarTrainingBattleSnapshot,
  otherX: number | null,
  width: number,
  timers: CharacterMotionTimers,
  onDirty: () => void,
): void => {
  if (snapshot.fixedCharacterPositions) {
    view.motionState = 'idle';
    view.x = clampBattleCharacterX(view.homeX, {
      homeX: view.homeX,
      minX: view.minX,
      maxX: view.maxX,
      speed: view.speed,
    });
    view.yOffset = 0;
    view.rotation = 0;
    view.knockbackPhase = 'none';
    onDirty();
    return;
  }

  clearCharacterMotionTimers(timers);
  view.motionToken += 1;
  view.motionState = 'knockback';
  view.knockbackFromX = view.x;
  view.knockbackToX = clampBattleCharacterX(view.x + distance, {
    homeX: view.homeX,
    minX: view.minX,
    maxX: view.maxX,
    speed: view.speed,
  });
  view.knockbackFromY = 0;
  view.knockbackToY = -KNOCKBACK_LIFT_PX;
  view.knockbackRotation = distance >= 0 ? KNOCKBACK_ROTATION_DEG : -KNOCKBACK_ROTATION_DEG;
  view.knockbackStartedAt = performance.now();
  view.knockbackPushDurationMs = Math.max(80, Math.floor(durationMs * 0.65));
  view.knockbackReturnDurationMs = Math.max(120, durationMs - view.knockbackPushDurationMs);
  view.knockbackPhase = 'push';
  onDirty();
};

export const flashCharacter = (
  view: CanvasCharacterRuntime,
  repeat: number,
  durationPerPulseMs: number,
): void => {
  view.flashStartedAt = performance.now();
  view.flashDurationMs = durationPerPulseMs;
  view.flashRepeat = repeat;
};

export const updateCharacterPositions = (view: CanvasCharacterRuntime, now: number): void => {
  if (view.motionState === 'walk' && view.walkDurationMs > 0) {
    const t = Math.min((now - view.walkStartedAt) / view.walkDurationMs, 1);
    view.x = view.walkFromX + (view.walkToX - view.walkFromX) * easeSineInOut(t);
  }

  if (view.knockbackPhase === 'push') {
    const elapsed = now - view.knockbackStartedAt;
    const t = Math.min(elapsed / view.knockbackPushDurationMs, 1);
    const eased = 1 - (1 - t) ** 2;
    view.x = view.knockbackFromX + (view.knockbackToX - view.knockbackFromX) * eased;
    view.yOffset = view.knockbackFromY + (view.knockbackToY - view.knockbackFromY) * eased;
    view.rotation = view.knockbackRotation * eased;
    if (t >= 1) {
      view.knockbackPhase = 'return';
      view.knockbackStartedAt = now;
    }
  } else if (view.knockbackPhase === 'return') {
    const elapsed = now - view.knockbackStartedAt;
    const t = Math.min(elapsed / view.knockbackReturnDurationMs, 1);
    view.yOffset = view.knockbackToY + (0 - view.knockbackToY) * easeBackOut(t);
    view.rotation = view.knockbackRotation * (1 - easeBackOut(t));
    if (t >= 1) {
      view.yOffset = 0;
      view.rotation = 0;
      view.knockbackPhase = 'none';
    }
  }
};

export const isCharacterKnockbackActive = (view: CanvasCharacterRuntime): boolean =>
  view.knockbackPhase !== 'none';

export const getCharacterFlashAlpha = (view: CanvasCharacterRuntime, now: number): number => {
  if (view.flashRepeat <= 0) return 1;
  const elapsed = now - view.flashStartedAt;
  const pulseMs = view.flashDurationMs;
  const cycleMs = pulseMs * 2;
  const totalMs = cycleMs * view.flashRepeat;
  if (elapsed >= totalMs) {
    view.flashRepeat = 0;
    return 1;
  }
  const cycleT = (elapsed % cycleMs) / pulseMs;
  if (cycleT <= 1) return 1 - 0.65 * cycleT;
  return 0.35 + 0.65 * (cycleT - 1);
};

export const syncCharactersFromSnapshot = (
  runtime: { player: CanvasCharacterRuntime; enemy: CanvasCharacterRuntime },
  snapshot: EarTrainingBattleSnapshot,
  width: number,
): void => {
  runtime.player.avatarUrl = snapshot.playerAvatarUrl;
  runtime.enemy.avatarUrl = snapshot.enemyAvatarUrl;
  runtime.enemy.flipX = snapshot.enemyAvatarFlipX
    || EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS.has(snapshot.enemyAvatarUrl);

  const playerRange = getBattleCharacterMotionRange('player', width);
  const enemyRange = getBattleCharacterMotionRange('enemy', width);
  runtime.player.homeX = playerRange.homeX;
  runtime.player.minX = playerRange.minX;
  runtime.player.maxX = playerRange.maxX;
  runtime.player.speed = playerRange.speed;
  runtime.enemy.homeX = enemyRange.homeX;
  runtime.enemy.minX = enemyRange.minX;
  runtime.enemy.maxX = enemyRange.maxX;
  runtime.enemy.speed = enemyRange.speed;

  if (snapshot.fixedCharacterPositions) {
    runtime.player.motionState = 'idle';
    runtime.enemy.motionState = 'idle';
    runtime.player.x = playerRange.homeX;
    runtime.enemy.x = enemyRange.homeX;
    runtime.player.yOffset = 0;
    runtime.enemy.yOffset = 0;
    runtime.player.rotation = 0;
    runtime.enemy.rotation = 0;
    runtime.player.knockbackPhase = 'none';
    runtime.enemy.knockbackPhase = 'none';
  }
};
