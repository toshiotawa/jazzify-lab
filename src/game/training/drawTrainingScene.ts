import { drawBattleAvatar } from '@/game/earTraining/canvas/earTrainingBattleActorDraw';
import {
  drawCachedBackground,
  invalidateBackgroundCache,
} from '@/game/earTraining/canvas/earTrainingBattleBackground';
import {
  CHARACTER_DISPLAY_SIZE,
  getFloorY,
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
import { pickTrainingPlayerPoseUrl } from '@/game/defense/defensePlayerSprites';
import type { TrainingSceneHud } from '@/game/training/trainingSceneHud';
import type { TrainingRuntime } from '@/game/training/trainingTypes';
import { TRAINING_HUD_HEIGHT_PX } from '@/game/training/trainingTypes';

const HUD_FONT = 'Arial, sans-serif';
const FLYING_Y_OFFSET = 90;
const SLASH_SCALE_UP_SEC = 0.14;
const SLASH_ROTATION_RAD = -4 * (Math.PI / 180);

const TRAINING_ENEMY_X_RATIO = 0.77;
const TRAINING_PLAYER_X_RATIO = 0.23;

export interface TrainingSceneAssets {
  readonly loadedImages: Map<string, HTMLImageElement>;
  readonly backgroundCache: BackgroundCacheState;
}

export { invalidateBackgroundCache };

const easeInOut = (t: number): number => (
  t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
);

const easeOut = (t: number): number => 1 - (1 - t) ** 2;

const isTrainingSlashActive = (
  elapsedSec: number,
  slashUntilSec: number,
): boolean => {
  if (slashUntilSec <= 0) return false;
  const remaining = slashUntilSec - elapsedSec;
  return remaining > 0 && remaining <= DEFENSE_SLASH_SEC;
};

const drawSlashEffect = (
  ctx: CanvasRenderingContext2D,
  width: number,
  floorY: number,
  elapsedSec: number,
  slashUntilSec: number,
  enemyOffsetX: number,
  spriteScale: number,
): void => {
  if (!isTrainingSlashActive(elapsedSec, slashUntilSec)) return;

  const age = DEFENSE_SLASH_SEC - (slashUntilSec - elapsedSec);
  const avatarSize = CHARACTER_DISPLAY_SIZE * spriteScale;
  const fromX = width * TRAINING_PLAYER_X_RATIO + avatarSize * 0.45;
  const fromY = floorY - avatarSize * 0.55;
  const toX = width * TRAINING_ENEMY_X_RATIO + enemyOffsetX;
  const toY = fromY;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const span = Math.hypot(dx, dy) + 48 * spriteScale;
  const slashWidth = span;
  const slashHeight = Math.max(4 * spriteScale, 11.25 * spriteScale * 0.032);
  const scaleT = Math.min(1, age / SLASH_SCALE_UP_SEC);
  const xScale = 0.5 + 0.5 * easeInOut(scaleT);
  const alpha = 1 - easeOut(age / DEFENSE_SLASH_SEC);
  const angle = Math.atan2(dy, dx) + SLASH_ROTATION_RAD;
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(midX, midY);
  ctx.rotate(angle);
  ctx.scale(xScale, 1);

  const gradient = ctx.createLinearGradient(-slashWidth / 2, 0, slashWidth / 2, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.04, 'rgba(255, 255, 255, 0.88)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.96, 'rgba(255, 255, 255, 0.88)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(-slashWidth / 2, -slashHeight / 2, slashWidth, slashHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(
    -slashWidth * 0.42,
    -1 * spriteScale,
    slashWidth * 0.84,
    2 * spriteScale,
  );

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
  ctx.fillRect(0, 0, width, TRAINING_HUD_HEIGHT_PX);
  ctx.strokeRect(0, 0, width, TRAINING_HUD_HEIGHT_PX);

  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 18px ${HUD_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE ${hud.score}`, 18, TRAINING_HUD_HEIGHT_PX / 2);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 30px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (hud.phase === 'countdown') {
    ctx.fillText(String(hud.countdownSec), width / 2, TRAINING_HUD_HEIGHT_PX / 2);
  } else {
    ctx.fillText(hud.endless ? '∞' : `${hud.remainSec}s`, width / 2, TRAINING_HUD_HEIGHT_PX / 2);
  }
};

const drawTrainingEnemySprite = (
  ctx: CanvasRenderingContext2D,
  width: number,
  floorY: number,
  typeIndex: number,
  alpha: number,
  offsetX: number,
  elapsedSec: number,
  spriteScale: number,
  atlas: DefenseEnemySpriteAtlas | null,
  moving: boolean,
  attacking: boolean,
): void => {
  const enemyType = DEFENSE_ENEMY_TYPES[typeIndex % DEFENSE_ENEMY_TYPES.length] ?? 'slime';
  const config = DEFENSE_ENEMY_CONFIG[enemyType];
  const sprites = atlas?.get(enemyType);
  const drawHeight = config.spriteHeight * spriteScale;
  const drawWidth = drawHeight * config.aspectRatio;
  const ex = width * TRAINING_ENEMY_X_RATIO + offsetX;
  let footOffset = 0;
  if (config.isFlying) {
    footOffset -= FLYING_Y_OFFSET * spriteScale;
    footOffset += getDefenseFlyingBobOffset(elapsedSec, typeIndex) * spriteScale;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(ex, floorY + 4, 18 * spriteScale, 5 * spriteScale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sprites) {
    const frame = pickDefenseEnemyFrame(
      elapsedSec,
      typeIndex,
      moving,
      config.isFlying,
      attacking,
    );
    const img = frame === 'idle' ? sprites.idle : sprites.move;
    ctx.drawImage(img, ex - drawWidth / 2, floorY + footOffset - drawHeight, drawWidth, drawHeight);
  }
  ctx.restore();
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
  const stageHeight = Math.max(1, floorY - TRAINING_HUD_HEIGHT_PX);
  const spriteScale = Math.min(width / 800, stageHeight / 320);

  if (assets) {
    drawCachedBackground(ctx, width, height, assets.backgroundCache, assets.loadedImages);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  }

  const dying = runtime.dyingEnemy;
  const dyingSlashActive = dying.active
    && isTrainingSlashActive(runtime.elapsedSec, dying.slashUntilSec);

  if (dying.active) {
    drawTrainingEnemySprite(
      ctx,
      width,
      floorY,
      dying.typeIndex,
      dying.alpha,
      dying.offsetX,
      runtime.elapsedSec,
      spriteScale,
      atlas,
      !dyingSlashActive,
      dyingSlashActive,
    );
  }

  drawTrainingEnemySprite(
    ctx,
    width,
    floorY,
    runtime.enemy.typeIndex,
    runtime.enemy.fadeAlpha,
    0,
    runtime.elapsedSec,
    spriteScale,
    atlas,
    true,
    false,
  );

  const playerPoseUrl = pickTrainingPlayerPoseUrl(
    runtime.elapsedSec,
    dying.slashUntilSec,
    runtime.guardPoseUntilSec,
  );
  const playerImg = assets?.loadedImages.get(playerPoseUrl);
  drawBattleAvatar(ctx, playerImg, width * TRAINING_PLAYER_X_RATIO, floorY, 'player');

  if (dying.active && dying.slashUntilSec > 0) {
    drawSlashEffect(
      ctx,
      width,
      floorY,
      runtime.elapsedSec,
      dying.slashUntilSec,
      dying.offsetX,
      spriteScale,
    );
  }
  drawTrainingHud(ctx, width, hud);
};
