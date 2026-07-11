import { CHARACTER_DISPLAY_SIZE } from './earTrainingBattleLayout';
import {
  easeCubicOut,
  lerp,
} from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_VISUAL_DURATION_MS = 450;
export const JUST_PARRY_FLASH_DURATION_MS = 140;
export const JUST_PARRY_RING_DURATION_MS = 280;
export const JUST_PARRY_SPLASH_DURATION_MS = 450;
export const JUST_PARRY_LAYER_OFFSET_X = 28;
export const JUST_PARRY_FLASH_DISPLAY_SIZE_PX = 246;
export const JUST_PARRY_RING_DISPLAY_SIZE_PX = 278;
export const JUST_PARRY_SPLASH_DISPLAY_SIZE_PX = 295;
export const JUST_PARRY_FLASH_IMAGE_KEY = 'parryFlash';
export const JUST_PARRY_RING_IMAGE_KEY = 'parryRing';
export const JUST_PARRY_SPLASH_IMAGE_KEY = 'parrySplash';

/** 直前より少し控えめなサイズ・不透明度（視認性は維持） */
const JUST_PARRY_FLASH_SCALE_START = 0.42;
const JUST_PARRY_FLASH_SCALE_END = 1.05;
const JUST_PARRY_RING_SCALE_START = 0.4;
const JUST_PARRY_RING_SCALE_END = 1.25;
const JUST_PARRY_SPLASH_SCALE_START = 0.42;
const JUST_PARRY_SPLASH_SCALE_END = 1.12;
const JUST_PARRY_LAYER_ALPHA_START = 1;
const JUST_PARRY_BODY_GLOW_WHITE = '#f8fafc';
const JUST_PARRY_BODY_GLOW_CYAN = '#67e8f9';
const JUST_PARRY_BODY_GLOW_BLUE = '#3b82f6';
const JUST_PARRY_BODY_GLOW_VIOLET = '#818cf8';
const JUST_PARRY_BODY_GLOW_INDIGO = '#1e3a8a';

const easeQuadOut = (t: number): number => 1 - (1 - t) ** 2;

export interface JustParryEffectState {
  active: boolean;
  startedAt: number;
  endAt: number;
  originX: number;
  originY: number;
  splashAngle: number;
  splashAngleDelta: number;
  imageKey: string;
  flipX: boolean;
}

export const createJustParryEffectState = (): JustParryEffectState => ({
  active: false,
  startedAt: 0,
  endAt: 0,
  originX: 0,
  originY: 0,
  splashAngle: 0,
  splashAngleDelta: 0,
  imageKey: '',
  flipX: false,
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
    const noteDurationMs = Math.round((nextTargetPhraseSec - hitPhraseTimeSec) * 1000);
    return Math.max(minDurationMs, noteDurationMs - 1);
  }
  if (
    fallbackEndPhraseSec !== undefined
    && Number.isFinite(fallbackEndPhraseSec)
    && fallbackEndPhraseSec > hitPhraseTimeSec + BEAT_EPS
  ) {
    const noteDurationMs = Math.round((fallbackEndPhraseSec - hitPhraseTimeSec) * 1000);
    return Math.max(minDurationMs, noteDurationMs - 1);
  }
  return minDurationMs;
};

const seededUnit = (seed: number): number => {
  const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const seededRange = (seed: number, min: number, max: number): number =>
  min + seededUnit(seed) * (max - min);

export interface StartJustParryEffectParams {
  startedAt: number;
  originX: number;
  originY: number;
  seedBase: number;
  imageKey: string;
  flipX: boolean;
}

export const startJustParryEffect = (
  state: JustParryEffectState,
  params: StartJustParryEffectParams,
): void => {
  state.active = true;
  state.startedAt = params.startedAt;
  state.endAt = params.startedAt + JUST_PARRY_VISUAL_DURATION_MS;
  state.originX = params.originX;
  state.originY = params.originY;
  state.splashAngle = seededRange(params.seedBase, -12, 12);
  state.splashAngleDelta = seededRange(params.seedBase + 3.7, -8, 8);
  state.imageKey = params.imageKey;
  state.flipX = params.flipX;
};

export const clearJustParryEffect = (state: JustParryEffectState): void => {
  state.active = false;
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
  const durationMs = JUST_PARRY_VISUAL_DURATION_MS;
  const fadeStart = durationMs * 0.72;
  if (elapsed <= fadeStart) {
    return 1;
  }
  const fadeT = (elapsed - fadeStart) / Math.max(1, durationMs - fadeStart);
  return 1 - easeCubicOut(Math.min(1, fadeT));
};

export interface JustParryLayerDrawParams {
  scale: number;
  alpha: number;
  angleDeg: number;
}

const computeFadeOutAlpha = (
  t: number,
  startAlpha: number,
  ease: (value: number) => number,
): number => lerp(startAlpha, 0, ease(t));

export const computeJustParrySplashLayer = (
  elapsedMs: number,
  splashAngle: number,
  splashAngleDelta: number,
): JustParryLayerDrawParams | null => {
  if (elapsedMs < 0 || elapsedMs >= JUST_PARRY_SPLASH_DURATION_MS) {
    return null;
  }
  const t = elapsedMs / JUST_PARRY_SPLASH_DURATION_MS;
  return {
    scale: lerp(JUST_PARRY_SPLASH_SCALE_START, JUST_PARRY_SPLASH_SCALE_END, easeCubicOut(t)),
    alpha: computeFadeOutAlpha(t, JUST_PARRY_LAYER_ALPHA_START, easeCubicOut),
    angleDeg: splashAngle + splashAngleDelta * easeCubicOut(t),
  };
};

export const computeJustParryRingLayer = (
  elapsedMs: number,
): JustParryLayerDrawParams | null => {
  if (elapsedMs < 0 || elapsedMs >= JUST_PARRY_RING_DURATION_MS) {
    return null;
  }
  const t = elapsedMs / JUST_PARRY_RING_DURATION_MS;
  return {
    scale: lerp(JUST_PARRY_RING_SCALE_START, JUST_PARRY_RING_SCALE_END, easeCubicOut(t)),
    alpha: computeFadeOutAlpha(t, JUST_PARRY_LAYER_ALPHA_START, easeCubicOut),
    angleDeg: 0,
  };
};

export const computeJustParryFlashLayer = (
  elapsedMs: number,
): JustParryLayerDrawParams | null => {
  if (elapsedMs < 0 || elapsedMs >= JUST_PARRY_FLASH_DURATION_MS) {
    return null;
  }
  const t = elapsedMs / JUST_PARRY_FLASH_DURATION_MS;
  return {
    scale: lerp(JUST_PARRY_FLASH_SCALE_START, JUST_PARRY_FLASH_SCALE_END, easeQuadOut(t)),
    alpha: computeFadeOutAlpha(t, JUST_PARRY_LAYER_ALPHA_START, easeQuadOut),
    angleDeg: 0,
  };
};

const drawJustParryImageLayer = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  originX: number,
  originY: number,
  displaySizePx: number,
  params: JustParryLayerDrawParams,
  blendMode: GlobalCompositeOperation,
  alphaScale = 1,
): void => {
  const size = displaySizePx * params.scale;
  ctx.save();
  ctx.globalCompositeOperation = blendMode;
  ctx.globalAlpha = params.alpha * alphaScale;
  ctx.translate(originX, originY);
  if (params.angleDeg !== 0) {
    ctx.rotate(params.angleDeg * Math.PI / 180);
  }
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
};

