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
  className?: string;
  activeMonsters?: MonsterState[];
  imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
}

interface TaikoDisplayNote {
  id: string;
  chord: string;
  x: number;
  /** 複数音の場合の個別音名配列（下から順に表示）*/
  noteNames?: string[];
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
  defeatedAt?: number; // 撃破アニメ開始時刻
  enraged: boolean;
  enrageScale: number;
  damagePopup?: DamagePopup;
}

// 太鼓レーン関連
const TAIKO_LANE_BG = 'rgba(30, 41, 59, 0.9)';
const TAIKO_LANE_BORDER = 'rgba(148, 163, 184, 0.4)';
const NOTE_STROKE = '#f59e0b';
const JUDGE_LINE_COLOR = '#ef4444';

// ダメージポップアップ用
const DAMAGE_COLOR = '#fbbf24';
const DAMAGE_STROKE = '#000000';

// 怒りアイコン（💢）用
const ANGER_EMOJI = '💢';

// 攻撃成功時の吹き出しアイコン（ゴキゲンな感じに）
const HIT_EMOJI = '🎵';

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

  // 🚀 パフォーマンス最適化: レンダリング頻度制御
  private lastRenderTime = 0;
  private readonly minRenderInterval = 16; // 16ms = 60FPS
  private needsRender = true; // 変更があった場合のみ true

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    onMonsterDefeated?: () => void,
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
    this.requestRender();
  }

  setActiveMonsters(monsters: MonsterState[]): void {
    const now = performance.now();
    const existingById = new Map(this.monsters.map((m) => [m.id, m] as const));
    const sorted = [...monsters].sort((a, b) => a.position.localeCompare(b.position));
    const count = sorted.length || 1;
    const spacing = this.width / (count + 1);
    const visuals: MonsterVisual[] = [];
    sorted.forEach((monster, index) => {
      const existing = existingById.get(monster.id);
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
        y: existing?.y ?? this.height * 0.45, // 基準Y位置（描画時に浮遊アニメーション適用）
        flashUntil: existing?.flashUntil ?? 0,
        defeated: monster.currentHp <= 0,
        defeatedAt: existing?.defeatedAt,
        enraged: isEnraged,
        enrageScale: existing?.enrageScale ?? 1,
        damagePopup: existing?.damagePopup
      });
    });

    // 既に倒された（または倒されつつある）モンスターを少しの間保持してフェードアウトさせる
    const FADE_MS = 450;
    for (const prev of this.monsters) {
      const stillAliveInNext = visuals.some((v) => v.id === prev.id);
      if (stillAliveInNext) continue;
      if (!prev.defeated || !prev.defeatedAt) continue;
      if (now - prev.defeatedAt > FADE_MS) continue;
      visuals.push(prev);
    }

    this.monsters = visuals;
    this.requestRender();
  }

  setDefaultMonsterIcon(icon: string): void {
    this.defaultMonsterIcon = icon;
    this.ensureImage(icon);
    this.requestRender();
  }

  createMonsterSprite(icon: string): void {
    this.setDefaultMonsterIcon(icon);
  }

  updateTaikoMode(enabled: boolean): void {
    if (this.taikoMode !== enabled) {
      this.taikoMode = enabled;
      this.requestRender();
    }
  }

  updateTaikoNotes(notes: TaikoDisplayNote[]): void {
    this.taikoNotes = notes;
    this.requestRender();
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
    _chordName: string | undefined,
    isSpecial: boolean,
    damageDealt: number,
    defeated: boolean
  ): void {
    const visual = this.monsters.find((m) => m.id === monsterId);
    if (visual) {
      visual.flashUntil = performance.now() + 450; // 250ms + 200ms延長
      
      // ダメージポップアップを追加（モンスターの少し上から開始、より長く表示）
      this.damagePopups.push({
        id: `damage_${Date.now()}_${Math.random()}`,
        x: visual.x,
        y: visual.y - 30, // モンスターの少し上から開始（以前より下げた）
        value: damageDealt,
        start: performance.now(),
        duration: 1800 // 1.8秒間表示（視認性向上）
      });
      
      // 必殺技エフェクト
      if (isSpecial) {
        this.triggerSpecialAttackEffect();
      }
      
      if (defeated && !visual.defeated) {
        visual.defeated = true;
        visual.defeatedAt = performance.now();
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
      duration: 700, // 1500msから700msに短縮（暗転時間を短く）
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
    
    const now = performance.now();
    
    // 🚀 パフォーマンス最適化: アクティブなアニメーションがある場合のみ描画
    const hasActiveAnimations = 
      this.effects.length > 0 ||
      this.damagePopups.length > 0 ||
      this.specialAttackEffect?.active ||
      this.overlayText !== null ||
      this.taikoNotes.length > 0 || // 太鼓ノーツがある場合
      this.monsters.length > 0 || // モンスター存在時は浮遊アニメーション用に描画継続
      this.monsters.some(m => 
        m.flashUntil > now || 
        (m.defeated && m.defeatedAt && now - m.defeatedAt < 450) ||
        Math.abs(m.x - m.targetX) > 1 || // 移動中
        m.enraged // 怒り状態
      );
    
    // アニメーションがある場合のみ毎フレーム描画、そうでなければ必要な時のみ
    if (hasActiveAnimations || this.needsRender) {
      this.drawFrame();
      this.needsRender = false;
    }
    
    this.startLoop();
  };

  private requestRender(): void {
    this.needsRender = true;
  }

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
          y: this.height * 0.45, // 基準Y位置（描画時に浮遊アニメーション適用）
          flashUntil: 0,
          defeated: false,
          enraged: false,
          enrageScale: 1,
          damagePopup: undefined
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
      
      // Y位置（軽量な浮遊アニメーション - sin波で5pxの上下動）
      // 各モンスターに異なるオフセットを与えて動きをずらす
      const floatOffset = Math.sin(now * 0.002 + monster.x * 0.01) * 5;
      monster.y = this.height * 0.45 + floatOffset;
      
      ctx.save();
      ctx.translate(monster.x, monster.y);

      // 撃破フェード（倒されたモンスターは一定時間で消える）
      if (monster.defeated && monster.defeatedAt) {
        const FADE_MS = 450;
        const p = Math.min(1, Math.max(0, (now - monster.defeatedAt) / FADE_MS));
        const alpha = 1 - p;
        if (alpha <= 0.01) {
          ctx.restore();
          return;
        }
        ctx.globalAlpha = alpha;
      }
      
      // フラッシュ効果（ダメージ時）は削除 - バウンスアニメーションのみで表現
      
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
      
      // ヒット時の音符エフェクト（🎵×2）
      if (monster.flashUntil > now) {
        ctx.font = `${Math.floor(monsterSize * 0.3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const hitProgress = (monster.flashUntil - now) / 450; // 450msに延長
        ctx.globalAlpha = hitProgress;
        
        // 左側の音符
        ctx.save();
        ctx.translate(-monsterSize * 0.35, -monsterSize * 0.3);
        const scale1 = 1 + (1 - hitProgress) * 0.4;
        ctx.scale(scale1, scale1);
        ctx.fillText(HIT_EMOJI, 0, 0);
        ctx.restore();
        
        // 右側の音符
        ctx.save();
        ctx.translate(monsterSize * 0.35, -monsterSize * 0.25);
        const scale2 = 1 + (1 - hitProgress) * 0.5;
        ctx.scale(scale2, scale2);
        ctx.fillText(HIT_EMOJI, 0, 0);
        ctx.restore();
        
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    });
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    
    // リズムタイプ：レーン背景・境界線・判定ラインは非表示
    // 判定エリアの円のみ表示
    ctx.strokeStyle = JUDGE_LINE_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(judgePos.x, judgePos.y, 35, 0, Math.PI * 2);
    ctx.stroke();
    
    // ノーツを描画
    this.taikoNotes.forEach((note) => {
      const radius = 30; // ノーツ半径を大幅に拡大
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
      
      // 音名表示（ノーツの上に縦配置で表示）
      // noteNamesがある場合は縦に並べる、なければchordをスペースで分割
      const displayNotes = note.noteNames || (note.chord ? note.chord.split(/\s+/).filter(n => n) : []);
      const noteCount = displayNotes.length;
      
      if (noteCount === 0) return;
      
      const fontSize = noteCount > 3 ? 16 : noteCount > 2 ? 18 : 22;
      const lineHeight = fontSize + 4;
      const badgePadding = 8;
      
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      
      // 最大テキスト幅を計算
      let maxTextWidth = 0;
      for (const noteName of displayNotes) {
        const tw = ctx.measureText(noteName).width;
        if (tw > maxTextWidth) maxTextWidth = tw;
      }
      
      const badgeWidth = maxTextWidth + badgePadding * 2;
      const badgeHeight = noteCount * lineHeight + badgePadding * 2;
      const badgeX = note.x - badgeWidth / 2;
      const badgeY = judgePos.y - radius - badgeHeight - 8;
      
      // バッジ背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
      ctx.fill();
      
      // バッジのポインタ（三角形）
      ctx.beginPath();
      ctx.moveTo(note.x, badgeY + badgeHeight);
      ctx.lineTo(note.x - 6, badgeY + badgeHeight + 6);
      ctx.lineTo(note.x + 6, badgeY + badgeHeight + 6);
      ctx.closePath();
      ctx.fill();
      
      // 音名を縦に配置（下から上へ、つまり配列の先頭が最下部）
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // displayNotesは低い音から順なので、下から上に配置
      for (let i = 0; i < noteCount; i++) {
        const noteName = displayNotes[i];
        // 最下部から上へ配置（i=0が最下部）
        const textY = badgeY + badgeHeight - badgePadding - (i + 0.5) * lineHeight;
        ctx.fillText(noteName, note.x, textY);
      }
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
      // フェードアウトを後半に集中させる（最初の70%は完全に表示）
      const alpha = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
      const yOffset = -progress * 40; // ゆっくり上に移動
      const scale = 1 + progress * 0.2; // 少し大きくなる
      
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
    
    // フェーズ2: テキスト表示 (0.1-0.85) - 暗転時間を短縮
    if (progress > 0.1 && progress < 0.85) {
      const textProgress = (progress - 0.1) / 0.75;
      const textAlpha = textProgress < 0.15 ? textProgress / 0.15 : 
                        textProgress > 0.85 ? (1 - textProgress) / 0.15 : 1;
      
      // 背景の暗転（より軽く）
      ctx.fillStyle = `rgba(0, 0, 0, ${textAlpha * 0.35})`;
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
    // 1. ローカルキャッシュを確認
    if (this.imageCache.has(icon)) {
      return this.imageCache.get(icon) ?? null;
    }
    // 2. プリロードキャッシュを確認
    if (this.imageTexturesRef?.current.has(icon)) {
      const image = this.imageTexturesRef.current.get(icon)!;
      this.imageCache.set(icon, image);
      return image;
    }
    // 3. 既に読み込み中なら待機
    if (this.loadingImages.has(icon)) {
      return null;
    }
    
    // 4. 新規読み込み開始
    this.loadingImages.add(icon);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      this.imageCache.set(icon, img);
      this.loadingImages.delete(icon);
      // プリロードキャッシュにも追加（他のインスタンスで再利用）
      if (this.imageTexturesRef?.current) {
        this.imageTexturesRef.current.set(icon, img);
      }
      this.requestRender();
    };
    img.onerror = () => {
      this.loadingImages.delete(icon);
    };
    
    // 楽譜モード用の画像パスを処理
    // フォーマット: sheet_music_{clef}_{noteName} (例: sheet_music_treble_A#3)
    if (icon.startsWith('sheet_music_')) {
      const parts = icon.split('_');
      // parts: ['sheet', 'music', 'treble', 'A#3']
      if (parts.length >= 4) {
        const clef = parts[2]; // 'treble' or 'bass'
        const noteName = parts.slice(3).join('_'); // 音名（'A#3'など）
        // ファイル名では # を sharp に変換
        const safeNoteName = noteName.replace(/#/g, 'sharp');
        img.src = `${import.meta.env.BASE_URL}notes_images/${clef}/${clef}_${safeNoteName}.png`;
        return null;
      }
    }
    
    // 🚀 パフォーマンス最適化: 直接PNGをロード（WebPフォールバックを削除）
    // WebPファイルが存在しないため、WebPテストをスキップして高速化
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
      imageTexturesRef
    );
    rendererRef.current = renderer;
    onReady?.(renderer);
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [onReady, onMonsterDefeated, imageTexturesRef]);

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
