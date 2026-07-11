import { CHARACTER_DISPLAY_SIZE } from './earTrainingBattleLayout';
import {
  easeCubicOut,
  lerp,
} from './earTrainingBattleDrawState';

const BEAT_EPS = 1e-6;

export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_INK_BURST_MS = 220;
export const JUST_PARRY_INK_DROPLET_COUNT = 22;
export const JUST_PARRY_INK_TENDRIL_COUNT = 8;
export const JUST_PARRY_INK_TEXTURE_VARIANT_COUNT = 4;
export const JUST_PARRY_INK_CORE_BLOB_MIN_COUNT = 3;
export const JUST_PARRY_INK_CORE_BLOB_MAX_COUNT = 5;
export const JUST_PARRY_BODY_GLOW_BLUE = '#38bdf8';
export const JUST_PARRY_BODY_GLOW_PURPLE = '#c084fc';
export const JUST_PARRY_INK_BLUE = '#2563eb';
export const JUST_PARRY_INK_PURPLE = '#9333ea';
export const JUST_PARRY_INK_CORE_CYAN = '#67e8f9';

const JUST_PARRY_INK_GRAVITY = 1900;
const JUST_PARRY_INK_TEXTURE_SIZE = 64;
const JUST_PARRY_INK_TEXTURE_HALF = JUST_PARRY_INK_TEXTURE_SIZE / 2;
const JUST_PARRY_INK_DROPLET_MIN_SPEED = 250;
const JUST_PARRY_INK_DROPLET_MAX_SPEED = 900;
const JUST_PARRY_INK_DROPLET_STRETCH_SPEED_REF = 700;
const JUST_PARRY_INK_DROPLET_STRETCH_MIN = 1;
const JUST_PARRY_INK_DROPLET_STRETCH_MAX = 2.2;

export interface JustParryInkDroplet {
  vx: number;
  vy: number;
  sizePx: number;
  delayMs: number;
  textureIndex: number;
  spinRadPerSec: number;
  colorIsBlue: boolean;
}

export interface JustParryInkCoreBlob {
  offsetX: number;
  offsetY: number;
  rotationRad: number;
  scaleFactor: number;
  textureIndex: number;
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
  coreBlobs: readonly JustParryInkCoreBlob[];
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
  coreBlobs: [],
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

const buildJustParryDroplets = (
  axes: JustParryInkAxes,
  seedBase: number,
): readonly JustParryInkDroplet[] => {
  const { axisX, axisY, perpX, perpY } = axes;
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
    const normDirX = dirX / dirLength;
    const normDirY = dirY / dirLength;
    const sizePx = 4 + seededUnit(seed + 4.9) * 18;
    const sizeNorm = (sizePx - 4) / 18;
    const baseSpeed = lerp(
      JUST_PARRY_INK_DROPLET_MAX_SPEED,
      JUST_PARRY_INK_DROPLET_MIN_SPEED,
      sizeNorm,
    );
    const speed = baseSpeed + (seededUnit(seed + 3.1) - 0.5) * 80;
    droplets.push({
      vx: normDirX * speed,
      vy: normDirY * speed,
      sizePx,
      delayMs: Math.round(seededUnit(seed + 6.2) * 42),
      textureIndex: Math.floor(seededUnit(seed + 10.2) * JUST_PARRY_INK_TEXTURE_VARIANT_COUNT),
      spinRadPerSec: (seededUnit(seed + 9.6) - 0.5) * 4,
      colorIsBlue: index % 2 === 0,
    });
  }

  return droplets;
};

const buildJustParryCoreBlobs = (
  seedBase: number,
): readonly JustParryInkCoreBlob[] => {
  const count = JUST_PARRY_INK_CORE_BLOB_MIN_COUNT
    + Math.floor(seededUnit(seedBase + 500.7) * (JUST_PARRY_INK_CORE_BLOB_MAX_COUNT - JUST_PARRY_INK_CORE_BLOB_MIN_COUNT + 1));
  const coreRadius = 34;
  const blobs: JustParryInkCoreBlob[] = [];

  for (let index = 0; index < count; index += 1) {
    const seed = seedBase + index * 9.41 + 200;
    const offsetDist = coreRadius * (0.3 + seededUnit(seed) * 0.3);
    const offsetAngle = seededUnit(seed + 1.3) * Math.PI * 2;
    blobs.push({
      offsetX: Math.cos(offsetAngle) * offsetDist,
      offsetY: Math.sin(offsetAngle) * offsetDist,
      rotationRad: seededUnit(seed + 2.7) * Math.PI * 2,
      scaleFactor: 0.55 + seededUnit(seed + 3.9) * 0.75,
      textureIndex: Math.floor(seededUnit(seed + 4.5) * JUST_PARRY_INK_TEXTURE_VARIANT_COUNT),
      colorIsBlue: index % 3 !== 1,
    });
  }

  return blobs;
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
  state.coreBlobs = buildJustParryCoreBlobs(params.seedBase);
  state.tendrils = buildJustParryTendrils(axes.baseAngleRad, params.seedBase);
};

