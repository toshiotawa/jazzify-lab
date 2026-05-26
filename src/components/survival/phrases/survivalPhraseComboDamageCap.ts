/** Web / iOS 共通仕様: フレーズモード序盤コンボ */

export const PHRASE_EARLY_COMBO_DAMAGE_CAP = 50;
export const PHRASE_EARLY_COMBO_CAP_UNTIL = 5;

/** 1〜5コンボはプレイヤー攻撃を出さず、6コンボ目から発生 */
export const shouldFirePhrasePlayerAttacks = (comboCount: number): boolean =>
  comboCount > PHRASE_EARLY_COMBO_CAP_UNTIL;

export const clampPhraseOutgoingDamage = (comboCount: number, rawDamage: number): number =>
  comboCount <= PHRASE_EARLY_COMBO_CAP_UNTIL
    ? Math.min(rawDamage, PHRASE_EARLY_COMBO_DAMAGE_CAP)
    : rawDamage;
