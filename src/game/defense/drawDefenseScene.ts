/**
 * Defense mode Canvas2D renderer (called imperatively from the game loop; no React state).
 */
import {
  drawBattleAvatar,
  drawTintedImageCopy,
} from '@/game/earTraining/canvas/earTrainingBattleActorDraw';
import { BATTLE_EFFECT_SPRITE_URLS } from '@/game/earTraining/canvas/earTrainingBattleImageAssets';
import {
  drawCachedBackground,
  invalidateBackgroundCache,
} from '@/game/earTraining/canvas/earTrainingBattleBackground';
import { drawHpBar } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import {
  CHARACTER_DISPLAY_SIZE,
  getFloorY,
  getHpBarLayout,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';
import { DEFENSE_HUD_HEIGHT_PX } from '@/game/defense/defenseSceneLayout';
import type { BackgroundCacheState } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  DEFENSE_ENEMY_CONFIG,
  DEFENSE_ENEMY_DRAW_ORDER,
  DEFENSE_GROUND_Y,
  DEFENSE_IMPACT_HITBACK_SEC,
  DEFENSE_IMPACT_SEC,
  DEFENSE_DAMAGE_POPUP_SEC,
  DEFENSE_HIT_FLASH_SEC,
  DEFENSE_IMPACT_SPARK_ANGLES,
  DEFENSE_SLASH_SEC,
  DEFENSE_SP_MAX,
  DEFENSE_WAVE_COUNT,
  getDefenseEnemyAttackDx,
  getDefenseEnemyAttackDy,
  getDefenseFlyingBobOffset,
  isDefenseEnemyAttacking,
  pickDefenseEnemyFrame,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseEnemySpriteAtlas } from '@/game/defense/defenseEnemySprites';
import { pickDefensePlayerPoseUrl } from '@/game/defense/defensePlayerSprites';
import { defenseLogicalToScreenX } from '@/game/defense/defenseSceneLayout';
import type { DefenseSceneHud } from '@/game/defense/defenseSceneHud';
import type { DefenseEnemyType, DefenseRuntime } from '@/game/defense/defenseTypes';
import {
  DEFENSE_MAP_WIDTH,
  DEFENSE_NO_HIT_FLASH,
  DEFENSE_NO_IMPACT,
  DEFENSE_NO_SLASH,
  DEFENSE_PLAYER_X,
} from '@/game/defense/defenseTypes';

const HUD_FONT = 'Arial, sans-serif';
const IMPACT_RING_COLOR = '#fbbf24';
const IMPACT_SPARK_COLOR = '#fef08a';
const FLYING_Y_OFFSET = 90;
const SLASH_SCALE_UP_SEC = 0.14;
const SLASH_ROTATION_RAD = -4 * (Math.PI / 180);

export interface DefenseSceneAssets {
  readonly loadedImages: Map<string, HTMLImageElement>;
  readonly backgroundCache: BackgroundCacheState;
}

export { invalidateBackgroundCache };

const easeInOut = (t: number): number => (
  t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
);

const easeOut = (t: number): number => 1 - (1 - t) ** 2;

const drawImpactEffect = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  width: number,
  floorY: number,
  spriteScale: number,
): void => {
  if (runtime.impactAt === DEFENSE_NO_IMPACT) return;
  const age = runtime.elapsedSec - runtime.impactAt;
  if (age < 0 || age > DEFENSE_IMPACT_SEC) return;

  const cx = defenseLogicalToScreenX(width, runtime.impactX);
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
  width: number,
  floorY: number,
  spriteScale: number,
): void => {
  if (runtime.slashAt === DEFENSE_NO_SLASH) return;
  const age = runtime.elapsedSec - runtime.slashAt;
  if (age < 0 || age > DEFENSE_SLASH_SEC) return;

  const playerScreenX = defenseLogicalToScreenX(width, runtime.playerX);
  const avatarSize = CHARACTER_DISPLAY_SIZE * spriteScale;
  const fromX = playerScreenX + avatarSize * 0.45;
  const fromY = floorY - avatarSize * 0.55;
  const toX = defenseLogicalToScreenX(width, runtime.slashToX);
  const toY = floorY - (DEFENSE_GROUND_Y - runtime.slashY) * spriteScale;

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

const drawEnemyHpBar = (
  ctx: CanvasRenderingContext2D,
  drawX: number,
  top: number,
  drawWidth: number,
  hp: number,
  maxHp: number,
): void => {
  const barWidth = drawWidth * 0.8;
  const barHeight = 4;
  const barX = drawX - barWidth / 2;
  const barY = top - 6;
  const percent = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = '#fb7185';
  ctx.fillRect(barX, barY, barWidth * percent, barHeight);
};

const drawEnemiesOfType = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  type: DefenseEnemyType,
  atlas: DefenseEnemySpriteAtlas,
  width: number,
  floorY: number,
  spriteScale: number,
  showPhraseUi: boolean,
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

    let logicalX = enemy.x;
    if (attacking) {
      const attackElapsed = runtime.elapsedSec - enemy.lastAttackAt;
      logicalX += getDefenseEnemyAttackDx(attackElapsed);
    }
    const drawX = defenseLogicalToScreenX(width, logicalX);
    let footOffset = 0;
    if (attacking) {
      const attackElapsed = runtime.elapsedSec - enemy.lastAttackAt;
      footOffset += getDefenseEnemyAttackDy(attackElapsed, config.isFlying) * spriteScale;
    }
    if (config.isFlying) {
      footOffset -= FLYING_Y_OFFSET * spriteScale;
      footOffset += getDefenseFlyingBobOffset(runtime.elapsedSec, enemy.slotIndex) * spriteScale;
    }

    drawEnemyShadow(ctx, drawX, floorY, spriteScale);
    const top = floorY + footOffset - drawHeight;
    ctx.drawImage(img, drawX - drawWidth / 2, top, drawWidth, drawHeight);

    const hitFlashActive = enemy.hitFlashAt !== DEFENSE_NO_HIT_FLASH
      && runtime.elapsedSec - enemy.hitFlashAt < DEFENSE_HIT_FLASH_SEC;
    if (hitFlashActive) {
      drawTintedImageCopy(
        ctx,
        img,
        drawX - drawWidth / 2,
        top,
        drawWidth,
        drawHeight,
        '#ef4444',
        0.55,
      );
    }

    if (showPhraseUi) {
      drawEnemyHpBar(ctx, drawX, top, drawWidth, enemy.hp, enemy.maxHp);
    }
  }
};

