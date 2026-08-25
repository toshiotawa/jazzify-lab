import SwiftUI

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
    @State private var bootstrapProgress: Double = 0
    @State private var isBootstrapComplete = false
    @State private var showPreparingOverlay = true
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
            } else if loadError != nil {
                errorView
            } else {
                Color(hex: "020617")
            }

            if showPreparingOverlay && loadError == nil {
                EarTrainingPreparingOverlay(
                    message: locale == .ja ? "バトルを準備中…" : "Preparing battle…",
                    targetProgress: bootstrapProgress,
                    isWorkComplete: isBootstrapComplete,
                    background: Color(hex: "020617"),
                    onVisualComplete: { showPreparingOverlay = false }
                )
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
        loadError = nil
        isBootstrapComplete = false
        showPreparingOverlay = true
        bootstrapProgress = EarTrainingLoadProgress.started
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
            bootstrapProgress = EarTrainingLoadProgress.stageLoaded
            let phrases = stageDetail.sortedPhrases()
            guard !phrases.isEmpty else {
                loadError = locale == .ja ? "フレーズが登録されていません" : "No phrases registered."
                showPreparingOverlay = false
                return
            }
            let audioInstance = EarTrainingAudio()
            bootstrapProgress = EarTrainingLoadProgress.audioReady
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            bootstrapProgress = EarTrainingLoadProgress.controllerReady
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
            showPreparingOverlay = false
        }
    }

    @MainActor
    private func attachMidi(
        controller createdController: EarTrainingPrecisionBattleController,
        audioInstance: EarTrainingAudio
    ) {
        createdController.start()
        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = NoteInputManager.shared.subscribeWithHostTime { [weak createdController] status, data1, data2, hostTime in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            if isNoteOn {
                if !NoteInputManager.shared.isVoiceInputActive {
                    SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: note, velocity: velocity)
                }
            } else if isNoteOff {
                if !NoteInputManager.shared.isVoiceInputActive {
                    SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: note)
                }
            } else {
                return
            }
            DispatchQueue.main.async {
                guard let createdController else { return }
                if isNoteOn {
                    createdController.handleNoteOn(midi: note, velocity: velocity, playAudio: false, midiHostTime: hostTime)
                } else {
                    createdController.handleNoteOff(midi: note, playAudio: false)
                }
            }
        }
        audio = audioInstance
        controller = createdController
        bootstrapProgress = 1
        isBootstrapComplete = true
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
    @State private var scoreBandHeightPx: CGFloat? = EarTrainingPrecisionScorePreferences.savedLandscapeHeight()
    @State private var dragHeightPreview: CGFloat?
    @State private var dragStartBandHeight: CGFloat = 0
    @State private var cachedMusicXMLText: String?
    @State private var osmdMultiStaff = false
    @State private var timingAdjustmentLaunch: EarTrainingTimingAdjustmentReturnLaunch?
    @State private var keyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    @State private var openTransportDropdown: TransportDropdownKind?
    @State private var osmdRenderProgress: Double?
    @State private var isTransportOpen = false

    private static let scoreBandGripWidth: CGFloat = 44
    private static let scoreBandGripHeight: CGFloat = 28

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
        .onAppear {
            ScreenRotationApplier.shared.applyCurrentPreference()
            if let xml = controller.musicXMLText {
                cachedMusicXMLText = xml
                osmdMultiStaff = EarTrainingChordOsmdMusicXmlNormalizer
                    .detectMaxStaffLayersFromMusicXmlString(xml) >= 2
            }
        }
        .syncPianoKeyboardDisplayMode($keyboardDisplayMode)
        .onChange(of: keyboardDisplayMode) { _ in
            controller.refreshKeyboardDisplayRangeForPreferencesChange()
        }
        .onChange(of: controller.musicXMLText) { xml in
            if let xml {
                cachedMusicXMLText = xml
                osmdMultiStaff = EarTrainingChordOsmdMusicXmlNormalizer
                    .detectMaxStaffLayersFromMusicXmlString(xml) >= 2
            }
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

    private var precisionSettingsSheet: some View {
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
                controller.handleCloseSettings()
                timingAdjustmentLaunch = EarTrainingTimingAdjustmentReturnLaunch(
                    stageId: controller.stage.id,
                    lessonContext: controller.lessonContext,
                    initialPracticeMode: controller.practiceMode
                )
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

    private var isTransportVisible: Bool {
        controller.practiceMode && isTransportOpen
    }

    private func landscapeContent(size: CGSize) -> some View {
        let layout = resolvedLayout(viewportHeight: size.height)
        return ZStack {
            VStack(spacing: 0) {
                HStack(spacing: 0) {
                    Color.clear.frame(width: Self.landscapeLeadingInset())
                    controlRail
                    ZStack(alignment: .top) {
                        scoreBand(screenHeight: size.height, bandHeight: layout.scoreBandHeight)
                        if controller.showLobbyControls {
                            titleOverlay
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .frame(height: layout.scoreBandHeight)

                ZStack {
                    PrecisionNotesCanvasView(
                        controller: controller,
                        pianoHeight: layout.pianoHeight,
                        fallLeadSec: EarTrainingPrecisionLandscapeLayout.fallLeadSec
                    )

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
                                .padding(.bottom, layout.pianoHeight + 24)
                                .padding(.horizontal, 16)
                        }
                        .allowsHitTesting(false)
                    }
                }
                .overlay(alignment: .top) {
                    scoreBandHeightDragHandle(screenHeight: size.height)
                        .offset(y: -Self.scoreBandGripHeight / 2)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                if isTransportVisible {
                    transportBar()
                }
            }
            .padding(.trailing, Self.landscapeTrailingInset())

            if let dropdown = openTransportDropdown {
                Color.black.opacity(0.45)
                    .ignoresSafeArea()
                    .onTapGesture {
                        openTransportDropdown = nil
                    }

                transportDropdownPanel(for: dropdown, availableWidth: size.width)
            }

            EarTrainingResultView(host: controller)
                .zIndex(10)

            if controller.isSettingsOpen {
                Color.black.opacity(0.55)
                    .ignoresSafeArea()
                    .onTapGesture {
                        controller.handleCloseSettings()
                    }
                precisionSettingsSheet
                    .zIndex(20)
            }
        }
    }

    private var controlRail: some View {
        VStack(spacing: 8) {
            railButton(title: locale == .ja ? "戻る" : "Back") {
                controller.handleBack()
            }
            Spacer(minLength: 0)
            if controller.practiceMode {
                railButton(
                    title: locale == .ja ? "操作" : "Ctrl",
                    highlighted: isTransportOpen
                ) {
                    isTransportOpen.toggle()
                    if !isTransportOpen {
                        openTransportDropdown = nil
                    }
                }
            }
            railButton(title: locale == .ja ? "設定" : "Set.") {
                controller.handleOpenSettings()
            }
        }
        .padding(.vertical, 6)
        .frame(width: EarTrainingPrecisionLandscapeLayout.controlRailWidth)
        .background(Color.black.opacity(0.25))
    }

    private func railButton(
        title: String,
        highlighted: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.white.opacity(highlighted ? 0.28 : 0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 4)
    }

    private var titleOverlay: some View {
        VStack(spacing: 2) {
            Text(controller.stage.localizedTitle(locale))
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
            Text(controller.stage.battleClearConditionText(isEnglish: locale == .en))
                .font(.system(size: 10))
                .foregroundStyle(.white.opacity(0.55))
        }
        .padding(.top, 6)
        .allowsHitTesting(false)
    }

    private func resolvedLayout(viewportHeight: CGFloat) -> EarTrainingPrecisionLandscapeLayout.Resolved {
        let requested = dragHeightPreview
            ?? scoreBandHeightPx
            ?? EarTrainingPrecisionLandscapeLayout.defaultScoreBandHeight(
                viewportHeight: viewportHeight,
                transportOpen: isTransportVisible
            )
        return EarTrainingPrecisionLandscapeLayout.resolve(
            viewportHeight: viewportHeight,
            transportOpen: isTransportVisible,
            requestedScoreBandHeight: requested
        )
    }

    private static func landscapeLeadingInset() -> CGFloat {
        max(8, windowSafeAreaInsets().top)
    }

    private static func landscapeTrailingInset() -> CGFloat {
        min(max(8, windowSafeAreaInsets().bottom), 20)
    }

    private static func windowSafeAreaInsets() -> UIEdgeInsets {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first else {
            return UIEdgeInsets(top: 16, left: 0, bottom: 8, right: 0)
        }
        return window.safeAreaInsets
    }

    @ViewBuilder
    private func scoreBand(screenHeight: CGFloat, bandHeight: CGFloat) -> some View {
        let effectiveHeight = bandHeight
        let isPhone = UIDevice.current.userInterfaceIdiom == .phone
        let multiStaff = osmdMultiStaff
        let osmdZoom: Double = isPhone ? (multiStaff ? 0.48 : 0.72) : 0.85

        ZStack {
            if let musicXMLText = controller.musicXMLText ?? cachedMusicXMLText {
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
                        && (controller.gameState == .paused || controller.showLobbyControls),
                    onRenderProgress: { progress in
                        let clamped = EarTrainingLoadProgress.clamped(progress)
                        osmdRenderProgress = clamped
                        guard clamped >= 1 else { return }
                        Task { @MainActor in
                            try? await Task.sleep(nanoseconds: EarTrainingLoadProgress.scoreCompleteHoldNanoseconds)
                            if osmdRenderProgress ?? 0 >= 1 {
                                osmdRenderProgress = nil
                            }
                        }
                    }
                )
                if controller.musicXMLText == nil {
                    Color.black.opacity(0.35)
                        .allowsHitTesting(false)
                    EarTrainingScoreLoadingOverlay(
                        message: controller.scoreErrorText ?? (locale == .ja ? "譜面を読み込み中…" : "Loading score…"),
                        progress: controller.scoreErrorText == nil ? 0.2 : nil
                    )
                    .allowsHitTesting(false)
                } else if controller.osmdPlaybackPreparing {
                    Color.black.opacity(0.35)
                        .allowsHitTesting(false)
                    EarTrainingScoreLoadingOverlay(
                        message: locale == .ja ? "譜面を表示中…" : "Rendering score…",
                        progress: nil
                    )
                    .allowsHitTesting(false)
                } else if let osmdRenderProgress,
                          controller.gameState != .countIn,
                          controller.gameState != .playingPhrase {
                    Color.black.opacity(0.35)
                        .allowsHitTesting(false)
                    EarTrainingScoreLoadingOverlay(
                        message: locale == .ja ? "譜面を表示中…" : "Rendering score…",
                        progress: osmdRenderProgress
                    )
                    .allowsHitTesting(false)
                }
            } else {
                EarTrainingScoreLoadingOverlay(
                    message: controller.scoreErrorText ?? (locale == .ja ? "譜面を読み込み中…" : "Loading score…"),
                    progress: controller.scoreErrorText == nil ? 0.2 : nil
                )
            }
        }
        .frame(height: effectiveHeight)
        .clipped()
    }

    private func currentBandHeight(screenHeight: CGFloat) -> CGFloat {
        resolvedLayout(viewportHeight: screenHeight).scoreBandHeight
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
                        dragStartBandHeight = currentBandHeight(screenHeight: screenHeight)
                    }
                    let proposed = dragStartBandHeight + value.translation.height
                    dragHeightPreview = EarTrainingPrecisionScorePreferences.clampLandscapeHeight(
                        proposed,
                        viewportHeight: screenHeight,
                        transportOpen: isTransportVisible
                    )
                }
                .onEnded { value in
                    let proposed = dragStartBandHeight + value.translation.height
                    let clamped = EarTrainingPrecisionScorePreferences.clampLandscapeHeight(
                        proposed,
                        viewportHeight: screenHeight,
                        transportOpen: isTransportVisible
                    )
                    scoreBandHeightPx = clamped
                    EarTrainingPrecisionScorePreferences.saveLandscapeHeight(clamped)
                    dragHeightPreview = nil
                }
        )
        .accessibilityLabel(locale == .ja ? "譜面領域の高さを変更" : "Adjust score area height")
        .accessibilityAddTraits(.isButton)
    }

    private func transportBar() -> some View {
        HStack(spacing: 6) {
            VStack(alignment: .leading, spacing: 1) {
                Text(locale == .ja ? "周回 \(controller.loopCycleIndex + 1)" : "Loop \(controller.loopCycleIndex + 1)")
                Text(locale == .ja ? "キー \(controller.loopCurrentKeyName)" : "Key \(controller.loopCurrentKeyName)")
            }
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.75))
            .frame(minWidth: 56, alignment: .leading)

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
            .font(.caption2.bold())
            .foregroundStyle(.black)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(Color.yellow)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            transportIconButton(
                accessibilityLabel: locale == .ja ? "1秒戻る" : "Back 1 second"
            ) {
                controller.seekBySeconds(delta: -1)
            } icon: {
                EarTrainingPrecisionSeekBackwardIcon()
                    .fill(.white)
                    .frame(width: 16, height: 16)
            }
            transportIconButton(
                accessibilityLabel: controller.gameState == .paused
                    ? (locale == .ja ? "再生" : "Play")
                    : (locale == .ja ? "一時停止" : "Pause")
            ) {
                controller.togglePause()
            } icon: {
                Image(systemName: controller.gameState == .paused ? "play.fill" : "pause.fill")
                    .font(.system(size: 14))
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
                    .frame(width: 16, height: 16)
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
            .frame(minWidth: 80)
        }
        .padding(.horizontal, 8)
        .frame(maxWidth: .infinity)
        .frame(height: EarTrainingPrecisionLandscapeLayout.transportHeight)
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
    private func transportDropdownPanel(for kind: TransportDropdownKind, availableWidth: CGFloat) -> some View {
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
        .frame(maxWidth: min(320, max(200, availableWidth - 48)))
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
                .frame(width: 32, height: 32)
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
    private static let landscapeScoreBandHeightKey = "earTraining.precision.scoreBandHeightPx.landscape"

    static let minBandHeight: CGFloat = EarTrainingPrecisionLandscapeLayout.minScoreBandHeight

    static func clampLandscapeHeight(
        _ height: CGFloat,
        viewportHeight: CGFloat,
        transportOpen: Bool
    ) -> CGFloat {
        EarTrainingPrecisionLandscapeLayout.resolve(
            viewportHeight: viewportHeight,
            transportOpen: transportOpen,
            requestedScoreBandHeight: height
        ).scoreBandHeight
    }

    static func savedLandscapeHeight() -> CGFloat? {
        guard let saved = UserDefaults.standard.object(forKey: landscapeScoreBandHeightKey) as? Double else {
            return nil
        }
        return CGFloat(saved)
    }

    static func saveLandscapeHeight(_ height: CGFloat) {
        UserDefaults.standard.set(Double(height), forKey: landscapeScoreBandHeightKey)
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
