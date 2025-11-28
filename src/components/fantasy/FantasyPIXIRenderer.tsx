import React, { useEffect, useRef } from 'react';
import type { MonsterState } from './FantasyGameEngine';
import { cn } from '@/utils/cn';
import { useEnemyStore } from '@/stores/enemyStore';

interface FantasyPIXIRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  enemyGauge?: number; // deprecated, no longer used
  onReady?: (instance: FantasyPIXIInstance) => void;
  onMonsterDefeated?: () => void;
  onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  className?: string;
  activeMonsters?: MonsterState[];
  imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  enragedMonsters?: Record<string, boolean>;
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

interface DamageTextEffect {
  x: number;
  y: number;
  value: number;
  start: number;
  duration: number;
  isSpecial: boolean;
}

interface BubbleEffect {
  x: number;
  y: number;
  start: number;
  duration: number;
  type: 'damage' | 'anger';
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
  damageText?: {
    value: number;
    isSpecial: boolean;
    until: number;
    startY: number;
  };
  enraged: boolean;
  enrageScale: number;
}

const BACKGROUND_TOP = '#0f172a';
const BACKGROUND_BOTTOM = '#020617';
const HP_BAR_BG = 'rgba(15,23,42,0.6)';
const HP_BAR_FILL = '#ef4444';
const OVERLAY_TEXT_COLOR = '#f8fafc';
const NOTE_FILL = '#38bdf8';
const NOTE_STROKE = '#0ea5e9';
const NOTE_TEXT_COLOR = '#0f172a';
const DAMAGE_TEXT_COLOR = '#fbbf24';
const DAMAGE_SPECIAL_COLOR = '#f97316';

