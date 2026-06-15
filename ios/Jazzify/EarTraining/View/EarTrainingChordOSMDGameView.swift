import SwiftUI
import SpriteKit
import UIKit
import WebKit
import QuartzCore
import os.log

/// OSMD リズム判定バトル（`mode == chord_osmd`）ネイティブ画面。
struct EarTrainingChordOSMDGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
    var initialPracticeMode: Bool = false
    var tutorialHooks: EarTrainingTutorialSceneHooks?
    var hostedLandscapeSize: CGSize?
    var prewarmOsmdPack: EarTrainingTutorialPrewarmedOsmdPack?
    let onClose: () -> Void

    @State private var controller: EarTrainingChordOSMDBattleController?
    @State private var audio: EarTrainingAudio?
    @State private var loadError: String?
    @State private var isLoading: Bool = true
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()

    var body: some View {
        ZStack {
            if let controller, let audio {
                EarTrainingChordOSMDContent(
                    controller: controller,
                    audio: audio,
                    locale: locale,
                    fixedLandscapeSize: hostedLandscapeSize
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
            midiSubscriptionHolder.cancel()
            controller?.tearDown()
        }
        .preferredColorScheme(.dark)
    }

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView().tint(.yellow)
            Text(locale == .ja ? "OSMDバトルを準備中…" : "Preparing OSMD battle…")
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
        if let pack = prewarmOsmdPack {
            isLoading = true
            loadError = nil
            attachMidiFinishOsmdBootstrap(createdController: pack.controller, audioInstance: pack.audio)
            return
        }
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
                loadError = locale == .ja
                    ? "フレーズが登録されていません"
                    : "No phrases are registered for this stage."
                isLoading = false
                return
            }
            guard phrases.contains(where: { $0.musicXmlUrl != nil }) else {
                loadError = locale == .ja
                    ? "OSMD表示用のMusicXMLが登録されていません"
                    : "No MusicXML is registered for OSMD display."
                isLoading = false
                return
            }

            let audioInstance = EarTrainingAudio()
            if let first = phrases.first, let url = URL(string: first.audioUrl) {
                audioInstance.preloadPhrase(url: url)
            }
            let createdController = EarTrainingChordOSMDBattleController(
                stage: stageDetail,
                phrases: phrases,
                lessonContext: lessonContext,
                isEnglishCopy: locale == .en,
                enemyId: stageDetail.id.uuidString,
                enemyName: stageDetail.localizedTitle(locale),
                audio: audioInstance,
                initialPracticeMode: initialPracticeMode,
                onExit: onClose
            )
            if let tutorialHooks {
                createdController.tutorialNoCombat = tutorialHooks.noCombat
                createdController.tutorialHooks = tutorialHooks
            }

            attachMidiFinishOsmdBootstrap(createdController: createdController, audioInstance: audioInstance)
        } catch {
            loadError = error.localizedDescription
            isLoading = false
        }
    }

    @MainActor
    private func attachMidiFinishOsmdBootstrap(
        createdController: EarTrainingChordOSMDBattleController,
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
        self.audio = audioInstance
        self.controller = createdController
        self.isLoading = false
        if createdController.gameState == .idle {
            createdController.start()
        }
        createdController.isMidiConnected = MIDIManager.shared.selectedDeviceID != nil
    }
}

private struct EarTrainingChordOSMDContent: View {
    @ObservedObject var controller: EarTrainingChordOSMDBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale
    let fixedLandscapeSize: CGSize?

    /// OSMD 譜面コンテナの拡縮ステップ（-2 ... +2、`containerScaleTable` のインデックスは step + 2）。
    @State private var scoreSizeStep: Int = 1

    @State private var hudHorizontalPadding: CGFloat = 16

    /// 譜面コンテナに対する相対スケール（コンテナサイズ と GPU レイヤでの表示を両方変更）。
    private static let containerScaleTable: [Double] = [0.80, 0.90, 1.00, 1.15, 1.30]

