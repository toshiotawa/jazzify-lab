import SwiftUI
import SpriteKit

/// セリフのみシーン: 耳コピバトル UI（キャラ・背景）を横画面表示。譜面・HUD・ピアノは出さない。
struct EarTrainingTutorialDialogueBattleView: View {
    let drumLoopUrl: String?
    let locale: AppLocale
    let lines: [EarTrainingTutorialLocalizedText]
    /// 互換維持用（吹き出しは SpriteKit `setPlayerQuote` に統一するため無視）。
    let intervalSeconds: Double
    /// チュートリアル親と同じ landscape コンテナへ直接載せる場合に指定。
    var fixedLandscapeSize: CGSize?

    let onComplete: () -> Void

    @StateObject private var driver: EarTrainingTutorialDialogueBattleDriver
    @State private var audio: EarTrainingAudio?

    init(
        drumLoopUrl: String?,
        locale: AppLocale,
        lines: [EarTrainingTutorialLocalizedText],
        intervalSeconds: Double,
        fixedLandscapeSize: CGSize? = nil,
        onComplete: @escaping () -> Void
    ) {
        self.drumLoopUrl = drumLoopUrl
        self.locale = locale
        self.lines = lines
        self.intervalSeconds = intervalSeconds
        self.fixedLandscapeSize = fixedLandscapeSize
        self.onComplete = onComplete
        _driver = StateObject(wrappedValue: EarTrainingTutorialDialogueBattleDriver(isEnglishCopy: locale == .en))
    }

    var body: some View {
        Group {
            if let fixed = fixedLandscapeSize {
                tutorialSceneStack(landscapeSize: fixed)
            } else {
                GeometryReader { proxy in
                    let portraitSize = proxy.size
                    let landscapeSize = CGSize(
                        width: max(1, portraitSize.height),
                        height: max(1, portraitSize.width)
                    )
                    tutorialSceneStack(landscapeSize: landscapeSize)
                        .rotationEffect(.degrees(90))
                        .frame(width: portraitSize.width, height: portraitSize.height)
                        .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
                }
                .ignoresSafeArea()
            }
        }
        .background(Color.black)
        .onAppear { OrientationManager.shared.lock(.portrait) }
        .task { await runDialogue() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            audio?.stop()
            driver.detachScene()
        }
    }

    @ViewBuilder
    private func tutorialSceneStack(landscapeSize: CGSize) -> some View {
        EarTrainingTutorialDialogueSceneContainer(driver: driver, sceneSize: landscapeSize)
            .frame(width: landscapeSize.width, height: landscapeSize.height)
            .clipped()
            .overlay {
                Color.black.opacity(0.001)
                    .contentShape(Rectangle())
                    .onTapGesture { driver.userTappedAdvance() }
            }
            .overlay(alignment: .bottomTrailing) {
                if driver.awaitsUserAdvance {
                    DialogueTapAdvanceCue(sessionId: driver.pulseSessionId)
                        .padding(.trailing, 18)
                        .padding(.bottom, 18)
                }
            }
    }

    @MainActor
    private func runDialogue() async {
        let audioInstance = EarTrainingAudio()
        audioInstance.start()
        audio = audioInstance

        guard !lines.isEmpty else {
            onComplete()
            return
        }

        let resolvedLoop: URL = drumLoopUrl.flatMap { raw in
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !t.isEmpty else { return nil }
            return URL(string: t)
        } ?? EarTrainingChordQuizBattleController.drumLoopURLForTutorial
        let prepared = await audioInstance.prepareDrumLoop(url: resolvedLoop)
        if prepared {
            audioInstance.startDrumLoop()
        }

        // レイアウトより先に `task` が走ることがあるため、軽く待ち scene を付けてからセリフを出す。
        try? await Task.sleep(nanoseconds: 32_000_000)
        if Task.isCancelled { return }

        for line in lines {
            driver.presentLine(locale: locale, text: line)
            await driver.waitForAdvanceTap()
            if Task.isCancelled { return }
        }

        driver.clearQuote()
        driver.publishIdleSnapshot()
        audioInstance.stop()
        onComplete()
    }
}

/// 右下 ▶ を明滅させる（ゲーム外のチュートリアル UI のみで、ヒットテストしない）。
private struct DialogueTapAdvanceCue: View {
    let sessionId: Int
    @State private var emphasis: CGFloat = 0

    var body: some View {
        Text("▶︎")
            .font(.title3.weight(.semibold))
            .foregroundStyle(Color.white.opacity(0.38 + emphasis * 0.54))
            .allowsHitTesting(false)
            .animation(.easeInOut(duration: 0.85).repeatForever(autoreverses: true), value: emphasis)
            .onAppear {
                emphasis = 0
                DispatchQueue.main.async {
                    emphasis = 1
                }
            }
            .id(sessionId)
    }
}

