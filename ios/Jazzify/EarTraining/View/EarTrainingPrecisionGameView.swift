import SwiftUI

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
    @State private var scoreBandHeightStep: Int = EarTrainingPrecisionScorePreferences.initialHeightStep()
    @State private var dragHeightPreview: CGFloat?
    @State private var dragStartBandHeight: CGFloat = 0

    private static let scoreBandGripWidth: CGFloat = 44
    private static let scoreBandGripHeight: CGFloat = 28

    private var precisionScrollLayout: EarTrainingOsmdScrollLayout {
        controller.osmdScrollMode == .continuousFollow ? .precisionFollow : .precision
    }

    var body: some View {
        GeometryReader { proxy in
            let screenHeight = proxy.size.height
            VStack(spacing: 0) {
                header
                scoreBand(screenHeight: screenHeight)
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
                .overlay(alignment: .top) {
                    scoreBandHeightDragHandle(screenHeight: screenHeight)
                        .offset(y: -Self.scoreBandGripHeight / 2)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                if controller.practiceMode {
                    transportBar
                }
            }
        }
        .onChange(of: controller.musicXMLText) { xml in
            guard let xml else { return }
            guard !EarTrainingPrecisionScorePreferences.hasSavedHeightStep else { return }
            let multiStaff = EarTrainingChordOsmdMusicXmlNormalizer
                .detectMaxStaffLayersFromMusicXmlString(xml) >= 2
            scoreBandHeightStep = EarTrainingPrecisionScorePreferences.preferredHeightStep(multiStaff: multiStaff)
        }
        .onChange(of: scoreBandHeightStep) { newValue in
            EarTrainingPrecisionScorePreferences.saveScoreBandHeightStep(newValue)
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
                osmdScrollMode: EarTrainingOsmdScrollModeConfig(
                    appliedMode: controller.osmdScrollMode,
                    onChange: { controller.applyOsmdScrollMode($0) }
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
    private func scoreBand(screenHeight: CGFloat) -> some View {
        let effectiveHeight = currentBandHeight(screenHeight: screenHeight)
        let isPhone = UIDevice.current.userInterfaceIdiom == .phone
        let maxStaffFromXml = controller.musicXMLText.map {
            EarTrainingChordOsmdMusicXmlNormalizer.detectMaxStaffLayersFromMusicXmlString($0)
        } ?? 1
        let multiStaff = maxStaffFromXml >= 2
        let osmdZoom: Double = isPhone ? (multiStaff ? 0.4 : 0.6) : 0.85

        ZStack {
            if let musicXMLText = controller.musicXMLText {
                EarTrainingOSMDScoreWebView(
                    scoreScrollActive: controller.scoreScrollActive,
                    activeMeasureNumber: controller.activeMeasureNumber,
                    measureDurationSec: controller.effectiveMeasureDurationSec,
                    musicXMLText: musicXMLText,
                    renderKey: controller.phraseRunId,
                    playheadController: controller,
                    zoom: osmdZoom,
                    scrollLayout: precisionScrollLayout,
                    scrollMode: controller.osmdScrollMode,
                    countInDurationSec: controller.countInDurationSec,
                    maxOsmdMeasure: controller.maxOsmdMeasureForScroll
                )
            } else {
                Text(controller.scoreErrorText ?? (locale == .ja ? "譜面を読み込み中…" : "Loading score…"))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
        .frame(height: effectiveHeight)
        .clipped()
    }

    private func currentBandHeight(screenHeight: CGFloat) -> CGFloat {
        if let preview = dragHeightPreview {
            return preview
        }
        return EarTrainingPrecisionScorePreferences.heightForStep(
            scoreBandHeightStep,
            screenHeight: screenHeight
        )
    }

    @ViewBuilder
    private func scoreBandHeightDragHandle(screenHeight: CGFloat) -> some View {
        Image(systemName: "line.3.horizontal")
            .symbolRenderingMode(.monochrome)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(.white.opacity(0.85))
            .frame(width: Self.scoreBandGripWidth, height: Self.scoreBandGripHeight)
            .background(Color.white.opacity(0.18))
            .clipShape(Capsule(style: .continuous))
            .overlay(
                Capsule(style: .continuous)
                    .stroke(Color.white.opacity(0.22), lineWidth: 1)
            )
            .contentShape(Capsule(style: .continuous))
            .gesture(
            DragGesture(minimumDistance: 2)
                .onChanged { value in
                    if dragHeightPreview == nil {
                        dragStartBandHeight = EarTrainingPrecisionScorePreferences.heightForStep(
                            scoreBandHeightStep,
                            screenHeight: screenHeight
                        )
                    }
                    let proposed = dragStartBandHeight + value.translation.height
                    dragHeightPreview = EarTrainingPrecisionScorePreferences.clampHeight(
                        proposed,
                        screenHeight: screenHeight
                    )
                }
                .onEnded { value in
                    let proposed = dragStartBandHeight + value.translation.height
                    let clamped = EarTrainingPrecisionScorePreferences.clampHeight(
                        proposed,
                        screenHeight: screenHeight
                    )
                    scoreBandHeightStep = EarTrainingPrecisionScorePreferences.nearestStep(
                        forHeight: clamped,
                        screenHeight: screenHeight
                    )
                    dragHeightPreview = nil
                }
        )
        .accessibilityLabel(locale == .ja ? "譜面領域の高さを変更" : "Adjust score area height")
        .accessibilityAddTraits(.isButton)
    }

    private var transportBar: some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                transportIconButton(
                    accessibilityLabel: locale == .ja ? "1秒戻る" : "Back 1 second"
                ) {
                    controller.seekBySeconds(delta: -1)
                } icon: {
                    EarTrainingPrecisionSeekBackwardIcon()
                        .fill(.white)
                        .frame(width: 20, height: 20)
                }
                transportIconButton(
                    accessibilityLabel: controller.gameState == .paused
                        ? (locale == .ja ? "再生" : "Play")
                        : (locale == .ja ? "一時停止" : "Pause")
                ) {
                    controller.togglePause()
                } icon: {
                    Image(systemName: controller.gameState == .paused ? "play.fill" : "pause.fill")
                        .font(.system(size: 18))
                }
                .disabled(controller.gameState != .playingPhrase
                    && controller.gameState != .countIn
                    && controller.gameState != .paused)
                transportIconButton(
                    accessibilityLabel: locale == .ja ? "1秒進む" : "Forward 1 second"
                ) {
                    controller.seekBySeconds(delta: 1)
                } icon: {
                    EarTrainingPrecisionSeekForwardIcon()
                        .fill(.white)
                        .frame(width: 20, height: 20)
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

    private func transportIconButton<Icon: View>(
        accessibilityLabel: String,
        action: @escaping () -> Void,
        @ViewBuilder icon: () -> Icon
    ) -> some View {
        Button(action: action) {
            icon()
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(Color.white.opacity(0.12))
                .clipShape(Circle())
        }
        .accessibilityLabel(accessibilityLabel)
    }
}

// MARK: - Precision score preferences

enum EarTrainingPrecisionScrollPreferences {
    private static let scrollModeKey = "earTraining.precision.osmdScrollMode"

    static func loadScrollMode() -> EarTrainingOsmdScrollMode {
        guard let raw = UserDefaults.standard.string(forKey: scrollModeKey),
              let mode = EarTrainingOsmdScrollMode(rawValue: raw) else {
            return .measureJump
        }
        return mode
    }

    static func saveScrollMode(_ mode: EarTrainingOsmdScrollMode) {
        UserDefaults.standard.set(mode.rawValue, forKey: scrollModeKey)
    }
}

enum EarTrainingPrecisionScorePreferences {
    private static let scoreBandHeightStepKey = "earTraining.precision.scoreBandHeightStep"

    static let minHeightStep = -2
    static let maxHeightStep = 2
    static let scoreBandHeightTable: [CGFloat] = [96, 112, 128, 160, 192]
    static let singleStaffDefaultHeightStep = 0
    static let multiStaffDefaultHeightStep = 2

    static var hasSavedHeightStep: Bool {
        UserDefaults.standard.object(forKey: scoreBandHeightStepKey) != nil
    }

    static func initialHeightStep() -> Int {
        if hasSavedHeightStep {
            return loadSavedHeightStep()
        }
        return preferredHeightStep(multiStaff: false)
    }

    static func preferredHeightStep(multiStaff: Bool) -> Int {
        multiStaff ? multiStaffDefaultHeightStep : singleStaffDefaultHeightStep
    }

    static func clampHeightStep(_ value: Int) -> Int {
        Swift.min(maxHeightStep, Swift.max(minHeightStep, value))
    }

    static func loadSavedHeightStep() -> Int {
        clampHeightStep(UserDefaults.standard.integer(forKey: scoreBandHeightStepKey))
    }

    static func loadScoreBandHeightStep(multiStaff: Bool) -> Int {
        if hasSavedHeightStep {
            return loadSavedHeightStep()
        }
        return preferredHeightStep(multiStaff: multiStaff)
    }

    static func saveScoreBandHeightStep(_ value: Int) {
        UserDefaults.standard.set(clampHeightStep(value), forKey: scoreBandHeightStepKey)
    }

    static func maxBandHeight(screenHeight: CGFloat) -> CGFloat {
        Swift.min(scoreBandHeightTable[scoreBandHeightTable.count - 1], screenHeight * 0.38)
    }

    static func heightForStep(_ step: Int, screenHeight: CGFloat) -> CGFloat {
        let index = min(max(step + 2, 0), scoreBandHeightTable.count - 1)
        return Swift.min(scoreBandHeightTable[index], maxBandHeight(screenHeight: screenHeight))
    }

    static func clampHeight(_ height: CGFloat, screenHeight: CGFloat) -> CGFloat {
        let minHeight = scoreBandHeightTable[0]
        let maxHeight = maxBandHeight(screenHeight: screenHeight)
        return Swift.min(maxHeight, Swift.max(minHeight, height))
    }

    static func nearestStep(forHeight height: CGFloat, screenHeight: CGFloat) -> Int {
        let clamped = clampHeight(height, screenHeight: screenHeight)
        var bestStep = singleStaffDefaultHeightStep
        var bestDistance = CGFloat.greatestFiniteMagnitude
        for step in minHeightStep...maxHeightStep {
            let candidate = heightForStep(step, screenHeight: screenHeight)
            let distance = abs(candidate - clamped)
            if distance < bestDistance {
                bestDistance = distance
                bestStep = step
            }
        }
        return bestStep
    }
}

// Web EarTrainingPrecisionScreen transport icons (viewBox 0 0 24 24).
private struct EarTrainingPrecisionSeekBackwardIcon: Shape {
    func path(in rect: CGRect) -> Path {
        let sx = rect.width / 24
        let sy = rect.height / 24
        var path = Path()
        path.addRect(CGRect(x: 6 * sx, y: 6 * sy, width: 2 * sx, height: 12 * sy))
        path.move(to: CGPoint(x: 9.5 * sx, y: 12 * sy))
        path.addLine(to: CGPoint(x: 18 * sx, y: 18 * sy))
        path.addLine(to: CGPoint(x: 18 * sx, y: 6 * sy))
        path.closeSubpath()
        return path
    }
}

private struct EarTrainingPrecisionSeekForwardIcon: Shape {
    func path(in rect: CGRect) -> Path {
        let sx = rect.width / 24
        let sy = rect.height / 24
        var path = Path()
        path.addRect(CGRect(x: 16 * sx, y: 6 * sy, width: 2 * sx, height: 12 * sy))
        path.move(to: CGPoint(x: 6 * sx, y: 18 * sy))
        path.addLine(to: CGPoint(x: 14.5 * sx, y: 12 * sy))
        path.addLine(to: CGPoint(x: 6 * sx, y: 6 * sy))
        path.closeSubpath()
        return path
    }
}
