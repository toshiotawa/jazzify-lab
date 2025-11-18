import React, { useEffect, useRef } from 'react';
import type { MonsterState } from './FantasyGameEngine';
import { cn } from '@/utils/cn';

interface FantasyPIXIRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  enemyGauge: number;
  onReady?: (instance: FantasyPIXIInstance) => void;
  onMonsterDefeated?: () => void;
  onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  className?: string;
  activeMonsters?: MonsterState[];
  imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
}

interface TaikoDisplayNote {
  id: string;
  chord: string;
  x: number;
}

interface ParticleEffect {
  x: number;
  y: number;
  start: number;
  duration: number;
  success: boolean;
}

interface MonsterVisual {
  id: string;
  icon: string;
  image: HTMLImageElement | null;
  hpRatio: number;
  targetX: number;
  x: number;
  flashUntil: number;
  defeated: boolean;
  magicText?: {
    value: string;
    isSpecial: boolean;
    until: number;
  };
}

const BACKGROUND_TOP = '#0f172a';
const BACKGROUND_BOTTOM = '#020617';
const CARD_BG = 'rgba(15,23,42,0.8)';
const HP_BAR_BG = 'rgba(15,23,42,0.6)';
const HP_BAR_FILL = '#ef4444';
const ENEMY_GAUGE_BG = 'rgba(15,23,42,0.4)';
const ENEMY_GAUGE_FILL = '#eab308';
const OVERLAY_TEXT_COLOR = '#f8fafc';
const TAiko_LANE_COLOR = 'rgba(255,255,255,0.2)';
const NOTE_FILL = '#38bdf8';
const NOTE_PREVIEW_FILL = '#64748b';

