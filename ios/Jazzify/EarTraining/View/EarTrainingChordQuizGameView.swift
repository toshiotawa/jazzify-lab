import SwiftUI
import SpriteKit
import UIKit
import QuartzCore

/// コードクイズバトル（`mode == chord_quiz`）ネイティブ画面。
struct EarTrainingChordQuizGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    var tutorialQuestionTarget: Int = 1
    /// チュートリアル親が回転ラッパーで包むとき、landscape の実寸。
    var hostedLandscapeSize: CGSize?
    /// チュートリアル dialogue 事前ウォーム用（`bootstrap()` で消費して `nil` と同等）。
    var prewarmQuizPack: EarTrainingTutorialPrewarmedQuizPack?
    let onClose: () -> Void

    @State private var controller: EarTrainingChordQuizBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingChordQuizContent(
                    controller: controller,
                    audio: audio,
                    locale: locale,
                    fixedLandscapeSize: hostedLandscapeSize,
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
        if let pack = prewarmQuizPack {
            isLoading = true
            loadError = nil
            attachMidiAndFinishBootstrap(createdController: pack.controller, audioInstance: pack.audio)
            return
        }
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
            let items = stageDetail.sortedChordQuizItems()
            guard !items.isEmpty else {
                loadError = locale == .ja
                    ? "出題が登録されていません"
                    : "No chord quiz items are registered for this stage."
                isLoading = false
                return
            }
            let audioInstance = EarTrainingAudio()
            let prefetchDrum = EarTrainingChordQuizBattleController.resolveQuizDrumLoopURL(lessonContext: lessonContext)
            audioInstance.prefetchPhraseItem(url: prefetchDrum)

            let createdController = EarTrainingChordQuizBattleController(
                stage: stageDetail,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                enemyId: stageDetail.id.uuidString,
                audio: audioInstance,
                initialPracticeMode: initialPracticeMode,
                onExit: onClose
            )
            if let tutorialHooks {
                createdController.tutorialNoCombat = tutorialHooks.noCombat
                createdController.tutorialHooks = tutorialHooks
                createdController.tutorialQuestionTarget = tutorialQuestionTarget
            }

            attachMidiAndFinishBootstrap(createdController: createdController, audioInstance: audioInstance)
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }

    /// ウォーム済みまたは新規構築後に MIDI と表示状態を共通で確定させる。
    @MainActor
    private func attachMidiAndFinishBootstrap(
        createdController: EarTrainingChordQuizBattleController,
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
        self.audio = audioInstance
        self.controller = createdController
        self.isLoading = false
        if createdController.gameState == .idle {
            createdController.start()
        }
        createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
    }
}

private struct EarTrainingChordQuizContent: View {
    @ObservedObject var controller: EarTrainingChordQuizBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    /// 親が landscape コンテナとして回転済みのときのみ指定。
    let fixedLandscapeSize: CGSize?
    let onClose: () -> Void

    private static let pianoOverlayHeight: CGFloat = 76 + PianoKeyboardScrollGeometry.earTrainingScrollBarHeight

    @State private var hudHorizontalPadding: CGFloat = 16
    @State private var gaugeTicker = EarTrainingChordQuizGaugeTicker()

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
        .onAppear {
            hudHorizontalPadding = Self.resolveHudHorizontalPadding()
            gaugeTicker.start(controller: controller)
        }
        .onDisappear {
            gaugeTicker.stop()
        }
        .sheet(isPresented: $controller.isSettingsOpen) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                stageRunMode: controller.lessonContext.map { _ in
                    EarTrainingStageRunModeConfig(
                        practiceMode: controller.practiceMode,
                        onApplyPracticeModeAndRestart: { mode in
                            controller.applyPracticeModeAndRestart(mode)
                            controller.handleCloseSettings()
                        }
                    )
                },
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    private func landscapeContent(size: CGSize) -> some View {
        ZStack {
            feedbackBackground
            EarTrainingChordQuizSceneContainer(driver: controller, sceneSize: size)
                .ignoresSafeArea()
                .background(
                    GeometryReader { proxy in
                        Color.clear
                            .preference(
                                key: ChordQuizBattleSceneFrameKey.self,
                                value: proxy.frame(in: .global)
                            )
                    }
                )

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
        .onPreferenceChange(ChordVoicingActiveChordLabelFrameKey.self) { frame in
            controller.activeChordLabelGlobalFrame = frame
        }
        .onPreferenceChange(ChordQuizBattleSceneFrameKey.self) { frame in
            controller.battleSceneGlobalFrame = frame
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

    @ViewBuilder
    private func staffOverlay(size: CGSize) -> some View {
        let layout = EarTrainingChordVoicingStaffLayout.buildQuizGroups(
            active: controller.displayedStaffActiveQuestion,
            preview: controller.displayedStaffPreviewQuestion,
            hideChordNames: controller.stage.resolvedHideChordNamesInBattle
        )
        let hideNotes = controller.stage.resolvedQuizHideUnpressedNotationInBattle(practiceMode: controller.practiceMode)
        let keyFifths = controller.displayedStaffActiveQuestion?.keyFifths ?? controller.stage.keyFifths ?? 0
        let showHints = controller.practiceMode
            && (controller.gameState == .playingPhrase || controller.gameState == .countIn)
        let correctMap = EarTrainingChordVoicingStaffLayout.quizStaffCorrectPitchClassesByGroupId(
            attempt: controller.attempt,
            logicalActiveChordId: controller.activeChord?.id,
            groups: layout.groups,
            hideUnpressedNotes: hideNotes
        )
        if !layout.groups.isEmpty {
            ChordVoicingStaffGroupsView(
                groups: layout.groups,
                denseCurrentMeasureLayout: layout.denseCurrentMeasureLayout,
                keyFifths: keyFifths,
                activeGroupId: controller.activeChord?.id,
                correctPitchClassesByGroupId: correctMap,
                completionPulse: controller.staffCompletionPulse,
                showTargetHints: showHints,
                singleMeasureLayout: controller.displayedStaffPreviewQuestion == nil,
                hideChordLabels: controller.stage.resolvedHideChordNamesInBattle,
                hideUnpressedNotes: hideNotes,
                alwaysShowTopPointer: true
            )
            .frame(width: min(size.width * 0.63, 600), height: size.height * 0.5)
            .position(x: size.width / 2, y: size.height * 0.42)
            .allowsHitTesting(false)
        } else {
            EmptyView()
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

private struct ChordQuizBattleSceneFrameKey: PreferenceKey {
    static var defaultValue: CGRect = .zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        let next = nextValue()
        if next != .zero {
            value = next
        }
    }
}

private struct EarTrainingChordQuizSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
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

/// `tickQuizAttackGauge` を main で駆動（コードクイズ専用）。
private final class EarTrainingChordQuizGaugeTicker: NSObject {
    weak var controller: EarTrainingChordQuizBattleController?
    private var link: CADisplayLink?

    func start(controller: EarTrainingChordQuizBattleController) {
        self.controller = controller
        stop()
        let l = CADisplayLink(target: self, selector: #selector(step))
        l.add(to: .main, forMode: .common)
        link = l
    }

    func stop() {
        link?.invalidate()
        link = nil
        controller = nil
    }

    @objc private func step() {
        guard let controller else { return }
        let now = CACurrentMediaTime()
        DispatchQueue.main.async {
            controller.tickQuizAttackGauge(now: now)
        }
    }
}
