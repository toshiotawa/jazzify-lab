/**
 * サバイバルモード Canvas描画
 * 2D Canvasを使用したゲーム画面の描画
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  SurvivalGameState,
  PlayerState,
  EnemyState,
  Projectile,
  DroppedItem,
  DamageText,
  Coin,
  Direction,
  ShockwaveEffect,
  MAP_CONFIG,
  type MapConfig,
  SHOCKWAVE_EXPAND_RATIO,
  SHOCKWAVE_DURATION,
  COMBO_GAUGE_MAX,
} from './SurvivalTypes';
import {
  BossBattleState,
  BossType,
  BOSS_SPRITE_PATH,
  BOSS_DISPLAY_SIZE,
} from './boss/SurvivalBossTypes';
import { isIOSWebView } from '../../utils/iosbridge';
import {
  getSurvivalDefaultSpriteForDirection,
  SURVIVAL_DEFAULT_SPRITE_PATHS,
  SURVIVAL_DEFAULT_SPRITE_VARIANTS,
  type SurvivalDefaultSpriteVariant,
} from '@/utils/survivalPlayerSprites';
import { drawSurvivalSpeechBubble } from '@/components/survival/stageIntro/drawSurvivalSpeechBubble';
import {
  SURVIVAL_FAI_BUBBLE_MAX_WIDTH_PX,
  SURVIVAL_JAJII_BUBBLE_MAX_WIDTH_PX,
} from '@/components/survival/stageIntro/survivalSpeechBubbleLayout';
import type { BalloonRushDrawSnapshot } from '@/components/balloonRush/balloonRushWorldDraw';

/**
 * iOS WebKit では shadowBlur が極端に重い（1 回で数 ms）。
 * ボス戦の 1 フレームには 20 回以上 shadowBlur が呼ばれることがあり、
 * これだけでフレーム落ちの原因になる。
 * iOS では一律 0 に固定する。
 */
const applyIOSCanvasOptimizations = (ctx: CanvasRenderingContext2D): void => {
  if (!isIOSWebView()) return;
  try {
    Object.defineProperty(ctx, 'shadowBlur', {
      configurable: true,
      get: () => 0,
      set: () => { /* noop: iOS では shadowBlur 無効化 */ },
    });
  } catch { /* ignore */ }
};

/**
 * iOS の Retina 画面は dpr が 2〜3 に達するため、フルスクリーン Canvas の
 * ピクセル数が 4〜9 倍に跳ね上がる。これがボス戦の描画負荷を支配するため
 * iOS WebView では 1.5 を上限としてダウンサンプリングする。
 */
const getEffectiveDpr = (): number => {
  const raw = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  if (isIOSWebView()) return Math.min(raw, 1.5);
  return raw;
};

// 方向から角度を取得するヘルパー
const getDirectionAngle = (direction: Direction): number => {
  const angles: Record<Direction, number> = {
    'right': 0,
    'down-right': Math.PI / 4,
    'down': Math.PI / 2,
    'down-left': Math.PI * 3 / 4,
    'left': Math.PI,
    'up-left': -Math.PI * 3 / 4,
    'up': -Math.PI / 2,
    'up-right': -Math.PI / 4,
  };
  return angles[direction];
};

// ===== 雷エフェクト型（ローカル） =====
interface LightningEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

interface SurvivalCanvasProps {
  gameState: SurvivalGameState;
  viewportWidth: number;
  viewportHeight: number;
  /** モバイル時などで描画を縮小（0.75 = 75%）すると同じ画面に多く表示される */
  contentScale?: number;
  shockwaves?: ShockwaveEffect[];
  lightningEffects?: LightningEffect[];
  /** ボス戦状態（ボス戦中のみ非 null） */
  bossBattle?: BossBattleState | null;
  /** ボス戦 UI の再描画トリガ */
  bossUiTick?: number;
  /** フレーズモードではプレイヤー上のコンボゲージを非表示 */
  hideComboGauge?: boolean;
  /** シナリオ台本 `hideHintBadge` 相当: プレイヤー頭上の 💡 を非表示 */
  hidePlayerHintStatusIcon?: boolean;
  /** ジャ爺のワールド座標（ステージ本番のみ親が更新） */
  jajiiWorldPosRef?: React.MutableRefObject<{ x: number; y: number } | null>;
  /** ジャ爺頭上の吹き出し（空で非表示） */
  jajiiBubbleText?: string;
  /** チュートリアル用ジャ爺台詞（`.current` 優先。親が毎フレーム参照） */
  tutorialJajiiSpeechTextRef?: React.MutableRefObject<string>;
  /** プレイヤー足下の吹き出し（空で非表示） */
  faiBubbleText?: string;
  /** チュートリアル用ファイ台詞（`.current` 優先。親が毎フレーム参照） */
  tutorialFaiSpeechTextRef?: React.MutableRefObject<string>;
  /** v3 チュートリアル: ファイ吹き出しを足下に配置 */
  speechBubblesBelowCharacter?: boolean;
  /** demo_play: ジャ爺吹き出しを頭上に配置（ファイ足下・譜面と被らない） */
  freezeTutorialDemoJajii?: boolean;
  /** 風船ラッシュ時: 敵の代わりに風船を描画 */
  balloonRushDraw?: BalloonRushDrawSnapshot | null;
  /** プレイフィールド寸法（未指定時は `MAP_CONFIG`） */
  mapConfig?: Pick<MapConfig, 'width' | 'height'>;
}

// ===== 色定義 =====
const COLORS = {
  player: '#4ade80',
  playerBorder: '#22c55e',
  enemy: {
    slime: '#22d3ee',
    goblin: '#84cc16',
    skeleton: '#e5e5e5',
    zombie: '#65a30d',
    bat: '#a855f7',
    ghost: '#c4b5fd',
    orc: '#dc2626',
    demon: '#991b1b',
    dragon: '#f97316',
    boss: '#fbbf24',
  },
  projectile: '#fef08a',
  item: {
    heart: '#ef4444',
    angel_shoes: '#3b82f6',
    vest: '#6b7280',
    a_atk_boost: '#f97316',
    b_atk_boost: '#8b5cf6',
    c_atk_boost: '#06b6d4',
  },
  hp: {
    high: '#22c55e',
    mid: '#eab308',
    low: '#ef4444',
  },
  statusEffect: {
    fire: '#f97316',
    ice: '#22d3ee',
    buffer: '#22c55e',
    debuffer: '#ef4444',
  },
};

// ===== アイコン定義 =====
const STATUS_ICONS: Record<string, string> = {
  fire: '🔥',
  ice: '❄️',
  buffer: '⬆️',
  debuffer: '⬇️',
  a_atk_up: '🔫',
  b_atk_up: '👊',
  c_atk_up: '🪄',
  hint: '💡',
  speed_up: '👟',
  def_up: '🦺',
  haisui: '🩸',      // 背水の陣
  zekkouchou: '😊',  // 絶好調
};

// ===== 敵タイプ別アイコン =====
const ENEMY_ICONS: Record<string, string> = {
  slime: '🫠',
  goblin: '👺',
  skeleton: '💀',
  zombie: '🧟',
  bat: '🦇',
  ghost: '👻',
  orc: '👹',
  demon: '😈',
  dragon: '🐲',
  boss: '👑',
};

// ===== プレイヤー表示サイズ =====
const PLAYER_SIZE = 48;  // プレイヤーの表示サイズ（当たり判定はGameEngine側で別管理）
/** ジャ爺スプライト表示サイズ（向き固定 `/stage_icons/5.png`） */
const JAJII_SPRITE_SIZE = 48;
const JAJII_SPRITE_PATH = '/stage_icons/5.png';
const LIGHTNING_SEGMENT_COUNT = 4;
const LIGHTNING_SCREEN_PADDING = 120;

// ===== 弾丸アイコン =====
const PROJECTILE_ICON = '✨';

const EMOJI_FONT_FALLBACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// ===== 魔法エフェクトアイコン =====
const MAGIC_ICONS: Record<string, string> = {
  thunder: '⚡',
  ice: '❄️',
  fire: '🔥',
  heal: '💚',
  buffer: '⬆️',
  debuffer: '⬇️',
  hint: '💡',
};

/** レンガ風ハーフボンドの暗い木板床（論理 px）。板 = キャラ高さの約 0.5 × 長さ約 2.5 体分 */
const WOOD_PLANK_W = 120;
const WOOD_PLANK_H = 24;
const WOOD_TILE_W = WOOD_PLANK_W * 2;
const WOOD_TILE_H = WOOD_PLANK_H * 2;

