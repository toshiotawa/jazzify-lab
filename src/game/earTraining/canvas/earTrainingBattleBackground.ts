import {
  CHARACTER_DISPLAY_SIZE,
  EFFECT_ASSET_PATH,
  getFloorY,
  HUD_HEIGHT,
  PIANO_OVERLAY_HEIGHT,
} from './earTrainingBattleLayout';
import type { BackgroundCacheState } from './earTrainingBattleDrawState';

const JAZZ_BACKDROP_EDGE_COLOR = '#050505';
const JAZZ_GOLD_TRIM = '#d58a2a';

const drawRadialGlow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color: string,
  alpha: number,
  steps: number,
): void => {
  for (let index = steps; index > 0; index -= 1) {
    const progress = index / steps;
    ctx.fillStyle = color.replace(/[\d.]+\)$/, `${alpha * progress * progress})`);
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX * progress, radiusY * progress, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawWeakBrickWall = (
  ctx: CanvasRenderingContext2D,
  width: number,
  wallHeight: number,
): void => {
  if (wallHeight <= 56) return;
  const sidePad = width * 0.045;
  const topPad = wallHeight * 0.048;
  const bottomPad = wallHeight * 0.088;
  const brickAreaHeight = wallHeight - topPad - bottomPad;
  const brickHeight = Math.max(21, brickAreaHeight / 15);
  const brickWidth = Math.max(72, brickHeight * 2.85);
  let row = 0;
  for (let y = topPad; y < topPad + brickAreaHeight; y += brickHeight + 5) {
    const stagger = (row % 2) * brickWidth * 0.5;
    for (let x = sidePad - brickWidth + stagger; x < width - sidePad + brickWidth; x += brickWidth) {
      ctx.fillStyle = 'rgba(89, 48, 21, 0.15)';
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(2, brickWidth - 6), Math.max(2, brickHeight - 5));
      ctx.strokeStyle = 'rgba(20, 13, 9, 0.11)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(Math.round(x), Math.round(y), Math.max(2, brickWidth - 6), Math.max(2, brickHeight - 5));
    }
    row += 1;
  }
};

const drawWallSconce = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  drawRadialGlow(ctx, x, y, 64, 42, 'rgba(213, 138, 42, 1)', 0.18, 9);
  ctx.fillStyle = 'rgba(58, 33, 20, 0.8)';
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 4, 18, 12, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(248, 212, 138, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y - 7, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawSpotlightCone = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorY: number,
  centerX: number,
  apexShift: number,
  color: string,
  alpha: number,
): void => {
  const apexY = Math.min(2, floorY - 36);
  const halfTop = width * 0.014;
  const halfBottom = width * 0.072;
  const apexX = centerX + apexShift;
  ctx.fillStyle = color.replace(/[\d.]+\)$/, `${alpha * 0.42})`);
  ctx.beginPath();
  ctx.moveTo(apexX - halfTop, apexY);
  ctx.lineTo(apexX + halfTop, apexY);
  ctx.lineTo(centerX + halfBottom, floorY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(apexX - halfTop, apexY);
  ctx.lineTo(centerX - halfBottom, floorY + 4);
  ctx.lineTo(centerX + halfBottom, floorY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color.replace(/[\d.]+\)$/, `${alpha * 0.18})`);
  ctx.beginPath();
  ctx.moveTo(apexX - halfTop * 0.35, apexY);
  ctx.lineTo(apexX + halfTop * 0.35, apexY);
  ctx.lineTo(centerX, height);
  ctx.closePath();
  ctx.fill();
  drawRadialGlow(ctx, centerX, floorY - CHARACTER_DISPLAY_SIZE * 0.4, halfBottom * 1.2, height * 0.28, color, alpha * 0.3, 8);
};

