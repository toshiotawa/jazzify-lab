import SwiftUI
import SpriteKit

/// セリフのみシーン: 耳コピバトル UI（キャラ・背景）を横画面表示。譜面・HUD・ピアノは出さない。
struct EarTrainingTutorialDialogueBattleView: View {
    let drumLoopUrl: String?
    let locale: AppLocale
    let lines: [EarTrainingTutorialLocalizedText]
    let intervalSeconds: Double
    let onLine: (String) -> Void
    let onComplete: () -> Void

    @StateObject private var driver: EarTrainingTutorialDialogueBattleDriver
    @State private var audio: EarTrainingAudio?

    init(
        drumLoopUrl: String?,
        locale: AppLocale,
        lines: [EarTrainingTutorialLocalizedText],
        intervalSeconds: Double,
        onLine: @escaping (String) -> Void,
        onComplete: @escaping () -> Void
    ) {
        self.drumLoopUrl = drumLoopUrl
        self.locale = locale
        self.lines = lines
        self.intervalSeconds = intervalSeconds
        self.onLine = onLine
        self.onComplete = onComplete
        _driver = StateObject(wrappedValue: EarTrainingTutorialDialogueBattleDriver(isEnglishCopy: locale == .en))
    }

    var body: some View {
        GeometryReader { proxy in
            let portraitSize = proxy.size
            let landscapeSize = CGSize(
                width: max(1, portraitSize.height),
                height: max(1, portraitSize.width)
            )
            EarTrainingTutorialDialogueSceneContainer(driver: driver, sceneSize: landscapeSize)
                .frame(width: landscapeSize.width, height: landscapeSize.height)
                .clipped()
                .rotationEffect(.degrees(90))
                .frame(width: portraitSize.width, height: portraitSize.height)
                .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
        }
        .ignoresSafeArea()
        .background(Color.black)
        .onAppear { OrientationManager.shared.lock(.portrait) }
        .task { await runDialogue() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            audio?.stopDrumLoop()
            driver.detachScene()
        }
    }

    @MainActor
    private func runDialogue() async {
        let audioInstance = EarTrainingAudio()
        audioInstance.start()
        audio = audioInstance
        let loopURL = URL(string: drumLoopUrl ?? "")
            ?? EarTrainingChordQuizBattleController.drumLoopURLForTutorial
        let prepared = await audioInstance.prepareDrumLoop(url: loopURL)
        if prepared {
            audioInstance.startDrumLoop()
        }

        onLine(lines.first?.localized(locale) ?? "")
        let interval = max(1, intervalSeconds)
        if lines.count <= 1 {
            try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
            audioInstance.stopDrumLoop()
            onComplete()
            return
        }
        for index in 1..<lines.count {
            try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
            if Task.isCancelled { return }
            onLine(lines[index].localized(locale))
        }
        try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
        if Task.isCancelled { return }
        audioInstance.stopDrumLoop()
        onComplete()
    }
}

@MainActor
final class EarTrainingTutorialDialogueBattleDriver: ObservableObject, EarTrainingBattleSceneDriving {
    let isEnglishCopy: Bool
    private weak var scene: EarTrainingBattleSceneHandle?
    private let stageId = UUID(uuidString: "B0000000-0000-4000-8000-000000000001")!

    init(isEnglishCopy: Bool) {
        self.isEnglishCopy = isEnglishCopy
    }

    func attachScene(_ scene: EarTrainingBattleSceneHandle) {
        self.scene = scene
        publishIdleSnapshot()
    }

    func detachScene() {
        scene = nil
    }

    func handleEffectImpact(effectId: Int) {
        _ = effectId
    }

    private func publishIdleSnapshot() {
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
