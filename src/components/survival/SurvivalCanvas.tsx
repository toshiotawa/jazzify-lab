/**
 * サバイバルモード Canvas描画
 * 2D Canvasを使用したゲーム画面の描画
 * lucide-react SVGアイコンを使用
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
} from './SurvivalTypes';

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
  shockwaves?: ShockwaveEffect[];
  lightningEffects?: LightningEffect[];
}

// ===== SVGアイコンパス定義（lucide-reactから抽出） =====
// アイコンは24x24のviewBoxで定義されている
const SVG_ICONS = {
  // プレイヤー（User/Wand）
  player: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  
  // 敵モンスター
  slime: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  goblin: '<path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
  skeleton: '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 16h8"/><path d="M12 8V2"/><path d="M10 2h4"/><path d="M9 22v-6h6v6"/><path d="M6 16v4"/><path d="M18 16v4"/>',
  zombie: '<path d="M12 2v4"/><path d="m15.5 9.5 2.1 2.1"/><path d="M20 12h-4"/><path d="m17.6 17.6-2.1-2.1"/><path d="M12 20v-4"/><path d="m6.4 17.6 2.1-2.1"/><path d="M4 12h4"/><path d="m6.4 6.4 2.1 2.1"/>',
  bat: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  ghost: '<path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>',
  orc: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="9" cy="13" r="2"/><circle cx="15" cy="13" r="2"/>',
  demon: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>',
  dragon: '<path d="m12.5 3 2 3.5"/><path d="m9.5 3-2 3.5"/><path d="M5 8.5 3 11"/><path d="M19 8.5 21 11"/><path d="M12 12v9"/><path d="m4.5 18 3-2.5"/><path d="m19.5 18-3-2.5"/><circle cx="12" cy="8" r="5"/>',
  boss: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z"/><path d="M12 16v4"/>',
  
  // 弾丸・エフェクト
  projectile: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>',
  enemyProjectile: '<circle cx="12" cy="12" r="10"/>',
  explosion: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  
  // ステータス効果
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  ice: '<line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="20" y1="16" x2="4" y2="8"/><line x1="20" y1="8" x2="4" y2="16"/>',
  buffer: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
  debuffer: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
  hint: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  speedUp: '<path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>',
  defUp: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
  
  // 攻撃タイプ
  ranged: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  melee: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>',
  magic: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
  
  // 雷
  thunder: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  
  // コイン
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 6v12"/><path d="M15 9.5c-1-1-2-1-3-1s-2 .5-2 1.5c0 1.5 2 2 2 3.5 0 1-1 1.5-2 1.5s-2 0-3-1"/>',
  
  // アイテム
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  shoe: '<path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>',
  vest: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
  
  // 方向矢印
  arrow: '<path d="m9 18 6-6-6-6"/>',
  
  // 王冠（ボス）
  crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z"/><path d="M12 16v4"/>',
};

// 色定義
const ICON_COLORS = {
  player: '#4ade80',
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
  projectile: '#fef08a',
  enemyProjectile: '#ef4444',
  fire: '#f97316',
  ice: '#22d3ee',
  buffer: '#22c55e',
  debuffer: '#ef4444',
  thunder: '#facc15',
  coin: '#fbbf24',
  heart: '#ef4444',
  hint: '#facc15',
  speedUp: '#3b82f6',
  defUp: '#6b7280',
  ranged: '#3b82f6',
  melee: '#f97316',
  magic: '#a855f7',
  explosion: '#f97316',
  crown: '#fbbf24',
  arrow: '#ffffff',
};

// SVGアイコンをData URLに変換
const createSvgDataUrl = (pathData: string, color: string, size: number = 24): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathData}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// 画像キャッシュ
const imageCache = new Map<string, HTMLImageElement>();

// SVGアイコン画像を取得（キャッシュ付き）
const getIconImage = (iconName: string, color: string): HTMLImageElement | null => {
  const cacheKey = `${iconName}_${color}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  const pathData = SVG_ICONS[iconName as keyof typeof SVG_ICONS];
  if (!pathData) return null;
  
  const img = new Image();
  img.src = createSvgDataUrl(pathData, color);
  imageCache.set(cacheKey, img);
  
  return img;
};

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

// ===== 敵タイプからアイコン名へのマッピング =====
const ENEMY_ICON_MAP: Record<string, keyof typeof SVG_ICONS> = {
  slime: 'slime',
  goblin: 'goblin',
  skeleton: 'skeleton',
  zombie: 'zombie',
  bat: 'bat',
  ghost: 'ghost',
  orc: 'orc',
  demon: 'demon',
  dragon: 'dragon',
  boss: 'boss',
};

// ===== ステータスアイコンマッピング =====
const STATUS_ICON_MAP: Record<string, keyof typeof SVG_ICONS> = {
  fire: 'fire',
  ice: 'ice',
  buffer: 'buffer',
  debuffer: 'debuffer',
  hint: 'hint',
  speed_up: 'speedUp',
  def_up: 'defUp',
  a_atk_up: 'ranged',
  b_atk_up: 'melee',
  c_atk_up: 'magic',
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
  shockwaves = [],
  lightningEffects = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<BackgroundParticle[]>([]);

  // カメラ位置（プレイヤー中心）
  const getCameraOffset = useCallback((player: PlayerState) => {
    const targetX = player.x - viewportWidth / 2;
    const targetY = player.y - viewportHeight / 2;
    
    // マップ端での制限
    const maxX = MAP_CONFIG.width - viewportWidth;
    const maxY = MAP_CONFIG.height - viewportHeight;
    
    return {
      x: Math.max(0, Math.min(maxX, targetX)),
      y: Math.max(0, Math.min(maxY, targetY)),
    };
  }, [viewportWidth, viewportHeight]);

  // 背景パーティクル初期化
  const initParticles = useCallback(() => {
    if (particlesRef.current.length === 0) {
      const particles: BackgroundParticle[] = [];
      const particleCount = 50;
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
  
  // 描画関数
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { player, enemies, projectiles, items, damageTexts } = gameState;
    const camera = getCameraOffset(player);
    
    // パーティクル初期化
    initParticles();
    
    // キャンバスクリア - グラデーション背景
    const gradient = ctx.createRadialGradient(
      viewportWidth / 2, viewportHeight / 2, 0,
      viewportWidth / 2, viewportHeight / 2, viewportWidth
    );
    gradient.addColorStop(0, '#1e1e3f');
    gradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
    // 背景パーティクル描画（星のような効果）
    const time = Date.now() / 1000;
    particlesRef.current.forEach((particle, i) => {
      // パーティクルをカメラに対して相対移動（視差効果）
      const parallaxFactor = 0.3;  // カメラより遅く動く
      const screenX = (particle.x - camera.x * parallaxFactor) % viewportWidth;
      const screenY = (particle.y - camera.y * parallaxFactor) % viewportHeight;
      
      // 画面外なら反対側に
      const adjustedX = screenX < 0 ? screenX + viewportWidth : screenX;
      const adjustedY = screenY < 0 ? screenY + viewportHeight : screenY;
      
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
    
    for (let x = startX; x < viewportWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewportHeight);
      ctx.stroke();
    }
    for (let y = startY; y < viewportHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(viewportWidth, y);
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
      
      if (screenX < -50 || screenX > viewportWidth + 50 ||
          screenY < -50 || screenY > viewportHeight + 50) return;
      
      ctx.fillStyle = COLORS.item[item.type] || '#fff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // アイコン（SVG）
      const iconName = item.type === 'heart' ? 'heart' :
        item.type === 'angel_shoes' ? 'shoe' :
        item.type === 'vest' ? 'vest' : 'thunder';
      const iconColor = item.type === 'heart' ? ICON_COLORS.heart :
        item.type === 'angel_shoes' ? ICON_COLORS.speedUp :
        item.type === 'vest' ? ICON_COLORS.defUp : ICON_COLORS.thunder;
      const iconImg = getIconImage(iconName, iconColor);
      if (iconImg && iconImg.complete) {
        ctx.drawImage(iconImg, screenX - 10, screenY - 10, 20, 20);
      }
    });

    // コイン描画
    const now = Date.now();
    gameState.coins.forEach(coin => {
      const screenX = coin.x - camera.x;
      const screenY = coin.y - camera.y;
      
      if (screenX < -30 || screenX > viewportWidth + 30 ||
          screenY < -30 || screenY > viewportHeight + 30) return;
      
      // 残り時間で点滅（消える前の警告）
      const elapsed = now - coin.startTime;
      const remaining = coin.lifetime - elapsed;
      const shouldBlink = remaining < 3000;  // 3秒以下で点滅
      const isVisible = !shouldBlink || Math.floor(elapsed / 150) % 2 === 0;
      
      if (!isVisible) return;
      
      // コインの光エフェクト
      const pulseScale = 1 + Math.sin(elapsed / 200) * 0.15;
      const iconSize = 20 * pulseScale;
      
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      
      // コインアイコン（SVG）
      const coinImg = getIconImage('coin', ICON_COLORS.coin);
      if (coinImg && coinImg.complete) {
        ctx.drawImage(coinImg, screenX - iconSize / 2, screenY - iconSize / 2, iconSize, iconSize);
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // 敵描画
    enemies.forEach(enemy => {
      const screenX = enemy.x - camera.x;
      const screenY = enemy.y - camera.y;
      
      // 画面外スキップ
      if (screenX < -50 || screenX > viewportWidth + 50 ||
          screenY < -50 || screenY > viewportHeight + 50) return;
      
      const size = enemy.isBoss ? 40 : 28;
      
      // ステータス異常エフェクト（アイコンを周りに表示）
      if (enemy.statusEffects.some(e => e.type === 'ice')) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size + 8, 0, Math.PI * 2);
        ctx.fill();
        // 氷アイコンをオーバーレイ（SVG）
        const iceImg = getIconImage('ice', ICON_COLORS.ice);
        if (iceImg && iceImg.complete) {
          ctx.drawImage(iceImg, screenX + size / 2, screenY - size / 2 - 8, 16, 16);
        }
      }
      if (enemy.statusEffects.some(e => e.type === 'fire')) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size + 8, 0, Math.PI * 2);
        ctx.fill();
        // 炎アイコンをオーバーレイ（SVG）
        const fireImg = getIconImage('fire', ICON_COLORS.fire);
        if (fireImg && fireImg.complete) {
          ctx.drawImage(fireImg, screenX - size / 2 - 16, screenY - size / 2 - 8, 16, 16);
        }
      }
      
      // 敵本体（SVGアイコンで描画）
      const enemyIconName = ENEMY_ICON_MAP[enemy.type] || 'slime';
      const enemyColor = COLORS.enemy[enemy.type as keyof typeof COLORS.enemy] || '#fff';
      const enemyImg = getIconImage(enemyIconName, enemyColor);
      if (enemyImg && enemyImg.complete) {
        ctx.drawImage(enemyImg, screenX - size / 2, screenY - size / 2, size, size);
      }
      
      // ボスの場合は王冠を表示（SVG）
      if (enemy.isBoss) {
        const crownImg = getIconImage('crown', ICON_COLORS.crown);
        if (crownImg && crownImg.complete) {
          ctx.drawImage(crownImg, screenX - 10, screenY - size / 2 - 22, 20, 20);
        }
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
      
      // ステータスアイコン（SVG）
      const activeEffects = enemy.statusEffects.filter(e => e.duration > 0);
      if (activeEffects.length > 0) {
        activeEffects.forEach((effect, i) => {
          const iconName = STATUS_ICON_MAP[effect.type];
          if (iconName) {
            const iconColor = ICON_COLORS[iconName as keyof typeof ICON_COLORS] || '#fff';
            const statusImg = getIconImage(iconName, iconColor);
            if (statusImg && statusImg.complete) {
              ctx.drawImage(statusImg, screenX - 14 + i * 16, screenY - size / 2 - 24, 14, 14);
            }
          }
        });
      }
    });

    // 弾丸描画（SVGアイコンで描画）
    projectiles.forEach(proj => {
      const screenX = proj.x - camera.x;
      const screenY = proj.y - camera.y;
      
      if (screenX < -20 || screenX > viewportWidth + 20 ||
          screenY < -20 || screenY > viewportHeight + 20) return;
      
      ctx.save();
      ctx.shadowColor = COLORS.projectile;
      ctx.shadowBlur = 8;
      
      const projImg = getIconImage('projectile', ICON_COLORS.projectile);
      if (projImg && projImg.complete) {
        ctx.drawImage(projImg, screenX - 10, screenY - 10, 20, 20);
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });
    
    // 敵の弾丸描画（SVG）
    gameState.enemyProjectiles.forEach(proj => {
      const screenX = proj.x - camera.x;
      const screenY = proj.y - camera.y;
      
      if (screenX < -20 || screenX > viewportWidth + 20 ||
          screenY < -20 || screenY > viewportHeight + 20) return;
      
      ctx.save();
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 6;
      
      const enemyProjImg = getIconImage('enemyProjectile', ICON_COLORS.enemyProjectile);
      if (enemyProjImg && enemyProjImg.complete) {
        ctx.drawImage(enemyProjImg, screenX - 8, screenY - 8, 16, 16);
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
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
      // 炎エフェクトのアイコン（SVG）
      const fireImg = getIconImage('fire', ICON_COLORS.fire);
      if (fireImg && fireImg.complete) {
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + Date.now() / 500;
          const fx = playerScreenX + Math.cos(angle) * 35;
          const fy = playerScreenY + Math.sin(angle) * 35;
          ctx.drawImage(fireImg, fx - 12, fy - 12, 24, 24);
        }
      }
    }
    
    // プレイヤー本体（SVGアイコンで描画）
    const playerImg = getIconImage('player', ICON_COLORS.player);
    if (playerImg && playerImg.complete) {
      ctx.drawImage(playerImg, playerScreenX - 18, playerScreenY - 18, 36, 36);
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
    
    // 方向矢印（SVG）
    const arrowImg = getIconImage('arrow', ICON_COLORS.arrow);
    if (arrowImg && arrowImg.complete) {
      ctx.drawImage(arrowImg, -8, -8, 16, 16);
    }
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
    
    // プレイヤーステータスアイコン（SVG）
    const playerEffects = player.statusEffects.filter(e => e.duration > 0);
    if (playerEffects.length > 0) {
      playerEffects.forEach((effect, i) => {
        const iconName = STATUS_ICON_MAP[effect.type];
        if (iconName) {
          const iconColor = ICON_COLORS[iconName as keyof typeof ICON_COLORS] || '#fff';
          const statusImg = getIconImage(iconName, iconColor);
          if (statusImg && statusImg.complete) {
            ctx.drawImage(statusImg, playerScreenX - 24 + i * 18, playerScreenY - 48, 16, 16);
          }
        }
      });
    }

    // 衝撃波エフェクト描画（SVGアイコンベース）
    shockwaves.forEach(sw => {
      const elapsed = now - sw.startTime;
      if (elapsed >= sw.duration) return;
      
      const progress = elapsed / sw.duration;
      const currentRadius = sw.maxRadius * progress;
      const alpha = 1 - progress;
      
      const screenX = sw.x - camera.x;
      const screenY = sw.y - camera.y;
      
      // 衝撃波リング
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = '#f97316';  // オレンジ色
      ctx.lineWidth = 8 * (1 - progress);
      ctx.beginPath();
      ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 衝撃波アイコン（放射状に配置、SVG）
      ctx.globalAlpha = alpha;
      const explosionImg = getIconImage('explosion', ICON_COLORS.explosion);
      if (explosionImg && explosionImg.complete) {
        const iconCount = 6;
        for (let i = 0; i < iconCount; i++) {
          const angle = (i / iconCount) * Math.PI * 2;
          const ix = screenX + Math.cos(angle) * currentRadius;
          const iy = screenY + Math.sin(angle) * currentRadius;
          ctx.drawImage(explosionImg, ix - 12, iy - 12, 24, 24);
        }
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
      ctx.fillStyle = dmg.color;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dmg.damage.toString(), screenX, screenY);
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
      
      // 雷の稲妻を描画（画面上端から敵位置へ）
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3 + (1 - progress) * 3;
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 20;
      
      // ジグザグの稲妻を描画
      ctx.beginPath();
      const startY = -50;  // 画面上端から
      const endY = screenY;
      const segments = 8;
      const segmentHeight = (endY - startY) / segments;
      
      ctx.moveTo(screenX, startY);
      for (let i = 1; i <= segments; i++) {
        const x = screenX + (Math.random() - 0.5) * 40 * (1 - i / segments);
        const y = startY + segmentHeight * i;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // 追加の細い分岐
      if (Math.random() < 0.5) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        const branchY = startY + segmentHeight * Math.floor(Math.random() * 4 + 2);
        ctx.moveTo(screenX, branchY);
        ctx.lineTo(screenX + (Math.random() - 0.5) * 60, branchY + segmentHeight * 2);
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
      
      // 雷アイコン（SVG）
      const thunderImg = getIconImage('thunder', ICON_COLORS.thunder);
      if (thunderImg && thunderImg.complete) {
        ctx.drawImage(thunderImg, screenX - 16, screenY - 16, 32, 32);
      }
      
      // フラッシュ効果（画面全体）
      if (progress < 0.1) {
        ctx.globalAlpha = 0.2 * (1 - progress / 0.1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, viewportWidth, viewportHeight);
      }
      
      ctx.globalAlpha = 1;
    });

  }, [gameState, viewportWidth, viewportHeight, getCameraOffset, shockwaves, lightningEffects, initParticles]);

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
