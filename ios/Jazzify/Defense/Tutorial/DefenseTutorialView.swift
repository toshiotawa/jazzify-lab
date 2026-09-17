import SwiftUI

struct DefenseTutorialView: View {
    @EnvironmentObject private var appState: AppState

    let playMapNodeId: UUID?
    let onExit: () -> Void

    @State private var session: DefenseTutorialSessionState
    @State private var playNonce = 0

    private var locale: AppLocale { appState.locale }
    private var isEnglishCopy: Bool { locale == .en }

    init(playMapNodeId: UUID?, onExit: @escaping () -> Void) {
        self.playMapNodeId = playMapNodeId
        self.onExit = onExit
        let notation = DefenseTutorialNotation.defaultSettings(
            notationInstrumentId: NotationInstrumentPreferences.loadInstrumentId(),
            notationOctaveShift: NotationInstrumentPreferences.loadOctaveShift()
        )
        _session = State(initialValue: DefenseTutorialState.createSession(notation: notation))
    }

    private var phraseBuild: DefenseTutorialPhraseBuildResult {
        BuildDefenseTutorialPhrase.build(settings: session.notation)
    }

    private var notationLabel: String {
        DefenseTutorialNotation.formatTutorialNotationLabel(session.notation, isEnglishCopy: isEnglishCopy)
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            content
        }
        .background(Color(hex: "09070f").ignoresSafeArea())
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(notationLabel)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                if session.screen == .play {
                    Text(DefenseTutorialNotation.formatConcertSolfegeLabel(isEnglishCopy: isEnglishCopy))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 8)
            Button(isEnglishCopy ? "Exit" : "終了") {
                Task { await handleExit() }
            }
            .buttonStyle(.bordered)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.black.opacity(0.35))
    }

    @ViewBuilder
    private var content: some View {
        switch session.screen {
        case .notation, .notationConfirm:
            DefenseTutorialSetupView(
                settings: session.notation,
                isEnglishCopy: isEnglishCopy,
                mode: session.screen == .notationConfirm ? .confirm : .edit,
                onChange: { session = DefenseTutorialState.updateNotation(session, notation: $0) },
                onConfirm: handleNotationConfirm,
                onBackToEdit: session.screen == .notationConfirm
                    ? { session = DefenseTutorialState.advanceScreen(session, to: .notation) }
                    : nil
            )
        case .inputChoice:
            DefenseTutorialInputChoiceView(isEnglishCopy: isEnglishCopy, onSelect: handleSelectInput)
        case .inputSetup:
            if let inputMethod = session.inputMethod {
                DefenseTutorialInputPanelView(
                    inputMethod: inputMethod,
                    isEnglishCopy: isEnglishCopy,
                    onReady: handleStartPlay
                )
            }
        case .play:
            if let inputMethod = session.inputMethod {
                VStack(spacing: 0) {
                    if !instructionText.isEmpty {
                        Text(instructionText)
                            .font(.subheadline)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                    }
                    DefenseGameView(
                        stage: phraseBuild.stage,
                        difficulty: Self.tutorialDifficulty,
                        practiceMode: false,
                        lessonContext: nil,
                        locale: locale,
                        playMapNodeId: playMapNodeId,
                        tutorialOptions: .inputSetupV1,
                        tutorialInputMethod: inputMethod,
                        tutorialStaffGroups: phraseBuild.staffGroups,
                        tutorialClefOverride: DefenseTutorialNotation.resolveClef(session.notation),
                        tutorialConcertPitchClasses: DefenseTutorialConstants.targetPitchClasses,
                        suppressResultScreen: true,
                        onClose: { Task { await handleExit() } },
                        onApplyPracticeModeAndRestart: { _ in playNonce += 1 },
                        onTutorialPhraseSucceeded: {
                            session = DefenseTutorialState.markPhraseSucceeded(session)
                        }
                    )
                    .id(playNonce)
                }
            }
        }
    }

    private var instructionText: String {
        if session.phraseSucceeded {
            return isEnglishCopy
                ? "Three notes were recognized. Tap Exit when you are done adjusting."
                : "3音が判定されました。設定ができたら右上の「終了」を押してください。"
        }
        if session.screen == .play {
            return isEnglishCopy
                ? "Play what you hear. Timing is not judged. One octave up or down is OK."
                : "楽譜を見ながら、聴こえた通りに演奏しましょう。タイミングは判定しません。1オクターブ上や下でも大丈夫です。"
        }
        return ""
    }

    private func handleNotationConfirm() {
        if session.screen == .notation {
            session = DefenseTutorialState.advanceScreen(session, to: .notationConfirm)
            return
        }
        persistNotationSettings(session.notation)
        session = DefenseTutorialState.advanceScreen(session, to: .inputChoice)
    }

    private func handleSelectInput(_ method: NoteInputMethod) {
        NoteInputManager.shared.inputMethod = method
        session = DefenseTutorialState.selectInputMethod(
            DefenseTutorialState.advanceScreen(session, to: .inputSetup),
            inputMethod: method
        )
    }

    private func handleStartPlay() {
        playNonce += 1
        session = DefenseTutorialState.advanceScreen(session, to: .play)
    }

    private func persistNotationSettings(_ notation: DefenseTutorialNotationSettings) {
        NotationInstrumentPreferences.saveInstrumentId(notation.notationInstrumentId)
        NotationInstrumentPreferences.saveOctaveShift(notation.notationOctaveShift)
        Task { await appState.updateNotationInstrument(notation.notationInstrumentId) }
    }

    private func handleExit() async {
        if let playMapNodeId,
           DefenseTutorialState.shouldSaveCompletionOnExit(session) {
            _ = try? await SupabaseService.shared.recordPlayMapNodeClear(nodeId: playMapNodeId)
            session = DefenseTutorialState.markCompletionSaved(session)
        }
        onExit()
    }

    private static let tutorialDifficulty = DefenseDifficultyDefinition(
        level: 1,
        enemyHp: 1,
        spawnIntervalSec: 4,
        maxEnemies: 2,
        enemySpeedPxPerSec: 60,
        enemyDamage: 1,
        attackIntervalSec: 999,
        attackRangePx: 48
    )
}
