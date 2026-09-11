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
const SLASH_CORE_COLOR = '#f8fafc';
const FLYING_Y_OFFSET = 90;

const TRAINING_ENEMY_X_RATIO = 0.77;
const TRAINING_PLAYER_X_RATIO = 0.23;

export interface TrainingSceneAssets {
  readonly loadedImages: Map<string, HTMLImageElement>;
  readonly backgroundCache: BackgroundCacheState;
  readonly playerAvatarUrl: string;
}

export { invalidateBackgroundCache };

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
  const y = floorY - 40 * spriteScale;
  const x1 = width * TRAINING_PLAYER_X_RATIO + 40 * spriteScale;
  const x2 = width * TRAINING_ENEMY_X_RATIO - 20 * spriteScale;

  ctx.save();
  ctx.globalAlpha = 1 - progress * 0.6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = SLASH_GLOW_COLOR;
  ctx.lineWidth = 8 * spriteScale;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.strokeStyle = SLASH_CORE_COLOR;
  ctx.lineWidth = 3 * spriteScale;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
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

  const playerImg = assets?.loadedImages.get(assets.playerAvatarUrl);
  drawBattleAvatar(ctx, playerImg, width * TRAINING_PLAYER_X_RATIO, floorY, 'player');

  drawSlash(ctx, width, floorY, runtime, spriteScale);
  drawTrainingHud(ctx, width, hud);
};
