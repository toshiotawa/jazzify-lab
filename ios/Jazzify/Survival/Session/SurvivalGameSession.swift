import Combine
import Foundation
import QuartzCore

/// SwiftUI が保持するサバイバルプレイセッション。ゲームループ・入力バッファ・UI 公開を束ねる。
@MainActor
final class SurvivalGameSession: ObservableObject {
    let gameLoop: SurvivalGameLoop
    let input: SurvivalInputBuffer
    let viewModel: SurvivalViewModel
    let audioController = SurvivalAudioController()
    private let simulation: SurvivalSimulation

    @Published private(set) var state: SurvivalSessionState = .ready
    @Published private(set) var userInputNotePulse: UInt64 = 0

    /// SpriteKit watchdog がタイムボックス復旧判定してよいか（実行中のみ。結果オーバーレイや終了後は無効）。
    var allowsGameplayWatchdog: Bool {
        state == .running
    }

    private let stage: SurvivalStageDefinition
    private var hintMode: Bool
    private let characterId: String
    private let isDemo: Bool
    private let lessonContext: SurvivalLessonContext?
    private let usesEnglishToastCopy: Bool
    private let onExit: (_ isCleared: Bool) -> Void
    /// チュートリアルなど Supabase を叩かずにフレーズを注入する際に使用。
    private let inlinePhraseDefinition: SurvivalPhraseDefinition?
    private let supabase = SupabaseService.shared
    private var uiForward: AnyCancellable?

    init(
        stage: SurvivalStageDefinition,
        hintMode: Bool,
        characterId: String,
        profile: SurvivalCharacterProfile = .defaultFai,
        config: SurvivalStageConfig = .default,
        onExit: @escaping (_ isCleared: Bool) -> Void,
        isDemo: Bool = false,
        lessonContext: SurvivalLessonContext? = nil,
        usesEnglishToastCopy: Bool,
        scenarioOverrides: SurvivalScenarioOverrides = .init(),
        scenarioController: SurvivalScenarioController? = nil,
        inlinePhraseDefinition: SurvivalPhraseDefinition? = nil
    ) {
        let loop = SurvivalGameLoop(
            stage: stage,
            hintMode: hintMode,
            profile: profile,
            config: config,
            scenarioOverrides: scenarioOverrides
        )
        self.gameLoop = loop
        self.simulation = SurvivalSimulation(gameLoop: loop)
        self.input = SurvivalInputBuffer()
        let now = CACurrentMediaTime()
        let vm = SurvivalViewModel(
            uiSnapshot: SurvivalUISnapshot.make(from: loop.runtime, hintSlotIndex: loop.currentHintSlotIndex),
            bossHud: loop.bossBattle.map(Self.makeBossHudSnapshot(from:)),
            isBossStage: loop.isBossStage,
            chordPadHintMidis: loop.currentHintHighlightMidis(),
            chordPadCompletedHintMidis: loop.currentHintCompletedHighlightMidis(),
            chordPadScrollAnchorMidi: loop.isPhraseMode ? loop.phraseKeyboardScrollAnchorMidi : nil,
            now: now
        )
        self.viewModel = vm
        self.stage = stage
        self.hintMode = hintMode
        self.characterId = characterId
        self.isDemo = isDemo
        self.lessonContext = lessonContext
        self.usesEnglishToastCopy = usesEnglishToastCopy
        self.onExit = onExit
        self.inlinePhraseDefinition = inlinePhraseDefinition

        uiForward = vm.objectWillChange.sink { [weak self] _ in
            self?.objectWillChange.send()
        }

        scenarioController?.bind(session: self)
    }

    func dispose() {
        guard state != .disposed else { return }
        uiForward?.cancel()
        uiForward = nil
        stopAudio()
        state = .disposed
    }

    private static func makeBossHudSnapshot(from battle: SurvivalBossBattleState) -> SurvivalBossHUDSnapshot {
        SurvivalBossHUDSnapshot(
            hp: battle.boss.hp,
            maxHp: battle.boss.maxHp,
            phase: battle.boss.phase,
            result: battle.result,
            isDefeating: battle.defeatedAt != nil
        )
    }

