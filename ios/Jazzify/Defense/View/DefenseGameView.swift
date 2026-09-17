import SpriteKit
import SwiftUI
import UIKit

struct DefenseGameView: View {
    @StateObject private var session: DefenseGameSession
    @State private var scene: DefenseScene
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var isSettingsOpen = false
    @State private var isSessionReady = false
    let locale: AppLocale
    let onClose: () -> Void
    let onApplyPracticeModeAndRestart: (Bool) -> Void
    let playMapNodeId: UUID?
    let tutorialOptions: DefenseTutorialOptions?
    let tutorialInputMethod: NoteInputMethod?
    let tutorialStaffGroups: [DefenseTutorialStaffGroup]?
    let tutorialClefOverride: NotationInstrumentClef?
    let tutorialConcertPitchClasses: [Int]?
    let suppressResultScreen: Bool
    let onPlayMapCleared: (() -> Void)?
    let onFinished: ((DefenseFinishSummary) -> Void)?
    let onTutorialPhraseSucceeded: (() -> Void)?

    init(
        stage: DefenseStageDefinition,
        difficulty: DefenseDifficultyDefinition,
        practiceMode: Bool,
        lessonContext: DefenseLessonContext?,
        locale: AppLocale,
        playMapNodeId: UUID? = nil,
        tutorialOptions: DefenseTutorialOptions? = nil,
        tutorialInputMethod: NoteInputMethod? = nil,
        tutorialStaffGroups: [DefenseTutorialStaffGroup]? = nil,
        tutorialClefOverride: NotationInstrumentClef? = nil,
        tutorialConcertPitchClasses: [Int]? = nil,
        suppressResultScreen: Bool = false,
        onClose: @escaping () -> Void,
        onApplyPracticeModeAndRestart: @escaping (Bool) -> Void,
        onPlayMapCleared: (() -> Void)? = nil,
        onFinished: ((DefenseFinishSummary) -> Void)? = nil,
        onTutorialPhraseSucceeded: (() -> Void)? = nil
    ) {
        _session = StateObject(wrappedValue: DefenseGameSession(
            stage: stage,
            difficulty: difficulty,
            practiceMode: practiceMode,
            lessonContext: lessonContext,
            tutorialOptions: tutorialOptions
        ))
        _scene = State(initialValue: DefenseScene(size: CGSize(width: 800, height: 600)))
        self.locale = locale
        self.playMapNodeId = playMapNodeId
        self.tutorialOptions = tutorialOptions
        self.tutorialInputMethod = tutorialInputMethod
        self.tutorialStaffGroups = tutorialStaffGroups
        self.tutorialClefOverride = tutorialClefOverride
        self.tutorialConcertPitchClasses = tutorialConcertPitchClasses
        self.suppressResultScreen = suppressResultScreen
        self.onClose = onClose
        self.onApplyPracticeModeAndRestart = onApplyPracticeModeAndRestart
        self.onPlayMapCleared = onPlayMapCleared
        self.onFinished = onFinished
        self.onTutorialPhraseSucceeded = onTutorialPhraseSucceeded
    }