    var body: some View {
        Group {
            if let fixed = fixedLandscapeSize {
                landscapeContent(size: fixed)
                    .frame(width: fixed.width, height: fixed.height)
                    .clipped()
            } else {
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
            }
        }
        .ignoresSafeArea()
        .onAppear {
            hudHorizontalPadding = Self.resolveHudHorizontalPadding()
        }
        .sheet(isPresented: $controller.isSettingsOpen) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
                stageRunMode: controller.lessonContext.map { _ in
                    EarTrainingStageRunModeConfig(
                        practiceMode: controller.practiceMode,
                        onApplyPracticeModeAndRestart: { mode in
                            controller.applyPracticeModeAndRestart(mode)
                            controller.handleCloseSettings()
                        }
                    )
                },
                onDismiss: { controller.handleCloseSettings() },
                onExit: { controller.handleBack() }
            )
        }
    }

    private func landscapeContent(size: CGSize) -> some View {
        ZStack {
            feedbackBackground

            EarTrainingChordOSMDSceneContainer(driver: controller, sceneSize: size)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                EarTrainingHUDView(
                    hud: controller.hudModel,
                    horizontalPadding: hudHorizontalPadding,
                    showsSlotsRow: true,
                    rightControlIconPointSize: 17,
                    rightControlCapsuleSize: 36,
                    rightControlHitSize: 52,
                    healthRowTrailingReserve: 118,
                    onSettings: { controller.handleOpenSettings() },
                    onBack: { controller.handleBack() }
                )
                Spacer()
            }

            scoreOverlay(size: size)

            scoreZoomTrailingOverlay(screenSize: size)

            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(
                    player: controller,
                    scrollAnchorMidi: EarTrainingKeyboardScroll.scrollAnchorMidi(for: controller.stage)
                )
                    .ignoresSafeArea(.container, edges: .horizontal)
                    .padding(.bottom, 4)
            }

            EarTrainingResultView(host: controller)
        }
    }

    @ViewBuilder
    private var feedbackBackground: some View {
        switch controller.feedback {
        case .miss:
            Color.red.opacity(0.12).ignoresSafeArea().allowsHitTesting(false)
        case .clear:
            Color.white.opacity(0.08).ignoresSafeArea().allowsHitTesting(false)
        case .correct:
            Color.clear
        case nil:
            Color.clear
        }
    }

    @ViewBuilder
    private func scoreOverlay(size: CGSize) -> some View {
        let baseWidth = min(size.width * 0.66, 720)
        let baseHeight = min(size.height * 0.48, 280)

        let tableIndex = min(max(scoreSizeStep + 2, 0), Self.containerScaleTable.count - 1)
        let containerScale = Self.containerScaleTable[tableIndex]

        let scaledWidth = baseWidth * containerScale
        let scaledHeight = baseHeight * containerScale

        let outerWidth = min(size.width * 0.95, max(size.width * 0.36, scaledWidth))
        let outerHeight = min(size.height * 0.68, max(size.height * 0.26, scaledHeight))

        // OSMD コンテナ高さに収めるためのベースズーム。WebView 側でレンダー後に高さを測り、
        // 必要なら縮小再描画して五線・音符が完全に収まるようにする。
        // 2段譜以上では iPhone のみ明示的に小さく開始（iPad は変更なし）。
        let isPhone = UIDevice.current.userInterfaceIdiom == .phone
        let maxStaffFromXml = controller.musicXMLText.map {
            EarTrainingChordOsmdMusicXmlNormalizer.detectMaxStaffLayersFromMusicXmlString($0)
        } ?? 1
        let maxStaffLayersForZoom = max(controller.musicXMLMaxStaffLayers, maxStaffFromXml)
        let multiStaff = maxStaffLayersForZoom >= 2
        let osmdZoom: Double = isPhone ? (multiStaff ? 0.4 : 0.6) : 0.85

        ZStack {
            ZStack {
                if let musicXMLText = controller.musicXMLText {
                    EarTrainingOSMDScoreWebView(
                        controller: controller,
                        musicXMLText: musicXMLText,
                        renderKey: controller.phraseRunId,
                        zoom: osmdZoom
                    )
                } else {
                    VStack(spacing: 10) {
                        if controller.gameState == .idle {
                            Text(controller.quizRulesLine ?? "")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.72))
                                .multilineTextAlignment(.center)
                        } else if let scoreError = controller.scoreErrorText {
                            Image(systemName: "music.note.list")
                                .font(.title2)
                                .foregroundStyle(.white.opacity(0.68))
                            Text(scoreError)
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.72))
                                .multilineTextAlignment(.center)
                        } else {
                            ProgressView().tint(.white)
                        }
                    }
                    .padding(.horizontal, 18)
                }
            }
            .frame(width: baseWidth, height: baseHeight)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .scaleEffect(containerScale)
            .frame(width: outerWidth, height: outerHeight)
            .clipped()
            .allowsHitTesting(false)
        }
        .position(x: size.width / 2, y: size.height * 0.42)
    }

    /// 虫眼鏡は画面右端に固定（譜面コンテナのズーム／サイズに追従しない）。
    @ViewBuilder
    private func scoreZoomTrailingOverlay(screenSize size: CGSize) -> some View {
        let shrinkDisabled = scoreSizeStep <= -2
        let enlargeDisabled = scoreSizeStep >= 2
        let inset = Self.resolveHudHorizontalPadding()
        let chipHalfWidth: CGFloat = 18

        VStack(spacing: 6) {
            scoreZoomChipButton(
                systemName: "plus.magnifyingglass",
                accessibilityLabel: locale == .ja ? "譜面を拡大" : "Enlarge score",
                disabled: enlargeDisabled,
                action: {
                    guard scoreSizeStep < 2 else { return }
                    scoreSizeStep += 1
                }
            )

            scoreZoomChipButton(
                systemName: "minus.magnifyingglass",
                accessibilityLabel: locale == .ja ? "譜面を縮小" : "Shrink score",
                disabled: shrinkDisabled,
                action: {
                    guard scoreSizeStep > -2 else { return }
                    scoreSizeStep -= 1
                }
            )
        }
        .padding(.vertical, 8)
        .padding(.leading, 8)
        .padding(.trailing, 10)
        .background(Color.black.opacity(0.45))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
        .allowsHitTesting(controller.musicXMLText != nil)
        .opacity(controller.musicXMLText == nil ? 0 : 1)
        .position(
            x: size.width - inset - 12 - chipHalfWidth,
            y: size.height * 0.42
        )
    }

    @ViewBuilder
    private func scoreZoomChipButton(
        systemName: String,
        accessibilityLabel label: String,
        disabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .symbolRenderingMode(.monochrome)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.white.opacity(0.14))
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
        .opacity(disabled ? 0.28 : 1)
        .disabled(disabled)
        .accessibilityLabel(label)
    }

    private static func resolveHudHorizontalPadding() -> CGFloat {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }) else {
            return 16
        }
        let s = window.safeAreaInsets
        return max(16, s.left, s.right, s.top)
    }
}