    func start() {
        guard state != .disposed else { return }
        let playBackgroundMusic = !gameLoop.runtime.scenario.disableSurvivalBgm
        if gameLoop.isPhraseMode {
            if let phrase = inlinePhraseDefinition {
                gameLoop.loadPhraseDefinition(phrase)
                viewModel.syncPhraseStaff(from: gameLoop)
                if playBackgroundMusic {
                    applyPhraseBackgroundMusicUrlIfAvailable()
                }
                audioController.start(playBackgroundMusic: playBackgroundMusic)
            } else {
                Task {
                    if let phrase = try? await supabase.fetchSurvivalPhrase(
                        mapCategory: stage.mapCategory,
                        stageNumber: stage.stageNumber
                    ) {
                        gameLoop.loadPhraseDefinition(phrase)
                        viewModel.syncPhraseStaff(from: gameLoop)
                        if playBackgroundMusic {
                            applyPhraseBackgroundMusicUrlIfAvailable(fetchedPhrase: phrase)
                        }
                    }
                    audioController.start(playBackgroundMusic: playBackgroundMusic)
                }
            }
        } else {
            if playBackgroundMusic {
                audioController.setBgmUrl(gameLoop.stageConfig.bgmUrl)
            }
            audioController.start(playBackgroundMusic: playBackgroundMusic)
        }
        gameLoop.markAudioClockStarted()
        state = .running
    }

    func stopAudio() {
        audioController.stop()
        viewModel.clearMidiHeldKeys()
    }

    /// チュートリアル等: 共有ドラム停止後にフレーズ BGM を確実に再開する。
    func resumeScenarioBackgroundMusicIfEnabled() {
        guard state == .running else { return }
        guard !gameLoop.runtime.scenario.disableSurvivalBgm else { return }
        if gameLoop.isPhraseMode {
            applyPhraseBackgroundMusicUrlIfAvailable()
        }
        audioController.start(playBackgroundMusic: true)
    }

    private func applyPhraseBackgroundMusicUrlIfAvailable(
        fetchedPhrase: SurvivalPhraseDefinition? = nil
    ) {
        let urlString: String?
        if let phrase = fetchedPhrase ?? inlinePhraseDefinition {
            urlString = phrase.bgmUrl ?? gameLoop.stageConfig.bgmUrl?.absoluteString
        } else {
            urlString = gameLoop.stageConfig.bgmUrl?.absoluteString
        }
        guard let urlString, let url = URL(string: urlString) else { return }
        audioController.setBgmUrl(url)
    }

    func togglePause() {
        guard state == .running || state == .paused else { return }
        viewModel.togglePause()
        state = viewModel.isPaused ? .paused : .running
    }

    func requestExit() {
        guard state != .disposed else { return }
        stopAudio()
        state = .disposed
        onExit(gameLoop.runtime.phase == .cleared)
    }

    var currentHintMode: Bool { hintMode }

    func restartSameStage(hintMode newHintMode: Bool? = nil) {
        guard state != .disposed else { return }
        if let newHintMode {
            hintMode = newHintMode
        }
        stopAudio()
        input.clear()
        gameLoop.resetForSameStage(hintMode: hintMode)
        viewModel.applyFullReset(from: gameLoop, now: CACurrentMediaTime())
        viewModel.prepareForSceneRestart()
        state = .ready
        start()
    }

    func handleFrameEvents(_ events: [SurvivalFrameEvent]) {
        guard state != .disposed else { return }
        for event in events {
            switch event {
            case let .playEffect(effect):
                audioController.playEffect(effect)
            case let .playSynthBassRoot(midi):
                audioController.playSynthBassRoot(midi: midi)
            case let .stageEnded(cleared):
                submitClearReportIfEligible(cleared: cleared)
                state = .finishing(phase: cleared ? .cleared : .gameOver)
            }
        }
    }

    /// オンボーディングの自動演奏（スロット入力とは独立）。
    func playOnboardingChord(midis: [Int], durationSec: TimeInterval = 0.42) {
        guard state != .disposed else { return }
        audioController.pianoChordOn(midis: midis, velocity: 92)
        let copy = midis
        Task { @MainActor in
            let ns = UInt64(durationSec * 1_000_000_000)
            try? await Task.sleep(nanoseconds: ns)
            guard self.state != .disposed else { return }
            for m in copy { self.audioController.pianoNoteOff(midi: m) }
        }
    }

    func playOnboardingRoot(for chord: SurvivalResolvedChord) {
        guard state != .disposed else { return }
        audioController.playSynthBassRoot(midi: 36 + chord.rootPitchClass)
    }

