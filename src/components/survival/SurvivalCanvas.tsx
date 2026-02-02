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
  Direction,
  ShockwaveEffect,
  MAP_CONFIG,
} from './SurvivalTypes';

interface SurvivalCanvasProps {
  gameState: SurvivalGameState;
  viewportWidth: number;
  viewportHeight: number;
  shockwaves?: ShockwaveEffect[];
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

// ===== プレイヤーアイコン =====
const PLAYER_ICON = '🧙';

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

const SurvivalCanvas: React.FC<SurvivalCanvasProps> = ({
  gameState,
  viewportWidth,
  viewportHeight,
  shockwaves = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // 描画関数
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { player, enemies, projectiles, items, damageTexts } = gameState;
    const camera = getCameraOffset(player);
    
    // キャンバスクリア
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
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

    // 敵描画
    enemies.forEach(enemy => {
      const screenX = enemy.x - camera.x;
      const screenY = enemy.y - camera.y;
      
      // 画面外スキップ
      if (screenX < -50 || screenX > viewportWidth + 50 ||
          screenY < -50 || screenY > viewportHeight + 50) return;
      
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

    // 弾丸描画（アイコンで描画）
    projectiles.forEach(proj => {
      const screenX = proj.x - camera.x;
      const screenY = proj.y - camera.y;
      
      if (screenX < -20 || screenX > viewportWidth + 20 ||
          screenY < -20 || screenY > viewportHeight + 20) return;
      
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = COLORS.projectile;
      ctx.shadowBlur = 8;
      ctx.fillText(PROJECTILE_ICON, screenX, screenY);
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
    
    // プレイヤー本体（アイコンで描画）
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PLAYER_ICON, playerScreenX, playerScreenY);
    
    // 方向インジケーター（矢印アイコン）
    const dirVec = getDirectionVector(player.direction);
    const arrowX = playerScreenX + dirVec.x * 25;
    const arrowY = playerScreenY + dirVec.y * 25;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('➤', arrowX, arrowY);
    
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

    // 衝撃波エフェクト描画（アイコンベース）
    const now = Date.now();
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
      
      // 衝撃波アイコン（放射状に配置）
      ctx.globalAlpha = alpha;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const iconCount = 6;
      for (let i = 0; i < iconCount; i++) {
        const angle = (i / iconCount) * Math.PI * 2;
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
      ctx.fillStyle = dmg.color;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dmg.damage.toString(), screenX, screenY);
      ctx.globalAlpha = 1;
    });

  }, [gameState, viewportWidth, viewportHeight, getCameraOffset, shockwaves]);

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
