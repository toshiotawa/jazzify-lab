import Foundation

extension EarTrainingTutorialUiOverrides {
    func apply(to hud: EarTrainingHudModel) -> EarTrainingHudModel {
        EarTrainingHudModel(
            playerHp: hud.playerHp,
            playerMaxHp: hud.playerMaxHp,
            enemyHp: hud.enemyHp,
            enemyMaxHp: hud.enemyMaxHp,
            practiceMode: hud.practiceMode,
            timeRemaining: hud.timeRemaining,
            timeLabel: hud.timeLabel,
            hideTimeLabel: hideLobby || hud.hideTimeLabel,
            hidePlayerHpBar: hidePlayerHpBar,
            hideSettingsButton: hideSettingsButton,
            hideBackButton: hideBackButton,
            enemyAttackGaugePercent: noCombat ? 0 : hud.enemyAttackGaugePercent,
            hideEnemyAttackGauge: noCombat || hideLobby || hud.hideEnemyAttackGauge,
            hideChordChips: hud.hideChordChips,
            hideSlotsRow: hud.hideSlotsRow,
            hudLabels: hud.hudLabels,
            gameState: hud.gameState,
            phraseRunId: hud.phraseRunId,
            chordChips: hud.chordChips,
            slotRow: hud.slotRow
        )
    }
}
