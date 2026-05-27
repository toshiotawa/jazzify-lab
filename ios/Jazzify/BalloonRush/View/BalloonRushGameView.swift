import SwiftUI

struct BalloonRushGameView: View {
    let stage: BalloonRushStageDefinition
    let hintMode: Bool
    let locale: AppLocale
    let lessonContext: BalloonRushLessonContext?
    let onClose: () -> Void

    @State private var session: BalloonRushGameSession?
    @State private var midiHolder = MIDISubscriptionHolder()
    @State private var dialogueFai = ""
    @State private var dialogueJajii = ""
    @StateObject private var dialoguePlayerHolder = BalloonRushDialogueHolder()

    var body: some View {
        ZStack {
            if let session {
                content(session: session)
            } else {
                ProgressView()
                    .tint(Color(hex: "38bdf8"))
            }
        }
        .background(Color.black)
        .task { await bootstrap() }
        .onDisappear {
            midiHolder.cancel()
            dialoguePlayerHolder.cancel()
            session?.dispose()
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    private func content(session: BalloonRushGameSession) -> some View {
        let vm = session.viewModel
        let loop = session.gameLoop
        ZStack(alignment: .top) {
            BalloonRushWorldCanvas(snapshot: loop.makeDrawSnapshot(now: CACurrentMediaTime()))
                .ignoresSafeArea()

            SurvivalJoystickRepresentable(
                hitMask: .full,
                isInteractive: vm.snapshot.phase == .playing
            ) { analog in
                session.input.setAnalog(analog)
            }
            .allowsHitTesting(vm.snapshot.phase == .playing)

            if hintMode, vm.snapshot.phase == .playing {
                staffOverlay(from: vm.snapshot)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .padding(.top, 56)
                    .padding(.horizontal, 12)
                    .allowsHitTesting(false)
            }

            VStack(spacing: 0) {
                BalloonRushHUDView(
                    timeLeftSec: vm.snapshot.timeLeftSec,
                    remainPop: vm.snapshot.remainPop,
                    stageTitle: stage.localizedTitle(locale),
                    hintMode: hintMode,
                    locale: locale,
                    onExit: { session.handleResultDismiss(); onClose() }
                )
                if !dialogueFai.isEmpty || !dialogueJajii.isEmpty {
                    HStack(alignment: .top, spacing: 8) {
                        if !dialogueFai.isEmpty {
                            Text(dialogueFai)
                                .font(.caption)
                                .foregroundStyle(.white)
                                .padding(8)
                                .background(.black.opacity(0.5))
                                .cornerRadius(8)
                        }
                        Spacer()
                        if !dialogueJajii.isEmpty {
                            Text(dialogueJajii)
                                .font(.caption)
                                .foregroundStyle(Color(hex: "fde68a"))
                                .padding(8)
                                .background(.black.opacity(0.5))
                                .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal, 12)
                }
                Spacer()
            }

            VStack {
                Spacer()
                SurvivalChordPadView(
                    snapshot: SurvivalChordPadSnapshot(
                        hintMidis: vm.snapshot.hintMode ? session.gameLoop.currentHintHighlightMidis() : [],
                        completedHintMidis: vm.snapshot.hintMode ? session.gameLoop.currentHintCompletedHighlightMidis() : [],
                        hintPendingOpacity: session.gameLoop.keyboardHintPendingOpacity(),
                        midiHeldKeys: vm.midiHeldKeys,
                        isEnabled: vm.snapshot.phase == .playing,
                        scrollAnchorMidi: nil
                    ),
                    onPress: { session.chordPadNoteOn($0) },
                    onRelease: { session.chordPadNoteOff($0) }
                )
                .equatable()
                .padding(.bottom, 8)
            }

            if vm.snapshot.phase != .playing {
                resultOverlay(session: session, vm: vm)
            }
        }
    }

    @ViewBuilder
    private func staffOverlay(from snap: BalloonRushUISnapshot) -> some View {
        if snap.slots.indices.contains(1) {
            let slot = snap.slots[1]
            if slot.isEnabled, let chord = slot.chord,
               let names = chord.progressionStaffVoicingNames, !names.isEmpty {
                let pcs = SurvivalChordResolver.correctNotes(
                    inputPitchClasses: slot.inputPitchClasses,
                    target: chord
                )
                SurvivalProgressionStaffView(
                    chordDisplayName: chord.displayName,
                    voicingNames: names,
                    keyFifths: chord.progressionStaffKeyFifths ?? stage.keyFifths,
                    correctPitchClasses: pcs,
                    staffClef: 2,
                    unpressedNoteOpacity: snap.unpressedNoteOpacity,
                    voicingStavesPerNote: chord.progressionStaffVoicingStaves
                )
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    @ViewBuilder
    private func resultOverlay(session: BalloonRushGameSession, vm: BalloonRushViewModel) -> some View {
        let cleared = vm.snapshot.phase == .cleared
        ZStack {
            Color.black.opacity(0.65).ignoresSafeArea()
            VStack(spacing: 16) {
                Text(cleared
                     ? (locale == .ja ? "クリア！" : "Clear!")
                     : (locale == .ja ? "時間切れ" : "Time up"))
                    .font(.title.bold())
                    .foregroundStyle(cleared ? Color(hex: "4ade80") : .orange)
                Button {
                    session.handleResultDismiss()
                    onClose()
                } label: {
                    Text(locale == .ja ? "戻る" : "Back")
                        .font(.headline)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 12)
                        .background(Color(hex: "38bdf8"))
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)
            }
        }
    }

    @MainActor
    private func bootstrap() async {
        let profile = (try? await SupabaseService.shared.fetchFaiProfile()) ?? .defaultFai
        let created = BalloonRushGameSession(
            stage: stage,
            hintMode: hintMode,
            profile: profile,
            lessonContext: lessonContext,
            locale: locale,
            onExit: onClose
        )
        created.start()
        session = created

        midiHolder.cancel()
        midiHolder.subscription = MIDIManager.shared.subscribe { [weak created] status, data1, data2 in
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

        await dialoguePlayerHolder.loadAndSchedule(
            stageId: stage.id,
            usesEnglishCopy: locale == .en,
            onFai: { dialogueFai = $0 },
            onJajii: { dialogueJajii = $0 }
        )
    }
}

@MainActor
private final class BalloonRushDialogueHolder: ObservableObject {
    private let player = SurvivalStageIntroPlayer()

    func cancel() {
        player.cancel(setLineEmpty: {})
    }

    func loadAndSchedule(
        stageId: UUID,
        usesEnglishCopy: Bool,
        onFai: @escaping (String) -> Void,
        onJajii: @escaping (String) -> Void
    ) async {
        cancel()
        guard let script = await SupabaseService.shared.fetchBalloonRushPlayDialogue(stageId: stageId) else { return }
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: onFai,
            onJajiiLine: onJajii
        )
    }
}
