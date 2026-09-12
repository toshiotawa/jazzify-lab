import SpriteKit
import SwiftUI
import UIKit

struct DefenseGameView: View {
    @StateObject private var session: DefenseGameSession
    @State private var scene: DefenseScene
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var isSettingsOpen = false
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
        .onChange(of: session.hud.result) { result in
            if result == .clear, playMapNodeId != nil {
                onPlayMapCleared?()
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
            SpriteView(scene: scene, options: [.allowsTransparency])
                .ignoresSafeArea()

            VStack(spacing: 0) {
                defenseHud
                Spacer(minLength: 0)
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
                    .padding(.horizontal, 12)
                    .frame(maxWidth: min(size.width * 0.63, 600))
                    .allowsHitTesting(false)
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
                    keyboardHeight: 88
                )
                .equatable()
                .frame(height: 88)
            }
            .ignoresSafeArea(edges: .top)

            if session.hud.result != .playing {
                resultOverlay
            }
        }
    }

    private static var isPhone: Bool {
        UIDevice.current.userInterfaceIdiom == .phone
    }

    private var defenseHud: some View {
        let labels = EarTrainingBattleHudLabels.make(isEnglish: locale == .en)
        let phrase = session.stage.phrases[safe: session.judgeState.phraseIndex]
        let chips = phrase?.chords.enumerated().map { index, chord in
            EarTrainingChordChip(
                id: UUID(),
                name: chord.chordName,
                active: index == session.judgeState.chordIndex
            )
        } ?? []

        return EarTrainingHUDView(
            hud: EarTrainingHudModel(
                playerHp: session.hud.playerHp,
                playerMaxHp: session.hud.playerMaxHp,
                enemyHp: 0,
                enemyMaxHp: 1,
                practiceMode: session.practiceMode,
                timeRemaining: session.hud.remainSec,
                timeLabel: "\(session.hud.remainSec)s  ·  KO \(session.runtime.enemiesDefeated)",
                hideTimeLabel: false,
                hidePlayerHpBar: false,
                hideSettingsButton: false,
                hideBackButton: false,
                enemyAttackGaugePercent: 0,
                hideEnemyAttackGauge: true,
                hideChordChips: chips.isEmpty,
                hideSlotsRow: true,
                hudLabels: labels,
                gameState: .playingPhrase,
                phraseRunId: 0,
                chordChips: chips,
                slotRow: .melody(slots: [], revealed: [], currentIndex: 0)
            ),
            showsSlotsRow: false,
            onSettings: {
                session.isPaused = true
                isSettingsOpen = true
            },
            onBack: onClose
        )
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
            sequential: NoteInputManager.shared.isVoiceInputActive
        )
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

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
