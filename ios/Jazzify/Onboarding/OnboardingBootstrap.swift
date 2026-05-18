import Foundation

enum OnboardingBootstrap {
    /// `SurvivalGameView` 起動直後（シーン 1 冒頭）
    static var initial: SurvivalScenarioOverrides {
        var o = SurvivalScenarioOverrides()
        o.isActive = true
        o.hideHud = true
        o.hideChordSlots = true
        o.hideChordPad = true
        o.hideComboBadge = true
        o.hideStatusStrip = true
        o.hidePlayerHpBar = true
        o.disableJoystick = false
        o.disableTimeLimitClear = true
        o.disableKillQuotaClear = true
        o.disableResultScreen = true
        o.playerInvincible = true
        o.disableEnemyAttacks = true
        o.suppressAutoSpawn = true
        o.blockSlotEvaluation = true
        o.blockChordPadInput = true
        o.blockMidiGameInput = true
        o.disableSurvivalBgm = true
        return o
    }
}
