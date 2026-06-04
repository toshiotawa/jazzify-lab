import type { CodeRunEnemy, CodeRunInputState, CodeRunMapSpec, CodeRunPlayer, CodeRunRect, CodeRunState, CodeRunTileRect } from './CodeRunTypes';

const GRAVITY = 0.8;
const MAX_FALL = 17;
const WALK_ACCEL = 0.7;
const WALK_MAX = 4.6;
const GROUND_DECEL = 0.6;
const AIR_DECEL = 0.18;
const JUMP_VEL = -15.4;
const STOMP_BOUNCE = -11.5;
const COYOTE_FRAMES = 7;
const JUMP_BUFFER_FRAMES = 8;
const PLATFORM_LAND_EPSILON = 0.01;

export const CODE_RUN_MAX_HP = 10;
/** 制限時間（秒）。1:50 */
export const CODE_RUN_TIME_LIMIT_SECONDS = 110;

export const formatCodeRunClock = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
export const CODE_RUN_DAMAGE_INVUL_FRAMES = 90;
export const CODE_RUN_HURT_FRAMES = 26;
export const CODE_RUN_START_INVUL_FRAMES = 40;
const KNOCKBACK_VX = 5.5;
const KNOCKBACK_VY = -7;

const overlap = (a: CodeRunRect, b: CodeRunRect): boolean => (
  a.x < b.x + b.width
  && a.x + a.width > b.x
  && a.y < b.y + b.height
  && a.y + a.height > b.y
);

const overlapRect = (a: CodeRunRect, x: number, y: number, width: number, height: number): boolean => (
  a.x < x + width
  && a.x + a.width > x
  && a.y < y + height
  && a.y + a.height > y
);

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

const solidCollisions = (rect: CodeRunRect, solids: readonly CodeRunTileRect[]): CodeRunTileRect[] => {
  const hits: CodeRunTileRect[] = [];
  for (const tile of solids) {
    if (overlap(rect, tile)) hits.push(tile);
  }
  return hits;
};

const canLandOnOneWayPlatform = (player: CodeRunPlayer, tile: CodeRunTileRect): boolean => (
  tile.kind === 'platform'
  && player.vy > 0
  && player.y + player.height <= tile.y + PLATFORM_LAND_EPSILON
);

const makeEnemies = (state: CodeRunState): readonly CodeRunEnemy[] => state.map.enemies.map((enemy, index) => ({
  id: enemy.id,
  x: enemy.x,
  y: enemy.y,
  width: enemy.width,
  height: enemy.height,
  vx: -(enemy.speed ?? 1.25),
  alive: true,
  anim: index * 0.6,
  minX: enemy.minX ?? Math.max(0, enemy.x - state.map.tileSize * 2),
  maxX: enemy.maxX ?? Math.min(state.map.worldWidth - enemy.width, enemy.x + state.map.tileSize * 2),
}));

const defaultPlayerFields = (): Pick<CodeRunPlayer, 'coyoteFrames' | 'jumpBufferFrames'> => ({
  coyoteFrames: 0,
  jumpBufferFrames: 0,
});

const freshPlayerAtSpawn = (map: CodeRunMapSpec, invulFrames: number): CodeRunPlayer => ({
  x: map.spawn.x,
  y: map.spawn.y,
  width: 34,
  height: 42,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: false,
  jumpCount: 0,
  chordLockedUntilLanding: false,
  hp: CODE_RUN_MAX_HP,
  maxHp: CODE_RUN_MAX_HP,
  invulFrames,
  hurtFrames: 0,
  runPhase: 0,
  ...defaultPlayerFields(),
});

export function createInitialCodeRunState(map: CodeRunState['map']): CodeRunState {
  const state: CodeRunState = {
    map,
    player: freshPlayerAtSpawn(map, CODE_RUN_START_INVUL_FRAMES),
    enemies: [],
    elapsedSec: 0,
    cameraX: 0,
    cameraY: 0,
    status: 'playing',
  };
  return { ...state, enemies: makeEnemies(state) };
}

export const failCodeRun = (state: CodeRunState): CodeRunState => {
  if (state.status !== 'playing') return state;
  return { ...state, status: 'failed' };
};

