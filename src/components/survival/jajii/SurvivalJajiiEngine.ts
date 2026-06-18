/**
 * ジャ爺サポート（「移動する必殺技発生装置」）。
 * iOS `SurvivalJajiiEngine.swift` と仕様・定数を手動同期すること。
 *
 * プレイヤー周囲を「漂う」: 追いついたら静止。プレイヤーが離れたときだけ
 * リング上の目的地点へ1 leg 歩いて再び静止。移動中はターゲット固定。
 */

import type { SurvivalMapCategory } from '@/components/survival/SurvivalTypes';

/** 目的地点抽選: プレイヤーからの最小距離（px） */
export const JAJII_MIN_RADIUS = 60;
/** 目的地点抽選: プレイヤーからの最大距離（px） */
export const JAJII_MAX_RADIUS = 180;
/** この距離より離れたら追いつき歩行を開始（px） */
export const JAJII_FOLLOW_TRIGGER_RADIUS = JAJII_MAX_RADIUS;
/** 目的地点到着とみなす距離（px） */
export const JAJII_ARRIVE_EPS = 4;
/** A/B 通常発動からミニ必殺までの遅延（秒） */
export const JAJII_MINI_DELAY_SEC = 2;
/** ミニ必殺の半径はプレイヤー必殺相当半径に対する倍率 */
export const JAJII_MINI_RADIUS_MULTIPLIER = 1 / 2;
/** demo_play: 出現時プレイヤー位置からの固定オフセット（やや右下） */
export const JAJII_TUTORIAL_DEMO_OFFSET_X = 72;
export const JAJII_TUTORIAL_DEMO_OFFSET_Y = 56;

/** プレイヤー基底移動速度に対するジャ爺の倍率 */
export const JAJII_MOVE_SPEED_MULTIPLIER = 0.8;
/** 歩行速度（Web プレイヤー基底 150 px/s × 0.8） */
export const JAJII_MOVE_SPEED_PX_PER_SEC = 150 * JAJII_MOVE_SPEED_MULTIPLIER;
/** ミニ必殺予約中の移動減衰 */
export const JAJII_MOVE_SLOWDOWN_WHILE_PENDING = 0.7;

export interface JajiiSupportEnableParams {
  readonly isStageMode: boolean;
  readonly scenarioMode: boolean;
  readonly survivalTutorialLayout: boolean;
  readonly mapCategory: SurvivalMapCategory | undefined;
  readonly tutorialDialogueJajii?: boolean;
  /** 大譜表モード（両手ヴォイシングコース等）。lesson カテゴリでもジャ爺を有効化する。 */
  readonly grandStaffMode?: boolean;
}

export interface JajiiState {
  worldX: number;
  worldY: number;
  targetWorldX: number;
  targetWorldY: number;
  pendingMiniFireAtSec: number | null;
}

export const pickRandomRingOffset = (minR: number, maxR: number): { x: number; y: number } => {
  const angle = Math.random() * Math.PI * 2;
  const r = minR + Math.random() * (maxR - minR);
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
};

/** offset ベクトルの長さを [minLen, maxLen] に収める（テスト・補助） */
export const clampOffsetRing = (
  ox: number,
  oy: number,
  minLen: number,
  maxLen: number,
): { x: number; y: number } => {
  const len = Math.hypot(ox, oy);
  if (len < 1e-6) {
    return pickRandomRingOffset(minLen, maxLen);
  }
  const clampedLen = Math.min(maxLen, Math.max(minLen, len));
  const s = clampedLen / len;
  return { x: ox * s, y: oy * s };
};

const pickDriftTargetNearPlayer = (
  playerX: number,
  playerY: number,
): { x: number; y: number } => {
  const ring = pickRandomRingOffset(JAJII_MIN_RADIUS, JAJII_MAX_RADIUS);
  return { x: playerX + ring.x, y: playerY + ring.y };
};

const distToTarget = (state: JajiiState): number =>
  Math.hypot(state.targetWorldX - state.worldX, state.targetWorldY - state.worldY);

const distFromPlayer = (state: JajiiState, playerX: number, playerY: number): number =>
  Math.hypot(state.worldX - playerX, state.worldY - playerY);

