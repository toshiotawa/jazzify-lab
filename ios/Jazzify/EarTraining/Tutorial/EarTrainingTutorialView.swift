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
    @State private var showFinishCta = false
    @State private var showGreatInterstitial = false

    /// `dialogue_only` のあとのアタッチ用（そのシーンのみ消費）。
    @State private var pendingQuizPrewarm: EarTrainingTutorialPrewarmedQuizPack?
    @State private var pendingVoicingPrewarm: EarTrainingTutorialPrewarmedVoicingPack?
    @State private var pendingOsmdPrewarm: EarTrainingTutorialPrewarmedOsmdPack?

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
                        .task(id: sceneIndex) {
                            await prewarmRunnableAfterDialogueIfNeeded(script: script)
                        }
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
                pendingQuizPrewarm = nil
                pendingVoicingPrewarm = nil
                pendingOsmdPrewarm = nil
                showGreatInterstitial = false
                gate = .ready
            } else {
                gate = .failed
            }
        }
    }

    @ViewBuilder
    private func tutorialContent(script: EarTrainingTutorialScriptPayload) -> some View {
        GeometryReader { portraitProxy in
            let portraitSize = portraitProxy.size
            let landscapeSize = CGSize(
                width: max(1, portraitSize.height),
                height: max(1, portraitSize.width)
            )
            let scenes = script.scenes
            ZStack {
                ZStack {
                    if scenes.indices.contains(sceneIndex) {
                        sceneView(
                            script: script,
                            scene: scenes[sceneIndex],
                            hostedLandscapeSize: landscapeSize,
                            quizPrewarm: pendingQuizPrewarm,
                            voicingPrewarm: pendingVoicingPrewarm,
                            osmdPrewarm: pendingOsmdPrewarm
                        )
                    }
                    EarTrainingLandscapeTutorialOverlay(
                        landscapeSize: landscapeSize,
                        showExit: script.ui.showExitButton,
                        isJapanese: isJa,
                        onExit: onClose
                    )

                    if showGreatInterstitial {
                        Color.black.opacity(0.35)
                            .allowsHitTesting(false)
                        Text("Great!!")
                            .font(.system(size: 44, weight: .heavy))
                            .foregroundStyle(Color(red: 0.99, green: 0.92, blue: 0.55))
                            .shadow(color: .black.opacity(0.85), radius: 2, x: 0, y: 4)
                    }
                }
                .frame(width: landscapeSize.width, height: landscapeSize.height)
                .clipped()
                .rotationEffect(.degrees(90))
                .frame(width: portraitSize.width, height: portraitSize.height)
                .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
                .id(sceneIndex)

                if showFinishCta {
                    OnboardingCtaView(isJa: isJa, buttonTitle: isJa ? "完了する" : "Complete") {
                        Task {
                            await onComplete?()
                            onClose()
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func sceneView(
        script: EarTrainingTutorialScriptPayload,
        scene: EarTrainingTutorialScene,
        hostedLandscapeSize: CGSize?,
        quizPrewarm: EarTrainingTutorialPrewarmedQuizPack?,
        voicingPrewarm: EarTrainingTutorialPrewarmedVoicingPack?,
        osmdPrewarm: EarTrainingTutorialPrewarmedOsmdPack?
    ) -> some View {
        let kbHints = script.ui.keyboardHintsDefault
        switch scene {
        case .dialogueOnly(let dialogue):
            EarTrainingTutorialDialogueBattleView(
                drumLoopUrl: script.audioTracks?.drum_loop?.url,
                locale: locale,
                lines: dialogue.lines,
                intervalSeconds: dialogue.lineIntervalSeconds ?? 4,
                fixedLandscapeSize: hostedLandscapeSize,
                onComplete: { handleSceneFinished(script: script) }
            )
        case .chordQuiz(let quizScene):
            if let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: quizScene.contentRef,
                keyboardHintsScriptDefault: kbHints,
                locale: locale
            ) {
                let pack = quizPrewarm
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
                            onQuestionText: quizScene.dialogue.onQuestion.localized(locale),
                            onCorrectText: quizScene.dialogue.onCorrect.localized(locale)
                        )
                    ),
                    tutorialQuestionTarget: quizScene.questionCount,
                    hostedLandscapeSize: hostedLandscapeSize,
                    prewarmQuizPack: pack,
                    onClose: onClose
                )
                .onAppear {
                    if pack != nil {
                        pendingQuizPrewarm = nil
                    }
                }
            }
        case .chordVoicingSelfPaced(let selfScene):
            if let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: selfScene.contentRef,
                keyboardHintsScriptDefault: kbHints,
                locale: locale
            ) {
                let pack = voicingPrewarm
                EarTrainingChordVoicingGameView(
                    source: .embedded(stage),
                    lessonContext: nil,
                    locale: locale,
                    initialPracticeMode: false,
                    tutorialHooks: makeHooks(
                        script: script,
                        requiredLoops: selfScene.requiredSuccessfulLoops,
                        onLoopSuccess: nil,
                        selfPacedTimedLines: selfScene.dialogue.timedLines
                    ),
                    hostedLandscapeSize: hostedLandscapeSize,
                    prewarmVoicingPack: pack,
                    onClose: onClose
                )
                .onAppear {
                    if pack != nil {
                        pendingVoicingPrewarm = nil
                    }
                }
            }
        case .chordOsmd(let osmdScene):
            if let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: osmdScene.contentRef,
                keyboardHintsScriptDefault: kbHints,
                locale: locale
            ) {
                let pack = osmdPrewarm
                EarTrainingChordOSMDGameView(
                    source: .embedded(stage),
                    lessonContext: nil,
                    locale: locale,
                    initialPracticeMode: false,
                    tutorialHooks: makeHooks(
                        script: script,
                        requiredLoops: osmdScene.requiredLoops,
                        onLoopSuccess: nil,
                        osmdTimedLines: osmdScene.timedLines
                    ),
                    hostedLandscapeSize: hostedLandscapeSize,
                    prewarmOsmdPack: pack,
                    onClose: onClose
                )
                .onAppear {
                    if pack != nil {
                        pendingOsmdPrewarm = nil
                    }
                }
            }
        case .finish:
            Color.clear
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .onAppear {
                    showFinishCta = script.finish?.showCta ?? true
                }
        }
    }


    private func makeHooks(
        script: EarTrainingTutorialScriptPayload,
        requiredLoops: Int,
        onLoopSuccess: (() -> Void)?,
        quiz: EarTrainingTutorialQuizSceneHooks? = nil,
        osmdTimedLines: [EarTrainingTutorialOsmdTimedLine]? = nil,
        selfPacedTimedLines: [EarTrainingTutorialSelfPacedTimedLine]? = nil
    ) -> EarTrainingTutorialSceneHooks {
        EarTrainingTutorialSceneHooks(
            ui: script.ui,
            noCombat: script.ui.noCombat,
            onCharacterText: { _ in },
            onSceneComplete: { handleSceneFinished(script: script) },
            requiredSuccessfulLoops: max(1, requiredLoops),
            onLoopSuccess: onLoopSuccess,
            quiz: quiz,
            osmdTimedLines: osmdTimedLines,
            tutorialDrumLoopUrl: script.audioTracks?.drum_loop?.url,
            selfPacedTimedLines: selfPacedTimedLines
        )
    }

    private func handleSceneFinished(script: EarTrainingTutorialScriptPayload) {
        let scenes = script.scenes
        guard scenes.indices.contains(sceneIndex) else {
            advanceScene(script: script)
            return
        }
        switch scenes[sceneIndex] {
        case .dialogueOnly:
            advanceScene(script: script)
        default:
            showGreatInterstitial = true
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                showGreatInterstitial = false
                advanceScene(script: script)
            }
        }
    }

    private func advanceScene(script: EarTrainingTutorialScriptPayload) {
        showFinishCta = false
        showGreatInterstitial = false
        let next = sceneIndex + 1
        if next >= script.scenes.count {
            Task {
                await onComplete?()
                onClose()
            }
            return
        }
        sceneIndex = next
    }

    @MainActor
    private func prewarmRunnableAfterDialogueIfNeeded(script: EarTrainingTutorialScriptPayload) async {
        let scenes = script.scenes
        guard scenes.indices.contains(sceneIndex) else { return }
        guard case .dialogueOnly = scenes[sceneIndex] else { return }
        guard let nextIx = EarTrainingTutorialBattleWarmup.nextRunnableSceneIndex(scenes: scenes, fromIndex: sceneIndex)
        else { return }

        pendingQuizPrewarm = nil
        pendingVoicingPrewarm = nil
        pendingOsmdPrewarm = nil

        let kbHints = script.ui.keyboardHintsDefault

        switch scenes[nextIx] {
        case .chordQuiz(let quizScene):
            guard let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: quizScene.contentRef,
                keyboardHintsScriptDefault: kbHints,
                locale: locale
            ) else { return }
            let hooks = makeHooks(
                script: script,
                requiredLoops: quizScene.questionCount,
                onLoopSuccess: nil,
                quiz: EarTrainingTutorialQuizSceneHooks(
                    useProgressionOrder: quizScene.order == "progression",
                    onQuestionText: quizScene.dialogue.onQuestion.localized(locale),
                    onCorrectText: quizScene.dialogue.onCorrect.localized(locale)
                )
            )

            guard let built = try? EarTrainingTutorialBattleWarmup.buildChordQuizPack(
                stage: stage,
                locale: locale,
                lessonContext: nil,
                tutorialHooks: hooks,
                tutorialQuestionTarget: quizScene.questionCount,
                onClose: onClose
            ) else { return }
            pendingQuizPrewarm = built

        case .chordVoicingSelfPaced(let selfScene):
            guard let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: selfScene.contentRef,
                keyboardHintsScriptDefault: kbHints,
                locale: locale
            ) else { return }
            let voicingHooks = makeHooks(
                script: script,
                requiredLoops: selfScene.requiredSuccessfulLoops,
                onLoopSuccess: nil,
                selfPacedTimedLines: selfScene.dialogue.timedLines
            )
            guard let built = try? EarTrainingTutorialBattleWarmup.buildChordVoicingPack(
                      stage: stage,
                      locale: locale,
                      lessonContext: nil,
                      tutorialHooks: voicingHooks,
                      onClose: onClose
                  )
            else { return }
            pendingVoicingPrewarm = built

        case .chordOsmd(let osmdScene):
            guard let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
                content: script.content,
                contentRef: osmdScene.contentRef,
                keyboardHintsScriptDefault: kbHints,
                locale: locale
            ) else { return }
            let osmdHooks = makeHooks(
                script: script,
                requiredLoops: osmdScene.requiredLoops,
                onLoopSuccess: nil,
                osmdTimedLines: osmdScene.timedLines
            )
                  guard let built = try? EarTrainingTutorialBattleWarmup.buildOsmdPack(
                      stage: stage,
                      locale: locale,
                      lessonContext: nil,
                      tutorialHooks: osmdHooks,
                      initialPracticeMode: false,
                      onClose: onClose
                  )
            else { return }
            pendingOsmdPrewarm = built

        default:
            break
        }
    }

}

/// Exit ボタンのみチュートリアル本体に載せる（セリフは SpriteKit の吹き出しに統一）。
private struct EarTrainingLandscapeTutorialOverlay: View {
    let landscapeSize: CGSize
    let showExit: Bool
    let isJapanese: Bool
    let onExit: () -> Void

    var body: some View {
        Color.clear
            .frame(width: landscapeSize.width, height: landscapeSize.height)
            .allowsHitTesting(false)
            .overlay(alignment: .topTrailing) {
                if showExit {
                    Button(isJapanese ? "Exit" : "Exit", action: onExit)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.15))
                        .clipShape(Capsule())
                        .padding(.top, 12)
                        .padding(.trailing, 16)
                        .allowsHitTesting(true)
                }
            }
    }
}
