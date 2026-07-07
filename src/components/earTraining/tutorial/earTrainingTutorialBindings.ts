import type {
  EarTrainingTutorialOsmdSceneResult,
  EarTrainingTutorialUiOverrides,
} from './earTrainingTutorialScriptTypes';

/** 敵からの攻撃・敵ゲージ・プレイヤー被ダメージを抑止する（チュートリアル向け）。 */
export const isEarTrainingTutorialNoCombat = (
  ui?: EarTrainingTutorialUiOverrides | null,
): boolean => Boolean(ui?.disableEnemyAttacks ?? ui?.playerInvincible);

/** プレイヤーの火の玉・完成ダメージは通常通り発火させる（`noCombat` でも有効）。 */
export const shouldTutorialFirePlayerAttacks = (
  _ui?: EarTrainingTutorialUiOverrides | null,
): boolean => true;

export interface EarTrainingTutorialBindings {
  ui: EarTrainingTutorialUiOverrides;
  isEnglishCopy: boolean;
  setCharacterText: (text: string) => void;
  onSceneComplete: (result?: EarTrainingTutorialOsmdSceneResult) => void;
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
