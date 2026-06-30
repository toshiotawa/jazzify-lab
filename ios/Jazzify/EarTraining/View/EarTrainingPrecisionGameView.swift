import SwiftUI

private let precisionScoreBandHeight: CGFloat = 128
private let precisionPianoHeight: CGFloat = 96
private let precisionTransportHeight: CGFloat = 72

struct EarTrainingPrecisionGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    let onClose: () -> Void

    @State private var controller: EarTrainingPrecisionBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingPrecisionGameContent(
                    controller: controller,
                    audio: audio,
                    locale: locale
                )
            } else if isLoading {
                ProgressView()
                    .tint(.yellow)
            } else {
                errorView
            }
        }
        .background(Color(hex: "020617"))
        .onAppear { OrientationManager.shared.lock(.portrait) }
        .task { await bootstrap() }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            midiSubscriptionHolder.cancel()
            controller?.tearDown()
        }
        .preferredColorScheme(.dark)
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Text(loadError ?? (locale == .ja ? "読み込みに失敗しました" : "Failed to load"))
                .foregroundStyle(.white)
            Button(action: onClose) {
                Text(locale == .ja ? "戻る" : "Back")
            }
        }
    }

    @MainActor
    private func bootstrap() async {
        guard controller == nil else { return }
        isLoading = true
        loadError = nil
        do {
            let stageDetail: EarTrainingStageDetail
            switch source {
            case .id(let stageId):
                stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            case .slug(let slug):
                stageDetail = try await SupabaseService.shared.fetchEarTrainingStageDetailBySlug(slug: slug)
            case .embedded(let embedded):
                stageDetail = embedded
            }
            let phrases = stageDetail.sortedPhrases()
            guard !phrases.isEmpty else {
                loadError = locale == .ja ? "フレーズが登録されていません" : "No phrases registered."
                isLoading = false
                return
            }
            let audioInstance = EarTrainingAudio()
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            let createdController = EarTrainingPrecisionBattleController(
                stage: stageDetail,
                phrases: phrases,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                audio: audioInstance,
                initialPracticeMode: initialPracticeMode,
                onExit: onClose
            )
            attachMidi(controller: createdController, audioInstance: audioInstance)
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }

    @MainActor
    private func attachMidi(
        controller createdController: EarTrainingPrecisionBattleController,
        audioInstance: EarTrainingAudio
    ) {
        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { [weak createdController] status, data1, data2 in
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
            DispatchQueue.main.async {
                guard let createdController else { return }
                if isNoteOn {
                    createdController.handleNoteOn(midi: note, velocity: velocity, playAudio: false)
                } else {
                    createdController.handleNoteOff(midi: note, playAudio: false)
                }
            }
        }
        audio = audioInstance
        controller = createdController
        isLoading = false
        createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
        createdController.start()
    }
}

// MARK: - Content

private struct EarTrainingPrecisionGameContent: View {
    @ObservedObject var controller: EarTrainingPrecisionBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale

    @State private var seekPreviewSec: Double = 0
    @State private var isSeekDragging = false

