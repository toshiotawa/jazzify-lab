import SwiftUI
import UIKit

/// コード演奏バトルモード ([src/components/earTraining/EarTrainingChordVoicingScreen.tsx]) の iOS 画面。
struct EarTrainingChordVoicingGameView: View {
    let stageId: UUID
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    let onClose: () -> Void

    @State private var controller: EarTrainingChordVoicingBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingChordVoicingContent(
                    controller: controller,
                    audio: audio,
                    locale: locale,
                    onClose: onClose
                )
            } else if isLoading {
                loadingView
            } else {
                errorView
            }
        }
        .background(Color.black)
        .onAppear { OrientationManager.shared.lock(.portrait) }
        .task { await bootstrap() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            MIDIManager.shared.onMIDIEvent = nil
            controller?.tearDown()
        }
        .preferredColorScheme(.dark)
    }

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView().tint(.yellow)
            Text(locale == .ja ? "ステージを準備中…" : "Preparing ear training battle…")
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
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Button(action: { onClose() }) {
                Text(locale == .ja ? "戻る" : "Back")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color.yellow)
                    .cornerRadius(8)
            }
        }
    }

    @MainActor
    private func bootstrap() async {
        guard controller == nil else { return }
        isLoading = true
        loadError = nil
        do {
            let stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            let phrases = stageDetail.sortedPhrases()
            guard !phrases.isEmpty else {
                loadError = locale == .ja
                    ? "フレーズが登録されていません"
                    : "No phrases are registered for this stage."
                isLoading = false
                return
            }
            let audioInstance = EarTrainingAudio()
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            let createdController = EarTrainingChordVoicingBattleController(
                stage: stageDetail,
                phrases: phrases,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                enemyName: stageDetail.localizedTitle(locale),
                audio: audioInstance,
                onExit: onClose
            )

            MIDIManager.shared.onMIDIEvent = nil
            MIDIManager.shared.onMIDIEvent = { [weak createdController] status, data1, data2 in
                let messageType = status & 0xF0
                let note = Int(data1)
                let velocity = Int(data2)
                let isNoteOn = messageType == 0x90 && velocity > 0
                let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
                if isNoteOn {
                    SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: note, velocity: velocity)
                } else if isNoteOff {
                    SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: note)
                } else {
                    return
                }
                DispatchQueue.main.async { [weak createdController] in
                    guard let createdController else { return }
                    if isNoteOn {
                        createdController.handleNoteOn(midi: note, velocity: velocity, playAudio: false)
                        createdController.registerMidiKeyDown(note)
                    } else {
                        createdController.handleNoteOff(midi: note, playAudio: false)
                        createdController.registerMidiKeyUp(note)
                    }
                }
            }

            createdController.start()
            self.audio = audioInstance
            self.controller = createdController
            self.isLoading = false
            createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }
}

private struct EarTrainingChordVoicingContent: View {
    @ObservedObject var controller: EarTrainingChordVoicingBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let onClose: () -> Void

    private struct LayoutMetrics {
        let horizontalPadding: CGFloat
        let verticalPadding: CGFloat
        let spacing: CGFloat
        let topBarHeight: CGFloat
        let staffAreaHeight: CGFloat
        let pianoHeight: CGFloat
    }

