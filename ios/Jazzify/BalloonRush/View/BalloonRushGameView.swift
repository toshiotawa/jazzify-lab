import SwiftUI

/// 風船ラッシュ — UI は `SurvivalGameView` / `SurvivalGameContent` を流用。
struct BalloonRushGameView: View {
    let stage: BalloonRushStageDefinition
    let hintMode: Bool
    let locale: AppLocale
    let lessonContext: BalloonRushLessonContext?
    let productionHintModes: ResolvedProductionHintModes?
    let onClose: () -> Void

    @State private var session: BalloonRushGameSession?
    @State private var bootstrapTask: Task<Void, Never>?
    @State private var bootstrapID = UUID()
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    private var presentationStage: SurvivalStageDefinition {
        BalloonRushSurvivalBridge.presentationStage(from: stage)
    }

    var body: some View {
        ZStack {
            if let session {
                SurvivalGameContent(
                    session: session,
                    stage: presentationStage,
                    balloonRushPlayDialogueStageId: stage.id,
                    locale: locale,
                    isDemo: false,
                    externalJajiiBubbleText: "",
                    onApplyHintModeAndRestart: { newHint in
                        session.restartSameStage(hintMode: newHint)
                    }
                )
            } else {
                ProgressView()
                    .tint(Color(hex: "38bdf8"))
            }
        }
        .background(Color.black)
        .task {
            bootstrapTask?.cancel()
            let id = UUID()
            bootstrapID = id
            bootstrapTask = Task { await bootstrap(id: id) }
        }
        .onDisappear {
            bootstrapTask?.cancel()
            bootstrapID = UUID()
            midiSubscriptionHolder.cancel()
            session?.dispose()
        }
        .preferredColorScheme(.dark)
    }

    @MainActor
    private func bootstrap(id: UUID) async {
        guard session == nil else { return }
        let profile = (try? await SupabaseService.shared.fetchFaiProfile()) ?? .defaultFai
        let created = BalloonRushGameSession(
            stage: stage,
            hintMode: hintMode,
            profile: profile,
            lessonContext: lessonContext,
            productionHintModes: productionHintModes,
            locale: locale,
            onExit: onClose
        )
        created.start()
        guard !Task.isCancelled, bootstrapID == id else {
            created.dispose()
            return
        }
        session = created
        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { [weak created] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            DispatchQueue.main.async {
                guard let created else { return }
                if isNoteOn {
                    created.midiGameNoteOn(note, velocity: velocity)
                    created.viewModel.registerMidiKeyDown(note)
                } else if isNoteOff {
                    created.midiGameNoteOff(note)
                    created.viewModel.registerMidiKeyUp(note)
                }
            }
        }
    }
}
