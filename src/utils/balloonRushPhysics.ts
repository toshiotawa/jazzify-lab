import type { SurvivalGameState } from '@/components/survival/SurvivalTypes';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import type { BalloonRunState } from '@/utils/balloonRushEngine';
import { pickInitialFivePositions, pickRespawnPosition, MAP_MARGIN_PX } from '@/utils/balloonRushSpawn';
import { findBalloonsHitByMelee } from '@/utils/balloonRushMelee';
import { BALLOON_RUSH_MAP_CONFIG } from '@/utils/balloonRushMap';
import type { BalloonRushDrawSnapshot } from '@/components/balloonRush/balloonRushWorldDraw';

export type BalloonInst = BalloonRunState & { popped: boolean };

export interface BalloonRushPhysicsState {
  balloons: BalloonInst[];
  popped: number;
  respawnDue: number[];
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

export interface BalloonRushPhysicsTickResult {
  physics: BalloonRushPhysicsState;
  player: SurvivalGameState['player'];
  enemiesDefeated: number;
}

/** 1 ゲーム tick: 再出現のみ（期限切れ自動破裂・ノックバックなし）。 */
export const tickBalloonRushPhysics = (
  physics: BalloonRushPhysicsState,
  player: SurvivalGameState['player'],
  elapsed: number,
  stage: BalloonRushResolvedStage,
  _perfNow: number,
  _deltaTime: number,
  rng: () => number = Math.random,
): BalloonRushPhysicsTickResult => {
  const pl = { ...player, ...clampPlayerEdges(player.x, player.y) };

  let respawnDue = [...physics.respawnDue];
  let balloons = [...physics.balloons];
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
        id: `nr_${elapsed.toFixed(3)}_${Math.random().toString(36).slice(2)}`,
        x: spot.x,
        y: spot.y,
        spawnedAtSec: elapsed,
        lifetimeSec: stage.balloonLifetimeSec,
        popped: false,
      },
    ];
  }

  return {
    physics: {
      balloons,
      popped: physics.popped,
      respawnDue,
    },
    player: pl,
    enemiesDefeated: physics.popped,
  };
};

export const applyBalloonMeleeHits = (
  physics: BalloonRushPhysicsState,
  player: SurvivalGameState['player'],
  elapsed: number,
  stage: BalloonRushResolvedStage,
  _perfNow: number,
): BalloonRushPhysicsState => {
  const live = physics.balloons.filter(b => !b.popped);
  const hits = findBalloonsHitByMelee(player, live);
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
  };
};

export const buildBalloonRushDrawSnapshot = (
  player: SurvivalGameState['player'],
  physics: BalloonRushPhysicsState,
  jajiiX: number | null,
  jajiiY: number | null,
  _elapsed: number,
  nowPerfMs: number,
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
      visible: true,
    })),
  jajiiX,
  jajiiY,
  nowPerfMs,
});
