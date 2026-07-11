import {
  easeCubicOut,
  lerp,
} from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_VISUAL_DURATION_MS = 450;
export const JUST_PARRY_FLASH_DURATION_MS = 90;
export const JUST_PARRY_RING_DURATION_MS = 180;
export const JUST_PARRY_SPLASH_DURATION_MS = 380;
export const JUST_PARRY_SPLASH_DISPLAY_SIZE_PX = 280;
export const JUST_PARRY_FLASH_IMAGE_KEY = 'parryFlash';
export const JUST_PARRY_RING_IMAGE_KEY = 'parryRing';
export const JUST_PARRY_SPLASH_IMAGE_KEY = 'parrySplash';

const JUST_PARRY_FLASH_SCALE_START = 0.1;
const JUST_PARRY_FLASH_SCALE_END = 0.8;
const JUST_PARRY_RING_SCALE_START = 0.15;
const JUST_PARRY_RING_SCALE_END = 1.2;
const JUST_PARRY_SPLASH_SCALE_START = 0.35;
const JUST_PARRY_SPLASH_SCALE_END = 1.05;
const JUST_PARRY_SPLASH_ALPHA_START = 0.95;

const easeQuadOut = (t: number): number => 1 - (1 - t) ** 2;

export interface JustParryEffectState {
  active: boolean;
  startedAt: number;
  endAt: number;
  originX: number;
  originY: number;
  splashAngle: number;
  splashAngleDelta: number;
}

export const createJustParryEffectState = (): JustParryEffectState => ({
  active: false,
  startedAt: 0,
  endAt: 0,
  originX: 0,
  originY: 0,
  splashAngle: 0,
  splashAngleDelta: 0,
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

export interface JustParryLayerDrawParams {
  scale: number;
  alpha: number;
  angleDeg: number;
}

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
    alpha: lerp(JUST_PARRY_SPLASH_ALPHA_START, 0, easeCubicOut(t)),
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
    alpha: lerp(1, 0, easeCubicOut(t)),
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
    alpha: lerp(1, 0, easeQuadOut(t)),
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
): void => {
  const size = displaySizePx * params.scale;
  ctx.save();
  ctx.globalCompositeOperation = blendMode;
  ctx.globalAlpha = params.alpha;
  ctx.translate(originX, originY);
  if (params.angleDeg !== 0) {
    ctx.rotate(params.angleDeg * Math.PI / 180);
  }
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
};

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
      'screen',
    );
  }

  const ringParams = computeJustParryRingLayer(elapsed);
  if (ringImg && ringParams && ringParams.alpha > 0) {
    drawJustParryImageLayer(
      ctx,
      ringImg,
      state.originX,
      state.originY,
      JUST_PARRY_SPLASH_DISPLAY_SIZE_PX,
      ringParams,
      'lighter',
    );
  }

  const flashParams = computeJustParryFlashLayer(elapsed);
  if (flashImg && flashParams && flashParams.alpha > 0) {
    drawJustParryImageLayer(
      ctx,
      flashImg,
      state.originX,
      state.originY,
      JUST_PARRY_SPLASH_DISPLAY_SIZE_PX,
      flashParams,
      'lighter',
    );
  }
};
