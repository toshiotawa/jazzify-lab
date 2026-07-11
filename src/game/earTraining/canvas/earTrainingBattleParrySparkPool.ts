/** OSMD パリィ成功時の溶接火花パーティクル（オブジェクトプール）。 */

export const PARRY_SPARK_POOL_SIZE = 128;
export const PARRY_SPARK_COUNT = 32;
export const PARRY_SPARK_CHAIN_COUNT = 44;
/** 粒の寿命（壁時計）。短めで溶接火花感を出す */
export const PARRY_SPARK_DURATION_MS = 280;
export const PARRY_SPARK_DURATION_JITTER_MS = 80;
/** 画面短辺に対するヒット時シェイク強度（Phaser intensity 相当） */
export const PARRY_HIT_CAMERA_SHAKE_INTENSITY = 0.01;
export const PARRY_HIT_CAMERA_SHAKE_MS = 60;

const GRAVITY_PX_PER_MS2 = 0.0024;
const SPEED_MIN_PX_PER_MS = 0.22;
const SPEED_MAX_PX_PER_MS = 0.72;
/** 上半球寄り（溶接の跳ね上げ） */
const ANGLE_UP_BIAS = -Math.PI / 2;
const ANGLE_SPREAD = Math.PI * 0.95;
const STREAK_MS = 18;
const SIZE_MIN = 1.1;
const SIZE_MAX = 2.4;

const SPARK_COLORS = [
  '#fffbeb',
  '#fef08a',
  '#fde047',
  '#fb923c',
  '#fdba74',
] as const;

export interface ParrySparkSlot {
  active: boolean;
  startedAt: number;
  durationMs: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  colorIndex: number;
}

export const createParrySparkPool = (): ParrySparkSlot[] =>
  Array.from({ length: PARRY_SPARK_POOL_SIZE }, (): ParrySparkSlot => ({
    active: false,
    startedAt: 0,
    durationMs: PARRY_SPARK_DURATION_MS,
    originX: 0,
    originY: 0,
    vx: 0,
    vy: 0,
    size: SIZE_MIN,
    colorIndex: 0,
  }));

export const clearParrySparkPool = (pool: ParrySparkSlot[]): void => {
  for (let index = 0; index < pool.length; index += 1) {
    pool[index].active = false;
  }
};

export const hasActiveParrySparks = (pool: ParrySparkSlot[], nowMs: number): boolean => {
  for (let index = 0; index < pool.length; index += 1) {
    const slot = pool[index];
    if (slot.active && nowMs - slot.startedAt < slot.durationMs) {
      return true;
    }
  }
  return false;
};

export const pruneParrySparkPool = (pool: ParrySparkSlot[], nowMs: number): void => {
  for (let index = 0; index < pool.length; index += 1) {
    const slot = pool[index];
    if (slot.active && nowMs - slot.startedAt >= slot.durationMs) {
      slot.active = false;
    }
  }
};

export const spawnParrySparks = (
  pool: ParrySparkSlot[],
  originX: number,
  originY: number,
  startedAt: number,
  isChainParry: boolean,
): number => {
  const count = isChainParry ? PARRY_SPARK_CHAIN_COUNT : PARRY_SPARK_COUNT;
  let spawned = 0;
  let cursor = 0;

  while (spawned < count && cursor < pool.length) {
    const slot = pool[cursor];
    cursor += 1;
    if (slot.active) continue;

    const angle = ANGLE_UP_BIAS + (Math.random() - 0.5) * ANGLE_SPREAD;
    const speed = SPEED_MIN_PX_PER_MS
      + Math.random() * (SPEED_MAX_PX_PER_MS - SPEED_MIN_PX_PER_MS);
    slot.active = true;
    slot.startedAt = startedAt;
    slot.durationMs = PARRY_SPARK_DURATION_MS
      + Math.floor((Math.random() - 0.5) * 2 * PARRY_SPARK_DURATION_JITTER_MS);
    slot.originX = originX;
    slot.originY = originY;
    slot.vx = Math.cos(angle) * speed;
    slot.vy = Math.sin(angle) * speed;
    slot.size = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN);
    slot.colorIndex = Math.floor(Math.random() * SPARK_COLORS.length);
    spawned += 1;
  }
  return spawned;
};

const scratchPos = { x: 0, y: 0, tx: 0, ty: 0, alpha: 0 };

const sampleSparkAtAge = (
  slot: ParrySparkSlot,
  ageMs: number,
): typeof scratchPos | null => {
  if (ageMs < 0 || ageMs >= slot.durationMs) {
    return null;
  }
  const t = ageMs / slot.durationMs;
  const x = slot.originX + slot.vx * ageMs;
  const y = slot.originY + slot.vy * ageMs + 0.5 * GRAVITY_PX_PER_MS2 * ageMs * ageMs;
  const vx = slot.vx;
  const vy = slot.vy + GRAVITY_PX_PER_MS2 * ageMs;
  scratchPos.x = x;
  scratchPos.y = y;
  scratchPos.tx = x - vx * STREAK_MS;
  scratchPos.ty = y - vy * STREAK_MS;
  scratchPos.alpha = (1 - t) * (1 - t * 0.35);
  return scratchPos;
};

export const drawParrySparks = (
  ctx: CanvasRenderingContext2D,
  pool: ParrySparkSlot[],
  nowMs: number,
): void => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';

  for (let index = 0; index < pool.length; index += 1) {
    const slot = pool[index];
    if (!slot.active) continue;
    const ageMs = nowMs - slot.startedAt;
    const sample = sampleSparkAtAge(slot, ageMs);
    if (!sample || sample.alpha <= 0.01) {
      if (ageMs >= slot.durationMs) {
        slot.active = false;
      }
      continue;
    }

    const color = SPARK_COLORS[slot.colorIndex] ?? SPARK_COLORS[0];
    ctx.strokeStyle = color;
    ctx.globalAlpha = sample.alpha;
    ctx.lineWidth = slot.size;
    ctx.beginPath();
    ctx.moveTo(sample.tx, sample.ty);
    ctx.lineTo(sample.x, sample.y);
    ctx.stroke();

    // 先端の白い粒
    ctx.fillStyle = '#fffbeb';
    ctx.globalAlpha = sample.alpha * 0.9;
    ctx.beginPath();
    ctx.arc(sample.x, sample.y, slot.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};
