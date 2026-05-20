import SwiftUI

@MainActor
final class SurvivalTutorialContainer: ObservableObject {
    enum Gate {
        case loading
        case readyV2
        case readyV3(SurvivalTutorialScriptPayloadV3)
        case failed
    }

    @Published private(set) var gate: Gate = .loading
    @Published private(set) var stageDefinition: SurvivalStageDefinition = OnboardingChords.stageDefinition
    private(set) var interpreter: TutorialScriptInterpreter?

    let scriptId: String
    let locale: AppLocale

    init(scriptId: String, locale: AppLocale) {
        self.scriptId = scriptId
        self.locale = locale
    }

    func loadIfNeeded() async {
        guard case .loading = gate else { return }
        guard let loaded = await TutorialScriptService.fetchTutorialPayload(scriptId: scriptId) else {
            gate = .failed
            return
        }
        switch loaded {
        case let .interpretedV3(payload):
            interpreter = nil
            gate = .readyV3(payload)
        case let .interpretedV2(payload):
            stageDefinition = TutorialStageBuilder.buildStageDefinition(from: payload)
            interpreter = TutorialScriptInterpreter(locale: locale, payload: payload)
            gate = .readyV2
        }
    }

    func attach(session: SurvivalGameSession, controller: SurvivalScenarioController, onFinish: @escaping () -> Void) {
        interpreter?.attach(session: session, controller: controller, onFinish: onFinish)
    }

    func cancel() {
        interpreter?.cancel()
    }
}

/// DB 駆動サバイバルチュートリアル（レッスン課題 / オンボーディング共通）。
struct SurvivalTutorialView: View {
    let scriptId: String
    let locale: AppLocale
    let showSkip: Bool
    let onClose: () -> Void
    var onComplete: (() async -> Void)?

    @StateObject private var container: SurvivalTutorialContainer
    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var bgm = OnboardingBgmController()
    @State private var fadeOpacity: Double = 0

    init(
        scriptId: String,
        locale: AppLocale,
        showSkip: Bool = true,
        onClose: @escaping () -> Void,
        onComplete: (() async -> Void)? = nil
    ) {
        self.scriptId = scriptId
        self.locale = locale
        self.showSkip = showSkip
        self.onClose = onClose
        self.onComplete = onComplete
        _container = StateObject(wrappedValue: SurvivalTutorialContainer(scriptId: scriptId, locale: locale))
    }

    private var isJa: Bool { locale == .ja }

    var body: some View {
        Group {
            switch container.gate {
            case .loading:
                ProgressView(isJa ? "読み込み中…" : "Loading…")
            case .failed:
                VStack(spacing: 16) {
                    Text(isJa ? "この課題用のガイドはまだ準備中です。" : "Tutorial is not available for this lesson yet.")
                        .font(.headline)
                        .multilineTextAlignment(.center)
                    Button(isJa ? "戻る" : "Back") { onClose() }
                }
                .padding()
            case .readyV3(let scriptV3):
                SurvivalTutorialV3LessonView(
                    script: scriptV3,
                    locale: locale,
                    showSkip: showSkip,
                    onClose: onClose,
                    onComplete: onComplete
                )
            case .readyV2:
                if let interpreter = container.interpreter {
                    SurvivalTutorialReadyView(
                        interpreter: interpreter,
                        container: container,
                        scenarioController: scenarioController,
                        bgm: bgm,
                        locale: locale,
                        isJa: isJa,
                        showSkip: showSkip,
                        fadeOpacity: $fadeOpacity,
                        onClose: onClose,
                        onComplete: onComplete
                    )
                }
            }
        }
        .task(id: scriptId) {
            await container.loadIfNeeded()
        }
    }
}

private struct SurvivalTutorialReadyView: View {
    @ObservedObject var interpreter: TutorialScriptInterpreter
    @ObservedObject var container: SurvivalTutorialContainer
    @ObservedObject var scenarioController: SurvivalScenarioController
    @ObservedObject var bgm: OnboardingBgmController

    let locale: AppLocale
    let isJa: Bool
    let showSkip: Bool
    @Binding var fadeOpacity: Double
    let onClose: () -> Void
    let onComplete: (() async -> Void)?

    var body: some View {
        ZStack {
            SurvivalGameView(
                stage: container.stageDefinition,
                hintMode: true,
                characterId: "fai",
                locale: locale,
                onClose: onClose,
                isDemo: true,
                configOverride: OnboardingChords.stageConfig,
                scenarioOverrides: OnboardingBootstrap.initial,
                scenarioController: scenarioController,
                onSessionReady: { session in
                    container.attach(session: session, controller: scenarioController, onFinish: {
                        Task {
                            await onComplete?()
                            await MainActor.run {
                                withAnimation(.easeInOut(duration: 0.55)) { fadeOpacity = 1 }
                            }
                            try? await Task.sleep(nanoseconds: 550_000_000)
                            await MainActor.run { onClose() }
                        }
                    })
                }
            )

            OnboardingCharacterDialogView(text: interpreter.characterText)
            OnboardingNarrationCaptionView(text: interpreter.narrationText)
            Group {
                if let line = interpreter.connectedDeviceLine {
                    OnboardingDeviceConnectedBannerView(line: line)
                }
            }
            Group {
                if interpreter.showPillarCard,
                   let cap = interpreter.pillarCaption,
                   let sym = interpreter.pillarSystemImage {
                    OnboardingPillarCardView(
                        caption: cap,
                        systemImage: sym,
                        imageAssetName: interpreter.pillarImageAsset
                    )
                }
            }
            Group {
                if interpreter.showCta {
                    OnboardingCtaView(
                        isJa: isJa,
                        buttonTitle: SurvivalTutorialV3Scenario.demoPlayCtaLabel(isEnglish: locale == .en)
                    ) {
                        interpreter.userFinishedCta()
                    }
                }
            }

            if showSkip {
                VStack {
                    HStack {
                        Spacer()
                        OnboardingSkipButton(isJa: isJa) {
                            interpreter.skipTapped()
                        }
                        .padding(.trailing, 16)
                        .padding(.top, 16)
                    }
                    Spacer()
                }
            }

            Color.black.opacity(fadeOpacity)
                .ignoresSafeArea()
                .allowsHitTesting(fadeOpacity > 0.1)
        }
        .onAppear { bgm.start() }
        .onDisappear {
            bgm.stop()
            container.cancel()
        }
    }
}
