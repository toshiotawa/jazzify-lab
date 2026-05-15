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

    /// SpriteKit watchdog がタイムボックス復旧判定してよいか（実行中のみ。結果オーバーレイや終了後は無効）。
    var allowsGameplayWatchdog: Bool {
        state == .running
    }

    private let stage: SurvivalStageDefinition
    private let hintMode: Bool
    private let characterId: String
    private let isDemo: Bool
    private let usesEnglishToastCopy: Bool
    private let onExit: (_ isCleared: Bool) -> Void
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
        usesEnglishToastCopy: Bool
    ) {
        let loop = SurvivalGameLoop(stage: stage, hintMode: hintMode, profile: profile, config: config)
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
            now: now
        )
        self.viewModel = vm
        self.stage = stage
        self.hintMode = hintMode
        self.characterId = characterId
        self.isDemo = isDemo
        self.usesEnglishToastCopy = usesEnglishToastCopy
        self.onExit = onExit

        uiForward = vm.objectWillChange.sink { [weak self] _ in
            self?.objectWillChange.send()
        }
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
        audioController.setBgmUrl(gameLoop.stageConfig.bgmUrl)
        audioController.start()
        gameLoop.markAudioClockStarted()
        state = .running
    }

    func stopAudio() {
        audioController.stop()
        viewModel.clearMidiHeldKeys()
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

    func restartSameStage() {
        guard state != .disposed else { return }
        stopAudio()
        input.clear()
        gameLoop.resetForSameStage()
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

    /// タッチ鍵盤: ピアノ音はここで即座に鳴らし、ノートオンは次フレームの `drain` でシミュへ渡す。
    func chordPadNoteOn(_ note: Int, velocity: Int = 100) {
        guard state != .disposed else { return }
        audioController.pianoNoteOn(midi: note, velocity: velocity)
        input.enqueueNoteOn(note, velocity: velocity)
    }

    func chordPadNoteOff(_ note: Int) {
        guard state != .disposed else { return }
        audioController.pianoNoteOff(midi: note)
        input.enqueueNoteOff(note)
    }

    /// MIDI: リアルタイム発音済み想定。ゲーム入力のみキューへ。
    func midiGameNoteOn(_ note: Int, velocity: Int) {
        guard state != .disposed else { return }
        input.enqueueNoteOn(note, velocity: velocity)
    }

    func midiGameNoteOff(_ note: Int) {
        guard state != .disposed else { return }
        input.enqueueNoteOff(note)
    }

    private func submitClearReportIfEligible(cleared: Bool) {
        guard cleared, !hintMode, !isDemo else { return }
        guard viewModel.beginSupabaseClearReport() else { return }
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
