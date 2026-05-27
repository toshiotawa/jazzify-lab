import Combine
import QuartzCore
import SpriteKit
import SwiftUI
import UIKit

/// サバイバル ゲーム画面のルート (fullScreenCover から表示されるネイティブ版)。
/// - SpriteKit ゲーム世界 + SwiftUI オーバーレイ (HUD / スロット / スティック / 鍵盤)
/// - `SurvivalGameSession` がゲームループ・入力バッファ・UI 公開を束ねる
struct SurvivalGameView: View {
    let stage: SurvivalStageDefinition
    let characterId: String
    let locale: AppLocale
    let onClose: () -> Void
    var isDemo: Bool = false
    var configOverride: SurvivalStageConfig? = nil
    var scenarioOverrides: SurvivalScenarioOverrides = .init()
    var scenarioController: SurvivalScenarioController? = nil
    var inlinePhraseDefinition: SurvivalPhraseDefinition? = nil
    var inlineCompositePhrases: [SurvivalPhraseDefinition]? = nil
    var lessonRuntime: ResolvedSurvivalLessonRuntime? = nil
    var lessonContext: SurvivalLessonContext? = nil
    /// チュートリアル等: ステージ intro より優先するジャ爺吹き出し。
    var externalJajiiBubbleText: String = ""
    var onSessionReady: ((SurvivalGameSession) -> Void)? = nil

    init(
        stage: SurvivalStageDefinition,
        hintMode: Bool,
        characterId: String,
        locale: AppLocale,
        onClose: @escaping () -> Void,
        isDemo: Bool = false,
        configOverride: SurvivalStageConfig? = nil,
        scenarioOverrides: SurvivalScenarioOverrides = .init(),
        scenarioController: SurvivalScenarioController? = nil,
        inlinePhraseDefinition: SurvivalPhraseDefinition? = nil,
        inlineCompositePhrases: [SurvivalPhraseDefinition]? = nil,
        lessonRuntime: ResolvedSurvivalLessonRuntime? = nil,
        lessonContext: SurvivalLessonContext? = nil,
        externalJajiiBubbleText: String = "",
        onSessionReady: ((SurvivalGameSession) -> Void)? = nil
    ) {
        self.stage = stage
        self.characterId = characterId
        self.locale = locale
        self.onClose = onClose
        self.isDemo = isDemo
        self.configOverride = configOverride
        self.scenarioOverrides = scenarioOverrides
        self.scenarioController = scenarioController
        self.inlinePhraseDefinition = inlinePhraseDefinition
        self.inlineCompositePhrases = inlineCompositePhrases
        self.lessonRuntime = lessonRuntime
        self.lessonContext = lessonContext
        self.externalJajiiBubbleText = externalJajiiBubbleText
        self.onSessionReady = onSessionReady
        _activeHintMode = State(initialValue: hintMode)
    }

    @State private var session: SurvivalGameSession?
    @State private var activeHintMode: Bool
    @State private var bootstrapTask: Task<Void, Never>?
    @State private var bootstrapID = UUID()
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()
    @State private var isLoading: Bool = true
    @State private var loadError: String?
    @StateObject private var orientation = OrientationManager.shared

