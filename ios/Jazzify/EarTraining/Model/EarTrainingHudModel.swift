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
    let hideTimeLabel: Bool
    /// チュートリアル等: プレイヤー／敵 HP 行を省略する（Web `hidePlayerHpBar` 相当）。
    let hidePlayerHpBar: Bool
    let hideSettingsButton: Bool
    let hideBackButton: Bool
    let enemyAttackGaugePercent: Double
    /// chord_quiz 等: 敵アタックゲージ行を HUD から省略する。
    let hideEnemyAttackGauge: Bool
    /// chord_osmd 等: コード名チップ行を隠す。
    let hideChordChips: Bool
    /// chord_osmd 等: 下部の解答スロット行を隠す。
    let hideSlotsRow: Bool
    let hudLabels: EarTrainingBattleHudLabels
    let gameState: EarTrainingGameState
    let phraseRunId: Int
    let chordChips: [EarTrainingChordChip]
    let slotRow: SlotRow
}