export const applyDamage = (state: CodeRunState, srcCenterX: number): CodeRunState => {
  if (state.status !== 'playing' || state.player.invulFrames > 0) return state;
  const playerCenterX = state.player.x + state.player.width / 2;
  const dir = playerCenterX < srcCenterX ? -1 : 1;
  const player: CodeRunPlayer = {
    ...state.player,
    hp: state.player.hp - 1,
    hurtFrames: CODE_RUN_HURT_FRAMES,
    invulFrames: CODE_RUN_DAMAGE_INVUL_FRAMES,
    vx: dir * KNOCKBACK_VX,
    vy: KNOCKBACK_VY,
    onGround: false,
  };
  let next: CodeRunState = { ...state, player };
  if (player.hp <= 0) {
    next = failCodeRun(next);
  }
  return next;
};

const canExecuteBufferedJump = (player: CodeRunPlayer): boolean => {
  if (player.chordLockedUntilLanding || player.jumpCount >= 2) return false;
  if (player.jumpCount === 0) {
    return player.onGround || player.coyoteFrames > 0;
  }
  return true;
};

const applyBufferedJump = (player: CodeRunPlayer): CodeRunPlayer => {
  const next = {
    ...player,
    vy: JUMP_VEL,
    onGround: false,
    jumpCount: player.jumpCount + 1,
    coyoteFrames: 0,
    jumpBufferFrames: 0,
  };
  if (next.jumpCount >= 2) {
    next.chordLockedUntilLanding = true;
  }
  return next;
};

const updateCoyoteFrames = (player: CodeRunPlayer): CodeRunPlayer => {
  if (player.onGround) {
    return { ...player, coyoteFrames: COYOTE_FRAMES };
  }
  if (player.coyoteFrames > 0) {
    return { ...player, coyoteFrames: player.coyoteFrames - 1 };
  }
  return player;
};

const processJumpBuffer = (player: CodeRunPlayer): CodeRunPlayer => {
  if (player.jumpBufferFrames <= 0) return player;
  if (canExecuteBufferedJump(player)) {
    return applyBufferedJump(player);
  }
  return { ...player, jumpBufferFrames: player.jumpBufferFrames - 1 };
};

export function triggerCodeRunJump(state: CodeRunState): CodeRunState {
  if (state.status !== 'playing') return state;
  const player = { ...state.player };
  if (player.jumpCount >= 2 || player.chordLockedUntilLanding) return state;
  return {
    ...state,
    player: { ...player, jumpBufferFrames: JUMP_BUFFER_FRAMES },
  };
}

const movePlayerX = (player: CodeRunPlayer, solids: readonly CodeRunTileRect[], step: number): CodeRunPlayer => {
  const next = { ...player, x: player.x + player.vx * step };
  for (const hit of solidCollisions(next, solids)) {
    if (hit.kind === 'platform') continue;
    if (player.vx > 0) next.x = hit.x - next.width;
    if (player.vx < 0) next.x = hit.x + hit.width;
    next.vx = 0;
  }
  return next;
};

const movePlayerY = (player: CodeRunPlayer, solids: readonly CodeRunTileRect[], step: number): CodeRunPlayer => {
  const next = { ...player, y: player.y + player.vy * step, onGround: false };
  for (const hit of solidCollisions(next, solids)) {
    if (hit.kind === 'platform' && !canLandOnOneWayPlatform(player, hit)) continue;
    if (player.vy > 0) {
      next.y = hit.y - next.height;
      next.vy = 0;
      next.onGround = true;
      next.jumpCount = 0;
      next.chordLockedUntilLanding = false;
    } else if (player.vy < 0) {
      next.y = hit.y + hit.height;
      next.vy = 0;
    }
  }
  return next;
};

const updateEnemies = (state: CodeRunState, step: number): readonly CodeRunEnemy[] => {
  return state.enemies.map((enemy) => {
    if (!enemy.alive) return enemy;
    let vx = enemy.vx;
    let x = enemy.x + vx * step;
    if (x < enemy.minX || x > enemy.maxX) {
      vx *= -1;
      x = clamp(x, enemy.minX, enemy.maxX);
    }
    const probe: CodeRunRect = { ...enemy, x };
    if (solidCollisions(probe, state.map.solids).length > 0) {
      vx *= -1;
      x = enemy.x + vx * step;
    }
    return {
      ...enemy,
      x,
      vx,
      anim: enemy.anim + 0.15 * step,
    };
  });
};

