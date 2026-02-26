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
} from './SurvivalTypes';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<BackgroundParticle[]>([]);
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const playerImageLoadedRef = useRef(false);

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
      
      ctx.fillStyle = COLORS.item[item.type] || '#fff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // アイコン
      ctx.font = '16px sans-serif';
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
        ctx.font = '14px sans-serif';
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
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', screenX - size / 2 - 8, screenY - size / 2);
      }
      
      // 敵本体（アイコンで描画）
      const enemyIcon = ENEMY_ICONS[enemy.type] || '👾';
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemyIcon, screenX, screenY);
      
      // ボスの場合は王冠を表示
      if (enemy.isBoss) {
        ctx.font = '16px sans-serif';
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
        ctx.font = '12px sans-serif';
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
      
      ctx.font = '10px sans-serif';
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
      ctx.font = '20px sans-serif';
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
    if (playerImageRef.current && playerImageLoadedRef.current) {
      // 画像が読み込まれている場合は画像を描画
      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);
      
      // プレイヤーの向きに応じて画像を反転
      if (player.direction === 'left' || player.direction === 'up-left' || player.direction === 'down-left') {
        ctx.scale(-1, 1);
      }
      
      // 画像を中心に配置
      ctx.drawImage(
        playerImageRef.current,
        -PLAYER_SIZE / 2,
        -PLAYER_SIZE / 2,
        PLAYER_SIZE,
        PLAYER_SIZE
      );
      ctx.restore();
    } else {
      // フォールバック: 絵文字で描画
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧙', playerScreenX, playerScreenY);
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
    ctx.font = '14px sans-serif';
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
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      playerEffects.forEach((effect, i) => {
        const icon = STATUS_ICONS[effect.type] || '?';
        ctx.fillText(icon, playerScreenX - 20 + i * 16, playerScreenY - 40);
      });
    }

    // 衝撃波エフェクト描画（前方向のみ）
    shockwaves.forEach(sw => {
      const elapsed = now - sw.startTime;
      if (elapsed >= sw.duration) return;
      
      const progress = elapsed / sw.duration;
      // 即座に展開してフェードアウト（ダメージ適用と同期）
      const expandProgress = Math.min(1, progress / 0.15);
      const currentRadius = sw.maxRadius * expandProgress;
      const alpha = 1 - progress;
      
      const screenX = sw.x - camera.x;
      const screenY = sw.y - camera.y;
      
      // 方向に基づいて半円の衝撃波を描画
      const baseAngle = sw.direction ? getDirectionAngle(sw.direction) : 0;
      const arcSpread = Math.PI * 0.8;  // 前方約144度の扇形
      
      // 衝撃波リング（前方のみ）
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 8 * (1 - progress);
      ctx.beginPath();
      ctx.arc(screenX, screenY, currentRadius, baseAngle - arcSpread / 2, baseAngle + arcSpread / 2);
      ctx.stroke();
      
      // 衝撃波アイコン（前方のみ配置）
      ctx.globalAlpha = alpha;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const iconCount = 4;
      for (let i = 0; i < iconCount; i++) {
        const angle = baseAngle - arcSpread / 2 + (i / (iconCount - 1)) * arcSpread;
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
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', screenX, screenY);

      ctx.globalAlpha = 1;
    });

    if (contentScale !== 1) {
      ctx.restore();
    }
  }, [gameState, logicalWidth, logicalHeight, contentScale, getCameraOffset, shockwaves, lightningEffects, initParticles]);

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
