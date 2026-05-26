/** Web / iOS 共通仕様: フレーズモードでは序盤コンボで与ダメを抑える */

export const PHRASE_EARLY_COMBO_DAMAGE_CAP = 50;
export const PHRASE_EARLY_COMBO_CAP_UNTIL = 5;

export const clampPhraseOutgoingDamage = (comboCount: number, rawDamage: number): number =>
  comboCount <= PHRASE_EARLY_COMBO_CAP_UNTIL
    ? Math.min(rawDamage, PHRASE_EARLY_COMBO_DAMAGE_CAP)
    : rawDamage;
