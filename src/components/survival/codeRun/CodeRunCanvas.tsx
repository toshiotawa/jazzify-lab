import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { getEffectiveCanvasDpr } from '@/utils/getEffectiveCanvasDpr';
import type { CodeRunMapSpec, CodeRunState, CodeRunTileKind } from './CodeRunTypes';

type ImageMap = Record<string, HTMLImageElement>;

interface CodeRunCanvasProps {
  state: CodeRunState;
  className?: string;
}

const loadImage = (url: string): HTMLImageElement => {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  return image;
};

const collectAssetUrls = (map: CodeRunMapSpec): string[] => {
  const urls = new Set<string>();
  urls.add(map.assets.background);
  urls.add(map.assets.playerHurt);
  for (const url of map.assets.player) urls.add(url);
  for (const url of map.assets.slime) urls.add(url);
  const { tiles } = map.assets;
  urls.add(tiles.ground);
  if (tiles.groundTop) urls.add(tiles.groundTop);
  if (tiles.groundTopLeft) urls.add(tiles.groundTopLeft);
  if (tiles.groundTopRight) urls.add(tiles.groundTopRight);
  urls.add(tiles.brick);
  urls.add(tiles.platform);
  urls.add(tiles.block);
  urls.add(tiles.spike);
  urls.add(tiles.flag);
  return [...urls];
};

/** コンテナに収まるピクセルアート向け表示倍率（拡大は整数倍、縮小は 0.5 刻み）。 */
const computePixelScale = (containerW: number, containerH: number, viewW: number, viewH: number): number => {
  if (containerW <= 0 || containerH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  const fit = Math.min(containerW / viewW, containerH / viewH);
  if (fit >= 1) return Math.max(1, Math.floor(fit));
  return Math.max(0.25, Math.floor(fit * 2) / 2);
};

const applySharpCanvas = (ctx: CanvasRenderingContext2D): void => {
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'low';
};

function useImages(map: CodeRunMapSpec): ImageMap {
  return useMemo(() => {
    const images: ImageMap = {};
    for (const url of collectAssetUrls(map)) images[url] = loadImage(url);
    return images;
  }, [map]);
}

const drawImageOrRect = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  fallback: string,
): void => {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(width);
  const rh = Math.round(height);
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, rx, ry, rw, rh);
    return;
  }
  ctx.fillStyle = fallback;
  ctx.fillRect(rx, ry, rw, rh);
};

const tileColor: Record<CodeRunTileKind, string> = {
  ground: '#4a3828',
  brick: '#5c4030',
  platform: '#3d3028',
  block: '#6a4a32',
};

const buildGroundSurfaceColumns = (solids: CodeRunMapSpec['solids'], groundSurfaceY: number, tileSize: number): Set<number> => {
  const columns = new Set<number>();
  for (const tile of solids) {
    if (tile.kind === 'ground' && tile.y === groundSurfaceY) {
      columns.add(Math.round(tile.x / tileSize));
    }
  }
  return columns;
};

const tileImageUrl = (
  tiles: CodeRunMapSpec['assets']['tiles'],
  kind: CodeRunTileKind,
  tile: { x: number; y: number },
  groundSurfaceY: number,
  tileSize: number,
  groundSurfaceColumns: Set<number>,
): string => {
  if (kind === 'ground' && tile.y === groundSurfaceY) {
    const col = Math.round(tile.x / tileSize);
    const hasLeft = groundSurfaceColumns.has(col - 1);
    const hasRight = groundSurfaceColumns.has(col + 1);
    if (!hasLeft && tiles.groundTopLeft) return tiles.groundTopLeft;
    if (!hasRight && tiles.groundTopRight) return tiles.groundTopRight;
    if (tiles.groundTop) return tiles.groundTop;
  }
  return tiles[kind];
};

export interface CodeRunBackgroundLayout {
  drawW: number;
  drawH: number;
  drawY: number;
  /** 画像下端より下を埋めるグラデーション開始 Y。不要なら null。 */
  gradientTop: number | null;
}

/** 背景画像下端の霧色（グラデーション接続用）。 */
const CODE_RUN_BG_GRADIENT_TOP = '#6d4a7a';
const CODE_RUN_BG_GRADIENT_MID = '#452a52';
const CODE_RUN_BG_GRADIENT_BOTTOM = '#1a0c22';
const CODE_RUN_BG_PARALLAX_Y = 0.08;