export const clearJustParryEffect = (state: JustParryEffectState): void => {
  state.active = false;
  state.droplets = [];
  state.coreBlobs = [];
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

type InkSplashTextureGrid = readonly [
  readonly [HTMLCanvasElement | null, HTMLCanvasElement | null],
  readonly [HTMLCanvasElement | null, HTMLCanvasElement | null],
  readonly [HTMLCanvasElement | null, HTMLCanvasElement | null],
  readonly [HTMLCanvasElement | null, HTMLCanvasElement | null],
];

let inkSplashTextureCache: InkSplashTextureGrid | null = null;

const drawInkBlobShape = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  baseRadius: number,
  seed: number,
): void => {
  const pointCount = 8 + Math.floor(seededUnit(seed + 1.7) * 5);
  const angleStep = (Math.PI * 2) / pointCount;

  ctx.beginPath();
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const angle = pointIndex * angleStep;
    const nextAngle = (pointIndex + 1) * angleStep;
    const radius = baseRadius * (0.55 + seededUnit(seed + 2.1 + pointIndex * 3.3) * 0.45);
    const nextRadius = baseRadius * (0.55 + seededUnit(seed + 2.1 + ((pointIndex + 1) % pointCount) * 3.3) * 0.45);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const nextX = centerX + Math.cos(nextAngle) * nextRadius;
    const nextY = centerY + Math.sin(nextAngle) * nextRadius;
    const midAngle = (angle + nextAngle) / 2;
    const midRadius = (radius + nextRadius) * 0.5;
    const cpx = centerX + Math.cos(midAngle) * midRadius;
    const cpy = centerY + Math.sin(midAngle) * midRadius;

    if (pointIndex === 0) {
      ctx.moveTo(x, y);
    }
    ctx.quadraticCurveTo(cpx, cpy, nextX, nextY);
  }
  ctx.closePath();
};

const buildInkSplashTexture = (
  variantIndex: number,
  colorIsBlue: boolean,
): HTMLCanvasElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = JUST_PARRY_INK_TEXTURE_SIZE;
  canvas.height = JUST_PARRY_INK_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const seed = variantIndex * 97.13 + (colorIsBlue ? 11.7 : 53.9);
  const center = JUST_PARRY_INK_TEXTURE_HALF;
  const baseRadius = JUST_PARRY_INK_TEXTURE_HALF * 0.42;
  const color = colorIsBlue ? JUST_PARRY_INK_BLUE : JUST_PARRY_INK_PURPLE;

  const gradient = ctx.createRadialGradient(center, center, 0, center, center, baseRadius * 1.15);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.72, color);
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 1;
  drawInkBlobShape(ctx, center, center, baseRadius, seed);
  ctx.fill();

  ctx.globalAlpha = 0.85;
  drawInkBlobShape(ctx, center, center, baseRadius * 1.05, seed + 4.2);
  ctx.fill();

  const satelliteCount = 3 + Math.floor(seededUnit(seed + 20.5) * 3);
  ctx.fillStyle = color;
  for (let satelliteIndex = 0; satelliteIndex < satelliteCount; satelliteIndex += 1) {
    const satelliteSeed = seed + 24.3 + satelliteIndex * 6.7;
    const satelliteAngle = seededUnit(satelliteSeed) * Math.PI * 2;
    const satelliteDist = baseRadius * (0.85 + seededUnit(satelliteSeed + 1.2) * 0.55);
    const satelliteRadius = 1.5 + seededUnit(satelliteSeed + 2.4) * 4.5;
    const satelliteX = center + Math.cos(satelliteAngle) * satelliteDist;
    const satelliteY = center + Math.sin(satelliteAngle) * satelliteDist;
    ctx.globalAlpha = 0.75 + seededUnit(satelliteSeed + 3.1) * 0.2;
    ctx.beginPath();
    ctx.arc(satelliteX, satelliteY, satelliteRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
};

const getInkSplashTextures = (): InkSplashTextureGrid | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  if (inkSplashTextureCache) {
    return inkSplashTextureCache;
  }

  const textures: [
    [HTMLCanvasElement | null, HTMLCanvasElement | null],
    [HTMLCanvasElement | null, HTMLCanvasElement | null],
    [HTMLCanvasElement | null, HTMLCanvasElement | null],
    [HTMLCanvasElement | null, HTMLCanvasElement | null],
  ] = [
    [null, null],
    [null, null],
    [null, null],
    [null, null],
  ];

  for (let variantIndex = 0; variantIndex < JUST_PARRY_INK_TEXTURE_VARIANT_COUNT; variantIndex += 1) {
    textures[variantIndex][0] = buildInkSplashTexture(variantIndex, true);
    textures[variantIndex][1] = buildInkSplashTexture(variantIndex, false);
  }

  inkSplashTextureCache = textures;
  return inkSplashTextureCache;
};

