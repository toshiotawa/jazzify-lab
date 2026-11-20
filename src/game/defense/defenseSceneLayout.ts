/**
 * Maps defense simulation logical X (800px map) to screen X for rendering.
 */
import { DEFENSE_ENEMY_CONFIG } from './defenseEnemyConfig';
import type { DefenseEnemyType } from './defenseTypes';
import { CHARACTER_DISPLAY_SIZE } from '../earTraining/canvas/earTrainingBattleLayout';
import {
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';

export const DEFENSE_PLAYER_X_RATIO = 0.23;
export const DEFENSE_SPAWN_X_RATIO = 0.97;

/** Defense HUD omits chord chips; React overlay shows current/next neon labels. */
export const DEFENSE_HUD_HEIGHT_PX = 88;

export const defenseLogicalToScreenX = (
  width: number,
  logicalX: number,
): number => {
  const playerScreenX = width * DEFENSE_PLAYER_X_RATIO;
  const spawnScreenX = width * DEFENSE_SPAWN_X_RATIO;
  const logicalSpan = DEFENSE_SPAWN_X - DEFENSE_PLAYER_X;
  if (logicalSpan <= 0) return playerScreenX;
  const t = (logicalX - DEFENSE_PLAYER_X) / logicalSpan;
  return playerScreenX + t * (spawnScreenX - playerScreenX);
};

const heroSizedEnemies: Partial<Record<DefenseEnemyType, { ratio: number; topInset: number }>> = {
  goblin: { ratio: 1.03, topInset: 5 },
  skeleton: { ratio: 1.16, topInset: 8 },
  wolf: { ratio: 0.86, topInset: 1 },
  golem: { ratio: 1.17, topInset: 6 },
  dragon: { ratio: 1.19, topInset: 3 },
};

const measureEnemy = (type: DefenseEnemyType, scale: number) => {
  const config = DEFENSE_ENEMY_CONFIG[type];
  const art = heroSizedEnemies[type];
  const originalHeight = config.spriteHeight * scale;
  const height = art ? CHARACTER_DISPLAY_SIZE * art.ratio : originalHeight;
  const growth = height - originalHeight;
  // Keep the leading contact point (6% across) and planted feet (row 27/28)
  // fixed in screen space. The simulation can retain its original attack ranges.
  const centerDx = growth * config.aspectRatio * (0.5 - 0.06);
  const footDy = growth / 28;
  return {
    scale,
    height,
    width: height * config.aspectRatio,
    centerDx,
    footDy,
    centerDy: footDy - growth / 2,
    hpInset: height * (art?.topInset ?? 0) / 28,
  };
};

const enemyLayouts = new Map<DefenseEnemyType, ReturnType<typeof measureEnemy>>();

export const getDefenseEnemyLayout = (type: DefenseEnemyType, scale: number) => {
  let layout = enemyLayouts.get(type);
  if (layout?.scale !== scale) {
    layout = measureEnemy(type, scale);
    enemyLayouts.set(type, layout);
  }
  return layout;
};
