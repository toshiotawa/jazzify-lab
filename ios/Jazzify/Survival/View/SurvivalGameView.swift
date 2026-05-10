import QuartzCore
import SpriteKit
import SwiftUI
import UIKit

/// サバイバル ゲーム画面のルート (fullScreenCover から表示されるネイティブ版)。
/// - SpriteKit ゲーム世界 + SwiftUI オーバーレイ (HUD / スロット / スティック / 鍵盤)
/// - `SurvivalGameSession` がゲームループ・入力バッファ・UI 公開を束ねる
struct SurvivalGameView: View {
    let stage: SurvivalStageDefinition
    let hintMode: Bool
    let characterId: String
    let locale: AppLocale
    let onClose: () -> Void
    var isDemo: Bool = false
    var configOverride: SurvivalStageConfig? = nil

    @State private var session: SurvivalGameSession?
    @State private var bootstrapTask: Task<Void, Never>?
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()
    @State private var isLoading: Bool = true
    @State private var loadError: String?
    @StateObject private var orientation = OrientationManager.shared

    var body: some View {
        ZStack {
            if let session = session {
                SurvivalGameContent(session: session, stage: stage, hintMode: hintMode, locale: locale, isDemo: isDemo)
            } else if isLoading {
                loadingView
            } else {
                errorView
            }
        }
        .background(Color.black)
        .task {
            bootstrapTask?.cancel()
            bootstrapTask = Task {
                await bootstrap()
            }
        }
        .onDisappear {
            bootstrapTask?.cancel()
            bootstrapTask = nil
            midiSubscriptionHolder.cancel()
            session?.dispose()
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Subviews

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .tint(.yellow)
            Text(locale == .ja ? "ステージを準備中..." : "Preparing stage...")
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
            Button(action: { onClose() }) {
                Text(locale == .ja ? "マップに戻る" : "Back to Map")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color.yellow)
                    .cornerRadius(8)
            }
        }
    }

    // MARK: - Bootstrap

    @MainActor
    private func bootstrap() async {
        guard session == nil else { return }
        isLoading = true
        loadError = nil

        SurvivalAssetPreloader.preloadIfNeeded()

        let profile: SurvivalCharacterProfile
        let config: SurvivalStageConfig

        if isDemo {
            profile = SurvivalCharacterProfile.defaultFai
            config = configOverride ?? SurvivalStageConfig.default
        } else {
            let supabase = SupabaseService.shared
            async let profileTask: SurvivalCharacterProfile = {
                (try? await supabase.fetchFaiProfile()) ?? SurvivalCharacterProfile.defaultFai
            }()
            async let configTask: SurvivalStageConfig = {
                if let override = configOverride { return override }
                let difficulty = stage.difficulty.rawValue
                if let fetched = try? await supabase.fetchSurvivalStageConfig(difficulty: difficulty) {
                    return fetched
                }
                return SurvivalStageConfig.default
            }()

            profile = await profileTask
            config = await configTask
        }

        guard !Task.isCancelled else {
            isLoading = false
            return
        }

        let created = SurvivalGameSession(
            stage: stage,
            hintMode: hintMode,
            characterId: characterId,
            profile: profile,
            config: config,
            onExit: { _ in onClose() },
            isDemo: isDemo
        )
        created.start()
        guard !Task.isCancelled else {
            created.dispose()
            isLoading = false
            return
        }
        self.session = created
        self.isLoading = false

        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { [weak created] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            if isNoteOn {
                created?.audioController.pianoNoteOnRealtime(midi: note, velocity: velocity)
            } else if isNoteOff {
                created?.audioController.pianoNoteOffRealtime(midi: note)
            } else {
                return
            }
            DispatchQueue.main.async { [weak created] in
                guard let created else { return }
                if isNoteOn {
                    created.midiGameNoteOn(note, velocity: velocity)
                    created.viewModel.registerMidiKeyDown(note)
                } else {
                    created.midiGameNoteOff(note)
                    created.viewModel.registerMidiKeyUp(note)
                }
            }
        }
    }

}

// MARK: - Session-observing content view

private struct SurvivalGameContent: View {
    @ObservedObject var session: SurvivalGameSession
    let stage: SurvivalStageDefinition
    let hintMode: Bool
    let locale: AppLocale
    let isDemo: Bool

    private var vm: SurvivalViewModel { session.viewModel }

    var body: some View {
        ZStack(alignment: .top) {
            SurvivalSceneContainer(session: session)
                .ignoresSafeArea()

            SurvivalJoystickRepresentable(
                hitMask: .full,
                isInteractive: vm.uiSnapshot.phase == .playing && !vm.isPaused
            ) { analog in
                session.input.setAnalog(analog)
            }
            .allowsHitTesting(vm.uiSnapshot.phase == .playing && !vm.isPaused)

            VStack(spacing: 0) {
                SurvivalHUDView(
                    uiSnapshot: vm.uiSnapshot,
                    bossHud: vm.bossHud,
                    isPaused: vm.isPaused,
                    stage: stage,
                    locale: locale,
                    onTogglePause: { session.togglePause() }
                )
                SurvivalCodeSlotsView(uiSnapshot: vm.uiSnapshot, isBossStage: vm.isBossStage)
                    .padding(.top, 4)
                Spacer()
            }

            VStack {
                Spacer()
                chordPadBar
            }

            if vm.isPaused && vm.uiSnapshot.phase == .playing {
                pauseOverlay
            }

            if vm.uiSnapshot.phase != .playing {
                resultOverlay
            }
        }
    }

