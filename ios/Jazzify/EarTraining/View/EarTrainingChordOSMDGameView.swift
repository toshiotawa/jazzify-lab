import SwiftUI
import SpriteKit
import UIKit
import WebKit

/// OSMD リズム判定バトル（`mode == chord_osmd`）ネイティブ画面。
struct EarTrainingChordOSMDGameView: View {
    let source: EarTrainingStageSource
    let lessonContext: EarTrainingLessonContext?
    let locale: AppLocale
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
                    locale: locale
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
        isLoading = true
        loadError = nil
        do {
            let stageDetail: EarTrainingStageDetail
            switch source {
            case .id(let stageId):
                stageDetail = try await EarTrainingStageDetailCache.shared.stageDetail(for: stageId)
            case .slug(let slug):
                stageDetail = try await SupabaseService.shared.fetchEarTrainingStageDetailBySlug(slug: slug)
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
                onExit: onClose
            )

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

private struct EarTrainingChordOSMDContent: View {
    @ObservedObject var controller: EarTrainingChordOSMDBattleController
    let audio: EarTrainingAudio
    let locale: AppLocale

    @State private var hudHorizontalPadding: CGFloat = 16

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
            hudHorizontalPadding = Self.resolveHudHorizontalPadding()
        }
        .sheet(isPresented: $controller.isSettingsOpen) {
            EarTrainingSettingsSheet(
                isEnglishCopy: locale == .en,
                audio: audio,
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

            VStack(spacing: 0) {
                Spacer()
                EarTrainingPianoView(player: controller)
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
        let width = min(size.width * 0.66, 720)
        let height = min(size.height * 0.48, 280)
        // OSMD コンテナ高さに収めるためのベースズーム。WebView 側でレンダー後に高さを測り、
        // 必要なら縮小再描画して五線・音符が完全に収まるようにする。
        let osmdZoom: Double = UIDevice.current.userInterfaceIdiom == .phone ? 0.6 : 0.85
        ZStack {
            if let musicXMLText = controller.musicXMLText {
                EarTrainingOSMDScoreWebView(
                    musicXMLText: musicXMLText,
                    activeMeasureNumber: controller.activeMeasureNumber,
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
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .position(x: size.width / 2, y: size.height * 0.42)
        .allowsHitTesting(false)
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
    let musicXMLText: String
    let activeMeasureNumber: Int
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

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInset = .zero
        context.coordinator.attach(webView)
        webView.loadHTMLString(Self.html, baseURL: nil)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.update(
            webView: webView,
            musicXMLText: musicXMLText,
            renderKey: renderKey,
            activeMeasureNumber: activeMeasureNumber,
            zoom: zoom
        )
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private weak var webView: WKWebView?
        private var htmlReady = false
        private var pendingMusicXMLText: String?
        private var pendingRenderKey: Int?
        private var pendingMeasureNumber: Int?
        private var pendingZoom: Double = 1.0
        private var lastRenderedMusicXMLText: String?
        private var lastRenderedKey: Int?
        private var lastRenderedZoom: Double?
        private var lastMeasureNumber: Int?

        func attach(_ webView: WKWebView) {
            self.webView = webView
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
            htmlReady = true
            flushPending(webView: webView)
        }

        func update(webView: WKWebView, musicXMLText: String, renderKey: Int, activeMeasureNumber: Int, zoom: Double) {
            pendingMusicXMLText = musicXMLText
            pendingRenderKey = renderKey
            pendingMeasureNumber = activeMeasureNumber
            pendingZoom = zoom
            guard htmlReady else { return }
            flushPending(webView: webView)
        }

        private func flushPending(webView: WKWebView) {
            guard htmlReady else { return }
            guard let xml = pendingMusicXMLText,
                  let key = pendingRenderKey,
                  let measure = pendingMeasureNumber else { return }
            let nextZoom = pendingZoom
            let needsRender = lastRenderedMusicXMLText != xml
                || lastRenderedKey != key
                || lastRenderedZoom.map { abs($0 - nextZoom) > 0.000_1 } ?? true
            if needsRender {
                lastRenderedMusicXMLText = xml
                lastRenderedKey = key
                lastRenderedZoom = nextZoom
                lastMeasureNumber = measure
                let literal = Self.javaScriptStringLiteral(xml)
                let z = Self.javascriptNumber(nextZoom)
                let script = """
                window.JazzifyOSMD.renderMusicXML(\(literal), \(z)).then(function() {
                  window.JazzifyOSMD.setActiveMeasure(\(measure));
                });
                """
                webView.evaluateJavaScript(script)
                return
            }
            if lastMeasureNumber != measure {
                lastMeasureNumber = measure
                webView.evaluateJavaScript("window.JazzifyOSMD.setActiveMeasure(\(measure));")
            }
        }

        private static func javascriptNumber(_ value: Double) -> String {
            if !value.isFinite {
                return "1"
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
          transition: transform 160ms ease-out;
          will-change: transform;
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
      <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.9.0/build/opensheetmusicdisplay.min.js"></script>
    </head>
    <body>
      <div id="viewport">
        <div id="score"></div>
        <div id="status">Loading OSMD...</div>
      </div>
      <script>
        (function() {
          const viewport = document.getElementById('viewport');
          const score = document.getElementById('score');
          const status = document.getElementById('status');
          let osmd = null;
          let measureCenters = [];
          let scoreWidth = 0;

          function collectMeasureCenters() {
            measureCenters = [];
            const surface = score.querySelector('canvas, svg');
            const graphicSheet = osmd && osmd.GraphicSheet;
            const boundingBox = graphicSheet && graphicSheet.BoundingBox;
            let scaleFactor = 10;
            if (surface && boundingBox && boundingBox.width > 0) {
              const rectWidth = surface.getBoundingClientRect().width || surface.width || 0;
              if (rectWidth > 0) {
                scaleFactor = rectWidth / boundingBox.width;
              }
            }
            const starts = [];
            if (graphicSheet && graphicSheet.MusicPages) {
              for (const page of graphicSheet.MusicPages) {
                for (const system of page.MusicSystems || []) {
                  const staffLine = (system.StaffLines || [])[0];
                  if (!staffLine) continue;
                  for (const measure of staffLine.Measures || []) {
                    const x = measure?.PositionAndShape?.AbsolutePosition?.x;
                    if (typeof x === 'number' && Number.isFinite(x)) {
                      starts.push(x * scaleFactor);
                    }
                  }
                }
              }
            }
            for (let i = 0; i < starts.length; i += 1) {
              const current = starts[i];
              const next = starts[i + 1] ?? (current + Math.max(150, current - (starts[i - 1] ?? 0)));
              measureCenters.push((current + next) / 2);
            }
            const rect = surface ? surface.getBoundingClientRect() : null;
            scoreWidth = Math.max(viewport.clientWidth, rect ? rect.width : 0, measureCenters[measureCenters.length - 1] || 0);
            score.style.width = scoreWidth + 'px';
          }

          function buildOsmd() {
            return new OpenSheetMusicDisplay(score, {
              backend: 'canvas',
              autoResize: false,
              drawTitle: false,
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
            status.textContent = 'Rendering...';
            status.style.display = 'grid';
            score.replaceChildren();
            measureCenters = [];
            score.style.transform = 'translate3d(0, -50%, 0)';

            const OpenSheetMusicDisplay = window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay;
            if (!OpenSheetMusicDisplay) {
              status.textContent = 'OSMD failed to load';
              return;
            }
            const displayXml = xmlText;
            let z = typeof zoomValue === 'number' && Number.isFinite(zoomValue) ? zoomValue : 1;
            osmd = buildOsmd();
            osmd.zoom = z;
            await osmd.load(displayXml);
            osmd.render();
            // 描画後に実際の高さを測り、コンテナ高さに収まらない場合は縮小して再描画する。
            // viewport は #viewport (= position:fixed; inset:0) でコンテナ高さに一致する。
            const targetHeight = Math.max(48, viewport.clientHeight * 0.94);
            const measured = measureSurfaceHeight();
            if (measured > targetHeight && measured > 0) {
              const minZoom = 0.32;
              const fitZoom = Math.max(minZoom, z * (targetHeight / measured));
              if (Math.abs(fitZoom - z) > 0.01) {
                z = fitZoom;
                score.replaceChildren();
                osmd = buildOsmd();
                osmd.zoom = z;
                await osmd.load(displayXml);
                osmd.render();
              }
            }
            collectMeasureCenters();
            status.style.display = 'none';
          }

          function setActiveMeasure(measureNumber) {
            const index = Math.max(0, Math.floor(Number(measureNumber || 1)) - 1);
            const center = measureCenters[index] ?? measureCenters[0] ?? (viewport.clientWidth / 2);
            const maxOffset = Math.max(0, scoreWidth - viewport.clientWidth);
            const offset = Math.max(0, Math.min(maxOffset, center - viewport.clientWidth / 2));
            score.style.transform = 'translate3d(' + (-offset) + 'px, -50%, 0)';
          }

          window.JazzifyOSMD = {
            renderMusicXML,
            setActiveMeasure
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
