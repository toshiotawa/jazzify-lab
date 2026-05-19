import type { EarTrainingTutorialUiOverrides } from './earTrainingTutorialScriptTypes';

export const isEarTrainingTutorialNoCombat = (
  ui?: EarTrainingTutorialUiOverrides | null,
): boolean => Boolean(ui?.disableEnemyAttacks ?? ui?.playerInvincible);

export interface EarTrainingTutorialBindings {
  ui: EarTrainingTutorialUiOverrides;
  isEnglishCopy: boolean;
  setCharacterText: (text: string) => void;
  onSceneComplete: () => void;
  onExit: () => void;
}

export const clampTutorialPlayerHp = (
  currentHp: number,
  damage: number,
  invincible: boolean,
): number => {
  if (invincible) {
    return Math.max(1, currentHp - damage);
  }
  return Math.max(0, currentHp - damage);
};

export const shouldTutorialBlockGameOver = (
  playerHp: number,
  invincible: boolean,
): boolean => invincible && playerHp <= 0;