const decrementTimedFrames = (player: CodeRunPlayer, step: number): CodeRunPlayer => ({
  ...player,
  invulFrames: Math.max(0, player.invulFrames - step),
  hurtFrames: Math.max(0, player.hurtFrames - step),
});

export function tickCodeRun(state: CodeRunState, input: CodeRunInputState, dtSec: number): CodeRunState {
  if (state.status !== 'playing') return state;

  const step = clamp(dtSec * 60, 0, 2);
  let player = { ...state.player };
  const axis = clamp((input.right ? 1 : 0) - (input.left ? 1 : 0) + input.analogX, -1, 1);
  if (Math.abs(axis) > 0.08) {
    player.vx = clamp(player.vx + WALK_ACCEL * axis * step, -WALK_MAX, WALK_MAX);
    player.facing = axis >= 0 ? 1 : -1;
  } else {
    const decel = (player.onGround ? GROUND_DECEL : AIR_DECEL) * step;
    if (Math.abs(player.vx) <= decel) player.vx = 0;
    else player.vx -= Math.sign(player.vx) * decel;
  }
  player.vy = clamp(player.vy + GRAVITY * step, -99, MAX_FALL);
  player.runPhase += Math.abs(player.vx) * 0.035 * step;
  player = updateCoyoteFrames(player);
  player = processJumpBuffer(player);

  player = movePlayerX(player, state.map.solids, step);
  player.x = clamp(player.x, 0, state.map.worldWidth - player.width);
  player = movePlayerY(player, state.map.solids, step);
  player = decrementTimedFrames(player, step);

  let next: CodeRunState = {
    ...state,
    player,
    enemies: updateEnemies(state, step),
    elapsedSec: state.elapsedSec + dtSec,
  };

  if (next.player.y > next.map.worldHeight + 96) {
    next = failCodeRun(next);
    if (next.status !== 'playing') {
      return { ...next, cameraX: clampCameraX(next), cameraY: clampCameraY(next) };
    }
  }

  if (next.player.invulFrames <= 0) {
    for (const spike of next.map.spikes) {
      if (overlap(next.player, spike)) {
        next = applyDamage(next, spike.x + spike.width / 2);
        break;
      }
    }
  }

  if (next.status === 'playing' && next.player.invulFrames <= 0) {
    const enemies: CodeRunEnemy[] = [];
    let sideHitSrcX: number | null = null;
    for (const enemy of next.enemies) {
      if (!enemy.alive || !overlap(next.player, enemy)) {
        enemies.push(enemy);
        continue;
      }
      const playerBottomBefore = next.player.y + next.player.height - next.player.vy * step;
      if (next.player.vy > 0 && playerBottomBefore <= enemy.y + 12) {
        next = {
          ...next,
          player: { ...next.player, vy: STOMP_BOUNCE, onGround: false },
        };
        enemies.push({ ...enemy, alive: false });
        continue;
      }
      sideHitSrcX = enemy.x + enemy.width / 2;
      enemies.push(enemy);
    }
    next = { ...next, enemies };
    if (sideHitSrcX !== null) {
      next = applyDamage(next, sideHitSrcX);
    }
  }

  const playerCenterX = next.player.x + next.player.width / 2;
  const goalY = next.map.goalY;
  const touchedGoal = goalY === undefined
    ? playerCenterX >= next.map.goalX
    : overlapRect(next.player, next.map.goalX, goalY, next.map.tileSize + 16, 84);
  if (next.status === 'playing' && touchedGoal) {
    next = { ...next, status: 'clear' };
  } else if (next.status === 'playing' && next.elapsedSec >= next.map.timeLimitSec) {
    next = { ...next, status: 'failed' };
  }

  return { ...next, cameraX: clampCameraX(next), cameraY: clampCameraY(next) };
}

const clampCameraX = (state: CodeRunState): number => clamp(
  state.player.x + state.player.width / 2 - state.map.viewWidth / 2,
  0,
  Math.max(0, state.map.worldWidth - state.map.viewWidth),
);

const clampCameraY = (state: CodeRunState): number => clamp(
  state.player.y + state.player.height / 2 - state.map.viewHeight / 2,
  0,
  Math.max(0, state.map.worldHeight - state.map.viewHeight),
);