export class FantasyPIXIInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private destroyed = false;
  private renderHandle: number | ReturnType<typeof setTimeout> | null = null;
  private monsters: MonsterVisual[] = [];
  private taikoMode = false;
  private taikoNotes: TaikoDisplayNote[] = [];
  private effects: ParticleEffect[] = [];
  private damageTexts: DamageTextEffect[] = [];
  private bubbles: BubbleEffect[] = [];
  private overlayText: { value: string; until: number } | null = null;
  private defaultMonsterIcon: string;
  private imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Set<string>();
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  private enragedMonsters: Record<string, boolean> = {};

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

  setEnragedMonsters(enraged: Record<string, boolean>): void {
    this.enragedMonsters = enraged;
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
      const isEnraged = this.enragedMonsters[monster.id] ?? false;
      visuals.push({
        id: monster.id,
        icon: monster.icon,
        image,
        hpRatio: monster.currentHp / monster.maxHp,
        targetX,
        x: existing ? existing.x : targetX,
        flashUntil: existing?.flashUntil ?? 0,
        defeated: monster.currentHp <= 0,
        magicText: existing?.magicText,
        damageText: existing?.damageText,
        enraged: isEnraged,
        enrageScale: existing?.enrageScale ?? 1
      });
    });
    this.monsters = visuals;
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
      y: this.height - 50
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

  triggerAttackSuccessOnMonster(monsterId: string, chordName: string | undefined, isSpecial: boolean, damageDealt: number, defeated: boolean): void {
    const visual = this.monsters.find((m) => m.id === monsterId);
    if (visual) {
      visual.flashUntil = performance.now() + 220;
      
      // 吹き出しエフェクト追加
      this.bubbles.push({
        x: visual.x,
        y: this.height * 0.2,
        start: performance.now(),
        duration: 600,
        type: 'damage'
      });
      
      // ダメージテキスト追加
      visual.damageText = {
        value: damageDealt,
        isSpecial,
        until: performance.now() + 1200,
        startY: this.height * 0.15
      };
      
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
    this.drawMonsters(ctx);
    if (this.taikoMode) {
      this.drawTaikoLane(ctx);
    }
    this.drawEffects(ctx);
    this.drawBubbles(ctx);
    this.drawOverlayText(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, BACKGROUND_TOP);
    gradient.addColorStop(1, BACKGROUND_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
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
          defeated: false,
          enraged: false,
          enrageScale: 1
        }
      ];
    }
    const now = performance.now();
    
    // 怒り状態の更新
    this.monsters.forEach((monster) => {
      const isEnraged = this.enragedMonsters[monster.id] ?? false;
      monster.enraged = isEnraged;
      
      // スムーズなスケール遷移
      const targetScale = isEnraged ? 1.2 : 1;
      monster.enrageScale += (targetScale - monster.enrageScale) * 0.15;
    });
    
    this.monsters.forEach((monster) => {
      monster.x += (monster.targetX - monster.x) * 0.1;
      
      // モンスターサイズを大きく（背景・枠なし）
      const baseSize = Math.min(140, this.width / Math.max(2, this.monsters.length + 1));
      const monsterSize = baseSize * monster.enrageScale;
      const baseY = this.height * 0.25;
      
      ctx.save();
      ctx.translate(monster.x, baseY);
      
      // フラッシュ効果
      if (monster.flashUntil > now) {
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 20;
      }
      
      // モンスター画像を直接描画（背景・枠なし）
      if (monster.image) {
        const imgSize = monsterSize;
        ctx.drawImage(
          monster.image, 
          -imgSize / 2, 
          -imgSize / 2, 
          imgSize, 
          imgSize
        );
      } else {
        // ローディング表示
        ctx.fillStyle = 'rgba(248,250,252,0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px "Inter", sans-serif';
        ctx.fillText('...', 0, 0);
      }
      
      // 怒りアイコン表示
      if (monster.enraged) {
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('💢', monsterSize / 2 + 5, -monsterSize / 2 + 10);
      }
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // HPバー（モンスターの下に表示）
      const hpBarWidth = baseSize * 0.9;
      const hpBarHeight = 8;
      const hpBarY = monsterSize / 2 + 10;
      
      ctx.fillStyle = HP_BAR_BG;
      this.roundRect(ctx, -hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight, 4);
      ctx.fill();
      
      ctx.fillStyle = HP_BAR_FILL;
      const filledWidth = hpBarWidth * monster.hpRatio;
      if (filledWidth > 0) {
        this.roundRect(ctx, -hpBarWidth / 2, hpBarY, filledWidth, hpBarHeight, 4);
        ctx.fill();
      }
      
      // ダメージテキスト
      if (monster.damageText && monster.damageText.until > now) {
        const progress = 1 - (monster.damageText.until - now) / 1200;
        const yOffset = progress * 30; // 上に浮かぶ
        const alpha = 1 - progress * 0.5;
        
        ctx.globalAlpha = alpha;
        ctx.font = monster.damageText.isSpecial ? 'bold 28px sans-serif' : 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 縁取り
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(
          `${monster.damageText.value}`,
          0,
          -monsterSize / 2 - 20 - yOffset
        );
        
        ctx.fillStyle = monster.damageText.isSpecial ? DAMAGE_SPECIAL_COLOR : DAMAGE_TEXT_COLOR;
        ctx.fillText(
          `${monster.damageText.value}`,
          0,
          -monsterSize / 2 - 20 - yOffset
        );
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    });
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    // レーン高さを大幅に拡大
    const laneHeight = 100;
    const laneY = judgePos.y - laneHeight / 2;
    
    // レーン背景（グラデーション）
    const gradient = ctx.createLinearGradient(0, laneY, 0, laneY + laneHeight);
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
    gradient.addColorStop(0.5, 'rgba(51, 65, 85, 0.95)');
    gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, laneY, this.width, laneHeight);
    
    // レーン上下のライン
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, laneY);
    ctx.lineTo(this.width, laneY);
    ctx.moveTo(0, laneY + laneHeight);
    ctx.lineTo(this.width, laneY + laneHeight);
    ctx.stroke();
    
    // 判定ライン（より目立つように）
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(judgePos.x, laneY);
    ctx.lineTo(judgePos.x, laneY + laneHeight);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // ノーツを描画（サイズを大きく）
    this.taikoNotes.forEach((note) => {
      const radius = 32; // 14 → 32に拡大
      const isAhead = note.x >= judgePos.x;
      
      // ノーツの影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(note.x + 2, judgePos.y + 2, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // ノーツ本体（グラデーション）
      const noteGradient = ctx.createRadialGradient(
        note.x - radius / 3, judgePos.y - radius / 3, 0,
        note.x, judgePos.y, radius
      );
      if (isAhead) {
        noteGradient.addColorStop(0, '#7dd3fc');
        noteGradient.addColorStop(1, NOTE_FILL);
      } else {
        noteGradient.addColorStop(0, '#94a3b8');
        noteGradient.addColorStop(1, '#64748b');
      }
      ctx.fillStyle = noteGradient;
      ctx.beginPath();
      ctx.arc(note.x, judgePos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // ノーツの縁
      ctx.strokeStyle = isAhead ? NOTE_STROKE : '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // コード名（見やすいフォントサイズ）
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillStyle = NOTE_TEXT_COLOR;
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
      const radius = 10 + progress * 35;
      ctx.strokeStyle = effect.success ? '#4ade80' : '#ef4444';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  private drawBubbles(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    this.bubbles = this.bubbles.filter((bubble) => now - bubble.start < bubble.duration);
    this.bubbles.forEach((bubble) => {
      const progress = (now - bubble.start) / bubble.duration;
      const alpha = 1 - progress;
      const scale = 0.5 + progress * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(bubble.x, bubble.y - progress * 20);
      ctx.scale(scale, scale);
      
      if (bubble.type === 'damage') {
        // 吹き出しアイコン（💥）
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', 0, 0);
      } else if (bubble.type === 'anger') {
        // 怒りアイコン（💢）
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💢', 0, 0);
      }
      
      ctx.restore();
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

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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
    // webp優先で読み込み
    img.src = `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`;
    img.onerror = () => {
      // webpが失敗したらpngを試す
      img.src = `${import.meta.env.BASE_URL}monster_icons/${icon}.png`;
    };
    return null;
  }
}

export const FantasyPIXIRenderer: React.FC<FantasyPIXIRendererProps> = ({
  width,
  height,
  monsterIcon,
  onReady,
  onMonsterDefeated,
  onShowMagicName,
  className,
  activeMonsters,
  imageTexturesRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FantasyPIXIInstance | null>(null);
  
  // 怒り状態をZustandストアから取得
  const enragedMonsters = useEnemyStore((state) => state.enraged);

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
    renderer.setEnragedMonsters(enragedMonsters);
    if (activeMonsters) {
      renderer.setActiveMonsters(activeMonsters);
    }
    onReady?.(renderer);
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // width, height, monsterIcon, enragedMonsters, activeMonsters are handled by separate useEffects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

  useEffect(() => {
    rendererRef.current?.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.setDefaultMonsterIcon(monsterIcon);
  }, [monsterIcon]);

  useEffect(() => {
    rendererRef.current?.setEnragedMonsters(enragedMonsters);
  }, [enragedMonsters]);

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
