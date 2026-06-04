import type { CodeRunEnemy, CodeRunInputState, CodeRunPlayer, CodeRunRect, CodeRunState, CodeRunTileRect } from './CodeRunTypes';

const GRAVITY = 0.8;
const MAX_FALL = 17;
const WALK_ACCEL = 0.7;
const WALK_MAX = 4.6;
const GROUND_DECEL = 0.6;
const AIR_DECEL = 0.18;
const JUMP_VEL = -15.4;
const STOMP_BOUNCE = -11.5;

const overlap = (a: CodeRunRect, b: CodeRunRect): boolean => (
  a.x < b.x + b.width
  && a.x + a.width > b.x
  && a.y < b.y + b.height
  && a.y + a.height > b.y
);

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

const solidCollisions = (rect: CodeRunRect, solids: readonly CodeRunTileRect[]): CodeRunTileRect[] => {
  const hits: CodeRunTileRect[] = [];
  for (const tile of solids) {
    if (overlap(rect, tile)) hits.push(tile);
  }
  return hits;
};

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

export function createInitialCodeRunState(map: CodeRunState['map']): CodeRunState {
  const state: CodeRunState = {
    map,
    player: {
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
      respawnGraceSec: 1,
      runPhase: 0,
    },
    enemies: [],
    elapsedSec: 0,
    cameraX: 0,
    status: 'playing',
  };
  return { ...state, enemies: makeEnemies(state) };
}

const respawnPlayer = (state: CodeRunState): CodeRunState => ({
  ...state,
  player: {
    ...state.player,
    x: state.map.spawn.x,
    y: state.map.spawn.y,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    jumpCount: 0,
    chordLockedUntilLanding: false,
    respawnGraceSec: 1.1,
  },
  enemies: makeEnemies(state),
});

export function triggerCodeRunJump(state: CodeRunState): CodeRunState {
  if (state.status !== 'playing') return state;
  const player = { ...state.player };
  if (player.jumpCount >= 2 || player.chordLockedUntilLanding) return state;
  player.vy = JUMP_VEL;
  player.onGround = false;
  player.jumpCount += 1;
  if (player.jumpCount >= 2) {
    player.chordLockedUntilLanding = true;
  }
  return { ...state, player };
}

const movePlayerX = (player: CodeRunPlayer, solids: readonly CodeRunTileRect[], step: number): CodeRunPlayer => {
  const next = { ...player, x: player.x + player.vx * step };
  for (const hit of solidCollisions(next, solids)) {
    if (player.vx > 0) next.x = hit.x - next.width;
    if (player.vx < 0) next.x = hit.x + hit.width;
    next.vx = 0;
  }
  return next;
};

const movePlayerY = (player: CodeRunPlayer, solids: readonly CodeRunTileRect[], step: number): CodeRunPlayer => {
  const next = { ...player, y: player.y + player.vy * step, onGround: false };
  for (const hit of solidCollisions(next, solids)) {
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
  player.respawnGraceSec = Math.max(0, player.respawnGraceSec - dtSec);
  player.runPhase += Math.abs(player.vx) * 0.035 * step;

  player = movePlayerX(player, state.map.solids, step);
  player.x = clamp(player.x, 0, state.map.worldWidth - player.width);
  player = movePlayerY(player, state.map.solids, step);

  let next: CodeRunState = {
    ...state,
    player,
    enemies: updateEnemies(state, step),
    elapsedSec: state.elapsedSec + dtSec,
  };

  if (next.player.y > next.map.viewHeight + 96) {
    next = respawnPlayer(next);
  }

  if (next.player.respawnGraceSec <= 0) {
    for (const spike of next.map.spikes) {
      if (overlap(next.player, spike)) {
        next = respawnPlayer(next);
        break;
      }
    }
  }

  if (next.player.respawnGraceSec <= 0) {
    let touched = false;
    const enemies = next.enemies.map((enemy) => {
      if (!enemy.alive || !overlap(next.player, enemy)) return enemy;
      const playerBottomBefore = next.player.y + next.player.height - next.player.vy * step;
      if (next.player.vy > 0 && playerBottomBefore <= enemy.y + 12) {
        next = {
          ...next,
          player: { ...next.player, vy: STOMP_BOUNCE, onGround: false },
        };
        return { ...enemy, alive: false };
      }
      touched = true;
      return enemy;
    });
    next = { ...next, enemies };
    if (touched) next = respawnPlayer(next);
  }

  const playerCenterX = next.player.x + next.player.width / 2;
  if (playerCenterX >= next.map.goalX) {
    next = { ...next, status: 'clear' };
  } else if (next.elapsedSec >= next.map.timeLimitSec) {
    next = { ...next, status: 'failed' };
  }

  const cameraX = clamp(
    next.player.x + next.player.width / 2 - next.map.viewWidth / 2,
    0,
    Math.max(0, next.map.worldWidth - next.map.viewWidth),
  );
  return { ...next, cameraX };
}