    private var isTutorialSession: Bool { tutorialOptions != nil }

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
            isSessionReady = false
            await session.start()
            isSessionReady = true
        }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            session.stop()
            isSessionReady = false
        }
        .onChange(of: session.hud.result) { result in
            if isTutorialSession { return }
            if result == .clear, playMapNodeId != nil, !session.practiceMode {
                onPlayMapCleared?()
            }
            if result != .playing, let onFinished {
                onFinished(DefenseFinishSummary(
                    result: result,
                    surviveSec: Int(session.runtime.elapsedSec.rounded(.down)),
                    enemiesDefeated: session.runtime.enemiesDefeated
                ))
            }
        }
        .onChange(of: session.judgeState.correctNoteIndices) { _ in
            guard isTutorialSession else { return }
            let totalSteps = DefenseTutorialConstants.targetPitchClasses.count
            if session.judgeState.correctNoteIndices.count >= totalSteps
                || session.judgeState.targetStepIndex >= totalSteps {
                onTutorialPhraseSucceeded?()
            }
        }
        .sheet(isPresented: $isSettingsOpen, onDismiss: {
            session.isPaused = false
        }) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                stageRunMode: EarTrainingStageRunModeConfig(
                    practiceMode: session.practiceMode,
                    onApplyPracticeModeAndRestart: { mode in
                        isSettingsOpen = false
                        onApplyPracticeModeAndRestart(mode)
                    }
                ),
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
            DefenseSceneContainer(scene: scene, sceneSize: size)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                defenseHud
                if let phrase = session.stage.phrases[safe: session.judgeState.phraseIndex],
                   !phrase.chords.isEmpty {
                    defenseNeonChordDisplay(
                        labels: DefenseChordHudLabels.make(
                            chordNames: phrase.chords.map(\.chordName),
                            chordIndex: session.judgeState.chordIndex
                        )
                    )
                    .padding(.top, 4)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .ignoresSafeArea(edges: .top)

            if isTutorialSession,
               let tutorialStaffGroups,
               let concertPitchClasses = tutorialConcertPitchClasses {
                let staffDisplay = BuildDefenseTutorialStaffDisplay.build(
                    baseGroups: tutorialStaffGroups,
                    judge: session.judgeState,
                    concertPitchClasses: concertPitchClasses
                )
                let staffPlacement = EarTrainingBattleStaffBandLayout.staffOverlayPlacement(
                    sceneHeight: size.height,
                    hudHeight: EarTrainingBattleStaffBandLayout.compactBattleHudHeight,
                    hasLabelBand: true,
                    keyboardHeight: Self.pianoHeight
                )
                DefenseTutorialStaffView(
                    staffDisplay: staffDisplay,
                    keyFifths: session.stage.keyFifths,
                    clefOverride: tutorialClefOverride
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
            } else if let phrase = session.stage.phrases[safe: session.judgeState.phraseIndex] {
                let staffPlacement = EarTrainingBattleStaffBandLayout.staffOverlayPlacement(
                    sceneHeight: size.height,
                    hudHeight: EarTrainingBattleStaffBandLayout.compactBattleHudHeight,
                    hasLabelBand: !phrase.chords.isEmpty,
                    keyboardHeight: Self.pianoHeight
                )
                DefensePhraseStaffView(
                    phrase: phrase,
                    stageKeyFifths: session.stage.keyFifths,
                    chordIndex: session.judgeState.chordIndex,
                    judgeState: session.judgeState,
                    staffLayout: session.stage.staffLayout,
                    showTargetHints: session.practiceMode || staffOpacity > 0,
                    unpressedNoteOpacity: session.practiceMode ? 1 : staffOpacity
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

            if session.practiceMode {
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    defensePracticeHud
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.leading, 12)
                        .padding(.bottom, Self.pianoHeight + 8)
                }
            }

            VStack(spacing: 0) {
                Spacer(minLength: 0)
                SurvivalChordPadView(
                    snapshot: chordPadSnapshot,
                    displayRange: chordPadRange,
                    onPress: { midi in
                        session.handleNoteOn(pitchClass: ((midi % 12) + 12) % 12, sequential: false)
                        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: 100)
                    },
                    onRelease: { midi in
                        SurvivalGameAudio.shared.pianoNoteOff(midi: midi)
                    },
                    keyboardHeight: Self.pianoHeight
                )
                .equatable()
                .frame(height: Self.pianoHeight)
            }

            if session.hud.result != .playing, onFinished == nil, !suppressResultScreen {
                resultOverlay
            }

            if !isSessionReady {
                GameLaunchLoadingOverlay(
                    locale: locale,
                    tint: .green,
                    message: locale == .ja ? "ステージを準備中…" : "Preparing stage…"
                )
            }
        }
    }

    private static let pianoHeight: CGFloat = EarTrainingBattleStageKit.chordPadKeyboardHeight

    private static var isPhone: Bool {
        UIDevice.current.userInterfaceIdiom == .phone
    }

    private var defensePracticeHud: some View {
        let phraseLabel = locale == .ja
            ? "フレーズ\(session.judgeState.phraseIndex + 1)"
            : "Phrase \(session.judgeState.phraseIndex + 1)"
        let canStepPhrase = session.stage.phrases.count > 1

        return defensePracticeStepperRow(
            label: phraseLabel,
            canDecrease: canStepPhrase,
            canIncrease: canStepPhrase,
            onDecrease: { session.stepPhrase(-1) },
            onIncrease: { session.stepPhrase(1) }
        )
        .padding(.horizontal, 8)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.55))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var defenseSpeedStepper: some View {
        let canDecrease = session.practiceSpeedPercent > DefensePracticeSpeed.minPercent
        let canIncrease = session.practiceSpeedPercent < DefensePracticeSpeed.maxPercent
        return HStack(spacing: 4) {
            Button {
                session.stepSpeed(-1)
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 11, weight: .bold))
                    .frame(width: 26, height: 26)
            }
            .disabled(!canDecrease)
            .opacity(canDecrease ? 1 : 0.35)
            .accessibilityLabel(Text(locale == .ja ? "速度を下げる" : "Decrease speed"))

            Text("\(session.practiceSpeedPercent)%")
                .font(.system(size: 12, weight: .heavy, design: .rounded))
                .frame(minWidth: 40)
                .multilineTextAlignment(.center)

            Button {
                session.stepSpeed(1)
            } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .frame(width: 26, height: 26)
            }
            .disabled(!canIncrease)
            .opacity(canIncrease ? 1 : 0.35)
            .accessibilityLabel(Text(locale == .ja ? "速度を上げる" : "Increase speed"))
        }
        .foregroundColor(.white)
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(Color.black.opacity(0.55))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private func defensePracticeStepperRow(
        label: String,
        canDecrease: Bool,
        canIncrease: Bool,
        onDecrease: @escaping () -> Void,
        onIncrease: @escaping () -> Void
    ) -> some View {
        HStack(spacing: 6) {
            Button(action: onDecrease) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 12, weight: .bold))
                    .frame(width: 28, height: 28)
            }
            .disabled(!canDecrease)
            .opacity(canDecrease ? 1 : 0.35)

            Text(label)
                .font(.system(size: 13, weight: .heavy, design: .rounded))
                .frame(minWidth: 88)
                .multilineTextAlignment(.center)

            Button(action: onIncrease) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .bold))
                    .frame(width: 28, height: 28)
            }
            .disabled(!canIncrease)
            .opacity(canIncrease ? 1 : 0.35)
        }
        .foregroundColor(.white)
    }

    private var defenseHud: some View {
        let labels = EarTrainingBattleHudLabels.make(isEnglish: locale == .en)
        let timeLabel: String
        if session.practiceMode {
            timeLabel = "∞  ·  KO \(session.runtime.enemiesDefeated)"
        } else if session.hud.wave > 0 {
            timeLabel = "\(session.hud.remainSec)s  ·  KO \(session.runtime.enemiesDefeated)  ·  WAVE \(session.hud.wave)/\(DefenseEnemyConfig.waveCount)"
        } else {
            timeLabel = "\(session.hud.remainSec)s  ·  KO \(session.runtime.enemiesDefeated)"
        }

        return EarTrainingHUDView(
            hud: EarTrainingHudModel(
                playerHp: session.hud.playerHp,
                playerMaxHp: session.hud.playerMaxHp,
                enemyHp: 0,
                enemyMaxHp: 1,
                practiceMode: session.practiceMode,
                timeRemaining: session.hud.remainSec,
                timeLabel: timeLabel,
                hideTimeLabel: false,
                hidePlayerHpBar: false,
                hideEnemyHpBar: true,
                hideSettingsButton: false,
                hideBackButton: false,
                enemyAttackGaugePercent: 0,
                hideEnemyAttackGauge: true,
                hideChordChips: true,
                hideSlotsRow: true,
                hudLabels: labels,
                gameState: .playingPhrase,
                phraseRunId: 0,
                chordChips: [],
                slotRow: .melody(slots: [], revealed: [], currentIndex: 0)
            ),
            showsSlotsRow: false,
            healthRowTrailingReserve: 216,
            onSettings: {
                session.isPaused = true
                isSettingsOpen = true
            },
            onBack: onClose,
            rightControlsLeading: isTutorialSession ? nil : AnyView(defenseSpeedStepper)
        )
    }

    private func defenseNeonChordDisplay(labels: DefenseChordHudLabels) -> some View {
        defenseNeonCodeBadge(value: labels.current)
            .allowsHitTesting(false)
    }

    private func defenseNeonCodeBadge(value: String) -> some View {
        Text(value)
            .font(.system(size: 34, weight: .heavy, design: .rounded))
            .foregroundStyle(Color(red: 1.0, green: 0.88, blue: 0.30))
            .lineLimit(1)
            .minimumScaleFactor(0.65)
            .shadow(color: Color(red: 0.90, green: 0.22, blue: 0.34).opacity(0.9), radius: 4, x: 0, y: 2)
            .shadow(color: .black.opacity(0.85), radius: 1, x: 0, y: 1)
            .frame(minWidth: 160, maxWidth: 240)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
    }

    private var staffOpacity: Double {
        hintOpacity(mode: session.stage.productionStaffHintMode)
    }

    private var keyboardHintOpacity: CGFloat {
        CGFloat(hintOpacity(mode: session.stage.productionKeyboardHintMode))
    }

    private func hintOpacity(mode: String) -> Double {
        if session.practiceMode { return 1 }
        switch mode {
        case "always": return 1
        case "hidden_until_pressed": return 0
        default:
            let t = session.hud.elapsedInt
            if t < 11 { return 1 }
            if t >= 15 { return 0 }
            return 1 - Double(t - 10) * 0.2
        }
    }

    private var keyboardHints: DefensePhraseJudge.KeyboardHints {
        DefensePhraseJudge.keyboardHints(
            state: session.judgeState,
            sequential: effectiveSequentialInput
        )
    }

    private var effectiveSequentialInput: Bool {
        if let tutorialInputMethod {
            return tutorialInputMethod == .voice
        }
        return NoteInputManager.shared.isVoiceInputActive
    }

    private var chordPadSnapshot: SurvivalChordPadSnapshot {
        SurvivalChordPadSnapshot(
            hintMidis: keyboardHints.pendingMidis.union(keyboardHints.nextMidis),
            nextHintMidis: keyboardHints.nextMidis,
            completedHintMidis: keyboardHints.completedMidis,
            hintPendingOpacity: keyboardHintOpacity,
            midiHeldKeys: session.midiHeldKeys,
            isEnabled: session.hud.result == .playing && !isSettingsOpen,
            scrollAnchorMidi: nil
        )
    }

    private var chordPadRange: PianoStagePitchRange {
        DefenseKeyboardRange.resolvedDisplayRange(
            for: session.stage,
            displayMode: keyboardDisplayMode
        )
    }

    private var resultOverlay: some View {
        VStack(spacing: 12) {
            Text(session.hud.result == .clear
                 ? (locale == .ja ? "クリア！" : "Clear!")
                 : (locale == .ja ? "ゲームオーバー" : "Game Over"))
                .font(.title.bold())
            Text(locale == .ja ? "撃破 \(session.runtime.enemiesDefeated)" : "Defeated \(session.runtime.enemiesDefeated)")
            Button(locale == .ja ? "閉じる" : "Close", action: onClose)
                .buttonStyle(.borderedProminent)
        }
        .padding(24)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

private struct DefenseSceneContainer: UIViewRepresentable {
    let scene: DefenseScene
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
        private weak var scene: DefenseScene?
        private var activeObserver: NSObjectProtocol?

        func attach(view: SKView, scene: DefenseScene) {
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

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
