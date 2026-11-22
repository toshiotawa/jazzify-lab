import SwiftUI

private enum DefenseTutorialSaveStatus: Equatable {
    case idle
    case saving
    case saved
    case error
}

private struct DefenseTutorialClearModalView: View {
    let isEnglishCopy: Bool
    let fromLesson: Bool
    let fromPlayMap: Bool
    let saveStatus: DefenseTutorialSaveStatus
    let onDone: () -> Void
    let onKeepAdjusting: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            VStack(spacing: 16) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(.green)
                Text(isEnglishCopy ? "Clear!" : "クリア！")
                    .font(.title.bold())
                    .foregroundStyle(.green)
                Text(isEnglishCopy
                     ? "All 3 notes were recognized. Your input setup is complete."
                     : "3音の判定に成功しました。入力設定は完了です。")
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary)
                if let saveLine = saveStatusLine {
                    Text(saveLine)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Button(doneLabel, action: onDone)
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .disabled(saveStatus == .saving)
                Button(isEnglishCopy ? "Keep adjusting" : "調整を続ける", action: onKeepAdjusting)
                    .buttonStyle(.bordered)
            }
            .padding(24)
            .frame(maxWidth: 340)
            .background(Color(white: 0.12))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.green.opacity(0.35), lineWidth: 1)
            )
            .padding(.horizontal, 20)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "09070f"))
        .accessibilityAddTraits(.isModal)
    }

    private var doneLabel: String {
        if isEnglishCopy {
            if fromLesson { return "Done and return to quest" }
            if fromPlayMap { return "Done and return to map" }
            return "Done"
        }
        if fromLesson { return "完了してクエストへ" }
        if fromPlayMap { return "完了してマップへ" }
        return "完了"
    }

    private var saveStatusLine: String? {
        switch saveStatus {
        case .idle:
            return nil
        case .saving:
            return isEnglishCopy ? "Saving progress…" : "進捗を保存しています…"
        case .saved:
            return isEnglishCopy ? "Progress saved" : "進捗を保存しました"
        case .error:
            return isEnglishCopy
                ? "Could not save. You can try again when you finish."
                : "保存できませんでした。完了時にもう一度試せます。"
        }
    }
}

struct DefenseTutorialView: View {
    @EnvironmentObject private var appState: AppState

    let playMapNodeId: UUID?
    let lessonId: UUID?
    let lessonSongId: UUID?
    let clearConditions: LessonClearConditions?
    let onExit: (Bool) -> Void

    @State private var session: DefenseTutorialSessionState
    @State private var playNonce = 0
    @State private var saveStatus: DefenseTutorialSaveStatus = .idle
    @State private var saveStarted = false
    @State private var saveInFlight: Task<Void, Never>?
    @State private var isExiting = false

    private var locale: AppLocale { appState.locale }
    private var isEnglishCopy: Bool { locale == .en }

    init(
        playMapNodeId: UUID?,
        lessonId: UUID? = nil,
        lessonSongId: UUID? = nil,
        clearConditions: LessonClearConditions? = nil,
        onExit: @escaping (Bool) -> Void
    ) {
        self.playMapNodeId = playMapNodeId
        self.lessonId = lessonId
        self.lessonSongId = lessonSongId
        self.clearConditions = clearConditions
        self.onExit = onExit
        let instrumentId = NotationInstrumentPreferences.loadInstrumentId()
        let preset = NotationInstrumentCatalog.preset(for: instrumentId)
        let notation = DefenseTutorialNotation.defaultSettings(
            notationInstrumentId: instrumentId,
            notationOctaveShift: DefenseTutorialNotation.resolveDefaultOctaveShift(preset.clef)
        )
        _session = State(initialValue: DefenseTutorialState.createSession(notation: notation))
    }

    private var phraseBuild: DefenseTutorialPhraseBuildResult {
        BuildDefenseTutorialPhrase.build(settings: session.notation)
    }

    private var notationLabel: String {
        DefenseTutorialNotation.formatTutorialNotationLabel(session.notation, isEnglishCopy: isEnglishCopy)
    }

    private var isCleared: Bool {
        DefenseTutorialState.hasCleared(session)
    }

    private var showPlayClearedBadge: Bool {
        session.screen == .play && isCleared && !session.clearModalVisible
    }

