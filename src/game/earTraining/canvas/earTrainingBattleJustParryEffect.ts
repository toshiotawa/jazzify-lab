import { CHARACTER_DISPLAY_SIZE } from './earTrainingBattleLayout';
import {
  easeCubicOut,
  lerp,
} from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_INK_BURST_MS = 220;
export const JUST_PARRY_INK_DROPLET_COUNT = 22;
export const JUST_PARRY_INK_SPLAT_SPIKE_COUNT = 12;
export const JUST_PARRY_INK_TENDRIL_COUNT = 8;
export const JUST_PARRY_BODY_GLOW_BLUE = '#38bdf8';
export const JUST_PARRY_BODY_GLOW_PURPLE = '#c084fc';
export const JUST_PARRY_INK_BLUE = '#2563eb';
export const JUST_PARRY_INK_PURPLE = '#9333ea';
export const JUST_PARRY_INK_CORE_CYAN = '#67e8f9';

export interface JustParryInkSatellite {
  offsetAlong: number;
  offsetPerp: number;
  sizePx: number;
}

export interface JustParryInkDroplet {
  dirX: number;
  dirY: number;
  distancePx: number;
  sizePx: number;
  delayMs: number;
  stretch: number;
  rotationOffset: number;
  colorIsBlue: boolean;
  satellites: readonly JustParryInkSatellite[];
}

export interface JustParryInkSplatSpike {
  angleRad: number;
  lengthFactor: number;
  widthFactor: number;
  colorIsBlue: boolean;
}

