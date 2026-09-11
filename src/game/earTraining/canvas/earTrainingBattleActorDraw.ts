import {
  CHARACTER_DISPLAY_SIZE,
  CHARACTER_SHADOW_HEIGHT,
  CHARACTER_SHADOW_WIDTH,
} from './earTrainingBattleLayout';

const HUD_FONT = 'Arial, sans-serif';

export const BATTLE_RIM_SCALE = 1.048;
export const BATTLE_RIM_ALPHA = 0.12;
export const BATTLE_RIM_TINT_PLAYER = 'rgb(255, 195, 130)';
export const BATTLE_RIM_TINT_ENEMY = 'rgb(255, 175, 150)';

let tintCanvas: HTMLCanvasElement | null = null;
let tintCtx: CanvasRenderingContext2D | null = null;

interface RimTintCacheEntry {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const rimTintCache = new Map<string, RimTintCacheEntry>();

const getRimTintCacheKey = (
  imageSrc: string,
  width: number,
  height: number,
  tintColor: string,
): string => `${imageSrc}|${Math.round(width)}|${Math.round(height)}|${tintColor}`;

const getTintCanvasContext = (width: number, height: number): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (!tintCanvas) {
    tintCanvas = document.createElement('canvas');
    tintCtx = tintCanvas.getContext('2d');
  }
  if (!tintCtx || !tintCanvas) return null;
  if (tintCanvas.width < width) tintCanvas.width = width;
  if (tintCanvas.height < height) tintCanvas.height = height;
  tintCtx.setTransform(1, 0, 0, 1, 0, 0);
  tintCtx.globalCompositeOperation = 'source-over';
  tintCtx.globalAlpha = 1;
  tintCtx.clearRect(0, 0, width, height);
  return tintCtx;
};

const getCachedRimTintCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number,
  tintColor: string,
): HTMLCanvasElement | null => {
  if (typeof document === 'undefined') return null;
  const key = getRimTintCacheKey(img.src, width, height, tintColor);
  const cached = rimTintCache.get(key);
  if (cached) {
    return cached.canvas;
  }
  const offCtx = getTintCanvasContext(width, height);
  if (!offCtx || !tintCanvas) return null;
  offCtx.drawImage(img, 0, 0, width, height);
  offCtx.globalCompositeOperation = 'source-atop';
  offCtx.fillStyle = tintColor;
  offCtx.fillRect(0, 0, width, height);
  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = width;
  cacheCanvas.height = height;
  const cacheCtx = cacheCanvas.getContext('2d');
  if (!cacheCtx) return null;
  cacheCtx.drawImage(tintCanvas, 0, 0, width, height);
  rimTintCache.set(key, { canvas: cacheCanvas, width, height });
  return cacheCanvas;
};

const drawCachedRimTint = (
  targetCtx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  tintColor: string,
  tintAlpha: number,
): void => {
  const cached = getCachedRimTintCanvas(img, width, height, tintColor);
  if (!cached) return;
  targetCtx.save();
  targetCtx.globalAlpha = tintAlpha;
  targetCtx.drawImage(cached, x, y, width, height);
  targetCtx.restore();
};

const drawTintedImageCopy = (
  targetCtx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  tintColor: string,
  tintAlpha: number,
): void => {
  const offCtx = getTintCanvasContext(width, height);
  if (!offCtx || !tintCanvas) return;
  offCtx.drawImage(img, 0, 0, width, height);
  offCtx.globalCompositeOperation = 'source-atop';
  offCtx.fillStyle = tintColor;
  offCtx.fillRect(0, 0, width, height);
  targetCtx.save();
  targetCtx.globalAlpha = tintAlpha;
  targetCtx.drawImage(tintCanvas, x, y, width, height);
  targetCtx.restore();
};

const drawCharacterImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  flip: boolean,
): void => {
  ctx.save();
  if (flip) {
    ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW / 2, drawY, drawW, drawH);
  } else {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
};

export interface DrawBattleAvatarOptions {
  readonly flip?: boolean;
  readonly yOffset?: number;
  readonly rotationDeg?: number;
  readonly alpha?: number;
  readonly tintColor?: string | null;
  readonly tintAlpha?: number;
  readonly displaySize?: number;
  readonly fallbackLabel?: string;
}

export const drawBattleAvatar = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number,
  footY: number,
  side: 'player' | 'enemy',
  options: DrawBattleAvatarOptions = {},
): void => {
  const yOffset = options.yOffset ?? 0;
  const rotationDeg = options.rotationDeg ?? 0;
  const alpha = options.alpha ?? 1;
  const displaySize = options.displaySize ?? CHARACTER_DISPLAY_SIZE;
  const flip = options.flip ?? false;
  const rimTint = side === 'player' ? BATTLE_RIM_TINT_PLAYER : BATTLE_RIM_TINT_ENEMY;
  const fallbackLabel = options.fallbackLabel ?? (side === 'player' ? 'P' : 'E');

  ctx.save();
  ctx.translate(x, footY + yOffset);
  ctx.rotate(rotationDeg * Math.PI / 180);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(
    0,
    4 - yOffset,
    CHARACTER_SHADOW_WIDTH / 2,
    CHARACTER_SHADOW_HEIGHT / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (img) {
    const drawW = displaySize;
    const drawH = displaySize;
    const drawX = -drawW / 2;
    const drawY = -drawH;
    const rimW = drawW * BATTLE_RIM_SCALE;
    const rimH = drawH * BATTLE_RIM_SCALE;
    const rimOffsetX = (rimW - drawW) * 0.5;
    const rimOffsetY = (rimH - drawH) * 0.5;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (flip) {
      ctx.scale(-1, 1);
      drawCachedRimTint(ctx, img, -rimW / 2, drawY - rimOffsetY, rimW, rimH, rimTint, BATTLE_RIM_ALPHA);
    } else {
      drawCachedRimTint(ctx, img, drawX - rimOffsetX, drawY - rimOffsetY, rimW, rimH, rimTint, BATTLE_RIM_ALPHA);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    drawCharacterImage(ctx, img, drawX, drawY, drawW, drawH, flip);
    if (options.tintColor) {
      ctx.save();
      if (flip) ctx.scale(-1, 1);
      drawTintedImageCopy(
        ctx,
        img,
        flip ? -drawW / 2 : drawX,
        drawY,
        drawW,
        drawH,
        options.tintColor,
        (options.tintAlpha ?? 0.45) * alpha,
      );
      ctx.restore();
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 48px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = alpha;
    ctx.fillText(fallbackLabel, 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};
