import { CHARACTER_DISPLAY_SIZE } from './earTrainingBattleLayout';
import {
  easeCubicOut,
  lerp,
} from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_SPARK_BURST_MS = 200;
export const JUST_PARRY_SPARK_COUNT = 24;
export const JUST_PARRY_BODY_GLOW_ORANGE = '#fb923c';
export const JUST_PARRY_BODY_GLOW_RED = '#ef4444';
export const JUST_PARRY_SPARK_CORE = '#fff7ed';
export const JUST_PARRY_SPARK_YELLOW = '#fbbf24';
export const JUST_PARRY_SPARK_ORANGE = '#fb923c';
export const JUST_PARRY_SPARK_RED = '#ef4444';

const JUST_PARRY_SPARK_GRAVITY = 420;
const JUST_PARRY_SPARK_MIN_SPEED = 380;
const JUST_PARRY_SPARK_MAX_SPEED = 1180;
const JUST_PARRY_SPARK_FRICTION = 7.5;
const JUST_PARRY_SPARK_COLORS = [
  JUST_PARRY_SPARK_CORE,
  JUST_PARRY_SPARK_YELLOW,
  JUST_PARRY_SPARK_ORANGE,
  JUST_PARRY_SPARK_RED,
] as const;

export interface JustParrySparkStreak {
  vx: number;
  vy: number;
  lengthPx: number;
  delayMs: number;
  colorIndex: number;
  friction: number;
}

export interface JustParryEffectState {
  active: boolean;
  startedAt: number;
  endAt: number;
  durationMs: number;
  originX: number;
  originY: number;
  contactX: number;
  contactY: number;
  imageKey: string;
  flipX: boolean;
  axisX: number;
  axisY: number;
  streaks: readonly JustParrySparkStreak[];
}

export const createJustParryEffectState = (): JustParryEffectState => ({
  active: false,
  startedAt: 0,
  endAt: 0,
  durationMs: 0,
  originX: 0,
  originY: 0,
  contactX: 0,
  contactY: 0,
  imageKey: '',
  flipX: false,
  axisX: 1,
  axisY: 0,
  streaks: [],
});

export const resolveJustParryEffectDurationMs = (
  hitPhraseTimeSec: number,
  nextTargetPhraseSec: number | undefined,
  fallbackEndPhraseSec: number | undefined,
  minDurationMs: number = JUST_PARRY_MIN_DURATION_MS,
): number => {
  if (
    nextTargetPhraseSec !== undefined
    && Number.isFinite(nextTargetPhraseSec)
    && nextTargetPhraseSec > hitPhraseTimeSec + BEAT_EPS
  ) {
    const midpointSec = hitPhraseTimeSec + (nextTargetPhraseSec - hitPhraseTimeSec) / 2;
    return Math.max(minDurationMs, Math.round((midpointSec - hitPhraseTimeSec) * 1000));
  }
  if (
    fallbackEndPhraseSec !== undefined
    && Number.isFinite(fallbackEndPhraseSec)
    && fallbackEndPhraseSec > hitPhraseTimeSec + BEAT_EPS
  ) {
    return Math.max(minDurationMs, Math.round((fallbackEndPhraseSec - hitPhraseTimeSec) * 1000));
  }
  return minDurationMs;
};