    var body: some View {
        ZStack {
            if let session = session {
                SurvivalGameContent(
                    session: session,
                    stage: stage,
                    locale: locale,
                    isDemo: isDemo,
                    externalJajiiBubbleText: externalJajiiBubbleText,
                    onApplyHintModeAndRestart: isDemo ? nil : { newHint in
                        applyHintModeRestart(newHint)
                    }
                )
            } else if isLoading {
                loadingView
            } else if loadError != nil {
                errorView
            } else {
                loadingView
            }

            PlayerXpToastOverlay()
                .allowsHitTesting(false)
        }
        .background(Color.black)
        .task {
            bootstrapTask?.cancel()
            let id = UUID()
            bootstrapID = id
            bootstrapTask = Task {
                await bootstrap(id: id)
            }
        }
        .onDisappear {
            bootstrapTask?.cancel()
            bootstrapID = UUID()
            midiSubscriptionHolder.cancel()
            session?.dispose()
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Subviews

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .tint(.yellow)
            Text(locale == .ja ? "ステージを準備中..." : "Preparing stage...")
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
            Button(action: { onClose() }) {
                Text(locale == .ja ? "マップに戻る" : "Back to Map")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color.yellow)
                    .cornerRadius(8)
            }
        }
    }

    // MARK: - Bootstrap

    @MainActor
    private func bootstrap(id: UUID) async {
        guard session == nil else { return }

        isLoading = true
        loadError = nil

        SurvivalAssetPreloader.preloadIfNeeded()

        let profile: SurvivalCharacterProfile
        var config: SurvivalStageConfig

        if isDemo {
            profile = SurvivalCharacterProfile.defaultFai
            config = configOverride ?? SurvivalStageConfig.default
        } else {
            let supabase = SupabaseService.shared
            async let profileTask: SurvivalCharacterProfile = {
                (try? await supabase.fetchFaiProfile()) ?? SurvivalCharacterProfile.defaultFai
            }()
            async let configTask: SurvivalStageConfig = {
                if let override = configOverride { return override }
                let difficulty = stage.difficulty.rawValue
                if let fetched = try? await supabase.fetchSurvivalStageConfig(difficulty: difficulty, stageType: stage.survivalBgmConfigStageType) {
                    return fetched
                }
                return SurvivalStageConfig.default
            }()

            profile = await profileTask
            config = await configTask
        }

        if let bgmStr = stage.compositePhraseBgmUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           !bgmStr.isEmpty,
           let compositeBgm = URL(string: bgmStr) {
            config = config.withBgmUrl(compositeBgm)
        }

        // 古い task / cancel 済み task は UI を壊さず静かに終了
        guard !Task.isCancelled, bootstrapID == id else { return }

        let created = SurvivalGameSession(
            stage: stage,
            hintMode: activeHintMode,
            characterId: characterId,
            profile: profile,
            config: config,
            onExit: { _ in onClose() },
            isDemo: isDemo,
            lessonContext: lessonContext,
            usesEnglishToastCopy: locale == .en,
            scenarioOverrides: scenarioOverrides,
            scenarioController: scenarioController,
            inlinePhraseDefinition: inlinePhraseDefinition,
            inlineCompositePhrases: inlineCompositePhrases,
            lessonRuntime: lessonRuntime
        )
        created.start()
        onSessionReady?(created)

        guard !Task.isCancelled, bootstrapID == id else {
            created.dispose()
            return
        }

        self.session = created
        self.isLoading = false

        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { [weak created] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            if isNoteOn {
                created?.audioController.pianoNoteOnRealtime(midi: note, velocity: velocity)
            } else if isNoteOff {
                created?.audioController.pianoNoteOffRealtime(midi: note)
            } else {
                return
            }
            DispatchQueue.main.async { [weak created] in
                guard let created else { return }
                if isNoteOn {
                    created.midiGameNoteOn(note, velocity: velocity)
                    created.viewModel.registerMidiKeyDown(note)
                } else {
                    created.midiGameNoteOff(note)
                    created.viewModel.registerMidiKeyUp(note)
                }
            }
        }
    }

    @MainActor
    private func applyHintModeRestart(_ newHintMode: Bool) {
        guard !isDemo else { return }
        activeHintMode = newHintMode
        session?.restartSameStage(hintMode: newHintMode)
    }

}

// MARK: - Stage intro (timed lines for stage 1)

@MainActor
private final class SurvivalStageIntroUIModel: ObservableObject {
    @Published var faiLine = ""
    @Published var jajiiLine = ""
    private let player = SurvivalStageIntroPlayer()

    func cancelAll() {
        player.cancel(setLineEmpty: { [weak self] in
            self?.faiLine = ""
            self?.jajiiLine = ""
        })
    }

    func loadAndSchedule(mapCategory: SurvivalMapCategory, usesEnglishCopy: Bool) async {
        cancelAll()
        let script = await SupabaseService.shared.fetchSurvivalStageIntroScript(mapCategory: mapCategory)
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: { [weak self] text in self?.faiLine = text },
            onJajiiLine: { [weak self] text in self?.jajiiLine = text }
        )
    }
}

@MainActor
private final class SurvivalBlockBossIntroUIModel: ObservableObject {
    @Published var faiLine = ""
    @Published var jajiiLine = ""
    private let player = SurvivalStageIntroPlayer()

    func cancelAll() {
        player.cancel(setLineEmpty: { [weak self] in
            self?.faiLine = ""
            self?.jajiiLine = ""
        })
    }

