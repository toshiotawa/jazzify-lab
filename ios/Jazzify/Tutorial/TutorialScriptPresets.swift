import Foundation

enum TutorialScriptPresets {
    static func scene1Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = false
        o.hideStageTitle = true
        o.hideTimerDisplay = true
        o.hideKillCounter = true
        o.hidePauseButton = true
        o.hideHintBadge = true
        o.hideStatusStrip = true
        o.hidePlayerHpBar = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideChordPad = true
        o.blockSlotEvaluation = true
        return o
    }

    static func scene2Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideComboBadge = true
        o.hideChordPad = false
        o.blockChordPadInput = true
        o.blockMidiGameInput = true
        o.blockSlotEvaluation = true
        return o
    }

    static func scene3Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = false
        o.hideStageTitle = true
        o.hideTimerDisplay = true
        o.hideKillCounter = true
        o.hidePauseButton = true
        o.hideHintBadge = true
        o.hideStatusStrip = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideChordPad = false
        o.hideComboBadge = true
        o.scenarioStaffClef = 1
        o.hideStaffOnBSlotCompletion = true
        o.useChordMidiNotesForHintHighlights = true
        o.disableJoystick = false
        o.blockSlotEvaluation = false
        o.blockChordPadInput = false
        o.blockMidiGameInput = false
        return o
    }

    static func scene4Cleanup() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideChordSlots = true
        o.hideStaff = true
        o.scenarioStaffClef = 1
        o.hideStaffOnBSlotCompletion = false
        o.useChordMidiNotesForHintHighlights = false
        o.blockSlotEvaluation = true
        o.bChordCompletionAttackOverride = nil
        o.bChordCompletionUseSpecial = false
        return o
    }

    static func scene5Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideComboBadge = true
        o.hideChordPad = false
        o.disableJoystick = false
        o.blockSlotEvaluation = true
        o.blockChordPadInput = false
        o.blockMidiGameInput = true
        return o
    }

    static func resolve(preset: String) -> SurvivalScenarioOverrides? {
        switch preset {
        case "scene1": return scene1Base()
        case "scene2": return scene2Base()
        case "scene3": return scene3Base()
        case "scene4Cleanup": return scene4Cleanup()
        case "scene5": return scene5Base()
        case "bootstrap": return OnboardingBootstrap.initial
        default: return nil
        }
    }
}
