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

export interface TaikoDisplayNote {
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
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('android');
};

export class FantasyPIXIInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private taikoCanvas: HTMLCanvasElement;
  private taikoCtx: CanvasRenderingContext2D;
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
  

  // 怒り状態を購読するためのunsubscribe関数
  private unsubscribeEnraged: (() => void) | null = null;
  private enragedState: Record<string, boolean> = {};

  private needsMainRender = true;
  private needsTaikoRender = true;
  private isSheetMusicMode = false;
  private readonly lightweightMonsterEffects = isLikelyWebKitRenderer();

  // 🚀 ノーツ描画最適化: プリレンダリングキャッシュ
  private noteCircleCache: HTMLCanvasElement | null = null;
  private noteShadowCache: HTMLCanvasElement | null = null;
  private textCache = new Map<string, HTMLCanvasElement>();

  constructor(
    canvas: HTMLCanvasElement,
    taikoCanvas: HTMLCanvasElement,
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
    this.taikoCanvas = taikoCanvas;
    const taikoContext = taikoCanvas.getContext('2d');
    if (!taikoContext) {
      throw new Error('Taiko canvas 2D context is not available');
    }
    this.taikoCtx = taikoContext;
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
      this.requestMainRender();
    });
    this.enragedState = useEnemyStore.getState().enraged;
    
    this.startLoop();
  }

  setSheetMusicMode(enabled: boolean): void {
    this.isSheetMusicMode = enabled;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.configureCanvasSize(width, height);
    this.requestMainRender();
    this.requestTaikoRender();
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
    this.requestMainRender();
  }

  setDefaultMonsterIcon(icon: string): void {
    this.defaultMonsterIcon = icon;
    this.ensureImage(icon);
    this.requestMainRender();
  }

  createMonsterSprite(icon: string): void {
    this.setDefaultMonsterIcon(icon);
  }

  updateTaikoMode(enabled: boolean): void {
    if (this.taikoMode !== enabled) {
      this.taikoMode = enabled;
      this.requestTaikoRender();
      if (enabled) {
        this.requestMainRender();
      }
    }
  }

  updateTaikoNotes(notes: TaikoDisplayNote[]): void {
    // 呼び出し元(FantasyGameScreen)で差分フィルタ済みのため、常に更新する
    this.taikoNotes = notes;
    this.taikoNotesDirty = true;
    this.requestTaikoRender();
  }

  setTaikoFrameCallback(cb: (() => void) | null): void {
    if (this.taikoFrameCallback === cb) {
      return;
    }
    this.taikoFrameCallback = cb;
    this.requestTaikoRender();
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
    this.requestMainRender();
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
      visual.flashUntil = performance.now() + 450;
      visual.hitNoteOffsets = Array.from({ length: 2 }, () => {
        const a = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
        const d = 0.3 + Math.random() * 0.25;
        return { x: Math.cos(a) * d, y: Math.sin(a) * d };
      });
      
      const randAngle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
      const randDist = 30 + Math.random() * 40;
      this.damagePopups.push({
        id: `damage_${Date.now()}_${Math.random()}`,
        x: visual.x,
        y: visual.y,
        value: damageDealt,
        start: performance.now(),
        duration: this.isSheetMusicMode ? 100 : (this.lightweightMonsterEffects && this.taikoMode ? 900 : 1800),
        offsetX: Math.cos(randAngle) * randDist,
        offsetY: Math.sin(randAngle) * randDist,
      });
      
      
      if (defeated && !visual.defeated) {
        visual.defeated = true;
        visual.defeatedAt = performance.now();
        setTimeout(() => {
          this.onMonsterDefeated?.();
        }, 400);
      }
      this.requestMainRender();
    }
  }


  updateOverlayText(text: string | null): void {
    if (!text) {
      if (this.overlayText !== null) {
        this.overlayText = null;
        this.requestMainRender();
      }
      return;
    }

    if (this.overlayText?.value === text) {
      return;
    }
    this.overlayText = {
      value: text,
      until: performance.now() + 1800
    };
    this.requestMainRender();
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
    this.textCache.clear();
  }

  private configureCanvasSize(width: number, height: number): void {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.max(1, Math.floor(width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(height * this.pixelRatio));
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

    this.taikoCanvas.style.width = `${width}px`;
    this.taikoCanvas.style.height = `${height}px`;
    this.taikoCanvas.width = Math.max(1, Math.floor(width * this.pixelRatio));
    this.taikoCanvas.height = Math.max(1, Math.floor(height * this.pixelRatio));
    this.taikoCtx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
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

    const now = performance.now();
    const hasActiveMainAnimations =
      this.effects.length > 0 ||
      this.damagePopups.length > 0 ||
      this.overlayText !== null ||
      this.hasMonsterAnimations(now);
    const needsTaikoFrame =
      this.taikoMode &&
      (this.taikoFrameCallback !== null || this.taikoNotesDirty || this.needsTaikoRender || this.taikoNotes.length > 0);

    if (hasActiveMainAnimations || this.needsMainRender) {
      this.drawMainFrame();
      this.needsMainRender = false;
    }

    if (needsTaikoFrame || this.needsTaikoRender) {
      this.drawTaikoFrame();
      this.needsTaikoRender = false;
      this.taikoNotesDirty = false;
    }
    
    this.startLoop();
  };

  private requestMainRender(): void {
    this.needsMainRender = true;
  }

  private requestTaikoRender(): void {
    this.needsTaikoRender = true;
  }

  private drawMainFrame(): void {
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

  private drawTaikoFrame(): void {
    const ctx = this.taikoCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.taikoCanvas.width, this.taikoCanvas.height);
    ctx.restore();
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

    if (!this.taikoMode) {
      return;
    }

    this.drawTaikoLane(ctx);
  }

  private hasMonsterAnimations(now: number): boolean {
    if (this.monsters.length === 0) {
      return false;
    }

    if (!this.taikoMode) {
      return true;
    }

    return this.monsters.some((monster) => {
      const isEnraged = this.enragedState[monster.id] || false;
      const targetScale = isEnraged ? 1.25 : 1;
      return (
        Math.abs(monster.targetX - monster.x) > 0.5 ||
        Math.abs(monster.enrageScale - targetScale) > 0.01 ||
        monster.flashUntil > now ||
        (monster.defeated && typeof monster.defeatedAt === 'number' && now - monster.defeatedAt < 450)
      );
    });
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
      
      // Y位置（軽量な浮遊アニメーション - sin波で5pxの上下動）
      // 各モンスターに異なるオフセットを与えて動きをずらす
      const floatOffset = this.taikoMode ? 0 : Math.sin(now * 0.002 + monster.x * 0.01) * 5;
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
      if (isEnraged && !(this.lightweightMonsterEffects && this.taikoMode)) {
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
      
      // 怒りアイコン（💢）を表示
      if (isEnraged) {
        ctx.font = `${Math.floor(monsterSize * 0.3)}px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const pulse = this.taikoMode ? 1 : 1 + Math.sin(now * 0.01) * 0.1;
        ctx.save();
        ctx.translate(monsterSize * 0.35, -monsterSize * 0.35);
        ctx.scale(pulse, pulse);
        ctx.fillText(ANGER_EMOJI, 0, 0);
        ctx.restore();
      }
      
      // ヒット時の音符エフェクト（🎵×2）
      if (monster.flashUntil > now) {
        ctx.font = `${Math.floor(monsterSize * 0.3)}px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const hitProgress = (monster.flashUntil - now) / 450; // 450msに延長
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

  private getTextCache(key: string, fontSize: number): HTMLCanvasElement {
    const cacheKey = `${key}_${fontSize}`;
    let cached = this.textCache.get(cacheKey);
    if (cached) return cached;

    // テキストキャッシュが大きくなりすぎないよう制限
    if (this.textCache.size > 200) {
      this.textCache.clear();
    }

    const tmpCtx = this.ctx;
    const font = `bold ${fontSize}px "Inter", sans-serif`;
    tmpCtx.font = font;
    const metrics = tmpCtx.measureText(key);
    const w = Math.ceil(metrics.width) + 6;
    const h = fontSize + 6;

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const tCtx = c.getContext('2d')!;
    tCtx.font = font;
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.lineWidth = 3;
    tCtx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    tCtx.strokeText(key, w / 2, h / 2);
    tCtx.fillStyle = '#ffffff';
    tCtx.fillText(key, w / 2, h / 2);

    this.textCache.set(cacheKey, c);
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

    for (let ni = 0; ni < this.taikoNotes.length; ni++) {
      const note = this.taikoNotes[ni];

      // プリレンダリング済みの影とノーツ円を drawImage で描画
      ctx.drawImage(shadowImg, note.x + 2 - halfSize, judgePos.y + 2 - halfSize);
      ctx.drawImage(circleImg, note.x - halfSize, judgePos.y - halfSize);

      const displayNotes = note.noteNames && note.noteNames.length > 0
        ? note.noteNames
        : (note.chord ? note.chord.split(/\s+/).filter(Boolean) : []);
      const noteCount = displayNotes.length;
      if (noteCount === 0) continue;

      const fontSize = noteCount > 3 ? 16 : noteCount > 2 ? 18 : 22;
      const lineHeight = fontSize + 4;
      const badgePadding = 8;
      const badgeHeight = noteCount * lineHeight + badgePadding * 2;
      const badgeY = judgePos.y - radius - badgeHeight - 8;

      for (let i = 0; i < noteCount; i++) {
        const textImg = this.getTextCache(displayNotes[i], fontSize);
        const textY = badgeY + badgeHeight - badgePadding - (i + 0.5) * lineHeight;
        ctx.drawImage(textImg, note.x - textImg.width / 2, textY - textImg.height / 2);
      }
    }
  }

  private drawDamagePopups(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    
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
      
      const fontSize = 28;
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 16;
      
      ctx.strokeStyle = DAMAGE_STROKE;
      ctx.lineWidth = 5;
      ctx.strokeText(popup.value.toString(), 0, 0);
      
      ctx.fillStyle = DAMAGE_COLOR;
      ctx.fillText(popup.value.toString(), 0, 0);
      
      ctx.shadowBlur = 0;
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
      this.requestMainRender();
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
  const taikoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FantasyPIXIInstance | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const taikoCanvas = taikoCanvasRef.current;
    if (!canvas || !taikoCanvas) return;
    const renderer = new FantasyPIXIInstance(
      canvas,
      taikoCanvas,
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
    <div className={cn('relative block w-full h-full', className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full"
      />
      <canvas
        ref={taikoCanvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default FantasyPIXIRenderer;
