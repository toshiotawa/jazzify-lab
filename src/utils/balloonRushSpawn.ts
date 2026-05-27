/**
 * Balloon Rush spawn positions — keep in sync with iOS BalloonRushSpawn.swift
 */
import { BALLOON_RUSH_MAP_CONFIG } from '@/utils/balloonRushMap';

/** ステージ開始: キャラクター近傍の最初の風船 */
export const INITIAL_NEAR_PLAYER_MIN_PX = 60;
export const INITIAL_NEAR_PLAYER_MAX_PX = 100;
/** その他はプレイヤーからこれより遠く */
export const INITIAL_FAR_FROM_PLAYER_MIN_PX = 140;
/** 風船同士・再出現の最小距離 */
export const BETWEEN_BALLOONS_MIN_PX = 100;
/** 再出現時: プレイヤーとの最小距離 */
export const RESPAWN_FROM_PLAYER_MIN_PX = 120;
export const MAP_MARGIN_PX = 48;

export type RandomFn = () => number;

export interface XY {
  readonly x: number;
  readonly y: number;
}

export const hypotDist = (a: XY, b: XY): number => Math.hypot(a.x - b.x, a.y - b.y);

const clampToMap = (x: number, y: number, margin: number): XY => ({
  x: Math.min(BALLOON_RUSH_MAP_CONFIG.width - margin, Math.max(margin, x)),
  y: Math.min(BALLOON_RUSH_MAP_CONFIG.height - margin, Math.max(margin, y)),
});

const randomInRing = (
  cx: number,
  cy: number,
  minR: number,
  maxR: number,
  margin: number,
  rng: RandomFn,
): XY => {
  const r = minR + rng() * (maxR - minR);
  const ang = rng() * Math.PI * 2;
  const x = cx + Math.cos(ang) * r;
  const y = cy + Math.sin(ang) * r;
  return clampToMap(x, y, margin);
};

/** すべての拘束を満たすまで試行（失敗時はラスト候補） */
export const pickInitialFivePositions = (
  player: XY,
  margin: number,
  rng: RandomFn,
): readonly XY[] => {
  const out: XY[] = [];
  const first = randomInRing(
    player.x,
    player.y,
    INITIAL_NEAR_PLAYER_MIN_PX,
    INITIAL_NEAR_PLAYER_MAX_PX,
    margin,
    rng,
  );
  out.push(first);

  const maxAttempts = 60;
  for (let bi = 0; bi < 4; bi += 1) {
    let cand: XY = first;
    for (let a = 0; a < maxAttempts; a += 1) {
      const sx = margin + rng() * (BALLOON_RUSH_MAP_CONFIG.width - margin * 2);
      const sy = margin + rng() * (BALLOON_RUSH_MAP_CONFIG.height - margin * 2);
      const trial = clampToMap(sx, sy, margin);
      const dfp = hypotDist(player, trial);
      if (dfp < INITIAL_FAR_FROM_PLAYER_MIN_PX) {
        continue;
      }
      let ok = true;
      for (const o of out) {
        if (hypotDist(trial, o) < BETWEEN_BALLOONS_MIN_PX) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        continue;
      }
      cand = trial;
      break;
    }
    out.push(cand);
  }

  return out;
};

export const pickRespawnPosition = (
  player: XY,
  existing: readonly XY[],
  margin: number,
  rng: RandomFn,
): XY | null => {
  const maxAttempts = 120;
  for (let a = 0; a < maxAttempts; a += 1) {
    const sx = margin + rng() * (BALLOON_RUSH_MAP_CONFIG.width - margin * 2);
    const sy = margin + rng() * (BALLOON_RUSH_MAP_CONFIG.height - margin * 2);
    const trial = clampToMap(sx, sy, margin);
    if (hypotDist(player, trial) < RESPAWN_FROM_PLAYER_MIN_PX) {
      continue;
    }
    let ok = true;
    for (const o of existing) {
      if (hypotDist(trial, o) < BETWEEN_BALLOONS_MIN_PX) {
        ok = false;
        break;
      }
    }
    if (ok) return trial;
  }
  return null;
};
