import Foundation

/// 複合フレーズボス戦の固定ダメージ（ステータス補正なし）。Web `survivalCompositePhraseDamage.ts` と同値。
enum SurvivalCompositePhraseDamage {
    static let note: Int = 50
    static let measureRange: Int = 50
    static let phraseFinishPrimary: Int = 2000
    static let phraseFinishRepeat: Int = 100
}