    func loadAndSchedule(mapCategory: SurvivalMapCategory, usesEnglishCopy: Bool) async {
        cancelAll()
        let script = await SupabaseService.shared.fetchSurvivalBlockBossIntroScript(mapCategory: mapCategory)
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: { [weak self] text in self?.faiLine = text },
            onJajiiLine: { [weak self] text in self?.jajiiLine = text }
        )
    }
}

@MainActor
private final class SurvivalStagePlayDialogueUIModel: ObservableObject {
    @Published var faiLine = ""
    @Published var jajiiLine = ""
    private let player = SurvivalStageIntroPlayer()

    func cancelAll() {
        player.cancel(setLineEmpty: { [weak self] in
            self?.faiLine = ""
            self?.jajiiLine = ""
        })
    }

    func loadAndSchedule(
        mapCategory: SurvivalMapCategory,
        stageNumber: Int,
        usesEnglishCopy: Bool
    ) async {
        cancelAll()
        guard let script = await SupabaseService.shared.fetchSurvivalStagePlayDialogue(
            mapCategory: mapCategory,
            stageNumber: stageNumber
        ) else { return }
        scheduleScript(script, usesEnglishCopy: usesEnglishCopy)
    }

    func loadAndScheduleBalloonRush(stageId: UUID, usesEnglishCopy: Bool) async {
        cancelAll()
        guard let script = await SupabaseService.shared.fetchBalloonRushPlayDialogue(stageId: stageId) else { return }
        scheduleScript(script, usesEnglishCopy: usesEnglishCopy)
    }

    private func scheduleScript(_ script: SurvivalStageIntroScriptPayload, usesEnglishCopy: Bool) {
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: { [weak self] text in self?.faiLine = text },
            onJajiiLine: { [weak self] text in self?.jajiiLine = text }
        )
    }
}

// MARK: - Session-observing content view

struct SurvivalGameContent<Session: SurvivalPlaySession>: View {
    @ObservedObject var session: Session
    let stage: SurvivalStageDefinition
    var balloonRushPlayDialogueStageId: UUID?
    let locale: AppLocale
    let isDemo: Bool
    let externalJajiiBubbleText: String
    let onApplyHintModeAndRestart: ((Bool) -> Void)?


    @StateObject private var stageIntroUIModel = SurvivalStageIntroUIModel()
    @StateObject private var blockBossIntroUIModel = SurvivalBlockBossIntroUIModel()
    @StateObject private var playDialogueUIModel = SurvivalStagePlayDialogueUIModel()
    @State private var hudHeight: CGFloat = 72

    private var vm: SurvivalViewModel { session.viewModel }

    private var wantsStageIntroTimedLines: Bool {
        !isDemo &&
            stage.stageNumber == 1 &&
            SurvivalMapCategory.descentDisplayCategories.contains(stage.mapCategory) &&
            !vm.uiSnapshot.scenario.isActive
    }

    /// 第一ブロック末尾ボス（ステージ1のイントロと同時実行しない）。
    private var wantsBlockBossTimedLines: Bool {
        !isDemo &&
            SurvivalMapCategory.descentDisplayCategories.contains(stage.mapCategory) &&
            vm.isBossStage &&
            stage.isFirstBlockBossStage &&
            !vm.uiSnapshot.scenario.isActive &&
            !wantsStageIntroTimedLines
    }

    private var wantsStagePlayDialogue: Bool {
        if balloonRushPlayDialogueStageId != nil {
            return !isDemo && !vm.uiSnapshot.scenario.isActive
        }
        return !isDemo
            && stage.mapCategory == .basic
            && stage.stageNumber == 9901
            && !vm.uiSnapshot.scenario.isActive
            && !wantsStageIntroTimedLines
            && !wantsBlockBossTimedLines
    }

    private var faiTimedBubbleText: String {
        if !playDialogueUIModel.faiLine.isEmpty { return playDialogueUIModel.faiLine }
        if !blockBossIntroUIModel.faiLine.isEmpty { return blockBossIntroUIModel.faiLine }
        return stageIntroUIModel.faiLine
    }

    private var jajiiTimedBubbleText: String {
        let trimmed = externalJajiiBubbleText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty { return trimmed }
        if !playDialogueUIModel.jajiiLine.isEmpty { return playDialogueUIModel.jajiiLine }
        if !blockBossIntroUIModel.jajiiLine.isEmpty { return blockBossIntroUIModel.jajiiLine }
        return stageIntroUIModel.jajiiLine
    }