export interface JustParryInkTendril {
  angleRad: number;
  lengthPx: number;
  widthPx: number;
  delayMs: number;
  colorIsBlue: boolean;
  curveBias: number;
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
  axisX: number;
  axisY: number;
  droplets: readonly JustParryInkDroplet[];
  splatSpikes: readonly JustParryInkSplatSpike[];
  tendrils: readonly JustParryInkTendril[];
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
  axisX: 1,
  axisY: 0,
  droplets: [],
  splatSpikes: [],
  tendrils: [],
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

interface JustParryInkAxes {
  axisX: number;
  axisY: number;
  perpX: number;
  perpY: number;
  baseAngleRad: number;
}

const resolveJustParryInkAxes = (
  playerBodyX: number,
  playerBodyY: number,
  contactX: number,
  contactY: number,
): JustParryInkAxes => {
  const dx = contactX - playerBodyX;
  const dy = contactY - playerBodyY;
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

const buildJustParrySatellites = (
  seed: number,
  sizePx: number,
): readonly JustParryInkSatellite[] => {
  const count = 2 + Math.floor(seededUnit(seed + 11.3) * 2);
  const satellites: JustParryInkSatellite[] = [];
  for (let index = 0; index < count; index += 1) {
    const satelliteSeed = seed + 13.7 + index * 5.9;
    satellites.push({
      offsetAlong: -sizePx * (0.15 + seededUnit(satelliteSeed) * 0.55),
      offsetPerp: (seededUnit(satelliteSeed + 1.1) - 0.5) * sizePx * 0.9,
      sizePx: 2 + seededUnit(satelliteSeed + 2.4) * sizePx * 0.35,
    });
  }
  return satellites;
};

const buildJustParryDroplets = (
  axes: JustParryInkAxes,
  seedBase: number,
): readonly JustParryInkDroplet[] => {
  const { axisX, axisY, perpX, perpY, baseAngleRad } = axes;
  const droplets: JustParryInkDroplet[] = [];

  for (let index = 0; index < JUST_PARRY_INK_DROPLET_COUNT; index += 1) {
    const seed = seedBase + index * 17.13;
    const fanT = seededUnit(seed);
    const fanAngle = (fanT - 0.5) * 1.35 - 0.42;
    const cos = Math.cos(fanAngle);
    const sin = Math.sin(fanAngle);
    const dirX = axisX * cos - perpX * sin;
    const dirY = axisY * cos - perpY * sin + (0.18 + seededUnit(seed + 0.9) * 0.22);
    const dirLength = Math.hypot(dirX, dirY);
    const sizePx = 4 + seededUnit(seed + 4.9) * 18;
    droplets.push({
      dirX: dirX / dirLength,
      dirY: dirY / dirLength,
      distancePx: 28 + seededUnit(seed + 3.1) * 88,
      sizePx,
      delayMs: Math.round(seededUnit(seed + 6.2) * 42),
      stretch: 1.1 + seededUnit(seed + 8.4) * 2.4,
      rotationOffset: (seededUnit(seed + 9.6) - 0.5) * 0.5,
      colorIsBlue: index % 2 === 0,
      satellites: buildJustParrySatellites(seed, sizePx),
    });
  }

  return droplets;
};

const buildJustParrySplatSpikes = (
  baseAngleRad: number,
  seedBase: number,
): readonly JustParryInkSplatSpike[] => {
  const spikes: JustParryInkSplatSpike[] = [];
  for (let index = 0; index < JUST_PARRY_INK_SPLAT_SPIKE_COUNT; index += 1) {
    const seed = seedBase + index * 9.41 + 200;
    const angleOffset = (seededUnit(seed) - 0.5) * 2.2;
    spikes.push({
      angleRad: baseAngleRad + angleOffset,
      lengthFactor: 0.45 + seededUnit(seed + 1.3) * 0.85,
      widthFactor: 0.55 + seededUnit(seed + 2.7) * 0.75,
      colorIsBlue: index % 3 !== 1,
    });
  }
  return spikes;
};

const buildJustParryTendrils = (
  baseAngleRad: number,
  seedBase: number,
): readonly JustParryInkTendril[] => {
  const tendrils: JustParryInkTendril[] = [];
  for (let index = 0; index < JUST_PARRY_INK_TENDRIL_COUNT; index += 1) {
    const seed = seedBase + index * 11.07 + 400;
    const angleOffset = (seededUnit(seed) - 0.5) * 2.6;
    tendrils.push({
      angleRad: baseAngleRad + angleOffset,
      lengthPx: 34 + seededUnit(seed + 1.5) * 72,
      widthPx: 1.2 + seededUnit(seed + 2.8) * 2.8,
      delayMs: Math.round(seededUnit(seed + 4.1) * 28),
      colorIsBlue: index % 2 === 0,
      curveBias: (seededUnit(seed + 5.6) - 0.5) * 0.55,
    });
  }
  return tendrils;
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
  const axes = resolveJustParryInkAxes(
    params.playerBodyX,
    params.playerBodyY,
    params.contactX,
    params.contactY,
  );
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
  state.axisX = axes.axisX;
  state.axisY = axes.axisY;
  state.droplets = buildJustParryDroplets(axes, params.seedBase);
  state.splatSpikes = buildJustParrySplatSpikes(axes.baseAngleRad, params.seedBase);
  state.tendrils = buildJustParryTendrils(axes.baseAngleRad, params.seedBase);
};

export const clearJustParryEffect = (state: JustParryEffectState): void => {
  state.active = false;
  state.droplets = [];
  state.splatSpikes = [];
  state.tendrils = [];
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

const drawInkTeardrop = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  headRadius: number,
  tailLength: number,
  rotationRad: number,
  color: string,
  alpha: number,
): void => {
  const headX = Math.cos(rotationRad) * tailLength * 0.35;
  const headY = Math.sin(rotationRad) * tailLength * 0.35;
  const tailX = -Math.cos(rotationRad) * tailLength;
  const tailY = -Math.sin(rotationRad) * tailLength;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
  ctx.moveTo(headX + Math.cos(rotationRad + Math.PI / 2) * headRadius * 0.55, headY + Math.sin(rotationRad + Math.PI / 2) * headRadius * 0.55);
  ctx.quadraticCurveTo(tailX * 0.45, tailY * 0.45, tailX, tailY);
  ctx.quadraticCurveTo(tailX * 0.45, tailY * 0.45, headX + Math.cos(rotationRad - Math.PI / 2) * headRadius * 0.55, headY + Math.sin(rotationRad - Math.PI / 2) * headRadius * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawInkCoreSplat = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  spikes: readonly JustParryInkSplatSpike[],
  burstEase: number,
  alpha: number,
): void => {
  const baseRadius = lerp(6, 34, burstEase);
  const innerRadius = baseRadius * 0.28;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = 'lighter';

  ctx.globalAlpha = alpha * lerp(0.5, 0.92, burstEase);
  ctx.fillStyle = JUST_PARRY_INK_CORE_CYAN;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < spikes.length; index += 1) {
    const spike = spikes[index];
    const next = spikes[(index + 1) % spikes.length];
    const spikeRadius = baseRadius * spike.lengthFactor * (0.75 + burstEase * 0.45);
    const nextRadius = baseRadius * next.lengthFactor * (0.75 + burstEase * 0.45);
    const midAngle = (spike.angleRad + next.angleRad) / 2;
    const midRadius = baseRadius * 0.22 * (0.6 + burstEase * 0.5);

    const x1 = Math.cos(spike.angleRad) * spikeRadius;
    const y1 = Math.sin(spike.angleRad) * spikeRadius;
    const x2 = Math.cos(next.angleRad) * nextRadius;
    const y2 = Math.sin(next.angleRad) * nextRadius;
    const cpx = Math.cos(midAngle) * midRadius;
    const cpy = Math.sin(midAngle) * midRadius;

    const color = spike.colorIsBlue ? JUST_PARRY_INK_BLUE : JUST_PARRY_INK_PURPLE;
    ctx.globalAlpha = alpha * lerp(0.45, 0.88, burstEase) * spike.widthFactor;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(cpx, cpy, x1, y1);
    ctx.lineTo(x2, y2);
    ctx.quadraticCurveTo(cpx * 0.35, cpy * 0.35, 0, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
};

const drawInkTendril = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  tendril: JustParryInkTendril,
  tendrilEase: number,
  alpha: number,
): void => {
  const length = tendril.lengthPx * tendrilEase;
  const endX = centerX + Math.cos(tendril.angleRad) * length;
  const endY = centerY + Math.sin(tendril.angleRad) * length;
  const ctrlX = centerX + Math.cos(tendril.angleRad + tendril.curveBias) * length * 0.55;
  const ctrlY = centerY + Math.sin(tendril.angleRad + tendril.curveBias) * length * 0.55;
  const color = tendril.colorIsBlue ? JUST_PARRY_INK_BLUE : JUST_PARRY_INK_PURPLE;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha * (1 - tendrilEase * 0.25);
  ctx.strokeStyle = color;
  ctx.lineWidth = tendril.widthPx * (1 - tendrilEase * 0.35);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();
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
  const centerX = state.contactX;
  const centerY = state.contactY;

  ctx.save();

  drawInkCoreSplat(ctx, centerX, centerY, state.splatSpikes, burstEase, alpha);

  state.tendrils.forEach((tendril) => {
    const localElapsed = Math.max(0, elapsed - tendril.delayMs);
    const tendrilT = Math.min(1, localElapsed / JUST_PARRY_INK_BURST_MS);
    const tendrilEase = easeCubicOut(tendrilT);
    drawInkTendril(ctx, centerX, centerY, tendril, tendrilEase, alpha);
  });

  ctx.globalCompositeOperation = 'source-over';
  state.droplets.forEach((droplet) => {
    const localElapsed = Math.max(0, elapsed - droplet.delayMs);
    const dropletT = Math.min(1, localElapsed / JUST_PARRY_INK_BURST_MS);
    const dropletEase = easeCubicOut(dropletT);
    const travel = droplet.distancePx * dropletEase;
    const x = centerX + droplet.dirX * travel;
    const y = centerY + droplet.dirY * travel;
    const rotationRad = Math.atan2(droplet.dirY, droplet.dirX) + droplet.rotationOffset;
    const headRadius = droplet.sizePx * (0.55 + dropletEase * 0.35);
    const tailLength = droplet.sizePx * droplet.stretch * (0.5 + dropletEase * 0.65);
    const dropletAlpha = alpha * (1 - dropletEase * 0.3);
    const color = droplet.colorIsBlue ? JUST_PARRY_INK_BLUE : JUST_PARRY_INK_PURPLE;

    drawInkTeardrop(ctx, x, y, headRadius, tailLength, rotationRad, color, dropletAlpha);

    droplet.satellites.forEach((satellite) => {
      const satX = x + droplet.dirX * satellite.offsetAlong + (-droplet.dirY) * satellite.offsetPerp;
      const satY = y + droplet.dirY * satellite.offsetAlong + droplet.dirX * satellite.offsetPerp;
      const satAlpha = dropletAlpha * 0.75;
      drawInkTeardrop(
        ctx,
        satX,
        satY,
        satellite.sizePx * 0.55,
        satellite.sizePx * 0.9,
        rotationRad + droplet.rotationOffset * 0.5,
        color,
        satAlpha,
      );
    });
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