const drawJazzBarBackdrop = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorY: number,
): void => {
  const wallHeight = Math.max(80, floorY);
  const floorHeight = Math.max(0, height - floorY);
  const lipInset = Math.max(18, width * 0.018);

  ctx.fillStyle = JAZZ_BACKDROP_EDGE_COLOR;
  ctx.fillRect(0, 0, width, height);
  const wallGrad = ctx.createLinearGradient(0, 0, 0, wallHeight);
  wallGrad.addColorStop(0, '#160b08');
  wallGrad.addColorStop(1, '#2a160e');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, width, wallHeight);
  drawWeakBrickWall(ctx, width, wallHeight);

  drawRadialGlow(ctx, width * 0.24, wallHeight * 0.32, width * 0.34, wallHeight * 0.5, 'rgba(0, 0, 0, 1)', 0.16, 10);
  drawRadialGlow(ctx, width * 0.76, wallHeight * 0.3, width * 0.31, wallHeight * 0.45, 'rgba(0, 0, 0, 1)', 0.15, 10);
  drawRadialGlow(ctx, width * 0.5, wallHeight * 0.62, width * 0.28, wallHeight * 0.4, 'rgba(0, 0, 0, 1)', 0.2, 12);

  const shelfTop = Math.max(HUD_HEIGHT + 16, wallHeight * 0.22);
  const shelfHeight = Math.max(28, wallHeight * 0.13);
  ctx.fillStyle = 'rgba(8, 4, 3, 0.28)';
  ctx.beginPath();
  ctx.roundRect(width * 0.35, shelfTop, width * 0.3, shelfHeight, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 16, 9, 0.42)';
  ctx.fillRect(width * 0.37, shelfTop + shelfHeight * 0.38, width * 0.26, 5);
  for (let index = 0; index < 14; index += 1) {
    const bottleX = width * 0.38 + index * width * 0.018;
    const bottleHeight = 10 + (index % 4) * 4;
    ctx.fillStyle = index % 3 === 0 ? 'rgba(213, 138, 42, 0.2)' : 'rgba(95, 47, 24, 0.2)';
    ctx.beginPath();
    ctx.roundRect(bottleX, shelfTop + shelfHeight * 0.34 - bottleHeight, width * 0.008, bottleHeight, 2);
    ctx.fill();
  }

  drawWallSconce(ctx, width * 0.18, Math.max(72, wallHeight * 0.22));
  drawWallSconce(ctx, width * 0.82, Math.max(72, wallHeight * 0.22));

  const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
  floorGrad.addColorStop(0, '#24120b');
  floorGrad.addColorStop(1, '#3a2114');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, width, floorHeight);
  ctx.strokeStyle = 'rgba(56, 32, 24, 0.28)';
  ctx.lineWidth = 1;
  for (let index = 1; index < 8; index += 1) {
    const lineY = floorY + (floorHeight * index) / 8;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(width, lineY + 10);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  for (let index = 0; index < 12; index += 1) {
    const x = (width * index) / 12;
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x + width * 0.05, height);
    ctx.stroke();
  }

  const barSkirtHeight = Math.min(PIANO_OVERLAY_HEIGHT + 56, Math.max(12, height - floorY));
  const skirtGrad = ctx.createLinearGradient(0, height - barSkirtHeight, 0, height);
  skirtGrad.addColorStop(0, '#3a2114');
  skirtGrad.addColorStop(1, '#24120b');
  ctx.fillStyle = skirtGrad;
  ctx.fillRect(0, height - barSkirtHeight, width, barSkirtHeight);
  ctx.strokeStyle = 'rgba(213, 138, 42, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lipInset, height - barSkirtHeight + 2);
  ctx.lineTo(width - lipInset, height - barSkirtHeight + 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(213, 138, 42, 0.22)';
  ctx.beginPath();
  ctx.moveTo(lipInset + 10, floorY - 3);
  ctx.lineTo(width - lipInset - 10, floorY - 3);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(180, 105, 40, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lipInset + 4, floorY + 2);
  ctx.lineTo(width - lipInset - 4, floorY + 2);
  ctx.stroke();
};

const drawStageLighting = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorY: number,
): void => {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(0, 0, width, height);
  drawRadialGlow(ctx, width * 0.23, floorY - 36, width * 0.24, height * 0.24, 'rgba(255, 255, 255, 1)', 0.18, 10);
  drawRadialGlow(ctx, width * 0.77, floorY - 36, width * 0.24, height * 0.24, 'rgba(255, 255, 255, 1)', 0.2, 10);
  drawRadialGlow(ctx, width * 0.5, floorY * 0.36, width * 0.22, height * 0.28, 'rgba(0, 0, 0, 1)', 0.16, 10);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawSpotlightCone(ctx, width, height, floorY, width * 0.23, width * 0.02, 'rgba(255, 210, 155, 1)', 0.11);
  drawSpotlightCone(ctx, width, height, floorY, width * 0.77, -width * 0.02, 'rgba(255, 200, 175, 1)', 0.13);
  drawRadialGlow(ctx, width * 0.23, floorY - 6, 88, 17, 'rgba(255, 210, 155, 1)', 0.13, 8);
  drawRadialGlow(ctx, width * 0.77, floorY - 6, 88, 17, 'rgba(255, 200, 175, 1)', 0.15, 8);
  ctx.restore();
};

