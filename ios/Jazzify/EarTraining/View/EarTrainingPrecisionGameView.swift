import SwiftUI

private let precisionPianoHeight: CGFloat = 96
private let precisionTransportHeight: CGFloat = 120

struct EarTrainingPrecisionGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    var isAdmin: Bool = false
    let onClose: () -> Void

    @EnvironmentObject private var appState: AppState

    @State private var controller: EarTrainingPrecisionBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()
    @State private var assignmentStartRecorded = false

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
                isAdmin: isAdmin,
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
        createdController.start()
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
        recordAssignmentStartIfNeeded()
    }

    private func recordAssignmentStartIfNeeded() {
        guard !assignmentStartRecorded,
              let lessonContext,
              let userId = appState.profile?.id else {
            return
        }
        assignmentStartRecorded = true
        AnalyticsTracker.trackAssignmentStart(
            userId: userId,
            lessonId: lessonContext.lessonId,
            lessonSongId: lessonContext.lessonSongId,
            isPractice: initialPracticeMode
        )
    }
}

// MARK: - Content

private struct EarTrainingPrecisionGameContent: View {
    @ObservedObject var controller: EarTrainingPrecisionBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale

    @State private var seekPreviewSec: Double = 0
    @State private var isSeekDragging = false
    @State private var scoreBandHeightPx: CGFloat = EarTrainingPrecisionScorePreferences.initialHeight()
    @State private var dragHeightPreview: CGFloat?
    @State private var dragStartBandHeight: CGFloat = 0
    @State private var timingAdjustmentLaunch: EarTrainingTimingAdjustmentReturnLaunch?
    @State private var pendingTimingLaunch: EarTrainingTimingAdjustmentReturnLaunch?
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var openTransportDropdown: TransportDropdownKind?

    private static let scoreBandGripWidth: CGFloat = 44
    private static let scoreBandGripHeight: CGFloat = 28