    /// タッチ鍵盤: ピアノ音はここで即座に鳴らし、ノートオンは次フレームの `drain` でシミュへ渡す。
    func chordPadNoteOn(_ note: Int, velocity: Int = 100) {
        guard state != .disposed else { return }
        if gameLoop.runtime.scenario.blockChordPadInput { return }
        userInputNotePulse &+= 1
        audioController.pianoNoteOn(midi: note, velocity: velocity)
        input.enqueueNoteOn(note, velocity: velocity)
    }

    func chordPadNoteOff(_ note: Int) {
        guard state != .disposed else { return }
        if gameLoop.runtime.scenario.blockChordPadInput { return }
        audioController.pianoNoteOff(midi: note)
        input.enqueueNoteOff(note)
    }

    /// MIDI: リアルタイム発音済み想定。ゲーム入力のみキューへ。
    func midiGameNoteOn(_ note: Int, velocity: Int) {
        guard state != .disposed else { return }
        if gameLoop.runtime.scenario.blockMidiGameInput { return }
        userInputNotePulse &+= 1
        input.enqueueNoteOn(note, velocity: velocity)
    }

    func midiGameNoteOff(_ note: Int) {
        guard state != .disposed else { return }
        if gameLoop.runtime.scenario.blockMidiGameInput { return }
        input.enqueueNoteOff(note)
    }

    private func submitClearReportIfEligible(cleared: Bool) {
        guard cleared, !hintMode, !isDemo else { return }
        guard viewModel.beginSupabaseClearReport() else { return }

        if let lessonContext {
            Task { [weak self] in
                guard let self else { return }
                do {
                    _ = try await self.supabase.recordEarTrainingLessonProgress(
                        lessonId: lessonContext.lessonId,
                        lessonSongId: lessonContext.lessonSongId,
                        rank: "S",
                        clearConditions: lessonContext.clearConditions
                    )
                    await MainActor.run { self.viewModel.endSupabaseClearReport(error: nil) }
                } catch {
                    await MainActor.run { self.viewModel.endSupabaseClearReport(error: error.localizedDescription) }
                }
            }
            return
        }

        let stageNumber = stage.stageNumber
        let mapCategory = stage.mapCategory
        let elapsed = gameLoop.runtime.elapsedSeconds
        let defeated = gameLoop.runtime.enemiesDefeated
        let character = characterId
        Task { [weak self] in
            guard let self else { return }
            do {
                let userId = try await self.supabase.currentUserId()
                try await self.supabase.upsertSurvivalStageClear(
                    userId: userId,
                    stageNumber: stageNumber,
                    survivalTimeSeconds: Int(elapsed.rounded()),
                    finalLevel: 1,
                    enemiesDefeated: defeated,
                    characterId: character,
                    totalStages: SurvivalStageCatalog.totalStages(in: mapCategory),
                    mapCategory: mapCategory
                )
                do {
                    let sourceId = "\(mapCategory.rawValue):\(stageNumber)"
                    let award = try await self.supabase.awardPlayerXp(
                        reason: "survival_stage_first_clear",
                        sourceId: sourceId,
                        amount: 80
                    )
                    await MainActor.run {
                        PlayerLevelHub.shared.ingestAwardResponse(award, usesEnglishUi: self.usesEnglishToastCopy)
                    }
                } catch {
                    /* 初回クリア進捗は保存済み。XP が取れなくても致命ではない */
                }
                await MainActor.run { self.viewModel.endSupabaseClearReport(error: nil) }
            } catch {
                await MainActor.run { self.viewModel.endSupabaseClearReport(error: error.localizedDescription) }
            }
        }
    }
}

extension SurvivalGameSession: SurvivalSceneDriver {
    func advanceSceneFrame(currentTime: TimeInterval) -> SurvivalSceneSnapshot {
        if state == .disposed {
            return SurvivalSceneSnapshot(runtime: gameLoop.runtime, bossBattle: gameLoop.bossBattle)
        }
        let frameInput = input.drain()
        let (events, snapshot) = simulation.step(
            currentTime: currentTime,
            frameInput: frameInput,
            isPaused: viewModel.isPaused
        )
        handleFrameEvents(events)
        viewModel.syncAfterFrame(gameLoop: gameLoop, now: currentTime)
        return snapshot
    }
}
