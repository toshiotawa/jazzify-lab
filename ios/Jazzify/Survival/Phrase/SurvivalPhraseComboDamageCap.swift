import Foundation

/// Web `survivalPhraseComboDamageCap.ts` と整合するフレーズ序盤コンボによる与ダメ上限。
enum SurvivalPhraseComboDamageCap {
    /// コンボカウントがこれ以下のとき `maxOutgoingDamagePerHit` を適用する。
    static let earlyUntilCombo = 5
    static let maxOutgoingDamagePerHit = 50

    static func clampOutgoing(rawDamage: Int, isPhraseMode: Bool, comboCount: Int) -> Int {
        guard isPhraseMode, comboCount <= earlyUntilCombo else { return rawDamage }
        return min(rawDamage, maxOutgoingDamagePerHit)
    }
}