const seededUnit = (seed: number): number => {
  const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

interface JustParrySparkAxes {
  axisX: number;
  axisY: number;
  perpX: number;
  perpY: number;
  baseAngleRad: number;
}

const resolveJustParrySparkAxes = (
  originX: number,
  originY: number,
  contactX: number,
  contactY: number,
): JustParrySparkAxes => {
  const dx = contactX - originX;
  const dy = contactY - originY;
  const length = Math.hypot(dx, dy);
  const axisX = length > 1e-3 ? dx / length : 1;
  const axisY = length > 1e-3 ? dy / length : 0;
  return {
    axisX,
    axisY,
    perpX: -axisY,
    perpY: axisX,
    baseAngleRad: Math.atan2(axisY, axisX),
  };
};

const buildJustParrySparkStreaks = (
  axes: JustParrySparkAxes,
  seedBase: number,
): readonly JustParrySparkStreak[] => {
  const { axisX, axisY, perpX, perpY, baseAngleRad } = axes;
  const streaks: JustParrySparkStreak[] = [];

  for (let index = 0; index < JUST_PARRY_SPARK_COUNT; index += 1) {
    const seed = seedBase + index * 19.37;
    const fanT = seededUnit(seed);
    const fanAngle = (fanT - 0.5) * 1.8 - 0.35;
    const cos = Math.cos(fanAngle);
    const sin = Math.sin(fanAngle);
    const dirX = axisX * cos - perpX * sin;
    const dirY = axisY * cos - perpY * sin + (seededUnit(seed + 0.7) - 0.5) * 0.45;
    const dirLength = Math.hypot(dirX, dirY);
    const normDirX = dirX / dirLength;
    const normDirY = dirY / dirLength;
    const speed = lerp(
      JUST_PARRY_SPARK_MIN_SPEED,
      JUST_PARRY_SPARK_MAX_SPEED,
      seededUnit(seed + 2.4),
    );
    streaks.push({
      vx: normDirX * speed,
      vy: normDirY * speed,
      lengthPx: 6 + seededUnit(seed + 4.8) * 18,
      delayMs: Math.round(seededUnit(seed + 6.1) * 18),
      colorIndex: Math.floor(seededUnit(seed + 8.3) * JUST_PARRY_SPARK_COLORS.length),
      friction: 5.5 + seededUnit(seed + 9.9) * 4,
    });
  }

  // 追加の放射状ショートストリーク（全方位）
  for (let index = 0; index < 4; index += 1) {
    const seed = seedBase + index * 31.11 + 900;
    const angle = baseAngleRad + (seededUnit(seed) - 0.5) * Math.PI * 0.5;
    const speed = JUST_PARRY_SPARK_MIN_SPEED * (0.55 + seededUnit(seed + 1.2) * 0.35);
    streaks.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lengthPx: 4 + seededUnit(seed + 3.4) * 10,
      delayMs: 0,
      colorIndex: Math.floor(seededUnit(seed + 5.6) * JUST_PARRY_SPARK_COLORS.length),
      friction: 8 + seededUnit(seed + 7.1) * 3,
    });
  }

  return streaks;
};

export interface StartJustParryEffectParams {
  startedAt: number;
  durationMs: number;
  originX: number;
  originY: number;
  contactX: number;
  contactY: number;
  imageKey: string;
  flipX: boolean;
  seedBase: number;
}

export const startJustParryEffect = (
  state: JustParryEffectState,
  params: StartJustParryEffectParams,
): void => {
  const durationMs = Math.max(JUST_PARRY_MIN_DURATION_MS, Math.round(params.durationMs));
  const axes = resolveJustParrySparkAxes(
    params.originX,
    params.originY,
    params.contactX,
    params.contactY,
  );
  state.active = true;
  state.startedAt = params.startedAt;
  state.durationMs = durationMs;
  state.endAt = params.startedAt + durationMs;
  state.originX = params.originX;
  state.originY = params.originY;
  state.contactX = params.contactX;
  state.contactY = params.contactY;
  state.imageKey = params.imageKey;
  state.flipX = params.flipX;
  state.axisX = axes.axisX;
  state.axisY = axes.axisY;
  state.streaks = buildJustParrySparkStreaks(axes, params.seedBase);
};

export const clearJustParryEffect = (state: JustParryEffectState): void => {
  state.active = false;
  state.streaks = [];
};

export const isJustParryEffectActive = (
  state: JustParryEffectState,
  nowMs: number,
): boolean => state.active && nowMs < state.endAt;

export const pruneJustParryEffect = (
  state: JustParryEffectState,
  nowMs: number,
): void => {
  if (state.active && nowMs >= state.endAt) {
    clearJustParryEffect(state);
  }
};

