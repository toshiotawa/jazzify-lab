import {
  DEFENSE_ENEMY_CONFIG,
  DEFENSE_GROUND_Y,
  DEFENSE_SLASH_SEC,
  getDefenseFlyingBobOffset,
  pickDefenseEnemyFrame,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';
import { DEFENSE_ENEMY_TYPES } from '@/game/defense/defenseEnemyConfig';
import type { TrainingRuntime } from '@/game/training/trainingTypes';
import { DEFENSE_MAP_HEIGHT, DEFENSE_MAP_WIDTH } from '@/game/defense/defenseTypes';

const SLASH_GLOW_COLOR = 'rgba(34, 211, 238, 0.55)';
const SLASH_CORE_COLOR = '#f8fafc';

const TRAINING_ENEMY_X_RATIO = 0.72;
const TRAINING_PLAYER_X_RATIO = 0.18;

const drawSlash = (
  ctx: CanvasRenderingContext2D,
  width: number,
  runtime: TrainingRuntime,
  spriteScale: number,
): void => {
  if (runtime.enemy.slashUntilSec <= 0) return;
  const remaining = runtime.enemy.slashUntilSec - runtime.elapsedSec;
  if (remaining <= 0 || remaining > DEFENSE_SLASH_SEC) return;
  const progress = 1 - remaining / DEFENSE_SLASH_SEC;
  const y = width * 0.55;
  const x1 = width * TRAINING_PLAYER_X_RATIO + 40;
  const x2 = width * TRAINING_ENEMY_X_RATIO - 20;
  ctx.save();
  ctx.globalAlpha = 1 - progress * 0.6;
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

export const drawTrainingScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: TrainingRuntime,
  atlas: DefenseEnemySpriteAtlas | null,
): void => {
  const scaleX = width / DEFENSE_MAP_WIDTH;
  const scaleY = height / DEFENSE_MAP_HEIGHT;
  const spriteScale = Math.min(scaleX, scaleY);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const groundY = DEFENSE_GROUND_Y * scaleY;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  const enemyType = DEFENSE_ENEMY_TYPES[runtime.enemy.typeIndex % DEFENSE_ENEMY_TYPES.length] ?? 'slime';
  const config = DEFENSE_ENEMY_CONFIG[enemyType];
  const sprites = atlas?.get(enemyType);
  const drawHeight = config.spriteHeight * spriteScale;
  const drawWidth = drawHeight * config.aspectRatio;
  const ex = width * TRAINING_ENEMY_X_RATIO;
  let ey = groundY - drawHeight + config.spriteHeight * spriteScale * 0.5;
  if (config.isFlying) {
    ey -= 90 * scaleY;
    ey += getDefenseFlyingBobOffset(runtime.elapsedSec, runtime.enemy.typeIndex) * scaleY;
  }

  ctx.save();
  ctx.globalAlpha = runtime.enemy.fadeAlpha;
  if (sprites) {
    const frame = pickDefenseEnemyFrame(
      runtime.elapsedSec,
      runtime.enemy.typeIndex,
      false,
      config.isFlying,
      false,
    );
    const img = frame === 'idle' ? sprites.idle : sprites.move;
    ctx.drawImage(img, ex - drawWidth / 2, ey - drawHeight, drawWidth, drawHeight);
  } else {
    ctx.font = `${48 * spriteScale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👾', ex, ey - drawHeight / 2);
  }
  ctx.restore();

  ctx.font = `${40 * spriteScale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🎹', width * TRAINING_PLAYER_X_RATIO, groundY - 10);

  drawSlash(ctx, width, runtime, spriteScale);
};