const drawDamagePopups = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  width: number,
  floorY: number,
  spriteScale: number,
): void => {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(16 * spriteScale)}px ${HUD_FONT}`;

  for (const popup of runtime.damagePopups) {
    if (!popup.active) continue;
    const age = runtime.elapsedSec - popup.spawnedAt;
    if (age < 0 || age > DEFENSE_DAMAGE_POPUP_SEC) continue;

    const progress = age / DEFENSE_DAMAGE_POPUP_SEC;
    const screenX = defenseLogicalToScreenX(width, popup.x);
    const screenY = floorY - (DEFENSE_GROUND_Y - popup.y) * spriteScale - progress * 28 * spriteScale;
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = '#fef08a';
    ctx.fillText(String(popup.value), screenX, screenY);
  }
  ctx.restore();
};

const drawSpGauge = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  playerX: number,
  floorY: number,
  avatarSize: number,
): void => {
  const gaugeY = floorY - avatarSize - 14;
  const segmentWidth = 10;
  const segmentGap = 3;
  const totalWidth = DEFENSE_SP_MAX * segmentWidth + (DEFENSE_SP_MAX - 1) * segmentGap;
  const startX = playerX - totalWidth / 2;

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `900 10px ${HUD_FONT}`;
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('SP', startX - 6, gaugeY + 3);

  for (let i = 0; i < DEFENSE_SP_MAX; i += 1) {
    const x = startX + i * (segmentWidth + segmentGap);
    ctx.fillStyle = i < runtime.spGauge ? '#fbbf24' : 'rgba(100, 116, 139, 0.7)';
    ctx.fillRect(x, gaugeY, segmentWidth, 6);
  }
  ctx.restore();
};

const drawFireballs = (
  ctx: CanvasRenderingContext2D,
  runtime: DefenseRuntime,
  width: number,
  floorY: number,
  spriteScale: number,
  assets: DefenseSceneAssets,
): void => {
  const fireballImg = assets.loadedImages.get(BATTLE_EFFECT_SPRITE_URLS.fireball);
  if (!fireballImg) return;

  const size = 64 * spriteScale;
  for (const fb of runtime.fireballs) {
    if (!fb.active) continue;
    const screenX = defenseLogicalToScreenX(width, fb.x);
    const screenY = floorY - (DEFENSE_GROUND_Y - fb.y) * spriteScale;
    ctx.drawImage(fireballImg, screenX - size / 2, screenY - size / 2, size, size);
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
  ctx.fillRect(0, 0, width, DEFENSE_HUD_HEIGHT_PX);
  ctx.strokeRect(0, 0, width, DEFENSE_HUD_HEIGHT_PX);

  const hpLayout = getHpBarLayout(width);
  drawHpBar(ctx, hpLayout.leftX, 16, hpLayout.barWidth, hud.playerHp, hud.playerMaxHp, true);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  if (hud.practiceMode) {
    ctx.fillStyle = '#67e8f9';
    ctx.font = `900 30px ${HUD_FONT}`;
    ctx.fillText('PRACTICE', width / 2, 18);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 30px ${HUD_FONT}`;
    ctx.fillText(`${hud.remainSec}s`, width / 2, 18);
  }

  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 14px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  const koLabel = hud.wave > 0
    ? `KO ${hud.enemiesDefeated}  ·  WAVE ${hud.wave}/${DEFENSE_WAVE_COUNT}`
    : `KO ${hud.enemiesDefeated}`;
  ctx.fillText(koLabel, width / 2, 56);
};

