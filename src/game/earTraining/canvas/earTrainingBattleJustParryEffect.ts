import { CHARACTER_DISPLAY_SIZE } from './earTrainingBattleLayout';
import { easeCubicOut } from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

/** ガードポーズ／身体グローの下限 */
export const JUST_PARRY_MIN_DURATION_MS = 60;
/** 連続ガードヒット時に身体グローを切る尺 */
export const JUST_PARRY_GUARD_GLOW_BLIP_MS = 2;
/** finish/miss まで持続させるための実質無限尺 */
export const JUST_PARRY_GUARD_SUSTAIN_MS = 3_600_000;

const JUST_PARRY_BODY_GLOW_WHITE = '#f8fafc';
const JUST_PARRY_BODY_GLOW_CYAN = '#67e8f9';
const JUST_PARRY_BODY_GLOW_BLUE = '#3b82f6';
const JUST_PARRY_BODY_GLOW_VIOLET = '#818cf8';
const JUST_PARRY_BODY_GLOW_INDIGO = '#1e3a8a';

/**
 * ヒット音符の長さに合わせたフィニッシュ／持続尺。
 * 次ターゲットまで（なければ fallback 終端）−1ms、下限は minDurationMs。
 */
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

export interface JustParryBodyGlowState {
  active: boolean;
  startedAt: number;
  endAt: number;
  imageKey: string;
  flipX: boolean;
}

export const createJustParryBodyGlowState = (): JustParryBodyGlowState => ({
  active: false,
  startedAt: 0,
  endAt: 0,
  imageKey: '',
  flipX: false,
});

export interface StartJustParryBodyGlowParams {
  startedAt: number;
  durationMs: number;
  imageKey: string;
  flipX: boolean;
}

export const startJustParryBodyGlow = (
  state: JustParryBodyGlowState,
  params: StartJustParryBodyGlowParams,
): void => {
  const durationMs = Math.max(1, Math.round(params.durationMs));
  state.active = true;
  state.startedAt = params.startedAt;
  state.endAt = params.startedAt + durationMs;
  state.imageKey = params.imageKey;
  state.flipX = params.flipX;
};

export const clearJustParryBodyGlow = (state: JustParryBodyGlowState): void => {
  state.active = false;
};

export const isJustParryBodyGlowActive = (
  state: JustParryBodyGlowState,
  nowMs: number,
): boolean => state.active && nowMs < state.endAt;

export const pruneJustParryBodyGlow = (
  state: JustParryBodyGlowState,
  nowMs: number,
): void => {
  if (state.active && nowMs >= state.endAt) {
    clearJustParryBodyGlow(state);
  }
};

export const getJustParryBodyGlowAlpha = (
  state: JustParryBodyGlowState,
  nowMs: number,
): number => {
  if (!isJustParryBodyGlowActive(state, nowMs)) {
    return 0;
  }
  const durationMs = Math.max(1, state.endAt - state.startedAt);
  const elapsed = nowMs - state.startedAt;
  const fadeStart = durationMs * 0.72;
  if (elapsed <= fadeStart) {
    return 1;
  }
  const fadeT = (elapsed - fadeStart) / Math.max(1, durationMs - fadeStart);
  return 1 - easeCubicOut(Math.min(1, fadeT));
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
  state: JustParryBodyGlowState,
  loadedImages: Map<string, HTMLImageElement>,
  playerX: number,
  floorY: number,
  yOffset: number,
  rotationDeg: number,
  nowMs: number,
): void => {
  if (!isJustParryBodyGlowActive(state, nowMs)) {
    return;
  }

  const img = loadedImages.get(state.imageKey);
  if (!img) {
    return;
  }

  const alpha = getJustParryBodyGlowAlpha(state, nowMs);
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