interface JustParryDropletDrawParams {
  x: number;
  y: number;
  rotationRad: number;
  stretchX: number;
  dropletAlpha: number;
}

const computeJustParryDropletDrawParams = (
  droplet: JustParryInkDroplet,
  contactX: number,
  contactY: number,
  elapsedMs: number,
  alpha: number,
): JustParryDropletDrawParams | null => {
  const localElapsed = Math.max(0, elapsedMs - droplet.delayMs);
  const t = localElapsed / 1000;
  if (t <= 0) {
    return null;
  }

  const x = contactX + droplet.vx * t;
  const y = contactY + droplet.vy * t + 0.5 * JUST_PARRY_INK_GRAVITY * t * t;
  const instantVy = droplet.vy + JUST_PARRY_INK_GRAVITY * t;
  const speed = Math.hypot(droplet.vx, instantVy);
  const speedNorm = Math.min(1, speed / JUST_PARRY_INK_DROPLET_STRETCH_SPEED_REF);
  const stretchX = lerp(
    JUST_PARRY_INK_DROPLET_STRETCH_MIN,
    JUST_PARRY_INK_DROPLET_STRETCH_MAX,
    speedNorm,
  );
  const travelT = Math.min(1, localElapsed / JUST_PARRY_INK_BURST_MS);
  const dropletAlpha = alpha * (1 - travelT * 0.3);

  return {
    x,
    y,
    rotationRad: Math.atan2(instantVy, droplet.vx) + droplet.spinRadPerSec * t,
    stretchX,
    dropletAlpha,
  };
};

const drawInkCoreBlobs = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  coreBlobs: readonly JustParryInkCoreBlob[],
  burstEase: number,
  alpha: number,
): void => {
  const textures = getInkSplashTextures();
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
  ctx.restore();

  if (!textures) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  for (let index = 0; index < coreBlobs.length; index += 1) {
    const blob = coreBlobs[index];
    const texture = textures[blob.textureIndex][blob.colorIsBlue ? 0 : 1];
    if (!texture) {
      continue;
    }

    const blobSize = baseRadius * blob.scaleFactor * (0.75 + burstEase * 0.45) * 2.2;
    const offsetScale = burstEase;
    const drawX = centerX + blob.offsetX * offsetScale;
    const drawY = centerY + blob.offsetY * offsetScale;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(blob.rotationRad);
    ctx.globalAlpha = alpha * lerp(0.45, 0.88, burstEase);
    ctx.drawImage(
      texture,
      -blobSize / 2,
      -blobSize / 2,
      blobSize,
      blobSize,
    );
    ctx.restore();
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

  const textures = getInkSplashTextures();
  const elapsed = nowMs - state.startedAt;
  const burstT = Math.min(1, elapsed / JUST_PARRY_INK_BURST_MS);
  const burstEase = easeCubicOut(burstT);
  const centerX = state.contactX;
  const centerY = state.contactY;

  ctx.save();

  drawInkCoreBlobs(ctx, centerX, centerY, state.coreBlobs, burstEase, alpha);

  state.tendrils.forEach((tendril) => {
    const localElapsed = Math.max(0, elapsed - tendril.delayMs);
    const tendrilT = Math.min(1, localElapsed / JUST_PARRY_INK_BURST_MS);
    const tendrilEase = easeCubicOut(tendrilT);
    drawInkTendril(ctx, centerX, centerY, tendril, tendrilEase, alpha);
  });

  ctx.globalCompositeOperation = 'source-over';

  if (!textures) {
    ctx.restore();
    return;
  }

  for (let index = 0; index < state.droplets.length; index += 1) {
    const droplet = state.droplets[index];
    const drawParams = computeJustParryDropletDrawParams(
      droplet,
      centerX,
      centerY,
      elapsed,
      alpha,
    );
    if (!drawParams) {
      continue;
    }

    const texture = textures[droplet.textureIndex][droplet.colorIsBlue ? 0 : 1];
    if (!texture) {
      continue;
    }

    const drawSize = droplet.sizePx;

    ctx.save();
    ctx.translate(drawParams.x, drawParams.y);
    ctx.rotate(drawParams.rotationRad);
    ctx.scale(drawParams.stretchX, 1);
    ctx.globalAlpha = drawParams.dropletAlpha;
    ctx.drawImage(
      texture,
      -drawSize / 2,
      -drawSize / 2,
      drawSize,
      drawSize,
    );
    ctx.restore();
  }

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