    var body: some View {
        GeometryReader { proxy in
            let portraitSize = proxy.size
            let landscapeSize = CGSize(
                width: max(1, portraitSize.height),
                height: max(1, portraitSize.width)
            )
            landscapeContent(size: landscapeSize)
                .frame(width: landscapeSize.width, height: landscapeSize.height)
                .clipped()
                .rotationEffect(.degrees(90))
                .frame(width: portraitSize.width, height: portraitSize.height)
                .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
        }
        .ignoresSafeArea()
        .sheet(isPresented: $controller.isSettingsOpen) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    @ViewBuilder
    private func landscapeContent(size: CGSize) -> some View {
        let metrics = layoutMetrics(for: size)
        ZStack(alignment: .top) {
            LinearGradient(
                colors: [Color(red: 0.04, green: 0.07, blue: 0.13), Color(red: 0.10, green: 0.13, blue: 0.21)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: metrics.spacing) {
                topBar
                    .frame(height: metrics.topBarHeight)
                staffArea(height: metrics.staffAreaHeight)
                Spacer(minLength: 0)
                bottomPiano(height: metrics.pianoHeight)
            }
            .padding(.horizontal, metrics.horizontalPadding)
            .padding(.vertical, metrics.verticalPadding)

            if controller.showLobbyControls {
                lobbyOverlay
            }
        }
    }

    private func layoutMetrics(for size: CGSize) -> LayoutMetrics {
        let compactHeight = size.height < 430
        let horizontalPadding: CGFloat = compactHeight ? 12 : 16
        let verticalPadding: CGFloat = compactHeight ? 8 : 12
        let spacing: CGFloat = compactHeight ? 8 : 12
        let topBarHeight: CGFloat = compactHeight ? 42 : 50
        let pianoRatio: CGFloat = compactHeight ? 0.24 : 0.22
        let pianoHeight = min(CGFloat(120), max(CGFloat(86), size.height * pianoRatio))
        let reservedHeight = verticalPadding * 2 + spacing * 3 + topBarHeight + pianoHeight
        let staffAreaHeight = min(CGFloat(260), max(CGFloat(172), size.height - reservedHeight))
        return LayoutMetrics(
            horizontalPadding: horizontalPadding,
            verticalPadding: verticalPadding,
            spacing: spacing,
            topBarHeight: topBarHeight,
            staffAreaHeight: staffAreaHeight,
            pianoHeight: pianoHeight
        )
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            Button(action: { controller.handleBack() }) {
                Label(locale == .ja ? "戻る" : "Back", systemImage: "chevron.left")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.55), in: Capsule())
                    .foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(controller.statusText)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.85))
                Text(controller.timeLabel)
                    .font(.system(size: 18, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
            }
            Spacer()
            HStack(spacing: 14) {
                hpBar(label: locale == .ja ? "敵HP" : "Enemy", value: controller.enemyHp, max: controller.stage.enemyHp, tint: .red)
                hpBar(label: locale == .ja ? "自HP" : "Player", value: controller.playerHp, max: controller.stage.playerHp, tint: .green)
            }
            Button(action: { controller.handleOpenSettings() }) {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(8)
                    .background(Color.black.opacity(0.55), in: Circle())
            }
        }
    }

    private func hpBar(label: String, value: Int, max maxValue: Int, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption2).foregroundStyle(.white.opacity(0.7))
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.2)).frame(width: 110, height: 8)
                Capsule().fill(tint).frame(width: 110 * CGFloat(min(max(0, value), maxValue)) / CGFloat(max(1, maxValue)), height: 8)
            }
            Text("\(value) / \(maxValue)")
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .foregroundStyle(.white)
        }
    }

    private func staffArea(height: CGFloat) -> some View {
        let slotHeight: CGFloat = 36
        let innerPadding: CGFloat = 8
        let staffHeight = max(CGFloat(112), height - slotHeight - innerPadding * 2 - 8)
        return VStack(spacing: 8) {
            chordSlots
                .frame(height: slotHeight)
            staffView(height: staffHeight)
        }
        .padding(innerPadding)
        .frame(height: height)
    }

    private var chordSlots: some View {
        HStack(spacing: 8) {
            let chords = controller.currentPhrase?.chords ?? []
            let attempt = controller.attempt
            ForEach(Array(chords.enumerated()), id: \.element.id) { index, chord in
                let completed = attempt?.completedChordIds.contains(chord.id) ?? false
                let active = controller.activeChord?.id == chord.id
                ZStack {
                    Circle()
                        .stroke(completed ? Color.green : (active ? Color.cyan : Color.white.opacity(0.4)), lineWidth: 3)
                        .frame(width: 28, height: 28)
                    if completed {
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.green)
                    }
                }
                .overlay(alignment: .bottom) {
                    Text("\(index + 1)")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.7))
                        .offset(y: 14)
                }
            }
        }
    }

    private func staffView(height: CGFloat) -> some View {
        let chord = controller.activeChord
        let voicing = chord?.voicing ?? []
        let staves = chord?.voicingStaves ?? []
        let staffWidth = min(CGFloat(360), max(CGFloat(260), height * 1.85))
        return Group {
            if voicing.isEmpty {
                Text(locale == .ja ? "コード待機中…" : "Waiting for chord…")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
                    .frame(maxWidth: .infinity, minHeight: height)
            } else {
                ChordVoicingStaffView(
                    voicing: voicing,
                    voicingStaves: staves,
                    chordName: chord?.chordName ?? ""
                )
                .frame(width: staffWidth, height: height)
                .frame(maxWidth: .infinity, alignment: .center)
            }
        }
    }

    private func bottomPiano(height: CGFloat) -> some View {
        EarTrainingChordVoicingPianoView(controller: controller)
            .frame(height: height)
    }

    private var lobbyOverlay: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 12) {
                Text(controller.stage.localizedTitle(locale))
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.white)
                Text(controller.statusText)
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.85))
                HStack(spacing: 12) {
                    Button(action: { controller.startBattle() }) {
                        Text(controller.startButtonLabel)
                            .font(.headline)
                            .frame(maxWidth: 160)
                            .padding(.vertical, 12)
                            .background(Color.yellow, in: Capsule())
                            .foregroundStyle(.black)
                    }
                    Toggle(locale == .ja ? "練習" : "Practice", isOn: Binding(
                        get: { controller.practiceMode },
                        set: { controller.setPracticeMode($0) }
                    ))
                    .toggleStyle(.button)
                    .tint(.cyan)
                    .disabled(!controller.canChangePracticeMode)
                }
            }
            .padding(20)
            .background(Color.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            Spacer()
        }
    }
}

