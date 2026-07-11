import { CHARACTER_DISPLAY_SIZE } from './earTrainingBattleLayout';
import {
  easeCubicOut,
  lerp,
} from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_INK_BURST_MS = 220;
export const JUST_PARRY_INK_DROPLET_COUNT = 16;
export const JUST_PARRY_BODY_GLOW_BLUE = '#38bdf8';
export const JUST_PARRY_BODY_GLOW_PURPLE = '#c084fc';
export const JUST_PARRY_INK_BLUE = '#2563eb';
export const JUST_PARRY_INK_PURPLE = '#9333ea';

export interface JustParryInkDroplet {
  dirX: number;
  dirY: number;
  distancePx: number;
  sizePx: number;
  delayMs: number;
  stretch: number;
}

export interface JustParryEffectState {
  active: boolean;
  startedAt: number;
  endAt: number;
  durationMs: number;
  playerBodyX: number;
  playerBodyY: number;
  contactX: number;
  contactY: number;
  imageKey: string;
  flipX: boolean;
  droplets: readonly JustParryInkDroplet[];
}

export const createJustParryEffectState = (): JustParryEffectState => ({
  active: false,
  startedAt: 0,
  endAt: 0,
  durationMs: 0,
  playerBodyX: 0,
  playerBodyY: 0,
  contactX: 0,
  contactY: 0,
  imageKey: '',
  flipX: false,
  droplets: [],
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

const buildJustParryDroplets = (
  playerBodyX: number,
  playerBodyY: number,
  contactX: number,
  contactY: number,
  seedBase: number,
): readonly JustParryInkDroplet[] => {
  const dx = contactX - playerBodyX;
  const dy = contactY - playerBodyY;
  const length = Math.hypot(dx, dy);
  const axisX = length > 1e-3 ? dx / length : 1;
  const axisY = length > 1e-3 ? dy / length : 0;
  const perpX = -axisY;
  const perpY = axisX;
  const droplets: JustParryInkDroplet[] = [];

  for (let index = 0; index < JUST_PARRY_INK_DROPLET_COUNT; index += 1) {
    const seed = seedBase + index * 17.13;
    const along = seededUnit(seed);
    const lateral = (seededUnit(seed + 1.7) - 0.5) * 2;
    const dirX = axisX * 0.72 + perpX * lateral * 0.68;
    const dirY = axisY * 0.72 + perpY * lateral * 0.68;
    const dirLength = Math.hypot(dirX, dirY);
    droplets.push({
      dirX: dirX / dirLength,
      dirY: dirY / dirLength,
      distancePx: 24 + seededUnit(seed + 3.1) * 72,
      sizePx: 5 + seededUnit(seed + 4.9) * 16,
      delayMs: Math.round(seededUnit(seed + 6.2) * 36),
      stretch: 0.8 + seededUnit(seed + 8.4) * 1.6,
    });
  }

  return droplets;
};

export interface StartJustParryEffectParams {
  startedAt: number;
  durationMs: number;
  playerBodyX: number;
  playerBodyY: number;
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
  state.active = true;
  state.startedAt = params.startedAt;
  state.durationMs = durationMs;
  state.endAt = params.startedAt + durationMs;
  state.playerBodyX = params.playerBodyX;
  state.playerBodyY = params.playerBodyY;
  state.contactX = params.contactX;
  state.contactY = params.contactY;
  state.imageKey = params.imageKey;
  state.flipX = params.flipX;
  state.droplets = buildJustParryDroplets(
    params.playerBodyX,
    params.playerBodyY,
    params.contactX,
    params.contactY,
    params.seedBase,
  );
};

export const clearJustParryEffect = (state: JustParryEffectState): void => {
  state.active = false;
  state.droplets = [];
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
  gradient.addColorStop(0, JUST_PARRY_BODY_GLOW_BLUE);
  gradient.addColorStop(0.55, '#818cf8');
  gradient.addColorStop(1, JUST_PARRY_BODY_GLOW_PURPLE);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  bodyGlowCache.set(key, canvas);
  return canvas;
};

const drawInkBlob = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotationRad: number,
  color: string,
  alpha: number,
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotationRad);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawJustParryInkSplash = (
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
  const burstT = Math.min(1, elapsed / JUST_PARRY_INK_BURST_MS);
  const burstEase = easeCubicOut(burstT);
  const fromX = state.playerBodyX;
  const fromY = state.playerBodyY - 12;
  const toX = state.contactX;
  const toY = state.contactY;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const axisX = dx / length;
  const axisY = dy / length;
  const perpX = -axisY;
  const perpY = axisX;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const segmentCount = 7;
  for (let index = 0; index < segmentCount; index += 1) {
    const t = (index + 0.5) / segmentCount;
    const travel = burstEase * length * t;
    const centerX = fromX + axisX * travel;
    const centerY = fromY + axisY * travel;
    const lateral = (index % 2 === 0 ? 1 : -1) * (8 + index * 2) * (1 - burstT * 0.35);
    const blobX = centerX + perpX * lateral;
    const blobY = centerY + perpY * lateral;
    const radiusX = lerp(8, 22, burstEase) * (0.75 + t * 0.45);
    const radiusY = lerp(5, 14, burstEase) * (0.8 + (1 - t) * 0.25);
    const color = index % 2 === 0 ? JUST_PARRY_INK_BLUE : JUST_PARRY_INK_PURPLE;
    drawInkBlob(
      ctx,
      blobX,
      blobY,
      radiusX,
      radiusY,
      Math.atan2(axisY, axisX) + (index - 3) * 0.08,
      color,
      alpha * lerp(0.55, 0.95, burstEase),
    );
  }

  const tipX = fromX + axisX * length * burstEase;
  const tipY = fromY + axisY * length * burstEase;
  drawInkBlob(ctx, tipX, tipY, 26 * burstEase + 6, 18 * burstEase + 4, Math.atan2(axisY, axisX), JUST_PARRY_INK_PURPLE, alpha * 0.92);
  drawInkBlob(ctx, tipX, tipY, 16 * burstEase + 4, 12 * burstEase + 3, Math.atan2(axisY, axisX), JUST_PARRY_INK_BLUE, alpha * 0.78);

  state.droplets.forEach((droplet, index) => {
    const localElapsed = Math.max(0, elapsed - droplet.delayMs);
    const dropletT = Math.min(1, localElapsed / JUST_PARRY_INK_BURST_MS);
    const dropletEase = easeCubicOut(dropletT);
    const originT = 0.35 + seededUnit(state.startedAt + index) * 0.45;
    const originX = fromX + axisX * length * originT;
    const originY = fromY + axisY * length * originT;
    const x = originX + droplet.dirX * droplet.distancePx * dropletEase;
    const y = originY + droplet.dirY * droplet.distancePx * dropletEase;
    const dropletAlpha = alpha * (1 - dropletEase * 0.35);
    drawInkBlob(
      ctx,
      x,
      y,
      droplet.sizePx * droplet.stretch * (0.6 + dropletEase * 0.5),
      droplet.sizePx * (0.45 + dropletEase * 0.35),
      Math.atan2(droplet.dirY, droplet.dirX),
      index % 2 === 0 ? JUST_PARRY_INK_BLUE : JUST_PARRY_INK_PURPLE,
      dropletAlpha,
    );
  });

  ctx.restore();
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
  ctx.globalAlpha = alpha * 0.42 * pulse;
  ctx.drawImage(glowCanvas, flip ? -drawW / 2 : drawX, drawY, drawW, drawH);
  ctx.globalAlpha = alpha * 0.95;
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
