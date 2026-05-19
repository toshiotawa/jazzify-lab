import SwiftUI

/// 未ログイン向けオンボーディング: 下層が `SurvivalGameView`、上層が台本用オーバーレイ。
struct OnboardingView: View {
    let locale: AppLocale
    let onClose: () -> Void
    var onLessonComplete: (() async -> Void)?

    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var script: OnboardingScript
    @StateObject private var bgm = OnboardingBgmController()
    @State private var fadeOpacity: Double = 0

    init(
        locale: AppLocale,
        onClose: @escaping () -> Void,
        onLessonComplete: (() async -> Void)? = nil
    ) {
        self.locale = locale
        self.onClose = onClose
        self.onLessonComplete = onLessonComplete
        _script = StateObject(wrappedValue: OnboardingScript(locale: locale))
    }

    private var isJa: Bool { locale == .ja }

    var body: some View {
        ZStack {
            SurvivalGameView(
                stage: OnboardingChords.stageDefinition,
                hintMode: true,
                characterId: "fai",
                locale: locale,
                onClose: onClose,
                isDemo: true,
                configOverride: OnboardingChords.stageConfig,
                scenarioOverrides: OnboardingBootstrap.initial,
                scenarioController: scenarioController,
                onSessionReady: { session in
                    script.attach(session: session, controller: scenarioController, onFinish: {
                        Task {
                            await onLessonComplete?()
                            await MainActor.run {
                                withAnimation(.easeInOut(duration: 0.55)) { fadeOpacity = 1 }
                            }
                            try? await Task.sleep(nanoseconds: 550_000_000)
                            await MainActor.run { onClose() }
                        }
                    })
                }
            )

            OnboardingCharacterDialogView(text: script.characterText)
            OnboardingNarrationCaptionView(text: script.narrationText)
            Group {
                if let line = script.connectedDeviceLine {
                    OnboardingDeviceConnectedBannerView(line: line)
                }
            }
            Group {
                if script.showPillarCard, let cap = script.pillarCaption, let sym = script.pillarSystemImage {
                    OnboardingPillarCardView(
                        caption: cap,
                        systemImage: sym,
                        imageAssetName: script.pillarImageAsset
                    )
                }
            }
            Group {
                if script.showCta {
                    OnboardingCtaView(isJa: isJa) {
                        script.userFinishedCta()
                    }
                }
            }

            VStack {
                HStack {
                    Spacer()
                    OnboardingSkipButton(isJa: isJa) {
                        script.skipTapped()
                    }
                    .padding(.trailing, 16)
                    .padding(.top, 16)
                }
                Spacer()
            }

            Color.black.opacity(fadeOpacity)
                .ignoresSafeArea()
                .allowsHitTesting(fadeOpacity > 0.1)
        }
        .onAppear {
            bgm.start()
        }
        .onDisappear {
            bgm.stop()
        }
    }
}
