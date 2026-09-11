/**
 * Defense mode canvas host. Drawing is driven imperatively by the game loop via `draw(runtime, hud)`
 * so no React state changes per frame.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { BACKGROUND_IMAGE_URLS } from '@/game/earTraining/canvas/earTrainingBattleBackground';
import { preloadEarTrainingBattleImages } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';
import type { BackgroundCacheState } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import { loadDefenseEnemySprites } from '@/game/defense/defenseEnemySprites';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';
import {
  drawDefenseScene,
  invalidateBackgroundCache,
  type DefenseSceneAssets,
} from '@/game/defense/drawDefenseScene';
import type { DefenseSceneHud } from '@/game/defense/defenseSceneHud';
import type { DefenseRuntime } from '@/game/defense/defenseTypes';
import { EAR_TRAINING_PLAYER_AVATAR_URL } from '@/utils/constants';

export interface DefenseCanvasHandle {
  draw: (runtime: DefenseRuntime, hud: DefenseSceneHud) => void;
}

interface DefenseCanvasProps {
  readonly className?: string;
}

export const DefenseCanvas = forwardRef<DefenseCanvasHandle, DefenseCanvasProps>(
  ({ className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const sizeRef = useRef({ width: 0, height: 0 });
    const atlasRef = useRef<DefenseEnemySpriteAtlas | null>(null);
    const assetsRef = useRef<DefenseSceneAssets | null>(null);

    useImperativeHandle(ref, () => ({
      draw: (runtime: DefenseRuntime, hud: DefenseSceneHud) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;
        drawDefenseScene(ctx, width, height, runtime, hud, atlasRef.current, assetsRef.current);
      },
    }), []);

    useEffect(() => {
      let cancelled = false;
      const backgroundCache: BackgroundCacheState = {
        width: 0,
        height: 0,
        timingCalibrationLayout: false,
        canvas: null,
      };

      void (async () => {
        const [atlas, imageMap] = await Promise.all([
          loadDefenseEnemySprites(),
          preloadEarTrainingBattleImages([
            EAR_TRAINING_PLAYER_AVATAR_URL,
            ...Object.values(BACKGROUND_IMAGE_URLS),
          ]),
        ]);
        if (cancelled) return;
        if (atlas) {
          atlasRef.current = atlas;
        }
        assetsRef.current = {
          loadedImages: imageMap,
          backgroundCache,
          playerAvatarUrl: EAR_TRAINING_PLAYER_AVATAR_URL,
        };
      })();

      return () => {
        cancelled = true;
        atlasRef.current = null;
        assetsRef.current = null;
      };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      ctxRef.current = ctx;

      const resize = (): void => {
        const parent = canvas.parentElement;
        const width = parent?.clientWidth ?? 800;
        const height = parent?.clientHeight ?? 400;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sizeRef.current = { width, height };
        if (assetsRef.current) {
          invalidateBackgroundCache(assetsRef.current.backgroundCache);
        }
      };

      resize();
      window.addEventListener('resize', resize);
      return () => {
        window.removeEventListener('resize', resize);
        ctxRef.current = null;
      };
    }, []);

    return <canvas ref={canvasRef} className={className} aria-hidden />;
  },
);

DefenseCanvas.displayName = 'DefenseCanvas';