    var body: some View {
        VStack(spacing: 0) {
            header
            scoreBand
            ZStack {
                PrecisionNotesCanvasView(controller: controller, pianoHeight: precisionPianoHeight)
                    .overlay(alignment: .bottom) {
                        if !controller.activeLyricText.isEmpty {
                            Text(controller.activeLyricText)
                                .font(.system(size: 16))
                                .foregroundStyle(.white)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(Color(hex: "0f172a").opacity(0.45))
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .padding(.bottom, precisionPianoHeight + 24)
                                .padding(.horizontal, 16)
                        }
                    }
                EarTrainingResultView(host: controller)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            if controller.practiceMode {
                transportBar
            }
        }
        .sheet(isPresented: $controller.isSettingsOpen) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                scope: .battle,
                stageRunMode: controller.lessonContext.map { _ in
                    EarTrainingStageRunModeConfig(
                        practiceMode: controller.practiceMode,
                        onApplyPracticeModeAndRestart: { mode in
                            controller.applyPracticeModeAndRestart(mode)
                            controller.handleCloseSettings()
                        }
                    )
                },
                practiceTranspose: controller.stage.resolvedPracticeTranspose
                    ? EarTrainingPracticeTransposeConfig(
                        enabled: true,
                        practiceMode: controller.practiceMode,
                        originalKeyFifths: controller.practiceOriginalKeyFifths,
                        originalKeyName: controller.practiceOriginalKeyName,
                        appliedOffset: controller.practiceTransposeOffset
                    )
                    : nil,
                practiceSpeed: EarTrainingPracticeSpeedConfig(
                    practiceMode: controller.practiceMode,
                    appliedSpeedPercent: controller.practiceSpeedPercent,
                    onApplyAndRestart: { offset, speed in
                        controller.applyPracticePlaybackAndRestart(offset: offset, speedPercent: speed)
                    }
                ),
                osmdTimingAdjustment: EarTrainingOsmdTimingAdjustmentConfig(
                    appliedOffsetMs: controller.timingAdjustmentMs,
                    onChange: { controller.applyTimingAdjustmentMs($0) }
                ),
                onRestartFromBeginning: {
                    controller.handleCloseSettings()
                    controller.startBattle()
                },
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    private var header: some View {
        HStack {
            Button(action: { controller.handleBack() }) {
                Text(locale == .ja ? "戻る" : "Back")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            Spacer()
            VStack(spacing: 2) {
                Text(controller.stage.localizedTitle(locale))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                Text(controller.stage.battleClearConditionText(isEnglish: locale == .en))
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.55))
            }
            Spacer()
            Button(action: { controller.handleOpenSettings() }) {
                Text(locale == .ja ? "設定" : "Settings")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    @ViewBuilder
    private var scoreBand: some View {
        ZStack {
            if let musicXMLText = controller.musicXMLText {
                EarTrainingOSMDScoreWebView(
                    scoreScrollActive: controller.scoreScrollActive,
                    activeMeasureNumber: controller.activeMeasureNumber,
                    measureDurationSec: controller.effectiveMeasureDurationSec,
                    musicXMLText: musicXMLText,
                    renderKey: controller.phraseRunId,
                    zoom: 0.55
                )
            } else {
                Text(controller.scoreErrorText ?? (locale == .ja ? "譜面を読み込み中…" : "Loading score…"))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
        .frame(height: precisionScoreBandHeight)
    }

    private var transportBar: some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                transportIconButton(
                    systemName: "backward.end.fill",
                    accessibilityLabel: locale == .ja ? "1小節戻る" : "Previous measure"
                ) {
                    controller.seekByMeasure(delta: -1)
                }
                transportIconButton(
                    systemName: controller.gameState == .paused ? "play.fill" : "pause.fill",
                    accessibilityLabel: controller.gameState == .paused
                        ? (locale == .ja ? "再生" : "Play")
                        : (locale == .ja ? "一時停止" : "Pause")
                ) {
                    controller.togglePause()
                }
                .disabled(controller.gameState != .playingPhrase
                    && controller.gameState != .countIn
                    && controller.gameState != .paused)
                transportIconButton(
                    systemName: "forward.end.fill",
                    accessibilityLabel: locale == .ja ? "1小節進む" : "Next measure"
                ) {
                    controller.seekByMeasure(delta: 1)
                }
            }
            Slider(
                value: Binding(
                    get: {
                        isSeekDragging ? seekPreviewSec : controller.seekSliderSec
                    },
                    set: { newValue in
                        if !isSeekDragging {
                            isSeekDragging = true
                            seekPreviewSec = controller.seekSliderSec
                            controller.beginSeekInteraction()
                        }
                        seekPreviewSec = newValue
                        controller.updateSeekPreview(newValue)
                    }
                ),
                in: 0...max(1, controller.phraseDurationSec),
                onEditingChanged: { editing in
                    if editing {
                        if !isSeekDragging {
                            isSeekDragging = true
                            seekPreviewSec = controller.seekSliderSec
                            controller.beginSeekInteraction()
                        }
                    } else {
                        isSeekDragging = false
                        controller.endSeekInteraction(at: seekPreviewSec)
                    }
                }
            )
            .tint(.yellow)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(height: precisionTransportHeight)
        .background(Color(hex: "020617").opacity(0.95))
    }

    private func transportIconButton(
        systemName: String,
        accessibilityLabel: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 18))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(Color.white.opacity(0.12))
                .clipShape(Circle())
        }
        .accessibilityLabel(accessibilityLabel)
    }
}
