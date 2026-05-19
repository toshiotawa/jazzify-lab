import SwiftUI
import SpriteKit
import UIKit
import WebKit
import os.log

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

    /// OSMD 譜面コンテナの拡縮ステップ（-2 ... +2、`containerScaleTable` のインデックスは step + 2）。
    @State private var scoreSizeStep: Int = 1

    @State private var hudHorizontalPadding: CGFloat = 16

    /// 譜面コンテナに対する相対スケール（コンテナサイズ と GPU レイヤでの表示を両方変更）。
    private static let containerScaleTable: [Double] = [0.80, 0.90, 1.00, 1.15, 1.30]

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

            scoreZoomTrailingOverlay(screenSize: size)

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
                        musicXMLText: musicXMLText,
                        activeMeasureNumber: controller.activeMeasureNumber,
                        renderKey: controller.phraseRunId,
                        zoom: osmdZoom,
                        xmlAttacksJSON: controller.osmdXmlAttacksJSON,
                        highlightSnapshotJSON: controller.osmdHighlightSnapshotJSON
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

    let musicXMLText: String
    let activeMeasureNumber: Int
    let renderKey: Int
    /// OSMD の描画倍率。コンテナ高さを変えずに譜面を縮小する（主に iPhone）。
    let zoom: Double
    /// Swift `collectChordOsmdMusicXmlAttacks` の JSON 配列（UTF-8）。音符ハイライト突き合わせ用。
    let xmlAttacksJSON: String
    /// Swift `refreshOsmdHighlightSnapshot` と同型の JSON（UTF-8）。
    let highlightSnapshotJSON: String

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
        context.coordinator.attach(webView)
        webView.loadHTMLString(Self.html, baseURL: Bundle.main.bundleURL)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.update(
            webView: webView,
            musicXMLText: musicXMLText,
            renderKey: renderKey,
            activeMeasureNumber: activeMeasureNumber,
            zoom: zoom,
            xmlAttacksJSON: xmlAttacksJSON,
            highlightSnapshotJSON: highlightSnapshotJSON
        )
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: Self.osmdRenderScriptMessageName)
    }

    private enum Log {
        private static let subsystem = Bundle.main.bundleIdentifier ?? "Jazzify"
        static let osmd = Logger(subsystem: subsystem, category: "EarTrainingOSMDScoreWebView")
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private weak var webView: WKWebView?
        private var htmlReady = false
        private var pendingMusicXMLText: String?
        private var pendingRenderKey: Int?
        private var pendingMeasureNumber: Int?
        private var pendingZoom: Double = 1.0
        private var pendingXmlAttacksJSON: String = "[]"
        private var pendingHighlightSnapshotJSON: String = "{\"activeMeasureNumber\":1,\"targets\":[]}"
        private var lastRenderedMusicXMLText: String?
        private var lastRenderedKey: Int?
        private var lastRenderedZoom: Double?
        private var lastMeasureNumber: Int?
        private var lastSentHighlightJSON: String?

        func attach(_ webView: WKWebView) {
            self.webView = webView
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
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
            htmlReady = true
            flushPending(webView: webView)
        }

        func update(
            webView: WKWebView,
            musicXMLText: String,
            renderKey: Int,
            activeMeasureNumber: Int,
            zoom: Double,
            xmlAttacksJSON: String,
            highlightSnapshotJSON: String,
        ) {
            pendingMusicXMLText = musicXMLText
            pendingRenderKey = renderKey
            pendingMeasureNumber = activeMeasureNumber
            pendingZoom = zoom
            pendingXmlAttacksJSON = xmlAttacksJSON
            pendingHighlightSnapshotJSON = highlightSnapshotJSON
            guard htmlReady else { return }
            flushPending(webView: webView)
        }

        private func flushPending(webView: WKWebView) {
            guard htmlReady else { return }
            guard let xml = pendingMusicXMLText,
                  let key = pendingRenderKey,
                  let measure = pendingMeasureNumber else { return }
            let nextZoom = pendingZoom
            let attacksJson = pendingXmlAttacksJSON
            let highlightJson = pendingHighlightSnapshotJSON
            let needsRender = lastRenderedMusicXMLText != xml
                || lastRenderedKey != key
                || lastRenderedZoom.map { abs($0 - nextZoom) > 0.000_1 } ?? true

            if needsRender {
                lastRenderedMusicXMLText = xml
                lastRenderedKey = key
                lastRenderedZoom = nextZoom
                lastMeasureNumber = measure
                lastSentHighlightJSON = highlightJson
                let literal = Self.javaScriptStringLiteral(xml)
                let z = Self.javascriptNumber(nextZoom)
                let attacksB64 = Self.base64UTF8(attacksJson)
                let highlightB64 = Self.base64UTF8(highlightJson)
                let script = """
                window.JazzifyOSMD.renderMusicXML(\(literal), \(z), '\(attacksB64)').then(function() {
                  window.JazzifyOSMD.setActiveMeasure(\(measure));
                  window.JazzifyOSMD.setHighlightSnapshot('\(highlightB64)');
                });
                """
                Self.evaluate(script, on: webView)
                return
            }
            if lastSentHighlightJSON != highlightJson {
                lastSentHighlightJSON = highlightJson
                let highlightB64 = Self.base64UTF8(highlightJson)
                Self.evaluate("window.JazzifyOSMD.setHighlightSnapshot('\(highlightB64)');", on: webView)
            }
            if lastMeasureNumber != measure {
                lastMeasureNumber = measure
                Self.evaluate("window.JazzifyOSMD.setActiveMeasure(\(measure));", on: webView)
            }
        }

        private static func base64UTF8(_ string: String) -> String {
            Data(string.utf8).base64EncodedString()
        }

        private static func evaluate(_ script: String, on webView: WKWebView) {
            webView.evaluateJavaScript(script) { _, error in
                guard let error else { return }
                Log.osmd.error("evaluateJavaScript failed: \(String(describing: error), privacy: .public)")
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
        #scoreWrap {
          position: absolute;
          top: 50%;
          left: 0;
          min-width: 100%;
          transform: translate3d(0, -50%, 0);
          transform-origin: left center;
          transition: transform 160ms ease-out;
          will-change: transform;
        }
        #measureBand {
          display: none;
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 1;
          pointer-events: none;
          background: rgba(243, 152, 0, 0.12);
          border-radius: 2px;
        }
        #osmdHost {
          position: relative;
          z-index: 2;
          min-width: 100%;
        }
        #osmdHost canvas, #osmdHost svg {
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
        <div id="scoreWrap">
          <div id="measureBand"></div>
          <div id="osmdHost"></div>
        </div>
        <div id="status">Loading OSMD...</div>
      </div>
      <script>
        (function() {
          const viewport = document.getElementById('viewport');
          const scoreWrap = document.getElementById('scoreWrap');
          const measureBand = document.getElementById('measureBand');
          const score = document.getElementById('osmdHost');
          const status = document.getElementById('status');
          let osmd = null;
          let measureCentersByNumber = {};
          let measureBoundsByNumber = {};
          let scoreWidth = 0;
          let cssScale = 1;
          let attackIndex = new Map();
          let coloredNotes = [];

          function finiteNum(value) {
            return typeof value === 'number' && Number.isFinite(value) ? value : null;
          }

          function readMeasureList(osmdInst) {
            const gs = osmdInst && osmdInst.GraphicSheet;
            if (!gs) return [];
            const raw = gs.MeasureList || gs.measureList;
            return Array.isArray(raw) ? raw : [];
          }

          var OSMD_NOTE_COLORING = {
            applyToNoteheads: true,
            applyToStem: true,
            applyToBeams: true,
            applyToFlag: true,
            applyToLedgerLines: true,
            applyToTies: true,
            applyToSlurs: true,
          };

          var COL_DEFAULT = '#ffffff';
          var COL_JUDGMENT = '#f39800';
          var COL_CORRECT = '#22c55e';
          var COL_FAILED = '#ef4444';

          function chordOsmdAttackLookupKey(measureNumber, beatStartInMeasure) {
            return (
              String(Math.floor(measureNumber)) +
              '|' +
              (typeof beatStartInMeasure === 'number' && Number.isFinite(beatStartInMeasure)
                ? beatStartInMeasure.toFixed(6)
                : '0')
            );
          }

          function multisetEqualSorted(a, b) {
            if (!a || !b || a.length !== b.length) return false;
            var sa = a.slice().sort(function (x, y) {
              return x - y;
            });
            var sb = b.slice().sort(function (x, y) {
              return x - y;
            });
            for (var i = 0; i < sa.length; i += 1) {
              if (sa[i] !== sb[i]) return false;
            }
            return true;
          }

          function hasPitchHead(gn) {
            var sn = gn && gn.sourceNote;
            if (!sn) return false;
            if (typeof sn.isRest === 'function' && sn.isRest()) return false;
            if (sn.NoteTie && sn.NoteTie.StartNote === false) return false;
            return !!(sn.Pitch || sn.pitch || sn.TransposedPitch || sn.transposedPitch);
          }

          function osmdGraphicalNoteToMidi(gn) {
            var h = gn && gn.sourceNote && gn.sourceNote.halfTone;
            if (typeof h !== 'number' || !Number.isFinite(h)) return null;
            var rounded = Math.round(h);
            if (rounded < 0 || rounded > 127) return null;
            return rounded;
          }

          function collectOsmdGraphicClusters(osmdInst) {
            var out = [];
            var list = readMeasureList(osmdInst);
            for (var measureIndex = 0; measureIndex < list.length; measureIndex += 1) {
              var row = list[measureIndex] || [];
              var measureNumber = measureIndex + 1;
              for (var ri = 0; ri < row.length; ri += 1) {
                var gm = row[ri];
                if (!gm) continue;
                var staffEntries = gm.staffEntries || [];
                for (var sei = 0; sei < staffEntries.length; sei += 1) {
                  var se = staffEntries[sei];
                  var chordNotes = [];
                  var gves = se.graphicalVoiceEntries || [];
                  for (var gi = 0; gi < gves.length; gi += 1) {
                    var gve = gves[gi];
                    var notes = gve.notes || [];
                    for (var ni = 0; ni < notes.length; ni += 1) {
                      var note = notes[ni];
                      if (hasPitchHead(note)) chordNotes.push(note);
                    }
                  }
                  if (chordNotes.length === 0) continue;
                  var midis = [];
                  var notesArr = [];
                  for (var ci = 0; ci < chordNotes.length; ci += 1) {
                    var m = osmdGraphicalNoteToMidi(chordNotes[ci]);
                    if (m !== null) {
                      midis.push(m);
                      notesArr.push(chordNotes[ci]);
                    }
                  }
                  if (midis.length === 0) continue;
                  var seX = finiteNum(se.PositionAndShape && se.PositionAndShape.AbsolutePosition && se.PositionAndShape.AbsolutePosition.x);
                  if (seX === null) seX = Number.POSITIVE_INFINITY;
                  out.push({
                    measureNumber: measureNumber,
                    minX: seX,
                    midis: midis,
                    notes: notesArr,
                  });
                }
              }
            }
            return out;
          }

          function groupAttacksByMeasure(attacks) {
            var by = new Map();
            for (var i = 0; i < attacks.length; i += 1) {
              var a = attacks[i];
              var m = a.measureNumber;
              var lst = by.get(m);
              if (lst) lst.push(a);
              else by.set(m, [a]);
            }
            by.forEach(function (list) {
              list.sort(function (x, y) {
                return x.beatStartInMeasure - y.beatStartInMeasure;
              });
            });
            return by;
          }

          function matchOsmdClustersToXmlAttacks(osmdInst, xmlAttacks) {
            var result = new Map();
            if (!xmlAttacks || xmlAttacks.length === 0) return result;
            var clusters = collectOsmdGraphicClusters(osmdInst);
            var byMeasureClusters = new Map();
            for (var ci = 0; ci < clusters.length; ci += 1) {
              var c = clusters[ci];
              var lst = byMeasureClusters.get(c.measureNumber);
              if (lst) lst.push(c);
              else byMeasureClusters.set(c.measureNumber, [c]);
            }
            byMeasureClusters.forEach(function (list) {
              list.sort(function (a, b) {
                return a.minX - b.minX;
              });
            });
            var attacksByMeasure = groupAttacksByMeasure(xmlAttacks);
            attacksByMeasure.forEach(function (attackList, measure) {
              var clusterList = byMeasureClusters.get(measure) || [];
              var usedCluster = new Set();
              for (var ai = 0; ai < attackList.length; ai += 1) {
                var attack = attackList[ai];
                var targetMidis = (attack.midis || []).slice();
                var foundIdx = -1;
                for (var cj = 0; cj < clusterList.length; cj += 1) {
                  if (usedCluster.has(cj)) continue;
                  if (multisetEqualSorted(clusterList[cj].midis, targetMidis)) {
                    foundIdx = cj;
                    break;
                  }
                }
                if (foundIdx < 0) continue;
                usedCluster.add(foundIdx);
                var cl = clusterList[foundIdx];
                var notes = cl.notes;
                var midis = cl.midis;
                var key = chordOsmdAttackLookupKey(attack.measureNumber, attack.beatStartInMeasure);
                var byMidi = new Map();
                for (var k = 0; k < notes.length; k += 1) {
                  var gn = notes[k];
                  var mm = midis[k];
                  var arr = byMidi.get(mm);
                  if (arr) arr.push(gn);
                  else byMidi.set(mm, [gn]);
                }
                result.set(key, byMidi);
              }
            });
            return result;
          }

          function earTrainingOsmdNoteColorForMidiInstance(phase, instanceIndex, totalForMidi, remainingForMidi) {
            if (phase === 'idle') return COL_DEFAULT;
            if (phase === 'failed') return COL_FAILED;
            if (phase === 'completed') return COL_CORRECT;
            var safeTotal = Math.max(0, totalForMidi);
            var safeRem = Math.max(0, Math.min(safeTotal, remainingForMidi));
            var consumed = safeTotal - safeRem;
            var idx = Math.max(0, instanceIndex);
            if (idx < consumed) return COL_CORRECT;
            return COL_JUDGMENT;
          }

          function clearColoredNotes() {
            for (var i = 0; i < coloredNotes.length; i += 1) {
              var gn = coloredNotes[i];
              if (gn && typeof gn.setColor === 'function') {
                gn.setColor(COL_DEFAULT, OSMD_NOTE_COLORING);
              }
            }
            coloredNotes = [];
          }

          function updateMeasureBand(measureNumber) {
            var mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            var b = measureBoundsByNumber[mn];
            if (!b || typeof b.left !== 'number' || typeof b.right !== 'number') {
              measureBand.style.display = 'none';
              return;
            }
            measureBand.style.display = 'block';
            measureBand.style.left = b.left + 'px';
            measureBand.style.width = Math.max(4, b.right - b.left) + 'px';
          }

          function setHighlightSnapshot(b64) {
            clearColoredNotes();
            if (!b64 || !osmd) return;
            var jsonText;
            try {
              var bin = atob(b64);
              var bytes = new Uint8Array(bin.length);
              for (var u = 0; u < bin.length; u += 1) bytes[u] = bin.charCodeAt(u);
              jsonText = new TextDecoder('utf-8').decode(bytes);
            } catch (_e) {
              return;
            }
            var snap;
            try {
              snap = JSON.parse(jsonText);
            } catch (_e) {
              return;
            }
            var targets = snap && snap.targets ? snap.targets : [];
            var index = attackIndex;
            for (var ti = 0; ti < targets.length; ti += 1) {
              var row = targets[ti];
              var phase = typeof row.phase === 'string' ? row.phase : 'idle';
              if (phase === 'idle' || row.beatOffset === null || row.beatOffset === undefined) continue;
              var key = chordOsmdAttackLookupKey(row.measureNumber, row.beatOffset);
              var byMidi = index.get(key);
              if (!byMidi) continue;
              var totalByMidi = new Map();
              var mc = row.midiCounts || [];
              for (var mi = 0; mi < mc.length; mi += 1) {
                var entry = mc[mi];
                if (entry && typeof entry.midi === 'number') totalByMidi.set(entry.midi, entry.count);
              }
              byMidi.forEach(function (gnotes, midi) {
                var total = totalByMidi.get(midi);
                if (total === undefined) total = 0;
                var remKey = String(midi);
                var rem = row.remainingByMidi && row.remainingByMidi[remKey] !== undefined ? row.remainingByMidi[remKey] : 0;
                for (var gi = 0; gi < gnotes.length; gi += 1) {
                  var gn = gnotes[gi];
                  var color = earTrainingOsmdNoteColorForMidiInstance(phase, gi, total, rem);
                  if (gn && typeof gn.setColor === 'function') {
                    gn.setColor(color, OSMD_NOTE_COLORING);
                    coloredNotes.push(gn);
                  }
                }
              });
            }
          }

          function collectMeasureCentersFromMeasureList(gs, surface, viewportWidth) {
            const boundingWidth = finiteNum(gs && gs.BoundingBox && gs.BoundingBox.width) || 0;
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;
            const out = {};
            const boundsOut = {};
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
                out[measureNumber] = (noteMinX + noteMaxX) / 2;
                boundsOut[measureNumber] = { left: noteMinX, right: noteMaxX };
              } else if (Number.isFinite(measureMinX) && Number.isFinite(measureMaxX)) {
                out[measureNumber] = (measureMinX + measureMaxX) / 2;
                boundsOut[measureNumber] = { left: measureMinX, right: measureMaxX };
              }
            }

            return {
              measureCentersByNumber: out,
              measureBoundsByNumber: boundsOut,
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
              if (Number.isFinite(b.nMin) && Number.isFinite(b.nMax)) {
                out[num] = (b.nMin + b.nMax) / 2;
                boundsOut[num] = { left: b.nMin, right: b.nMax };
              } else if (Number.isFinite(b.mMin) && Number.isFinite(b.mMax)) {
                out[num] = (b.mMin + b.mMax) / 2;
                boundsOut[num] = { left: b.mMin, right: b.mMax };
              }
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
              measureBoundsByNumber = primary.measureBoundsByNumber || {};
              scoreWidth = primary.scoreWidth;
              return;
            }
            const fallback = collectMeasureCentersFromStaffLines(graphicSheet, surface, viewportWidth);
            measureCentersByNumber = fallback.measureCentersByNumber;
            measureBoundsByNumber = fallback.measureBoundsByNumber || {};
            scoreWidth = fallback.scoreWidth;
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

          async function renderMusicXML(xmlText, zoomValue, attacksB64) {
            attackIndex = new Map();
            clearColoredNotes();
            score.replaceChildren();
            measureCentersByNumber = {};
            measureBoundsByNumber = {};
            cssScale = 1;
            scoreWrap.style.transform = 'translate3d(0, -50%, 0) scale(1)';
            scoreWrap.style.width = '';
            score.style.transform = '';
            measureBand.style.display = 'none';
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
              scoreWrap.style.transform = 'translate3d(0, -50%, 0) scale(' + cssScale + ')';
              await new Promise(function (resolve) {
                requestAnimationFrame(resolve);
              });

              measureLayoutFromOsmd();
              scoreWrap.style.width = scoreWidth + 'px';

              var attacks = [];
              if (attacksB64 && typeof attacksB64 === 'string' && attacksB64.length > 0) {
                try {
                  var aBin = atob(attacksB64);
                  var aBytes = new Uint8Array(aBin.length);
                  for (var ai = 0; ai < aBin.length; ai += 1) aBytes[ai] = aBin.charCodeAt(ai);
                  var attacksJson = new TextDecoder('utf-8').decode(aBytes);
                  var parsed = JSON.parse(attacksJson);
                  if (Array.isArray(parsed)) attacks = parsed;
                } catch (_parseErr) {
                  attacks = [];
                }
              }
              if (attacks.length > 0) {
                attackIndex = matchOsmdClustersToXmlAttacks(osmd, attacks);
              } else {
                attackIndex = new Map();
              }

              renderSucceeded = true;
              postOsmdMessage('ready', '');
            } catch (err) {
              const msg = err && err.message ? String(err.message) : String(err);
              status.textContent = 'Could not render MusicXML.';
              postOsmdMessage('error', msg);
              attackIndex = new Map();
              clearColoredNotes();
            } finally {
              if (renderSucceeded) {
                status.style.display = 'none';
              }
            }
          }

          function setActiveMeasure(measureNumber) {
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            updateMeasureBand(mn);
            const dict = measureCentersByNumber;
            const pick = dict && dict[mn];
            const pick1 = dict && dict[1];
            const center =
              typeof pick === 'number' && Number.isFinite(pick)
                ? pick
                : typeof pick1 === 'number' && Number.isFinite(pick1)
                  ? pick1
                  : viewport.clientWidth / 2;
            const maxOffset = Math.max(0, scoreWidth * cssScale - viewport.clientWidth);
            const offset = Math.max(0, Math.min(maxOffset, center * cssScale - viewport.clientWidth / 2));
            scoreWrap.style.transform = 'translate3d(' + (-offset) + 'px, -50%, 0) scale(' + cssScale + ')';
          }

          window.JazzifyOSMD = {
            renderMusicXML,
            setActiveMeasure,
            setHighlightSnapshot,
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
