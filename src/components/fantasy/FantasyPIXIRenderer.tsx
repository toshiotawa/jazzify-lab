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
  phase: 'flash' | 'text' | 'fadeout';
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
  magicText?: {
    value: string;
    isSpecial: boolean;
    until: number;
  };
}

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
  private specialAttackEffect: SpecialAttackEffect | null = null;
  private overlayText: { value: string; until: number } | null = null;
  private defaultMonsterIcon: string;
  private imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Set<string>();
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  private angerIcon: HTMLImageElement | null = null;
  private attackIcon: HTMLImageElement | null = null;

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
    this.loadAssets();
    this.startLoop();
  }

  private loadAssets(): void {
    // 怒りアイコンをロード
    this.angerIcon = new Image();
    this.angerIcon.src = `${import.meta.env.BASE_URL}data/anger.svg`;
    
    // 攻撃アイコン（音符吹き出し）をロード
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
        enrageScale: existing?.enrageScale ?? 1,
        showDamageIcon: existing?.showDamageIcon ?? false,
        damageIconUntil: existing?.damageIconUntil ?? 0,
        damageText: existing?.damageText,
        magicText: existing?.magicText
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
      duration: success ? 300 : 400,
      success
    });
  }

  triggerAttackSuccessOnMonster(
    monsterId: string,
    chordName: string | undefined,
    isSpecial: boolean,
    damageDealt: number,
    defeated: boolean
  ): void {
    const visual = this.monsters.find((m) => m.id === monsterId);
    if (visual) {
      visual.flashUntil = performance.now() + 250;
      visual.showDamageIcon = true;
      visual.damageIconUntil = performance.now() + 800;
      
      // ダメージテキスト追加
      visual.damageText = {
        x: visual.x,
        y: this.height * 0.25,
        value: damageDealt,
        start: performance.now(),
        duration: 1200
      };
      
      if (chordName) {
        visual.magicText = {
          value: chordName,
          isSpecial,
          until: performance.now() + 1500
        };
        this.onShowMagicName?.(chordName, isSpecial, monsterId);
      }
      
      // 必殺技エフェクト
      if (isSpecial) {
        this.triggerSpecialAttackEffect();
      }
      
      if (defeated && !visual.defeated) {
        visual.defeated = true;
        setTimeout(() => {
          this.onMonsterDefeated?.();
        }, 400);
      }
    }
  }

  private triggerSpecialAttackEffect(): void {
    this.specialAttackEffect = {
      start: performance.now(),
      duration: 2000,
      phase: 'flash'
    };
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
    
    // 背景は完全に透明（親要素の背景が見える）
    
    this.drawMonsters(ctx);
    if (this.taikoMode) {
      this.drawTaikoLane(ctx);
    }
    this.drawEffects(ctx);
    this.drawDamageTexts(ctx);
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
    const enragedTable = useEnemyStore.getState().enraged;
    
    this.monsters.forEach((monster) => {
      // スムーズな移動
      monster.x += (monster.targetX - monster.x) * 0.15;
      
      // 怒り状態の更新
      monster.enraged = enragedTable[monster.id] ?? false;
      
      // 怒り時のスケールアニメーション
      const targetScale = monster.enraged ? 1.25 : 1;
      monster.enrageScale += (targetScale - monster.enrageScale) * 0.1;
      
      // モンスターのサイズを大きく計算（画面高さの60%を使用）
      const baseSize = Math.min(this.height * 0.6, this.width / (this.monsters.length + 1) * 0.9);
      const monsterSize = baseSize * monster.enrageScale;
      const baseY = this.height * 0.45;
      
      // フラッシュエフェクト（ダメージ時）
      const isFlashing = monster.flashUntil > now;
      
      ctx.save();
      ctx.translate(monster.x, baseY);
      
      // 怒り時のパルスアニメーション
      if (monster.enraged) {
        const pulse = Math.sin(now * 0.008) * 0.03 + 1;
        ctx.scale(pulse, pulse);
      }
      
      // モンスター画像を描画（背景・枠なし）
      if (monster.image && monster.image.complete) {
        ctx.save();
        
        // フラッシュ時は黄色に着色
        if (isFlashing) {
          ctx.filter = 'brightness(1.5) sepia(0.5) saturate(2)';
        }
        
        // 怒り時は赤みがかった色に
        if (monster.enraged) {
          ctx.filter = 'brightness(1.1) sepia(0.2) hue-rotate(-15deg)';
        }
        
        const imgSize = monsterSize;
        ctx.drawImage(
          monster.image,
          -imgSize / 2,
          -imgSize / 2,
          imgSize,
          imgSize
        );
        ctx.restore();
      }
      
      // 怒りアイコン表示
      if (monster.enraged && this.angerIcon && this.angerIcon.complete) {
        const iconSize = monsterSize * 0.3;
        ctx.drawImage(
          this.angerIcon,
          monsterSize * 0.3,
          -monsterSize * 0.4,
          iconSize,
          iconSize
        );
      }
      
      // ダメージ時の吹き出しアイコン表示
      if (monster.showDamageIcon && monster.damageIconUntil > now && this.attackIcon && this.attackIcon.complete) {
        const iconSize = monsterSize * 0.4;
        const bobY = Math.sin(now * 0.01) * 3;
        ctx.drawImage(
          this.attackIcon,
          monsterSize * 0.25,
          -monsterSize * 0.55 + bobY,
          iconSize,
          iconSize
        );
      }
      
      ctx.restore();
      
      // ダメージテキスト描画（モンスターごと）
      if (monster.damageText) {
        const elapsed = now - monster.damageText.start;
        if (elapsed < monster.damageText.duration) {
          const progress = elapsed / monster.damageText.duration;
          const yOffset = -progress * 60;
          const alpha = 1 - Math.pow(progress, 2);
          const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
          
          ctx.save();
          ctx.translate(monster.x, baseY - monsterSize * 0.4 + yOffset);
          ctx.scale(scale, scale);
          ctx.globalAlpha = alpha;
          ctx.font = 'bold 36px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // 縁取り
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.strokeText(String(monster.damageText.value), 0, 0);
          
          // テキスト（白）
          ctx.fillStyle = '#ffffff';
          ctx.fillText(String(monster.damageText.value), 0, 0);
          
          ctx.restore();
        } else {
          monster.damageText = undefined;
        }
      }
    });
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    // レーン高さを大きく
    const laneHeight = 100;
    
    // レーン背景（半透明の暗い背景）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, judgePos.y - laneHeight / 2, this.width, laneHeight);
    
    // 判定ライン（赤いライン）
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(judgePos.x, judgePos.y - laneHeight / 2);
    ctx.lineTo(judgePos.x, judgePos.y + laneHeight / 2);
    ctx.stroke();
    
    // 判定エリアの円
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(judgePos.x, judgePos.y, 45, 0, Math.PI * 2);
    ctx.stroke();
    
    // ノーツを描画（大きく）
    this.taikoNotes.forEach((note) => {
      const radius = 35; // 大きなノーツ
      const isAhead = note.x >= judgePos.x;
      
      // ノーツの円
      ctx.beginPath();
      ctx.arc(note.x, judgePos.y, radius, 0, Math.PI * 2);
      
      // グラデーション塗りつぶし
      const gradient = ctx.createRadialGradient(
        note.x - radius * 0.3, judgePos.y - radius * 0.3, 0,
        note.x, judgePos.y, radius
      );
      if (isAhead) {
        gradient.addColorStop(0, '#fb923c');
        gradient.addColorStop(1, '#ea580c');
      } else {
        gradient.addColorStop(0, '#64748b');
        gradient.addColorStop(1, '#475569');
      }
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 縁取り
      ctx.strokeStyle = isAhead ? '#ffffff' : '#94a3b8';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // コード名ラベル（上に表示）
      ctx.save();
      ctx.translate(note.x, judgePos.y - radius - 15);
      
      // ラベル背景
      ctx.font = 'bold 16px "Inter", sans-serif';
      const textWidth = ctx.measureText(note.chord).width;
      const paddingX = 10;
      const paddingY = 5;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - paddingX, -12 - paddingY, textWidth + paddingX * 2, 24 + paddingY * 2, 6);
      ctx.fill();
      
      // ラベルテキスト
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.chord, 0, 0);
      
      ctx.restore();
    });
  }

  private drawEffects(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    this.effects = this.effects.filter((effect) => now - effect.start < effect.duration);
    this.effects.forEach((effect) => {
      const progress = (now - effect.start) / effect.duration;
      const alpha = 1 - progress;
      const radius = 20 + progress * 40;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // リング
      ctx.strokeStyle = effect.success ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 内側の光
      const innerGradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius * 0.6);
      innerGradient.addColorStop(0, effect.success ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)');
      innerGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  private drawDamageTexts(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    this.damageTexts = this.damageTexts.filter((dt) => now - dt.start < dt.duration);
    
    this.damageTexts.forEach((dt) => {
      const progress = (now - dt.start) / dt.duration;
      const yOffset = -progress * 80;
      const alpha = 1 - Math.pow(progress, 2);
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
      
      ctx.save();
      ctx.translate(dt.x, dt.y + yOffset);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 42px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 縁取り
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.strokeText(String(dt.value), 0, 0);
      
      // テキスト
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(dt.value), 0, 0);
      
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
    
    if (progress < 0.15) {
      // フラッシュフェーズ
      const flashProgress = progress / 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - flashProgress)})`;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (progress < 0.7) {
      // テキスト表示フェーズ
      const textProgress = (progress - 0.15) / 0.55;
      const scale = 0.8 + Math.sin(textProgress * Math.PI) * 0.4;
      const alpha = Math.min(1, textProgress * 3) * (1 - Math.max(0, (textProgress - 0.7) / 0.3));
      
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      ctx.font = 'bold 56px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 金色のグラデーション
      const gradient = ctx.createLinearGradient(-200, -30, 200, 30);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(0.5, '#fef08a');
      gradient.addColorStop(1, '#fbbf24');
      
      // 縁取り
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText('Swing! Swing! Swing!', 0, 0);
      
      ctx.fillStyle = gradient;
      ctx.fillText('Swing! Swing! Swing!', 0, 0);
    } else {
      // フェードアウト
      const fadeProgress = (progress - 0.7) / 0.3;
      ctx.globalAlpha = 1 - fadeProgress;
    }
    
    ctx.restore();
  }

  private drawOverlayText(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayText) return;
    if (performance.now() > this.overlayText.until) {
      this.overlayText = null;
      return;
    }
    ctx.font = 'bold 28px "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(this.overlayText.value, this.width / 2, this.height * 0.08);
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
      // WebPでリトライ
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
