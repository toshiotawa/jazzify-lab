import { drawBattleAvatar } from '@/game/earTraining/canvas/earTrainingBattleActorDraw';
import {
  drawCachedBackground,
  invalidateBackgroundCache,
  PLAYER_POSE_IMAGE_URLS,
} from '@/game/earTraining/canvas/earTrainingBattleBackground';
import { drawHpBar } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import {
  CHARACTER_DISPLAY_SIZE,
  getFloorY,
  getHpBarLayout,
  HUD_HEIGHT,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';
import type { BackgroundCacheState } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  DEFENSE_ENEMY_CONFIG,
  DEFENSE_SLASH_SEC,
  getDefenseFlyingBobOffset,
  pickDefenseEnemyFrame,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';
import { DEFENSE_ENEMY_TYPES } from '@/game/defense/defenseEnemyConfig';
import type { TrainingSceneHud } from '@/game/training/trainingSceneHud';
import type { TrainingRuntime } from '@/game/training/trainingTypes';

const HUD_FONT = 'Arial, sans-serif';
const SLASH_GLOW_COLOR = 'rgba(34, 211, 238, 0.55)';
const SLASH_CORE_COLOR = 'rgba(248, 250, 252, 0.95)';
const SLASH_SPARK_COLOR = 'rgba(186, 230, 253, 0.9)';
const FLYING_Y_OFFSET = 90;
const SLASH_GROW_PHASE = 0.4;
const SLASH_SPARK_ANGLES = [-0.35, -0.12, 0.12, 0.35] as const;

const TRAINING_ENEMY_X_RATIO = 0.77;
const TRAINING_PLAYER_X_RATIO = 0.23;

export interface TrainingSceneAssets {
  readonly loadedImages: Map<string, HTMLImageElement>;
  readonly backgroundCache: BackgroundCacheState;
  readonly playerAvatarUrl: string;
}

export { invalidateBackgroundCache };

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const appendTaperedSlashPath = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  halfWidth: number,
): void => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const nx = -dy / len;
  const ny = dx / len;
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const bulge = halfWidth * 1.15;

  ctx.moveTo(fromX + nx * halfWidth * 0.15, fromY + ny * halfWidth * 0.15);
  ctx.quadraticCurveTo(
    midX + nx * bulge,
    midY + ny * bulge,
    toX,
    toY,
  );
  ctx.quadraticCurveTo(
    midX - nx * bulge,
    midY - ny * bulge,
    fromX - nx * halfWidth * 0.15,
    fromY - ny * halfWidth * 0.15,
  );
  ctx.closePath();
};

const drawSlash = (
  ctx: CanvasRenderingContext2D,
  width: number,
  floorY: number,
  runtime: TrainingRuntime,
  spriteScale: number,
): void => {
  if (runtime.enemy.slashUntilSec <= 0) return;
  const remaining = runtime.enemy.slashUntilSec - runtime.elapsedSec;
  if (remaining <= 0 || remaining > DEFENSE_SLASH_SEC) return;

  const progress = 1 - remaining / DEFENSE_SLASH_SEC;
  const growT = Math.min(1, progress / SLASH_GROW_PHASE);
  const lengthScale = easeOutCubic(growT);
  const avatarSize = CHARACTER_DISPLAY_SIZE * spriteScale;
  const fromX = width * TRAINING_PLAYER_X_RATIO + avatarSize * 0.45;
  const fromY = floorY - avatarSize * 0.55;
  const toX = width * TRAINING_ENEMY_X_RATIO;
  const toY = fromY;
  const endX = fromX + (toX - fromX) * lengthScale;
  const endY = fromY + (toY - fromY) * lengthScale;
  const alpha = progress < SLASH_GROW_PHASE
    ? 1
    : 1 - ((progress - SLASH_GROW_PHASE) / (1 - SLASH_GROW_PHASE));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  appendTaperedSlashPath(ctx, fromX, fromY, endX, endY, 10 * spriteScale);
  ctx.fillStyle = SLASH_GLOW_COLOR;
  ctx.fill();
  ctx.beginPath();
  appendTaperedSlashPath(ctx, fromX, fromY, endX, endY, 4 * spriteScale);
  ctx.fillStyle = SLASH_CORE_COLOR;
  ctx.fill();

  if (lengthScale > 0.85) {
    const sparkLen = 14 * spriteScale * alpha;
    ctx.strokeStyle = SLASH_SPARK_COLOR;
    ctx.lineWidth = 1.5 * spriteScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < SLASH_SPARK_ANGLES.length; i += 1) {
      const angle = SLASH_SPARK_ANGLES[i];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX + cos * sparkLen, endY + sin * sparkLen);
    }
    ctx.stroke();
  }
  ctx.restore();
};

