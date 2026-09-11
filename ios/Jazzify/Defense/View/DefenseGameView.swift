import SpriteKit
import SwiftUI

struct DefenseGameView: View {
    @StateObject private var session: DefenseGameSession
    @State private var scene: DefenseScene
    let locale: AppLocale
    let onClose: () -> Void
    let playMapNodeId: UUID?
    let onPlayMapCleared: (() -> Void)?

    init(
        stage: DefenseStageDefinition,
        difficulty: DefenseDifficultyDefinition,
        practiceMode: Bool,
        lessonContext: DefenseLessonContext?,
        locale: AppLocale,
        playMapNodeId: UUID? = nil,
        onClose: @escaping () -> Void,
        onPlayMapCleared: (() -> Void)? = nil
    ) {
        _session = StateObject(wrappedValue: DefenseGameSession(
            stage: stage,
            difficulty: difficulty,
            practiceMode: practiceMode,
            lessonContext: lessonContext
        ))
        _scene = State(initialValue: DefenseScene(size: CGSize(width: 800, height: 600)))
        self.locale = locale
        self.playMapNodeId = playMapNodeId
        self.onClose = onClose
        self.onPlayMapCleared = onPlayMapCleared
    }

    var body: some View {
        ZStack {
            SpriteView(scene: scene, options: [.allowsTransparency])
                .ignoresSafeArea()

            VStack {
                HStack {
                    Button(locale == .ja ? "戻る" : "Back") { onClose() }
                        .padding(8)
                        .background(.black.opacity(0.4))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    Spacer()
                    hpBadge
                    Text("\(session.hud.remainSec)s")
                        .font(.headline)
                        .padding(8)
                        .background(.black.opacity(0.4))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .padding()

                Spacer()

                if let phrase = session.stage.phrases[safe: session.judgeState.phraseIndex] {
                    DefensePhraseStaffView(
                        phrase: phrase,
                        stageKeyFifths: session.stage.keyFifths,
                        chordIndex: session.judgeState.chordIndex,
                        judgeState: session.judgeState,
                        staffLayout: session.stage.staffLayout,
                        showTargetHints: session.practiceMode || staffOpacity > 0,
                        unpressedNoteOpacity: session.practiceMode ? 1 : staffOpacity
                    )
                    .padding(.horizontal)
                }

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
                    keyboardHeight: 120
                )
                .equatable()
                .frame(height: 120)
            }

            if session.hud.result != .playing {
                resultOverlay
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            scene.session = session
        }
        .task {
            await session.start()
        }
        .onDisappear {
            session.stop()
        }
        .onChange(of: session.hud.result) { result in
            if result == .clear, playMapNodeId != nil {
                onPlayMapCleared?()
            }
        }
    }

    private var hpBadge: some View {
        HStack(spacing: 2) {
            ForEach(0..<session.hud.playerMaxHp, id: \.self) { index in
                Text(index < session.hud.playerHp ? "♥" : "♡")
                    .foregroundStyle(.red)
            }
        }
        .padding(8)
        .background(.black.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var staffOpacity: Double {
        hintOpacity(mode: session.stage.productionStaffHintMode)
    }

    private var keyboardHintOpacity: CGFloat {
        CGFloat(hintOpacity(mode: session.stage.productionKeyboardHintMode))
    }

    /// Web `survivalStaffHintOpacity` と同じ段階フェード（11〜14 秒で 0.8→0.2、15 秒で 0）。
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

    private var targetMidis: Set<Int> {
        keyboardHints.allMidis
    }

    private var keyboardHints: DefensePhraseJudge.KeyboardHints {
        DefensePhraseJudge.keyboardHints(
            state: session.judgeState,
            sequential: NoteInputManager.shared.isVoiceInputActive
        )
    }

    private var chordPadSnapshot: SurvivalChordPadSnapshot {
        SurvivalChordPadSnapshot(
            hintMidis: keyboardHints.pendingMidis.union(keyboardHints.nextMidis),
            nextHintMidis: keyboardHints.nextMidis,
            completedHintMidis: keyboardHints.completedMidis,
            hintPendingOpacity: keyboardHintOpacity,
            midiHeldKeys: [],
            isEnabled: session.hud.result == .playing,
            scrollAnchorMidi: nil
        )
    }

    private var chordPadRange: PianoStagePitchRange {
        let midis = targetMidis.isEmpty ? [60] : Array(targetMidis)
        let minMidi = (midis.min() ?? 48) - 5
        let maxMidi = (midis.max() ?? 72) + 5
        return PianoStagePitchRange(minMidi: max(21, minMidi), maxMidi: min(108, maxMidi))
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

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
