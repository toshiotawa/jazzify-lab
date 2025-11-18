import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import type { MonsterState } from './FantasyGameEngine';

interface TaikoNoteRender {
  id: string;
  chord: string;
  x: number;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

interface HitEffect {
  id: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
}

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

const POSITION_ORDER: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'> = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export class FantasyPIXIInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private rafId: number | null = null;
  private isDestroyed = false;
  private needsRender = true;
  private enemyGauge = 0;
  private taikoMode = false;
  private taikoNotes: TaikoNoteRender[] = [];
  private overlayText: string | null = null;
  private floatingTexts: FloatingText[] = [];
  private hitEffects: HitEffect[] = [];
  private monsters: MonsterState[] = [];
  private readonly imageCache?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private readonly fallbackCache = new Map<string, HTMLImageElement>();
  private readonly onMonsterDefeated?: () => void;
  private readonly onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  private baseIcon: string;
  private readonly judgeLine = { x: 0, y: 0 };

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    monsterIcon: string,
    onMonsterDefeated?: () => void,
    onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void,
    imageCache?: React.MutableRefObject<Map<string, HTMLImageElement>>
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;
    this.width = width;
    this.height = height;
    this.baseIcon = monsterIcon;
    this.onMonsterDefeated = onMonsterDefeated;
    this.onShowMagicName = onShowMagicName;
    this.imageCache = imageCache;
    this.judgeLine = {
      x: width * 0.25,
      y: Math.max(height - 80, height * 0.6)
    };
    this.resizeSurface(width, height);
    this.startLoop();
  }

  setActiveMonsters(monsters: MonsterState[]): void {
    this.monsters = monsters;
    this.scheduleRender();
  }

  updateEnemyGauge(value: number): void {
    this.enemyGauge = Math.max(0, Math.min(100, value));
    this.scheduleRender();
  }

  createMonsterSprite(icon: string): void {
    this.baseIcon = icon;
    this.scheduleRender();
  }

  updateTaikoMode(enabled: boolean): void {
    this.taikoMode = enabled;
    this.scheduleRender();
  }

  updateTaikoNotes(notes: TaikoNoteRender[]): void {
    this.taikoNotes = notes;
    this.scheduleRender();
  }

  updateOverlayText(text: string | null): void {
    this.overlayText = text;
    this.scheduleRender();
  }

  triggerAttackSuccessOnMonster(monsterId: string, magicName: string, isSpecial: boolean, damageDealt: number, defeated: boolean): void {
    const monster = this.monsters.find((m) => m.id === monsterId);
    const baseX = monster ? this.getMonsterPosition(monster.position) : this.width * 0.5;
    const baseY = monster ? this.height * 0.35 : this.height * 0.3;
    this.floatingTexts.push({
      id: `${monsterId}-${Date.now()}`,
      text: `${magicName}${isSpecial ? ' ✨' : ''}\n-${Math.round(damageDealt)}`,
      x: baseX,
      y: baseY,
      color: isSpecial ? '#FBBF24' : '#F87171',
      life: 0,
      maxLife: 900
    });
    this.onShowMagicName?.(magicName, isSpecial, monsterId);
    if (defeated) {
      this.onMonsterDefeated?.();
    }
    this.scheduleRender();
  }

  createNoteHitEffect(x: number, y: number, isPerfect: boolean): void {
    this.hitEffects.push({
      id: `${x}-${Date.now()}`,
      x,
      y,
      life: 0,
      maxLife: 400,
      color: isPerfect ? '#34D399' : '#FDE68A'
    });
    this.scheduleRender();
  }

  getJudgeLinePosition(): { x: number; y: number } {
    return { ...this.judgeLine };
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private resizeSurface(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private startLoop(): void {
    let lastTime = performance.now();
    const step = (timestamp: number) => {
      if (this.isDestroyed) {
        return;
      }
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      this.updateEffects(delta);
      if (this.needsRender || this.hitEffects.length > 0 || this.floatingTexts.length > 0) {
        this.renderFrame();
      }
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  private updateEffects(deltaTime: number): void {
    let changed = false;
    this.hitEffects = this.hitEffects.filter((effect) => {
      effect.life += deltaTime;
      const alive = effect.life < effect.maxLife;
      if (!alive) {
        changed = true;
      }
      return alive;
    });
    this.floatingTexts = this.floatingTexts.filter((text) => {
      text.life += deltaTime;
      text.y -= 0.05 * (deltaTime / 16);
      const alive = text.life < text.maxLife;
      if (!alive) {
        changed = true;
      }
      return alive;
    });
    if (changed) {
      this.scheduleRender();
    }
  }

  private renderFrame(): void {
    this.needsRender = false;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawEnemyGauge();
    this.drawMonsters();
    if (this.taikoMode) {
      this.drawTaikoLane();
      this.drawTaikoNotes();
    }
    this.drawOverlayText();
    this.drawHitEffects();
    this.drawFloatingTexts();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawEnemyGauge(): void {
    const ctx = this.ctx;
    const barWidth = Math.min(this.width * 0.6, 480);
    const barHeight = 12;
    const x = (this.width - barWidth) / 2;
    const y = 24;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.fillStyle = '#F87171';
    ctx.fillRect(x, y, (barWidth * this.enemyGauge) / 100, barHeight);
  }

  private drawMonsters(): void {
    if (this.monsters.length === 0 && this.baseIcon) {
      this.drawMonsterCard({
        icon: this.baseIcon,
        xRatio: 0.5,
        label: 'Ready'
      });
      return;
    }
    this.monsters.forEach((monster) => {
      const xRatio = this.getPositionRatio(monster.position);
      this.drawMonsterCard({
        icon: monster.icon,
        xRatio,
        label: monster.chordTarget.displayName
      });
    });
  }

  private drawMonsterCard(params: { icon: string; xRatio: number; label: string }): void {
    const ctx = this.ctx;
    const cardWidth = Math.min(this.width * 0.18, 160);
    const cardHeight = Math.min(this.height * 0.3, 200);
    const x = params.xRatio * this.width - cardWidth / 2;
    const y = this.height * 0.15;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.strokeStyle = 'rgba(248,250,252,0.2)';
    ctx.lineWidth = 2;
    this.drawRoundedRect(x, y, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.stroke();
    const image = this.getMonsterImage(params.icon);
    if (image) {
      const imgSize = cardWidth * 0.7;
      ctx.drawImage(image, x + cardWidth * 0.15, y + 16, imgSize, imgSize);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('???', x + cardWidth / 2, y + cardHeight * 0.4);
    }
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(params.label, x + cardWidth / 2, y + cardHeight - 24);
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    const ctx = this.ctx;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawTaikoLane(): void {
    const ctx = this.ctx;
    const laneHeight = Math.min(80, this.height * 0.18);
    const laneTop = this.judgeLine.y - laneHeight / 2;
    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.fillRect(0, laneTop, this.width, laneHeight);
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.judgeLine.x, laneTop);
    ctx.lineTo(this.judgeLine.x, laneTop + laneHeight);
    ctx.stroke();
  }

  private drawTaikoNotes(): void {
    const ctx = this.ctx;
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    this.taikoNotes.forEach((note, index) => {
      const color = index % 2 === 0 ? '#38BDF8' : '#F472B6';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(note.x, this.judgeLine.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.fillText(note.chord, note.x, this.judgeLine.y + 32);
    });
  }

  private drawOverlayText(): void {
    if (!this.overlayText) {
      return;
    }
    const ctx = this.ctx;
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 20px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.overlayText, this.width / 2, this.height * 0.08);
  }

  private drawHitEffects(): void {
    const ctx = this.ctx;
    this.hitEffects.forEach((effect) => {
      const progress = effect.life / effect.maxLife;
      ctx.strokeStyle = effect.color;
      ctx.globalAlpha = 1 - progress;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 20 + progress * 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  private drawFloatingTexts(): void {
    const ctx = this.ctx;
    this.floatingTexts.forEach((text) => {
      const alpha = 1 - text.life / text.maxLife;
      ctx.fillStyle = text.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.textAlign = 'center';
      text.text.split('\n').forEach((line, idx) => {
        ctx.fillText(line, text.x, text.y - idx * 18);
      });
      ctx.globalAlpha = 1;
    });
  }

  private getMonsterPosition(position: MonsterState['position']): number {
    return this.getPositionRatio(position) * this.width;
  }

  private getPositionRatio(position: MonsterState['position']): number {
    const index = POSITION_ORDER.indexOf(position);
    const normalized = index >= 0 ? index : 0;
    return (normalized + 0.5) / POSITION_ORDER.length;
  }

  private getMonsterImage(icon: string): HTMLImageElement | null {
    if (this.imageCache?.current.has(icon)) {
      return this.imageCache.current.get(icon)!;
    }
    if (this.fallbackCache.has(icon)) {
      return this.fallbackCache.get(icon)!;
    }
    this.loadImage(icon);
    return null;
  }

  private loadImage(icon: string): void {
    const sources = [
      `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`,
      `${import.meta.env.BASE_URL}monster_icons/${icon}.png`
    ];
    sources.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (this.imageCache) {
          this.imageCache.current.set(icon, img);
        } else {
          this.fallbackCache.set(icon, img);
        }
        this.scheduleRender();
      };
      img.onerror = () => {
        devLog.warn('Failed to load monster asset', { icon, src });
      };
    });
  }

  private scheduleRender(): void {
    this.needsRender = true;
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
  const instanceRef = useRef<FantasyPIXIInstance | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const instance = new FantasyPIXIInstance(canvas, width, height, monsterIcon, onMonsterDefeated, onShowMagicName, imageTexturesRef);
    instanceRef.current = instance;
    onReady?.(instance);
    return () => {
      instance.destroy();
      onReady?.(null);
      instanceRef.current = null;
    };
  }, [width, height, monsterIcon, onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setActiveMonsters(activeMonsters ?? []);
    }
  }, [activeMonsters]);

  useEffect(() => {
    instanceRef.current?.updateEnemyGauge(enemyGauge);
  }, [enemyGauge]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Fantasy renderer"
      className={cn('block', className)}
    />
  );
};

export default FantasyPIXIRenderer;
