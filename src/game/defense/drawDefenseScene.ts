/**
 * Defense mode Canvas2D renderer (called imperatively from the game loop; no React state).
 */
import { drawBattleAvatar } from '@/game/earTraining/canvas/earTrainingBattleActorDraw';
import {
  drawCachedBackground,
  invalidateBackgroundCache,
} from '@/game/earTraining/canvas/earTrainingBattleBackground';
import { drawHpBar } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import {
  getFloorY,
  getHpBarLayout,
  HUD_HEIGHT,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';
import type { BackgroundCacheState } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  DEFENSE_ENEMY_CONFIG,
  DEFENSE_ENEMY_DRAW_ORDER,
  DEFENSE_GROUND_Y,
  DEFENSE_IMPACT_HITBACK_SEC,
  DEFENSE_IMPACT_SEC,
  DEFENSE_IMPACT_SPARK_ANGLES,
  DEFENSE_SLASH_SEC,
  getDefenseEnemyAttackDx,
  getDefenseEnemyAttackDy,
  getDefenseFlyingBobOffset,
  isDefenseEnemyAttacking,
  pickDefenseEnemyFrame,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';
import type { DefenseSceneHud } from '@/game/defense/defenseSceneHud';
import type { DefenseEnemyType, DefenseRuntime } from '@/game/defense/defenseTypes';
import {
  DEFENSE_MAP_WIDTH,
  DEFENSE_NO_IMPACT,
  DEFENSE_NO_SLASH,
} from '@/game/defense/defenseTypes';

const HUD_FONT = 'Arial, sans-serif';
const IMPACT_RING_COLOR = '#fbbf24';
const IMPACT_SPARK_COLOR = '#fef08a';
const SLASH_GLOW_COLOR = 'rgba(34, 211, 238, 0.55)';
const SLASH_CORE_COLOR = '#f8fafc';
const FLYING_Y_OFFSET = 90;
const PLAYER_X_RATIO = 0.23;

export interface DefenseSceneAssets {
  readonly loadedImages: Map<string, HTMLImageElement>;
  readonly backgroundCache: BackgroundCacheState;
  readonly playerAvatarUrl: string;
}

export { invalidateBackgroundCache };

const drawImpactEffect = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  scaleX: number,
  floorY: number,
  spriteScale: number,
): void => {
  if (runtime.impactAt === DEFENSE_NO_IMPACT) return;
  const age = runtime.elapsedSec - runtime.impactAt;
  if (age < 0 || age > DEFENSE_IMPACT_SEC) return;

  const cx = runtime.impactX * scaleX;
  const cy = floorY - (DEFENSE_GROUND_Y - runtime.impactY) * spriteScale;
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

const drawSlashEffect = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  scaleX: number,
  floorY: number,
  spriteScale: number,
): void => {
  if (runtime.slashAt === DEFENSE_NO_SLASH) return;
  const age = runtime.elapsedSec - runtime.slashAt;
  if (age < 0 || age > DEFENSE_SLASH_SEC) return;

  const fromX = runtime.slashFromX * scaleX;
  const toX = runtime.slashToX * scaleX;
  const y = floorY - 40 * spriteScale;
  const alpha = 1 - age / DEFENSE_SLASH_SEC;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';

  ctx.strokeStyle = SLASH_GLOW_COLOR;
  ctx.lineWidth = 6 * spriteScale;
  ctx.beginPath();
  ctx.moveTo(fromX, y);
  ctx.lineTo(toX, y);
  ctx.stroke();

  ctx.strokeStyle = SLASH_CORE_COLOR;
  ctx.lineWidth = 2 * spriteScale;
  ctx.beginPath();
  ctx.moveTo(fromX, y);
  ctx.lineTo(toX, y);
  ctx.stroke();

  ctx.restore();
};

const drawEnemyShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  floorY: number,
  spriteScale: number,
): void => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x, floorY + 4, 18 * spriteScale, 5 * spriteScale, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawEnemiesOfType = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  type: DefenseEnemyType,
  atlas: DefenseEnemySpriteAtlas,
  scaleX: number,
  floorY: number,
  spriteScale: number,
): void => {
  const sprites = atlas.get(type);
  if (!sprites) return;
  const config = DEFENSE_ENEMY_CONFIG[type];
  const drawHeight = config.spriteHeight * spriteScale;
  const drawWidth = drawHeight * config.aspectRatio;

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

    let drawX = enemy.x * scaleX;
    let footOffset = 0;
    if (attacking) {
      const attackElapsed = runtime.elapsedSec - enemy.lastAttackAt;
      drawX += getDefenseEnemyAttackDx(attackElapsed) * scaleX;
      footOffset += getDefenseEnemyAttackDy(attackElapsed, config.isFlying) * spriteScale;
    }
    if (config.isFlying) {
      footOffset -= FLYING_Y_OFFSET * spriteScale;
      footOffset += getDefenseFlyingBobOffset(runtime.elapsedSec, enemy.slotIndex) * spriteScale;
    }

    drawEnemyShadow(ctx, drawX, floorY, spriteScale);
    const top = floorY + footOffset - drawHeight;
    ctx.drawImage(img, drawX - drawWidth / 2, top, drawWidth, drawHeight);
  }
};

