import SwiftUI

/// v3 `dialogue_only`: サバイバル画面（縦）+ キャラ吹き出し。耳コピバトル UI は使わない。
@MainActor
struct SurvivalTutorialV3DialogueScene: View {
    let script: SurvivalTutorialScriptPayloadV3
    let scene: SurvivalTutorialV3DialogueOnlyScene
    let locale: AppLocale
    let onCharacter: (String) -> Void
    let onDone: () -> Void

    @StateObject private var scenarioController = SurvivalScenarioController()
    @State private var runIdentity = UUID()
    @State private var tapNonce = 0
    @State private var pendingTapContinuation: CheckedContinuation<Void, Never>?

    private var isJapanese: Bool { locale == .ja }

    var body: some View {
        ZStack {
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

            if tapNonce > 0 {
                Color.black.opacity(0.001)
                    .contentShape(Rectangle())
                    .onTapGesture { fulfillTap() }
            }
        }
        .task(id: runIdentity) {
            await runDialogue()
        }
        .onDisappear {
            pendingTapContinuation?.resume()
            pendingTapContinuation = nil
        }
    }

    private var dialogueScenarioOverrides: SurvivalScenarioOverrides {
        var o = SurvivalTutorialV3Scenario.mergeBaseline(script: script)
        o.hideStaff = true
        o.hideHud = false
        o.hideStageTitle = true
        o.hideTimerDisplay = true
        o.hideKillCounter = true
        o.hidePauseButton = true
        o.hideHintBadge = true
        o.hideStatusStrip = true
        o.hideChordSlots = true
        o.hideChordPad = true
        o.hideComboBadge = true
        o.disableJoystick = true
        o.blockChordPadInput = true
        o.blockMidiGameInput = true
        o.blockSlotEvaluation = true
        o.disableSurvivalBgm = false
        return o
    }

    private var dialogueStageConfig: SurvivalStageConfig {
        let trimmed = script.audioTracks?.drum_loop?.url.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let url: URL?
        if trimmed.isEmpty {
            url = nil
        } else {
            url = URL(string: trimmed)
        }
        return SurvivalStageConfig(
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
            bgmUrl: url
        )
    }

    private func localized(_ t: SurvivalTutorialV3LocalizedText) -> String {
        locale == .ja ? t.ja : t.en
    }

    private func fulfillTap() {
        pendingTapContinuation?.resume()
        pendingTapContinuation = nil
        tapNonce = 0
    }

    private func awaitTap() async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            tapNonce &+= 1
            pendingTapContinuation = cont
        }
    }

    private func runDialogue() async {
        let lines = scene.lines
        guard !lines.isEmpty else {
            await MainActor.run { onDone() }
            return
        }

        let interval = scene.lineIntervalSeconds ?? 4

        await MainActor.run {
            scenarioController.setOverrides(dialogueScenarioOverrides)
            scenarioController.clearEnemies()
        }

        for (idx, line) in lines.enumerated() {
            if Task.isCancelled { return }
            await MainActor.run {
                onCharacter(localized(line))
            }

            async let raced: Void = SurvivalTutorialV3DialogueSleep.race(seconds: interval, tap: { await awaitTap() })
            _ = await raced

            if Task.isCancelled { return }
            if idx >= lines.count - 1 {
                break
            }
        }

        await MainActor.run {
            onCharacter("")
            onDone()
        }
    }
}

private enum SurvivalTutorialV3DialogueSleep {
    @MainActor
    static func seconds(_ s: Double) async {
        let ns = UInt64(max(0, s) * 1_000_000_000)
        try? await Task.sleep(nanoseconds: ns)
    }

    @MainActor
    static func race(seconds delaySeconds: Double, tap: @escaping () async -> Void) async {
        async let sleeper: Void = Self.seconds(delaySeconds)
        async let tapped: Void = tap()
        _ = await (sleeper, tapped)
    }
}
