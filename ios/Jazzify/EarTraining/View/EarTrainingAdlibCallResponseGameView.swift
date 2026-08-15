import SwiftUI
import SpriteKit
import UIKit

/// アドリブ C&R バトル（`mode == adlib_call_response`）ネイティブ画面。楽譜表示は行わない。
struct EarTrainingAdlibCallResponseGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    var hostedLandscapeSize: CGSize?
    let onClose: () -> Void

    @State private var controller: EarTrainingAdlibCallResponseBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var bootstrapProgress: Double = 0
    @State private var isBootstrapComplete = false
    @State private var showPreparingOverlay = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingAdlibCallResponseContent(
                    controller: controller,
                    audio: audio,
                    locale: locale,
                    fixedLandscapeSize: hostedLandscapeSize
                )
            } else if loadError != nil {
                errorView
            } else {
                Color.black
            }

            if showPreparingOverlay && loadError == nil {
                EarTrainingPreparingOverlay(
                    message: locale == .ja ? "バトルを準備中…" : "Preparing battle…",
                    targetProgress: bootstrapProgress,
                    isWorkComplete: isBootstrapComplete,
                    onVisualComplete: { showPreparingOverlay = false }
                )
            }
        }
        .background(Color.black)
        .onAppear { OrientationManager.shared.lock(.portrait) }
        .task { await bootstrap() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            midiSubscriptionHolder.cancel()
            controller?.tearDown()
        }
        .preferredColorScheme(.dark)
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
        loadError = nil
        isBootstrapComplete = false
        showPreparingOverlay = true
        bootstrapProgress = EarTrainingLoadProgress.started
        do {
            let stageDetail: EarTrainingStageDetail
            switch source {
            case .id(let stageId):
                stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            case .slug(let slug):
                stageDetail = try await SupabaseService.shared.fetchEarTrainingStageDetailBySlug(slug: slug)
            case .embedded(let embedded):
                stageDetail = embedded
            }
            bootstrapProgress = EarTrainingLoadProgress.stageLoaded
            let phrases = stageDetail.sortedPhrases()
            guard !phrases.isEmpty else {
                loadError = locale == .ja
                    ? "フレーズが登録されていません"
                    : "No phrases are registered for this stage."
                showPreparingOverlay = false
                return
            }
            guard phrases.contains(where: { $0.musicXmlUrl != nil }) else {
                loadError = locale == .ja
                    ? "判定用のMusicXMLが登録されていません"
                    : "No MusicXML is registered for judgment."
                showPreparingOverlay = false
                return
            }

            let audioInstance = EarTrainingAudio()
            bootstrapProgress = EarTrainingLoadProgress.audioReady
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            bootstrapProgress = EarTrainingLoadProgress.controllerReady
            let createdController = EarTrainingAdlibCallResponseBattleController(
                stage: stageDetail,
                phrases: phrases,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                enemyId: stageDetail.id.uuidString,
                enemyName: stageDetail.localizedTitle(locale),
                audio: audioInstance,
                initialPracticeMode: initialPracticeMode,
                onExit: onClose
            )
            if let tutorialHooks {
                createdController.tutorialNoCombat = tutorialHooks.noCombat
                createdController.tutorialHooks = tutorialHooks
            }

            attachMidiFinishBootstrap(createdController: createdController, audioInstance: audioInstance)
        } catch {
            loadError = error.localizedDescription
            showPreparingOverlay = false
        }
    }

    @MainActor
    private func attachMidiFinishBootstrap(
        createdController: EarTrainingAdlibCallResponseBattleController,
        audioInstance: EarTrainingAudio
    ) {
        midiSubscriptionHolder.cancel()
        createdController.start()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { [weak createdController] status, data1, data2 in
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
        self.audio = audioInstance
        self.controller = createdController
        bootstrapProgress = 1
        isBootstrapComplete = true
        createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
    }
}

private struct EarTrainingAdlibCallResponseContent: View {
    @ObservedObject var controller: EarTrainingAdlibCallResponseBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let fixedLandscapeSize: CGSize?

    @State private var hudHorizontalPadding: CGFloat = 16
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var timingAdjustmentLaunch: EarTrainingTimingAdjustmentReturnLaunch?
    @State private var pendingTimingLaunch: EarTrainingTimingAdjustmentReturnLaunch?

