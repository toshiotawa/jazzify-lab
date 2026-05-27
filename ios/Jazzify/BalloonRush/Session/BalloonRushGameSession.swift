import Combine
import Foundation
import QuartzCore

@MainActor
final class BalloonRushGameSession: ObservableObject {
    let gameLoop: BalloonRushGameLoop
    let input = SurvivalInputBuffer()
    let viewModel: BalloonRushViewModel
    let audioController = SurvivalAudioController()

    private let stage: BalloonRushStageDefinition
    private let hintMode: Bool
    private let lessonContext: BalloonRushLessonContext?
    private let locale: AppLocale
    private let onExit: () -> Void
    private let supabase = SupabaseService.shared
    private var displayLink: CADisplayLink?
    private var lastFrameTime: TimeInterval = 0
    private var uiForward: AnyCancellable?

    init(
        stage: BalloonRushStageDefinition,
        hintMode: Bool,
        profile: SurvivalCharacterProfile = .defaultFai,
        lessonContext: BalloonRushLessonContext?,
        locale: AppLocale,
        onExit: @escaping () -> Void
    ) {
        self.stage = stage
        self.hintMode = hintMode
        self.lessonContext = lessonContext
        self.locale = locale
        self.onExit = onExit
        let loop = BalloonRushGameLoop(stage: stage, hintMode: hintMode, profile: profile)
        self.gameLoop = loop
        let vm = BalloonRushViewModel(snapshot: loop.makeUISnapshot())
        self.viewModel = vm
        uiForward = vm.objectWillChange.sink { [weak self] _ in
            self?.objectWillChange.send()
        }
    }

    func start() {
        if let urlStr = stage.bgmUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           !urlStr.isEmpty,
           let url = URL(string: urlStr) {
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

    @objc private func tick(_ link: CADisplayLink) {
        let now = link.timestamp
        let dt = lastFrameTime > 0 ? now - lastFrameTime : 0
        lastFrameTime = now

        let frame = input.drain()
        let cleared = gameLoop.applyFrameInput(frame, deltaTime: dt, now: now)
        viewModel.sync(from: gameLoop)

        if cleared, !hintMode, let ctx = lessonContext {
            submitLessonClear(ctx)
        }

        if gameLoop.phase != .playing {
            displayLink?.invalidate()
            displayLink = nil
            audioController.stop()
        }
    }

    func handleResultDismiss() {
        dispose()
        onExit()
    }

    private func submitLessonClear(_ ctx: BalloonRushLessonContext) {
        guard viewModel.beginClearReport() else { return }
        Task { [weak self] in
            guard let self else { return }
            do {
                _ = try await self.supabase.recordEarTrainingLessonProgress(
                    lessonId: ctx.lessonId,
                    lessonSongId: ctx.lessonSongId,
                    rank: "S",
                    clearConditions: ctx.clearConditions
                )
                await MainActor.run { self.viewModel.endClearReport(error: nil) }
            } catch {
                await MainActor.run { self.viewModel.endClearReport(error: error.localizedDescription) }
            }
        }
    }
}
