import SpriteKit
import SwiftUI

struct TrainingGameView: View {
    @StateObject private var session: TrainingGameSession
    @State private var scene: TrainingScene
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var stageKeyboardRange: PianoStagePitchRange?
    @State private var isSettingsOpen = false
    let locale: AppLocale
    let onClose: () -> Void
    let onFinished: (Int) -> Void

    private static let pianoHeight: CGFloat = 88
    private static let staffBandMargin: CGFloat = 16

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
        GeometryReader { geometry in
            ZStack {
                SpriteView(scene: scene, options: [.allowsTransparency])
                    .ignoresSafeArea()
                    .onAppear {
                        scene.session = session
                        Task { await session.start() }
                    }
                    .onDisappear { session.stop() }

                VStack(spacing: 0) {
                    trainingHud
                    Spacer()
                }
                .ignoresSafeArea(edges: .top)

                if let question = session.question, session.hud.phase != .countdown {
                    let staffBandHeight = (geometry.size.height
                        - TrainingConstants.hudHeight
                        - Self.pianoHeight
                        - Self.staffBandMargin)
                        * TrainingConstants.staffHeightRatio(clefMode: session.training.clefMode)

                    VStack(spacing: 8) {
                        if !question.promptLabel.isEmpty {
                            Text(question.promptLabel)
                                .font(.headline)
                                .foregroundStyle(.white)
                        }
                        TrainingStaffView(
                            question: question,
                            correctIndices: session.correctIndices,
                            showHints: session.practiceMode,
                            unpressedNoteOpacity: TrainingConstants.staffNoteOpacity(
                                practiceMode: session.practiceMode,
                                kind: session.training.kind
                            ),
                            clefMode: session.training.clefMode
                        )
                    }
                    .padding(.horizontal)
                    .frame(maxWidth: 720)
                    .frame(height: max(0, staffBandHeight))
                    .position(
                        x: geometry.size.width / 2,
                        y: TrainingConstants.hudHeight + 8 + max(0, staffBandHeight) / 2
                    )
                    .allowsHitTesting(false)
                }

                if session.hud.phase == .countdown {
                    Color.black.opacity(0.35).ignoresSafeArea()
                    Text("\(session.hud.countdownSec)")
                        .font(.system(size: 72, weight: .bold, design: .rounded))
                }

                VStack {
                    Spacer()
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
        .syncPianoKeyboardDisplayMode($keyboardDisplayMode)
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

    private var chordPadSnapshot: SurvivalChordPadSnapshot {
        SurvivalChordPadSnapshot(
            hintMidis: hintMidis,
            nextHintMidis: hintMidis,
            completedHintMidis: [],
            hintPendingOpacity: session.practiceMode ? 1 : 0,
            midiHeldKeys: [],
            isEnabled: session.hud.phase == .playing && !isSettingsOpen,
            scrollAnchorMidi: nil
        )
    }

    private var chordPadRange: PianoStagePitchRange {
        TrainingKeyboardRange.resolvedDisplayRange(
            stageRange: stageKeyboardRange,
            displayMode: keyboardDisplayMode
        )
    }
}
