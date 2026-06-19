import SwiftUI

/// v3 `dialogue_only`: サバイバル画面（縦）+ 話者別吹き出し。
@MainActor
struct SurvivalTutorialV3DialogueScene: View {
    let script: SurvivalTutorialScriptPayloadV3
    let scene: SurvivalTutorialV3DialogueOnlyScene
    let locale: AppLocale
    let tapHub: SurvivalTutorialTapAdvanceHub
    let worldSessionBox: SurvivalTutorialWorldSessionBox
    @Binding var faiBubbleLine: String
    @Binding var jajiiBubbleLine: String
    let onFai: (String) -> Void
    let onNarration: (String) -> Void
    let nextSceneIsFinish: Bool
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
            externalJajiiBubbleText: jajiiBubbleLine,
            externalPlayerBubbleText: faiBubbleLine,
            onSessionReady: { worldSessionBox.activate($0) }
        )
        .task(id: runIdentity) {
            await runDialogue()
        }
    }

    private var dialogueScenarioOverrides: SurvivalScenarioOverrides {
        var o = SurvivalTutorialV3Scenario.mergeBaseline(script: script)
        o.disableJoystick = false
        o.disableSurvivalBgm = true
        o.tutorialDialogueJajii = scene.hasJajiiSpeaker
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

        for (index, line) in lines.enumerated() {
            if Task.isCancelled { return }
            await MainActor.run {
                SurvivalTutorialV3LineRouter.present(
                    text: line,
                    locale: locale,
                    context: .dialogueOnly,
                    onFai: onFai,
                    onJajii: { jajiiBubbleLine = $0 },
                    onNarration: onNarration
                )
            }
            let isLastLine = index == lines.count - 1
            if !(isLastLine && nextSceneIsFinish) {
                await tapHub.waitForTapOrTimeout(seconds: interval)
            }
            if Task.isCancelled { return }
        }

        await MainActor.run {
            SurvivalTutorialV3LineRouter.clear(
                onFai: onFai,
                onJajii: { jajiiBubbleLine = $0 },
                onNarration: onNarration
            )
            onDone()
        }
    }
}