private struct EarTrainingChordVoicingPianoView: View {
    @ObservedObject var controller: EarTrainingChordVoicingBattleController

    private static let lowestMidi = 36
    private static let highestMidi = 84
    private static let whiteSemitones: Set<Int> = [0, 2, 4, 5, 7, 9, 11]

    var body: some View {
        GeometryReader { proxy in
            let whiteKeys = (Self.lowestMidi...Self.highestMidi).filter { Self.whiteSemitones.contains(midiToSemitone($0)) }
            let whiteWidth = proxy.size.width / CGFloat(max(1, whiteKeys.count))
            ZStack(alignment: .leading) {
                Color.black.opacity(0.0)
                ForEach(Array(whiteKeys.enumerated()), id: \.element) { index, midi in
                    let active = controller.midiHeldKeys.contains(midi)
                    Rectangle()
                        .fill(active ? Color.cyan.opacity(0.8) : Color.white)
                        .frame(width: whiteWidth - 1, height: proxy.size.height)
                        .overlay(Rectangle().stroke(Color.black.opacity(0.7), lineWidth: 1))
                        .position(x: CGFloat(index) * whiteWidth + whiteWidth / 2, y: proxy.size.height / 2)
                        .onTapGesture {
                            controller.handleNoteOn(midi: midi, velocity: 100)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                controller.handleNoteOff(midi: midi)
                            }
                        }
                }
                let blackKeys: [(midi: Int, x: CGFloat)] = computeBlackKeyPositions(whiteKeys: whiteKeys, whiteWidth: whiteWidth)
                ForEach(blackKeys, id: \.midi) { item in
                    let active = controller.midiHeldKeys.contains(item.midi)
                    Rectangle()
                        .fill(active ? Color.cyan : Color.black)
                        .frame(width: whiteWidth * 0.6, height: proxy.size.height * 0.6)
                        .position(x: item.x, y: proxy.size.height * 0.3)
                        .onTapGesture {
                            controller.handleNoteOn(midi: item.midi, velocity: 100)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                controller.handleNoteOff(midi: item.midi)
                            }
                        }
                }
            }
        }
        .background(Color.black.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func midiToSemitone(_ midi: Int) -> Int { ((midi % 12) + 12) % 12 }

    private func computeBlackKeyPositions(whiteKeys: [Int], whiteWidth: CGFloat) -> [(midi: Int, x: CGFloat)] {
        var result: [(midi: Int, x: CGFloat)] = []
        for (index, white) in whiteKeys.enumerated() {
            let nextWhite = white + 1
            let semitone = midiToSemitone(nextWhite)
            let isBlack = ![0, 5].contains(semitone) && !Self.whiteSemitones.contains(semitone)
            if isBlack && index < whiteKeys.count - 1 {
                result.append((midi: nextWhite, x: CGFloat(index + 1) * whiteWidth))
            }
        }
        return result
    }
}