    private var balloonRushStaffPayload: SurvivalStageCenterStaffPayload? {
        guard let balloonSession = session as? BalloonRushGameSession else {
            return nil
        }
        return SurvivalStageCenterStaffPayload.make(from: balloonSession.gameLoop)
    }

    var body: some View {
        ZStack(alignment: .top) {
            SurvivalSceneContainer(
                session: session,
                faiBubbleText: faiTimedBubbleText,
                jajiiBubbleText: jajiiTimedBubbleText
            )
                .ignoresSafeArea()

            SurvivalJoystickRepresentable(
                hitMask: .full,
                isInteractive: vm.uiSnapshot.phase == .playing && !vm.isPaused && !vm.uiSnapshot.scenario.disableJoystick
            ) { analog in
                session.input.setAnalog(analog)
            }
            .allowsHitTesting(vm.uiSnapshot.phase == .playing && !vm.isPaused && !vm.uiSnapshot.scenario.disableJoystick)

            if vm.uiSnapshot.phase == .playing,
               !vm.isPaused,
               !vm.uiSnapshot.scenario.hideStaff,
               let balloonStaff = balloonRushStaffPayload,
               !balloonStaff.voicingNames.isEmpty {
                SurvivalStageCenterStaffOverlay(
                    payload: balloonStaff,
                    unpressedNoteOpacity: vm.uiSnapshot.unpressedNoteOpacity
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .padding(.top, hudHeight + 4)
                .padding(.horizontal, 12)
                .allowsHitTesting(false)
            } else if vm.uiSnapshot.phase == .playing,
               !vm.isPaused,
               !vm.uiSnapshot.scenario.hideStaff,
               scenarioStaffSnapshot == nil,
               let phraseStaff = vm.phraseStaffSnapshot {
                SurvivalPhraseStaffOverlay(snapshot: phraseStaff)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .padding(.top, hudHeight + 4)
                    .padding(.horizontal, 12)
                    .allowsHitTesting(false)
            } else if vm.uiSnapshot.phase == .playing,
               !vm.isPaused,
               !vm.uiSnapshot.scenario.hideStaff,
               scenarioStaffSnapshot == nil,
               let staffPayload = SurvivalStageCenterStaffPayload.make(from: vm.uiSnapshot),
               !staffPayload.voicingNames.isEmpty {
                SurvivalStageCenterStaffOverlay(
                    payload: staffPayload,
                    unpressedNoteOpacity: vm.uiSnapshot.unpressedNoteOpacity
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .padding(.top, hudHeight + 4)
                .padding(.horizontal, 12)
                .allowsHitTesting(false)
            }

            VStack(spacing: 0) {
                SurvivalHUDView(
                    uiSnapshot: vm.uiSnapshot,
                    bossHud: vm.bossHud,
                    isPaused: vm.isPaused,
                    stage: stage,
                    enemyQuotaOverride: session.playLoopFacade.effectiveStageKillQuota,
                    locale: locale,
                    onTogglePause: { session.togglePause() }
                )
                Spacer()
            }
            .onPreferenceChange(SurvivalHUDHeightKey.self) { hudHeight = $0 }

            if let staffSnapshot = scenarioStaffSnapshot {
                VStack(spacing: 0) {
                    SurvivalScenarioStaffPanel(snapshot: staffSnapshot)
                        .padding(.top, 48)
                    Spacer()
                }
                .allowsHitTesting(false)
            }

            if !vm.uiSnapshot.scenario.hideComboBadge {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        SurvivalComboBadgeView(comboCount: vm.uiSnapshot.comboCount)
                            .padding(Edge.Set.trailing, 16)
                            .padding(Edge.Set.bottom, 140)
                    }
                }
                .allowsHitTesting(false)
            }

            if !vm.uiSnapshot.scenario.hideChordPad {
                VStack {
                    Spacer()
                    chordPadBar
                }
            }

            if vm.isPaused && vm.uiSnapshot.phase == .playing && !vm.uiSnapshot.scenario.hidePauseButton {
                pauseOverlay
            }

            if vm.uiSnapshot.phase != .playing && !vm.uiSnapshot.scenario.disableResultScreen {
                resultOverlay
            }
        }
        .onChange(of: ObjectIdentifier(session)) { _ in
            stageIntroUIModel.cancelAll()
            blockBossIntroUIModel.cancelAll()
            playDialogueUIModel.cancelAll()
        }
        .onChange(of: session.viewModel.sceneRestartGeneration) { _ in
            rescheduleStageIntroTimedLinesIfEligible()
            rescheduleBlockBossIntroTimedLinesIfEligible()
            reschedulePlayDialogueTimedLinesIfEligible()
        }
        .onChange(of: vm.uiSnapshot.phase) { phase in
            if wantsStageIntroTimedLines {
                if phase != .playing {
                    stageIntroUIModel.cancelAll()
                }
            } else {
                stageIntroUIModel.cancelAll()
            }

            if wantsBlockBossTimedLines {
                if phase != .playing {
                    blockBossIntroUIModel.cancelAll()
                }
            } else {
                blockBossIntroUIModel.cancelAll()
            }

            if wantsStagePlayDialogue {
                if phase != .playing {
                    playDialogueUIModel.cancelAll()
                }
            } else {
                playDialogueUIModel.cancelAll()
            }
        }
        .onAppear {
            rescheduleStageIntroTimedLinesIfEligible()
            rescheduleBlockBossIntroTimedLinesIfEligible()
            reschedulePlayDialogueTimedLinesIfEligible()
        }
    }

