import SwiftUI
import SpriteKit
import UIKit

/// 耳コピバトル ゲーム画面 (ネイティブ版) のルートビュー。
/// - SpriteKit シーン上に SwiftUI で HUD / ピアノ / ロビー / 結果 / 設定モーダルを重ねる。
/// - `onAppear` で Supabase からステージ詳細を取得し、`EarTrainingBattleController` を生成する。
/// - MIDI 入力は `MIDIManager.shared.onMIDIEvent` を直接フックする（Survival と同パターン）。
struct EarTrainingGameView: View {
    let stageId: UUID
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    let onClose: () -> Void

    @State private var controller: EarTrainingBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true
    @State private var resolvedMode: EarTrainingMode?

    var body: some View {
        ZStack {
            if resolvedMode == .chordVoicing {
                EarTrainingChordVoicingGameView(
                    source: .id(stageId),
                    lessonContext: lessonContext,
                    locale: locale,
                    onClose: onClose
                )
            } else if let controller = controller, let audio = audio {
                EarTrainingGameContent(
                    controller: controller,
                    audio: audio,
                    locale: locale,
                    onClose: onClose
                )
            } else if isLoading {
                loadingView
            } else {
                errorView
            }
        }
        .background(Color.black)
        .onAppear {
            OrientationManager.shared.lock(.portrait)
        }
        .task { await bootstrap() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            MIDIManager.shared.onMIDIEvent = nil
            controller?.tearDown()
        }
        .preferredColorScheme(.dark)
    }

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView().tint(.yellow)
            Text(locale == .ja ? "バトルモードを準備中…" : "Preparing battle mode…")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
        }
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundStyle(.yellow)
            Text(loadError ?? (locale == .ja ? "読み込みに失敗しました" : "Failed to load"))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Button(action: { onClose() }) {
                Text(locale == .ja ? "戻る" : "Back")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color.yellow)
                    .cornerRadius(8)
            }
        }
    }

    @MainActor
    private func bootstrap() async {
        guard controller == nil else { return }
        isLoading = true
        loadError = nil

        do {
            let stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            if stageDetail.resolvedMode == .chordVoicing {
                self.resolvedMode = .chordVoicing
                self.isLoading = false
                return
            }
            self.resolvedMode = .phrase
            let phrases = stageDetail.phrases ?? []
            guard !phrases.isEmpty else {
                loadError = locale == .ja
                    ? "フレーズが登録されていません"
                    : "No phrases are registered for this stage."
                isLoading = false
                return
            }
            let audioInstance = EarTrainingAudio()
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            let createdController = EarTrainingBattleController(
                stage: stageDetail,
                phrases: phrases,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                enemyId: stageDetail.id.uuidString,
                enemyName: stageDetail.localizedTitle(locale),
                audio: audioInstance,
                onExit: onClose
            )

            // MIDI 入力をブリッジ
            MIDIManager.shared.onMIDIEvent = nil
            MIDIManager.shared.onMIDIEvent = { [weak createdController] status, data1, data2 in
                let messageType = status & 0xF0
                let note = Int(data1)
                let velocity = Int(data2)
                let isNoteOn = messageType == 0x90 && velocity > 0
                let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
                if isNoteOn {
                    SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: note, velocity: velocity)
                } else if isNoteOff {
                    SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: note)
                } else {
                    return
                }
                DispatchQueue.main.async { [weak createdController] in
                    guard let createdController else { return }
                    if isNoteOn {
                        createdController.handleNoteOn(midi: note, velocity: velocity, playAudio: false)
                        createdController.registerMidiKeyDown(note)
                    } else {
                        createdController.handleNoteOff(midi: note, playAudio: false)
                        createdController.registerMidiKeyUp(note)
                    }
                }
            }

            createdController.start()
            self.audio = audioInstance
            self.controller = createdController
            self.isLoading = false
            createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }
}

// MARK: - Content

private struct EarTrainingGameContent: View {
    @ObservedObject var controller: EarTrainingBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let onClose: () -> Void

    @State private var hudHorizontalPadding: CGFloat = 16

    var body: some View {
        GeometryReader { proxy in
            let portraitSize = proxy.size
            let landscapeSize = CGSize(
                width: max(1, portraitSize.height),
                height: max(1, portraitSize.width)
            )

            landscapeContent(size: landscapeSize)
                .frame(width: landscapeSize.width, height: landscapeSize.height)
                .clipped()
                .rotationEffect(.degrees(90))
                .frame(width: portraitSize.width, height: portraitSize.height)
                .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
        }
        .ignoresSafeArea()
        .onAppear {
            hudHorizontalPadding = Self.resolveHudHorizontalPadding()
        }
        .sheet(isPresented: $controller.isSettingsOpen) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    private func landscapeContent(size: CGSize) -> some View {
        ZStack(alignment: .top) {
            EarTrainingSceneContainer(driver: controller, sceneSize: size)
                .ignoresSafeArea()

            EarTrainingDemoBubbleView(controller: controller)
                .ignoresSafeArea()
                .allowsHitTesting(false)

            VStack(spacing: 0) {
                EarTrainingHUDView(
                    hud: controller.hudModel,
                    horizontalPadding: hudHorizontalPadding,
                    onSettings: { controller.handleOpenSettings() },
                    onBack: { controller.handleBack() }
                )
                Spacer()
            }

            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(player: controller)
                    .ignoresSafeArea(.container, edges: .horizontal)
                    .padding(.bottom, 4)
            }

            EarTrainingResultView(host: controller)
        }
    }

    /// `GeometryReader` が `ignoresSafeArea` のため `proxy.safeAreaInsets` が 0 になりがち。ウィンドウのセーフエリアから HUD 用の水平余白を決める。
    private static func resolveHudHorizontalPadding() -> CGFloat {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }) else {
            return 16
        }
        let s = window.safeAreaInsets
        return max(16, s.left, s.right, s.top)
    }
}

// MARK: - SpriteKit ブリッジ

private struct EarTrainingSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
    let driver: Driver
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
        scene.onEffectImpact = { [weak driver] effectId in
            Task { @MainActor [weak driver] in
                driver?.handleEffectImpact(effectId: effectId)
            }
        }
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
        private weak var driver: Driver?
        private var activeObserver: NSObjectProtocol?

        func attach(view: SKView, scene: EarTrainingBattleScene, driver: Driver) {
            self.view = view
            self.scene = scene
            self.driver = driver
            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                if let v = self?.view, v.isPaused { v.isPaused = false }
                if let s = self?.scene, s.isPaused { s.isPaused = false }
            }
        }

        func update(sceneSize: CGSize) {
            view?.bounds = CGRect(origin: .zero, size: sceneSize)
            guard let scene, scene.size != sceneSize else { return }
            scene.size = sceneSize
        }

        func detach() {
            if let o = activeObserver { NotificationCenter.default.removeObserver(o) }
            activeObserver = nil
            let pendingDriver = driver
            Task { @MainActor in
                pendingDriver?.detachScene()
            }
            view = nil
            scene = nil
            driver = nil
        }
    }
}
