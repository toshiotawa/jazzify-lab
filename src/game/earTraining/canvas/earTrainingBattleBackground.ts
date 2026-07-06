import { EFFECT_ASSET_PATH } from './earTrainingBattleLayout';
import type { BackgroundCacheState } from './earTrainingBattleDrawState';

const JAZZ_BACKDROP_EDGE_COLOR = '#050505';

const drawCoverBackgroundImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
): void => {
  const imgAspect = img.width / img.height;
  const canvasAspect = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let drawX = 0;
  let drawY = 0;

  if (canvasAspect > imgAspect) {
    drawWidth = width;
    drawHeight = width / imgAspect;
    drawY = (height - drawHeight) / 2;
  } else {
    drawHeight = height;
    drawWidth = height * imgAspect;
    drawX = (width - drawWidth) / 2;
  }

  ctx.fillStyle = JAZZ_BACKDROP_EDGE_COLOR;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = drawWidth < img.width || drawHeight < img.height;
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

const drawLightVignette = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void => {
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.18);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.18);

  const bottomGrad = ctx.createLinearGradient(0, height * 0.82, 0, height);
  bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.82, width, height * 0.18);
};

const renderBackgroundToCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  loadedImages: Map<string, HTMLImageElement>,
): void => {
  const img = loadedImages.get('bgJazzClubInterior');
  if (img && img.width > 1) {
    drawCoverBackgroundImage(ctx, img, width, height);
    drawLightVignette(ctx, width, height);
    return;
  }

  ctx.fillStyle = JAZZ_BACKDROP_EDGE_COLOR;
  ctx.fillRect(0, 0, width, height);
};

export const BACKGROUND_IMAGE_URLS: Record<string, string> = {
  bgJazzClubInterior: `${EFFECT_ASSET_PATH}bg-jazz-club-interior.webp`,
};

export const PLAYER_POSE_IMAGE_URLS: Record<string, string> = {
  correct3: '/data/correct3.webp',
  guardD: '/GuardD.png',
  finish: '/finish.png',
  yokoIssen: '/yoko_issen.png',
  yokoIssenB: '/yoko_issen_B.png',
  yokoIssenC: '/yoko_issen_C.png',
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