    private func reschedulePlayDialogueTimedLinesIfEligible() {
        guard wantsStagePlayDialogue else {
            playDialogueUIModel.cancelAll()
            return
        }
        DispatchQueue.main.async {
            guard self.vm.uiSnapshot.phase == .playing else {
                self.playDialogueUIModel.cancelAll()
                return
            }
            Task { @MainActor in
                if let brId = self.balloonRushPlayDialogueStageId {
                    await self.playDialogueUIModel.loadAndScheduleBalloonRush(
                        stageId: brId,
                        usesEnglishCopy: self.locale == .en
                    )
                } else {
                    await self.playDialogueUIModel.loadAndSchedule(
                        mapCategory: self.stage.mapCategory,
                        stageNumber: self.stage.stageNumber,
                        usesEnglishCopy: self.locale == .en
                    )
                }
            }
        }
    }

    private func rescheduleStageIntroTimedLinesIfEligible() {
        guard wantsStageIntroTimedLines else {
            stageIntroUIModel.cancelAll()
            return
        }
        DispatchQueue.main.async {
            guard self.vm.uiSnapshot.phase == .playing else {
                self.stageIntroUIModel.cancelAll()
                return
            }
            Task { @MainActor in
                await self.stageIntroUIModel.loadAndSchedule(
                    mapCategory: self.stage.mapCategory,
                    usesEnglishCopy: self.locale == .en
                )
            }
        }
    }

    private func rescheduleBlockBossIntroTimedLinesIfEligible() {
        guard wantsBlockBossTimedLines else {
            blockBossIntroUIModel.cancelAll()
            return
        }
        DispatchQueue.main.async {
            guard self.vm.uiSnapshot.phase == .playing else {
                self.blockBossIntroUIModel.cancelAll()
                return
            }
            Task { @MainActor in
                await self.blockBossIntroUIModel.loadAndSchedule(
                    mapCategory: self.stage.mapCategory,
                    usesEnglishCopy: self.locale == .en
                )
            }
        }
    }

    private var chordPadBar: some View {
        SurvivalChordPadView(
            snapshot: SurvivalChordPadSnapshot(
                hintMidis: vm.chordPadHintMidis,
                completedHintMidis: vm.chordPadCompletedHintMidis,
                hintPendingOpacity: vm.chordPadHintPendingOpacity,
                midiHeldKeys: vm.midiHeldKeys,
                isEnabled: vm.uiSnapshot.phase == .playing && !vm.isPaused,
                scrollAnchorMidi: vm.chordPadScrollAnchorMidi
            ),
            onPress: { session.chordPadNoteOn($0, velocity: 100) },
            onRelease: { session.chordPadNoteOff($0) }
        )
        .equatable()
        .ignoresSafeArea(.container, edges: .horizontal)
        .padding(.bottom, 8)
    }