private struct EarTrainingOSMDScoreWebView: UIViewRepresentable {
    /// `WKScriptMessageHandler` と JavaScript で共有する名前（`WKUserContentController` に登録）。
    private static let osmdRenderScriptMessageName = "osmdRender"

    @ObservedObject var controller: EarTrainingChordOSMDBattleController
    let musicXMLText: String
    let renderKey: Int
    /// OSMD の描画倍率。コンテナ高さを変えずに譜面を縮小する（主に iPhone）。
    let zoom: Double

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences

        configuration.userContentController.add(
            context.coordinator,
            name: Self.osmdRenderScriptMessageName
        )

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInset = .zero
        context.coordinator.attach(webView: webView, controller: controller)
        webView.loadHTMLString(Self.html, baseURL: Bundle.main.bundleURL)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.configureScroll(
            scrollActive: controller.scoreScrollActive,
            measureDurationSec: controller.scoreMeasureDurationSec,
            maxMeasure: controller.scoreMaxMeasure()
        )
        context.coordinator.update(
            webView: webView,
            musicXMLText: musicXMLText,
            renderKey: renderKey,
            zoom: zoom,
            measureDurationSec: controller.scoreMeasureDurationSec,
            maxMeasure: controller.scoreMaxMeasure()
        )
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        coordinator.tearDown()
        uiView.stopLoading()
        uiView.navigationDelegate = nil
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: Self.osmdRenderScriptMessageName)
    }

    private enum Log {
        private static let subsystem = Bundle.main.bundleIdentifier ?? "Jazzify"
        static let osmd = Logger(subsystem: subsystem, category: "EarTrainingOSMDScoreWebView")
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private weak var webView: WKWebView?
        private weak var controller: EarTrainingChordOSMDBattleController?
        private var htmlReady = false
        private var isTornDown = false
        private var renderGeneration: Int = 0
        private var pendingMusicXMLText: String?
        private var pendingRenderKey: Int?
        private var pendingZoom: Double = 1.0
        private var pendingMeasureDurationSec: Double = 2
        private var pendingMaxMeasure: Int = 1
        private var lastRenderedMusicXMLText: String?
        private var lastRenderedKey: Int?
        private var lastRenderedZoom: Double?
        private var scrollActive = false
        private var scrollMeasureDurationSec: Double = 2
        private var scrollMaxMeasure: Int = 1
        private var displayLink: CADisplayLink?
        private var displayLinkFrameSkip = 0

        func attach(webView: WKWebView, controller: EarTrainingChordOSMDBattleController) {
            self.webView = webView
            self.controller = controller
        }

        func tearDown() {
            isTornDown = true
            stopDisplayLink()
            renderGeneration += 1
            htmlReady = false
            pendingMusicXMLText = nil
            pendingRenderKey = nil
            webView?.stopLoading()
            webView = nil
            controller = nil
        }

        func configureScroll(scrollActive: Bool, measureDurationSec: Double, maxMeasure: Int) {
            self.scrollActive = scrollActive
            scrollMeasureDurationSec = measureDurationSec
            scrollMaxMeasure = maxMeasure
            if scrollActive {
                startDisplayLinkIfNeeded()
            } else {
                stopDisplayLink()
                updatePlayheadVisibility(show: false)
            }
        }

        private func startDisplayLinkIfNeeded() {
            guard displayLink == nil, !isTornDown else { return }
            let link = CADisplayLink(target: self, selector: #selector(onDisplayLink(_:)))
            link.add(to: .main, forMode: .common)
            displayLink = link
        }

        private func stopDisplayLink() {
            displayLink?.invalidate()
            displayLink = nil
            displayLinkFrameSkip = 0
        }

        @objc private func onDisplayLink(_ link: CADisplayLink) {
            displayLinkFrameSkip += 1
            if displayLinkFrameSkip < 2 {
                return
            }
            displayLinkFrameSkip = 0
            guard !isTornDown, htmlReady, scrollActive, let webView else { return }
            let phraseTime = controller?.scorePhraseTimelineSec ?? 0
            let md = Self.javascriptNumber(scrollMeasureDurationSec)
            let mm = max(1, scrollMaxMeasure)
            updatePlayheadVisibility(show: true)
            let script = "window.JazzifyOSMD.updateTimeline(\(Self.javascriptNumber(phraseTime)), \(md), \(mm));"
            webView.evaluateJavaScript(script, completionHandler: nil)
        }

        private func updatePlayheadVisibility(show: Bool) {
            guard let webView, htmlReady, !isTornDown else { return }
            let display = show ? "block" : "none"
            webView.evaluateJavaScript(
                "var p=document.getElementById('playhead'); if(p){p.style.display='\(display)';}",
                completionHandler: nil
            )
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard !isTornDown else { return }
            guard message.name == EarTrainingOSMDScoreWebView.osmdRenderScriptMessageName else { return }
            let body = message.body as? [String: Any]
            let type = body?["type"] as? String ?? "unknown"
            let detail = body?["detail"] as? String ?? ""
            switch type {
            case "ready":
                Log.osmd.debug("OSMD score render ready: \(detail, privacy: .public)")
            case "error":
                Log.osmd.error("OSMD score render error: \(detail, privacy: .public)")
            default:
                Log.osmd.debug("OSMD score message type=\(type, privacy: .public)")
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
            guard !isTornDown else { return }
            htmlReady = true
            flushPending(webView: webView)
        }

        func update(
            webView: WKWebView,
            musicXMLText: String,
            renderKey: Int,
            zoom: Double,
            measureDurationSec: Double,
            maxMeasure: Int
        ) {
            guard !isTornDown else { return }
            pendingMusicXMLText = musicXMLText
            pendingRenderKey = renderKey
            pendingZoom = zoom
            pendingMeasureDurationSec = measureDurationSec
            pendingMaxMeasure = maxMeasure
            guard htmlReady else { return }
            flushPending(webView: webView)
        }

        private func flushPending(webView: WKWebView) {
            guard !isTornDown, htmlReady else { return }
            guard let xml = pendingMusicXMLText,
                  let key = pendingRenderKey else { return }
            let nextZoom = pendingZoom
            let measureDuration = pendingMeasureDurationSec
            let maxMeasure = pendingMaxMeasure
            let needsRender = lastRenderedMusicXMLText != xml
                || lastRenderedKey != key
                || lastRenderedZoom.map { abs($0 - nextZoom) > 0.000_1 } ?? true
            if needsRender {
                renderGeneration += 1
                let generation = renderGeneration
                lastRenderedMusicXMLText = xml
                lastRenderedKey = key
                lastRenderedZoom = nextZoom
                let literal = Self.javaScriptStringLiteral(xml)
                let z = Self.javascriptNumber(nextZoom)
                let md = Self.javascriptNumber(measureDuration)
                let script = """
                window.JazzifyOSMD.renderMusicXML(\(literal), \(z)).then(function() {
                  window.JazzifyOSMD.updateTimeline(0, \(md), \(maxMeasure));
                });
                """
                Self.evaluate(script, on: webView, generation: generation, coordinator: self)
            }
        }

        private static func evaluate(
            _ script: String,
            on webView: WKWebView,
            generation: Int,
            coordinator: Coordinator
        ) {
            guard !coordinator.isTornDown, coordinator.renderGeneration == generation else { return }
            webView.evaluateJavaScript(script) { _, error in
                guard let error else { return }
                guard !coordinator.isTornDown, coordinator.renderGeneration == generation else { return }
                Log.osmd.error("evaluateJavaScript failed: \(String(describing: error), privacy: .public)")
            }
        }

        private static func javascriptNumber(_ value: Double) -> String {
            if !value.isFinite {
                return "0"
            }
            return String(value)
        }

        private static func javaScriptStringLiteral(_ value: String) -> String {
            guard
                let data = try? JSONSerialization.data(withJSONObject: [value], options: []),
                var json = String(data: data, encoding: .utf8),
                json.count >= 2
            else {
                return "\"\""
            }
            json.removeFirst()
            json.removeLast()
            return json
        }
    }

    private static let html = """
    <!doctype html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <style>
        html, body {
          margin: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
        }
        #viewport {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: transparent;
        }
        #score {
          position: absolute;
          top: 50%;
          left: 0;
          min-width: 100%;
          transform: translate3d(0, -50%, 0);
          transform-origin: left center;
          will-change: transform;
        }
        #playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 120px;
          width: 2px;
          background: #ef4444;
          pointer-events: none;
          z-index: 10;
          display: none;
        }
        #score canvas, #score svg {
          display: block;
          background: transparent !important;
        }
        #status {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          pointer-events: none;
        }
      </style>
      <script src="opensheetmusicdisplay.min.js"></script>
    </head>
    <body>
      <div id="viewport">
        <div id="playhead"></div>
        <div id="score"></div>
        <div id="status">Loading OSMD...</div>
      </div>
      <script>
        (function() {
          const viewport = document.getElementById('viewport');
          const score = document.getElementById('score');
          const status = document.getElementById('status');
          const PLAYHEAD_PX = 120;
          let osmd = null;
          let measureCentersByNumber = {};
          let measureBoundsByNumber = {};
          let scoreWidth = 0;
          let cssScale = 1;

          function finiteNum(value) {
            return typeof value === 'number' && Number.isFinite(value) ? value : null;
          }

          function readMeasureList(osmdInst) {
            const gs = osmdInst && osmdInst.GraphicSheet;
            if (!gs) return [];
            const raw = gs.MeasureList || gs.measureList;
            return Array.isArray(raw) ? raw : [];
          }

          function assignMeasureLayout(measureNumber, noteMinX, noteMaxX, measureMinX, measureMaxX, centers, bounds) {
            if (Number.isFinite(noteMinX) && Number.isFinite(noteMaxX)) {
              centers[measureNumber] = (noteMinX + noteMaxX) / 2;
              bounds[measureNumber] = { left: noteMinX, right: noteMaxX };
              return;
            }
            if (Number.isFinite(measureMinX) && Number.isFinite(measureMaxX)) {
              centers[measureNumber] = (measureMinX + measureMaxX) / 2;
              bounds[measureNumber] = { left: measureMinX, right: measureMaxX };
            }
          }

          function collectMeasureCentersFromMeasureList(gs, surface, viewportWidth) {
            const boundingWidth = finiteNum(gs && gs.BoundingBox && gs.BoundingBox.width) || 0;
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;
            const centers = {};
            const bounds = {};
            let maxX = 0;

            const list = readMeasureList({ GraphicSheet: gs });
            for (let measureIndex = 0; measureIndex < list.length; measureIndex += 1) {
              const row = list[measureIndex] || [];
              const measures = row.filter(Boolean);
              if (measures.length === 0) continue;

              // OSMD の MeasureNumber プロパティが MusicXML の `<measure number=>` と一致しないケースがあるため、
              // 表示用のキーは MusicXML の出現順 (1-indexed) を強制する。`activeMeasureNumber` も 1-indexed のため整合する。
              const measureNumber = measureIndex + 1;

              let noteMinX = Number.POSITIVE_INFINITY;
              let noteMaxX = Number.NEGATIVE_INFINITY;
              let measureMinX = Number.POSITIVE_INFINITY;
              let measureMaxX = Number.NEGATIVE_INFINITY;

              for (let mi = 0; mi < measures.length; mi += 1) {
                const measure = measures[mi];
                const measureX = finiteNum(measure.PositionAndShape && measure.PositionAndShape.AbsolutePosition && measure.PositionAndShape.AbsolutePosition.x);
                const measureWidth = finiteNum(measure.PositionAndShape && measure.PositionAndShape.BorderRight) || 0;
                if (measureX !== null) {
                  const scaledMeasureX = measureX * scaleFactor;
                  measureMinX = Math.min(measureMinX, scaledMeasureX);
                  measureMaxX = Math.max(measureMaxX, scaledMeasureX + measureWidth * scaleFactor);
                }
                const staffEntries = measure.staffEntries || [];
                for (let si = 0; si < staffEntries.length; si += 1) {
                  const entry = staffEntries[si];
                  const gves = entry.graphicalVoiceEntries || [];
                  for (let gi = 0; gi < gves.length; gi += 1) {
                    const voiceEntry = gves[gi];
                    const notes = voiceEntry.notes || [];
                    for (let ni = 0; ni < notes.length; ni += 1) {
                      const note = notes[ni];
                      const src = note.sourceNote;
                      const hasPitch =
                        !!(src && (src.Pitch || src.pitch || src.TransposedPitch || src.transposedPitch));
                      if (!hasPitch) continue;
                      const nx = finiteNum(note.PositionAndShape && note.PositionAndShape.AbsolutePosition && note.PositionAndShape.AbsolutePosition.x);
                      if (nx !== null) {
                        const sx = nx * scaleFactor;
                        noteMinX = Math.min(noteMinX, sx);
                        noteMaxX = Math.max(noteMaxX, sx);
                        maxX = Math.max(maxX, sx);
                      }
                    }
                  }
                }
              }

              if (Number.isFinite(noteMinX) && Number.isFinite(noteMaxX)) {
                assignMeasureLayout(measureNumber, noteMinX, noteMaxX, measureMinX, measureMaxX, centers, bounds);
              } else if (Number.isFinite(measureMinX) && Number.isFinite(measureMaxX)) {
                assignMeasureLayout(measureNumber, noteMinX, noteMaxX, measureMinX, measureMaxX, centers, bounds);
              }
            }

            return {
              measureCentersByNumber: centers,
              measureBoundsByNumber: bounds,
              scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
            };
          }

          function collectMeasureCentersFromStaffLines(gs, surface, viewportWidth) {
            const boundingWidth = finiteNum(gs && gs.BoundingBox && gs.BoundingBox.width) || 0;
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;
            const byNumberBounds = {};
            let maxX = 0;

            const pages = (gs && gs.MusicPages) || [];
            let measureOrdinal = 0;

            function ensureBounds(num) {
              if (!byNumberBounds[num]) {
                byNumberBounds[num] = {
                  nMin: Number.POSITIVE_INFINITY,
                  nMax: Number.NEGATIVE_INFINITY,
                  mMin: Number.POSITIVE_INFINITY,
                  mMax: Number.NEGATIVE_INFINITY,
                };
              }
              return byNumberBounds[num];
            }

            for (let pi = 0; pi < pages.length; pi += 1) {
              const systems = pages[pi].MusicSystems || [];
              for (let syi = 0; syi < systems.length; syi += 1) {
                const staffLines = systems[syi].StaffLines || [];
                for (let li = 0; li < staffLines.length; li += 1) {
                  const staffLine = staffLines[li];
                  const measures = staffLine.Measures || [];
                  for (let mi = 0; mi < measures.length; mi += 1) {
                    measureOrdinal += 1;
                    const measure = measures[mi];
                    // MeasureNumber プロパティは信用せず、StaffLines を横断した出現順 (1-indexed) を採用する。
                    const mn = measureOrdinal;
                    const b = ensureBounds(mn);

                    const measureX = finiteNum(measure.PositionAndShape && measure.PositionAndShape.AbsolutePosition && measure.PositionAndShape.AbsolutePosition.x);
                    const measureWidth = finiteNum(measure.PositionAndShape && measure.PositionAndShape.BorderRight) || 0;
                    if (measureX !== null) {
                      const smx = measureX * scaleFactor;
                      b.mMin = Math.min(b.mMin, smx);
                      b.mMax = Math.max(b.mMax, smx + measureWidth * scaleFactor);
                    }

                    const staffEntries = measure.staffEntries || [];
                    for (let sei = 0; sei < staffEntries.length; sei += 1) {
                      const entry = staffEntries[sei];
                      const gves = entry.graphicalVoiceEntries || [];
                      for (let gi = 0; gi < gves.length; gi += 1) {
                        const voiceEntry = gves[gi];
                        const notes = voiceEntry.notes || [];
                        for (let ni = 0; ni < notes.length; ni += 1) {
                          const note = notes[ni];
                          const src = note.sourceNote;
                          const hasPitch =
                            !!(src && (src.Pitch || src.pitch || src.TransposedPitch || src.transposedPitch));
                          if (!hasPitch) continue;
                          const nx = finiteNum(note.PositionAndShape && note.PositionAndShape.AbsolutePosition && note.PositionAndShape.AbsolutePosition.x);
                          if (nx !== null) {
                            const sx = nx * scaleFactor;
                            b.nMin = Math.min(b.nMin, sx);
                            b.nMax = Math.max(b.nMax, sx);
                            maxX = Math.max(maxX, sx);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            const out = {};
            const boundsOut = {};
            const boundsKeys = Object.keys(byNumberBounds);
            for (let ki = 0; ki < boundsKeys.length; ki += 1) {
              const num = Number(boundsKeys[ki]);
              const b = byNumberBounds[num];
              assignMeasureLayout(num, b.nMin, b.nMax, b.mMin, b.mMax, out, boundsOut);
            }

            return {
              measureCentersByNumber: out,
              measureBoundsByNumber: boundsOut,
              scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
            };
          }

          function measureLayoutFromOsmd() {
            const surface = score.querySelector('canvas, svg');
            const graphicSheet = osmd && osmd.GraphicSheet;
            const viewportWidth = viewport.clientWidth || 0;
            if (!graphicSheet) {
              measureCentersByNumber = {};
              measureBoundsByNumber = {};
              scoreWidth = viewportWidth;
              return;
            }
            const primary = collectMeasureCentersFromMeasureList(graphicSheet, surface, viewportWidth);
            const mnKeys = Object.keys(primary.measureCentersByNumber);
            if (mnKeys.length > 0) {
              measureCentersByNumber = primary.measureCentersByNumber;
              measureBoundsByNumber = primary.measureBoundsByNumber;
              scoreWidth = primary.scoreWidth;
              return;
            }
            const fallback = collectMeasureCentersFromStaffLines(graphicSheet, surface, viewportWidth);
            measureCentersByNumber = fallback.measureCentersByNumber;
            measureBoundsByNumber = fallback.measureBoundsByNumber;
            scoreWidth = fallback.scoreWidth;
          }

          function computeScrollOffset(phraseTimeSec, measureDurationSec, maxMeasure) {
            const viewportWidth = viewport.clientWidth || 0;
            const safeMax = Math.max(1, Math.floor(Number(maxMeasure) || 1));
            let activeMeasure = 1;
            let timeInMeasure = 0;
            if (phraseTimeSec >= 0 && measureDurationSec > 0) {
              const rawMeasure = Math.floor(phraseTimeSec / measureDurationSec) + 1;
              activeMeasure = Math.max(1, Math.min(safeMax, rawMeasure));
              timeInMeasure = Math.max(0, phraseTimeSec - (activeMeasure - 1) * measureDurationSec);
            }
            const bounds = measureBoundsByNumber[activeMeasure] || measureBoundsByNumber[1];
            let xPos;
            if (bounds && measureDurationSec > 0) {
              const t = Math.max(0, Math.min(1, timeInMeasure / measureDurationSec));
              xPos = bounds.left + t * (bounds.right - bounds.left);
            } else {
              xPos = measureCentersByNumber[activeMeasure]
                || measureCentersByNumber[1]
                || viewportWidth / 2;
            }
            const effectiveScale = cssScale;
            const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
            return Math.max(0, Math.min(maxOffset, xPos * effectiveScale - PLAYHEAD_PX));
          }

          function postOsmdMessage(type, detail) {
            try {
              var handler =
                window.webkit &&
                window.webkit.messageHandlers &&
                window.webkit.messageHandlers.osmdRender;
              if (!handler) {
                return;
              }
              handler.postMessage({
                type: String(type || ''),
                detail: detail === undefined || detail === null ? '' : String(detail),
              });
            } catch (_e) {
              /* no-op */
            }
          }

          function buildOsmd() {
            const ctor = window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay;
            if (!ctor) {
              throw new Error('OpenSheetMusicDisplay missing');
            }
            return new ctor(score, {
              backend: 'svg',
              autoResize: false,
              drawTitle: false,
              drawComposer: false,
              drawLyricist: false,
              drawPartNames: false,
              drawingParameters: 'compacttight',
              renderSingleHorizontalStaffline: true,
              pageFormat: 'Endless',
              defaultColorMusic: '#ffffff',
              defaultColorNotehead: '#ffffff',
              defaultColorStem: '#ffffff',
              defaultColorLabel: '#ffffff',
              defaultColorTitle: '#ffffff',
              defaultColorLyrics: '#ffffff'
            });
          }

          function measureSurfaceHeight() {
            const surface = score.querySelector('canvas, svg');
            if (!surface) return 0;
            const rect = surface.getBoundingClientRect();
            return rect.height || surface.height || 0;
          }

          async function renderMusicXML(xmlText, zoomValue) {
            score.replaceChildren();
            measureCentersByNumber = {};
            measureBoundsByNumber = {};
            cssScale = 1;
            score.style.transform = 'translate3d(0, -50%, 0) scale(1)';
            status.textContent = 'Rendering...';
            status.style.display = 'grid';

            let renderSucceeded = false;
            try {
              const OpenSheetMusicDisplay =
                window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay;
              if (!OpenSheetMusicDisplay) {
                status.textContent = 'OSMD failed to load';
                postOsmdMessage('error', 'OpenSheetMusicDisplay missing');
                return;
              }

              const displayXml = xmlText;
              const z = typeof zoomValue === 'number' && Number.isFinite(zoomValue) ? zoomValue : 1;

              osmd = buildOsmd();
              osmd.zoom = z;
              await osmd.load(displayXml);
              osmd.render();
              await new Promise(function (resolve) {
                requestAnimationFrame(function () {
                  requestAnimationFrame(resolve);
                });
              });

              // 2段譜（iPhone は zoom <= 0.5 で渡されている）のときは積極的に縮小して 1 段譜と同程度の見た目に揃える。
              const aggressiveShrink =
                typeof zoomValue === 'number' && Number.isFinite(zoomValue) && zoomValue <= 0.5;
              const targetHeight = Math.max(48, viewport.clientHeight * (aggressiveShrink ? 0.72 : 0.94));
              const measured = measureSurfaceHeight();
              if (measured > targetHeight && measured > 0) {
                cssScale = Math.max(0.28, targetHeight / measured);
              } else {
                cssScale = 1;
              }
              score.style.transform = 'translate3d(0, -50%, 0) scale(' + cssScale + ')';
              await new Promise(function (resolve) {
                requestAnimationFrame(resolve);
              });

              measureLayoutFromOsmd();
              score.style.width = scoreWidth + 'px';
              renderSucceeded = true;
              postOsmdMessage('ready', '');
            } catch (err) {
              const msg = err && err.message ? String(err.message) : String(err);
              status.textContent = 'Could not render MusicXML.';
              postOsmdMessage('error', msg);
            } finally {
              if (renderSucceeded) {
                status.style.display = 'none';
              }
            }
          }

          function updateTimeline(phraseTimeSec, measureDurationSec, maxMeasure) {
            const offset = computeScrollOffset(phraseTimeSec, measureDurationSec, maxMeasure);
            score.style.transform = 'translate3d(' + (-offset) + 'px, -50%, 0) scale(' + cssScale + ')';
          }

          window.JazzifyOSMD = {
            renderMusicXML,
            updateTimeline
          };
        })();
      </script>
    </body>
    </html>
    """
}

private struct EarTrainingChordOSMDSceneContainer<Driver: EarTrainingBattleSceneDriving>: UIViewRepresentable {
    let driver: Driver
    let sceneSize: CGSize

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> SKView {
        let initialFrame = CGRect(origin: .zero, size: normalizedSceneSize(sceneSize))
        let view = SKView(frame: initialFrame)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        view.isAsynchronous = false
        view.isPaused = false

        let scene = EarTrainingBattleScene(size: initialFrame.size)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        scene.onEffectImpact = { [weak driver] effectId in
            Task { @MainActor [weak driver] in
                driver?.handleEffectImpact(effectId: effectId)
            }
        }
        view.presentScene(scene)
        driver.attachScene(scene)
        context.coordinator.attach(view: view, scene: scene, driver: driver)
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        context.coordinator.update(sceneSize: normalizedSceneSize(sceneSize))
    }

    private func normalizedSceneSize(_ size: CGSize) -> CGSize {
        CGSize(width: max(1, size.width), height: max(1, size.height))
    }

    static func dismantleUIView(_ uiView: SKView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private weak var view: SKView?
        private weak var scene: EarTrainingBattleScene?
        private weak var driver: Driver?
        private var activeObserver: NSObjectProtocol?

        func attach(view: SKView, scene: EarTrainingBattleScene, driver: Driver) {
            self.view = view
            self.scene = scene
            self.driver = driver
            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                if let v = self?.view, v.isPaused { v.isPaused = false }
                if let s = self?.scene, s.isPaused { s.isPaused = false }
            }
        }

        func update(sceneSize: CGSize) {
            view?.bounds = CGRect(origin: .zero, size: sceneSize)
            guard let scene, scene.size != sceneSize else { return }
            scene.size = sceneSize
        }

        func detach() {
            if let observer = activeObserver {
                NotificationCenter.default.removeObserver(observer)
            }
            activeObserver = nil
            let pendingDriver = driver
            Task { @MainActor in
                pendingDriver?.detachScene()
            }
            view = nil
            scene = nil
            driver = nil
        }
    }
}
