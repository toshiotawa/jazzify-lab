import type { SurvivalGameState } from '@/components/survival/SurvivalTypes';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import type { BalloonRunState } from '@/utils/balloonRushEngine';
import { balloonBlinkVisibleAt, isBalloonExpired } from '@/utils/balloonRushEngine';
import { pickInitialFivePositions, pickRespawnPosition, MAP_MARGIN_PX } from '@/utils/balloonRushSpawn';
import {
  createMeleeShockwaveBurst,
  findBalloonsHitByMelee,
  knockVelocityFromBalloonBurst,
} from '@/utils/balloonRushMelee';
import type { ShockwaveBurst } from '@/utils/balloonRushMelee';
import { SHOCKWAVE_DURATION } from '@/components/survival/SurvivalTypes';
import { BALLOON_RUSH_MAP_CONFIG } from '@/utils/balloonRushMap';
import type { BalloonRushDrawSnapshot } from '@/components/balloonRush/balloonRushWorldDraw';

export type BalloonInst = BalloonRunState & { popped: boolean };

export interface BalloonRushPhysicsState {
  balloons: BalloonInst[];
  popped: number;
  respawnDue: number[];
  knockVx: number;
  knockVy: number;
  shockwaves: readonly ShockwaveBurst[];
}

export const createBalloonRushPhysicsState = (
  player: { x: number; y: number },
  stage: BalloonRushResolvedStage,
  rng: () => number = Math.random,
): BalloonRushPhysicsState => {
  const positions = pickInitialFivePositions({ x: player.x, y: player.y }, MAP_MARGIN_PX, rng);
  return {
    balloons: positions.map((p, i) => ({
      id: `b_${i}_${Date.now()}`,
      x: p.x,
      y: p.y,
      spawnedAtSec: 0,
      lifetimeSec: stage.balloonLifetimeSec,
      popped: false,
    })),
    popped: 0,
    respawnDue: [],
    knockVx: 0,
    knockVy: 0,
    shockwaves: [],
  };
};

const mergeQueues = (prev: readonly number[], adds: readonly number[]): number[] =>
  [...prev, ...adds].slice().sort((a, b) => a - b);

const clampPlayerEdges = (px: number, py: number): { x: number; y: number } => {
  const half = 16;
  const w = BALLOON_RUSH_MAP_CONFIG.width;
  const h = BALLOON_RUSH_MAP_CONFIG.height;
  return {
    x: Math.max(half, Math.min(px, w - half)),
    y: Math.max(half, Math.min(py, h - half)),
  };
};

const applyExpandingShockwaveKnockback = (
  shockwaves: readonly ShockwaveBurst[],
  player: { x: number; y: number },
  perfNow: number,
  knockbackForce: number,
): { vx: number; vy: number } => {
  let addVx = 0;
  let addVy = 0;
  for (const w of shockwaves) {
    const ageSec = (perfNow - w.startPerfMs) / 1000;
    if (ageSec < 0 || ageSec >= SHOCKWAVE_DURATION) continue;
    const t = ageSec / SHOCKWAVE_DURATION;
    const radius = w.maxRadius * t;
    const dx = player.x - w.x;
    const dy = player.y - w.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-3 || dist >= radius + 16) continue;
    addVx += (dx / dist) * knockbackForce * 0.4;
    addVy += (dy / dist) * knockbackForce * 0.4;
  }
  return { vx: addVx, vy: addVy };
};

export interface BalloonRushPhysicsTickResult {
  physics: BalloonRushPhysicsState;
  player: SurvivalGameState['player'];
  enemiesDefeated: number;
  shockwaves: readonly ShockwaveBurst[];
}