const isRestingAtTarget = (state: JajiiState): boolean =>
  distToTarget(state) < JAJII_ARRIVE_EPS;

export const shouldEnableJajiiSupport = (p: JajiiSupportEnableParams): boolean => {
  if (p.tutorialDialogueJajii) {
    return p.isStageMode;
  }
  if (!p.isStageMode || p.scenarioMode || p.survivalTutorialLayout) {
    return false;
  }
  if (p.mapCategory === undefined) {
    return false;
  }
  // 大譜表モードは lesson カテゴリ（両手ヴォイシングコース等）でもジャ爺を有効化する。
  if (p.mapCategory === 'lesson') {
    return p.grandStaffMode === true;
  }
  return true;
};

/** demo_play: 出現時のプレイヤー位置 + 固定オフセット（やや右下）でスポーン。以降ワールド座標固定。 */
export const createTutorialDemoFixedJajiiState = (
  playerX: number,
  playerY: number,
): JajiiState => {
  const x = playerX + JAJII_TUTORIAL_DEMO_OFFSET_X;
  const y = playerY + JAJII_TUTORIAL_DEMO_OFFSET_Y;
  return {
    worldX: x,
    worldY: y,
    targetWorldX: x,
    targetWorldY: y,
    pendingMiniFireAtSec: null,
  };
};

export const createInitialJajiiState = (
  playerX: number,
  playerY: number,
): JajiiState => {
  const spawn = pickRandomRingOffset(JAJII_MIN_RADIUS, JAJII_MAX_RADIUS);
  const target = pickDriftTargetNearPlayer(playerX, playerY);
  return {
    worldX: playerX + spawn.x,
    worldY: playerY + spawn.y,
    targetWorldX: target.x,
    targetWorldY: target.y,
    pendingMiniFireAtSec: null,
  };
};

/**
 * 追いつき中のみ歩行。到着後は静止し、プレイヤーが離れたときだけ次 leg へ。
 */
export const updateJajiiMovementInPlace = (
  state: JajiiState,
  playerX: number,
  playerY: number,
  _elapsedSec: number,
  deltaSec: number,
  moveSpeedPxPerSec: number = JAJII_MOVE_SPEED_PX_PER_SEC,
): void => {
  if (isRestingAtTarget(state)) {
    if (distFromPlayer(state, playerX, playerY) <= JAJII_FOLLOW_TRIGGER_RADIUS) {
      return;
    }
    const next = pickDriftTargetNearPlayer(playerX, playerY);
    state.targetWorldX = next.x;
    state.targetWorldY = next.y;
  }

  const dx = state.targetWorldX - state.worldX;
  const dy = state.targetWorldY - state.worldY;
  const remaining = Math.hypot(dx, dy);

  if (remaining < JAJII_ARRIVE_EPS) {
    state.worldX = state.targetWorldX;
    state.worldY = state.targetWorldY;
    return;
  }

  const slowdown = state.pendingMiniFireAtSec !== null ? JAJII_MOVE_SLOWDOWN_WHILE_PENDING : 1;
  const step = moveSpeedPxPerSec * deltaSec * slowdown;

  if (remaining <= step) {
    state.worldX = state.targetWorldX;
    state.worldY = state.targetWorldY;
  } else {
    state.worldX += (dx / remaining) * step;
    state.worldY += (dy / remaining) * step;
  }
};

export const getJajiiWorldPosition = (state: JajiiState): { x: number; y: number } => ({
  x: state.worldX,
  y: state.worldY,
});

export const tryScheduleMiniSpecial = (state: JajiiState, nowSec: number): boolean => {
  if (state.pendingMiniFireAtSec !== null) return false;
  state.pendingMiniFireAtSec = nowSec + JAJII_MINI_DELAY_SEC;
  return true;
};

export const consumeDueMiniSpecialIfDue = (state: JajiiState, nowSec: number): boolean => {
  if (state.pendingMiniFireAtSec === null) return false;
  if (nowSec < state.pendingMiniFireAtSec) return false;
  state.pendingMiniFireAtSec = null;
  return true;
};