const DEFENSE_LEVEL_UP_SEC = 1.5;
const LEVEL_UP_GREEN = '#22c55e';
const drawLevelUpEffect = (
  ctx: CanvasRenderingContext2D,
  playerX: number,
  floorY: number,
  avatarSize: number,
  runtime: DefenseRuntime,
  hud: DefenseSceneHud,
): void => {
  if (hud.practiceMode || hud.wave <= 1 || runtime.waveStartedAt < 0) return;
  const age = runtime.elapsedSec - runtime.waveStartedAt;
  if (age < 0 || age > DEFENSE_LEVEL_UP_SEC) return;

  const progress = age / DEFENSE_LEVEL_UP_SEC;
  const alpha = 1 - progress;
  const headY = floorY - avatarSize * 0.96;
  const labelY = headY - 18 - progress * 28;

  ctx.save();

  const ringRadius = avatarSize * (0.55 + progress * 0.35);
  ctx.strokeStyle = `rgba(34, 197, 94, ${0.55 * alpha})`;
  ctx.lineWidth = Math.max(2, avatarSize * 0.04);
  ctx.beginPath();
  ctx.arc(playerX, headY + avatarSize * 0.35, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < DEFENSE_IMPACT_SPARK_ANGLES.length; i += 1) {
    const angle = DEFENSE_IMPACT_SPARK_ANGLES[i] ?? 0;
    const inner = ringRadius * 0.55;
    const sparkLen = avatarSize * (0.12 + progress * 0.18);
    const cx = playerX + Math.cos(angle) * inner;
    const cy = headY + avatarSize * 0.35 + Math.sin(angle) * inner;
    ctx.strokeStyle = `rgba(134, 239, 172, ${0.85 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * sparkLen, cy + Math.sin(angle) * sparkLen);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(18 + 4 * alpha)}px ${HUD_FONT}`;
  ctx.strokeStyle = `rgba(6, 78, 59, ${0.9 * alpha})`;
  ctx.lineWidth = 4;
  ctx.strokeText('LEVEL UP', playerX, labelY);
  ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
  ctx.fillText('LEVEL UP', playerX, labelY);
  ctx.restore();
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
  const floorY = getFloorY(height);
  const stageHeight = Math.max(1, floorY - DEFENSE_HUD_HEIGHT_PX);
  const spriteScale = Math.min(width / DEFENSE_MAP_WIDTH, stageHeight / 320);

  if (assets) {
    drawCachedBackground(ctx, width, height, assets.backgroundCache, assets.loadedImages);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  }

  const showPhraseUi = runtime.attackTrigger === 'note';

  if (atlas) {
    for (let d = 0; d < DEFENSE_ENEMY_DRAW_ORDER.length; d += 1) {
      drawEnemiesOfType(
        ctx,
        runtime,
        DEFENSE_ENEMY_DRAW_ORDER[d],
        atlas,
        width,
        floorY,
        spriteScale,
        showPhraseUi,
      );
    }
  }

  let playerX = defenseLogicalToScreenX(width, DEFENSE_PLAYER_X);
  if (runtime.impactAt !== DEFENSE_NO_IMPACT) {
    const impactAge = runtime.elapsedSec - runtime.impactAt;
    if (impactAge >= 0 && impactAge < DEFENSE_IMPACT_HITBACK_SEC) {
      playerX -= 8 * spriteScale;
    }
  }

  const playerPoseUrl = pickDefensePlayerPoseUrl(runtime);
  const playerImg = assets?.loadedImages.get(playerPoseUrl);

  const impactActive = runtime.impactAt !== DEFENSE_NO_IMPACT
    && runtime.elapsedSec - runtime.impactAt >= 0
    && runtime.elapsedSec - runtime.impactAt < DEFENSE_IMPACT_SEC;
  const levelUpActive = !hud.practiceMode
    && hud.wave > 1
    && runtime.waveStartedAt >= 0
    && runtime.elapsedSec - runtime.waveStartedAt >= 0
    && runtime.elapsedSec - runtime.waveStartedAt < DEFENSE_LEVEL_UP_SEC;
  const avatarSize = CHARACTER_DISPLAY_SIZE * spriteScale;

  drawBattleAvatar(ctx, playerImg, playerX, floorY, 'player', {
    tintColor: impactActive ? '#ef4444' : levelUpActive ? LEVEL_UP_GREEN : null,
    tintAlpha: impactActive ? 0.45 : levelUpActive ? 0.42 : undefined,
  });

  if (assets && showPhraseUi) {
    drawFireballs(ctx, runtime, width, floorY, spriteScale, assets);
  }

  drawImpactEffect(ctx, runtime, width, floorY, spriteScale);
  drawSlashEffect(ctx, runtime, width, floorY, spriteScale);
  drawImpactFlash(ctx, width, height, runtime);

  if (showPhraseUi) {
    drawDamagePopups(ctx, runtime, width, floorY, spriteScale);
    drawSpGauge(ctx, runtime, playerX, floorY, avatarSize);
  }

  drawLevelUpEffect(ctx, playerX, floorY, avatarSize, runtime, hud);
  drawDefenseHud(ctx, width, hud);
};
