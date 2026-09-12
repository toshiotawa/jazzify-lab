/**
 * Maps defense simulation logical X (800px map) to screen X for rendering.
 */
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
