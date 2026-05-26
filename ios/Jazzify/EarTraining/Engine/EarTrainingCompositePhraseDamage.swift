import Foundation

/// 耳コピ複合フレーズの固定ダメージ（ステータス補正なし）。Web `compositePhraseDamage.ts` と同一。
enum EarTrainingCompositePhraseDamage {
    static let note: Int = 50
    static let measureRange: Int = 50
    static let phraseFinishPrimary: Int = 2000
    static let phraseFinishRepeat: Int = 100
}