    var body: some View {
        Group {
            if let fixed = fixedLandscapeSize {
                landscapeContent(size: fixed)
                    .frame(width: fixed.width, height: fixed.height)
                    .clipped()
            } else {
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
            }
        }
        .ignoresSafeArea()
        .syncPianoKeyboardDisplayMode($keyboardDisplayMode)
        .onChange(of: keyboardDisplayMode) { _ in
            controller.refreshKeyboardDisplayRangeForPreferencesChange()
        }
        .onAppear {
            hudHorizontalPadding = Self.resolveHudHorizontalPadding()
        }
        .sheet(isPresented: $controller.isSettingsOpen, onDismiss: handleSettingsSheetDismissed) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                scope: .battle,
                stageRunMode: controller.lessonContext.map { _ in
                    EarTrainingStageRunModeConfig(
                        practiceMode: controller.practiceMode,
                        onApplyPracticeModeAndRestart: { mode in
                            controller.applyPracticeModeAndRestart(mode)
                            controller.handleCloseSettings()
                        }
                    )
                },
                practiceTranspose: controller.stage.resolvedPracticeTranspose
                    ? EarTrainingPracticeTransposeConfig(
                        enabled: true,
                        practiceMode: controller.practiceMode,
                        originalKeyFifths: controller.practiceOriginalKeyFifths,
                        originalKeyName: controller.practiceOriginalKeyName,
                        appliedOffset: controller.practiceTransposeOffset
                    )
                    : nil,
                practiceSpeed: EarTrainingPracticeSpeedConfig(
                    practiceMode: controller.practiceMode,
                    appliedSpeedPercent: controller.practiceSpeedPercent,
                    onApplyAndRestart: { offset, speedPercent in
                        controller.applyPracticePlaybackAndRestart(offset: offset, speedPercent: speedPercent)
                    }
                ),
                osmdTimingAdjustment: EarTrainingOsmdTimingAdjustmentConfig(
                    appliedOffsetMs: controller.timingAdjustmentMs,
                    onChange: { controller.applyTimingAdjustmentMs($0) }
                ),
                onLaunchTimingAdjustment: {
                    controller.handleCloseSettings()
                    pendingTimingLaunch = EarTrainingTimingAdjustmentReturnLaunch(
                        stageId: controller.stage.id,
                        lessonContext: controller.lessonContext,
                        initialPracticeMode: controller.practiceMode
                    )
                },
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
        // 子の onDisappear → tearDown → SurvivalGameAudio.stop() の後に再開する。
        // onClose 内で start すると dismiss 後の tearDown に潰されてピアノが無音になる。
        .fullScreenCover(item: $timingAdjustmentLaunch, onDismiss: {
            audio.start()
            controller.startBattle()
        }) { launch in
            EarTrainingTimingAdjustmentView(
                entry: .settings,
                locale: locale,
                returnStageId: launch.stageId,
                returnLessonContext: launch.lessonContext,
                returnPracticeMode: launch.initialPracticeMode,
                onClose: {
                    timingAdjustmentLaunch = nil
                }
            )
        }
    }

    private func handleSettingsSheetDismissed() {
        guard let pending = pendingTimingLaunch else { return }
        pendingTimingLaunch = nil
        timingAdjustmentLaunch = pending
    }

    private func landscapeContent(size: CGSize) -> some View {
        ZStack {
            feedbackBackground

            EarTrainingAdlibCallResponseSceneContainer(
                driver: controller,
                sceneSize: size
            )
                .ignoresSafeArea()

            VStack(spacing: 0) {
                EarTrainingHUDView(
                    hud: controller.hudModel,
                    horizontalPadding: hudHorizontalPadding,
                    showsSlotsRow: true,
                    rightControlIconPointSize: 17,
                    rightControlCapsuleSize: 36,
                    rightControlHitSize: 52,
                    healthRowTrailingReserve: 118,
                    onSettings: { controller.handleOpenSettings() },
                    onBack: { controller.handleBack() }
                )
                Spacer()
            }

            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(
                    player: controller,
                    displayRange: controller.keyboardDisplayRange
                )
                    .ignoresSafeArea(.container, edges: .horizontal)
                    .padding(.bottom, 4)
            }

            EarTrainingResultView(host: controller)
        }
    }

    @ViewBuilder
    private var feedbackBackground: some View {
        switch controller.feedback {
        case .miss:
            Color.red.opacity(0.12).ignoresSafeArea().allowsHitTesting(false)
        case .clear:
            Color.white.opacity(0.08).ignoresSafeArea().allowsHitTesting(false)
        case .correct:
            Color.clear
        case nil:
            Color.clear
        }
    }

    private static func resolveHudHorizontalPadding() -> CGFloat {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }) else {
            return 16
        }
        let s = window.safeAreaInsets
        return max(16, s.left, s.right, s.top)
    }
}

private struct EarTrainingAdlibCallResponseSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
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

        @MainActor
        func update(sceneSize: CGSize) {
            view?.bounds = CGRect(origin: .zero, size: sceneSize)
            guard let scene else { return }
            if scene.size != sceneSize {
                scene.size = sceneSize
            }
        }

        func detach() {
            if let observer = activeObserver {
                NotificationCenter.default.removeObserver(observer)
            }
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