/** 横タイル前提で幅に合わせ、縦長ワールドは cameraY パララックスで上へ流す。 */
export const computeBackgroundLayout = (
  viewWidth: number,
  viewHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  worldHeight: number,
  cameraY: number,
): CodeRunBackgroundLayout => {
  const drawW = viewWidth;
  const drawH = naturalHeight * (viewWidth / naturalWidth);
  const bottomAlignedY = viewHeight - drawH;

  let drawY: number;
  if (worldHeight > viewHeight) {
    const rawDrawY = bottomAlignedY - cameraY * CODE_RUN_BG_PARALLAX_Y;
    drawY = Math.min(0, rawDrawY);
  } else {
    drawY = (viewHeight - drawH) / 2 - cameraY * CODE_RUN_BG_PARALLAX_Y;
  }

  const roundedDrawY = Math.round(drawY);
  const roundedDrawH = Math.round(drawH);
  const imageBottom = roundedDrawY + roundedDrawH;
  const gradientTop = imageBottom < viewHeight ? imageBottom : null;

  return { drawW, drawH, drawY: roundedDrawY, gradientTop };
};

const drawBackgroundGradient = (
  ctx: CanvasRenderingContext2D,
  gradientTop: number,
  viewWidth: number,
  viewHeight: number,
): void => {
  const topY = Math.max(0, Math.round(gradientTop));
  if (topY >= viewHeight) return;
  const gradient = ctx.createLinearGradient(0, topY, 0, viewHeight);
  gradient.addColorStop(0, CODE_RUN_BG_GRADIENT_TOP);
  gradient.addColorStop(0.45, CODE_RUN_BG_GRADIENT_MID);
  gradient.addColorStop(1, CODE_RUN_BG_GRADIENT_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, topY, viewWidth, viewHeight - topY);
};

const drawBackground = (ctx: CanvasRenderingContext2D, state: CodeRunState, images: ImageMap): void => {
  const { map } = state;
  const bg = images[map.assets.background];
  ctx.fillStyle = '#071026';
  ctx.fillRect(0, 0, map.viewWidth, map.viewHeight);
  if (bg?.complete && bg.naturalWidth > 0) {
    const layout = computeBackgroundLayout(
      map.viewWidth,
      map.viewHeight,
      bg.naturalWidth,
      bg.naturalHeight,
      map.worldHeight,
      state.cameraY,
    );
    const drawW = Math.round(layout.drawW);
    const drawH = Math.round(layout.drawH);
    if (layout.gradientTop !== null) {
      drawBackgroundGradient(ctx, layout.gradientTop, map.viewWidth, map.viewHeight);
    }
    const parallax = -(state.cameraX * 0.18) % drawW;
    for (let x = parallax - drawW; x < map.viewWidth + drawW; x += drawW) {
      ctx.drawImage(bg, Math.round(x), layout.drawY, drawW, drawH);
    }
    ctx.fillStyle = 'rgba(6, 10, 18, 0.22)';
    ctx.fillRect(0, 0, map.viewWidth, map.viewHeight);
    const groundBandTop = map.groundRow * map.tileSize - map.tileSize * 2;
    ctx.fillStyle = 'rgba(12, 16, 24, 0.12)';
    ctx.fillRect(0, groundBandTop, map.viewWidth, map.viewHeight - groundBandTop);
  }
};

