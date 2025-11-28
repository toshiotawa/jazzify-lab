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

interface DamagePopup {
  id: string;
  x: number;
  y: number;
  value: number;
  start: number;
  duration: number;
}

interface MonsterVisual {
  id: string;
  icon: string;
  image: HTMLImageElement | null;
  hpRatio: number;
  targetX: number;
  x: number;
  y: number;
  flashUntil: number;
  defeated: boolean;
  enraged: boolean;
  enrageScale: number;
  magicText?: {
    value: string;
    isSpecial: boolean;
    until: number;
  };
  damagePopup?: DamagePopup;
  // ★ 攻撃成功時の跳ね上げアニメーション
  bounceUntil: number;
  bounceStartY: number;
}

// 太鼓レーン関連
const NOTE_STROKE = '#f59e0b';
const JUDGE_LINE_COLOR = '#ef4444';

// ダメージポップアップ用
const DAMAGE_COLOR = '#fbbf24';
const DAMAGE_STROKE = '#000000';

// 怒りアイコン（💢）用
const ANGER_EMOJI = '💢';

// 攻撃成功時の吹き出しアイコン
const HIT_EMOJI = '💥';

// ★ 攻撃成功時のゴキゲン吹き出しアイコン
const HAPPY_EMOJIS = ['😵', '😫', '🤯', '💫', '⭐'];

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
  private damagePopups: DamagePopup[] = [];
  private overlayText: { value: string; until: number } | null = null;
  private defaultMonsterIcon: string;
  private imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Set<string>();
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void;
  
  // 必殺技エフェクト用
  private specialAttackEffect: {
    active: boolean;
    start: number;
    duration: number;
    text: string;
  } | null = null;

  // 怒り状態を購読するためのunsubscribe関数
  private unsubscribeEnraged: (() => void) | null = null;
  private enragedState: Record<string, boolean> = {};

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
    
    // 怒り状態を購読
    this.unsubscribeEnraged = useEnemyStore.subscribe((state) => {
      this.enragedState = state.enraged;
    });
    this.enragedState = useEnemyStore.getState().enraged;
    
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
      const isEnraged = this.enragedState[monster.id] || false;
      visuals.push({
        id: monster.id,
        icon: monster.icon,
        image,
        hpRatio: monster.currentHp / monster.maxHp,
        targetX,
        x: existing ? existing.x : targetX,
        y: existing?.y ?? this.height * 0.5,
        flashUntil: existing?.flashUntil ?? 0,
        defeated: monster.currentHp <= 0,
        enraged: isEnraged,
        enrageScale: existing?.enrageScale ?? 1,
        magicText: existing?.magicText,
        damagePopup: existing?.damagePopup,
        // ★ 跳ね上げアニメーション
        bounceUntil: existing?.bounceUntil ?? 0,
        bounceStartY: existing?.bounceStartY ?? this.height * 0.5
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
      
      // ★ 跳ね上げアニメーションをトリガー
      visual.bounceUntil = performance.now() + 400;
      visual.bounceStartY = visual.y;
      
      // ダメージポップアップを追加
      this.damagePopups.push({
        id: `damage_${Date.now()}_${Math.random()}`,
        x: visual.x,
        y: visual.y - 60,
        value: damageDealt,
        start: performance.now(),
        duration: 1200
      });
      
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

  // 必殺技エフェクトをトリガー
  private triggerSpecialAttackEffect(): void {
    this.specialAttackEffect = {
      active: true,
      start: performance.now(),
      duration: 1500,
      text: 'Swing! Swing! Swing!'
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
    if (this.unsubscribeEnraged) {
      this.unsubscribeEnraged();
    }
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
    
    this.drawDamagePopups(ctx);
    this.drawEffects(ctx);
    this.drawSpecialAttackEffect(ctx);
    this.drawOverlayText(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    // シンプルな暗い背景（透明度を上げてゲーム感を出す）
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, 'rgba(10, 10, 20, 0.3)');
    gradient.addColorStop(1, 'rgba(5, 5, 15, 0.3)');
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
          y: this.height * 0.5,
          flashUntil: 0,
          defeated: false,
          enraged: false,
          enrageScale: 1,
          bounceUntil: 0,
          bounceStartY: this.height * 0.5
        }
      ];
    }
    
    const now = performance.now();
    const monsterCount = this.monsters.length;
    
    this.monsters.forEach((monster) => {
      // スムーズな位置移動
      monster.x += (monster.targetX - monster.x) * 0.12;
      
      // 怒り状態の更新
      const isEnraged = this.enragedState[monster.id] || false;
      monster.enraged = isEnraged;
      
      // 怒りスケールのアニメーション
      const targetScale = isEnraged ? 1.25 : 1;
      monster.enrageScale += (targetScale - monster.enrageScale) * 0.1;
      
      // モンスターのサイズ計算（背景・枠なし、画像のみ大きく表示）
      const baseSize = Math.min(
        this.width / Math.max(2, monsterCount + 0.5),
        this.height * 0.7
      );
      const monsterSize = baseSize * monster.enrageScale;
      
      // Y位置（中央より少し上）
      const baseY = this.height * 0.45;
      // アイドルアニメーション（上下の浮遊）
      const floatOffset = Math.sin(now * 0.002 + monster.id.charCodeAt(0)) * 4;
      
      // ★ 跳ね上げアニメーション
      let bounceOffset = 0;
      const isBouncing = monster.bounceUntil > now;
      if (isBouncing) {
        const bounceDuration = 400;
        const bounceProgress = 1 - (monster.bounceUntil - now) / bounceDuration;
        // イージング: 上に飛んで戻る (sin曲線)
        bounceOffset = -Math.sin(bounceProgress * Math.PI) * 25;
      }
      
      monster.y = baseY + floatOffset + bounceOffset;
      
      ctx.save();
      ctx.translate(monster.x, monster.y);
      
      // フラッシュ効果（ダメージ時）
      if (monster.flashUntil > now) {
        ctx.globalAlpha = 0.7 + Math.sin((now - monster.flashUntil + 250) * 0.05) * 0.3;
      }
      
      // 怒り時の赤みがかった色合い
      if (isEnraged) {
        ctx.filter = 'sepia(30%) saturate(150%) hue-rotate(-10deg)';
      }
      
      // モンスター画像を描画（背景・枠なし）
      if (monster.image) {
        const imgW = monsterSize;
        const imgH = monsterSize;
        ctx.drawImage(monster.image, -imgW / 2, -imgH / 2, imgW, imgH);
      } else {
        // ローディング中のプレースホルダー
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, monsterSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      
      // 怒りアイコン（💢）を表示
      if (isEnraged) {
        ctx.font = `${Math.floor(monsterSize * 0.3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // アニメーション（パルス）
        const pulse = 1 + Math.sin(now * 0.01) * 0.1;
        ctx.save();
        ctx.translate(monsterSize * 0.35, -monsterSize * 0.35);
        ctx.scale(pulse, pulse);
        ctx.fillText(ANGER_EMOJI, 0, 0);
        ctx.restore();
      }
      
      // ★ ヒット時の吹き出しアイコン（💥 + ゴキゲン絵文字）
      if (isBouncing) {
        const bounceDuration = 400;
        const bounceProgress = 1 - (monster.bounceUntil - now) / bounceDuration;
        
        ctx.font = `${Math.floor(monsterSize * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // フェードアウト効果
        const alpha = bounceProgress < 0.7 ? 1 : (1 - bounceProgress) / 0.3;
        ctx.globalAlpha = alpha;
        
        // 💥 エフェクト（左上）
        ctx.save();
        ctx.translate(-monsterSize * 0.35, -monsterSize * 0.4);
        const hitScale = 1 + bounceProgress * 0.3;
        ctx.scale(hitScale, hitScale);
        ctx.fillText(HIT_EMOJI, 0, 0);
        ctx.restore();
        
        // ゴキゲン吹き出し（右上）- 敵がやられてる感
        ctx.save();
        ctx.translate(monsterSize * 0.4, -monsterSize * 0.35);
        const happyScale = 0.8 + Math.sin(bounceProgress * Math.PI * 2) * 0.2;
        ctx.scale(happyScale, happyScale);
        // シード値を使って同じモンスターには同じ絵文字を表示
        const emojiIndex = monster.id.charCodeAt(0) % HAPPY_EMOJIS.length;
        ctx.fillText(HAPPY_EMOJIS[emojiIndex], 0, 0);
        ctx.restore();
        
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    });
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    // レーン高さ（描画位置計算用のみ）
    const laneHeight = Math.min(120, this.height * 0.35);
    const laneY = judgePos.y - laneHeight / 2;
    
    // ★ レーン背景・境界線は描画しない（ノーツのみ流れる）
    
    // 判定ライン（赤い縦線） - 控えめに表示
    ctx.strokeStyle = JUDGE_LINE_COLOR;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(judgePos.x, laneY + laneHeight * 0.2);
    ctx.lineTo(judgePos.x, laneY + laneHeight * 0.8);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // 判定エリアの円（薄く表示）
    ctx.strokeStyle = JUDGE_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(judgePos.x, judgePos.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // ノーツを描画
    this.taikoNotes.forEach((note) => {
      const radius = 30; // ノーツ半径
      const isAhead = note.x >= judgePos.x;
      
      // ノーツの影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(note.x + 2, judgePos.y + 2, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // ノーツ本体
      const gradient = ctx.createRadialGradient(
        note.x - radius * 0.3, judgePos.y - radius * 0.3, 0,
        note.x, judgePos.y, radius
      );
      gradient.addColorStop(0, isAhead ? '#fde047' : '#94a3b8');
      gradient.addColorStop(1, isAhead ? '#f59e0b' : '#64748b');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(note.x, judgePos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // ノーツの縁
      ctx.strokeStyle = isAhead ? NOTE_STROKE : '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // コード名（ノーツの上に大きく表示）
      const badgePadding = 12;
      ctx.font = 'bold 22px "Inter", sans-serif'; // ★ フォントサイズを大きく
      const textWidth = ctx.measureText(note.chord).width;
      const badgeWidth = textWidth + badgePadding * 2;
      const badgeHeight = 32; // ★ バッジ高さも拡大
      const badgeX = note.x - badgeWidth / 2;
      const badgeY = judgePos.y - radius - badgeHeight - 12;
      
      // バッジ背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
      ctx.fill();
      
      // バッジのポインタ（三角形）
      ctx.beginPath();
      ctx.moveTo(note.x, badgeY + badgeHeight);
      ctx.lineTo(note.x - 8, badgeY + badgeHeight + 8);
      ctx.lineTo(note.x + 8, badgeY + badgeHeight + 8);
      ctx.closePath();
      ctx.fill();
      
      // コード名テキスト
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.chord, note.x, badgeY + badgeHeight / 2);
    });
  }

  private drawDamagePopups(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    
    // 古いポップアップを削除
    this.damagePopups = this.damagePopups.filter(
      (popup) => now - popup.start < popup.duration
    );
    
    this.damagePopups.forEach((popup) => {
      const progress = (now - popup.start) / popup.duration;
      const alpha = 1 - progress;
      const yOffset = -progress * 60; // 上に移動
      const scale = 1 + progress * 0.3; // 少し大きくなる
      
      ctx.save();
      ctx.translate(popup.x, popup.y + yOffset);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      // ダメージテキスト
      const fontSize = 32;
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 縁取り
      ctx.strokeStyle = DAMAGE_STROKE;
      ctx.lineWidth = 4;
      ctx.strokeText(popup.value.toString(), 0, 0);
      
      // 本体
      ctx.fillStyle = DAMAGE_COLOR;
      ctx.fillText(popup.value.toString(), 0, 0);
      
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
      
      ctx.strokeStyle = effect.success ? '#22c55e' : '#ef4444';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 成功時は追加のパーティクル
      if (effect.success) {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + progress * Math.PI;
          const particleRadius = radius * 1.3;
          const px = effect.x + Math.cos(angle) * particleRadius;
          const py = effect.y + Math.sin(angle) * particleRadius;
          
          ctx.fillStyle = '#fbbf24';
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.globalAlpha = 1;
    });
  }

  private drawSpecialAttackEffect(ctx: CanvasRenderingContext2D): void {
    if (!this.specialAttackEffect || !this.specialAttackEffect.active) return;
    
    const now = performance.now();
    const elapsed = now - this.specialAttackEffect.start;
    const progress = elapsed / this.specialAttackEffect.duration;
    
    if (progress >= 1) {
      this.specialAttackEffect = null;
      return;
    }
    
    ctx.save();
    
    // フェーズ1: 白いフラッシュ (0-0.1)
    if (progress < 0.1) {
      const flashAlpha = Math.sin((progress / 0.1) * Math.PI) * 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // フェーズ2: テキスト表示 (0.1-0.9)
    if (progress > 0.1 && progress < 0.9) {
      const textProgress = (progress - 0.1) / 0.8;
      const textAlpha = textProgress < 0.2 ? textProgress / 0.2 : 
                        textProgress > 0.8 ? (1 - textProgress) / 0.2 : 1;
      
      // 背景の暗転
      ctx.fillStyle = `rgba(0, 0, 0, ${textAlpha * 0.5})`;
      ctx.fillRect(0, 0, this.width, this.height);
      
      // テキスト
      ctx.globalAlpha = textAlpha;
      ctx.font = 'bold 48px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // グロー効果
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
      
      // 縁取り
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText(this.specialAttackEffect.text, this.width / 2, this.height / 2);
      
      // 本体（金色）
      const gradient = ctx.createLinearGradient(
        this.width / 2 - 200, this.height / 2,
        this.width / 2 + 200, this.height / 2
      );
      gradient.addColorStop(0, '#fde047');
      gradient.addColorStop(0.5, '#fbbf24');
      gradient.addColorStop(1, '#f59e0b');
      ctx.fillStyle = gradient;
      ctx.fillText(this.specialAttackEffect.text, this.width / 2, this.height / 2);
      
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }

  private drawOverlayText(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayText) return;
    if (performance.now() > this.overlayText.until) {
      this.overlayText = null;
      return;
    }
    
    ctx.save();
    ctx.font = 'bold 28px "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.overlayText.value, this.width / 2, this.height * 0.12);
    ctx.shadowBlur = 0;
    ctx.restore();
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
    // WebP優先、フォールバックでPNG
    const webpPath = `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`;
    const pngPath = `${import.meta.env.BASE_URL}monster_icons/${icon}.png`;
    
    const testImg = new Image();
    testImg.onload = () => {
      img.src = webpPath;
    };
    testImg.onerror = () => {
      img.src = pngPath;
    };
    testImg.src = webpPath;
    
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