    private var scenarioStaffSnapshot: SurvivalScenarioStaffPanel.Snapshot? {
        if balloonRushPlayDialogueStageId != nil {
            return nil
        }
        let sc = vm.uiSnapshot.scenario
        guard sc.isActive, !sc.hideStaff else { return nil }
        guard session.playLoopFacade.phraseStaffSnapshot() == nil else { return nil }
        guard vm.uiSnapshot.slots.indices.contains(1) else { return nil }
        let slot = vm.uiSnapshot.slots[1]
        guard slot.isEnabled else { return nil }
        guard let chord = slot.chord,
              let staffNames = chord.progressionStaffVoicingNames,
              !staffNames.isEmpty else {
            return nil
        }
        let staves = chord.progressionStaffVoicingStaves
        let perNoteStaves: [Int]? = {
            guard let staves, staves.count == staffNames.count else { return nil }
            return staves
        }()
        return SurvivalScenarioStaffPanel.Snapshot(
            chordDisplayName: chord.displayName,
            voicingNames: staffNames,
            keyFifths: chord.progressionStaffKeyFifths ?? 0,
            correctPitchClasses: SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            ),
            staffClef: sc.scenarioStaffClef,
            voicingStavesPerNote: perNoteStaves
        )
    }

    // MARK: - Overlays

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalPauseSettingsSheet(
                locale: locale,
                isDemo: isDemo,
                stageRunMode: (isDemo || stage.survivalUsesCompositePhrasePattern) ? nil : onApplyHintModeAndRestart.map { restart in
                    SurvivalStageRunModeConfig(
                        hintMode: session.currentHintMode,
                        onApplyHintModeAndRestart: restart
                    )
                },
                onResume: { session.togglePause() },
                onExit: { session.requestExit() }
            )
        }
    }

    private var resultOverlay: some View {
        let isCleared = vm.uiSnapshot.phase == .cleared
        return ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalGameResultView(
                isCleared: isCleared,
                stage: stage,
                enemiesDefeated: vm.uiSnapshot.enemiesDefeated,
                enemiesDefeatedQuota: session.playLoopFacade.effectiveStageKillQuota,
                enemiesDefeatedLabel: balloonRushPlayDialogueStageId != nil
                    ? (locale == .ja ? "風船" : "Balloons")
                    : (locale == .ja ? "撃破数" : "Enemies"),
                elapsedSeconds: vm.uiSnapshot.elapsedSecondsRounded,
                playerHp: vm.uiSnapshot.hp,
                playerMaxHp: vm.uiSnapshot.maxHp,
                hintMode: session.currentHintMode,
                isBossStage: vm.isBossStage,
                locale: locale,
                clearReportInFlight: vm.clearReportInFlight,
                clearReportError: vm.clearReportError,
                isDemo: isDemo,
                onRetry: { session.restartSameStage(hintMode: nil) },
                onExit: { session.requestExit() }
            )
        }
    }
}

// MARK: - Stage center staff (slots removed; matches Web SurvivalGameScreen overlay)

private struct SurvivalStageCenterStaffPayload: Equatable {
    let chordDisplayName: String
    let voicingNames: [String]
    let keyFifths: Int
    let correctPitchClasses: [Int]
    let staffClef: Int
    /// 中央スタッフ用。`progressionStaffVoicingStaves` があれば構成音単位。
    let voicingStavesPerNote: [Int]?

    static func make(from snapshot: SurvivalUISnapshot) -> Self? {
        guard snapshot.slots.indices.contains(1) else { return nil }
        let slot = snapshot.slots[1]
        guard slot.isEnabled else { return nil }

        if let chord = slot.chord,
           chord.quality == .progression,
           let staffNames = chord.progressionStaffVoicingNames,
           !staffNames.isEmpty,
           let keyFf = chord.progressionStaffKeyFifths {
            let pcs = SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            )
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: staffNames,
                keyFifths: keyFf,
                correctPitchClasses: pcs,
                staffClef: 2,
                voicingStavesPerNote: chord.progressionStaffVoicingStaves
            )
        }

        if snapshot.stageType != .progression,
           let chord = slot.chord,
           chord.quality != .progression,
           let hintVoicing = SurvivalRandomHintStaff.voicing(forChordId: chord.id) {
            let pcs = SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            )
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: hintVoicing.names,
                keyFifths: hintVoicing.keyFifths,
                correctPitchClasses: pcs,
                staffClef: 1,
                voicingStavesPerNote: nil
            )
        }

        return nil
    }

    @MainActor
    static func make(from loop: BalloonRushGameLoop) -> Self? {
        guard loop.slots.indices.contains(SurvivalSlotIndex.B.rawValue) else { return nil }
        let slot = loop.slots[SurvivalSlotIndex.B.rawValue]
        guard slot.isEnabled, let chord = slot.chord else { return nil }
        let pcs = SurvivalChordResolver.correctNotes(
            inputPitchClasses: slot.inputPitchClasses,
            target: chord
        )

        if chord.quality == .progression,
           let staffNames = chord.progressionStaffVoicingNames,
           !staffNames.isEmpty,
           let keyFf = chord.progressionStaffKeyFifths {
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: staffNames,
                keyFifths: keyFf,
                correctPitchClasses: pcs,
                staffClef: 2,
                voicingStavesPerNote: chord.progressionStaffVoicingStaves
            )
        }

        if chord.quality != .progression,
           let hintVoicing = SurvivalRandomHintStaff.voicing(forChordId: chord.id) {
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: hintVoicing.names,
                keyFifths: hintVoicing.keyFifths,
                correctPitchClasses: pcs,
                staffClef: 1,
                voicingStavesPerNote: nil
            )
        }

        return nil
    }
}

private struct SurvivalTutorialStaffBackdropModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1),
            )
    }
}

private struct SurvivalStageCenterStaffOverlay: View {
    let payload: SurvivalStageCenterStaffPayload
    let unpressedNoteOpacity: CGFloat

    var body: some View {
        SurvivalProgressionStaffView(
            chordDisplayName: payload.chordDisplayName,
            voicingNames: payload.voicingNames,
            keyFifths: payload.keyFifths,
            correctPitchClasses: payload.correctPitchClasses,
            staffClef: payload.staffClef,
            unpressedNoteOpacity: unpressedNoteOpacity,
            compactVerticalLayout: true,
            voicingStavesPerNote: payload.voicingStavesPerNote
        )
        .frame(maxWidth: 560, maxHeight: 160, alignment: .top)
    }
}

private struct SurvivalPhraseStaffOverlay: View {
    let snapshot: SurvivalPhraseStaffSnapshot

    var body: some View {
        SurvivalPhraseStaffView(snapshot: snapshot)
            .frame(maxWidth: 560, maxHeight: 160, alignment: .top)
    }
}

private struct SurvivalScenarioStaffPanel: View, Equatable {
    struct Snapshot: Equatable {
        let chordDisplayName: String
        let voicingNames: [String]
        let keyFifths: Int
        let correctPitchClasses: [Int]
        let staffClef: Int
        /// 1=ト音・2=ヘ音。`voicingNames` と同長のとき大譜表。
        let voicingStavesPerNote: [Int]?
    }

    let snapshot: Snapshot

    private var usesGrandStaffLayout: Bool {
        guard let staves = snapshot.voicingStavesPerNote, staves.count == snapshot.voicingNames.count else {
            return false
        }
        return staves.contains(1) && staves.contains(2)
    }

    var body: some View {
        SurvivalProgressionStaffView(
            chordDisplayName: snapshot.chordDisplayName,
            voicingNames: snapshot.voicingNames,
            keyFifths: snapshot.keyFifths,
            correctPitchClasses: snapshot.correctPitchClasses,
            staffClef: snapshot.staffClef,
            compactVerticalLayout: true,
            voicingStavesPerNote: snapshot.voicingStavesPerNote
        )
        .frame(
            maxWidth: 560,
            maxHeight: usesGrandStaffLayout ? 260 : 220,
            alignment: .top
        )
        .modifier(SurvivalTutorialStaffBackdropModifier())
    }
}

/// 鍵盤付近に重ねる A/B コンボ数表示（途切れで非表示）。
private struct SurvivalComboBadgeView: View {
    let comboCount: Int

    var body: some View {
        if comboCount > 0 {
            HStack(spacing: 4) {
                Text("COMBO")
                    .font(.caption.bold())
                    .foregroundStyle(.white.opacity(0.85))
                Text("\(comboCount)")
                    .font(.title2.bold())
                    .foregroundStyle(.yellow)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.black.opacity(0.55), in: Capsule())
            .overlay(
                Capsule()
                    .stroke(.yellow.opacity(0.6), lineWidth: 1)
            )
        }
    }
}

// MARK: - SpriteKit ブリッジ

private func playfieldSize(for session: any SurvivalPlaySession) -> CGSize {
    if session is BalloonRushGameSession {
        return CGSize(width: BalloonRushMap.width, height: BalloonRushMap.height)
    }
    return CGSize(width: SurvivalMap.width, height: SurvivalMap.height)
}

