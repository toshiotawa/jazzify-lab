import SpriteKit
import SwiftUI
import UIKit

struct TrainingGameView: View {
    @StateObject private var session: TrainingGameSession
    @State private var scene: TrainingScene
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var stageKeyboardRange: PianoStagePitchRange?
    @State private var isSettingsOpen = false
    let locale: AppLocale
    let onClose: () -> Void
    let onFinished: (Int) -> Void

    private static let pianoHeight: CGFloat = EarTrainingBattleStageKit.chordPadKeyboardHeight

    init(
        training: TrainingRow,
        practiceMode: Bool,
        lessonContext: TrainingLessonContext?,
        locale: AppLocale,
        onClose: @escaping () -> Void,
        onFinished: @escaping (Int) -> Void
    ) {
        _session = StateObject(wrappedValue: TrainingGameSession(
            training: training,
            practiceMode: practiceMode,
            lessonContext: lessonContext
        ))
        _scene = State(initialValue: TrainingScene(size: CGSize(width: 800, height: 600)))
        self.locale = locale
        self.onClose = onClose
        self.onFinished = onFinished
        _stageKeyboardRange = State(initialValue: TrainingKeyboardRange.stageRange(training: training))
    }

    var body: some View {
        Group {
            if Self.isPhone {
                GeometryReader { proxy in
                    let portraitSize = proxy.size
                    let landscapeSize = CGSize(
                        width: max(1, portraitSize.height),
                        height: max(1, portraitSize.width)
                    )

                    playfield(size: landscapeSize)
                        .frame(width: landscapeSize.width, height: landscapeSize.height)
                        .clipped()
                        .rotationEffect(.degrees(90))
                        .frame(width: portraitSize.width, height: portraitSize.height)
                        .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
                }
            } else {
                GeometryReader { proxy in
                    playfield(size: proxy.size)
                }
            }
        }
        .preferredColorScheme(.dark)
        .syncPianoKeyboardDisplayMode($keyboardDisplayMode)
        .onAppear {
            OrientationManager.shared.lock(.portrait)
            scene.session = session
        }
        .task {
            await session.start()
        }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            session.stop()
        }
        .onChange(of: session.hud.phase) { phase in
            if phase == .finished {
                onFinished(session.runtime.score)
            }
        }
        .sheet(isPresented: $isSettingsOpen, onDismiss: {
            session.isPaused = false
        }) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                onDismiss: { isSettingsOpen = false },
                onExit: onClose
            )
        }
    }

    @ViewBuilder
    private func playfield(size: CGSize) -> some View {
        ZStack {
            Color(uiColor: EarTrainingBattleStageKit.jazzBackdropEdgeColor)
                .ignoresSafeArea()
            TrainingSceneContainer(scene: scene, sceneSize: size)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                trainingHud
                if let question = session.question,
                   session.hud.phase != .countdown,
                   !question.promptLabel.isEmpty {
                    trainingPromptLabel(question.promptLabel)
                        .padding(.top, 4)
                }
                Spacer(minLength: 0)
            }
            .ignoresSafeArea(edges: .top)

            if let question = session.question, session.hud.phase != .countdown {
                staffOverlay(question: question, size: size)
            }

            if session.hud.phase == .countdown {
                Color.black.opacity(0.35).ignoresSafeArea()
                Text("\(session.hud.countdownSec)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
            }

            VStack(spacing: 0) {
                Spacer(minLength: 0)
                SurvivalChordPadView(
                    snapshot: chordPadSnapshot,
                    displayRange: chordPadRange,
                    onPress: { midi in
                        session.handleNoteOn(midiNote: midi)
                        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: 100)
                    },
                    onRelease: { midi in SurvivalGameAudio.shared.pianoNoteOff(midi: midi) },
                    keyboardHeight: Self.pianoHeight
                )
                .frame(height: Self.pianoHeight)
            }
        }
    }

    @ViewBuilder
    private func staffOverlay(question: TrainingQuestion, size: CGSize) -> some View {
        let staffPlacement = EarTrainingBattleStaffBandLayout.staffOverlayPlacement(
            sceneHeight: size.height,
            hudHeight: TrainingConstants.hudHeight,
            hasLabelBand: !question.promptLabel.isEmpty,
            keyboardHeight: Self.pianoHeight
        )
        TrainingStaffView(
            question: question,
            correctIndices: session.correctIndices,
            showHints: session.practiceMode,
            kind: session.training.kind,
            unpressedNoteOpacity: TrainingConstants.staffNoteOpacity(
                practiceMode: session.practiceMode,
                kind: session.training.kind
            ),
            clefMode: session.training.clefMode
        )
        .padding(.horizontal, 12)
        .frame(
            width: min(
                size.width * EarTrainingBattleStaffBandLayout.defaultStaffWidthRatio,
                EarTrainingBattleStaffBandLayout.defaultStaffMaxWidth
            ),
            height: staffPlacement.height
        )
        .position(x: size.width / 2, y: staffPlacement.centerY)
        .allowsHitTesting(false)
    }

    private func trainingPromptLabel(_ label: String) -> some View {
        Text(label)
            .font(.system(size: Self.isPhone ? 26 : 28, weight: .heavy, design: .rounded))
            .foregroundStyle(Color(red: 1.0, green: 0.88, blue: 0.30))
            .multilineTextAlignment(.center)
            .lineLimit(2)
            .minimumScaleFactor(0.7)
            .shadow(color: Color(red: 0.90, green: 0.22, blue: 0.34).opacity(0.9), radius: 4, x: 0, y: 2)
            .shadow(color: .black.opacity(0.85), radius: 1, x: 0, y: 1)
            .allowsHitTesting(false)
    }

    private static var isPhone: Bool {
        UIDevice.current.userInterfaceIdiom == .phone
    }

    private var trainingHud: some View {
        let timeLabel = session.hud.phase == .countdown
            ? "\(session.hud.countdownSec)"
            : "\(session.hud.remainSec)s"

        return HStack {
            Text("SCORE \(session.hud.score)")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(.yellow)

            Spacer()

            Text(timeLabel)
                .font(.system(size: 30, weight: .black, design: .rounded))
                .foregroundStyle(.white)

            Spacer()

            HStack(spacing: 8) {
                Button {
                    session.isPaused = true
                    isSettingsOpen = true
                } label: {
                    Text(locale == .en ? "Settings" : "設定")
                        .font(.caption.weight(.black))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.75))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)

                Button(action: onClose) {
                    Text(locale == .en ? "Exit" : "終了")
                        .font(.caption.weight(.black))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.75))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 18)
        .frame(height: TrainingConstants.hudHeight)
        .frame(maxWidth: .infinity)
        .background(Color(red: 0.01, green: 0.02, blue: 0.09).opacity(0.66))
    }

    private var hintMidis: Set<Int> {
        guard session.practiceMode, let question = session.question else { return [] }
        return Set(TrainingEngine.keyboardHintMidis(
            question: question,
            correctIndices: session.correctIndices,
            showHints: true
        ))
    }

    private var referenceHintMidis: Set<Int> {
        guard let question = session.question else { return [] }
        return Set(TrainingEngine.keyboardReferenceMidis(question: question))
    }

    private var chordPadSnapshot: SurvivalChordPadSnapshot {
        SurvivalChordPadSnapshot(
            hintMidis: hintMidis,
            nextHintMidis: hintMidis,
            completedHintMidis: [],
            hintPendingOpacity: session.practiceMode ? 1 : 0,
            midiHeldKeys: session.midiHeldKeys,
            isEnabled: session.hud.phase == .playing && !isSettingsOpen,
            scrollAnchorMidi: nil,
            referenceHintMidis: referenceHintMidis
        )
    }

    private var chordPadRange: PianoStagePitchRange {
        TrainingKeyboardRange.resolvedDisplayRange(
            stageRange: stageKeyboardRange,
            displayMode: keyboardDisplayMode
        )
    }
}

private struct TrainingSceneContainer: UIViewRepresentable {
    let scene: TrainingScene
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
        view.allowsTransparency = true

        scene.scaleMode = .resizeFill
        scene.isPaused = false
        if view.scene !== scene {
            view.presentScene(scene)
        }
        context.coordinator.attach(view: view, scene: scene)
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
        private weak var scene: TrainingScene?
        private var activeObserver: NSObjectProtocol?

        func attach(view: SKView, scene: TrainingScene) {
            self.view = view
            self.scene = scene
            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                if let view = self?.view, view.isPaused { view.isPaused = false }
                if let scene = self?.scene, scene.isPaused { scene.isPaused = false }
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
            view?.isPaused = true
            view?.presentScene(nil)
            view = nil
            scene = nil
        }
    }
}
