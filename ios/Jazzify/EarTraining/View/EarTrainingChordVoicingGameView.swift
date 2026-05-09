import SwiftUI
import SpriteKit
import UIKit

/// バトル起動時に渡すステージ識別子。レッスン経由は UUID、ログイン画面のデモは slug を使う。
enum EarTrainingStageSource {
    case id(UUID)
    case slug(String)
}

/// コード演奏バトルモード ([src/components/earTraining/EarTrainingChordVoicingScreen.tsx]) の iOS 画面。
struct EarTrainingChordVoicingGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    let onClose: () -> Void

    @State private var controller: EarTrainingChordVoicingBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingChordVoicingContent(
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
            let stageDetail: EarTrainingStageDetail
            switch source {
            case .id(let stageId):
                stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            case .slug(let slug):
                stageDetail = try await SupabaseService.shared.fetchEarTrainingStageDetailBySlug(slug: slug)
            }
            let phrases = stageDetail.sortedPhrases()
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
            let createdController = EarTrainingChordVoicingBattleController(
                stage: stageDetail,
                phrases: phrases,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                enemyId: stageDetail.id.uuidString,
                enemyName: stageDetail.localizedTitle(locale),
                audio: audioInstance,
                onExit: onClose
            )

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

private struct EarTrainingChordVoicingContent: View {
    @ObservedObject var controller: EarTrainingChordVoicingBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let onClose: () -> Void

    private static let pianoOverlayHeight: CGFloat = 80

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
        ZStack {
            feedbackBackground
            ChordVoicingEarTrainingSceneContainer(driver: controller, sceneSize: size)
                .ignoresSafeArea()
                .background(
                    GeometryReader { proxy in
                        Color.clear
                            .preference(
                                key: ChordVoicingSceneFrameKey.self,
                                value: proxy.frame(in: .global)
                            )
                    }
                )

            VStack(spacing: 0) {
                EarTrainingHUDView(
                    hud: controller.hudModel,
                    horizontalPadding: hudHorizontalPadding,
                    showsSlotsRow: false,
                    onSettings: { controller.handleOpenSettings() },
                    onBack: { controller.handleBack() }
                )
                Spacer()
            }

            staffOverlay(size: size)
            chordVoicingSlotsOverlay(size: size)

            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(player: controller)
                    .ignoresSafeArea(.container, edges: .horizontal)
                    .padding(.bottom, 4)
            }

            EarTrainingResultView(host: controller)
        }
        .onPreferenceChange(ChordVoicingActiveChordLabelFrameKey.self) { frame in
            controller.activeChordLabelGlobalFrame = frame
        }
        .onPreferenceChange(ChordVoicingSceneFrameKey.self) { frame in
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
        if let phrase = controller.currentPhrase {
            let build = EarTrainingChordVoicingStaffLayout.buildGroups(
                input: EarTrainingChordVoicingStaffLayout.BuildInput(
                    phrase: phrase,
                    stageLoopMeasures: controller.stage.loopMeasures,
                    activeMeasureNumber: controller.activeMeasureNumber,
                    activeChordId: controller.activeChord?.id,
                    attempt: controller.attempt
                )
            )
            let correctMap = EarTrainingChordVoicingStaffLayout.correctPitchClassesByGroupId(attempt: controller.attempt)
            let keyFifths = phrase.keyFifths ?? controller.stage.keyFifths ?? 0
            if !build.groups.isEmpty {
                ChordVoicingStaffGroupsView(
                    groups: build.groups,
                    denseCurrentMeasureLayout: build.denseCurrentMeasureLayout,
                    keyFifths: keyFifths,
                    activeGroupId: controller.activeChord?.id,
                    correctPitchClassesByGroupId: correctMap,
                    completionPulse: controller.completionPulse
                )
                .frame(width: min(size.width * 0.63, 600), height: size.height * 0.5)
                .position(x: size.width / 2, y: size.height * 0.42)
                .allowsHitTesting(false)
            }
        }
    }

    @ViewBuilder
    private func chordVoicingSlotsOverlay(size: CGSize) -> some View {
        let hud = controller.hudModel
        if case let .chordVoicing(slotCount, completed, currentIndex) = hud.slotRow,
           !controller.showLobbyControls {
            let slotSize = ChordVoicingBottomSlotsView.slotSize(
                slotCount: slotCount,
                availableWidth: min(size.width * 0.52, 260)
            )
            ChordVoicingBottomSlotsView(
                slotCount: slotCount,
                completed: completed,
                currentIndex: currentIndex
            )
            .frame(width: min(size.width * 0.52, 260), height: slotSize + 6)
            .position(
                x: size.width / 2,
                y: size.height - Self.pianoOverlayHeight - slotSize / 2 - 8
            )
            .allowsHitTesting(false)
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

/// SpriteKit シーンのグローバル座標フレーム。Controller が SwiftUI 座標 → シーン座標変換に利用する。
private struct ChordVoicingSceneFrameKey: PreferenceKey {
    static var defaultValue: CGRect = .zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        let next = nextValue()
        if next != .zero {
            value = next
        }
    }
}

private struct ChordVoicingBottomSlotsView: View {
    let slotCount: Int
    let completed: [Bool]
    let currentIndex: Int

    private static let gap: CGFloat = 6

    var body: some View {
        GeometryReader { proxy in
            let count = max(1, slotCount)
            let slotSize = Self.slotSize(slotCount: count, availableWidth: proxy.size.width)
            HStack(spacing: Self.gap) {
                ForEach(0..<count, id: \.self) { index in
                    let done = index < completed.count ? completed[index] : false
                    ZStack {
                        RoundedRectangle(cornerRadius: 3, style: .continuous)
                            .fill(Color.black.opacity(0.36))
                            .overlay(
                                RoundedRectangle(cornerRadius: 3, style: .continuous)
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )
                        Circle()
                            .fill(done ? Color(hex: "10b981").opacity(0.95) : Color.clear)
                            .overlay(
                                Circle()
                                    .stroke(
                                        done ? Color(hex: "bbf7d0") : Color.white.opacity(0.42),
                                        lineWidth: done ? 2.5 : 2
                                    )
                            )
                            .frame(width: slotSize * 0.68, height: slotSize * 0.68)
                        if done {
                            Image(systemName: "checkmark")
                                .font(.system(size: slotSize * 0.34, weight: .bold))
                                .foregroundStyle(Color(hex: "bbf7d0"))
                        }
                    }
                    .frame(width: slotSize, height: slotSize)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
        .id("\(slotCount)-\(currentIndex)-\(completed)")
    }

    static func slotSize(slotCount: Int, availableWidth: CGFloat) -> CGFloat {
        let count = max(1, slotCount)
        let gaps = CGFloat(max(0, count - 1)) * gap
        let raw = (max(44, availableWidth) - gaps) / CGFloat(count)
        return min(22, max(16, raw))
    }
}

// MARK: - SpriteKit (コードヴォイシング用に `EarTrainingGameView` と同型のコンテナを複製)

private struct ChordVoicingEarTrainingSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
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
