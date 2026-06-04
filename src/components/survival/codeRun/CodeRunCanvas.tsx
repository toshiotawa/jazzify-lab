import React, { useEffect, useMemo, useRef } from 'react';
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
  urls.add(tiles.brick);
  urls.add(tiles.platform);
  urls.add(tiles.block);
  urls.add(tiles.spike);
  urls.add(tiles.flag);
  return [...urls];
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
  ground: '#3d3248',
  brick: '#6b4e42',
  platform: '#4a3428',
  block: '#4a3848',
};

const tileImageUrl = (
  tiles: CodeRunMapSpec['assets']['tiles'],
  kind: CodeRunTileKind,
  tileY: number,
  groundSurfaceY: number,
): string => {
  if (kind === 'ground' && tiles.groundTop && tileY === groundSurfaceY) {
    return tiles.groundTop;
  }
  return tiles[kind];
};

const drawBackground = (ctx: CanvasRenderingContext2D, state: CodeRunState, images: ImageMap): void => {
  const { map } = state;
  const bg = images[map.assets.background];
  ctx.fillStyle = '#071026';
  ctx.fillRect(0, 0, map.viewWidth, map.viewHeight);
  if (bg?.complete && bg.naturalWidth > 0) {
    const scale = Math.max(map.viewWidth / bg.naturalWidth, map.viewHeight / bg.naturalHeight);
    const drawW = bg.naturalWidth * scale;
    const drawH = bg.naturalHeight * scale;
    const parallax = -(state.cameraX * 0.18) % drawW;
    for (let x = parallax - drawW; x < map.viewWidth + drawW; x += drawW) {
      ctx.drawImage(bg, Math.round(x), Math.round((map.viewHeight - drawH) / 2), Math.round(drawW), Math.round(drawH));
    }
    ctx.fillStyle = 'rgba(8, 6, 18, 0.48)';
    ctx.fillRect(0, 0, map.viewWidth, map.viewHeight);
    const groundBandTop = map.groundRow * map.tileSize - map.tileSize * 2;
    ctx.fillStyle = 'rgba(18, 12, 28, 0.2)';
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
  const drawY = footY - drawH;

  if (player.facing < 0) {
    ctx.save();
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, Math.round(-drawW / 2), drawY);
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const images = useImages(state.map);
  const { viewWidth, viewHeight } = state.map;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = getEffectiveCanvasDpr();
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
  }, [viewWidth, viewHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = getEffectiveCanvasDpr();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const { map } = state;

    drawBackground(ctx, state, images);
    ctx.save();
    ctx.translate(-Math.round(state.cameraX), 0);

    const tileImages = state.map.assets.tiles;
    const groundSurfaceY = map.groundRow * map.tileSize;
    for (const tile of map.solids) {
      if (tile.x + tile.width < state.cameraX - map.tileSize || tile.x > state.cameraX + map.viewWidth + map.tileSize) continue;
      const url = tileImageUrl(tileImages, tile.kind, tile.y, groundSurfaceY);
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
      drawImageOrRect(ctx, images[tileImages.spike], spike.x, spike.y, spike.width, spike.height, '#5a6078');
    }

    const flag = images[tileImages.flag];
    const flagY = map.groundRow * map.tileSize - 84;
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
  }, [images, state, viewWidth, viewHeight]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
    />
  );
};

export default CodeRunCanvas;