export const getJustParryEffectAlpha = (
  state: JustParryEffectState,
  nowMs: number,
): number => {
  if (!isJustParryEffectActive(state, nowMs)) {
    return 0;
  }
  const elapsed = nowMs - state.startedAt;
  const fadeStart = state.durationMs * 0.72;
  if (elapsed <= fadeStart) {
    return 1;
  }
  const fadeT = (elapsed - fadeStart) / Math.max(1, state.durationMs - fadeStart);
  return 1 - easeCubicOut(Math.min(1, fadeT));
};

interface JustParrySparkDrawParams {
  x: number;
  y: number;
  tailX: number;
  tailY: number;
  streakAlpha: number;
}

const computeSparkVelocity = (
  streak: JustParrySparkStreak,
  t: number,
): { vx: number; vy: number } => {
  const decay = Math.exp(-streak.friction * t);
  return {
    vx: streak.vx * decay,
    vy: streak.vy * decay + JUST_PARRY_SPARK_GRAVITY * t,
  };
};

const computeJustParrySparkDrawParams = (
  streak: JustParrySparkStreak,
  originX: number,
  originY: number,
  elapsedMs: number,
  alpha: number,
): JustParrySparkDrawParams | null => {
  const localElapsed = Math.max(0, elapsedMs - streak.delayMs);
  const t = localElapsed / 1000;
  if (t <= 0) {
    return null;
  }

  const { vx, vy } = computeSparkVelocity(streak, t);
  const speed = Math.hypot(vx, vy);
  if (speed < 8) {
    return null;
  }

  const frictionIntegral = streak.friction > 1e-6
    ? (1 - Math.exp(-streak.friction * t)) / streak.friction
    : t;
  const x = originX + streak.vx * frictionIntegral;
  const y = originY + streak.vy * frictionIntegral + 0.5 * JUST_PARRY_SPARK_GRAVITY * t * t;
  const lineLength = streak.lengthPx * Math.min(1.8, 0.35 + speed / 520);
  const normVx = vx / speed;
  const normVy = vy / speed;
  const travelT = Math.min(1, localElapsed / JUST_PARRY_SPARK_BURST_MS);
  const streakAlpha = alpha * (1 - travelT * 0.55);

  return {
    x,
    y,
    tailX: x - normVx * lineLength,
    tailY: y - normVy * lineLength,
    streakAlpha,
  };
};

