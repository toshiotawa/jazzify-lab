/**
 * サバイバル仮想スティック: タッチオフセットからアナログ入力 (0〜1 強度 × 方向) を生成し、
 * ゲームループ側でスムージングするためのユーティリティ。
 */

/** デッドゾーンを最大半径に対する比率で指定（例: 0.12 = 12%） */
export const SURVIVAL_STICK_DEAD_ZONE_FRACTION = 0.12;

/** アナログ目標値への追従（大きいほど素早く反応） */
export const SURVIVAL_STICK_SMOOTHING_LAMBDA = 16;

/**
 * スティック中心からのオフセット（ピクセル、既に最大半径でクランプ済みでも可）から
 * 方向単位ベクトル × 強度(0〜1) を返す。デッドゾーン内は (0,0)。
 */
export const computeAnalogFromOffset = (
  dx: number,
  dy: number,
  maxRadius: number,
  deadZoneFraction: number
): { x: number; y: number } => {
  if (maxRadius <= 0) {
    return { x: 0, y: 0 };
  }
  const dist = Math.hypot(dx, dy);
  const dead = maxRadius * deadZoneFraction;
  if (dist <= dead) {
    return { x: 0, y: 0 };
  }
  const nx = dx / dist;
  const ny = dy / dist;
  const clampedDist = Math.min(dist, maxRadius);
  const mag = (clampedDist - dead) / (maxRadius - dead);
  return { x: nx * mag, y: ny * mag };
};

/**
 * 目標アナログへ指数補間（deltaTime ベースでフレームレートに依存しにくい）。
 */
export const smoothAnalogToward = (
  current: { x: number; y: number },
  target: { x: number; y: number },
  deltaTime: number,
  lambda: number
): { x: number; y: number } => {
  const t = 1 - Math.exp(-lambda * deltaTime);
  return {
    x: current.x + (target.x - current.x) * t,
    y: current.y + (target.y - current.y) * t,
  };
};
