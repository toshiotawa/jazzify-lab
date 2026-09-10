import SpriteKit
import SwiftUI

struct TrainingGameView: View {
    @StateObject private var session: TrainingGameSession
    @State private var scene: TrainingScene
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

            VStack {
                HStack {
                    Button(locale == .ja ? "終了" : "Exit") { onClose() }
                        .padding(8)
                        .background(.black.opacity(0.4))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    Spacer()
                    if session.hud.phase == .countdown {
                        Text("\(session.hud.countdownSec)")
                            .font(.system(size: 26, weight: .heavy, design: .rounded))
                    } else {
                        Text("\(session.hud.remainSec)s")
                            .font(.system(size: 26, weight: .heavy, design: .rounded))
                    }
                    Spacer()
                    Text("\(session.hud.score)")
                        .font(.system(size: 26, weight: .heavy, design: .rounded))
                        .foregroundStyle(.yellow)
                }
                .padding()

                Spacer()

                if let question = session.question, session.hud.phase != .countdown {
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
                }

                SurvivalChordPadView(
                    snapshot: chordPadSnapshot,
                    displayRange: chordPadRange,
                    onPress: { midi in
                        session.handleNoteOn(midiNote: midi)
                        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: 100)
                    },
                    onRelease: { midi in SurvivalGameAudio.shared.pianoNoteOff(midi: midi) },
                    keyboardHeight: 120
                )
                .frame(height: 120)
                .opacity(session.practiceMode ? 1 : 0.45)
            }

            if session.hud.phase == .countdown {
                Color.black.opacity(0.35).ignoresSafeArea()
                Text("\(session.hud.countdownSec)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
            }
        }
        .onChange(of: session.hud.phase) { phase in
            if phase == .finished {
                onFinished(session.runtime.score)
            }
        }
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
            isEnabled: session.hud.phase == .playing,
            scrollAnchorMidi: nil
        )
    }

    private var chordPadRange: PianoStagePitchRange {
        let midis = hintMidis.isEmpty ? [60] : Array(hintMidis)
        let minMidi = (midis.min() ?? 48) - 5
        let maxMidi = (midis.max() ?? 72) + 5
        return PianoStagePitchRange(minMidi: max(21, minMidi), maxMidi: min(108, maxMidi))
    }
}
