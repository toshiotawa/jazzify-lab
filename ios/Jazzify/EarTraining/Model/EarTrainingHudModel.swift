import Foundation

/// `EarTrainingHUDView` 用のスナップショット。コントローラから毎フレームではなく `@Published` 変更時に再計算する。
struct EarTrainingHudModel: Equatable {
    enum SlotRow: Equatable {
        /// 単音耳コピ: 音名スロット
        case melody(slots: [String], revealed: [String], currentIndex: Int)
        /// コード演奏: ハーモニー行ごとの丸スロット
        case chordVoicing(slotCount: Int, completed: [Bool], currentIndex: Int)
    }

    let playerHp: Int
    let playerMaxHp: Int
    let enemyHp: Int
    let enemyMaxHp: Int
    let practiceMode: Bool
    let timeRemaining: Int
    let timeLabel: String
    let enemyAttackGaugePercent: Double
    /// chord_quiz 等: 敵アタックゲージ行を HUD から省略する。
    let hideEnemyAttackGauge: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let gameState: EarTrainingGameState
    let phraseRunId: Int
    let chordChips: [EarTrainingChordChip]
    let slotRow: SlotRow
}
