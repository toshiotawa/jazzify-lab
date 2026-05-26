import {
  clampPhraseOutgoingDamage,
  PHRASE_EARLY_COMBO_CAP_UNTIL,
  PHRASE_EARLY_COMBO_DAMAGE_CAP,
  shouldFirePhrasePlayerAttacks,
} from './survivalPhraseComboDamageCap';

describe('shouldFirePhrasePlayerAttacks', () => {
  it.each([1, 2, 3, PHRASE_EARLY_COMBO_CAP_UNTIL] as const)(
    'combo %i ではプレイヤー攻撃なし',
    combo => {
      expect(shouldFirePhrasePlayerAttacks(combo)).toBe(false);
    },
  );

  it('combo 6 以降はプレイヤー攻撃あり', () => {
    expect(shouldFirePhrasePlayerAttacks(PHRASE_EARLY_COMBO_CAP_UNTIL + 1)).toBe(true);
    expect(shouldFirePhrasePlayerAttacks(99)).toBe(true);
  });
});

describe('clampPhraseOutgoingDamage', () => {
  it.each([1, 2, 3, PHRASE_EARLY_COMBO_CAP_UNTIL] as const)(
    'combo %i で高い与ダメを cap',
    combo => {
      expect(clampPhraseOutgoingDamage(combo, 200)).toBe(PHRASE_EARLY_COMBO_DAMAGE_CAP);
    },
  );

  it.each([1, 3, PHRASE_EARLY_COMBO_CAP_UNTIL] as const)(
    'combo %i で cap 以下はそのまま',
    combo => {
      expect(clampPhraseOutgoingDamage(combo, 30)).toBe(30);
    },
  );

  it('combo 6 以降は非 cap', () => {
    expect(clampPhraseOutgoingDamage(PHRASE_EARLY_COMBO_CAP_UNTIL + 1, 200)).toBe(200);
    expect(clampPhraseOutgoingDamage(99, 12)).toBe(12);
  });
});