    private var canRetreat: Bool {
        session.screen != .notation && !session.clearModalVisible
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            content
        }
        .background(Color(hex: "09070f").ignoresSafeArea())
        .preferredColorScheme(.dark)
        .onChange(of: session.clearModalVisible) { visible in
            guard visible, session.phraseSucceeded, !session.completionSaved, !saveStarted else { return }
            saveStarted = true
            saveStatus = .saving
            saveInFlight = Task {
                let saved = await persistCompletion()
                await MainActor.run {
                    saveStatus = saved ? .saved : .error
                    if !saved {
                        saveStarted = false
                    }
                    saveInFlight = nil
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            if canRetreat {
                Button {
                    handleRetreat()
                } label: {
                    Image(systemName: "chevron.left")
                }
                .buttonStyle(.bordered)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(notationLabel)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    if session.screen == .play, !session.clearModalVisible {
                        if showPlayClearedBadge {
                            Label(
                                isEnglishCopy ? "Cleared" : "クリア済み",
                                systemImage: "checkmark.circle.fill"
                            )
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.green)
                        } else {
                            Text(isEnglishCopy ? "Not cleared" : "未クリア")
                                .font(.caption2.weight(.medium))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.white.opacity(0.08))
                                .clipShape(Capsule())
                        }
                    }
                }
                if session.screen == .play, !session.clearModalVisible {
                    Text(DefenseTutorialNotation.formatTutorialPlaySubtitle(
                        concertMidis: phraseBuild.concertMidis,
                        isEnglishCopy: isEnglishCopy
                    ))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 8)
            if !session.clearModalVisible {
                if isCleared {
                    Button(exitButtonLabel) {
                        Task { await finishExit() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .disabled(isExiting)
                } else {
                    Button(exitButtonLabel) {
                        Task { await finishExit() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(isExiting)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.black.opacity(0.35))
    }

    private var exitButtonLabel: String {
        isCleared
            ? (isEnglishCopy ? "Done" : "完了")
            : (isEnglishCopy ? "Exit" : "終了")
    }

    @ViewBuilder
    private var content: some View {
        switch session.screen {
        case .notation, .notationConfirm:
            ScrollView {
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
            }
        case .inputChoice:
            ScrollView {
                DefenseTutorialInputChoiceView(isEnglishCopy: isEnglishCopy, onSelect: handleSelectInput)
            }
        case .inputSetup:
            if let inputMethod = session.inputMethod {
                DefenseTutorialInputPanelView(
                    inputMethod: inputMethod,
                    isEnglishCopy: isEnglishCopy,
                    onReady: handleStartPlay,
                    onFallbackInput: handleFallbackInput
                )
            }
        case .play:
            if session.clearModalVisible {
                DefenseTutorialClearModalView(
                    isEnglishCopy: isEnglishCopy,
                    fromLesson: lessonId != nil,
                    fromPlayMap: playMapNodeId != nil && lessonId == nil,
                    saveStatus: saveStatus,
                    onDone: { Task { await finishExit() } },
                    onKeepAdjusting: handleKeepAdjusting
                )
            } else if let inputMethod = session.inputMethod {
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
                        tutorialConcertPitchClasses: phraseBuild.concertMidis.map { (($0 % 12) + 12) % 12 },
                        tutorialConcertMidis: phraseBuild.concertMidis,
                        suppressResultScreen: true,
                        onClose: { Task { await finishExit() } },
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
        if showPlayClearedBadge {
            return isEnglishCopy
                ? "Input setup complete. Tap Done when you are finished adjusting."
                : "入力設定は完了です。調整が終わったら右上の「完了」を押してください。"
        }
        if session.screen == .play {
            return isEnglishCopy
                ? "Listen on Listen! bars, then play do, re, and mi on Play! bars (one octave up or down is OK)."
                : "Listen! の小節で聞き、Play! の小節で譜面のド・レ・ミを演奏しましょう（1オクターブ上下も可）。"
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

    private func handleFallbackInput(_ method: NoteInputMethod) {
        NoteInputManager.shared.inputMethod = method
        session = DefenseTutorialState.selectInputMethod(session, inputMethod: method)
    }

    private func handleStartPlay() {
        playNonce += 1
        session = DefenseTutorialState.advanceScreen(session, to: .play)
    }

    private func handleRetreat() {
        if session.screen == .play {
            playNonce += 1
        }
        if let next = DefenseTutorialState.retreatScreen(session) {
            session = next
        }
    }

    private func handleKeepAdjusting() {
        playNonce += 1
        session = DefenseTutorialState.dismissClearModal(session)
    }

    private func persistNotationSettings(_ notation: DefenseTutorialNotationSettings) {
        NotationInstrumentPreferences.saveInstrumentId(notation.notationInstrumentId)
        NotationInstrumentPreferences.saveOctaveShift(notation.notationOctaveShift)
        let lowRegister = NotationInstrumentCatalog.isLowRegisterInstrument(id: notation.notationInstrumentId)
        NoteInputPreferences.voiceLowRegister = lowRegister
        PitchInputEngine.shared.setLowRegister(lowRegister)
        Task { await appState.updateNotationInstrument(notation.notationInstrumentId) }
    }

    @discardableResult
    private func persistCompletion() async -> Bool {
        guard DefenseTutorialState.shouldSaveCompletionOnExit(session) else {
            return session.completionSaved
        }
        if let playMapNodeId {
            do {
                _ = try await SupabaseService.shared.recordPlayMapNodeClear(nodeId: playMapNodeId)
            } catch {
                return false
            }
        }
        if let lessonId, let lessonSongId {
            do {
                _ = try await SupabaseService.shared.recordEarTrainingLessonProgress(
                    lessonId: lessonId,
                    lessonSongId: lessonSongId,
                    rank: "S",
                    clearConditions: clearConditions
                )
            } catch {
                return false
            }
        }
        await MainActor.run {
            session = DefenseTutorialState.markCompletionSaved(session)
        }
        return true
    }

    private func finishExit() async {
        let alreadyExiting = await MainActor.run { () -> Bool in
            if isExiting {
                return true
            }
            isExiting = true
            return false
        }
        guard !alreadyExiting else { return }
        if let saveInFlight {
            await saveInFlight.value
        }
        if DefenseTutorialState.shouldSaveCompletionOnExit(session) {
            await MainActor.run {
                saveStatus = .saving
            }
            let saved = await persistCompletion()
            await MainActor.run {
                saveStatus = saved ? .saved : .error
            }
        }
        await MainActor.run {
            let cleared = DefenseTutorialState.hasCleared(session)
            isExiting = false
            onExit(cleared)
        }
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