private struct SurvivalSceneContainer: UIViewRepresentable {
    let session: any SurvivalPlaySession
    let faiBubbleText: String
    let jajiiBubbleText: String

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> SKView {
        let initialFrame = UIScreen.main.bounds
        let view = SKView(frame: initialFrame)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        view.isAsynchronous = false
        view.isPaused = false
        view.isUserInteractionEnabled = false

        let sceneSize = initialFrame.size.width > 0 && initialFrame.size.height > 0
            ? initialFrame.size
            : CGSize(width: 1, height: 1)
        let playfield = playfieldSize(for: session)
        let scene = SurvivalScene(size: sceneSize, driver: session, playfieldSize: playfield)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        view.presentScene(scene)

        context.coordinator.attach(view: view, scene: scene, session: session)
        context.coordinator.lastSceneRestartGeneration = session.viewModel.sceneRestartGeneration
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        if let scene = uiView.scene as? SurvivalScene {
            scene.setPlayerQuoteText(faiBubbleText)
            scene.setJajiiQuoteText(jajiiBubbleText)
        }

        let gen = session.viewModel.sceneRestartGeneration
        guard gen != context.coordinator.lastSceneRestartGeneration else { return }
        context.coordinator.lastSceneRestartGeneration = gen
        let bounds = uiView.bounds
        let sceneSize: CGSize
        if bounds.width > 0, bounds.height > 0 {
            sceneSize = bounds.size
        } else {
            sceneSize = UIScreen.main.bounds.size
        }
        if let existing = uiView.scene as? SurvivalScene {
            existing.size = sceneSize
            existing.scaleMode = .resizeFill
            existing.isPaused = false
            existing.resetForRestart()
            uiView.isPaused = false
            uiView.isUserInteractionEnabled = false
            context.coordinator.attach(view: uiView, scene: existing, session: session)
            return
        }
        let playfield = playfieldSize(for: session)
        let scene = SurvivalScene(size: sceneSize, driver: session, playfieldSize: playfield)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        uiView.isPaused = false
        uiView.isUserInteractionEnabled = false
        uiView.presentScene(scene)
        context.coordinator.attach(view: uiView, scene: scene, session: session)
    }

    static func dismantleUIView(_ uiView: SKView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private weak var view: SKView?
        private weak var scene: SurvivalScene?
        private weak var session: (any SurvivalPlaySession)?
        private var watchdog: Timer?

        private var activeObserver: NSObjectProtocol?
        private var willResignObserver: NSObjectProtocol?
        var lastSceneRestartGeneration: Int = 0

        func attach(view: SKView, scene: SurvivalScene, session: any SurvivalPlaySession) {
            detach()

            self.view = view
            self.scene = scene
            self.session = session

            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                Task { @MainActor in
                    self?.resumeIfPausedExternally()
                }
            }
            willResignObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.willResignActiveNotification,
                object: nil,
                queue: .main
            ) { _ in }

            let w = Timer(timeInterval: 0.25, repeats: true) { [weak self] _ in
                Task { @MainActor in
                    self?.resumeIfSceneLoopStalled()
                }
            }
            watchdog = w
            RunLoop.main.add(w, forMode: .common)
        }

        func detach() {
            watchdog?.invalidate()
            watchdog = nil
            if let o = activeObserver { NotificationCenter.default.removeObserver(o) }
            if let o = willResignObserver { NotificationCenter.default.removeObserver(o) }
            activeObserver = nil
            willResignObserver = nil
            view = nil
            scene = nil
            session = nil
        }

        @MainActor
        private func resumeIfPausedExternally() {
            guard let view, let scene else { return }
            if view.isPaused { view.isPaused = false }
            if scene.isPaused { scene.isPaused = false }
        }

        @MainActor
        private func resumeIfSceneLoopStalled() {
            guard let view, let scene, let session else { return }
            guard view.window != nil else { return }
            guard session.allowsGameplayWatchdog else { return }
            let vm = session.viewModel
            guard vm.uiSnapshot.phase == .playing, !vm.isPaused else { return }

            let wallNow = CACurrentMediaTime()
            let stalled = wallNow - scene.lastUpdateWallTime > 0.5
            let viewWasPaused = view.isPaused
            let sceneWasPaused = scene.isPaused
            if viewWasPaused || sceneWasPaused || stalled {
                view.isPaused = false
                scene.isPaused = false
            }
        }
    }
}