const drawDefenseHud = (
  ctx: CanvasRenderingContext2D,
  width: number,
  hud: DefenseSceneHud,
): void => {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.66)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.fillRect(0, 0, width, HUD_HEIGHT);
  ctx.strokeRect(0, 0, width, HUD_HEIGHT);

  const hpLayout = getHpBarLayout(width);
  drawHpBar(ctx, hpLayout.leftX, 16, hpLayout.barWidth, hud.playerHp, hud.playerMaxHp, true);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 30px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${hud.remainSec}s`, width / 2, 18);

  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 14px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`KO ${hud.enemiesDefeated}`, width / 2, 56);

  const itemWidth = 82;
  const leftMargin = 16;
  const availableWidth = Math.max(itemWidth, width - leftMargin * 2);
  const visibleCount = Math.max(1, Math.min(hud.chordNames.length, Math.floor(availableWidth / itemWidth)));
  const activeIndex = Math.min(Math.max(hud.chordIndex, 0), Math.max(0, hud.chordNames.length - 1));
  const firstVisibleIndex = Math.max(0, Math.min(activeIndex - visibleCount + 1, hud.chordNames.length - visibleCount));
  const chordsCount = Math.min(visibleCount, hud.chordNames.length - firstVisibleIndex);
  const startX = leftMargin + (availableWidth - itemWidth * chordsCount) / 2;
  const chipY = 104;

  for (let index = 0; index < chordsCount; index += 1) {
    const chordIndex = firstVisibleIndex + index;
    const name = hud.chordNames[chordIndex] ?? '';
    const active = chordIndex === activeIndex;
    const x = startX + index * itemWidth;
    const boxW = itemWidth - 6;
    const boxH = 26;
    const boxX = x + (itemWidth - boxW) / 2;
    ctx.fillStyle = active ? '#facc15' : 'rgba(2, 6, 23, 0.72)';
    ctx.strokeStyle = active ? 'rgba(254, 240, 138, 0.9)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.fillRect(boxX, chipY, boxW, boxH);
    ctx.strokeRect(boxX, chipY, boxW, boxH);
    ctx.fillStyle = active ? '#020617' : '#e2e8f0';
    ctx.font = `900 13px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, boxX + boxW / 2, chipY + boxH / 2);
  }

  if (hud.practiceMode) {
    const badge = 'PRACTICE';
    ctx.font = `900 11px ${HUD_FONT}`;
    const badgeW = ctx.measureText(badge).width + 16;
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(width / 2 + 60, 26, badgeW, 20);
    ctx.fillStyle = '#083344';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(badge, width / 2 + 68, 29);
  }
};

const drawImpactFlash = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: DefenseRuntime,
): void => {
  if (runtime.impactAt === DEFENSE_NO_IMPACT) return;
  const age = runtime.elapsedSec - runtime.impactAt;
  if (age < 0 || age > DEFENSE_IMPACT_SEC) return;
  ctx.save();
  ctx.fillStyle = `rgba(239, 68, 68, ${0.18 * (1 - age / DEFENSE_IMPACT_SEC)})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

export const drawDefenseScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: DefenseRuntime,
  hud: DefenseSceneHud,
  atlas: DefenseEnemySpriteAtlas | null,
  assets: DefenseSceneAssets | null,
): void => {
  const scaleX = width / DEFENSE_MAP_WIDTH;
  const floorY = getFloorY(height);
  const stageHeight = Math.max(1, floorY - HUD_HEIGHT);
  const spriteScale = Math.min(scaleX, stageHeight / 320);

  if (assets) {
    drawCachedBackground(ctx, width, height, assets.backgroundCache, assets.loadedImages);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  }

  if (atlas) {
    for (let d = 0; d < DEFENSE_ENEMY_DRAW_ORDER.length; d += 1) {
      drawEnemiesOfType(
        ctx,
        runtime,
        DEFENSE_ENEMY_DRAW_ORDER[d],
        atlas,
        scaleX,
        floorY,
        spriteScale,
      );
    }
  }

  let playerX = width * PLAYER_X_RATIO;
  if (runtime.impactAt !== DEFENSE_NO_IMPACT) {
    const impactAge = runtime.elapsedSec - runtime.impactAt;
    if (impactAge >= 0 && impactAge < DEFENSE_IMPACT_HITBACK_SEC) {
      playerX -= 8 * spriteScale;
    }
  }

  const playerImg = assets?.loadedImages.get(assets.playerAvatarUrl);
  const impactActive = runtime.impactAt !== DEFENSE_NO_IMPACT
    && runtime.elapsedSec - runtime.impactAt >= 0
    && runtime.elapsedSec - runtime.impactAt < DEFENSE_IMPACT_SEC;

  drawBattleAvatar(ctx, playerImg, playerX, floorY, 'player', {
    tintColor: impactActive ? '#ef4444' : null,
    tintAlpha: impactActive ? 0.45 : undefined,
  });

  drawImpactEffect(ctx, runtime, scaleX, floorY, spriteScale);
  drawSlashEffect(ctx, runtime, scaleX, floorY, spriteScale);
  drawImpactFlash(ctx, width, height, runtime);
  drawDefenseHud(ctx, width, hud);
};