const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  player: CodeRunState['player'],
  fallback: string,
): void => {
  const footY = Math.round(player.y + player.height);
  const centerX = Math.round(player.x + player.width / 2);

  if (!image?.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    ctx.fillStyle = fallback;
    ctx.fillRect(Math.round(player.x), Math.round(player.y), Math.round(player.width), Math.round(player.height));
    return;
  }

  const drawW = image.naturalWidth;
  const drawH = image.naturalHeight;
  const drawX = Math.round(centerX - drawW / 2);
  const drawY = Math.round(footY - drawH);

  if (player.facing < 0) {
    const anchorX = Math.round(centerX + drawW / 2);
    ctx.save();
    ctx.translate(anchorX, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
    return;
  }

  ctx.drawImage(image, drawX, drawY);
};

const shouldBlinkInvulnerable = (state: CodeRunState): boolean => {
  if (state.player.invulFrames <= 0) return false;
  const tick = Math.floor(state.elapsedSec * 60);
  return Math.floor(tick / 4) % 2 === 0;
};

const CodeRunCanvas: React.FC<CodeRunCanvasProps> = ({ state, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const images = useImages(state.map);
  const { viewWidth, viewHeight } = state.map;
  const [pixelScale, setPixelScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = (): void => {
      const { width, height } = el.getBoundingClientRect();
      setPixelScale(computePixelScale(width, height, viewWidth, viewHeight));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewWidth, viewHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = getEffectiveCanvasDpr();
    canvas.width = Math.round(viewWidth * pixelScale * dpr);
    canvas.height = Math.round(viewHeight * pixelScale * dpr);
    canvas.style.width = `${viewWidth * pixelScale}px`;
    canvas.style.height = `${viewHeight * pixelScale}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) applySharpCanvas(ctx);
  }, [viewWidth, viewHeight, pixelScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = getEffectiveCanvasDpr();
    const transformScale = pixelScale * dpr;
    ctx.setTransform(transformScale, 0, 0, transformScale, 0, 0);
    applySharpCanvas(ctx);
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    const { map } = state;

    drawBackground(ctx, state, images);
    ctx.save();
    ctx.translate(-Math.round(state.cameraX), -Math.round(state.cameraY));

    const tileImages = state.map.assets.tiles;
    const groundSurfaceY = map.groundRow * map.tileSize;
    const groundSurfaceColumns = buildGroundSurfaceColumns(map.solids, groundSurfaceY, map.tileSize);
    for (const tile of map.solids) {
      if (tile.x + tile.width < state.cameraX - map.tileSize || tile.x > state.cameraX + map.viewWidth + map.tileSize) continue;
      if (tile.y + tile.height < state.cameraY - map.tileSize || tile.y > state.cameraY + map.viewHeight + map.tileSize) continue;
      const url = tileImageUrl(tileImages, tile.kind, tile, groundSurfaceY, map.tileSize, groundSurfaceColumns);
      drawImageOrRect(
        ctx,
        images[url],
        tile.x,
        tile.y,
        tile.width,
        tile.height,
        tileColor[tile.kind],
      );
    }

    for (const spike of map.spikes) {
      if (spike.x + spike.width < state.cameraX - map.tileSize || spike.x > state.cameraX + map.viewWidth + map.tileSize) continue;
      if (spike.y + spike.height < state.cameraY - map.tileSize || spike.y > state.cameraY + map.viewHeight + map.tileSize) continue;
      drawImageOrRect(ctx, images[tileImages.spike], spike.x, spike.y, spike.width, spike.height, '#5a6078');
    }

    const flag = images[tileImages.flag];
    const flagY = map.goalY ?? map.groundRow * map.tileSize - 84;
    ctx.fillStyle = '#3a3048';
    ctx.fillRect(map.goalX, flagY, 5, 84);
    drawImageOrRect(ctx, flag, map.goalX + 3, flagY, 56, 48, '#e8a040');

    const slimeFrames = map.assets.slime;
    const enemyScale = 1.12;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const frame = slimeFrames[Math.abs(Math.floor(enemy.anim)) % slimeFrames.length];
      const ew = enemy.width * enemyScale;
      const eh = enemy.height * enemyScale;
      const ex = enemy.x - (ew - enemy.width) / 2;
      const ey = enemy.y - (eh - enemy.height);
      drawImageOrRect(ctx, images[frame], ex, ey, ew, eh, '#7fd75a');
    }

    if (!shouldBlinkInvulnerable(state)) {
      const playerFrames = map.assets.player;
      const useHurt = state.player.hurtFrames > 0;
      const playerIndex = useHurt
        ? -1
        : !state.player.onGround
          ? Math.min(3, playerFrames.length - 1)
          : Math.abs(state.player.vx) > 0.3
            ? Math.abs(Math.floor(state.player.runPhase)) % Math.max(1, playerFrames.length - 1)
            : 0;
      const frameUrl = useHurt
        ? map.assets.playerHurt
        : (playerFrames[playerIndex] ?? playerFrames[0]);
      const playerImage = images[frameUrl];
      drawPlayerSprite(ctx, playerImage, state.player, '#e9d7ff');
    }

    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [images, pixelScale, state, viewWidth, viewHeight]);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full w-full items-center justify-center', className)}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default CodeRunCanvas;