export class FantasyPIXIInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private destroyed = false;
  private renderHandle: number | ReturnType<typeof setTimeout> | null = null;
  private enemyGauge = 0;
  private monsters: MonsterVisual[] = [];
  private taikoMode = false;
  private taikoNotes: TaikoDisplayNote[] = [];
  private effects: ParticleEffect[] = [];
  private overlayText: { value: string; until: number } | null = null;
  private defaultMonsterIcon: string;
  private imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Set<string>();
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    onMonsterDefeated?: () => void,
    onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void,
    imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }
    this.ctx = context;
    this.width = width;
    this.height = height;
    this.pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.defaultMonsterIcon = '';
    this.imageTexturesRef = imageTexturesRef;
    this.onMonsterDefeated = onMonsterDefeated;
    this.onShowMagicName = onShowMagicName;
    this.configureCanvasSize(width, height);
    this.startLoop();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.configureCanvasSize(width, height);
  }

  setActiveMonsters(monsters: MonsterState[]): void {
    const sorted = [...monsters].sort((a, b) => a.position.localeCompare(b.position));
    const count = sorted.length || 1;
    const spacing = this.width / (count + 1);
    const visuals: MonsterVisual[] = [];
    sorted.forEach((monster, index) => {
      const existing = this.monsters.find((m) => m.id === monster.id);
      const image = this.ensureImage(monster.icon);
      const targetX = spacing * (index + 1);
      visuals.push({
        id: monster.id,
        icon: monster.icon,
        image,
        hpRatio: monster.currentHp / monster.maxHp,
        targetX,
        x: existing ? existing.x : targetX,
        flashUntil: existing?.flashUntil ?? 0,
        defeated: monster.currentHp <= 0,
        magicText: existing?.magicText
      });
    });
    this.monsters = visuals;
  }

  setEnemyGauge(value: number): void {
    this.enemyGauge = Math.min(100, Math.max(0, value));
  }

  setDefaultMonsterIcon(icon: string): void {
    this.defaultMonsterIcon = icon;
    this.ensureImage(icon);
  }

  createMonsterSprite(icon: string): void {
    this.setDefaultMonsterIcon(icon);
  }

  updateTaikoMode(enabled: boolean): void {
    this.taikoMode = enabled;
  }

  updateTaikoNotes(notes: TaikoDisplayNote[]): void {
    this.taikoNotes = notes;
  }

  getJudgeLinePosition(): { x: number; y: number } {
    return {
      x: this.width * 0.25,
      y: this.height - this.height * 0.25
    };
  }

  createNoteHitEffect(x: number, y: number, success: boolean): void {
    this.effects.push({
      x,
      y,
      start: performance.now(),
      duration: success ? 250 : 400,
      success
    });
  }

  triggerAttackSuccessOnMonster(monsterId: string, chordName: string | undefined, isSpecial: boolean, _damageDealt: number, defeated: boolean): void {
    const visual = this.monsters.find((m) => m.id === monsterId);
    if (visual) {
      visual.flashUntil = performance.now() + 220;
      if (chordName) {
        visual.magicText = {
          value: chordName,
          isSpecial,
          until: performance.now() + 1500
        };
        this.onShowMagicName?.(chordName, isSpecial, monsterId);
      }
      if (defeated && !visual.defeated) {
        visual.defeated = true;
        setTimeout(() => {
          this.onMonsterDefeated?.();
        }, 400);
      }
    }
  }

  updateOverlayText(text: string | null): void {
    if (!text) {
      this.overlayText = null;
      return;
    }
    this.overlayText = {
      value: text,
      until: performance.now() + 1800
    };
  }

  destroy(): void {
    this.destroyed = true;
    if (this.renderHandle !== null) {
      if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function' && typeof this.renderHandle === 'number') {
        window.cancelAnimationFrame(this.renderHandle);
      } else {
        clearTimeout(this.renderHandle as ReturnType<typeof setTimeout>);
      }
    }
  }

  private configureCanvasSize(width: number, height: number): void {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.max(1, Math.floor(width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(height * this.pixelRatio));
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  private startLoop(): void {
    const raf =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 1000 / 60);
    this.renderHandle = raf(this.renderLoop);
  }

  private renderLoop = (): void => {
    if (this.destroyed) return;
    this.drawFrame();
    this.startLoop();
  };

  private drawFrame(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.drawBackground(ctx);
    this.drawEnemyGauge(ctx);
    this.drawMonsters(ctx);
    if (this.taikoMode) {
      this.drawTaikoLane(ctx);
    }
    this.drawEffects(ctx);
    this.drawOverlayText(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, BACKGROUND_TOP);
    gradient.addColorStop(1, BACKGROUND_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawEnemyGauge(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.width * 0.8;
    const barHeight = 18;
    const x = (this.width - barWidth) / 2;
    const y = 20;
    ctx.fillStyle = ENEMY_GAUGE_BG;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = ENEMY_GAUGE_FILL;
    ctx.fillRect(x, y, (barWidth * this.enemyGauge) / 100, barHeight);
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Enemy Gauge ${Math.round(this.enemyGauge)}%`, x + barWidth / 2, y + barHeight / 2);
  }

  private drawMonsters(ctx: CanvasRenderingContext2D): void {
    if (this.monsters.length === 0 && this.defaultMonsterIcon) {
      this.ensureImage(this.defaultMonsterIcon);
      this.monsters = [
        {
          id: 'preview',
          icon: this.defaultMonsterIcon,
          image: this.imageCache.get(this.defaultMonsterIcon) ?? null,
          hpRatio: 1,
          targetX: this.width / 2,
          x: this.width / 2,
          flashUntil: 0,
          defeated: false
        }
      ];
    }
    const now = performance.now();
    this.monsters.forEach((monster) => {
      monster.x += (monster.targetX - monster.x) * 0.1;
      const cardWidth = Math.min(180, this.width / Math.max(3, this.monsters.length + 1));
      const cardHeight = cardWidth * 0.8;
      const baseY = this.height * 0.35;
      ctx.save();
      ctx.translate(monster.x - cardWidth / 2, baseY);
      ctx.fillStyle = CARD_BG;
      ctx.fillRect(0, 0, cardWidth, cardHeight);
      ctx.strokeStyle = monster.flashUntil > now ? '#fde047' : 'rgba(248,250,252,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, cardWidth, cardHeight);
      if (monster.image) {
        const padding = 12;
        ctx.drawImage(monster.image, padding, padding, cardWidth - padding * 2, cardHeight - padding * 2);
      } else {
        ctx.fillStyle = 'rgba(248,250,252,0.1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px "Inter", sans-serif';
        ctx.fillText('Loading...', cardWidth / 2, cardHeight / 2);
      }
      // HP
      ctx.fillStyle = HP_BAR_BG;
      ctx.fillRect(0, cardHeight + 8, cardWidth, 10);
      ctx.fillStyle = HP_BAR_FILL;
      ctx.fillRect(0, cardHeight + 8, cardWidth * monster.hpRatio, 10);
      if (monster.magicText && monster.magicText.until > now) {
        ctx.font = monster.magicText.isSpecial ? 'bold 16px "Inter", sans-serif' : '13px "Inter", sans-serif';
        ctx.fillStyle = monster.magicText.isSpecial ? '#fbbf24' : '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(monster.magicText.value, cardWidth / 2, -6);
      }
      ctx.restore();
    });
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    const laneHeight = 60;
    ctx.fillStyle = TAiko_LANE_COLOR;
    ctx.fillRect(0, judgePos.y - laneHeight / 2, this.width, laneHeight);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(judgePos.x, judgePos.y - laneHeight / 2);
    ctx.lineTo(judgePos.x, judgePos.y + laneHeight / 2);
    ctx.stroke();
    this.taikoNotes.forEach((note) => {
      const radius = 14;
      const isAhead = note.x >= judgePos.x;
      ctx.fillStyle = isAhead ? NOTE_FILL : NOTE_PREVIEW_FILL;
      ctx.beginPath();
      ctx.arc(note.x, judgePos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.chord, note.x, judgePos.y);
    });
  }

  private drawEffects(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    this.effects = this.effects.filter((effect) => now - effect.start < effect.duration);
    this.effects.forEach((effect) => {
      const progress = (now - effect.start) / effect.duration;
      const alpha = 1 - progress;
      const radius = 10 + progress * 25;
      ctx.strokeStyle = effect.success ? '#4ade80' : '#ef4444';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  private drawOverlayText(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayText) return;
    if (performance.now() > this.overlayText.until) {
      this.overlayText = null;
      return;
    }
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillStyle = OVERLAY_TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.overlayText.value, this.width / 2, this.height * 0.1);
  }

  private ensureImage(icon: string): HTMLImageElement | null {
    if (this.imageCache.has(icon)) {
      return this.imageCache.get(icon) ?? null;
    }
    if (this.imageTexturesRef?.current.has(icon)) {
      const image = this.imageTexturesRef.current.get(icon)!;
      this.imageCache.set(icon, image);
      return image;
    }
    if (this.loadingImages.has(icon)) {
      return null;
    }
    this.loadingImages.add(icon);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      this.imageCache.set(icon, img);
      this.loadingImages.delete(icon);
    };
    img.onerror = () => {
      this.loadingImages.delete(icon);
    };
    img.src = `${import.meta.env.BASE_URL}monster_icons/${icon}.png`;
    return null;
  }
}

export const FantasyPIXIRenderer: React.FC<FantasyPIXIRendererProps> = ({
  width,
  height,
  monsterIcon,
  enemyGauge,
  onReady,
  onMonsterDefeated,
  onShowMagicName,
  className,
  activeMonsters,
  imageTexturesRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FantasyPIXIInstance | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const renderer = new FantasyPIXIInstance(
        canvas,
        width,
        height,
        onMonsterDefeated,
        onShowMagicName,
        imageTexturesRef
      );
      rendererRef.current = renderer;
      renderer.setDefaultMonsterIcon(monsterIcon);
      renderer.setEnemyGauge(enemyGauge);
      if (activeMonsters) {
        renderer.setActiveMonsters(activeMonsters);
      }
      onReady?.(renderer);
      return () => {
        renderer.destroy();
        rendererRef.current = null;
      };
    }, [onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

  useEffect(() => {
    rendererRef.current?.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.setDefaultMonsterIcon(monsterIcon);
  }, [monsterIcon]);

  useEffect(() => {
    rendererRef.current?.setEnemyGauge(enemyGauge);
  }, [enemyGauge]);

  useEffect(() => {
    if (activeMonsters) {
      rendererRef.current?.setActiveMonsters(activeMonsters);
    }
  }, [activeMonsters]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('block w-full h-full', className)}
    />
  );
};

export default FantasyPIXIRenderer;