@MainActor
final class EarTrainingTutorialDialogueBattleDriver: ObservableObject, EarTrainingBattleSceneDriving {
    let isEnglishCopy: Bool

    /// 親がタップ待ち状態（複数線のとき、最後の 1 行のあとも次へ進めるまで維持）。
    @Published private(set) var awaitsUserAdvance = false
    /// 明滅アニメをセッション切り替えでリセットする。
    @Published private(set) var pulseSessionId = 0

    private weak var scene: EarTrainingBattleSceneHandle?
    private let stageId = UUID(uuidString: "B0000000-0000-4000-8000-000000000001")!
    private var tapContinuation: CheckedContinuation<Void, Never>?

    init(isEnglishCopy: Bool) {
        self.isEnglishCopy = isEnglishCopy
    }

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishIdleSnapshot()
    }

    func detachScene() {
        tapContinuation?.resume(returning: ())
        tapContinuation = nil
        awaitsUserAdvance = false
        scene = nil
    }

    func handleEffectImpact(effectId: Int) {
        _ = effectId
    }

    func presentLine(locale: AppLocale, text: EarTrainingTutorialLocalizedText) {
        publishIdleSnapshot()
        scene?.setPlayerQuote(text.localized(locale))
    }

    func clearQuote() {
        scene?.setPlayerQuote(nil)
    }

    func waitForAdvanceTap() async {
        pulseSessionId &+= 1
        awaitsUserAdvance = true
        await withCheckedContinuation { continuation in
            tapContinuation = continuation
        }
        awaitsUserAdvance = false
    }

    func userTappedAdvance() {
        guard let continuation = tapContinuation else { return }
        tapContinuation = nil
        continuation.resume(returning: ())
    }

    func publishIdleSnapshot() {
        let enemyName = EarTrainingBattleController.avatarAssetName(stageId: stageId, enemyId: "tutorial-dialogue")
        let snapshot = EarTrainingBattleSceneSnapshot(
            gameState: .playingPhrase,
            stageId: stageId,
            stageTitle: "",
            phraseIndex: 0,
            phraseRunId: 0,
            phraseIntroSeq: 0,
            phraseIntroEmphasis: false,
            totalPhrases: 1,
            phraseIntroLine: "",
            demoLoopActive: false,
            playerAvatarName: EarTrainingBattleController.playerAvatarAssetName,
            enemyAvatarName: enemyName,
            enemyAvatarFlipX: EarTrainingBattleController.shouldFlipEnemyAvatar(name: enemyName),
            fixedCharacterPositions: true,
            showLobbyControls: false,
            isEnglishCopy: isEnglishCopy
        )
        scene?.applySnapshot(snapshot)
    }
}

private struct EarTrainingTutorialDialogueSceneContainer: UIViewRepresentable {
    let driver: EarTrainingTutorialDialogueBattleDriver
    let sceneSize: CGSize

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> SKView {
        let initialFrame = CGRect(origin: .zero, size: normalizedSceneSize(sceneSize))
        let view = SKView(frame: initialFrame)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        view.isAsynchronous = false
        view.isPaused = false

        let scene = EarTrainingBattleScene(size: initialFrame.size)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        view.presentScene(scene)
        driver.attachScene(scene)
        context.coordinator.attach(view: view, scene: scene, driver: driver)
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        context.coordinator.update(sceneSize: normalizedSceneSize(sceneSize))
    }

    private func normalizedSceneSize(_ size: CGSize) -> CGSize {
        CGSize(width: max(1, size.width), height: max(1, size.height))
    }

    static func dismantleUIView(_ uiView: SKView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private weak var view: SKView?
        private weak var scene: EarTrainingBattleScene?
        private weak var driver: EarTrainingTutorialDialogueBattleDriver?

        func attach(view: SKView, scene: EarTrainingBattleScene, driver: EarTrainingTutorialDialogueBattleDriver) {
            self.view = view
            self.scene = scene
            self.driver = driver
        }

        func update(sceneSize: CGSize) {
            guard let view, let scene else { return }
            let frame = CGRect(origin: .zero, size: sceneSize)
            view.frame = frame
            scene.size = sceneSize
        }

        func detach() {
            let pendingDriver = driver
            Task { @MainActor in
                pendingDriver?.detachScene()
            }
            scene?.removeAllActions()
            scene?.removeAllChildren()
            view?.presentScene(nil)
            view = nil
            scene = nil
            driver = nil
        }
    }
}

extension EarTrainingChordQuizBattleController {
    static let drumLoopURLForTutorial =
        URL(string: "https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3")!
}