const drawStageFloorShadows = (
  ctx: CanvasRenderingContext2D,
  width: number,
  floorY: number,
): void => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.17)';
  ctx.beginPath();
  ctx.ellipse(width * 0.23, floorY + 6, 84, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(width * 0.77, floorY + 6, 84, 14, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawFinalStageVignette = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
  ctx.fillRect(0, 0, width, HUD_HEIGHT * 0.65);
  drawRadialGlow(ctx, 0, 0, width * 0.62, height * 0.62, 'rgba(0, 0, 0, 1)', 0.2, 12);
  drawRadialGlow(ctx, width, 0, width * 0.62, height * 0.62, 'rgba(0, 0, 0, 1)', 0.2, 12);
  drawRadialGlow(ctx, 0, height, width * 0.62, height * 0.62, 'rgba(0, 0, 0, 1)', 0.22, 12);
  drawRadialGlow(ctx, width, height, width * 0.62, height * 0.62, 'rgba(0, 0, 0, 1)', 0.22, 12);
};

const drawStageProp = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  maxWidth: number,
  originX: number,
  originY: number,
  alpha: number,
): void => {
  if (!img || img.width <= 1) return;
  const displayWidth = Math.max(1, Math.floor(maxWidth));
  const displayHeight = Math.max(1, Math.floor(displayWidth * (img.height / img.width)));
  const drawX = x - displayWidth * originX;
  const drawY = y - displayHeight * originY;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, drawX, drawY, displayWidth, displayHeight);
  ctx.restore();
};

const renderBackgroundToCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  loadedImages: Map<string, HTMLImageElement>,
): void => {
  const floorY = getFloorY(height);
  drawJazzBarBackdrop(ctx, width, height, floorY);
  drawStageLighting(ctx, width, height, floorY);
  drawStageProp(ctx, loadedImages.get('bgDoubleBass'), width * 0.075, floorY, width * 0.12, 0.5, 1, 0.82);
  drawStageProp(ctx, loadedImages.get('bgPiano'), width * 0.352, floorY, width * 0.15, 0.5, 1, 0.82);
  const drumMaxWidth = Math.max(1, Math.floor(width * 0.158));
  const drumHalfWidth = drumMaxWidth * 0.5;
  const enemyApproxRightEdgeX = width * 0.77 + CHARACTER_DISPLAY_SIZE * 0.48;
  const drumMaxCenterX = width - 16 - drumHalfWidth;
  const minimumCenterPastEnemy = enemyApproxRightEdgeX + drumHalfWidth * 0.32 + 10;
  const preferredDrumCenterX = width * 0.91;
  const drumCenterX = Math.min(Math.max(preferredDrumCenterX, Math.min(minimumCenterPastEnemy, drumMaxCenterX)), drumMaxCenterX);
  drawStageProp(ctx, loadedImages.get('bgDrumKit'), drumCenterX, floorY, drumMaxWidth, 0.5, 1, 0.84);
  drawStageFloorShadows(ctx, width, floorY);
  drawFinalStageVignette(ctx, width, height);
};

export const BACKGROUND_IMAGE_URLS: Record<string, string> = {
  bgDoubleBass: `${EFFECT_ASSET_PATH}bg-double-bass.webp`,
  bgPiano: `${EFFECT_ASSET_PATH}bg-upright-piano.webp`,
  bgDrumKit: `${EFFECT_ASSET_PATH}bg-drum-kit.webp`,
};

export const PLAYER_POSE_IMAGE_URLS: Record<string, string> = {
  correct3: '/data/correct3.webp',
  cast: '/data/eishou.png',
  skill1: '/data/Frame1.webp',
  skill2: '/data/Frame2.webp',
  skill3: '/data/Frame3.webp',
  skill4: '/data/Frame4.webp',
  skill5: '/data/Frame5.webp',
  skill6: '/data/Frame6.webp',
};

export const drawCachedBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cache: BackgroundCacheState,
  loadedImages: Map<string, HTMLImageElement>,
): void => {
  if (!cache.canvas || cache.width !== width || cache.height !== height) {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      renderBackgroundToCanvas(offCtx, width, height, loadedImages);
    }
    cache.canvas = offscreen;
    cache.width = width;
    cache.height = height;
  }
  if (cache.canvas) {
    ctx.drawImage(cache.canvas, 0, 0, width, height);
  }
};

export const invalidateBackgroundCache = (cache: BackgroundCacheState): void => {
  cache.canvas = null;
  cache.width = 0;
  cache.height = 0;
};
