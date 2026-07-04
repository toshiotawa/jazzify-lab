import SwiftUI
import SpriteKit
import UIKit
import WebKit
import os.log

/// OSMD リズム判定バトル（`mode == chord_osmd`）ネイティブ画面。
struct EarTrainingChordOSMDGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    var hostedLandscapeSize: CGSize?
    var prewarmOsmdPack: EarTrainingTutorialPrewarmedOsmdPack?
    let onClose: () -> Void

    @State private var controller: EarTrainingChordOSMDBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingChordOSMDContent(
                    controller: controller,
                    audio: audio,
                    locale: locale,
                    fixedLandscapeSize: hostedLandscapeSize
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
            Text(locale == .ja ? "バトルを準備中…" : "Preparing battle…")
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
        if let pack = prewarmOsmdPack {
            isLoading = true
            loadError = nil
            attachMidiFinishOsmdBootstrap(createdController: pack.controller, audioInstance: pack.audio)
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
            let phrases = stageDetail.sortedPhrases()
            guard !phrases.isEmpty else {
                loadError = locale == .ja
                    ? "フレーズが登録されていません"
                    : "No phrases are registered for this stage."
                isLoading = false
                return
            }
            guard phrases.contains(where: { $0.musicXmlUrl != nil }) else {
                loadError = locale == .ja
                    ? "OSMD表示用のMusicXMLが登録されていません"
                    : "No MusicXML is registered for OSMD display."
                isLoading = false
                return
            }

            let audioInstance = EarTrainingAudio()
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            let createdController = EarTrainingChordOSMDBattleController(
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

            attachMidiFinishOsmdBootstrap(createdController: createdController, audioInstance: audioInstance)
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }

    @MainActor
    private func attachMidiFinishOsmdBootstrap(
        createdController: EarTrainingChordOSMDBattleController,
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

private struct EarTrainingChordOSMDContent: View {
    @ObservedObject var controller: EarTrainingChordOSMDBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let fixedLandscapeSize: CGSize?

    @State private var hudHorizontalPadding: CGFloat = 16
    /// OSMD 譜面コンテナの拡縮ステップ（-2 ... +2、`containerScaleTable` のインデックスは step + 2）。
    @State private var scoreSizeStep: Int = 0

    private static let containerScaleTable: [Double] = [0.80, 0.90, 1.00, 1.15, 1.30]

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
        }
        .sheet(isPresented: $controller.isSettingsOpen) {
            let isTutorialSettings = controller.tutorialHooks != nil
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                scope: isTutorialSettings ? .tutorial : .battle,
                stageRunMode: isTutorialSettings ? nil : controller.lessonContext.map { _ in
                    EarTrainingStageRunModeConfig(
                        practiceMode: controller.practiceMode,
                        onApplyPracticeModeAndRestart: { mode in
                            controller.applyPracticeModeAndRestart(mode)
                            controller.handleCloseSettings()
                        }
                    )
                },
                practiceTranspose: isTutorialSettings ? nil : (
                    controller.stage.resolvedPracticeTranspose
                        ? EarTrainingPracticeTransposeConfig(
                            enabled: true,
                            practiceMode: controller.practiceMode,
                            originalKeyFifths: controller.practiceOriginalKeyFifths,
                            originalKeyName: controller.practiceOriginalKeyName,
                            appliedOffset: controller.practiceTransposeOffset
                        )
                        : nil
                ),
                practiceSpeed: isTutorialSettings ? nil : EarTrainingPracticeSpeedConfig(
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
                onRestartFromBeginning: isTutorialSettings ? {
                    controller.handleCloseSettings()
                    controller.startBattle()
                } : nil,
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    private func landscapeContent(size: CGSize) -> some View {
        let staffBottomY = EarTrainingBattleStaffBandLayout.osmdStaffBottomY(sceneSize: size)
        return ZStack {
            feedbackBackground

            EarTrainingChordOSMDSceneContainer(
                driver: controller,
                sceneSize: size,
                staffReservedBandBottomY: staffBottomY
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

            scoreOverlay(size: size)

            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(
                    player: controller
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

    @ViewBuilder
    private func scoreOverlay(size: CGSize) -> some View {
        let leftInset = hudHorizontalPadding
        let outerWidth = (size.width - leftInset) * 0.98
        let centerY = size.height * 0.36
        let baseHeight = min(size.height * 0.55, 360)
        let outerHeight = min(size.height * 0.72, max(size.height * 0.26, baseHeight))

        let tableIndex = min(max(scoreSizeStep + 2, 0), Self.containerScaleTable.count - 1)
        let containerScale = Self.containerScaleTable[tableIndex]
        let shrinkDisabled = scoreSizeStep <= -2
        let enlargeDisabled = scoreSizeStep >= 2

        // OSMD コンテナ高さに収めるためのベースズーム。WebView 側でレンダー後に高さを測り、
        // 必要なら縮小再描画して五線・音符が完全に収まるようにする。
        // 2段譜以上では iPhone のみ明示的に小さく開始（iPad は変更なし）。
        let isPhone = UIDevice.current.userInterfaceIdiom == .phone
        let maxStaffFromXml = controller.musicXMLText.map {
            EarTrainingChordOsmdMusicXmlNormalizer.detectMaxStaffLayersFromMusicXmlString($0)
        } ?? 1
        let maxStaffLayersForZoom = max(controller.musicXMLMaxStaffLayers, maxStaffFromXml)
        let multiStaff = maxStaffLayersForZoom >= 2
        let osmdZoom: Double = isPhone ? (multiStaff ? 0.48 : 0.72) : 0.85

        ZStack {
            ZStack {
                if let musicXMLText = controller.musicXMLText {
                    EarTrainingOSMDScoreWebView(
                        scoreScrollActive: controller.scoreScrollActive,
                        activeMeasureNumber: controller.activeMeasureNumber,
                        measureDurationSec: controller.effectiveMeasureDurationSec,
                        musicXMLText: musicXMLText,
                        renderKey: controller.phraseRunId,
                        zoom: osmdZoom,
                        scrollLayout: .battleDefault
                    )
                } else {
                    VStack(spacing: 10) {
                        if controller.gameState == .idle {
                            Text(controller.quizRulesLine ?? "")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.72))
                                .multilineTextAlignment(.center)
                        } else if let scoreError = controller.scoreErrorText {
                            Image(systemName: "music.note.list")
                                .font(.title2)
                                .foregroundStyle(.white.opacity(0.68))
                            Text(scoreError)
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.72))
                                .multilineTextAlignment(.center)
                        } else {
                            ProgressView().tint(.white)
                        }
                    }
                    .padding(.horizontal, 18)
                }
            }
            .frame(width: outerWidth, height: outerHeight, alignment: .leading)
            .scaleEffect(containerScale, anchor: .leading)
            .frame(width: outerWidth, height: outerHeight, alignment: .leading)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .clipped()
            .allowsHitTesting(false)

            scoreZoomControlsOuter(
                enlargeDisabled: enlargeDisabled,
                shrinkDisabled: shrinkDisabled,
                outerWidth: outerWidth,
                outerHeight: outerHeight
            )
        }
        .position(x: leftInset + outerWidth / 2, y: centerY)
    }

    @ViewBuilder
    private func scoreZoomControlsOuter(
        enlargeDisabled: Bool,
        shrinkDisabled: Bool,
        outerWidth: CGFloat,
        outerHeight: CGFloat
    ) -> some View {
        HStack(spacing: 6) {
            scoreZoomChipButton(
                systemName: "minus.magnifyingglass",
                accessibilityLabel: locale == .ja ? "譜面を縮小" : "Shrink score",
                disabled: shrinkDisabled,
                action: {
                    guard scoreSizeStep > -2 else { return }
                    scoreSizeStep -= 1
                }
            )

            scoreZoomChipButton(
                systemName: "plus.magnifyingglass",
                accessibilityLabel: locale == .ja ? "譜面を拡大" : "Enlarge score",
                disabled: enlargeDisabled,
                action: {
                    guard scoreSizeStep < 2 else { return }
                    scoreSizeStep += 1
                }
            )
        }
        .padding(.trailing, 6)
        .padding(.bottom, 6)
        .frame(width: outerWidth, height: outerHeight, alignment: .bottomTrailing)
    }

    @ViewBuilder
    private func scoreZoomChipButton(
        systemName: String,
        accessibilityLabel label: String,
        disabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .symbolRenderingMode(.monochrome)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.white.opacity(0.14))
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
        .opacity(disabled ? 0.28 : 1)
        .disabled(disabled)
        .accessibilityLabel(label)
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

private struct EarTrainingChordOSMDSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
    let driver: Driver
    let sceneSize: CGSize
    let staffReservedBandBottomY: CGFloat?

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
        context.coordinator.update(
            sceneSize: normalizedSceneSize(sceneSize),
            staffReservedBandBottomY: staffReservedBandBottomY
        )
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
        func update(sceneSize: CGSize, staffReservedBandBottomY: CGFloat?) {
            view?.bounds = CGRect(origin: .zero, size: sceneSize)
            guard let scene else { return }
            if scene.size != sceneSize {
                scene.size = sceneSize
            }
            scene.setStaffReservedBandBottomY(staffReservedBandBottomY)
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
