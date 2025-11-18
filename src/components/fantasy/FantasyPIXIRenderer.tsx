import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import type { MonsterState as GameMonsterState } from './FantasyGameEngine';

interface FantasyRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  enemyGauge: number;
  onReady?: (instance: FantasyPIXIInstance) => void;
  onMonsterDefeated?: () => void;
  onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  className?: string;
  activeMonsters?: GameMonsterState[];
  imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
}

interface TaikoNoteVisual {
  id: string;
  chord: string;
  x: number;
}

interface HitEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  success: boolean;
}

const MONSTER_PATHS = (icon: string): string[] => [
  `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`,
  `${import.meta.env.BASE_URL}monster_icons/${icon}.png`
];

const loadSingleImage = (path: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${path}`));
    image.src = path;
  });

const loadImage = async (paths: string[]): Promise<HTMLImageElement> => {
  for (const path of paths) {
    try {
      return await loadSingleImage(path);
    } catch {
      continue;
    }
  }
  throw new Error('Image not found');
};

class FantasyCanvasRendererInstance {
  private readonly root: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;
  private rafId: number | null = null;
  private isDestroyed = false;
  private monsterImage: HTMLImageElement | null = null;
  private monsterOpacity = 1;
  private monsterFlash = 0;
  private taikoMode = false;
  private taikoNotes: TaikoNoteVisual[] = [];
  private hitEffects: HitEffect[] = [];
  private overlayText: string | null = null;
  private enemyGauge = 1;
  private judgeLineX: number;
  private readonly imageCache: Map<string, HTMLImageElement>;

  constructor(
    private width: number,
    private height: number,
    private onMonsterDefeated?: () => void,
    private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void,
    imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>
  ) {
    this.dpr = window.devicePixelRatio || 1;
    this.root = document.createElement('div');
    this.root.className = 'relative w-full h-full touch-none select-none';
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.root.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    ctx.scale(this.dpr, this.dpr);
    this.ctx = ctx;
    this.judgeLineX = Math.round(this.width * 0.18);
    this.imageCache = imageTexturesRef?.current ?? new Map();
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (this.isDestroyed) return;
      this.drawScene();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private drawScene(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
    bg.addColorStop(0, '#050512');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, this.height - 32, this.width, 32);

    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(24, 24, (this.width - 48) * this.enemyGauge, 12);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, this.width - 48, 12);

    if (this.overlayText) {
      ctx.font = '600 20px "Inter", "Noto Sans JP"';
      ctx.fillStyle = '#fcd34d';
      ctx.textAlign = 'center';
      ctx.fillText(this.overlayText, this.width / 2, 60);
    }

    if (this.monsterImage) {
      const scale = Math.min(
        (this.width * 0.4) / this.monsterImage.width,
        (this.height * 0.6) / this.monsterImage.height
      );
      const displayWidth = this.monsterImage.width * scale;
      const displayHeight = this.monsterImage.height * scale;
      const x = this.width / 2 - displayWidth / 2;
      const y = this.height / 2 - displayHeight / 2;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.monsterOpacity);
      ctx.drawImage(this.monsterImage, x, y, displayWidth, displayHeight);
      if (this.monsterFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${this.monsterFlash})`;
        ctx.fillRect(x, y, displayWidth, displayHeight);
        this.monsterFlash = Math.max(0, this.monsterFlash - 0.05);
      }
      ctx.restore();
    }

    if (this.taikoMode) {
      ctx.strokeStyle = 'rgba(255,215,0,0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.judgeLineX, this.height / 2, 42, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(119,220,255,0.2)';
      ctx.fillRect(0, this.height / 2 - 50, this.width, 100);

      this.taikoNotes.forEach((note) => {
        ctx.save();
        ctx.translate(note.x, this.height / 2);
        ctx.fillStyle = 'rgba(255,107,107,0.8)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '600 18px "Kaisei Opti", serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(note.chord, 0, -48);
        ctx.restore();
      });
    }

    const now = performance.now();
    this.hitEffects = this.hitEffects.filter((effect) => effect.life > 0);
    this.hitEffects.forEach((effect) => {
      effect.life -= 16;
      const progress = 1 - effect.life / effect.maxLife;
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = effect.success ? '#fcd34d' : '#f87171';
      ctx.lineWidth = effect.success ? 4 : 6;
      ctx.beginPath();
      if (effect.success) {
        ctx.arc(0, 0, 30 + progress * 20, 0, Math.PI * 2);
      } else {
        ctx.moveTo(-20, -20);
        ctx.lineTo(20, 20);
        ctx.moveTo(20, -20);
        ctx.lineTo(-20, 20);
      }
      ctx.stroke();
      ctx.restore();
    });

    this.monsterOpacity = Math.max(0, this.monsterOpacity - 0.0025);
    if (this.monsterOpacity === 0 && this.onMonsterDefeated && !this.isDestroyed) {
      this.onMonsterDefeated();
      this.onMonsterDefeated = undefined;
    }
  }

  async createMonsterSprite(icon: string): Promise<void> {
    if (!icon) return;
    if (this.imageCache.has(icon)) {
      this.monsterImage = this.imageCache.get(icon) ?? null;
      this.monsterOpacity = 1;
      return;
    }
    try {
      const image = await loadImage(MONSTER_PATHS(icon));
      this.imageCache.set(icon, image);
      this.monsterImage = image;
      this.monsterOpacity = 1;
    } catch (error) {
      devLog.debug('Failed to load monster image', error);
    }
  }

  triggerAttackSuccessOnMonster(monsterId: string, magicName: string, isSpecial: boolean, _damage: number, defeated: boolean): void {
    this.monsterFlash = isSpecial ? 0.7 : 0.45;
    this.onShowMagicName?.(magicName, isSpecial, monsterId);
    if (defeated) {
      this.monsterOpacity = 0.99;
    }
  }

  createNoteHitEffect(x: number, y: number, isSuccess: boolean): void {
    this.hitEffects.push({
      x,
      y,
      life: 300,
      maxLife: 300,
      success: isSuccess
    });
  }

  updateTaikoMode(enabled: boolean): void {
    this.taikoMode = enabled;
    if (!enabled) {
      this.taikoNotes = [];
    }
  }

  updateTaikoNotes(notes: Array<{ id: string; chord: string; x: number }>): void {
    this.taikoNotes = notes.map((note) => ({ ...note }));
  }

  updateOverlayText(text: string | null): void {
    this.overlayText = text;
  }

  updateGauge(value: number): void {
    this.enemyGauge = Math.max(0, Math.min(1, value));
  }

  getJudgeLinePosition(): { x: number; y: number } {
    return { x: this.judgeLineX, y: this.height / 2 };
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  get view(): HTMLDivElement {
    return this.root;
  }
}

