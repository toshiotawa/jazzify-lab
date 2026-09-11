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
                VStack {
                    Spacer()
                    VStack(spacing: 8) {
                        if !question.promptLabel.isEmpty {
                            Text(question.promptLabel)
                                .font(.headline)
                        }
                        TrainingStaffView(
                            question: question,
                            correctIndices: session.correctIndices,
                            showHints: session.practiceMode,
                            clefMode: session.training.clefMode
                        )
                    }
                    .padding(.horizontal)
                    .frame(maxWidth: 720)
                    .offset(y: -80)
                    Spacer()
                }
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
                    keyboardHeight: 88
                )
                .frame(height: 88)
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
        let labels = EarTrainingBattleHudLabels.make(isEnglish: locale == .en)
        let timeLabel = session.hud.phase == .countdown
            ? "\(session.hud.countdownSec)"
            : "\(session.hud.remainSec)s"

        return EarTrainingHUDView(
            hud: EarTrainingHudModel(
                playerHp: session.hud.phase == .countdown ? 1 : max(0, session.runtime.enemy.fadeAlpha >= 0.99 ? 1 : 0),
                playerMaxHp: 1,
                enemyHp: session.hud.phase == .countdown ? 1 : max(0, session.runtime.enemy.fadeAlpha >= 0.99 ? 1 : 0),
                enemyMaxHp: 1,
                practiceMode: session.practiceMode,
                timeRemaining: session.hud.phase == .countdown ? session.hud.countdownSec : session.hud.remainSec,
                timeLabel: timeLabel,
                hideTimeLabel: false,
                hidePlayerHpBar: true,
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
                slotRow: .melody(slots: ["KO \(session.hud.score)"], revealed: [], currentIndex: 0)
            ),
            showsSlotsRow: session.hud.phase != .countdown,
            onSettings: {
                session.isPaused = true
                isSettingsOpen = true
            },
            onBack: onClose
        )
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
