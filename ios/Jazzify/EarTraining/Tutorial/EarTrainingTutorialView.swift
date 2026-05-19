import SwiftUI

/// DB 駆動の耳コピバトルチュートリアル（レッスン課題用・ネイティブ）。
struct EarTrainingTutorialView: View {
    let scriptId: String
    let locale: AppLocale
    let onClose: () -> Void
    var onComplete: (() async -> Void)?

    @State private var gate: Gate = .loading
    @State private var script: EarTrainingTutorialScriptPayload?
    @State private var sceneIndex: Int = 0
    @State private var characterText: String = ""
    @State private var showFinishCta = false
    @StateObject private var bgm = OnboardingBgmController()

    private enum Gate {
        case loading
        case ready
        case failed
    }

    private var isJa: Bool { locale == .ja }

    var body: some View {
        Group {
            switch gate {
            case .loading:
                ProgressView(isJa ? "読み込み中…" : "Loading…")
            case .failed:
                VStack(spacing: 16) {
                    Text(isJa ? "チュートリアルを読み込めませんでした。" : "Could not load the tutorial.")
                        .multilineTextAlignment(.center)
                    Button(isJa ? "戻る" : "Back", action: onClose)
                }
                .padding()
            case .ready:
                if let script {
                    tutorialContent(script: script)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
        .task(id: scriptId) {
            gate = .loading
            if let loaded = await EarTrainingTutorialScriptService.fetchScript(scriptId: scriptId) {
                script = loaded
                sceneIndex = 0
                gate = .ready
            } else {
                gate = .failed
            }
        }
    }

    @ViewBuilder
    private func tutorialContent(script: EarTrainingTutorialScriptPayload) -> some View {
        let scenes = script.scenes
        let current = scenes.indices.contains(sceneIndex) ? scenes[sceneIndex] : nil

        ZStack {
            if let current {
                sceneView(script: script, scene: current)
            }

            OnboardingCharacterDialogView(text: characterText)

            if script.ui.showExitButton {
                VStack {
                    HStack {
                        Spacer()
                        Button(isJa ? "Exit" : "Exit") {
                            onClose()
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.15))
                        .clipShape(Capsule())
                        .padding(.trailing, 16)
                        .padding(.top, 16)
                    }
                    Spacer()
                }
            }

            if showFinishCta {
                OnboardingCtaView(isJa: isJa) {
                    Task {
                        await onComplete?()
                        onClose()
                    }
                }
            }
        }
        .onAppear { bgm.start() }
        .onDisappear { bgm.stop() }
    }

    @ViewBuilder
    private func sceneView(
        script: EarTrainingTutorialScriptPayload,
        scene: EarTrainingTutorialScene
    ) -> some View {
        switch scene {
        case .dialogueOnly(let dialogue):
            EarTrainingTutorialDialogueSceneView(
                lines: dialogue.lines,
                intervalSeconds: dialogue.lineIntervalSeconds ?? 4,
                drumLoopUrl: script.audioTracks?.drum_loop?.url,
                locale: locale,
                onLine: { characterText = $0 },
                onComplete: { advanceScene(script: script) }
            )
        case .chordQuiz(let quizScene):
            if let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: quizScene.contentRef
            ) {
                EarTrainingChordQuizGameView(
                    source: .embedded(stage),
                    lessonContext: nil,
                    locale: locale,
                    initialPracticeMode: false,
                    tutorialHooks: makeHooks(
                        script: script,
                        requiredLoops: quizScene.questionCount,
                        onLoopSuccess: nil,
                        quiz: EarTrainingTutorialQuizSceneHooks(
                            useProgressionOrder: quizScene.order == "progression",
                            answerTimeoutSeconds: quizScene.answerTimeoutSeconds,
                            onQuestionText: quizScene.dialogue.onQuestion.localized(locale),
                            onAutoAnswerText: quizScene.dialogue.onAutoAnswer.localized(locale)
                        )
                    ),
                    tutorialQuestionTarget: quizScene.questionCount,
                    onClose: onClose
                )
            }
        case .chordVoicingSelfPaced(let selfScene):
            if let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: selfScene.contentRef
            ) {
                EarTrainingChordVoicingGameView(
                    source: .embedded(stage),
                    lessonContext: nil,
                    locale: locale,
                    initialPracticeMode: false,
                    tutorialHooks: makeHooks(
                        script: script,
                        requiredLoops: selfScene.requiredSuccessfulLoops,
                        onLoopSuccess: {
                            characterText = selfScene.dialogue.onLoopSuccess.localized(locale)
                        }
                    ),
                    onClose: onClose
                )
                .onAppear {
                    characterText = selfScene.dialogue.onSceneStart.localized(locale)
                }
            }
        case .chordOsmd(let osmdScene):
            if let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: osmdScene.contentRef
            ) {
                EarTrainingChordOSMDGameView(
                    source: .embedded(stage),
                    lessonContext: nil,
                    locale: locale,
                    initialPracticeMode: osmdScene.playMode == "demo",
                    tutorialHooks: makeHooks(
                        script: script,
                        requiredLoops: osmdScene.requiredLoops,
                        onLoopSuccess: nil,
                        osmdDemoAutoplay: osmdScene.playMode == "demo"
                    ),
                    onClose: onClose
                )
            }
        case .finish:
            Color.clear
                .onAppear {
                    characterText = ""
                    showFinishCta = script.finish?.showCta ?? true
                }
        }
    }

    private func makeHooks(
        script: EarTrainingTutorialScriptPayload,
        requiredLoops: Int,
        onLoopSuccess: (() -> Void)?,
        quiz: EarTrainingTutorialQuizSceneHooks? = nil,
        osmdDemoAutoplay: Bool = false
    ) -> EarTrainingTutorialSceneHooks {
        EarTrainingTutorialSceneHooks(
            noCombat: script.ui.noCombat,
            onCharacterText: { characterText = $0 },
            onSceneComplete: { advanceScene(script: script) },
            requiredSuccessfulLoops: max(1, requiredLoops),
            onLoopSuccess: onLoopSuccess,
            quiz: quiz,
            osmdDemoAutoplay: osmdDemoAutoplay
        )
    }

    private func advanceScene(script: EarTrainingTutorialScriptPayload) {
        showFinishCta = false
        let next = sceneIndex + 1
        if next >= script.scenes.count {
            Task {
                await onComplete?()
                onClose()
            }
            return
        }
        sceneIndex = next
        characterText = ""
    }
}

/// セリフのみシーン（ドラムループ BGM + 一定間隔でセリフ送り）。
private struct EarTrainingTutorialDialogueSceneView: View {
    let lines: [EarTrainingTutorialLocalizedText]
    let intervalSeconds: Double
    let drumLoopUrl: String?
    let locale: AppLocale
    let onLine: (String) -> Void
    let onComplete: () -> Void

    @State private var lineIndex = 0

    var body: some View {
        Color.black
            .ignoresSafeArea()
            .task {
                onLine(lines.first?.localized(locale) ?? "")
                guard lines.count > 1 else {
                    try? await Task.sleep(nanoseconds: UInt64(max(1, intervalSeconds) * 1_000_000_000))
                    onComplete()
                    return
                }
                for index in 1..<lines.count {
                    try? await Task.sleep(nanoseconds: UInt64(max(1, intervalSeconds) * 1_000_000_000))
                    onLine(lines[index].localized(locale))
                }
                try? await Task.sleep(nanoseconds: UInt64(max(1, intervalSeconds) * 1_000_000_000))
                onComplete()
            }
    }
}