const drawJustParryImpactFlash = (
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  burstEase: number,
  alpha: number,
): void => {
  const radius = lerp(8, 42, burstEase);
  const gradient = ctx.createRadialGradient(originX, originY, 0, originX, originY, radius);
  gradient.addColorStop(0, `rgba(255, 247, 237, ${alpha * 0.95})`);
  gradient.addColorStop(0.35, `rgba(251, 191, 36, ${alpha * 0.72})`);
  gradient.addColorStop(0.72, `rgba(251, 146, 60, ${alpha * 0.38})`);
  gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(originX, originY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawJustParrySparkStreak = (
  ctx: CanvasRenderingContext2D,
  streak: JustParrySparkStreak,
  params: JustParrySparkDrawParams,
): void => {
  const color = JUST_PARRY_SPARK_COLORS[streak.colorIndex % JUST_PARRY_SPARK_COLORS.length];
  const gradient = ctx.createLinearGradient(params.tailX, params.tailY, params.x, params.y);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
  gradient.addColorStop(0.35, JUST_PARRY_SPARK_ORANGE);
  gradient.addColorStop(0.72, JUST_PARRY_SPARK_YELLOW);
  gradient.addColorStop(1, color);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = params.streakAlpha;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.4 + streak.lengthPx * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(params.tailX, params.tailY);
  ctx.lineTo(params.x, params.y);
  ctx.stroke();

  ctx.globalAlpha = params.streakAlpha * 0.85;
  ctx.fillStyle = JUST_PARRY_SPARK_CORE;
  ctx.beginPath();
  ctx.arc(params.x, params.y, 1.2 + streak.lengthPx * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawJustParrySparks = (
  ctx: CanvasRenderingContext2D,
  state: JustParryEffectState,
  nowMs: number,
): void => {
  if (!isJustParryEffectActive(state, nowMs)) {
    return;
  }

  const alpha = getJustParryEffectAlpha(state, nowMs);
  if (alpha <= 0) {
    return;
  }

  const elapsed = nowMs - state.startedAt;
  const burstT = Math.min(1, elapsed / JUST_PARRY_SPARK_BURST_MS);
  const burstEase = easeCubicOut(burstT);

  ctx.save();
  drawJustParryImpactFlash(ctx, state.originX, state.originY, burstEase, alpha);

  for (let index = 0; index < state.streaks.length; index += 1) {
    const streak = state.streaks[index];
    const drawParams = computeJustParrySparkDrawParams(
      streak,
      state.originX,
      state.originY,
      elapsed,
      alpha,
    );
    if (!drawParams) {
      continue;
    }
    drawJustParrySparkStreak(ctx, streak, drawParams);
  }

  ctx.restore();
};

const bodyGlowCache = new Map<string, HTMLCanvasElement>();

const getBodyGlowCacheKey = (
  imageSrc: string,
  width: number,
  height: number,
): string => `${imageSrc}|${Math.round(width)}|${Math.round(height)}`;

const buildBodyGlowCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const key = getBodyGlowCacheKey(img.src, width, height);
  const cached = bodyGlowCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.drawImage(img, 0, 0, width, height);
  ctx.globalCompositeOperation = 'source-in';
  const gradient = ctx.createLinearGradient(0, 0, width * 0.35, height);
  gradient.addColorStop(0, JUST_PARRY_SPARK_YELLOW);
  gradient.addColorStop(0.45, JUST_PARRY_BODY_GLOW_ORANGE);
  gradient.addColorStop(1, JUST_PARRY_BODY_GLOW_RED);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  bodyGlowCache.set(key, canvas);
  return canvas;
};

export const drawJustParryBodyGlow = (
  ctx: CanvasRenderingContext2D,
  state: JustParryEffectState,
  loadedImages: Map<string, HTMLImageElement>,
  playerX: number,
  floorY: number,
  yOffset: number,
  rotationDeg: number,
  nowMs: number,
): void => {
  if (!isJustParryEffectActive(state, nowMs)) {
    return;
  }

  const img = loadedImages.get(state.imageKey);
  if (!img) {
    return;
  }

  const alpha = getJustParryEffectAlpha(state, nowMs);
  if (alpha <= 0) {
    return;
  }

  const pulse = 0.88 + Math.sin((nowMs - state.startedAt) / 70) * 0.12;
  const drawW = CHARACTER_DISPLAY_SIZE;
  const drawH = CHARACTER_DISPLAY_SIZE;
  const glowCanvas = buildBodyGlowCanvas(img, drawW, drawH);
  if (!glowCanvas) {
    return;
  }

  ctx.save();
  ctx.translate(playerX, floorY + yOffset);
  ctx.rotate(rotationDeg * Math.PI / 180);

  const drawX = -drawW / 2;
  const drawY = -drawH;
  const flip = state.flipX;

  ctx.save();
  if (flip) {
    ctx.scale(-1, 1);
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.45 * pulse;
  ctx.drawImage(glowCanvas, flip ? -drawW / 2 : drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.save();
  if (flip) {
    ctx.scale(-1, 1);
  }
  const rimScale = 1.06;
  const rimW = drawW * rimScale;
  const rimH = drawH * rimScale;
  const rimX = (flip ? -rimW / 2 : drawX) - (rimW - drawW) * 0.5;
  const rimY = drawY - (rimH - drawH) * 0.5;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.34 * pulse;
  ctx.drawImage(glowCanvas, rimX, rimY, rimW, rimH);
  ctx.restore();

  ctx.restore();
};
