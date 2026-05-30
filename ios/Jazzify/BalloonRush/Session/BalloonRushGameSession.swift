import Combine
import Foundation
import QuartzCore

@MainActor
final class BalloonRushGameSession: SurvivalPlaySession {
    let gameLoop: BalloonRushGameLoop
    let input = SurvivalInputBuffer()
    let viewModel: SurvivalViewModel
    let playLoopFacade: SurvivalPlayLoopFacade
    let audioController = SurvivalAudioController()

    private let balloonStage: BalloonRushStageDefinition
    private let presentationStage: SurvivalStageDefinition
    private var hintMode: Bool
    private let lessonContext: BalloonRushLessonContext?
    private let locale: AppLocale
    private let onExit: () -> Void
    private let supabase = SupabaseService.shared
    private var displayLink: CADisplayLink?
    private var lastFrameTime: TimeInterval = 0
    private var uiForward: AnyCancellable?

    var currentHintMode: Bool { hintMode }
    var allowsGameplayWatchdog: Bool { displayLink != nil }

    init(
        stage: BalloonRushStageDefinition,
        hintMode: Bool,
        profile: SurvivalCharacterProfile = .defaultFai,
        lessonContext: BalloonRushLessonContext?,
        productionHintModes: ResolvedProductionHintModes? = nil,
        locale: AppLocale,
        onExit: @escaping () -> Void
    ) {
        self.balloonStage = stage
        self.presentationStage = BalloonRushSurvivalBridge.presentationStage(from: stage)
        self.hintMode = hintMode
        self.lessonContext = lessonContext
        self.locale = locale
        self.onExit = onExit
        let loop = BalloonRushGameLoop(
            stage: stage,
            hintMode: hintMode,
            profile: profile,
            productionHintModes: productionHintModes
        )
        self.gameLoop = loop
        self.playLoopFacade = BalloonRushPlayLoopFacade(loop: loop, popQuota: stage.popQuota)
        let ui = BalloonRushSurvivalBridge.makeUISnapshot(
            from: loop,
            stage: presentationStage,
            hintSlotIndex: loop.effectiveHintSlotIndex
        )
        self.viewModel = SurvivalViewModel(
            uiSnapshot: ui,
            bossHud: nil,
            isBossStage: false,
            chordPadHintMidis: loop.currentHintHighlightMidis(),
            chordPadCompletedHintMidis: loop.currentHintCompletedHighlightMidis(),
            chordPadHintPendingOpacity: loop.keyboardHintPendingOpacity(),
            chordPadScrollAnchorMidi: nil,
            now: CACurrentMediaTime()
        )
        uiForward = viewModel.objectWillChange.sink { [weak self] _ in
            self?.objectWillChange.send()
        }
    }

    func start() {
        let trimmed = balloonStage.bgmUrl?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let urlStr = trimmed.isEmpty ? BalloonRushDrumLoopBgm.urlString : trimmed
        if let url = URL(string: urlStr) {
            audioController.setBgmUrl(url)
        } else {
            audioController.setBgmUrl(nil)
        }
        audioController.start(playBackgroundMusic: true)
        lastFrameTime = CACurrentMediaTime()
        let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
        link.preferredFrameRateRange = CAFrameRateRange(minimum: 30, maximum: 60, preferred: 60)
        link.add(to: .main, forMode: .common)
        displayLink = link
    }

    func dispose() {
        displayLink?.invalidate()
        displayLink = nil
        audioController.stop()
        uiForward?.cancel()
        uiForward = nil
    }

    func togglePause() {
        viewModel.togglePause()
    }

    func chordPadNoteOn(_ midi: Int, velocity: Int = 100) {
        audioController.pianoNoteOn(midi: midi, velocity: velocity)
        input.enqueueNoteOn(midi, velocity: velocity)
    }

    func chordPadNoteOff(_ midi: Int) {
        audioController.pianoNoteOff(midi: midi)
        input.enqueueNoteOff(midi)
    }

    func midiGameNoteOn(_ midi: Int, velocity: Int) {
        audioController.pianoNoteOnRealtime(midi: midi, velocity: velocity)
        input.enqueueNoteOn(midi, velocity: velocity)
    }

    func midiGameNoteOff(_ midi: Int) {
        audioController.pianoNoteOffRealtime(midi: midi)
        input.enqueueNoteOff(midi)
    }

    func restartSameStage(hintMode newHint: Bool?) {
        if let newHint {
            hintMode = newHint
        }
        audioController.stop()
        input.clear()
        gameLoop.resetForSameStage(hintMode: hintMode)
        syncViewModel()
        viewModel.prepareForSceneRestart()
        viewModel.resetClearReportState()
        lastFrameTime = 0
        start()
    }

    func requestExit() {
        dispose()
        onExit()
    }

    @objc private func tick(_ link: CADisplayLink) {
        guard !viewModel.isPaused else { return }
        let now = link.timestamp
        let dt = lastFrameTime > 0 ? now - lastFrameTime : 0
        lastFrameTime = now

        let frame = input.drain()
        let cleared = gameLoop.applyFrameInput(frame, deltaTime: dt, now: now)
        let audio = gameLoop.drainFrameAudio()
        if let rootMidi = audio.rootMidi {
            audioController.playSynthBassRoot(midi: rootMidi)
        }
        if audio.balloonPopCount > 0 {
            for _ in 0..<audio.balloonPopCount {
                audioController.playBalloonPop()
            }
        }
        syncViewModel()

        if cleared, !hintMode, let ctx = lessonContext {
            submitLessonClear(ctx)
        }

        if gameLoop.phase != .playing {
            displayLink?.invalidate()
            displayLink = nil
            switch gameLoop.phase {
            case .cleared:
                audioController.playEffect(.stageClear)
            case .failed:
                audioController.playEffect(.stageGameOver)
            case .playing:
                break
            }
            audioController.stop()
        }
    }

    private func syncViewModel() {
        let ui = BalloonRushSurvivalBridge.makeUISnapshot(
            from: gameLoop,
            stage: presentationStage,
            hintSlotIndex: gameLoop.effectiveHintSlotIndex
        )
        viewModel.syncBalloonRush(
            uiSnapshot: ui,
            chordPadHintMidis: gameLoop.currentHintHighlightMidis(),
            chordPadCompletedHintMidis: gameLoop.currentHintCompletedHighlightMidis(),
            chordPadHintPendingOpacity: gameLoop.keyboardHintPendingOpacity()
        )
    }

    private func submitLessonClear(_ ctx: BalloonRushLessonContext) {
        guard viewModel.beginSupabaseClearReport() else { return }
        Task { [weak self] in
            guard let self else { return }
            do {
                _ = try await self.supabase.recordEarTrainingLessonProgress(
                    lessonId: ctx.lessonId,
                    lessonSongId: ctx.lessonSongId,
                    rank: "S",
                    clearConditions: ctx.clearConditions
                )
                await MainActor.run { self.viewModel.endSupabaseClearReport(error: nil) }
            } catch {
                await MainActor.run {
                    self.viewModel.endSupabaseClearReport(error: error.localizedDescription)
                }
            }
        }
    }
}

extension BalloonRushGameSession: SurvivalSceneDriver {
    func advanceSceneFrame(currentTime: TimeInterval) -> SurvivalSceneSnapshot {
        let runtime = BalloonRushSurvivalBridge.makeRuntime(from: gameLoop, stage: presentationStage)
        return SurvivalSceneSnapshot(runtime: runtime, bossBattle: nil)
    }
}
