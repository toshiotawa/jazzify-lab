import SwiftUI
import SpriteKit
import UIKit

/// フレーズペアアドリブ（Web `EarTrainingPhrasePairAdlibScreen` 相当）。
struct EarTrainingPhrasePairAdlibGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    var hostedLandscapeSize: CGSize?
    let onClose: () -> Void

    @State private var controller: EarTrainingPhrasePairAdlibBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingPhrasePairAdlibContent(
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
        .onAppear { OrientationManager.shared.lock(.portrait) }
        .task { await bootstrap() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            midiSubscriptionHolder.cancel()
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
            let stageDetail: EarTrainingStageDetail
            switch source {
            case .id(let stageId):
                stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            case .slug(let slug):
                stageDetail = try await SupabaseService.shared.fetchEarTrainingStageDetailBySlug(slug: slug)
            case .embedded(let embedded):
                stageDetail = embedded
            }
            guard let bootstrap = stageDetail.phrasePairAdlibBootstrap, !bootstrap.steps.isEmpty else {
                loadError = locale == .ja
                    ? "フレーズペア設定がありません"
                    : "Phrase pair configuration is missing."
                isLoading = false
                return
            }
            let audioInstance = EarTrainingAudio()
            if let url = URL(string: bootstrap.bgmUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            let createdController = EarTrainingPhrasePairAdlibBattleController(
                stage: stageDetail,
                bootstrap: bootstrap,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                audio: audioInstance,
                initialPracticeMode: initialPracticeMode,
                onExit: onClose
            )
            if let tutorialHooks {
                createdController.tutorialNoCombat = tutorialHooks.noCombat
                createdController.tutorialHooks = tutorialHooks
            }
            attachMidi(createdController: createdController, audioInstance: audioInstance)
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }

    @MainActor
    private func attachMidi(
        createdController: EarTrainingPhrasePairAdlibBattleController,
        audioInstance: EarTrainingAudio
    ) {
        midiSubscriptionHolder.cancel()
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
        audio = audioInstance
        controller = createdController
        isLoading = false
        if createdController.gameState == .idle {
            createdController.start()
        }
        createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
    }
}

private struct EarTrainingPhrasePairAdlibContent: View {
    @ObservedObject var controller: EarTrainingPhrasePairAdlibBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let onClose: () -> Void

    private var stageRunModeConfig: EarTrainingStageRunModeConfig? {
        guard controller.lessonContext != nil else { return nil }
        return EarTrainingStageRunModeConfig(
            practiceMode: controller.practiceMode,
            onApplyPracticeModeAndRestart: { mode in
                controller.applyPracticeModeAndRestart(mode)
                controller.handleCloseSettings()
            }
        )
    }

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
                stageRunMode: stageRunModeConfig,
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    private func landscapeContent(size: CGSize) -> some View {
        ZStack {
            feedbackBackground
            EarTrainingPhrasePairAdlibSceneContainer(driver: controller, sceneSize: size)
                .ignoresSafeArea()
            VStack(spacing: 0) {
                EarTrainingHUDView(
                    hud: controller.hudModel,
                    horizontalPadding: hudHorizontalPadding,
                    showsSlotsRow: false,
                    rightControlIconPointSize: 17,
                    rightControlCapsuleSize: 36,
                    rightControlHitSize: 52,
                    healthRowTrailingReserve: 118,
                    onSettings: { controller.handleOpenSettings() },
                    onBack: { controller.handleBack() }
                )
                Spacer()
            }
            staffOverlay(size: size)
            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(
                    player: controller,
                    scrollAnchorMidi: EarTrainingKeyboardScroll.scrollAnchorMidi(for: controller.stage)
                )
                    .ignoresSafeArea(.container, edges: .horizontal)
                    .padding(.bottom, 4)
            }
            EarTrainingResultView(host: controller)
        }
    }

    @ViewBuilder
    private func staffOverlay(size: CGSize) -> some View {
        if let step = controller.activeStep, !step.inputDisabled {
            let patterns = EarTrainingPhrasePairTimeline.patterns(
                for: step,
                patternsByGroupId: controller.bootstrap.patternsByGroupId
            )
            let displayPattern = EarTrainingPhrasePairStaff.pickDisplayPattern(
                buffer: controller.matcherState.buffer,
                patterns: patterns
            )
            let groups = EarTrainingPhrasePairStaff.buildStaffGroups(
                pattern: displayPattern,
                chordName: step.chordName,
                visibleNoteCount: controller.matcherState.buffer.count,
                isRest: false
            )
            let correctMap = EarTrainingPhrasePairStaff.correctPitchClassesByGroup(
                pattern: displayPattern,
                buffer: controller.matcherState.buffer
            )
            let showVoicingTargets = controller.gameState == .playingPhrase
                || (controller.gameState == .countIn && controller.countInEarlyInputActive)

            ChordVoicingStaffGroupsView(
                groups: groups,
                denseCurrentMeasureLayout: false,
                keyFifths: controller.bootstrap.keyFifths,
                activeGroupId: nil,
                correctPitchClassesByGroupId: correctMap,
                completionPulse: controller.completionPulse,
                showEmptyStaff: true,
                showTargetHints: showVoicingTargets,
                singleMeasureLayout: true,
                unpressedNoteOpacity: 0,
                fadeAllMeasureNotes: true
            )
            .frame(width: min(size.width * 0.82, 720), height: size.height * 0.5)
            .position(x: size.width / 2, y: size.height * 0.44)
            .allowsHitTesting(false)
        }
    }

    @ViewBuilder
    private var feedbackBackground: some View {
        switch controller.feedback {
        case .miss:
            Color.red.opacity(0.12).ignoresSafeArea().allowsHitTesting(false)
        case .clear:
            Color.white.opacity(0.08).ignoresSafeArea().allowsHitTesting(false)
        case .correct, nil:
            Color.clear
        }
    }

    private static func resolveHudHorizontalPadding() -> CGFloat {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        guard let window = scene?.windows.first(where: { $0.isKeyWindow }) else {
            return 16
        }
        return max(16, window.safeAreaInsets.left + 8)
    }
}

private struct EarTrainingPhrasePairAdlibSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
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

        func attach(view: SKView, scene: EarTrainingBattleScene, driver: Driver) {
            self.view = view
            self.scene = scene
            self.driver = driver
        }

        func update(sceneSize: CGSize) {
            view?.bounds = CGRect(origin: .zero, size: sceneSize)
            guard let scene, scene.size != sceneSize else { return }
            scene.size = sceneSize
        }

        func detach() {
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