/** 1 ゲーム tick: ノックバック・期限切れ・再出現（敵ロジックは呼び出し側でスキップ）。 */
export const tickBalloonRushPhysics = (
  physics: BalloonRushPhysicsState,
  player: SurvivalGameState['player'],
  elapsed: number,
  stage: BalloonRushResolvedStage,
  perfNow: number,
  deltaTime: number,
  rng: () => number = Math.random,
): BalloonRushPhysicsTickResult => {
  let knockVx = physics.knockVx;
  let knockVy = physics.knockVy;
  let pl = { ...player, x: player.x + knockVx * deltaTime, y: player.y + knockVy * deltaTime };
  knockVx *= 0.9;
  knockVy *= 0.9;
  pl = { ...pl, ...clampPlayerEdges(pl.x, pl.y) };

  const kbForce = 150 + pl.skills.bKnockbackBonus * 50;
  let respawnDue = [...physics.respawnDue];
  let shockwaves = [...physics.shockwaves];
  const nextBs: BalloonInst[] = [];
  for (const b of physics.balloons) {
    if (b.popped) {
      nextBs.push(b);
      continue;
    }
    if (!isBalloonExpired(b, elapsed)) {
      nextBs.push(b);
      continue;
    }
    const vv = knockVelocityFromBalloonBurst({ x: b.x, y: b.y }, { x: pl.x, y: pl.y }, kbForce);
    knockVx += vv.vx;
    knockVy += vv.vy;
    respawnDue = mergeQueues(respawnDue, [elapsed + stage.respawnDelaySec]);
    shockwaves = [
      ...shockwaves,
      { id: `ex_${b.id}`, x: b.x, y: b.y, maxRadius: 90, startPerfMs: perfNow },
    ];
    nextBs.push({ ...b, popped: true });
  }

  let balloons = nextBs;
  respawnDue = [...respawnDue].sort((a, b) => a - b);
  const liveBs = (): BalloonInst[] => balloons.filter(bb => !bb.popped);
  const maxConc = stage.maxConcurrent;
  while (respawnDue.length > 0 && respawnDue[0] <= elapsed) {
    if (liveBs().length >= maxConc) break;
    respawnDue.shift();
    const spot = pickRespawnPosition({ x: pl.x, y: pl.y }, liveBs(), MAP_MARGIN_PX, rng);
    if (!spot) {
      respawnDue.push(elapsed + 0.12);
      respawnDue.sort((a, b) => a - b);
      break;
    }
    balloons = [
      ...balloons,
      {
        id: `nr_${perfNow.toFixed(3)}_${Math.random().toString(36).slice(2)}`,
        x: spot.x,
        y: spot.y,
        spawnedAtSec: elapsed,
        lifetimeSec: stage.balloonLifetimeSec,
        popped: false,
      },
    ];
  }

  shockwaves = shockwaves.filter(s => perfNow - s.startPerfMs < SHOCKWAVE_DURATION);

  const waveKnock = applyExpandingShockwaveKnockback(shockwaves, pl, perfNow, kbForce);
  knockVx += waveKnock.vx;
  knockVy += waveKnock.vy;

  return {
    physics: {
      balloons,
      popped: physics.popped,
      respawnDue,
      knockVx,
      knockVy,
      shockwaves,
    },
    player: pl,
    enemiesDefeated: physics.popped,
    shockwaves,
  };
};

export const applyBalloonMeleeHits = (
  physics: BalloonRushPhysicsState,
  player: SurvivalGameState['player'],
  elapsed: number,
  stage: BalloonRushResolvedStage,
  perfNow: number,
): BalloonRushPhysicsState => {
  const live = physics.balloons.filter(b => !b.popped);
  const hits = findBalloonsHitByMelee(player, live);
  let shockwaves: readonly ShockwaveBurst[] = [
    ...physics.shockwaves,
    createMeleeShockwaveBurst(player, perfNow),
  ];
  for (const id of hits) {
    const b = physics.balloons.find(bb => bb.id === id);
    if (b) {
      shockwaves = [
        ...shockwaves,
        { id: `ex_${id}`, x: b.x, y: b.y, maxRadius: 90, startPerfMs: perfNow },
      ];
    }
  }
  const balloons = physics.balloons.map(b =>
    hits.includes(b.id) ? { ...b, popped: true } : b,
  );
  return {
    ...physics,
    balloons,
    popped: physics.popped + hits.length,
    respawnDue: mergeQueues(
      physics.respawnDue,
      hits.map(() => elapsed + stage.respawnDelaySec),
    ),
    shockwaves,
  };
};

export const buildBalloonRushDrawSnapshot = (
  player: SurvivalGameState['player'],
  physics: BalloonRushPhysicsState,
  jajiiX: number | null,
  jajiiY: number | null,
  elapsed: number,
  perfNow: number,
): BalloonRushDrawSnapshot => ({
  playerX: player.x,
  playerY: player.y,
  playerDirection: player.direction,
  balloons: physics.balloons
    .filter(b => !b.popped)
    .map(b => ({
      id: b.id,
      x: b.x,
      y: b.y,
      visible: balloonBlinkVisibleAt(b, elapsed),
    })),
  jajiiX,
  jajiiY,
  shockwaves: [...physics.shockwaves],
  nowPerfMs: perfNow,
});
