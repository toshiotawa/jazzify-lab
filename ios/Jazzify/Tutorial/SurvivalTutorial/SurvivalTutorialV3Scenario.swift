import Foundation

/// Web `survivalTutorialV3Scenario.ts` のうち、`SurvivalScenarioOverrides` が表現できる部分のみ。
enum SurvivalTutorialV3Scenario {
    /// `TUTORIAL_BOOTSTRAP` + UI フラグ合成（Freeze AI / spawn 抑制含む）。
    static func mergeBaseline(script: SurvivalTutorialScriptPayloadV3) -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.freezeAllEnemyAi = true
        o.suppressAutoSpawn = true
        let u = script.ui
        o.hidePlayerHpBar = u.hidePlayerHpBar
        o.playerInvincible = u.playerInvincible
        o.disableEnemyAttacks = u.disableEnemyAttacks
        return o
    }

    static func chordReveal(base: SurvivalScenarioOverrides) -> SurvivalScenarioOverrides {
        var out = base
        out.isActive = true
        out.hideHud = false
        out.hideStageTitle = true
        out.hideTimerDisplay = true
        out.hideKillCounter = true
        out.hidePauseButton = true
        out.hideHintBadge = true
        out.hideStatusStrip = true
        out.hideStaff = false
        out.hideChordSlots = false
        out.hideChordPad = false
        out.hideComboBadge = true
        out.scenarioStaffClef = 2
        out.hideStaffOnBSlotCompletion = true
        out.useChordMidiNotesForHintHighlights = true
        out.blockChordPadInput = false
        out.blockMidiGameInput = false
        out.blockSlotEvaluation = false
        return out
    }

    static func chordIntroBlock(base: SurvivalScenarioOverrides) -> SurvivalScenarioOverrides {
        var out = chordReveal(base: base)
        out.hideStaff = true
        out.hideChordSlots = true
        out.hideChordPad = false
        out.blockChordPadInput = true
        out.blockMidiGameInput = true
        out.blockSlotEvaluation = true
        return out
    }

    static func phraseIntroBlock(base: SurvivalScenarioOverrides) -> SurvivalScenarioOverrides {
        var out = phraseReveal(base: base)
        out.hideStaff = true
        out.blockChordPadInput = true
        out.blockMidiGameInput = true
        out.blockSlotEvaluation = true
        return out
    }

    static func phraseReveal(base: SurvivalScenarioOverrides) -> SurvivalScenarioOverrides {
        var out = base
        out.isActive = true
        out.hideHud = false
        out.hideStageTitle = true
        out.hideTimerDisplay = true
        out.hideKillCounter = true
        out.hidePauseButton = true
        out.hideHintBadge = true
        out.hideStatusStrip = true
        out.hideStaff = false
        out.hideChordSlots = true
        out.hideChordPad = false
        out.hideComboBadge = true
        out.blockChordPadInput = false
        out.blockMidiGameInput = false
        out.blockSlotEvaluation = true
        return out
    }

    static func showFinishCta(script: SurvivalTutorialScriptPayloadV3, scene: SurvivalTutorialV3Scene) -> Bool {
        if case let .finish = scene {
            return script.finish?.showCta ?? true
        }
        return false
    }

    static func finishCtaLabel(isEnglish: Bool) -> String {
        isEnglish ? "Continue" : "続ける"
    }
}
