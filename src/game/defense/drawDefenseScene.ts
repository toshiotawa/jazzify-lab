/**
 * Defense mode Canvas2D renderer (called imperatively from the game loop; no React state).
 */
import {
  DEFENSE_ENEMY_CONFIG,
  DEFENSE_ENEMY_DRAW_ORDER,
  DEFENSE_GROUND_Y,
  DEFENSE_IMPACT_HITBACK_SEC,
  DEFENSE_IMPACT_SEC,
  DEFENSE_IMPACT_SPARK_ANGLES,
  getDefenseEnemyAttackDx,
  getDefenseEnemyAttackDy,
  getDefenseFlyingBobOffset,
  isDefenseEnemyAttacking,
  pickDefenseEnemyFrame,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';
import type { DefenseEnemyType, DefenseRuntime } from '@/game/defense/defenseTypes';
import {
  DEFENSE_MAP_HEIGHT,
  DEFENSE_MAP_WIDTH,
  DEFENSE_NO_IMPACT,
} from '@/game/defense/defenseTypes';
import { drawHpBar } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import { getHpBarLayout } from '@/game/earTraining/canvas/earTrainingBattleLayout';

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const PLAYER_FONT = `32px ${EMOJI_FONT}`;
const FIREBALL_FONT = `18px ${EMOJI_FONT}`;
const HUD_FONT = '14px sans-serif';
const IMPACT_RING_COLOR = '#fbbf24';
const IMPACT_SPARK_COLOR = '#fef08a';

const drawImpactEffect = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  scaleX: number,
  scaleY: number,
  spriteScale: number,
): void => {
  if (runtime.impactAt === DEFENSE_NO_IMPACT) return;
  const age = runtime.elapsedSec - runtime.impactAt;
  if (age < 0 || age > DEFENSE_IMPACT_SEC) return;

  const cx = runtime.impactX * scaleX;
  const cy = runtime.impactY * scaleY;
  const progress = age / DEFENSE_IMPACT_SEC;
  const ringRadius = (10 + progress * 30) * spriteScale;
  const sparkInner = ringRadius * 0.5;
  const sparkOuter = sparkInner + (8 + progress * 20) * spriteScale;

  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.strokeStyle = IMPACT_RING_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = IMPACT_SPARK_COLOR;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < DEFENSE_IMPACT_SPARK_ANGLES.length; i += 1) {
    const angle = DEFENSE_IMPACT_SPARK_ANGLES[i];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.moveTo(cx + cos * sparkInner, cy + sin * sparkInner);
    ctx.lineTo(cx + cos * sparkOuter, cy + sin * sparkOuter);
  }
  ctx.stroke();
  ctx.restore();
};

const drawEnemiesOfType = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  type: DefenseEnemyType,
  atlas: DefenseEnemySpriteAtlas,
  scaleX: number,
  scaleY: number,
  spriteScale: number,
): void => {
  const sprites = atlas.get(type);
  if (!sprites) return;
  const config = DEFENSE_ENEMY_CONFIG[type];
  const drawHeight = config.spriteHeight * spriteScale;
  const drawWidth = drawHeight * config.aspectRatio;
  const halfHeight = config.spriteHeight / 2;

  const enemies = runtime.enemies;
  for (let i = 0; i < enemies.length; i += 1) {
    const enemy = enemies[i];
    if (!enemy.active || enemy.type !== type) continue;

    const attacking = isDefenseEnemyAttacking(
      enemy.attackHitPending,
      runtime.elapsedSec,
      enemy.lastAttackAt,
    );
    const frame = pickDefenseEnemyFrame(
      runtime.elapsedSec,
      enemy.slotIndex,
      enemy.moving,
      config.isFlying,
      attacking,
    );
    const img = frame === 'idle' ? sprites.idle : sprites.move;

    let drawX = enemy.x;
    let drawY = enemy.y;
    if (attacking) {
      const attackElapsed = runtime.elapsedSec - enemy.lastAttackAt;
      drawX += getDefenseEnemyAttackDx(attackElapsed);
      drawY += getDefenseEnemyAttackDy(attackElapsed, config.isFlying);
    }
    if (config.isFlying) {
      drawY += getDefenseFlyingBobOffset(runtime.elapsedSec, enemy.slotIndex);
    }

    // Anchor at the sprite bottom so feet stay on the ground line regardless of canvas aspect.
    const left = drawX * scaleX - drawWidth / 2;
    const top = (drawY + halfHeight) * scaleY - drawHeight;
    ctx.drawImage(img, left, top, drawWidth, drawHeight);
  }
};

export const drawDefenseScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: DefenseRuntime,
  atlas: DefenseEnemySpriteAtlas | null,
): void => {
  const scaleX = width / DEFENSE_MAP_WIDTH;
  const scaleY = height / DEFENSE_MAP_HEIGHT;
  const spriteScale = Math.min(scaleX, scaleY);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.fillRect(0, DEFENSE_GROUND_Y * scaleY, width, 2);

  if (atlas) {
    for (let d = 0; d < DEFENSE_ENEMY_DRAW_ORDER.length; d += 1) {
      drawEnemiesOfType(ctx, runtime, DEFENSE_ENEMY_DRAW_ORDER[d], atlas, scaleX, scaleY, spriteScale);
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let playerDrawX = runtime.playerX * scaleX;
  if (runtime.impactAt !== DEFENSE_NO_IMPACT) {
    const impactAge = runtime.elapsedSec - runtime.impactAt;
    if (impactAge >= 0 && impactAge < DEFENSE_IMPACT_HITBACK_SEC) {
      playerDrawX -= 3 * spriteScale;
    }
  }

  ctx.font = PLAYER_FONT;
  ctx.fillText('🧙', playerDrawX, runtime.playerY * scaleY);

  drawImpactEffect(ctx, runtime, scaleX, scaleY, spriteScale);

  ctx.font = FIREBALL_FONT;
  const fireballs = runtime.fireballs;
  for (let i = 0; i < fireballs.length; i += 1) {
    const ball = fireballs[i];
    if (!ball.active) continue;
    ctx.fillText('🔥', ball.x * scaleX, ball.y * scaleY);
  }

  const hpLayout = getHpBarLayout(width);
  drawHpBar(ctx, hpLayout.leftX, 16, hpLayout.barWidth, runtime.playerHp, runtime.playerMaxHp, true);

  const remainSec = Math.max(0, Math.ceil(runtime.surviveSeconds - runtime.elapsedSec));
  ctx.font = HUD_FONT;
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'right';
  ctx.fillText(`${remainSec}s`, width - 16, 24);
};
