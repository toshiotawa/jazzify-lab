import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { unifiedFrameController } from '@/utils/performanceOptimizer';
import type { MonsterState as GameMonsterState } from './FantasyGameEngine';

interface FantasyPIXIRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  enemyGauge: number;
  onReady?: (instance: FantasyPIXIInstance) => void;
  onMonsterDefeated?: () => void;
  onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  className?: string;
  activeMonsters?: GameMonsterState[];
  imageTexturesRef?: React.MutableRefObject<Map<string, CanvasImageSource>>;
}

interface AttackEffect {
  id: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  success: boolean;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export class FantasyPIXIInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private pixelRatio: number = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  private width: number;
  private height: number;
  private animationId: number | null = null;
  private disposed = false;
  private monsters: GameMonsterState[] = [];
  private placeholderIcon: string | null = null;
  private taikoMode = false;
  private taikoNotes: Array<{ id: string; chord: string; x: number }> = [];
  private overlayText: string | null = null;
  private enemyGauge = 0;
  private effects: AttackEffect[] = [];
  private lastRenderTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  private readonly monsterPositions = new Map<string, { x: number; y: number }>();
  private readonly onMonsterDefeated?: () => void;
  private readonly onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  private readonly imageTexturesRef?: React.MutableRefObject<Map<string, CanvasImageSource>>;

  constructor(
    width: number,
    height: number,
    onMonsterDefeated?: () => void,
    onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void,
    imageTexturesRef?: React.MutableRefObject<Map<string, CanvasImageSource>>
  ) {
    this.width = width;
    this.height = height;
    this.onMonsterDefeated = onMonsterDefeated;
    this.onShowMagicName = onShowMagicName;
    this.imageTexturesRef = imageTexturesRef;

    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to initialize fantasy canvas renderer');
    }
    this.ctx = context;
    this.canvas.style.display = 'block';
    this.applyCanvasSize();
    this.startLoop();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  async updateActiveMonsters(monsters: GameMonsterState[] = []): Promise<void> {
    this.monsters = monsters;
  }

  createMonsterSprite(icon: string): void {
    this.placeholderIcon = icon;
  }

  triggerAttackSuccessOnMonster(
    monsterId: string,
    chordName: string | undefined,
    isSpecial: boolean,
    _damageDealt: number,
    defeated: boolean
  ): void {
    const position = this.monsterPositions.get(monsterId) || {
      x: this.width * 0.5,
      y: this.height * 0.45
    };
    this.effects.push({
      id: `attack-${Date.now()}`,
      x: position.x,
      y: position.y,
      life: 0,
      maxLife: defeated ? 700 : 400,
      success: !defeated
    });
    if (chordName) {
      this.onShowMagicName?.(chordName, isSpecial, monsterId);
    }
    if (defeated) {
      this.onMonsterDefeated?.();
    }
  }

  getJudgeLinePosition(): { x: number; y: number } {
    return { x: this.width * 0.25, y: this.height * 0.65 };
  }

  createNoteHitEffect(x: number, y: number, isSuccess: boolean): void {
    this.effects.push({
      id: `note-${Date.now()}`,
      x,
      y,
      life: 0,
      maxLife: isSuccess ? 350 : 250,
      success: isSuccess
    });
  }

  updateTaikoMode(isTaikoMode: boolean): void {
    this.taikoMode = isTaikoMode;
  }

  updateTaikoNotes(notes: Array<{ id: string; chord: string; x: number }>): void {
    this.taikoNotes = notes;
  }

  updateOverlayText(text: string | null): void {
    this.overlayText = text;
  }

  setEnemyGauge(value: number): void {
    this.enemyGauge = clamp(value, 0, 100);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.pixelRatio = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.applyCanvasSize();
  }

