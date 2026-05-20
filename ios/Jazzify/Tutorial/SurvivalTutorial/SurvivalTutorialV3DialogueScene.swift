import SwiftUI

/// v3 `dialogue_only`: サバイバル画面（縦）+ キャラ吹き出し。耳コピバトル UI は使わない。
@MainActor
struct SurvivalTutorialV3DialogueScene: View {
    let script: SurvivalTutorialScriptPayloadV3
    let scene: SurvivalTutorialV3DialogueOnlyScene
    let locale: AppLocale
    let tapHub: SurvivalTutorialTapAdvanceHub
    let onCharacter: (String) -> Void
    let onDone: () -> Void

    @StateObject private var scenarioController = SurvivalScenarioController()
    @State private var runIdentity = UUID()

    var body: some View {
        SurvivalGameView(
            stage: OnboardingChords.stageDefinition,
            hintMode: true,
            characterId: "fai",
            locale: locale,
            onClose: {},
            isDemo: true,
            configOverride: dialogueStageConfig,
            scenarioOverrides: dialogueScenarioOverrides,
            scenarioController: scenarioController,
            inlinePhraseDefinition: nil,
            onSessionReady: { _ in }
        )
        .task(id: runIdentity) {
            await runDialogue()
        }
    }

    private var dialogueScenarioOverrides: SurvivalScenarioOverrides {
        var o = SurvivalTutorialV3Scenario.mergeBaseline(script: script)
        o.disableJoystick = false
        o.disableSurvivalBgm = true
        return o
    }

    private var dialogueStageConfig: SurvivalStageConfig {
        SurvivalStageConfig(
            difficulty: "easy",
            displayName: "Tutorial",
            description: "Tutorial",
            descriptionEn: "Tutorial",
            allowedChords: [],
            enemySpawnRate: 3,
            enemySpawnCount: 2,
            enemyStatMultiplier: 0.5,
            expMultiplier: 0.5,
            itemDropRate: 0.1,
            bgmUrl: nil
        )
    }

    private func localized(_ t: SurvivalTutorialV3LocalizedText) -> String {
        locale == .ja ? t.ja : t.en
    }

    private func runDialogue() async {
        let lines = scene.lines
        guard !lines.isEmpty else {
            await MainActor.run { onDone() }
            return
        }

        let interval = scene.lineIntervalSeconds ?? SurvivalTutorialV3Constants.dialogueLineSeconds

        await MainActor.run {
            scenarioController.setOverrides(dialogueScenarioOverrides)
            scenarioController.clearEnemies()
        }

        for line in lines {
            if Task.isCancelled { return }
            await MainActor.run {
                onCharacter(localized(line))
            }
            await tapHub.waitForTapOrTimeout(seconds: interval)
            if Task.isCancelled { return }
        }

        await MainActor.run {
            onCharacter("")
            onDone()
        }
    }
}