/**
 * splash → ring → flash。
 * ring/flash は source-over で色を確保し、lighter で発光を足す（splash だけに見えないようにする）。
 */
export const drawJustParryLayers = (
  ctx: CanvasRenderingContext2D,
  state: JustParryEffectState,
  loadedImages: Map<string, HTMLImageElement>,
  nowMs: number,
): void => {
  if (!isJustParryEffectActive(state, nowMs)) {
    return;
  }

  const elapsed = nowMs - state.startedAt;
  const splashImg = loadedImages.get(JUST_PARRY_SPLASH_IMAGE_KEY);
  const ringImg = loadedImages.get(JUST_PARRY_RING_IMAGE_KEY);
  const flashImg = loadedImages.get(JUST_PARRY_FLASH_IMAGE_KEY);

  const splashParams = computeJustParrySplashLayer(
    elapsed,
    state.splashAngle,
    state.splashAngleDelta,
  );
  if (splashImg && splashParams && splashParams.alpha > 0) {
    drawJustParryImageLayer(
      ctx,
      splashImg,
      state.originX,
      state.originY,
      JUST_PARRY_SPLASH_DISPLAY_SIZE_PX,
      splashParams,
      'source-over',
      0.78,
    );
    drawJustParryImageLayer(
      ctx,
      splashImg,
      state.originX,
      state.originY,
      JUST_PARRY_SPLASH_DISPLAY_SIZE_PX,
      splashParams,
      'screen',
      0.72,
    );
  }

  const ringParams = computeJustParryRingLayer(elapsed);
  if (ringImg && ringParams && ringParams.alpha > 0) {
    drawJustParryImageLayer(
      ctx,
      ringImg,
      state.originX,
      state.originY,
      JUST_PARRY_RING_DISPLAY_SIZE_PX,
      ringParams,
      'source-over',
      0.82,
    );
    drawJustParryImageLayer(
      ctx,
      ringImg,
      state.originX,
      state.originY,
      JUST_PARRY_RING_DISPLAY_SIZE_PX,
      ringParams,
      'lighter',
      0.65,
    );
  }

  const flashParams = computeJustParryFlashLayer(elapsed);
  if (flashImg && flashParams && flashParams.alpha > 0) {
    drawJustParryImageLayer(
      ctx,
      flashImg,
      state.originX,
      state.originY,
      JUST_PARRY_FLASH_DISPLAY_SIZE_PX,
      flashParams,
      'source-over',
      0.88,
    );
    drawJustParryImageLayer(
      ctx,
      flashImg,
      state.originX,
      state.originY,
      JUST_PARRY_FLASH_DISPLAY_SIZE_PX,
      flashParams,
      'lighter',
      0.75,
    );
  }
};

const bodyGlowCache = new Map<string, HTMLCanvasElement>();

const getBodyGlowCacheKey = (
  imageSrc: string,
  width: number,
  height: number,
): string => `${imageSrc}|${Math.round(width)}|${Math.round(height)}|cyan-indigo`;

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
  const gradient = ctx.createLinearGradient(0, 0, width * 0.4, height);
  gradient.addColorStop(0, JUST_PARRY_BODY_GLOW_WHITE);
  gradient.addColorStop(0.22, JUST_PARRY_BODY_GLOW_CYAN);
  gradient.addColorStop(0.48, JUST_PARRY_BODY_GLOW_BLUE);
  gradient.addColorStop(0.72, JUST_PARRY_BODY_GLOW_VIOLET);
  gradient.addColorStop(1, JUST_PARRY_BODY_GLOW_INDIGO);
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
  ctx.globalAlpha = alpha * 0.48 * pulse;
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
  ctx.globalAlpha = alpha * 0.36 * pulse;
  ctx.drawImage(glowCanvas, rimX, rimY, rimW, rimH);
  ctx.restore();

  ctx.restore();
};
