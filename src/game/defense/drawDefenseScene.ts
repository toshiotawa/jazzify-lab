/**
 * Defense mode Canvas2D renderer (called imperatively from the game loop; no React state).
 */
import type { DefenseEnemyType, DefenseRuntime } from '@/game/defense/defenseTypes';
import { DEFENSE_MAP_HEIGHT, DEFENSE_MAP_WIDTH } from '@/game/defense/defenseTypes';
import { drawHpBar } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import { getHpBarLayout } from '@/game/earTraining/canvas/earTrainingBattleLayout';

const ENEMY_ICONS: Record<DefenseEnemyType, string> = {
  slime: '🫠',
  goblin: '👺',
  skeleton: '💀',
  zombie: '🧟',
  bat: '🦇',
  ghost: '👻',
  orc: '👹',
  demon: '😈',
  dragon: '🐲',
};

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const PLAYER_FONT = `32px ${EMOJI_FONT}`;
const ENEMY_FONT = `28px ${EMOJI_FONT}`;
const FIREBALL_FONT = `18px ${EMOJI_FONT}`;
const HUD_FONT = '14px sans-serif';

export const drawDefenseScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: DefenseRuntime,
): void => {
  const scaleX = width / DEFENSE_MAP_WIDTH;
  const scaleY = height / DEFENSE_MAP_HEIGHT;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.fillRect(0, runtime.playerY * scaleY + 20, width, 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = PLAYER_FONT;
  ctx.fillText('🧙', runtime.playerX * scaleX, runtime.playerY * scaleY);

  ctx.font = FIREBALL_FONT;
  const fireballs = runtime.fireballs;
  for (let i = 0; i < fireballs.length; i += 1) {
    const ball = fireballs[i];
    if (!ball.active) continue;
    ctx.fillText('🔥', ball.x * scaleX, ball.y * scaleY);
  }

  ctx.font = ENEMY_FONT;
  const enemies = runtime.enemies;
  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];
    if (!enemy.active) continue;
    ctx.fillText(ENEMY_ICONS[enemy.type], enemy.x * scaleX, enemy.y * scaleY);
  }

  const hpLayout = getHpBarLayout(width);
  drawHpBar(ctx, hpLayout.leftX, 16, hpLayout.barWidth, runtime.playerHp, runtime.playerMaxHp, true);

  const remainSec = Math.max(0, Math.ceil(runtime.surviveSeconds - runtime.elapsedSec));
  ctx.font = HUD_FONT;
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'right';
  ctx.fillText(`${remainSec}s`, width - 16, 24);
};
