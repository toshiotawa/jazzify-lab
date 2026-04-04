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
  offsetX: number;
  offsetY: number;
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
  defeatedAt?: number;
  enraged: boolean;
  enrageScale: number;
  hitNoteOffsets: Array<{ x: number; y: number }>;
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

const EMOJI_FONT_FALLBACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const isLikelyWebKitRenderer = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome\//.test(ua);
};

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
  private taikoNotesDirty = false;
  /** GameScreen の太鼓ノーツ位置計算を描画ループと同一 RAF で実行し、二重 rAF の競合を防ぐ */
  private taikoFrameCallback: (() => void) | null = null;
  private effects: ParticleEffect[] = [];
  private damagePopups: DamagePopup[] = [];
  private overlayText: { value: string; until: number } | null = null;
  private defaultMonsterIcon: string;
  private imageTexturesRef?: React.MutableRefObject<Map<string, HTMLImageElement>>;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Set<string>();
  private onMonsterDefeated?: () => void;
  private readonly isWebKit: boolean;

  // 怒り状態を購読するためのunsubscribe関数
  private unsubscribeEnraged: (() => void) | null = null;
  private enragedState: Record<string, boolean> = {};

  private needsRender = true; // 変更があった場合のみ true
  private isSheetMusicMode = false;

  /**
   * 太鼓モード: モンスター＋背景をオフスクリーンに低頻度で描き、毎フレームは合成＋太鼓レーン中心にする。
   * メイン rAF の仕事量を減らし、ノーツ列とモンスター演出の相互汚染を抑える。
   */
  private taikoMonsterBuffer: HTMLCanvasElement | null = null;
  private lastTaikoMonsterComposite = 0;
  private forceMonsterLayerComposite = true;
  private readonly TAIKO_MONSTER_LAYER_MIN_MS = 34;

  /** 毎フレーム createLinearGradient を避ける（リサイズまで再利用） */
  private backgroundGradient: CanvasGradient | null = null;

  // 🚀 ノーツ描画最適化: プリレンダリングキャッシュ
  private noteCircleCache: HTMLCanvasElement | null = null;
  private noteShadowCache: HTMLCanvasElement | null = null;
  /** 太鼓ノーツのコード／音名バッジを1枚にまとめたキャッシュ（drawImage 回数削減） */
  private badgeStackCache = new Map<string, HTMLCanvasElement>();

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
    this.isWebKit = isLikelyWebKitRenderer();
    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.pixelRatio = this.isWebKit ? Math.min(rawDpr, 1.25) : rawDpr;
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

  setSheetMusicMode(enabled: boolean): void {
    this.isSheetMusicMode = enabled;
  }

  /** ノーツ多数時はモンスター側の filter / 浮遊を省略して描画負荷を抑える */
  private isHeavyTaikoMode(): boolean {
    return this.taikoMode && this.taikoNotes.length >= 24;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.configureCanvasSize(width, height);
    this.forceMonsterLayerComposite = true;
    this.taikoMonsterBuffer = null;
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
        hitNoteOffsets: existing?.hitNoteOffsets ?? [],
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
    this.forceMonsterLayerComposite = true;
    this.requestRender();
  }

  setDefaultMonsterIcon(icon: string): void {
    this.defaultMonsterIcon = icon;
    this.ensureImage(icon);
    this.forceMonsterLayerComposite = true;
    this.requestRender();
  }

  createMonsterSprite(icon: string): void {
    this.setDefaultMonsterIcon(icon);
  }

  updateTaikoMode(enabled: boolean): void {
    if (this.taikoMode !== enabled) {
      this.taikoMode = enabled;
      if (!enabled) {
        this.taikoMonsterBuffer = null;
      } else {
        this.forceMonsterLayerComposite = true;
      }
      this.requestRender();
    }
  }

  updateTaikoNotes(notes: TaikoDisplayNote[]): void {
    const newLen = notes.length;
    if (this.taikoNotes.length !== newLen) {
      this.taikoNotes.length = newLen;
    }
    for (let i = 0; i < newLen; i++) {
      this.taikoNotes[i] = notes[i];
    }
    this.taikoNotesDirty = true;
    this.requestRender();
  }

  setTaikoFrameCallback(cb: (() => void) | null): void {
    this.taikoFrameCallback = cb;
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
    _isSpecial: boolean,
    damageDealt: number,
    defeated: boolean
  ): void {
    const visual = this.monsters.find((m) => m.id === monsterId);
    if (visual) {
      // 太鼓モードは全ブラウザで軽量ビジュアル（レジェンド相当の滑らかさを優先）
      const taikoLight = this.taikoMode;

      visual.flashUntil = performance.now() + (taikoLight ? 180 : 450);
      visual.hitNoteOffsets = taikoLight
        ? []
        : Array.from({ length: 2 }, () => {
            const a = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
            const d = 0.3 + Math.random() * 0.25;
            return { x: Math.cos(a) * d, y: Math.sin(a) * d };
          });
      
      const randAngle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
      const randDist = 30 + Math.random() * 40;
      const skipDamagePopup = taikoLight && this.isWebKit;
      if (!skipDamagePopup) {
        this.damagePopups.push({
          id: `damage_${Date.now()}_${Math.random()}`,
          x: visual.x,
          y: visual.y,
          value: damageDealt,
          start: performance.now(),
          duration: this.isSheetMusicMode
            ? 100
            : taikoLight
              ? 320
              : 1800,
          offsetX: Math.cos(randAngle) * randDist,
          offsetY: Math.sin(randAngle) * randDist,
        });
      }

      if (defeated && !visual.defeated) {
        visual.defeated = true;
        visual.defeatedAt = performance.now();
        setTimeout(() => {
          this.onMonsterDefeated?.();
        }, 400);
      }
      this.forceMonsterLayerComposite = true;
      this.requestRender();
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
    this.taikoFrameCallback = null;
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
    this.noteCircleCache = null;
    this.noteShadowCache = null;
    this.badgeStackCache.clear();
    this.backgroundGradient = null;
    this.taikoMonsterBuffer = null;
  }

  private configureCanvasSize(width: number, height: number): void {
    if (this.width !== width || this.height !== height) {
      this.backgroundGradient = null;
    }
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

    if (this.taikoMode && this.taikoFrameCallback) {
      this.taikoFrameCallback();
    }

    const hasActiveAnimations =
      this.effects.length > 0 ||
      this.damagePopups.length > 0 ||
      this.overlayText !== null ||
      this.taikoNotesDirty ||
      (this.monsters.length > 0 && !this.taikoMode) ||
      (this.taikoMode && this.taikoFrameCallback !== null);

    if (hasActiveAnimations || this.needsRender) {
      this.drawFrame();
      this.needsRender = false;
      this.taikoNotesDirty = false;
    }
    
    this.startLoop();
  };

  private requestRender(): void {
    this.needsRender = true;
  }

  private ensureTaikoMonsterBuffer(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!this.taikoMonsterBuffer || this.taikoMonsterBuffer.width !== w || this.taikoMonsterBuffer.height !== h) {
      this.taikoMonsterBuffer = document.createElement('canvas');
      this.taikoMonsterBuffer.width = w;
      this.taikoMonsterBuffer.height = h;
    }
  }

  /** 太鼓: 背景・モンスターをオフスクリーンに間引き描画し、毎フレームは合成してからレーンのみ高頻度更新 */
  private drawFrameTaikoLayered(): void {
    const now = performance.now();
    const needMonster =
      this.forceMonsterLayerComposite ||
      this.taikoMonsterBuffer == null ||
      now - this.lastTaikoMonsterComposite >= this.TAIKO_MONSTER_LAYER_MIN_MS;

    if (needMonster) {
      this.ensureTaikoMonsterBuffer();
      const b = this.taikoMonsterBuffer!;
      const bctx = b.getContext('2d');
      if (!bctx) return;
      bctx.save();
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.clearRect(0, 0, b.width, b.height);
      bctx.restore();
      bctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      this.drawBackground(bctx);
      this.drawMonsters(bctx);
      this.lastTaikoMonsterComposite = now;
      this.forceMonsterLayerComposite = false;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

    if (this.taikoMonsterBuffer) {
      ctx.drawImage(this.taikoMonsterBuffer, 0, 0, this.width, this.height);
    } else {
      this.drawBackground(ctx);
      this.drawMonsters(ctx);
    }

    this.drawTaikoLane(ctx);
    this.drawDamagePopups(ctx);
    this.drawEffects(ctx);
    this.drawOverlayText(ctx);
  }

  private drawFrame(): void {
    if (this.taikoMode) {
      this.drawFrameTaikoLayered();
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    
    this.drawBackground(ctx);
    this.drawMonsters(ctx);
    
    this.drawDamagePopups(ctx);
    this.drawEffects(ctx);
    this.drawOverlayText(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.backgroundGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, 'rgba(10, 10, 20, 0.3)');
      gradient.addColorStop(1, 'rgba(5, 5, 15, 0.3)');
      this.backgroundGradient = gradient;
    }
    ctx.fillStyle = this.backgroundGradient;
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
          hitNoteOffsets: [],
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
      
      const heavyTaiko = this.isHeavyTaikoMode();
      // Y位置（軽量な浮遊アニメーション - sin波で5pxの上下動）。太鼓多ノーツ時は省略
      const floatOffset = heavyTaiko ? 0 : Math.sin(now * 0.002 + monster.x * 0.01) * 5;
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
      
      // 怒り時の赤みがかった色合い（太鼓多ノーツ時は filter 省略）
      if (isEnraged && !heavyTaiko) {
        ctx.filter = 'sepia(30%) saturate(150%) hue-rotate(-10deg)';
      }
      
      // 非同期ロード完了後にキャッシュから画像を反映
      if (!monster.image) {
        monster.image = this.imageCache.get(monster.icon)
          ?? this.imageTexturesRef?.current.get(monster.icon)
          ?? null;
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
      
      const taikoLight = this.taikoMode;

      // 怒りアイコン（💢）を表示（太鼓モードではスキップ）
      if (isEnraged && !taikoLight) {
        ctx.font = `${Math.floor(monsterSize * 0.3)}px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const pulse = 1 + Math.sin(now * 0.01) * 0.1;
        ctx.save();
        ctx.translate(monsterSize * 0.35, -monsterSize * 0.35);
        ctx.scale(pulse, pulse);
        ctx.fillText(ANGER_EMOJI, 0, 0);
        ctx.restore();
      }
      
      // ヒット時の音符エフェクト（太鼓モードではスキップ）
      if (monster.flashUntil > now && !taikoLight) {
        ctx.font = `${Math.floor(monsterSize * 0.3)}px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const flashDuration = 450;
        const hitProgress = (monster.flashUntil - now) / flashDuration;
        ctx.globalAlpha = hitProgress;
        
        const offsets = monster.hitNoteOffsets.length >= 2
          ? monster.hitNoteOffsets
          : [{ x: -0.35, y: -0.3 }, { x: 0.35, y: -0.25 }];
        
        offsets.forEach((off, i) => {
          ctx.save();
          ctx.translate(monsterSize * off.x, monsterSize * off.y);
          const s = 1 + (1 - hitProgress) * (0.4 + i * 0.1);
          ctx.scale(s, s);
          ctx.fillText(HIT_EMOJI, 0, 0);
          ctx.restore();
        });
        
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    });
  }

  private ensureNoteCircleCache(): void {
    if (this.noteCircleCache) return;
    const radius = 30;
    const padding = 4;
    const size = (radius + padding) * 2;

    // ノーツ影キャッシュ
    const shadow = document.createElement('canvas');
    shadow.width = size;
    shadow.height = size;
    const sCtx = shadow.getContext('2d')!;
    sCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    sCtx.beginPath();
    sCtx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    sCtx.fill();
    this.noteShadowCache = shadow;

    // ノーツ本体キャッシュ（グラデーション + 枠線）
    const circle = document.createElement('canvas');
    circle.width = size;
    circle.height = size;
    const cCtx = circle.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const gradient = cCtx.createRadialGradient(
      cx - radius * 0.3, cy - radius * 0.3, 0,
      cx, cy, radius
    );
    gradient.addColorStop(0, '#fde047');
    gradient.addColorStop(1, '#f59e0b');
    cCtx.fillStyle = gradient;
    cCtx.beginPath();
    cCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.strokeStyle = NOTE_STROKE;
    cCtx.lineWidth = 3;
    cCtx.stroke();
    this.noteCircleCache = circle;
  }

  /** 複数行ラベルを1テクスチャにまとめ、ノーツ1個あたりの drawImage 回数を削減 */
  private getBadgeStackCache(lines: string[], fontSize: number): HTMLCanvasElement {
    const cacheKey = `${lines.join('\u0001')}_${fontSize}`;
    const existing = this.badgeStackCache.get(cacheKey);
    if (existing) return existing;

    if (this.badgeStackCache.size > 120) {
      this.badgeStackCache.clear();
    }

    const lineHeight = fontSize + 4;
    const padding = 8;
    const font = `bold ${fontSize}px "Inter", sans-serif`;
    const measureCtx = this.ctx;
    measureCtx.font = font;
    let maxW = 0;
    for (let li = 0; li < lines.length; li++) {
      maxW = Math.max(maxW, measureCtx.measureText(lines[li]).width);
    }
    const w = Math.ceil(maxW) + padding * 2;
    const h = lines.length * lineHeight + padding * 2;

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const tCtx = c.getContext('2d')!;
    tCtx.font = font;
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.lineWidth = 3;
    for (let i = 0; i < lines.length; i++) {
      const y = padding + (i + 0.5) * lineHeight;
      tCtx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      tCtx.strokeText(lines[i], w / 2, y);
      tCtx.fillStyle = '#ffffff';
      tCtx.fillText(lines[i], w / 2, y);
    }

    this.badgeStackCache.set(cacheKey, c);
    return c;
  }

  private drawTaikoLane(ctx: CanvasRenderingContext2D): void {
    const judgePos = this.getJudgeLinePosition();
    this.ensureNoteCircleCache();
    const circleImg = this.noteCircleCache!;
    const shadowImg = this.noteShadowCache!;
    const radius = 30;
    const halfSize = circleImg.width / 2;

    ctx.strokeStyle = JUDGE_LINE_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(judgePos.x, judgePos.y, 35, 0, Math.PI * 2);
    ctx.stroke();

    let labeledCount = 0;
    const labelLimit = 10;
    const nearDistance = 420;

    for (let ni = 0; ni < this.taikoNotes.length; ni++) {
      const note = this.taikoNotes[ni];

      ctx.drawImage(shadowImg, note.x + 2 - halfSize, judgePos.y + 2 - halfSize);
      ctx.drawImage(circleImg, note.x - halfSize, judgePos.y - halfSize);

      const shouldDrawLabel =
        labeledCount < labelLimit ||
        Math.abs(note.x - judgePos.x) < nearDistance;
      if (!shouldDrawLabel) continue;
      labeledCount++;

      const displayNotes = note.noteNames && note.noteNames.length > 0
        ? note.noteNames
        : (note.chord ? note.chord.split(/\s+/).filter(Boolean) : []);
      const noteCount = displayNotes.length;
      if (noteCount === 0) continue;

      const fontSize = noteCount > 3 ? 16 : noteCount > 2 ? 18 : 22;
      const badgeImg = this.getBadgeStackCache(displayNotes, fontSize);
      const badgeY = judgePos.y - radius - badgeImg.height - 8;
      ctx.drawImage(badgeImg, note.x - badgeImg.width / 2, badgeY);
    }
  }

  private drawDamagePopups(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    const taikoLight = this.taikoMode;
    const ultraLight =
      taikoLight || this.isWebKit || this.isHeavyTaikoMode();
    
    this.damagePopups = this.damagePopups.filter(
      (popup) => now - popup.start < popup.duration
    );
    
    this.damagePopups.forEach((popup) => {
      const progress = (now - popup.start) / popup.duration;

      let alpha: number;
      let yOffset: number;
      let bounceScale: number;
      let ox: number;
      let oy: number;

      if (this.isSheetMusicMode) {
        alpha = 1 - progress;
        yOffset = 0;
        bounceScale = 1;
        ox = 0;
        oy = 0;
      } else if (taikoLight) {
        alpha = 1 - progress;
        yOffset = -progress * 16;
        bounceScale = 1;
        ox = popup.offsetX * 0.15;
        oy = popup.offsetY * 0.15;
      } else {
        alpha = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
        yOffset = -progress * 50;
        bounceScale = progress < 0.1
          ? 1 + Math.sin((progress / 0.1) * Math.PI) * 0.5
          : 1.2 + progress * 0.15;
        ox = popup.offsetX;
        oy = popup.offsetY;
      }

      ctx.save();
      ctx.translate(popup.x + ox, popup.y + oy + yOffset);
      ctx.scale(bounceScale, bounceScale);
      ctx.globalAlpha = alpha;
      
      const fontSize = taikoLight ? 22 : 28;
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (!ultraLight) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = DAMAGE_STROKE;
        ctx.lineWidth = 5;
        ctx.strokeText(popup.value.toString(), 0, 0);
      }
      
      ctx.fillStyle = DAMAGE_COLOR;
      ctx.fillText(popup.value.toString(), 0, 0);
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }

  private drawEffects(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    this.effects = this.effects.filter((effect) => now - effect.start < effect.duration);
    const particleCap = this.taikoMode ? 0 : 6;
    
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
      
      // 成功時は追加のパーティクル（太鼓モードではリングのみ）
      if (effect.success && particleCap > 0) {
        for (let i = 0; i < particleCap; i++) {
          const angle = (i / particleCap) * Math.PI * 2 + progress * Math.PI;
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
      // 表示中モンスターの image フィールドを即時反映
      for (const m of this.monsters) {
        if (m.icon === icon && !m.image) {
          m.image = img;
        }
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
