import React, { useEffect, useMemo, useRef } from 'react';
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
  for (const url of map.assets.player) urls.add(url);
  for (const url of map.assets.slime) urls.add(url);
  for (const url of Object.values(map.assets.tiles)) urls.add(url);
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
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x, y, width, height);
    return;
  }
  ctx.fillStyle = fallback;
  ctx.fillRect(x, y, width, height);
};

const tileColor: Record<CodeRunTileKind, string> = {
  ground: '#3f8a5c',
  brick: '#8c5b45',
  platform: '#a67c4a',
  block: '#d4a93d',
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
      ctx.drawImage(bg, x, (map.viewHeight - drawH) / 2, drawW, drawH);
    }
    ctx.fillStyle = 'rgba(3, 8, 22, 0.32)';
    ctx.fillRect(0, 0, map.viewWidth, map.viewHeight);
  }
};

const CodeRunCanvas: React.FC<CodeRunCanvasProps> = ({ state, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const images = useImages(state.map);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { map } = state;
    canvas.width = map.viewWidth;
    canvas.height = map.viewHeight;
    ctx.imageSmoothingEnabled = false;

    drawBackground(ctx, state, images);
    ctx.save();
    ctx.translate(-Math.round(state.cameraX), 0);

    const tileImages = state.map.assets.tiles;
    for (const tile of map.solids) {
      if (tile.x + tile.width < state.cameraX - map.tileSize || tile.x > state.cameraX + map.viewWidth + map.tileSize) continue;
      drawImageOrRect(
        ctx,
        images[tileImages[tile.kind]],
        tile.x,
        tile.y,
        tile.width,
        tile.height,
        tileColor[tile.kind],
      );
    }

    for (const spike of map.spikes) {
      if (spike.x + spike.width < state.cameraX - map.tileSize || spike.x > state.cameraX + map.viewWidth + map.tileSize) continue;
      drawImageOrRect(ctx, images[tileImages.spike], spike.x, spike.y, spike.width, spike.height, '#e6e7ef');
    }

    const flag = images[tileImages.flag];
    const flagY = map.groundRow * map.tileSize - 84;
    ctx.fillStyle = '#d7e3ff';
    ctx.fillRect(map.goalX, flagY, 5, 84);
    drawImageOrRect(ctx, flag, map.goalX + 3, flagY, 56, 48, '#4ca3ff');

    const slimeFrames = map.assets.slime;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const frame = slimeFrames[Math.abs(Math.floor(enemy.anim)) % slimeFrames.length];
      drawImageOrRect(ctx, images[frame], enemy.x, enemy.y, enemy.width, enemy.height, '#7fd75a');
    }

    const playerFrames = map.assets.player;
    const playerIndex = !state.player.onGround
      ? Math.min(3, playerFrames.length - 1)
      : Math.abs(state.player.vx) > 0.3
        ? Math.abs(Math.floor(state.player.runPhase)) % Math.max(1, playerFrames.length - 1)
        : 0;
    const playerImage = images[playerFrames[playerIndex] ?? playerFrames[0]];
    ctx.save();
    if (state.player.facing < 0) {
      ctx.translate(state.player.x + state.player.width, state.player.y);
      ctx.scale(-1, 1);
      drawImageOrRect(ctx, playerImage, 0, 0, state.player.width, state.player.height, '#e9d7ff');
    } else {
      drawImageOrRect(ctx, playerImage, state.player.x, state.player.y, state.player.width, state.player.height, '#e9d7ff');
    }
    ctx.restore();

    ctx.restore();
  }, [images, state]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

export default CodeRunCanvas;