const woodSeededUnit = (seed: number): number => {
  let t = (seed >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildWoodTileCanvas = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = WOOD_TILE_W;
  c.height = WOOD_TILE_H;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.fillStyle = '#150e07';
  ctx.fillRect(0, 0, WOOD_TILE_W, WOOD_TILE_H);

  const drawPlank = (x: number, y: number, w: number, h: number, seed: number): void => {
    const r = woodSeededUnit(seed);
    const baseR = 0x1c + Math.floor((r - 0.5) * 14);
    const baseG = 0x13 + Math.floor((r - 0.5) * 10);
    const baseB = 0x0a + Math.floor((r - 0.5) * 8);
    ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
    ctx.fillRect(x, y, w, h);

    const grainCount = 2 + Math.floor(woodSeededUnit(seed + 31) * 2);
    for (let i = 0; i < grainCount; i += 1) {
      const gx = x + 6 + woodSeededUnit(seed + i * 7) * (w - 12);
      ctx.strokeStyle = `rgba(80,55,30,${0.1 + woodSeededUnit(seed + i * 11) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, y + 2);
      ctx.lineTo(gx + (woodSeededUnit(seed + i * 13) - 0.5) * 4, y + h - 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(5,3,0,0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  };

  drawPlank(0, 0, WOOD_PLANK_W, WOOD_PLANK_H, 1001);
  drawPlank(WOOD_PLANK_W, 0, WOOD_PLANK_W, WOOD_PLANK_H, 1002);
  drawPlank(-WOOD_PLANK_W / 2, WOOD_PLANK_H, WOOD_PLANK_W, WOOD_PLANK_H, 2001);
  drawPlank(WOOD_PLANK_W / 2, WOOD_PLANK_H, WOOD_PLANK_W, WOOD_PLANK_H, 2002);
  drawPlank(WOOD_PLANK_W * 1.5, WOOD_PLANK_H, WOOD_PLANK_W, WOOD_PLANK_H, 2003);

  return c;
};

const SurvivalCanvas: React.FC<SurvivalCanvasProps> = ({
  gameState,
  viewportWidth,
  viewportHeight,
  contentScale = 1,
  shockwaves = [],
  lightningEffects = [],
  bossBattle = null,
  bossUiTick = 0,
  hideComboGauge = false,
  hidePlayerHintStatusIcon = false,
  jajiiWorldPosRef,
  jajiiBubbleText = '',
  tutorialJajiiSpeechTextRef,
  faiBubbleText = '',
  tutorialFaiSpeechTextRef,
  speechBubblesBelowCharacter = false,
  freezeTutorialDemoJajii = false,
  balloonRushDraw = null,
  mapConfig,
}) => {
  const playfieldWidth = mapConfig?.width ?? MAP_CONFIG.width;
  const playfieldHeight = mapConfig?.height ?? MAP_CONFIG.height;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const woodPatternRef = useRef<CanvasPattern | null>(null);
  const [woodFloorAssetRevision, setWoodFloorAssetRevision] = useState(0);
  /** 毎フレームの `setGameState` で draw の参照が切り替わると React のコミット負荷が増えるため、RAF 内で最新を読む。 */
  const gameStateRef = useRef(gameState);
  const shockwavesRef = useRef(shockwaves);
  const lightningEffectsRef = useRef(lightningEffects);
  const bossBattleRef = useRef(bossBattle);
  const bossUiTickRef = useRef(bossUiTick);
  const jajiiBubbleTextRef = useRef(jajiiBubbleText);
  const faiBubbleTextRef = useRef(faiBubbleText);
  const balloonRushDrawRef = useRef(balloonRushDraw);
  gameStateRef.current = gameState;
  jajiiBubbleTextRef.current = jajiiBubbleText;
  faiBubbleTextRef.current = faiBubbleText;
  balloonRushDrawRef.current = balloonRushDraw;
  shockwavesRef.current = shockwaves;
  lightningEffectsRef.current = lightningEffects;
  bossBattleRef.current = bossBattle;
  bossUiTickRef.current = bossUiTick;
  /** デフォルト5方向スプライト（右向きベース、左向きは flipX） */
  const defaultPlayerSpritesRef = useRef<
    Partial<Record<SurvivalDefaultSpriteVariant, HTMLImageElement>>
  >({});
  const defaultPlayerSpritesLoadedRef = useRef(false);
  // スプライトを赤く染めるためのオフスクリーンキャンバス（透明部分は染めない）
  const playerTintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // 通常モード用: HP減少を検知して被弾フラッシュを発動するためのトラッカー
  const prevPlayerHpRef = useRef<number | null>(null);
  const prevPlayerMaxHpRef = useRef<number | null>(null);
  const damageFlashUntilRef = useRef<number>(0);
  const bossImagesRef = useRef<Record<BossType, HTMLImageElement | null>>({ A: null, B: null, C: null });
  const bossImagesLoadedRef = useRef<Record<BossType, boolean>>({ A: false, B: false, C: false });
  const jajiiSpriteRef = useRef<HTMLImageElement | null>(null);
  const jajiiSpriteLoadedRef = useRef(false);

  // 描画スケール時の論理ビューポート（大きいほど広い範囲を表示）
  const logicalWidth = viewportWidth / contentScale;
  const logicalHeight = viewportHeight / contentScale;
  
  // デフォルトキャラ: 5枚プリロード（iOS 版と同様8方向は flipX で表現）
  useEffect(() => {
    let cancelled = false;
    defaultPlayerSpritesLoadedRef.current = false;
    defaultPlayerSpritesRef.current = {};

    const loaders = SURVIVAL_DEFAULT_SPRITE_VARIANTS.map(
      (variant) =>
        new Promise<{ variant: SurvivalDefaultSpriteVariant; img: HTMLImageElement }>(
          (resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ variant, img });
            img.onerror = () => reject(new Error(`failed: ${variant}`));
            img.src = SURVIVAL_DEFAULT_SPRITE_PATHS[variant];
          }
        )
    );

    Promise.all(loaders)
      .then((results) => {
        if (cancelled) return;
        const next: Partial<Record<SurvivalDefaultSpriteVariant, HTMLImageElement>> = {};
        results.forEach(({ variant, img }) => {
          next[variant] = img;
        });
        defaultPlayerSpritesRef.current = next;
        defaultPlayerSpritesLoadedRef.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        defaultPlayerSpritesLoadedRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      jajiiSpriteRef.current = img;
      jajiiSpriteLoadedRef.current = true;
    };
    img.onerror = () => {
      jajiiSpriteLoadedRef.current = false;
    };
    img.src = JAJII_SPRITE_PATH;
    return () => {
      jajiiSpriteRef.current = null;
      jajiiSpriteLoadedRef.current = false;
    };
  }, []);

  // ボススプライトをプリロード
  useEffect(() => {
    (['A', 'B', 'C'] as BossType[]).forEach(type => {
      const img = new Image();
      img.onload = () => {
        bossImagesRef.current[type] = img;
        bossImagesLoadedRef.current[type] = true;
      };
      img.onerror = () => {
        bossImagesLoadedRef.current[type] = false;
      };
      img.src = BOSS_SPRITE_PATH[type];
    });
  }, []);

  // 木床: 手続き生成タイルを 1 度だけ CanvasPattern 化（PNG 不要・シームレス）
  useEffect(() => {
    const tile = buildWoodTileCanvas();
    const tctx = tile.getContext('2d');
    woodPatternRef.current = tctx ? tctx.createPattern(tile, 'repeat') : null;
    setWoodFloorAssetRevision((n) => n + 1);
  }, []);

  // カメラ位置（プレイヤー中心・論理ビューポート使用）
  const getCameraOffset = useCallback((player: PlayerState) => {
    const targetX = player.x - logicalWidth / 2;
    const targetY = player.y - logicalHeight / 2;
    
    // マップ端での制限
    const maxX = playfieldWidth - logicalWidth;
    const maxY = playfieldHeight - logicalHeight;
    
    return {
      x: Math.max(0, Math.min(maxX, targetX)),
      y: Math.max(0, Math.min(maxY, targetY)),
    };
  }, [logicalWidth, logicalHeight, playfieldWidth, playfieldHeight]);

  // 描画関数（contentScale時は論理ビューポートで描画し、ctx.scaleで縮小）
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    if (contentScale !== 1) {
      ctx.save();
      ctx.scale(contentScale, contentScale);
    }
    const snapshot = gameStateRef.current;
    const { player, enemies, projectiles, items, damageTexts } = snapshot;
    const shockwavesSnap = shockwavesRef.current;
    const lightningSnap = lightningEffectsRef.current;
    const bossBattleSnap = bossBattleRef.current;
    const camera = getCameraOffset(player);

    // フォールバック塗り（テクスチャ未ロード時）
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    const pattern = woodFloorAssetRevision >= 0 ? woodPatternRef.current : null;
    if (pattern) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = pattern;
      const x0 = Math.max(0, camera.x);
      const y0 = Math.max(0, camera.y);
      const x1 = Math.min(playfieldWidth, camera.x + logicalWidth);
      const y1 = Math.min(playfieldHeight, camera.y + logicalHeight);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
    }

    // マップ境界描画
    ctx.strokeStyle = '#4a4a6e';
    ctx.lineWidth = 4;
    ctx.strokeRect(-camera.x, -camera.y, playfieldWidth, playfieldHeight);

    // アイテム描画
    items.forEach(item => {
      const screenX = item.x - camera.x;
      const screenY = item.y - camera.y;
      
      if (screenX < -50 || screenX > logicalWidth + 50 ||
          screenY < -50 || screenY > logicalHeight + 50) return;
      
      // ハートは絵文字のみ（赤丸背景なし）。それ以外は従来通り背景円を描画
      if (item.type !== 'heart') {
        ctx.fillStyle = COLORS.item[item.type] || '#fff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // アイコン
      const iconSize = item.type === 'heart' ? 24 : 16;
      ctx.font = `${iconSize}px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        item.type === 'heart' ? '❤️' :
        item.type === 'angel_shoes' ? '👟' :
        item.type === 'vest' ? '🦺' : '⚡',
        screenX, screenY
      );
    });

    // コイン描画（軽量なCanvas図形）
    const now = Date.now();
    snapshot.coins.forEach(coin => {
      const screenX = coin.x - camera.x;
      const screenY = coin.y - camera.y;
      
      if (screenX < -30 || screenX > logicalWidth + 30 ||
          screenY < -30 || screenY > logicalHeight + 30) return;
      
      // 残り時間で点滅（消える前の警告）
      const elapsed = now - coin.startTime;
      const remaining = coin.lifetime - elapsed;
      const shouldBlink = remaining < 3000;  // 3秒以下で点滅
      const isVisible = !shouldBlink || Math.floor(elapsed / 150) % 2 === 0;
      
      if (!isVisible) return;
      
      // コインの光エフェクト
      const pulseScale = 1 + Math.sin(elapsed / 200) * 0.1;
      const coinRadius = 6 * pulseScale;
      
      ctx.save();
      
      // 外側の光（グロー効果）
      ctx.beginPath();
      ctx.arc(screenX, screenY, coinRadius + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fill();
      
      // コイン本体（金色の円）
      ctx.beginPath();
      ctx.arc(screenX, screenY, coinRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // 内側のハイライト
      ctx.beginPath();
      ctx.arc(screenX - 2, screenY - 2, coinRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
      ctx.fill();
      
      ctx.restore();
    });

    const balloonSnap = balloonRushDrawRef.current;
    if (balloonSnap) {
      for (const b of balloonSnap.balloons) {
        if (!b.visible) continue;
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        if (screenX < -50 || screenX > logicalWidth + 50
          || screenY < -50 || screenY > logicalHeight + 50) continue;
        ctx.font = `52px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎈', screenX, screenY);
      }
    }

    // 敵描画
    if (!balloonSnap) {
    enemies.forEach(enemy => {
      const screenX = enemy.x - camera.x;
      const screenY = enemy.y - camera.y;
      
      // 画面外スキップ
      if (screenX < -50 || screenX > logicalWidth + 50 ||
          screenY < -50 || screenY > logicalHeight + 50) return;
      
      const size = enemy.isBoss ? 40 : 28;
      const fontSize = enemy.isBoss ? 36 : 24;
      
      // ステータス異常エフェクト（アイコンを周りに表示）
      if (enemy.statusEffects.some(e => e.type === 'ice')) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size + 8, 0, Math.PI * 2);
        ctx.fill();
        // 氷アイコンをオーバーレイ
        ctx.font = `14px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', screenX + size / 2 + 8, screenY - size / 2);
      }
      if (enemy.statusEffects.some(e => e.type === 'fire')) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size + 8, 0, Math.PI * 2);
        ctx.fill();
        // 炎アイコンをオーバーレイ
        ctx.font = `14px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', screenX - size / 2 - 8, screenY - size / 2);
      }
      
      // 敵本体（アイコンで描画）
      const enemyIcon = ENEMY_ICONS[enemy.type] || '👾';
      ctx.font = `${fontSize}px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemyIcon, screenX, screenY);
      
      // ボスの場合は王冠を表示
      if (enemy.isBoss) {
        ctx.font = `16px ${EMOJI_FONT_FALLBACK}`;
        ctx.fillText('👑', screenX, screenY - size / 2 - 12);
      }
      
      // HPバー
      const hpPercent = enemy.stats.hp / enemy.stats.maxHp;
      const barWidth = size;
      const barHeight = 4;
      const barY = screenY - size / 2 - 8;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(screenX - barWidth / 2, barY, barWidth, barHeight);
      
      ctx.fillStyle = hpPercent > 0.5 ? COLORS.hp.high : hpPercent > 0.25 ? COLORS.hp.mid : COLORS.hp.low;
      ctx.fillRect(screenX - barWidth / 2, barY, barWidth * hpPercent, barHeight);
      
      // ステータスアイコン
      const activeEffects = enemy.statusEffects.filter(e => e.duration > 0);
      if (activeEffects.length > 0) {
        ctx.font = `12px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        activeEffects.forEach((effect, i) => {
          const icon = STATUS_ICONS[effect.type] || '?';
          ctx.fillText(icon, screenX - 10 + i * 14, screenY - size / 2 - 16);
        });
      }
    });
    }

    // 弾丸描画（軽量なCanvas図形）
    if (!balloonSnap) {
    projectiles.forEach(proj => {
      const screenX = proj.x - camera.x;
      const screenY = proj.y - camera.y;
      
      if (screenX < -25 || screenX > logicalWidth + 25 ||
          screenY < -25 || screenY > logicalHeight + 25) return;
      
      ctx.save();
      
      // 外側の光（グロー効果）
      ctx.beginPath();
      ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.fill();
      
      // 弾丸本体（黄色い星型）
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = 7;
      const innerRadius = 3;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = screenX + Math.cos(angle) * radius;
        const y = screenY + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    });
    
    // 敵の弾丸描画（小さめ）
    snapshot.enemyProjectiles.forEach(proj => {
      const screenX = proj.x - camera.x;
      const screenY = proj.y - camera.y;
      
      if (screenX < -20 || screenX > logicalWidth + 20 ||
          screenY < -20 || screenY > logicalHeight + 20) return;
      
      ctx.font = `10px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 4;
      ctx.fillText('🔴', screenX, screenY);
      ctx.shadowBlur = 0;
    });
    }

    // プレイヤー描画
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;
    
    // プレイヤーの炎オーラ（FIRE魔法発動中）
    if (player.statusEffects.some(e => e.type === 'fire')) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, 50, 0, Math.PI * 2);
      ctx.fill();
      // 炎エフェクトのアイコン
      ctx.font = `20px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Date.now() / 500;
        const fx = playerScreenX + Math.cos(angle) * 35;
        const fy = playerScreenY + Math.sin(angle) * 35;
        ctx.fillText('🔥', fx, fy);
      }
    }
    
    // HP 減少を検知して被弾フラッシュを発動（通常モード用、無敵は付与しない）
    const currentHp = player.stats.hp;
    const currentMaxHp = player.stats.maxHp;
    if (
      prevPlayerHpRef.current === null ||
      prevPlayerMaxHpRef.current !== currentMaxHp
    ) {
      // 初期化 / ステージ遷移 (maxHp 変化) 時はフラッシュを発動しない
      prevPlayerHpRef.current = currentHp;
      prevPlayerMaxHpRef.current = currentMaxHp;
    } else if (currentHp < prevPlayerHpRef.current) {
      damageFlashUntilRef.current = performance.now() + 300;
      prevPlayerHpRef.current = currentHp;
    } else {
      prevPlayerHpRef.current = currentHp;
    }

    // プレイヤー本体（デフォルト5枚スプライトで8方向、iOS と同マッピング）
    const nowForFlash = performance.now();
    const inBossIFrames = !!(bossBattleSnap && bossBattleSnap.active
      && nowForFlash < bossBattleSnap.player.iFramesUntil);
    const inNormalDamageFlash = nowForFlash < damageFlashUntilRef.current;
    const playerDamageFlash = inBossIFrames || inNormalDamageFlash;

    const sel = getSurvivalDefaultSpriteForDirection(player.direction);
    const frameImg = defaultPlayerSpritesRef.current[sel.variant] ?? null;
    const avatarReady = defaultPlayerSpritesLoadedRef.current && frameImg !== null;
    const flipPlayerX = sel.flipX;

    if (avatarReady && frameImg) {
      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);

      if (flipPlayerX) {
        ctx.scale(-1, 1);
      }

      if (playerDamageFlash) {
        // オフスクリーンにスプライトを描画し、source-atop で本体ピクセルのみ赤く染める
        if (!playerTintCanvasRef.current) {
          const c = document.createElement('canvas');
          c.width = PLAYER_SIZE;
          c.height = PLAYER_SIZE;
          playerTintCanvasRef.current = c;
        }
        const tc = playerTintCanvasRef.current;
        const tctx = tc.getContext('2d');
        if (tctx) {
          tctx.clearRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
          tctx.drawImage(frameImg, 0, 0, PLAYER_SIZE, PLAYER_SIZE);
          const blink = Math.floor(performance.now() / 80) % 2 === 0;
          tctx.globalCompositeOperation = 'source-atop';
          tctx.fillStyle = `rgba(255, 40, 40, ${blink ? 0.85 : 0.5})`;
          tctx.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
          tctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(tc, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
        } else {
          ctx.drawImage(frameImg, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        }
      } else {
        ctx.drawImage(frameImg, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      }
      ctx.restore();
    } else {
      // フォールバック: 絵文字で描画（文字色を直接赤く）
      ctx.save();
      ctx.font = `32px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (playerDamageFlash) {
        const blink = Math.floor(performance.now() / 80) % 2 === 0;
        ctx.fillStyle = `rgba(255, ${blink ? 40 : 90}, ${blink ? 40 : 90}, 1)`;
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillText('🧙', playerScreenX, playerScreenY);
      ctx.restore();
    }

    const jajiiWorld = jajiiWorldPosRef?.current ?? null;
    const jajiiImgEl = jajiiSpriteRef.current;
    if (jajiiWorld && jajiiImgEl && jajiiSpriteLoadedRef.current) {
      const jjx = jajiiWorld.x - camera.x;
      const jjy = jajiiWorld.y - camera.y;
      ctx.drawImage(
        jajiiImgEl,
        jjx - JAJII_SPRITE_SIZE / 2,
        jjy - JAJII_SPRITE_SIZE / 2,
        JAJII_SPRITE_SIZE,
        JAJII_SPRITE_SIZE,
      );
    }
    
    // 方向インジケーター（矢印アイコン）- 向きに応じて回転
    const dirVec = getDirectionVector(player.direction);
    const arrowX = playerScreenX + dirVec.x * 25;
    const arrowY = playerScreenY + dirVec.y * 25;
    
    // 方向から回転角度を計算（ラジアン）
    const directionAngles: Record<Direction, number> = {
      'right': 0,
      'down-right': Math.PI / 4,
      'down': Math.PI / 2,
      'down-left': Math.PI * 3 / 4,
      'left': Math.PI,
      'up-left': -Math.PI * 3 / 4,
      'up': -Math.PI / 2,
      'up-right': -Math.PI / 4,
    };
    const angle = directionAngles[player.direction];
    
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.font = `14px ${EMOJI_FONT_FALLBACK}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('➤', 0, 0);
    ctx.restore();
    
    // プレイヤーHPバー
    const playerHpPercent = player.stats.hp / player.stats.maxHp;
    const playerBarWidth = 40;
    const playerBarHeight = 5;
    const playerBarY = playerScreenY - 28;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(playerScreenX - playerBarWidth / 2, playerBarY, playerBarWidth, playerBarHeight);
    
    ctx.fillStyle = playerHpPercent > 0.5 ? COLORS.hp.high : playerHpPercent > 0.25 ? COLORS.hp.mid : COLORS.hp.low;
    ctx.fillRect(playerScreenX - playerBarWidth / 2, playerBarY, playerBarWidth * playerHpPercent, playerBarHeight);

    // A/B コンボゲージ（iOS Survival のプレイヤー頭上バーに準拠）
    const cg = snapshot.comboGauge;
    const cr = snapshot.comboReady;
    if (!hideComboGauge && (cg > 0 || cr)) {
      const barW = 6;
      const barH = 3;
      const gap = 2;
      const maxG = COMBO_GAUGE_MAX;
      const totalW = maxG * barW + (maxG - 1) * gap;
      const gaugeY = playerScreenY - PLAYER_SIZE * 0.85 - 10;
      ctx.save();
      if (cr && cg >= maxG) {
        const pulseMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        ctx.globalAlpha = 0.65 + 0.35 * Math.sin((pulseMs / 1000) * 12);
      }
      for (let gi = 0; gi < maxG; gi += 1) {
        const bx = playerScreenX - totalW / 2 + gi * (barW + gap);
        const filled = gi < cg;
        ctx.fillStyle = filled ? '#ffd826' : 'rgba(76,76,76,0.75)';
        ctx.fillRect(bx, gaugeY, barW, barH);
      }
      ctx.restore();
    }
    
    // プレイヤーステータスアイコン（チュートリアル台本 hideHintBadge 時は 💡 を出さない）
    const playerEffects = player.statusEffects.filter((e) => {
      if (e.duration <= 0) return false;
      if (hidePlayerHintStatusIcon && e.type === 'hint') return false;
      return true;
    });
    if (playerEffects.length > 0) {
      ctx.font = `14px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      playerEffects.forEach((effect, i) => {
        const icon = STATUS_ICONS[effect.type] || '?';
        ctx.fillText(icon, playerScreenX - 20 + i * 16, playerScreenY - 40);
      });
    }

    // ===== ボス戦レイヤ =====
    if (bossBattleSnap && bossBattleSnap.active) {
      const nowMs = performance.now();
      // ハザード（予兆→発動）
      bossBattleSnap.hazards.forEach(h => {
        if (nowMs < h.startAt || nowMs > h.endAt) return;

        const sx = h.x - camera.x;
        const sy = h.y - camera.y;
        ctx.save();
        switch (h.kind) {
          case 'fanTelegraph': {
            const angle = h.angle ?? 0;
            const spread = h.spread ?? Math.PI / 2;
            const radius = h.radius ?? 120;
            // 予兆: 淡い赤 + 点線ボーダー + 内部の細いガイドライン
            const telegraphAlpha = 0.18 + Math.sin(nowMs / 120) * 0.06;
            ctx.fillStyle = `rgba(255, 90, 90, ${telegraphAlpha})`;
            ctx.strokeStyle = 'rgba(255, 120, 120, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.arc(sx, sy, radius, angle - spread / 2, angle + spread / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            break;
          }
          case 'fanActive': {
            const angle = h.angle ?? 0;
            const spread = h.spread ?? Math.PI / 2;
            const radius = h.radius ?? 120;
            const elapsed = nowMs - h.startAt;
            const duration = Math.max(1, h.endAt - h.startAt);
            const progress = Math.min(1, elapsed / duration);
            // 本攻撃: 放射グラデーション + スラッシュ軌跡 + 白いエッジ
            const grad = ctx.createRadialGradient(sx, sy, 10, sx, sy, radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.25, 'rgba(255, 200, 80, 0.85)');
            grad.addColorStop(0.7, 'rgba(255, 40, 20, 0.75)');
            grad.addColorStop(1, 'rgba(180, 0, 0, 0.35)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.arc(sx, sy, radius, angle - spread / 2, angle + spread / 2);
            ctx.closePath();
            ctx.fill();
            // 外縁をゴールドで縁取り
            ctx.strokeStyle = 'rgba(255, 240, 120, 1)';
            ctx.lineWidth = 5;
            ctx.shadowColor = 'rgba(255, 200, 60, 1)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(sx, sy, radius, angle - spread / 2, angle + spread / 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            // スラッシュ軌跡（扇内を横切る白い弧）
            const slashAngle = angle - spread / 2 + spread * progress;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(slashAngle) * radius, sy + Math.sin(slashAngle) * radius);
            ctx.stroke();
            // 先端スパーク
            for (let i = 0; i < 6; i += 1) {
              const t = i / 6;
              const a = angle - spread / 2 + spread * t;
              const r = radius * (0.85 + Math.sin(nowMs / 40 + i) * 0.08);
              ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
              ctx.beginPath();
              ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 5, 0, Math.PI * 2);
              ctx.fill();
            }
            // 中心の衝撃閃光
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 18 + progress * 14, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'chargeTelegraph': {
            const angle = h.angle ?? 0;
            const length = h.length ?? 400;
            const thickness = h.thickness ?? 40;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            const pulse = 0.5 + Math.sin(nowMs / 90) * 0.5;
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            // 予兆帯（淡赤のグラデ＋破線）
            const telegraphGrad = ctx.createLinearGradient(0, 0, length, 0);
            telegraphGrad.addColorStop(0, `rgba(255, 80, 80, ${0.25 + 0.12 * pulse})`);
            telegraphGrad.addColorStop(1, 'rgba(255, 80, 80, 0.05)');
            ctx.fillStyle = telegraphGrad;
            ctx.fillRect(0, -thickness, length, thickness * 2);
            ctx.setLineDash([10, 7]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 140, 140, ${0.85})`;
            ctx.strokeRect(0, -thickness, length, thickness * 2);
            ctx.setLineDash([]);
            // 中央の走る閃光（予兆が進むほど速く/遠くへ）
            const flashX = length * pg;
            const flashGrad = ctx.createRadialGradient(flashX, 0, 0, flashX, 0, thickness * 1.2);
            flashGrad.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
            flashGrad.addColorStop(1, 'rgba(255, 120, 80, 0)');
            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(flashX, 0, thickness * 1.2, 0, Math.PI * 2);
            ctx.fill();
            // 先端の矢印マーカー
            ctx.fillStyle = `rgba(255, 220, 80, ${0.75 + 0.25 * pulse})`;
            ctx.beginPath();
            ctx.moveTo(length, 0);
            ctx.lineTo(length - 18, -thickness * 0.9);
            ctx.lineTo(length - 18, thickness * 0.9);
            ctx.closePath();
            ctx.fill();
            // 起点の警告スパーク
            for (let i = 0; i < 3; i++) {
              const t = (nowMs / 90 + i * 0.3) % 1;
              ctx.fillStyle = `rgba(255, 220, 120, ${(1 - t) * 0.8})`;
              ctx.beginPath();
              ctx.arc(20 + t * 30, 0, 3 + t * 4, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
          case 'chargeActive': {
            const angle = h.angle ?? 0;
            const length = h.length ?? 400;
            const thickness = h.thickness ?? 40;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            // 疾走帯（中央が明るい速度線の集合）
            const bodyGrad = ctx.createLinearGradient(0, -thickness, 0, thickness);
            bodyGrad.addColorStop(0, 'rgba(255, 100, 60, 0.1)');
            bodyGrad.addColorStop(0.5, `rgba(255, 230, 120, ${0.85 * (1 - pg * 0.2)})`);
            bodyGrad.addColorStop(1, 'rgba(255, 100, 60, 0.1)');
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(0, -thickness, length, thickness * 2);
            // 白い中芯
            ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1 - pg * 0.3)})`;
            ctx.fillRect(0, -thickness * 0.25, length, thickness * 0.5);
            // 外縁をゴールド縁取り＋発光
            ctx.shadowColor = 'rgba(255, 200, 80, 1)';
            ctx.shadowBlur = 16;
            ctx.strokeStyle = 'rgba(255, 240, 160, 1)';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, -thickness, length, thickness * 2);
            ctx.shadowBlur = 0;
            // 疾走線（スピードライン）
            for (let i = 0; i < 7; i++) {
              const t = ((nowMs / 200 + i * 0.14) % 1);
              const lx = t * length;
              const ly = ((i % 2 === 0) ? -1 : 1) * thickness * (0.3 + (i % 3) * 0.25);
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.4 * (1 - t)})`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(lx - 40, ly);
              ctx.lineTo(lx + 20, ly);
              ctx.stroke();
            }
            // 先端の衝撃（爆発的な光）
            const tipX = length;
            const tipGrad = ctx.createRadialGradient(tipX, 0, 0, tipX, 0, thickness * 2);
            tipGrad.addColorStop(0, `rgba(255, 255, 220, ${0.9 * (1 - pg)})`);
            tipGrad.addColorStop(0.5, `rgba(255, 180, 80, ${0.7 * (1 - pg)})`);
            tipGrad.addColorStop(1, 'rgba(255, 80, 40, 0)');
            ctx.fillStyle = tipGrad;
            ctx.beginPath();
            ctx.arc(tipX, 0, thickness * 2, 0, Math.PI * 2);
            ctx.fill();
            // 先端の飛散スパーク
            for (let i = 0; i < 8; i++) {
              const sa = (i / 8) * Math.PI * 2;
              const sr = thickness * (1 + pg * 1.5) + Math.sin(nowMs / 60 + i) * 4;
              ctx.fillStyle = `rgba(255, 220, 100, ${0.85 * (1 - pg)})`;
              ctx.beginPath();
              ctx.arc(tipX + Math.cos(sa) * sr, Math.sin(sa) * sr, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            // 地面の衝撃痕（帯に沿った細かい土煙）
            for (let i = 0; i < 6; i++) {
              const px = (i / 6) * length + ((nowMs / 120) % (length / 6));
              const py = (Math.sin(nowMs / 50 + i) * thickness * 0.6);
              ctx.fillStyle = `rgba(180, 120, 70, ${0.35 * (1 - pg)})`;
              ctx.beginPath();
              ctx.arc(px, py, 4 + (i % 3) * 2, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
          case 'ringTelegraph': {
            const outer = h.radius ?? 200;
            const inner = h.innerRadius ?? 120;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            // 外縁: 魔方陣風の二重円 + 収縮するガイド
            const pulse = 0.5 + Math.sin(nowMs / 110) * 0.5;
            // 予兆の塗り（ドーナツ帯）
            ctx.fillStyle = `rgba(180, 120, 255, ${0.10 + 0.05 * pulse})`;
            ctx.beginPath();
            ctx.arc(sx, sy, outer, 0, Math.PI * 2);
            ctx.arc(sx, sy, inner, 0, Math.PI * 2, true);
            ctx.fill();
            // 二重リング（外）
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(200, 150, 255, ${0.85})`;
            ctx.shadowColor = 'rgba(180, 120, 255, 0.9)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(sx, sy, outer, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 8]);
            ctx.strokeStyle = `rgba(230, 200, 255, 0.75)`;
            ctx.beginPath();
            ctx.arc(sx, sy, outer - 6, nowMs / 600, nowMs / 600 + Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            // 内縁
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(200, 150, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(sx, sy, inner, 0, Math.PI * 2);
            ctx.stroke();
            // 収縮するカウントダウンリング（時間経過で inner に向かって縮む）
            const shrinkR = inner + (outer - inner) * (1 - pg);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.4 * pulse})`;
            ctx.beginPath();
            ctx.arc(sx, sy, shrinkR, 0, Math.PI * 2);
            ctx.stroke();
            // ルーン風の放射マーク（8方向）
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2 + nowMs / 900;
              const rOuter = outer - 2;
              const rInner = outer - 16;
              ctx.strokeStyle = 'rgba(220, 180, 255, 0.75)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(sx + Math.cos(a) * rInner, sy + Math.sin(a) * rInner);
              ctx.lineTo(sx + Math.cos(a) * rOuter, sy + Math.sin(a) * rOuter);
              ctx.stroke();
            }
            break;
          }
          case 'ringActive': {
            const outer = h.radius ?? 200;
            const inner = h.innerRadius ?? 120;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            // ドーナツ帯に灼熱のグラデーション
            const ringMid = (outer + inner) / 2;
            const grad = ctx.createRadialGradient(sx, sy, inner, sx, sy, outer);
            grad.addColorStop(0, 'rgba(255, 240, 120, 0.1)');
            grad.addColorStop(0.3, `rgba(255, 180, 60, ${0.7 * (1 - pg * 0.3)})`);
            grad.addColorStop(0.6, `rgba(255, 80, 60, ${0.85 * (1 - pg * 0.2)})`);
            grad.addColorStop(1, 'rgba(120, 0, 80, 0.2)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, outer, 0, Math.PI * 2);
            ctx.arc(sx, sy, inner, 0, Math.PI * 2, true);
            ctx.fill();
            // 外縁・内縁を閃光で縁取り
            ctx.shadowColor = 'rgba(255, 220, 80, 0.9)';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(sx, sy, outer, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(sx, sy, inner, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            // リング上の閃光スパーク
            const sparkCount = 14;
            for (let i = 0; i < sparkCount; i++) {
              const a = (i / sparkCount) * Math.PI * 2 + nowMs / 180;
              const r = ringMid + Math.sin(nowMs / 90 + i) * 14;
              ctx.fillStyle = `rgba(255, 255, 200, ${0.9 * (1 - pg)})`;
              ctx.beginPath();
              ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 4, 0, Math.PI * 2);
              ctx.fill();
            }
            // 外側へ飛び散る火花
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * Math.PI * 2 + nowMs / 220;
              const r = outer + pg * 18 + Math.sin(nowMs / 100 + i) * 4;
              ctx.strokeStyle = `rgba(255, 200, 80, ${0.7 * (1 - pg)})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(sx + Math.cos(a) * (outer + 2), sy + Math.sin(a) * (outer + 2));
              ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
              ctx.stroke();
            }
            break;
          }
          case 'crossTelegraph': {
            const length = h.length ?? 500;
            const thickness = h.thickness ?? 40;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            const pulse = 0.5 + Math.sin(nowMs / 110) * 0.5;
            // 縦横の予兆帯（ぼんやり + 点線ボーダー）
            ctx.fillStyle = `rgba(180, 80, 255, ${0.16 + 0.08 * pulse})`;
            ctx.fillRect(sx - length / 2, sy - thickness, length, thickness * 2);
            ctx.fillRect(sx - thickness, sy - length / 2, thickness * 2, length);
            ctx.setLineDash([10, 7]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(220, 180, 255, ${0.85})`;
            ctx.strokeRect(sx - length / 2, sy - thickness, length, thickness * 2);
            ctx.strokeRect(sx - thickness, sy - length / 2, thickness * 2, length);
            ctx.setLineDash([]);
            // 中央の詠唱サークル
            ctx.strokeStyle = 'rgba(220, 180, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 20 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(220, 180, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(sx, sy, 30 + pulse * 6, nowMs / 700, nowMs / 700 + Math.PI * 1.5);
            ctx.stroke();
            // 走る予兆エネルギー（軸に沿って左右/上下に往復する細いビーム）
            const beamOffset = ((pg * 2) % 1) * length;
            // 横軸
            ctx.fillStyle = 'rgba(230, 200, 255, 0.85)';
            ctx.fillRect(sx - length / 2 + beamOffset - 12, sy - 2, 24, 4);
            ctx.fillRect(sx + length / 2 - beamOffset - 12, sy - 2, 24, 4);
            // 縦軸
            ctx.fillRect(sx - 2, sy - length / 2 + beamOffset - 12, 4, 24);
            ctx.fillRect(sx - 2, sy + length / 2 - beamOffset - 12, 4, 24);
            break;
          }
          case 'crossActive': {
            const length = h.length ?? 500;
            const thickness = h.thickness ?? 40;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            // 横ビームのグラデーション
            const hGrad = ctx.createLinearGradient(sx - length / 2, sy, sx + length / 2, sy);
            hGrad.addColorStop(0, 'rgba(180, 60, 255, 0.05)');
            hGrad.addColorStop(0.5, `rgba(255, 220, 120, ${0.9 * (1 - pg * 0.3)})`);
            hGrad.addColorStop(1, 'rgba(180, 60, 255, 0.05)');
            ctx.fillStyle = hGrad;
            ctx.fillRect(sx - length / 2, sy - thickness, length, thickness * 2);
            // 縦ビームのグラデーション
            const vGrad = ctx.createLinearGradient(sx, sy - length / 2, sx, sy + length / 2);
            vGrad.addColorStop(0, 'rgba(180, 60, 255, 0.05)');
            vGrad.addColorStop(0.5, `rgba(255, 220, 120, ${0.9 * (1 - pg * 0.3)})`);
            vGrad.addColorStop(1, 'rgba(180, 60, 255, 0.05)');
            ctx.fillStyle = vGrad;
            ctx.fillRect(sx - thickness, sy - length / 2, thickness * 2, length);
            // 白い中芯
            ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1 - pg * 0.4)})`;
            ctx.fillRect(sx - length / 2, sy - thickness * 0.25, length, thickness * 0.5);
            ctx.fillRect(sx - thickness * 0.25, sy - length / 2, thickness * 0.5, length);
            // 外縁
            ctx.shadowColor = 'rgba(255, 200, 80, 0.95)';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = 'rgba(255, 240, 160, 1)';
            ctx.lineWidth = 4;
            ctx.strokeRect(sx - length / 2, sy - thickness, length, thickness * 2);
            ctx.strokeRect(sx - thickness, sy - length / 2, thickness * 2, length);
            ctx.shadowBlur = 0;
            // 中心の十字閃光
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - pg)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 24 + (1 - pg) * 12, 0, Math.PI * 2);
            ctx.fill();
            // 先端ビームトレイル
            for (let dir = -1; dir <= 1; dir += 2) {
              for (let i = 0; i < 4; i++) {
                const t = i / 4;
                const a = `rgba(255, 230, 160, ${0.6 * (1 - pg) * (1 - t)})`;
                // 横
                ctx.fillStyle = a;
                ctx.fillRect(sx + dir * (length / 2 - 60 - i * 28), sy - 3, 22, 6);
                // 縦
                ctx.fillRect(sx - 3, sy + dir * (length / 2 - 60 - i * 28), 6, 22);
              }
            }
            break;
          }
          case 'healTelegraph': {
            // C ボス自己回復スキルの予兆 (控えめ版)。
            // 5% 回復のため、ボス周囲に小さな緑のオーラ + ふわっと浮かぶ "+" だけ。
            // `h.radius` は healRange (560) と大きいので、実際の描画は最大 90px 程度に抑える。
            const drawRadius = Math.min(h.radius ?? 90, 90);
            const aura = ctx.createRadialGradient(sx, sy, 2, sx, sy, drawRadius);
            aura.addColorStop(0, 'rgba(160, 255, 180, 0.22)');
            aura.addColorStop(1, 'rgba(20, 120, 60, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(sx, sy, drawRadius, 0, Math.PI * 2);
            ctx.fill();
            // 小さな "+" (ボスの上にふわっと浮かぶ)
            const armLen = 10;
            const armThick = 3;
            const alpha = 0.55 + 0.2 * Math.sin(nowMs / 260);
            const cx = sx;
            const cy = sy - 8;
            ctx.fillStyle = `rgba(200, 255, 210, ${alpha})`;
            ctx.fillRect(cx - armLen, cy - armThick / 2, armLen * 2, armThick);
            ctx.fillRect(cx - armThick / 2, cy - armLen, armThick, armLen * 2);
            break;
          }
          case 'healActive': {
            // C ボス自己回復スキルの発動中 (控えめ版)。
            // 小さな緑のフラッシュと、ボス頭上に浮かぶ控えめな "+" のみ。
            const drawRadius = Math.min(h.radius ?? 90, 90);
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, drawRadius);
            grad.addColorStop(0, `rgba(210, 255, 220, ${0.45 * (1 - pg)})`);
            grad.addColorStop(1, 'rgba(20, 120, 60, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, drawRadius, 0, Math.PI * 2);
            ctx.fill();
            // 控えめな "+" マーク (発動の瞬間だけ少し拡大)
            const scale = 1 + (1 - pg) * 0.4;
            const armLen = 12 * scale;
            const armThick = 3.5 * scale;
            const cx = sx;
            const cy = sy - 8;
            ctx.fillStyle = `rgba(220, 255, 230, ${0.8 * (1 - pg * 0.5)})`;
            ctx.fillRect(cx - armLen, cy - armThick / 2, armLen * 2, armThick);
            ctx.fillRect(cx - armThick / 2, cy - armLen, armThick, armLen * 2);
            break;
          }
          case 'bloodPool': {
            const radius = h.radius ?? 60;
            const life = Math.max(1, h.endAt - h.startAt);
            const ageT = Math.min(1, Math.max(0, (nowMs - h.startAt) / life));
            const fadeAlpha = ageT > 0.85 ? Math.max(0, 1 - (ageT - 0.85) / 0.15) : 1;
            // 暗い外周ハロー
            const halo = ctx.createRadialGradient(sx, sy, radius * 0.2, sx, sy, radius * 1.3);
            halo.addColorStop(0, `rgba(100, 10, 20, 0)`);
            halo.addColorStop(0.6, `rgba(90, 10, 15, ${0.2 * fadeAlpha})`);
            halo.addColorStop(1, 'rgba(80, 10, 10, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, radius * 1.3, 0, Math.PI * 2);
            ctx.fill();
            // 不規則な血溜まりの縁
            const wobbleT = nowMs * 0.0012 + (h.startAt | 0) * 0.0017;
            const segs = 28;
            ctx.beginPath();
            for (let i = 0; i <= segs; i++) {
              const a = (i / segs) * Math.PI * 2;
              const noise =
                Math.sin(a * 3 + wobbleT * 1.2) * 0.07 +
                Math.sin(a * 5 - wobbleT * 1.6) * 0.04 +
                Math.cos(a * 2 + wobbleT * 0.8) * 0.05;
              const r = radius * (1 + noise);
              const px = sx + Math.cos(a) * r;
              const py = sy + Math.sin(a) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            // 本体: 鮮やかな赤→深紅のグラデ
            const body = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
            body.addColorStop(0, `rgba(220, 50, 50, ${0.75 * fadeAlpha})`);
            body.addColorStop(0.55, `rgba(170, 20, 30, ${0.72 * fadeAlpha})`);
            body.addColorStop(1, `rgba(90, 0, 10, ${0.85 * fadeAlpha})`);
            ctx.fillStyle = body;
            ctx.fill();
            // 光沢ハイライト（濡れた質感）
            ctx.fillStyle = `rgba(255, 130, 130, ${0.25 * fadeAlpha})`;
            ctx.beginPath();
            ctx.ellipse(sx - radius * 0.25, sy - radius * 0.3, radius * 0.45, radius * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            // 縁: 暗赤で二重に
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(60, 0, 10, ${0.85 * fadeAlpha})`;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(220, 40, 40, ${0.6 * fadeAlpha})`;
            ctx.stroke();
            // 飛び散った血滴
            const idHash =
              (h.id.charCodeAt(0) | 0) +
              (h.id.charCodeAt(1) | 0) * 7 +
              (h.id.charCodeAt(2) | 0) * 13;
            for (let i = 0; i < 7; i++) {
              const seed = idHash * 0.097 + i * 1.73;
              const sa = (seed * 5.7) % (Math.PI * 2);
              const sr = radius * (0.95 + (i % 3) * 0.1);
              const ssx = sx + Math.cos(sa) * sr;
              const ssy = sy + Math.sin(sa) * sr;
              const size = 2 + (i % 3) * 1.5;
              ctx.fillStyle = `rgba(150, 10, 20, ${0.75 * fadeAlpha})`;
              ctx.beginPath();
              ctx.arc(ssx, ssy, size, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
          case 'acidPool': {
            const radius = h.radius ?? 60;
            const life = Math.max(1, h.endAt - h.startAt);
            const elapsed = nowMs - h.startAt;
            const ageT = Math.min(1, Math.max(0, elapsed / life));
            // 消滅直前フェード
            const fadeAlpha = ageT > 0.85 ? Math.max(0, 1 - (ageT - 0.85) / 0.15) : 1;
            // 濃い緑のハロー（外周の毒気）
            const haloGrad = ctx.createRadialGradient(sx, sy, radius * 0.2, sx, sy, radius * 1.35);
            haloGrad.addColorStop(0, `rgba(60, 140, 30, ${0.0 * fadeAlpha})`);
            haloGrad.addColorStop(0.6, `rgba(80, 180, 40, ${0.18 * fadeAlpha})`);
            haloGrad.addColorStop(1, `rgba(80, 180, 40, 0)`);
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, radius * 1.35, 0, Math.PI * 2);
            ctx.fill();
            // 毒沼の本体（不規則な縁）
            const wobbleSeed = (h.startAt | 0) * 0.0017;
            const wobbleT = nowMs * 0.0015 + wobbleSeed;
            const edgeSegments = 28;
            const baseR = radius;
            ctx.beginPath();
            for (let i = 0; i <= edgeSegments; i++) {
              const a = (i / edgeSegments) * Math.PI * 2;
              const noise =
                Math.sin(a * 3 + wobbleT * 1.8) * 0.06 +
                Math.sin(a * 5 - wobbleT * 2.3) * 0.035 +
                Math.cos(a * 2 + wobbleT) * 0.04;
              const r = baseR * (1 + noise);
              const px = sx + Math.cos(a) * r;
              const py = sy + Math.sin(a) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            const bodyGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, baseR);
            bodyGrad.addColorStop(0, `rgba(150, 230, 80, ${0.62 * fadeAlpha})`);
            bodyGrad.addColorStop(0.55, `rgba(90, 190, 40, ${0.6 * fadeAlpha})`);
            bodyGrad.addColorStop(1, `rgba(40, 110, 20, ${0.78 * fadeAlpha})`);
            ctx.fillStyle = bodyGrad;
            ctx.fill();
            // 毒々しい縁
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = `rgba(180, 255, 90, ${0.85 * fadeAlpha})`;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(40, 80, 10, ${0.7 * fadeAlpha})`;
            ctx.stroke();
            // 内部の暗いハイライト（沈んだ毒）
            ctx.beginPath();
            ctx.arc(sx + baseR * 0.15, sy + baseR * 0.2, baseR * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(20, 60, 10, ${0.25 * fadeAlpha})`;
            ctx.fill();
            // 泡（ブクブク）
            const bubbleCount = 6;
            const idHash =
              (h.id.charCodeAt(0) | 0) +
              (h.id.charCodeAt(1) | 0) * 7 +
              (h.id.charCodeAt(2) | 0) * 13;
            for (let i = 0; i < bubbleCount; i++) {
              const seed = idHash * 0.113 + i * 1.732;
              const bx = sx + Math.cos(seed * 4.2) * baseR * 0.55;
              const by = sy + Math.sin(seed * 3.7) * baseR * 0.5;
              const phase = (nowMs * 0.0018 + seed) % 1;
              const rise = phase; // 0→1 で浮上・膨らむ
              const br = baseR * (0.06 + rise * 0.12);
              const alpha = (1 - rise) * 0.75 * fadeAlpha;
              if (alpha <= 0) continue;
              ctx.beginPath();
              ctx.arc(bx, by - rise * 2, br, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(210, 255, 140, ${alpha * 0.6})`;
              ctx.fill();
              ctx.lineWidth = 1.2;
              ctx.strokeStyle = `rgba(160, 230, 60, ${alpha})`;
              ctx.stroke();
              // 泡のハイライト
              ctx.beginPath();
              ctx.arc(bx - br * 0.35, by - rise * 2 - br * 0.35, br * 0.3, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(240, 255, 200, ${alpha * 0.8})`;
              ctx.fill();
            }
            // 立ち昇る毒気のチラつき
            for (let i = 0; i < 3; i++) {
              const seed = idHash * 0.071 + i * 2.17;
              const phase = (nowMs * 0.0009 + seed) % 1;
              const gx = sx + Math.cos(seed * 5.3) * baseR * 0.4;
              const gyTop = sy - phase * baseR * 1.2;
              const alpha = (1 - phase) * 0.22 * fadeAlpha;
              if (alpha <= 0) continue;
              ctx.fillStyle = `rgba(170, 230, 90, ${alpha})`;
              ctx.beginPath();
              ctx.ellipse(gx, gyTop, baseR * 0.12, baseR * 0.28, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
          case 'bombExplosion': {
            const t = (nowMs - h.startAt) / Math.max(1, h.endAt - h.startAt);
            const scale = 0.6 + t * 1.2;
            ctx.fillStyle = `rgba(255, 140, 40, ${Math.max(0, 0.75 * (1 - t))})`;
            ctx.beginPath();
            ctx.arc(sx, sy, (h.radius ?? 50) * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = `${36 * scale}px ${EMOJI_FONT_FALLBACK}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💥', sx, sy);
            break;
          }
          default:
            break;
        }
        ctx.restore();
      });

      // ボス弾
      bossBattleSnap.projectiles.forEach(p => {
        const sx = p.x - camera.x;
        const sy = p.y - camera.y;
        if (sx < -40 || sx > logicalWidth + 40 || sy < -40 || sy > logicalHeight + 40) return;
        ctx.save();
        if (p.leavesAcidPool) {
          // 毒弾（ブヨブヨ揺れる不定形な液滴＋毒のオーラと軌跡）
          const idHash =
            (p.id.charCodeAt(0) | 0) +
            (p.id.charCodeAt(1) | 0) * 7 +
            (p.id.charCodeAt(2) | 0) * 13;
          const t = nowMs * 0.008 + idHash * 0.17;
          // 外側の毒オーラ
          const aura = ctx.createRadialGradient(sx, sy, p.radius * 0.3, sx, sy, p.radius * 2.1);
          aura.addColorStop(0, 'rgba(160, 240, 80, 0.55)');
          aura.addColorStop(0.5, 'rgba(110, 210, 50, 0.25)');
          aura.addColorStop(1, 'rgba(80, 180, 40, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(sx, sy, p.radius * 2.1, 0, Math.PI * 2);
          ctx.fill();
          // 軌跡（進行方向の逆に伸びる毒しずく）
          const len = Math.sqrt(p.dx * p.dx + p.dy * p.dy) || 1;
          const ndx = p.dx / len;
          const ndy = p.dy / len;
          const trailGrad = ctx.createLinearGradient(
            sx - ndx * p.radius * 2.6,
            sy - ndy * p.radius * 2.6,
            sx,
            sy
          );
          trailGrad.addColorStop(0, 'rgba(120, 200, 40, 0)');
          trailGrad.addColorStop(1, 'rgba(150, 230, 70, 0.65)');
          ctx.fillStyle = trailGrad;
          ctx.beginPath();
          ctx.ellipse(
            sx - ndx * p.radius * 1.2,
            sy - ndy * p.radius * 1.2,
            p.radius * 2.2,
            p.radius * 0.9,
            Math.atan2(ndy, ndx),
            0,
            Math.PI * 2
          );
          ctx.fill();
          // 本体（不定形な毒液滴）
          ctx.shadowColor = 'rgba(120, 230, 60, 0.85)';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          const segs = 18;
          for (let i = 0; i <= segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            const wob =
              Math.sin(a * 3 + t * 1.2) * 0.14 +
              Math.sin(a * 5 - t * 1.8) * 0.08;
            const r = p.radius * (1 + wob);
            const px = sx + Math.cos(a) * r;
            const py = sy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          const bodyGrad = ctx.createRadialGradient(
            sx - p.radius * 0.3,
            sy - p.radius * 0.3,
            0,
            sx,
            sy,
            p.radius * 1.2
          );
          bodyGrad.addColorStop(0, 'rgba(220, 255, 160, 0.95)');
          bodyGrad.addColorStop(0.45, 'rgba(150, 230, 70, 0.95)');
          bodyGrad.addColorStop(1, 'rgba(60, 130, 20, 0.95)');
          ctx.fillStyle = bodyGrad;
          ctx.fill();
          ctx.shadowBlur = 0;
          // 縁
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(40, 90, 10, 0.85)';
          ctx.stroke();
          // ハイライト
          ctx.beginPath();
          ctx.arc(sx - p.radius * 0.35, sy - p.radius * 0.35, p.radius * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(240, 255, 200, 0.8)';
          ctx.fill();
          // しずく（落下滴）
          for (let i = 0; i < 2; i++) {
            const dripPhase = ((nowMs * 0.003 + idHash * 0.11 + i * 0.41) % 1);
            const dripX = sx + (i === 0 ? -p.radius * 0.4 : p.radius * 0.4);
            const dripY = sy + p.radius * 0.3 + dripPhase * p.radius * 1.2;
            const dripR = p.radius * 0.18 * (1 - dripPhase * 0.4);
            const dripAlpha = (1 - dripPhase) * 0.75;
            if (dripR <= 0 || dripAlpha <= 0) continue;
            ctx.beginPath();
            ctx.ellipse(dripX, dripY, dripR, dripR * 1.4, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(140, 220, 60, ${dripAlpha})`;
            ctx.fill();
          }
        } else {
          ctx.fillStyle = 'rgba(100, 220, 60, 0.9)';
          ctx.shadowColor = 'rgba(100, 220, 60, 0.9)';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 雑魚（自爆ボム）
      bossBattleSnap.minions.forEach(m => {
        const sx = m.x - camera.x;
        const sy = m.y - camera.y;
        if (sx < -40 || sx > logicalWidth + 40 || sy < -40 || sy > logicalHeight + 40) return;
        const isFused = m.fuseStartedAt !== null;
        const blink = isFused && Math.floor((nowMs - (m.fuseStartedAt ?? 0)) / 100) % 2 === 0;
        ctx.save();
        if (isFused && blink) {
          ctx.fillStyle = 'rgba(255, 80, 80, 0.55)';
          ctx.beginPath();
          ctx.arc(sx, sy, 26, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font = `32px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', sx, sy);
        // HP バー
        const ratio = Math.max(0, m.hp / m.maxHp);
        if (ratio < 1) {
          ctx.fillStyle = '#222';
          ctx.fillRect(sx - 16, sy - 24, 32, 3);
          ctx.fillStyle = '#f87171';
          ctx.fillRect(sx - 16, sy - 24, 32 * ratio, 3);
        }
        ctx.restore();
      });

      // ボス本体
      const boss = bossBattleSnap.boss;
      const bsx = boss.x - camera.x;
      const bsy = boss.y - camera.y;
      const bossImg = bossImagesRef.current[boss.bossType];
      const imgLoaded = bossImagesLoadedRef.current[boss.bossType];
      ctx.save();
      ctx.translate(bsx, bsy);
      if (boss.facing === 'left') ctx.scale(-1, 1);
      if (bossImg && imgLoaded) {
        ctx.drawImage(
          bossImg,
          -BOSS_DISPLAY_SIZE / 2,
          -BOSS_DISPLAY_SIZE / 2,
          BOSS_DISPLAY_SIZE,
          BOSS_DISPLAY_SIZE
        );
      } else {
        ctx.font = `${BOSS_DISPLAY_SIZE}px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👹', 0, 0);
      }
      ctx.restore();

      // 予備動作中は ⚠️ をボス頭上に表示
      if (boss.action.kind === 'windup') {
        const wElapsed = nowMs - boss.action.startAt;
        const wDuration = Math.max(1, boss.action.durationMs);
        const wProgress = Math.min(1, wElapsed / wDuration);
        const pulse = 1 + Math.sin(nowMs / 80) * 0.18;
        const warnY = bsy - BOSS_DISPLAY_SIZE / 2 - 40;
        ctx.save();
        // 背景の警告リング
        ctx.beginPath();
        ctx.arc(bsx, warnY, 22 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, 0.55)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 80, 80, ${0.6 + wProgress * 0.4})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        // ⚠️ アイコン
        ctx.font = `${28 * pulse}px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', bsx, warnY);
        // 予備動作ゲージ（残時間バー）
        const gaugeW = 60;
        const gaugeH = 4;
        ctx.fillStyle = '#111';
        ctx.fillRect(bsx - gaugeW / 2, warnY + 20, gaugeW, gaugeH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bsx - gaugeW / 2, warnY + 20, gaugeW * wProgress, gaugeH);
        ctx.restore();
      }

      // ボス頭上の HP バー
      const bossRatio = Math.max(0, boss.hp / boss.maxHp);
      const bossBarWidth = 120;
      const bossBarHeight = 6;
      const bossBarY = bsy - BOSS_DISPLAY_SIZE / 2 - 16;
      ctx.fillStyle = '#111';
      ctx.fillRect(bsx - bossBarWidth / 2, bossBarY, bossBarWidth, bossBarHeight);
      ctx.fillStyle = bossRatio > 0.7 ? '#ef4444' : bossRatio > 0.35 ? '#f59e0b' : '#dc2626';
      ctx.fillRect(bsx - bossBarWidth / 2, bossBarY, bossBarWidth * bossRatio, bossBarHeight);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bsx - bossBarWidth / 2, bossBarY, bossBarWidth, bossBarHeight);
      const phaseMarkers = [0.35, 0.7];
      phaseMarkers.forEach(m => {
        const x = bsx - bossBarWidth / 2 + bossBarWidth * m;
        ctx.beginPath();
        ctx.moveTo(x, bossBarY);
        ctx.lineTo(x, bossBarY + bossBarHeight);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.stroke();
      });

      // 被弾直後の赤い血飛沫風の光彩（被弾から最初の 200ms だけ外側にも広がる）
      {
        const remain = bossBattleSnap.player.iFramesUntil - performance.now();
        if (remain > 0 && remain > 400) {
          const px = player.x - camera.x;
          const py = player.y - camera.y;
          ctx.save();
          const pulse = 0.6 + Math.sin(performance.now() / 50) * 0.4;
          const outer = ctx.createRadialGradient(px, py, PLAYER_SIZE * 0.3, px, py, PLAYER_SIZE * 0.9);
          outer.addColorStop(0, `rgba(255, 50, 50, ${0.55 * pulse})`);
          outer.addColorStop(1, 'rgba(255, 50, 50, 0)');
          ctx.fillStyle = outer;
          ctx.beginPath();
          ctx.arc(px, py, PLAYER_SIZE * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 使用しない変数警告を抑止（RAF ループで毎フレーム参照し UI 更新を取り込む）
      void bossUiTickRef.current;
    }

    const tutorialFaiQuote = tutorialFaiSpeechTextRef?.current.trim() ?? '';
    const faiQuote = tutorialFaiQuote || faiBubbleTextRef.current.trim();
    if (faiQuote) {
      const bubbleMax = Math.min(SURVIVAL_FAI_BUBBLE_MAX_WIDTH_PX, logicalWidth - 32);
      const faiGap = 14;
      const faiPlacement = speechBubblesBelowCharacter ? 'below' : 'above';
      const faiAnchorY = speechBubblesBelowCharacter
        ? playerScreenY + PLAYER_SIZE * 0.85 + faiGap
        : playerScreenY - PLAYER_SIZE * 0.85 - faiGap;
      drawSurvivalSpeechBubble({
        ctx,
        centerX: playerScreenX,
        anchorY: faiAnchorY,
        text: faiQuote,
        maxWidth: bubbleMax,
        placement: faiPlacement,
      });
    }

    const jajiiWorldForBubble = jajiiWorldPosRef?.current ?? null;
    if (jajiiWorldForBubble) {
      const jjx = jajiiWorldForBubble.x - camera.x;
      const jjy = jajiiWorldForBubble.y - camera.y;
      const tutorialJajiiQuote = tutorialJajiiSpeechTextRef?.current.trim() ?? '';
      const jajiiQuote = tutorialJajiiQuote || jajiiBubbleTextRef.current.trim();
      if (jajiiQuote) {
        const bubbleMax = Math.min(
          SURVIVAL_JAJII_BUBBLE_MAX_WIDTH_PX,
          logicalWidth - 32,
        );
        const jajiiGap = 14;
        const jajiiPlacement = freezeTutorialDemoJajii
          ? 'above'
          : (speechBubblesBelowCharacter ? 'below' : 'above');
        const jajiiAnchorY = jajiiPlacement === 'above'
          ? jjy - JAJII_SPRITE_SIZE / 2 - jajiiGap
          : jjy + JAJII_SPRITE_SIZE / 2 + jajiiGap;
        drawSurvivalSpeechBubble({
          ctx,
          centerX: jjx,
          anchorY: jajiiAnchorY,
          text: jajiiQuote,
          maxWidth: bubbleMax,
          placement: jajiiPlacement,
        });
      }
    }

    // 衝撃波エフェクト（通常: 前方扇形 / 必殺: 360°）
    shockwavesSnap.forEach(sw => {
      const elapsed = now - sw.startTime;
      if (elapsed >= sw.duration) return;
      
      const progress = elapsed / sw.duration;
      const expandProgress = Math.min(1, progress / SHOCKWAVE_EXPAND_RATIO);
      const currentRadius = sw.maxRadius * expandProgress;
      const alpha = 1 - progress;
      
      const screenX = sw.x - camera.x;
      const screenY = sw.y - camera.y;

      if (sw.isSpecial) {
        ctx.globalAlpha = alpha * 0.75;
        ctx.strokeStyle = sw.color ?? '#f9d332';
        ctx.lineWidth = 10 * (1 - progress * 0.35);
        ctx.beginPath();
        ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.font = `28px ${EMOJI_FONT_FALLBACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', screenX, screenY);
        const sparkCount = 10;
        for (let i = 0; i < sparkCount; i += 1) {
          const angle = (i / sparkCount) * Math.PI * 2 + (now / 1000) * 8;
          const rr = currentRadius * (0.88 + 0.08 * Math.sin((now / 60) + i));
          ctx.font = `14px ${EMOJI_FONT_FALLBACK}`;
          ctx.fillText('✨', screenX + Math.cos(angle) * rr, screenY + Math.sin(angle) * rr);
        }
        ctx.globalAlpha = 1;
        return;
      }

      const baseAngle = sw.direction ? getDirectionAngle(sw.direction) : 0;
      const arcSpread = Math.PI * 0.8;
      
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = sw.color ?? '#f97316';
      ctx.lineWidth = 8 * (1 - progress);
      ctx.beginPath();
      ctx.arc(screenX, screenY, currentRadius, baseAngle - arcSpread / 2, baseAngle + arcSpread / 2);
      ctx.stroke();
      
      ctx.globalAlpha = alpha;
      ctx.font = `16px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 2; i++) {
        const angle = baseAngle - arcSpread / 2 + (i * arcSpread);
        const ix = screenX + Math.cos(angle) * currentRadius;
        const iy = screenY + Math.sin(angle) * currentRadius;
        ctx.fillText('💥', ix, iy);
      }
      
      ctx.globalAlpha = 1;
    });

    // ダメージテキスト
    damageTexts.forEach(dmg => {
      const elapsed = now - dmg.startTime;
      if (elapsed >= dmg.duration) return;
      
      const progress = elapsed / dmg.duration;
      const alpha = 1 - progress;
      const offsetY = -30 * progress;
      
      const screenX = dmg.x - camera.x;
      const screenY = dmg.y - camera.y + offsetY;
      
      ctx.globalAlpha = alpha;
      const displayText = dmg.text ?? dmg.damage.toString();
      const isChordName = dmg.textKind === 'chord-name';
      const isMagicName =
        dmg.textKind === 'magic-name' || (dmg.text && dmg.damage === 0 && !isChordName);
      
      if (isChordName) {
        const progress = elapsed / dmg.duration;
        const alpha = 1 - progress;
        const offsetY = -40 * progress;
        const screenX = dmg.x - camera.x;
        const screenY = dmg.y - camera.y + offsetY;
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(displayText, screenX + 1.5, screenY - 1.5);
        ctx.fillStyle = dmg.color;
        ctx.fillText(displayText, screenX, screenY);
      } else if (isMagicName) {
        const magicScale = 1 + Math.max(0, 0.3 - progress * 0.6);
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(magicScale, magicScale);
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = dmg.color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 4;
        ctx.strokeText(displayText, 0, 0);
        ctx.fillStyle = dmg.color;
        ctx.fillText(displayText, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        ctx.fillStyle = dmg.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(displayText, screenX, screenY);
      }
      ctx.globalAlpha = 1;
    });

    // 雷エフェクト描画
    lightningSnap.forEach(lightning => {
      const elapsed = now - lightning.startTime;
      if (elapsed >= lightning.duration) return;
      
      const progress = elapsed / lightning.duration;
      const alpha = 1 - progress;
      
      const screenX = lightning.x - camera.x;
      const screenY = lightning.y - camera.y;

      // 画面外エフェクトは描画しない（演出のみ軽量化）
      if (
        screenX < -LIGHTNING_SCREEN_PADDING ||
        screenX > logicalWidth + LIGHTNING_SCREEN_PADDING ||
        screenY < -LIGHTNING_SCREEN_PADDING ||
        screenY > logicalHeight + LIGHTNING_SCREEN_PADDING
      ) {
        return;
      }
      
      // 軽量版: 本線1本のみ（分岐・ブラー・全画面フラッシュなし）
      const startY = -20;
      const segmentHeight = (screenY - startY) / LIGHTNING_SEGMENT_COUNT;
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 2.5 - progress * 1.2;
      ctx.beginPath();
      ctx.moveTo(screenX, startY);
      for (let i = 1; i <= LIGHTNING_SEGMENT_COUNT; i++) {
        const jitterBase = (LIGHTNING_SEGMENT_COUNT - i) * 4;
        const jitter =
          i === LIGHTNING_SEGMENT_COUNT
            ? 0
            : Math.sin(lightning.startTime * 0.02 + i * 1.37) * jitterBase;
        const x = screenX + jitter;
        const y = startY + segmentHeight * i;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // 着弾点の小さな発光のみ追加
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#fff3a1';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 7 * (1 - progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      
      // 雷アイコン
      ctx.globalAlpha = alpha;
      ctx.font = `18px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', screenX, screenY);

      ctx.globalAlpha = 1;
    });

    if (contentScale !== 1) {
      ctx.restore();
    }
  }, [logicalWidth, logicalHeight, contentScale, getCameraOffset, woodFloorAssetRevision, hideComboGauge, hidePlayerHintStatusIcon, jajiiWorldPosRef]);

  // 方向ベクトル取得
  const getDirectionVector = (direction: Direction): { x: number; y: number } => {
    const vectors: Record<Direction, { x: number; y: number }> = {
      'up': { x: 0, y: -1 },
      'down': { x: 0, y: 1 },
      'left': { x: -1, y: 0 },
      'right': { x: 1, y: 0 },
      'up-left': { x: -0.707, y: -0.707 },
      'up-right': { x: 0.707, y: -0.707 },
      'down-left': { x: -0.707, y: 0.707 },
      'down-right': { x: 0.707, y: 0.707 },
    };
    return vectors[direction];
  };

  // Canvas バッファサイズ設定（viewport/dpr 変更時のみ）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = getEffectiveDpr();
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;

    // コンテキスト生成直後に iOS 向けの shadowBlur 無効化を適用
    const ctx = canvas.getContext('2d');
    if (ctx) {
      applyIOSCanvasOptimizations(ctx);
      ctx.imageSmoothingEnabled = false;
    }
  }, [viewportWidth, viewportHeight]);

  // 描画ループ: RAF で駆動し、gameState 変更のたびに draw 関数を再生成しない（メインスレッド負荷軽減）。
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = getEffectiveDpr();
    let rafId = 0;
    const loop = (): void => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [draw, viewportWidth, viewportHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{
        width: viewportWidth,
        height: viewportHeight,
        imageRendering: 'pixelated',
      }}
    />
  );
};

export default SurvivalCanvas;