    var body: some View {
        ZStack {
            GeometryReader { proxy in
                let screenHeight = proxy.size.height
                VStack(spacing: 0) {
                    header
                    scoreBand(screenHeight: screenHeight)
                    ZStack {
                        PrecisionNotesCanvasView(controller: controller, pianoHeight: precisionPianoHeight)

                        if !controller.showLobbyControls && !controller.activeLyricText.isEmpty {
                            VStack {
                                Spacer()
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
                            .allowsHitTesting(false)
                        }

                        EarTrainingResultView(host: controller)
                            .zIndex(10)
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

            if let dropdown = openTransportDropdown {
                Color.black.opacity(0.45)
                    .ignoresSafeArea()
                    .onTapGesture {
                        openTransportDropdown = nil
                    }

                transportDropdownPanel(for: dropdown)
            }
        }
        .onAppear {
            ScreenRotationApplier.shared.applyCurrentPreference()
        }
        .syncPianoKeyboardDisplayMode($keyboardDisplayMode)
        .onChange(of: keyboardDisplayMode) { _ in
            controller.refreshKeyboardDisplayRangeForPreferencesChange()
        }
        .onChange(of: controller.musicXMLText) { xml in
            guard let xml else { return }
            guard !EarTrainingPrecisionScorePreferences.hasSavedHeight else { return }
            let multiStaff = EarTrainingChordOsmdMusicXmlNormalizer
                .detectMaxStaffLayersFromMusicXmlString(xml) >= 2
            scoreBandHeightPx = EarTrainingPrecisionScorePreferences.preferredHeight(multiStaff: multiStaff)
        }
        .onChange(of: scoreBandHeightPx) { newValue in
            EarTrainingPrecisionScorePreferences.saveHeight(newValue)
        }
        .sheet(isPresented: $controller.isSettingsOpen, onDismiss: handleSettingsSheetDismissed) {
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
                practiceSpeed: EarTrainingPracticeSpeedConfig(
                    practiceMode: controller.practiceMode,
                    appliedSpeedPercent: controller.practiceSpeedPercent,
                    onApplyAndRestart: { _, speed in
                        controller.applyPracticePlaybackAndRestart(speedPercent: speed)
                    }
                ),
                osmdTimingAdjustment: EarTrainingOsmdTimingAdjustmentConfig(
                    appliedOffsetMs: controller.timingAdjustmentMs,
                    onChange: { controller.applyTimingAdjustmentMs($0) }
                ),
                onLaunchTimingAdjustment: {
                    controller.suspendForOverlay()
                    pendingTimingLaunch = EarTrainingTimingAdjustmentReturnLaunch(
                        stageId: controller.stage.id,
                        lessonContext: controller.lessonContext,
                        initialPracticeMode: controller.practiceMode
                    )
                    controller.handleCloseSettings()
                },
                precisionAutoPlay: controller.isAdmin
                    ? EarTrainingPrecisionAutoPlayConfig(
                        enabled: controller.precisionAutoPlayEnabled,
                        onChange: { controller.applyPrecisionAutoPlayEnabled($0) }
                    )
                    : nil,
                onRestartFromBeginning: {
                    controller.handleCloseSettings()
                    controller.startBattle()
                },
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
        // 子の onDisappear → tearDown → SurvivalGameAudio.stop() の後に再開する。
        // onClose 内で start すると dismiss 後の tearDown に潰されてピアノが無音になる。
        .fullScreenCover(item: $timingAdjustmentLaunch, onDismiss: {
            audio.start()
            controller.startBattle()
        }) { launch in
            EarTrainingTimingAdjustmentView(
                entry: .settings,
                locale: locale,
                returnStageId: launch.stageId,
                returnLessonContext: launch.lessonContext,
                returnPracticeMode: launch.initialPracticeMode,
                onClose: {
                    timingAdjustmentLaunch = nil
                }
            )
        }
    }

    private func handleSettingsSheetDismissed() {
        guard let pending = pendingTimingLaunch else { return }
        pendingTimingLaunch = nil
        timingAdjustmentLaunch = pending
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
        let osmdZoom: Double = isPhone ? (multiStaff ? 0.48 : 0.72) : 0.85

        ZStack {
            if let musicXMLText = controller.musicXMLText {
                EarTrainingOSMDScoreWebView(
                    scoreScrollActive: controller.scoreScrollActive,
                    activeMeasureNumber: controller.activeMeasureNumber,
                    measureDurationSec: controller.effectiveMeasureDurationSec,
                    musicXMLText: musicXMLText,
                    scoreXmlBySemitone: controller.loopScoreXmlBySemitone,
                    activeSemitone: controller.loopActiveSemitone,
                    loopTransposeDirection: controller.loopTransposeDirection,
                    loopBaseSemitone: controller.loopBaseSemitone,
                    loopCycleIndex: controller.loopCycleIndex,
                    drawMeasureNumbers: controller.practiceMode,
                    renderKey: controller.phraseRunId,
                    playheadController: controller,
                    zoom: osmdZoom,
                    scrollLayout: .precision,
                    countInDurationSec: controller.countInDurationSec,
                    maxOsmdMeasure: controller.maxOsmdMeasureForScroll,
                    manualScrollEnabled: controller.practiceMode
                        && (controller.gameState == .paused || controller.showLobbyControls)
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
        return EarTrainingPrecisionScorePreferences.clampHeight(
            scoreBandHeightPx,
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
                        dragStartBandHeight = EarTrainingPrecisionScorePreferences.clampHeight(
                            scoreBandHeightPx,
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
                    scoreBandHeightPx = EarTrainingPrecisionScorePreferences.clampHeight(
                        proposed,
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
            HStack {
                Text(locale == .ja ? "周回 \(controller.loopCycleIndex + 1)" : "Loop \(controller.loopCycleIndex + 1)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
                Spacer()
                Text(locale == .ja ? "キー \(controller.loopCurrentKeyName)" : "Key \(controller.loopCurrentKeyName)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
            }

            HStack(spacing: 6) {
                transportDropdownTrigger(
                    label: locale == .ja ? "開始" : "A",
                    value: "\(controller.loopStartMeasure)",
                    kind: .loopStart
                )
                transportDropdownTrigger(
                    label: locale == .ja ? "終了" : "B",
                    value: "\(controller.loopEndMeasure)",
                    kind: .loopEnd
                )
                transportDropdownTrigger(
                    label: locale == .ja ? "キー" : "Key",
                    value: controller.loopBaseKeyOptions.first(where: { $0.offset == controller.loopBaseSemitone })?.label
                        ?? controller.loopCurrentKeyName,
                    kind: .key
                )
                transportDropdownTrigger(
                    label: locale == .ja ? "移調" : "Tr.",
                    value: loopTransposeDirectionLabel(controller.loopTransposeDirection),
                    kind: .transpose
                )
                Button(locale == .ja ? "再設定" : "Apply") {
                    openTransportDropdown = nil
                    controller.applyLoopRangeAndRestart()
                }
                .font(.caption.bold())
                .foregroundStyle(.black)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(Color.yellow)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }

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
                in: 0...max(1, controller.loopWindowDurationSec),
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

    private func loopTransposeDirectionLabel(_ direction: EarTrainingLoopTransposeDirection) -> String {
        switch direction {
        case .down:
            return locale == .ja ? "半音下降" : "Down"
        case .up:
            return locale == .ja ? "半音上昇" : "Up"
        case .fourthUp:
            return locale == .ja ? "完全4度上昇" : "P4 up"
        case .none:
            return locale == .ja ? "移調なし" : "None"
        }
    }

    private func transportDropdownTrigger(label: String, value: String, kind: TransportDropdownKind) -> some View {
        Button {
            openTransportDropdown = openTransportDropdown == kind ? nil : kind
        } label: {
            HStack(spacing: 3) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.7))
                Text(value)
                    .font(.caption)
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Image(systemName: "chevron.down")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.55))
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 6)
            .frame(minHeight: 28)
            .background(Color.white.opacity(openTransportDropdown == kind ? 0.2 : 0.12))
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func transportDropdownPanel(for kind: TransportDropdownKind) -> some View {
        VStack(spacing: 0) {
            Text(transportDropdownTitle(for: kind))
                .font(.caption.bold())
                .foregroundStyle(.white.opacity(0.85))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)

            Divider()
                .overlay(Color.white.opacity(0.15))

            ScrollView {
                VStack(spacing: 0) {
                    switch kind {
                    case .loopStart:
                        ForEach(1...controller.maxLoopMeasure, id: \.self) { measure in
                            transportDropdownRow(
                                title: locale == .ja ? "小節 \(measure)" : "M\(measure)",
                                selected: controller.loopStartMeasure == measure
                            ) {
                                controller.loopStartMeasure = measure
                                if controller.loopEndMeasure < measure {
                                    controller.loopEndMeasure = measure
                                }
                                openTransportDropdown = nil
                            }
                        }
                    case .loopEnd:
                        ForEach(1...controller.maxLoopMeasure, id: \.self) { measure in
                            transportDropdownRow(
                                title: locale == .ja ? "小節 \(measure)" : "M\(measure)",
                                selected: controller.loopEndMeasure == measure
                            ) {
                                controller.loopEndMeasure = measure
                                if controller.loopStartMeasure > measure {
                                    controller.loopStartMeasure = measure
                                }
                                openTransportDropdown = nil
                            }
                        }
                    case .key:
                        ForEach(controller.loopBaseKeyOptions, id: \.offset) { option in
                            transportDropdownRow(
                                title: option.label,
                                selected: controller.loopBaseSemitone == option.offset
                            ) {
                                controller.loopBaseSemitone = EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(option.offset)
                                openTransportDropdown = nil
                            }
                        }
                    case .transpose:
                        transportDropdownRow(
                            title: locale == .ja ? "半音下降" : "Half-step down",
                            selected: controller.loopTransposeDirection == .down
                        ) {
                            controller.loopTransposeDirection = .down
                            openTransportDropdown = nil
                        }
                        transportDropdownRow(
                            title: locale == .ja ? "半音上昇" : "Half-step up",
                            selected: controller.loopTransposeDirection == .up
                        ) {
                            controller.loopTransposeDirection = .up
                            openTransportDropdown = nil
                        }
                        transportDropdownRow(
                            title: locale == .ja ? "完全4度上昇" : "Perfect 4th up",
                            selected: controller.loopTransposeDirection == .fourthUp
                        ) {
                            controller.loopTransposeDirection = .fourthUp
                            openTransportDropdown = nil
                        }
                        transportDropdownRow(
                            title: locale == .ja ? "移調なし" : "No transpose",
                            selected: controller.loopTransposeDirection == .none
                        ) {
                            controller.loopTransposeDirection = .none
                            openTransportDropdown = nil
                        }
                    }
                }
            }
            .frame(maxHeight: 220)
        }
        .frame(maxWidth: min(320, UIScreen.main.bounds.width - 48))
        .background(Color(hex: "0f172a"))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.35), radius: 12, x: 0, y: 4)
    }

    private func transportDropdownTitle(for kind: TransportDropdownKind) -> String {
        switch kind {
        case .loopStart:
            return locale == .ja ? "開始小節" : "Loop start"
        case .loopEnd:
            return locale == .ja ? "終了小節" : "Loop end"
        case .key:
            return locale == .ja ? "キー" : "Key"
        case .transpose:
            return locale == .ja ? "移調" : "Transpose"
        }
    }

    private func transportDropdownRow(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Spacer()
                if selected {
                    Image(systemName: "checkmark")
                        .font(.caption.bold())
                        .foregroundStyle(.yellow)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(selected ? Color.white.opacity(0.08) : Color.clear)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
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

// MARK: - Transport dropdown

private enum TransportDropdownKind: Equatable {
    case loopStart
    case loopEnd
    case key
    case transpose
}

// MARK: - Precision score preferences

enum EarTrainingPrecisionScorePreferences {
    private static let scoreBandHeightKey = "earTraining.precision.scoreBandHeightPx"
    private static let scoreBandHeightStepKey = "earTraining.precision.scoreBandHeightStep"
    private static let scoreBandHeightTable: [CGFloat] = [96, 112, 128, 144, 160, 192, 208]

    static let minBandHeight: CGFloat = 96

    static func clampHeight(_ height: CGFloat, screenHeight: CGFloat) -> CGFloat {
        min(max(height, minBandHeight), max(minBandHeight, screenHeight - 60))
    }

    static var hasSavedHeight: Bool {
        UserDefaults.standard.object(forKey: scoreBandHeightKey) != nil
            || UserDefaults.standard.object(forKey: scoreBandHeightStepKey) != nil
    }

    static func loadSavedHeight() -> CGFloat {
        if let saved = UserDefaults.standard.object(forKey: scoreBandHeightKey) as? Double {
            return CGFloat(saved)
        }
        if UserDefaults.standard.object(forKey: scoreBandHeightStepKey) != nil {
            let step = UserDefaults.standard.integer(forKey: scoreBandHeightStepKey)
            let index = min(max(step + 2, 0), scoreBandHeightTable.count - 1)
            return scoreBandHeightTable[index]
        }
        return preferredHeight(multiStaff: false)
    }

    static func preferredHeight(multiStaff: Bool) -> CGFloat {
        multiStaff ? 208 : 144
    }

    static func initialHeight() -> CGFloat {
        hasSavedHeight ? loadSavedHeight() : preferredHeight(multiStaff: false)
    }

    static func saveHeight(_ height: CGFloat) {
        UserDefaults.standard.set(Double(height), forKey: scoreBandHeightKey)
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