  destroy(): void {
    this.disposed = true;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private startLoop(): void {
    const loop = () => {
      if (this.disposed) {
        return;
      }
      this.renderFrame();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private renderFrame(): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const delta = now - this.lastRenderTime;
    this.lastRenderTime = now;

    unifiedFrameController.runMeasured('render', 'fantasy-canvas', () => {
      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawBackground();
      this.drawEnemyGauge();
      this.drawMonsters();
      if (this.taikoMode) {
        this.drawJudgeLine();
        this.drawTaikoNotes();
      }
      this.drawOverlayText();
      this.drawEffects(delta);
    });
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#111827');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawEnemyGauge(): void {
    const gaugeWidth = Math.min(this.width - 40, 320);
    const gaugeHeight = 12;
    const x = 20;
    const y = 20;

    this.ctx.fillStyle = 'rgba(15,23,42,0.6)';
    this.ctx.fillRect(x, y, gaugeWidth, gaugeHeight);

    const filledWidth = (gaugeWidth * this.enemyGauge) / 100;
    const gaugeColor = this.enemyGauge > 75 ? '#f97316' : '#22c55e';
    this.ctx.fillStyle = gaugeColor;
    this.ctx.fillRect(x, y, filledWidth, gaugeHeight);
  }

  private drawMonsters(): void {
    this.monsterPositions.clear();
    const monsters = this.monsters.length > 0 ? this.monsters : this.buildPlaceholderMonsters();
    if (monsters.length === 0) return;

    const spacing = this.width / (monsters.length + 1);
    monsters.forEach((monster, index) => {
      const x = spacing * (index + 1);
      const y = this.height * (this.taikoMode ? 0.35 : 0.5);
      this.monsterPositions.set(monster.id, { x, y });
      this.drawSingleMonster(monster, x, y);
    });
  }

  private buildPlaceholderMonsters(): GameMonsterState[] {
    if (!this.placeholderIcon) {
      return [];
    }
    return [
      {
        id: this.placeholderIcon,
        index: 0,
        position: 'A',
        currentHp: 1,
        maxHp: 1,
        gauge: 0,
        icon: this.placeholderIcon,
        name: 'Enemy',
        chordTarget: {
          id: 'C',
          displayName: 'C',
          notes: [],
          noteNames: [],
          quality: 'major',
          root: 'C'
        },
        correctNotes: []
      }
    ];
  }

  private drawSingleMonster(monster: GameMonsterState, x: number, y: number): void {
    const radius = Math.min(90, this.width / 8);
    const image = this.imageTexturesRef?.current.get(monster.icon);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(15,23,42,0.9)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    if (image) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(
        image,
        x - (radius - 6),
        y - (radius - 6),
        (radius - 6) * 2,
        (radius - 6) * 2
      );
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.font = `700 ${Math.max(16, radius * 0.4)}px "Inter", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(monster.name.charAt(0), x, y);
    }

    const hpRatio = monster.maxHp > 0 ? monster.currentHp / monster.maxHp : 0;
    this.ctx.beginPath();
    this.ctx.strokeStyle = hpRatio > 0.4 ? '#22c55e' : '#ef4444';
    this.ctx.lineWidth = 6;
    this.ctx.arc(x, y, radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio);
    this.ctx.stroke();

    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = `600 ${Math.max(12, radius * 0.25)}px "Inter", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(monster.name, x, y + radius + 28);
  }

  private drawJudgeLine(): void {
    const { x, y } = this.getJudgeLinePosition();
    this.ctx.strokeStyle = '#fde047';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 40, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
    this.ctx.fill();
  }

  private drawTaikoNotes(): void {
    const { y } = this.getJudgeLinePosition();
    this.taikoNotes.forEach((note) => {
      const clampedX = clamp(note.x, -50, this.width + 50);
      this.ctx.beginPath();
      this.ctx.fillStyle = '#f87171';
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.arc(clampedX, y, 32, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#1e293b';
      this.ctx.font = '700 16px "Inter", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(note.chord, clampedX, y);
    });
  }

  private drawOverlayText(): void {
    if (!this.overlayText) return;
    this.ctx.fillStyle = 'rgba(226,232,240,0.9)';
    this.ctx.font = '600 20px "Inter", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.overlayText, this.width / 2, this.height - 30);
  }

  private drawEffects(deltaMs: number): void {
    if (this.effects.length === 0) return;
    const aliveEffects: AttackEffect[] = [];
    this.effects.forEach((effect) => {
      const nextLife = effect.life + deltaMs;
      const progress = clamp(nextLife / effect.maxLife, 0, 1);
      const radius = effect.success ? 20 + 40 * progress : 25;

      if (effect.success) {
        this.ctx.strokeStyle = `rgba(34,197,94,${1 - progress})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.strokeStyle = `rgba(248,113,113,${1 - progress})`;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(effect.x - radius, effect.y - radius);
        this.ctx.lineTo(effect.x + radius, effect.y + radius);
        this.ctx.moveTo(effect.x + radius, effect.y - radius);
        this.ctx.lineTo(effect.x - radius, effect.y + radius);
        this.ctx.stroke();
      }

      if (nextLife < effect.maxLife) {
        aliveEffects.push({ ...effect, life: nextLife });
      }
    });
    this.effects = aliveEffects;
  }

  private applyCanvasSize(): void {
    this.canvas.width = Math.floor(this.width * this.pixelRatio);
    this.canvas.height = Math.floor(this.height * this.pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<FantasyPIXIInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const fantasyInstance = new FantasyPIXIInstance(width, height, onMonsterDefeated, onShowMagicName, imageTexturesRef);
    containerRef.current.appendChild(fantasyInstance.getCanvas());
    setInstance(fantasyInstance);
    onReady?.(fantasyInstance);

    return () => {
      fantasyInstance.destroy();
    };
  }, [width, height, onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

  useEffect(() => {
    if (!instance) return;
    if (activeMonsters && activeMonsters.length > 0) {
      void instance.updateActiveMonsters(activeMonsters);
    } else {
      instance.createMonsterSprite(monsterIcon);
    }
  }, [instance, monsterIcon, activeMonsters]);

  useEffect(() => {
    instance?.setEnemyGauge(enemyGauge);
  }, [instance, enemyGauge]);

  useEffect(() => {
    instance?.resize(width, height);
  }, [instance, width, height]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{ width, height }}
    />
  );
};

export default FantasyPIXIRenderer;
