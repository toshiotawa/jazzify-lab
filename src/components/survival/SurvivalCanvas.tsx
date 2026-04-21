/**
 * サバイバルモード Canvas描画
 * 2D Canvasを使用したゲーム画面の描画
 */

import React, { useRef, useEffect, useCallback } from 'react';
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
  SHOCKWAVE_EXPAND_RATIO,
} from './SurvivalTypes';
import {
  BossBattleState,
  BossType,
  BOSS_SPRITE_PATH,
  BOSS_DISPLAY_SIZE,
} from './boss/SurvivalBossTypes';

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
  characterAvatarUrl?: string;
  /** ボス戦状態（ボス戦中のみ非 null） */
  bossBattle?: BossBattleState | null;
  /** ボス戦 UI の再描画トリガ */
  bossUiTick?: number;
}

// ===== 色定義 =====
const COLORS = {
  background: '#1a1a2e',
  grid: '#2a2a4e',
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

// ===== プレイヤーアバター画像パス =====
const PLAYER_AVATAR_PATH = '/default_avater/default-avater.png';
const PLAYER_SIZE = 48;  // プレイヤーの表示サイズ（当たり判定はGameEngine側で別管理）
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

// 背景パーティクル用の状態
interface BackgroundParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const SurvivalCanvas: React.FC<SurvivalCanvasProps> = ({
  gameState,
  viewportWidth,
  viewportHeight,
  contentScale = 1,
  shockwaves = [],
  lightningEffects = [],
  characterAvatarUrl,
  bossBattle = null,
  bossUiTick = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<BackgroundParticle[]>([]);
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const playerImageLoadedRef = useRef(false);
  // スプライトを赤く染めるためのオフスクリーンキャンバス（透明部分は染めない）
  const playerTintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bossImagesRef = useRef<Record<BossType, HTMLImageElement | null>>({ A: null, B: null, C: null });
  const bossImagesLoadedRef = useRef<Record<BossType, boolean>>({ A: false, B: false, C: false });

  // 描画スケール時の論理ビューポート（大きいほど広い範囲を表示）
  const logicalWidth = viewportWidth / contentScale;
  const logicalHeight = viewportHeight / contentScale;
  
  // プレイヤー画像をプリロード（キャラクターアバター優先）
  useEffect(() => {
    const avatarSrc = characterAvatarUrl || PLAYER_AVATAR_PATH;
    const img = new Image();
    img.onload = () => {
      playerImageRef.current = img;
      playerImageLoadedRef.current = true;
    };
    img.onerror = () => {
      playerImageLoadedRef.current = false;
    };
    img.src = avatarSrc;
  }, [characterAvatarUrl]);

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

  // カメラ位置（プレイヤー中心・論理ビューポート使用）
  const getCameraOffset = useCallback((player: PlayerState) => {
    const targetX = player.x - logicalWidth / 2;
    const targetY = player.y - logicalHeight / 2;
    
    // マップ端での制限
    const maxX = MAP_CONFIG.width - logicalWidth;
    const maxY = MAP_CONFIG.height - logicalHeight;
    
    return {
      x: Math.max(0, Math.min(maxX, targetX)),
      y: Math.max(0, Math.min(maxY, targetY)),
    };
  }, [logicalWidth, logicalHeight]);

  // 背景パーティクル初期化（パフォーマンス向上のため数を削減）
  const initParticles = useCallback(() => {
    if (particlesRef.current.length === 0) {
      const particles: BackgroundParticle[] = [];
      const particleCount = 25;  // 50 -> 25に削減
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * MAP_CONFIG.width,
          y: Math.random() * MAP_CONFIG.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
      particlesRef.current = particles;
    }
  }, []);
  
  // 描画関数（contentScale時は論理ビューポートで描画し、ctx.scaleで縮小）
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    if (contentScale !== 1) {
      ctx.save();
      ctx.scale(contentScale, contentScale);
    }
    const { player, enemies, projectiles, items, damageTexts } = gameState;
    const camera = getCameraOffset(player);
    
    // パーティクル初期化
    initParticles();
    
    // キャンバスクリア - グラデーション背景（論理サイズ）
    const gradient = ctx.createRadialGradient(
      logicalWidth / 2, logicalHeight / 2, 0,
      logicalWidth / 2, logicalHeight / 2, logicalWidth
    );
    gradient.addColorStop(0, '#1e1e3f');
    gradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    
    // 背景パーティクル描画（星のような効果）
    const time = Date.now() / 1000;
    particlesRef.current.forEach((particle, i) => {
      // パーティクルをカメラに対して相対移動（視差効果）
      const parallaxFactor = 0.3;  // カメラより遅く動く
      const screenX = (particle.x - camera.x * parallaxFactor) % logicalWidth;
      const screenY = (particle.y - camera.y * parallaxFactor) % logicalHeight;
      
      // 画面外なら反対側に
      const adjustedX = screenX < 0 ? screenX + logicalWidth : screenX;
      const adjustedY = screenY < 0 ? screenY + logicalHeight : screenY;
      
      // 点滅効果
      const twinkle = Math.sin(time * particle.speed * 3 + i) * 0.3 + 0.7;
      const finalOpacity = particle.opacity * twinkle;
      
      ctx.globalAlpha = finalOpacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(adjustedX, adjustedY, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // グリッド描画
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    const gridSize = 64;
    const startX = -(camera.x % gridSize);
    const startY = -(camera.y % gridSize);
    
    for (let x = startX; x < logicalWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalHeight);
      ctx.stroke();
    }
    for (let y = startY; y < logicalHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalWidth, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // マップ境界描画
    ctx.strokeStyle = '#4a4a6e';
    ctx.lineWidth = 4;
    ctx.strokeRect(-camera.x, -camera.y, MAP_CONFIG.width, MAP_CONFIG.height);

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
    gameState.coins.forEach(coin => {
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

    // 敵描画
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

    // 弾丸描画（軽量なCanvas図形）
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
    gameState.enemyProjectiles.forEach(proj => {
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
    
    // プレイヤー本体（アバター画像で描画）
    const playerDamageFlash = bossBattle && bossBattle.active
      && performance.now() < bossBattle.player.iFramesUntil;
    if (playerImageRef.current && playerImageLoadedRef.current) {
      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);
      
      if (player.direction === 'left' || player.direction === 'up-left' || player.direction === 'down-left') {
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
          tctx.drawImage(playerImageRef.current, 0, 0, PLAYER_SIZE, PLAYER_SIZE);
          const blink = Math.floor(performance.now() / 80) % 2 === 0;
          tctx.globalCompositeOperation = 'source-atop';
          tctx.fillStyle = `rgba(255, 40, 40, ${blink ? 0.85 : 0.5})`;
          tctx.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
          tctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(tc, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
        } else {
          ctx.drawImage(playerImageRef.current, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
        }
      } else {
        ctx.drawImage(
          playerImageRef.current,
          -PLAYER_SIZE / 2,
          -PLAYER_SIZE / 2,
          PLAYER_SIZE,
          PLAYER_SIZE
        );
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
    
    // プレイヤーステータスアイコン
    const playerEffects = player.statusEffects.filter(e => e.duration > 0);
    if (playerEffects.length > 0) {
      ctx.font = `14px ${EMOJI_FONT_FALLBACK}`;
      ctx.textAlign = 'center';
      playerEffects.forEach((effect, i) => {
        const icon = STATUS_ICONS[effect.type] || '?';
        ctx.fillText(icon, playerScreenX - 20 + i * 16, playerScreenY - 40);
      });
    }

    // ===== ボス戦レイヤ =====
    if (bossBattle && bossBattle.active) {
      const nowMs = performance.now();
      // ハザード（予兆→発動）
      bossBattle.hazards.forEach(h => {
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
          case 'pullTelegraph': {
            const radius = h.radius ?? 300;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            // 青いガス渦のような予兆
            const aura = ctx.createRadialGradient(sx, sy, 10, sx, sy, radius);
            aura.addColorStop(0, 'rgba(140, 220, 255, 0.45)');
            aura.addColorStop(0.6, 'rgba(60, 140, 220, 0.22)');
            aura.addColorStop(1, 'rgba(20, 60, 120, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fill();
            // 外縁点線
            ctx.setLineDash([12, 8]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(150, 220, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // 吸い込みの渦巻線（アルキメデス螺旋）
            for (let spiral = 0; spiral < 3; spiral++) {
              ctx.strokeStyle = `rgba(180, 230, 255, ${0.6 - spiral * 0.15})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              const offset = (nowMs / 900 + spiral * (Math.PI * 2) / 3);
              const turns = 2.5;
              const steps = 120;
              for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const a = offset + t * Math.PI * 2 * turns;
                const r = radius * t;
                const px = sx + Math.cos(a) * r;
                const py = sy + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.stroke();
            }
            // 内向きに吸い込まれる光点
            for (let i = 0; i < 10; i++) {
              const phase = ((nowMs / 1100 + i * 0.1) % 1);
              const a = (i / 10) * Math.PI * 2 + nowMs / 1400;
              const r = radius * (1 - phase);
              const alpha = phase * 0.9;
              ctx.fillStyle = `rgba(200, 235, 255, ${alpha})`;
              ctx.beginPath();
              ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            // 収縮リング
            const shrinkR = radius * (1 - pg * 0.5);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, shrinkR, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          case 'pullActive': {
            const radius = h.radius ?? 300;
            const life = Math.max(1, h.endAt - h.startAt);
            const pg = Math.min(1, (nowMs - h.startAt) / life);
            // 強い青白い吸引パルス
            const pulse = 0.4 + Math.sin(nowMs / 80) * 0.6;
            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
            grad.addColorStop(0, `rgba(220, 240, 255, ${0.7 * (1 - pg)})`);
            grad.addColorStop(0.4, `rgba(120, 200, 255, ${0.55 * (1 - pg)})`);
            grad.addColorStop(1, 'rgba(20, 60, 150, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fill();
            // 強めのリング輪郭
            ctx.shadowColor = 'rgba(140, 220, 255, 1)';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + 0.2 * pulse})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            // 内向きに激しく吸い込まれる光跡（線）
            for (let i = 0; i < 16; i++) {
              const phase = ((nowMs / 280 + i * 0.062) % 1);
              const a = (i / 16) * Math.PI * 2 + nowMs / 350;
              const r1 = radius * (1 - phase);
              const r2 = radius * Math.max(0, 1 - phase - 0.18);
              ctx.strokeStyle = `rgba(220, 240, 255, ${0.85 * (1 - phase)})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
              ctx.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
              ctx.stroke();
            }
            // 中心の輝き
            ctx.fillStyle = `rgba(255, 255, 255, ${0.85})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 16 + pulse * 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(140, 220, 255, 0.7)`;
            ctx.beginPath();
            ctx.arc(sx, sy, 28 + pulse * 10, 0, Math.PI * 2);
            ctx.fill();
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
      bossBattle.projectiles.forEach(p => {
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
      bossBattle.minions.forEach(m => {
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
      const boss = bossBattle.boss;
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
        const remain = bossBattle.player.iFramesUntil - performance.now();
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

      // 使用しない変数警告を抑止
      void bossUiTick;
    }

    // 衝撃波エフェクト描画（前方向のみ）
    shockwaves.forEach(sw => {
      const elapsed = now - sw.startTime;
      if (elapsed >= sw.duration) return;
      
      const progress = elapsed / sw.duration;
      const expandProgress = Math.min(1, progress / SHOCKWAVE_EXPAND_RATIO);
      const currentRadius = sw.maxRadius * expandProgress;
      const alpha = 1 - progress;
      
      const screenX = sw.x - camera.x;
      const screenY = sw.y - camera.y;
      
      // 方向に基づいて半円の衝撃波を描画
      const baseAngle = sw.direction ? getDirectionAngle(sw.direction) : 0;
      const arcSpread = Math.PI * 0.8;  // 前方約144度の扇形
      
      // 衝撃波リング（前方のみ）
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = sw.color ?? '#f97316';
      ctx.lineWidth = 8 * (1 - progress);
      ctx.beginPath();
      ctx.arc(screenX, screenY, currentRadius, baseAngle - arcSpread / 2, baseAngle + arcSpread / 2);
      ctx.stroke();
      
      // 衝撃波アイコン（軽量化のため2個のみ）
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
      const isMagicName = dmg.text && dmg.damage === 0;
      
      if (isMagicName) {
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
    lightningEffects.forEach(lightning => {
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
  }, [gameState, logicalWidth, logicalHeight, contentScale, getCameraOffset, shockwaves, lightningEffects, initParticles, bossBattle, bossUiTick]);

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

  // 描画ループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 高DPIディスプレイ対応
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    ctx.scale(dpr, dpr);
    
    draw(ctx);
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