const drawTrainingHud = (
  ctx: CanvasRenderingContext2D,
  width: number,
  hud: TrainingSceneHud,
): void => {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.66)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.fillRect(0, 0, width, HUD_HEIGHT);
  ctx.strokeRect(0, 0, width, HUD_HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 30px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  if (hud.phase === 'countdown') {
    ctx.fillText(String(hud.countdownSec), width / 2, 18);
  } else {
    ctx.fillText(`${hud.remainSec}s`, width / 2, 18);
  }

  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 22px ${HUD_FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`KO ${hud.score}`, width - 18, 22);

  const hpLayout = getHpBarLayout(width);
  drawHpBar(
    ctx,
    hpLayout.rightX,
    16,
    hpLayout.barWidth,
    hud.enemyHp,
    hud.enemyMaxHp,
    false,
  );
};

export const drawTrainingScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: TrainingRuntime,
  hud: TrainingSceneHud,
  atlas: DefenseEnemySpriteAtlas | null,
  assets: TrainingSceneAssets | null,
): void => {
  const floorY = getFloorY(height);
  const stageHeight = Math.max(1, floorY - HUD_HEIGHT);
  const spriteScale = Math.min(width / 800, stageHeight / 320);

  if (assets) {
    drawCachedBackground(ctx, width, height, assets.backgroundCache, assets.loadedImages);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  }

  const enemyType = DEFENSE_ENEMY_TYPES[runtime.enemy.typeIndex % DEFENSE_ENEMY_TYPES.length] ?? 'slime';
  const config = DEFENSE_ENEMY_CONFIG[enemyType];
  const sprites = atlas?.get(enemyType);
  const drawHeight = config.spriteHeight * spriteScale;
  const drawWidth = drawHeight * config.aspectRatio;
  const ex = width * TRAINING_ENEMY_X_RATIO;
  let footOffset = 0;
  if (config.isFlying) {
    footOffset -= FLYING_Y_OFFSET * spriteScale;
    footOffset += getDefenseFlyingBobOffset(runtime.elapsedSec, runtime.enemy.typeIndex) * spriteScale;
  }

  ctx.save();
  ctx.globalAlpha = runtime.enemy.fadeAlpha;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(ex, floorY + 4, 18 * spriteScale, 5 * spriteScale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sprites) {
    const frame = pickDefenseEnemyFrame(
      runtime.elapsedSec,
      runtime.enemy.typeIndex,
      false,
      config.isFlying,
      false,
    );
    const img = frame === 'idle' ? sprites.idle : sprites.move;
    ctx.drawImage(img, ex - drawWidth / 2, floorY + footOffset - drawHeight, drawWidth, drawHeight);
  }
  ctx.restore();

  const showGuardPose = runtime.guardPoseUntilSec > 0
    && runtime.elapsedSec < runtime.guardPoseUntilSec;
  const guardImg = assets?.loadedImages.get(PLAYER_POSE_IMAGE_URLS.guardD);
  const playerImg = showGuardPose && guardImg
    ? guardImg
    : assets?.loadedImages.get(assets?.playerAvatarUrl ?? '');
  drawBattleAvatar(ctx, playerImg, width * TRAINING_PLAYER_X_RATIO, floorY, 'player');

  drawSlash(ctx, width, floorY, runtime, spriteScale);
  drawTrainingHud(ctx, width, hud);
};