export type FantasyPIXIInstance = FantasyCanvasRendererInstance;

export const FantasyPIXIRenderer: React.FC<FantasyRendererProps> = ({
  width,
  height,
  monsterIcon,
  enemyGauge,
  onReady,
  onMonsterDefeated,
  onShowMagicName,
  className,
  imageTexturesRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<FantasyCanvasRendererInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return;
    const instance = new FantasyCanvasRendererInstance(width, height, onMonsterDefeated, onShowMagicName, imageTexturesRef);
    instanceRef.current = instance;
    containerRef.current.appendChild(instance.view);
    void instance.createMonsterSprite(monsterIcon);
    instance.updateGauge(enemyGauge);
    onReady?.(instance);
    devLog.debug('🎨 Fantasy Canvas renderer ready');

    return () => {
      instanceRef.current?.destroy();
      if (instance.view.parentElement) {
        instance.view.parentElement.removeChild(instance.view);
      }
      instanceRef.current = null;
    };
  }, [width, height, monsterIcon, enemyGauge, onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    void instance.createMonsterSprite(monsterIcon);
  }, [monsterIcon]);

  useEffect(() => {
    instanceRef.current?.updateGauge(enemyGauge);
  }, [enemyGauge]);

  return <div ref={containerRef} className={cn('w-full h-full relative', className)} />;
};

export default FantasyPIXIRenderer;
