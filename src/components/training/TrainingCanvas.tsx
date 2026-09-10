import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { drawTrainingScene } from '@/game/training/drawTrainingScene';
import type { TrainingRuntime } from '@/game/training/trainingTypes';
import { loadDefenseEnemySprites } from '@/game/defense/defenseEnemySprites';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';

export interface TrainingCanvasHandle {
  draw: (runtime: TrainingRuntime) => void;
}

interface TrainingCanvasProps {
  readonly className?: string;
}

export const TrainingCanvas = forwardRef<TrainingCanvasHandle, TrainingCanvasProps>(
  ({ className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const sizeRef = useRef({ width: 0, height: 0 });
    const atlasRef = useRef<DefenseEnemySpriteAtlas | null>(null);

    useImperativeHandle(ref, () => ({
      draw: (runtime: TrainingRuntime) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;
        drawTrainingScene(ctx, width, height, runtime, atlasRef.current);
      },
    }), []);

    useEffect(() => {
      let cancelled = false;
      void loadDefenseEnemySprites().then((atlas) => {
        if (!cancelled && atlas) {
          atlasRef.current = atlas;
        }
      });
      return () => {
        cancelled = true;
        atlasRef.current = null;
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

TrainingCanvas.displayName = 'TrainingCanvas';