    private var chordPadBar: some View {
        SurvivalChordPadView(
            snapshot: SurvivalChordPadSnapshot(
                hintMidis: vm.chordPadHintMidis,
                completedHintMidis: vm.chordPadCompletedHintMidis,
                midiHeldKeys: vm.midiHeldKeys,
                isEnabled: vm.uiSnapshot.phase == .playing && !vm.isPaused
            ),
            onPress: { session.chordPadNoteOn($0) },
            onRelease: { session.chordPadNoteOff($0) }
        )
        .equatable()
        .ignoresSafeArea(.container, edges: .horizontal)
        .padding(.bottom, 8)
    }

    // MARK: - Overlays

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalPauseSettingsSheet(
                locale: locale,
                isDemo: isDemo,
                onResume: { session.togglePause() },
                onExit: { session.requestExit() }
            )
        }
    }

    private var resultOverlay: some View {
        let isCleared = vm.uiSnapshot.phase == .cleared
        return ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalGameResultView(
                isCleared: isCleared,
                stage: stage,
                enemiesDefeated: vm.uiSnapshot.enemiesDefeated,
                elapsedSeconds: vm.uiSnapshot.elapsedSecondsRounded,
                playerHp: vm.uiSnapshot.hp,
                playerMaxHp: vm.uiSnapshot.maxHp,
                hintMode: hintMode,
                isBossStage: vm.isBossStage,
                locale: locale,
                clearReportInFlight: vm.clearReportInFlight,
                clearReportError: vm.clearReportError,
                isDemo: isDemo,
                onRetry: { session.restartSameStage() },
                onExit: { session.requestExit() }
            )
        }
    }
}

// MARK: - SpriteKit ブリッジ

private struct SurvivalSceneContainer: UIViewRepresentable {
    let session: SurvivalGameSession

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> SKView {
        let initialFrame = UIScreen.main.bounds
        let view = SKView(frame: initialFrame)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        view.isAsynchronous = false
        view.isPaused = false
        view.isUserInteractionEnabled = false

        let sceneSize = initialFrame.size.width > 0 && initialFrame.size.height > 0
            ? initialFrame.size
            : CGSize(width: 1, height: 1)
        let scene = SurvivalScene(size: sceneSize, driver: session)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        view.presentScene(scene)

        context.coordinator.attach(view: view, scene: scene, session: session)
        context.coordinator.lastSceneRestartGeneration = session.viewModel.sceneRestartGeneration
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        let gen = session.viewModel.sceneRestartGeneration
        guard gen != context.coordinator.lastSceneRestartGeneration else { return }
        context.coordinator.lastSceneRestartGeneration = gen
        let bounds = uiView.bounds
        let sceneSize: CGSize
        if bounds.width > 0, bounds.height > 0 {
            sceneSize = bounds.size
        } else {
            sceneSize = UIScreen.main.bounds.size
        }
        if let existing = uiView.scene as? SurvivalScene {
            existing.size = sceneSize
            existing.scaleMode = .resizeFill
            existing.isPaused = false
            existing.resetForRestart()
            uiView.isPaused = false
            uiView.isUserInteractionEnabled = false
            context.coordinator.attach(view: uiView, scene: existing, session: session)
            return
        }
        let scene = SurvivalScene(size: sceneSize, driver: session)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        uiView.isPaused = false
        uiView.isUserInteractionEnabled = false
        uiView.presentScene(scene)
        context.coordinator.attach(view: uiView, scene: scene, session: session)
    }

    static func dismantleUIView(_ uiView: SKView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private weak var view: SKView?
        private weak var scene: SurvivalScene?
        private weak var session: SurvivalGameSession?
        private var watchdog: Timer?

        private var activeObserver: NSObjectProtocol?
        private var willResignObserver: NSObjectProtocol?
        var lastSceneRestartGeneration: Int = 0

        func attach(view: SKView, scene: SurvivalScene, session: SurvivalGameSession) {
            detach()

            self.view = view
            self.scene = scene
            self.session = session

            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                Task { @MainActor in
                    self?.resumeIfPausedExternally()
                }
            }
            willResignObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.willResignActiveNotification,
                object: nil,
                queue: .main
            ) { _ in }

            let w = Timer(timeInterval: 0.25, repeats: true) { [weak self] _ in
                Task { @MainActor in
                    self?.resumeIfSceneLoopStalled()
                }
            }
            watchdog = w
            RunLoop.main.add(w, forMode: .common)
        }

        func detach() {
            watchdog?.invalidate()
            watchdog = nil
            if let o = activeObserver { NotificationCenter.default.removeObserver(o) }
            if let o = willResignObserver { NotificationCenter.default.removeObserver(o) }
            activeObserver = nil
            willResignObserver = nil
            view = nil
            scene = nil
            session = nil
        }

        @MainActor
        private func resumeIfPausedExternally() {
            guard let view, let scene else { return }
            if view.isPaused { view.isPaused = false }
            if scene.isPaused { scene.isPaused = false }
        }

        @MainActor
        private func resumeIfSceneLoopStalled() {
            guard let view, let scene, let session else { return }
            guard view.window != nil else { return }
            guard session.allowsGameplayWatchdog else { return }
            let vm = session.viewModel
            guard vm.uiSnapshot.phase == .playing, !vm.isPaused else { return }

            let wallNow = CACurrentMediaTime()
            let stalled = wallNow - scene.lastUpdateWallTime > 0.5
            let viewWasPaused = view.isPaused
            let sceneWasPaused = scene.isPaused
            if viewWasPaused || sceneWasPaused || stalled {
                view.isPaused = false
                scene.isPaused = false
            }
        }
    }
}
