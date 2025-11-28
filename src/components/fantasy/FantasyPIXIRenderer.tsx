import React, { useEffect, useRef } from 'react';
import type { MonsterState } from './FantasyGameEngine';
import { cn } from '@/utils/cn';
import { useEnemyStore } from '@/stores/enemyStore';

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

interface DamageTextEffect {
  x: number;
  y: number;
  value: number;
  start: number;
  duration: number;
}

interface SpecialAttackEffect {
  start: number;
  duration: number;
}

interface MonsterVisual {
  id: string;
  icon: string;
  image: HTMLImageElement | null;
  hpRatio: number;
  gauge: number;
  targetX: number;
  x: number;
  flashUntil: number;
  defeated: boolean;
  enraged: boolean;
  enrageScale: number;
  showDamageIcon: boolean;
  damageIconUntil: number;
  damageText?: DamageTextEffect;
}

export class FantasyPIXIInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private destroyed = false;
  private renderHandle: number | null = null;
  private monsters: MonsterVisual[] = [];
  private taikoMode = false;
  private taikoNotes: TaikoDisplayNote[] = [];
  private effects: ParticleEffect[] = [];
  private specialAttackEffect: SpecialAttackEffect | null = null;
  private overlayText: { value: string; until: number } | null = null;
  private defaultMonsterIcon: string;
  private imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Set<string>();
  private onMonsterDefeated?: () => void;
  private angerIcon: HTMLImageElement | null = null;
  private attackIcon: HTMLImageElement | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    onMonsterDefeated?: () => void,
    _onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void,
    imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }
    this.ctx = context;
    this.width = width;
    this.height = height;
    this.pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.defaultMonsterIcon = '';
    this.imageTexturesRef = imageTexturesRef;
    this.onMonsterDefeated = onMonsterDefeated;
    this.configureCanvasSize(width, height);
    this.loadAssets();
    this.startLoop();
  }

  private loadAssets(): void {
    this.angerIcon = new Image();
    this.angerIcon.src = `${import.meta.env.BASE_URL}data/anger.svg`;
    this.attackIcon = new Image();
    this.attackIcon.src = `${import.meta.env.BASE_URL}attack_icons/fukidashi_onpu_white.png`;
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
    const enragedTable = useEnemyStore.getState().enraged;
    
    const visuals: MonsterVisual[] = [];
    sorted.forEach((monster, index) => {
      const existing = this.monsters.find((m) => m.id === monster.id);
      const image = this.ensureImage(monster.icon);
      const targetX = spacing * (index + 1);
      const isEnraged = enragedTable[monster.id] ?? false;
      
      visuals.push({
        id: monster.id,
        icon: monster.icon,
        image,
        hpRatio: monster.currentHp / monster.maxHp,
        gauge: monster.gauge ?? 0,
        targetX,
        x: existing ? existing.x : targetX,
        flashUntil: existing?.flashUntil ?? 0,
        defeated: monster.currentHp <= 0,
        enraged: isEnraged,
        enrageScale: existing?.enrageScale ?? (isEnraged ? 1.2 : 1),
        showDamageIcon: existing?.showDamageIcon ?? false,
        damageIconUntil: existing?.damageIconUntil ?? 0,
        damageText: existing?.damageText
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
      x: this.width * 0.15,
      y: this.height * 0.75
    };
  }

  createNoteHitEffect(x: number, y: number, success: boolean): void {
    this.effects.push({
      x,
      y,
      start: performance.now(),
      duration: 200,
      success
    });
  }

  triggerAttackSuccessOnMonster(
    monsterId: string,
    _chordName: string | undefined,
    isSpecial: boolean,
    damageDealt: number,
    defeated: boolean
  ): void {
    const visual = this.monsters.find((m) => m.id === monsterId);
    if (visual) {
      visual.flashUntil = performance.now() + 200;
      visual.showDamageIcon = true;
      visual.damageIconUntil = performance.now() + 600;
      
      visual.damageText = {
        x: visual.x,
        y: this.height * 0.25,
        value: damageDealt,
        start: performance.now(),
        duration: 800
      };
      
      if (isSpecial) {
        this.triggerSpecialAttackEffect();
      }
      
      if (defeated && !visual.defeated) {
        visual.defeated = true;
        setTimeout(() => {
          this.onMonsterDefeated?.();
        }, 300);
      }
    }
  }

  private triggerSpecialAttackEffect(): void {
    this.specialAttackEffect = {
      start: performance.now(),
      duration: 1500
    };
  }

  updateOverlayText(text: string | null): void {
    if (!text) {
      this.overlayText = null;
      return;
    }
    this.overlayText = {
      value: text,
      until: performance.now() + 1500
    };
  }

  destroy(): void {
    this.destroyed = true;
    if (this.renderHandle !== null) {
      cancelAnimationFrame(this.renderHandle);
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
    this.renderHandle = requestAnimationFrame(this.renderLoop);
  }

  private renderLoop = (): void => {
    if (this.destroyed) return;
    this.drawFrame();
    this.renderHandle = requestAnimationFrame(this.renderLoop);
  };

  private drawFrame(): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    
    this.drawMonsters(ctx);
    if (this.taikoMode) {
      this.drawTaikoLane(ctx);
    }
    this.drawEffects(ctx);
    this.drawSpecialAttackEffect(ctx);
    this.drawOverlayText(ctx);
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
          gauge: 0,
          targetX: this.width / 2,
          x: this.width / 2,
          flashUntil: 0,
          defeated: false,
          enraged: false,
          enrageScale: 1,
          showDamageIcon: false,
          damageIconUntil: 0
        }
      ];
    }
    
    const now = performance.now();
    
    this.monsters.forEach((monster) => {
      // スムーズな移動
      monster.x += (monster.targetX - monster.x) * 0.15;
      
      // 怒り時のスケールアニメーション
      const targetScale = monster.enraged ? 1.2 : 1;
      monster.enrageScale += (targetScale - monster.enrageScale) * 0.1;
      
      const baseSize = Math.min(this.height * 0.55, this.width / (this.monsters.length + 1) * 0.85);
      const monsterSize = baseSize * monster.enrageScale;
      const baseY = this.height * 0.45;
      
      const isFlashing = monster.flashUntil > now;
      
      ctx.save();
      ctx.translate(monster.x, baseY);
      
      // モンスター画像を描画（背景・枠なし）
      if (monster.image && monster.image.complete) {
        const imgSize = monsterSize;
        
        // フラッシュ時は少し明るく
        if (isFlashing) {
          ctx.globalAlpha = 0.7;
          ctx.drawImage(monster.image, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#ffdd00';
          ctx.beginPath();
          ctx.arc(0, 0, imgSize * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        
        ctx.drawImage(
          monster.image,
          -imgSize / 2,
          -imgSize / 2,
          imgSize,
          imgSize
        );
      }
      
      // 怒りアイコン表示（怒り時のみ）
      if (monster.enraged && this.angerIcon && this.angerIcon.complete) {
        const iconSize = monsterSize * 0.3;
        ctx.drawImage(
          this.angerIcon,
          monsterSize * 0.25,
          -monsterSize * 0.4,
          iconSize,
          iconSize
        );
      }
      
      // ダメージ時の吹き出しアイコン表示
      if (monster.showDamageIcon && monster.damageIconUntil > now && this.attackIcon && this.attackIcon.complete) {
        const iconSize = monsterSize * 0.35;
        ctx.drawImage(
          this.attackIcon,
          monsterSize * 0.2,
          -monsterSize * 0.45,
          iconSize,
          iconSize
        );
      }
      
      ctx.restore();
      
      // ダメージテキスト描画
      if (monster.damageText) {
        const elapsed = now - monster.damageText.start;
        if (elapsed < monster.damageText.duration) {
          const progress = elapsed / monster.damageText.duration;
          const yOffset = -progress * 50;
          const alpha = 1 - progress;
          
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(String(monster.damageText.value), monster.x, baseY - monsterSize * 0.35 + yOffset);
          ctx.fillStyle = '#fff';
          ctx.fillText(String(monster.damageText.value), monster.x, baseY - monsterSize * 0.35 + yOffset);
          ctx.restore();
        } else {
          monster.damageText = undefined;
        }
      }
    });
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    const laneHeight = 90;
    
    // レーン背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, judgePos.y - laneHeight / 2, this.width, laneHeight);
    
    // 判定ライン
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(judgePos.x, judgePos.y - laneHeight / 2);
    ctx.lineTo(judgePos.x, judgePos.y + laneHeight / 2);
    ctx.stroke();
    
    // 判定エリアの円
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(judgePos.x, judgePos.y, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // ノーツを描画
    ctx.font = 'bold 14px sans-serif';
    this.taikoNotes.forEach((note) => {
      const radius = 30;
      const isAhead = note.x >= judgePos.x;
      
      // ノーツの円
      ctx.beginPath();
      ctx.arc(note.x, judgePos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isAhead ? '#f97316' : '#64748b';
      ctx.fill();
      ctx.strokeStyle = isAhead ? '#fff' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // コード名ラベル
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(note.chord).width;
      ctx.fillRect(note.x - textWidth / 2 - 6, judgePos.y - radius - 28, textWidth + 12, 22);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.chord, note.x, judgePos.y - radius - 17);
    });
  }

  private drawEffects(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    this.effects = this.effects.filter((e) => now - e.start < e.duration);
    
    this.effects.forEach((effect) => {
      const progress = (now - effect.start) / effect.duration;
      const alpha = 1 - progress;
      const radius = 15 + progress * 30;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = effect.success ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  private drawSpecialAttackEffect(ctx: CanvasRenderingContext2D): void {
    if (!this.specialAttackEffect) return;
    
    const now = performance.now();
    const elapsed = now - this.specialAttackEffect.start;
    
    if (elapsed > this.specialAttackEffect.duration) {
      this.specialAttackEffect = null;
      return;
    }
    
    const progress = elapsed / this.specialAttackEffect.duration;
    
    ctx.save();
    
    if (progress < 0.1) {
      // フラッシュ
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * (1 - progress / 0.1)})`;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (progress < 0.7) {
      // テキスト表示
      const textProgress = (progress - 0.1) / 0.6;
      const alpha = Math.min(1, textProgress * 2) * (1 - Math.max(0, (textProgress - 0.6) / 0.4));
      
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('Swing! Swing! Swing!', this.width / 2, this.height / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Swing! Swing! Swing!', this.width / 2, this.height / 2);
    }
    
    ctx.restore();
  }

  private drawOverlayText(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayText) return;
    if (performance.now() > this.overlayText.until) {
      this.overlayText = null;
      return;
    }
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(this.overlayText.value, this.width / 2, this.height * 0.08);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(this.overlayText.value, this.width / 2, this.height * 0.08);
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
      const webpImg = new Image();
      webpImg.decoding = 'async';
      webpImg.onload = () => {
        this.imageCache.set(icon, webpImg);
      };
      webpImg.src = `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`;
    };
    img.src = `${import.meta.env.BASE_URL}monster_icons/${icon}.png`;
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
    if (activeMonsters) {
      renderer.setActiveMonsters(activeMonsters);
    }
    onReady?.(renderer);
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

  useEffect(() => {
    rendererRef.current?.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.setDefaultMonsterIcon(monsterIcon);
  }, [monsterIcon]);

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
