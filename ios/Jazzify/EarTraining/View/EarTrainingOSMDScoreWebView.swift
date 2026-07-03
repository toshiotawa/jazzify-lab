import SwiftUI
import WebKit
import QuartzCore
import os.log

struct EarTrainingOSMDScoreWebView: UIViewRepresentable {
    /// `WKScriptMessageHandler` と JavaScript で共有する名前（`WKUserContentController` に登録）。
    private static let osmdRenderScriptMessageName = "osmdRender"

    let scoreScrollActive: Bool
    let activeMeasureNumber: Int
    let measureDurationSec: Double
    let musicXMLText: String
    let renderKey: Int
    /// 省略時は小節頭からの従来アニメーション（prop 駆動プレイヘッド）。
    var phraseTimelineSec: Double? = nil
    /// 省略時は overlay 表示状態に追随。
    var playheadAnimating: Bool? = nil
    /// 指定時はプレイヘッドを imperative API で更新し、上記 timeline props は無視する。
    var playheadController: EarTrainingPrecisionBattleController? = nil
    /// OSMD の描画倍率。コンテナ高さを変えずに譜面を縮小する（主に iPhone）。
    let zoom: Double
    /// 小節スクロールのアンカーと 1 小節フィット（精密モード向け）。省略時はリズムバトル既定。
    var scrollLayout: EarTrainingOsmdScrollLayout = .battleDefault
    var scrollMode: EarTrainingOsmdScrollMode = .measureJump
    var countInDurationSec: Double = 0
    var maxOsmdMeasure: Int = 1
    var manualScrollEnabled: Bool = false

    func makeCoordinator() -> Coordinator {
        Coordinator(scrollLayout: scrollLayout, scrollMode: scrollMode)
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
        context.coordinator.attach(webView: webView)
        webView.loadHTMLString(Self.html(for: scrollLayout), baseURL: Bundle.main.bundleURL)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        playheadController?.bindOsmdCoordinator(context.coordinator)
        context.coordinator.configurePlayhead(show: scoreScrollActive)
        context.coordinator.updateScrollConfig(
            scrollMode: scrollMode,
            scrollLayout: scrollLayout,
            countInDurationSec: countInDurationSec,
            maxOsmdMeasure: maxOsmdMeasure
        )
        context.coordinator.updateManualScroll(enabled: manualScrollEnabled)
        context.coordinator.update(
            webView: webView,
            musicXMLText: musicXMLText,
            renderKey: renderKey,
            activeMeasureNumber: activeMeasureNumber,
            measureDurationSec: measureDurationSec,
            phraseTimelineSec: playheadController == nil ? phraseTimelineSec : nil,
            playheadAnimating: playheadController == nil ? playheadAnimating : nil,
            zoom: zoom
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
        private let scrollLayout: EarTrainingOsmdScrollLayout
        private var scrollMode: EarTrainingOsmdScrollMode
        private var countInDurationSec: Double = 0
        private var maxOsmdMeasure: Int = 1
        private var lastScrollMode: EarTrainingOsmdScrollMode?
        private var lastCountInDurationSec: Double?
        private var lastMaxOsmdMeasure: Int?

        init(scrollLayout: EarTrainingOsmdScrollLayout, scrollMode: EarTrainingOsmdScrollMode) {
            self.scrollLayout = scrollLayout
            self.scrollMode = scrollMode
        }

        private weak var webView: WKWebView?
        private var htmlReady = false
        private var isTornDown = false
        private var renderGeneration: Int = 0
        private var pendingMusicXMLText: String?
        private var pendingRenderKey: Int?
        private var pendingMeasureNumber: Int?
        private var pendingMeasureDurationSec: Double = 2
        private var pendingPhraseTimelineSec: Double?
        private var pendingPlayheadAnimating: Bool?
        private var pendingZoom: Double = 1.0
        private var lastRenderedMusicXMLText: String?
        private var lastRenderedKey: Int?
        private var lastRenderedZoom: Double?
        private var lastMeasureNumber: Int?
        private var lastMeasureDurationSec: Double?
        private var lastPhraseTimelineSec: Double?
        private var lastPlayheadAnimating: Bool?
        private var pendingOverlayVisible = false
        private var lastSentOverlayVisible: Bool?
        private var followDisplayLink: CADisplayLink?
        private var pendingFollowTimelineSec: Double?
        private var pendingFollowPlaybackActive = false
        private var pendingFollowQueuedAtMediaTime: CFTimeInterval?
        private var hasPendingFollowAnchor = false
        private var pendingManualScrollEnabled = false
        private var lastSentManualScrollEnabled: Bool?

        func attach(webView: WKWebView) {
            self.webView = webView
        }

        func tearDown() {
            isTornDown = true
            stopFollowDisplayLink()
            renderGeneration += 1
            htmlReady = false
            pendingMusicXMLText = nil
            pendingRenderKey = nil
            pendingMeasureNumber = nil
            lastSentOverlayVisible = nil
            webView?.stopLoading()
            webView = nil
        }

        func configurePlayhead(show: Bool) {
            pendingOverlayVisible = show
            sendOverlayVisibleIfNeeded()
        }

        func updateManualScroll(enabled: Bool) {
            pendingManualScrollEnabled = enabled
            sendManualScrollEnabledIfNeeded()
        }

        private func sendManualScrollEnabledIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            let enabled = pendingManualScrollEnabled
            guard lastSentManualScrollEnabled != enabled else { return }
            lastSentManualScrollEnabled = enabled
            let literal = enabled ? "true" : "false"
            webView.evaluateJavaScript(
                Self.voidWrappedJavaScript(
                    "window.JazzifyOSMD.setManualScrollEnabled(\(literal));"
                ),
                completionHandler: nil
            )
        }

        func updateScrollConfig(
            scrollMode: EarTrainingOsmdScrollMode,
            scrollLayout: EarTrainingOsmdScrollLayout,
            countInDurationSec: Double,
            maxOsmdMeasure: Int
        ) {
            self.scrollMode = scrollMode
            self.countInDurationSec = countInDurationSec
            self.maxOsmdMeasure = max(1, maxOsmdMeasure)
            pendingScrollLayout = scrollLayout
            sendScrollConfigIfNeeded()
        }

        private var pendingScrollLayout: EarTrainingOsmdScrollLayout?

        private func sendScrollConfigIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            var scripts: [String] = []
            if lastScrollMode != scrollMode {
                if scrollMode != .continuousFollow {
                    stopFollowDisplayLink()
                }
                lastScrollMode = scrollMode
                let modeLiteral = scrollMode == .continuousFollow ? "continuousFollow" : "measureJump"
                let layout = pendingScrollLayout ?? scrollLayout
                let playheadLiteral = String(format: "%.10g", Double(layout.playheadPx))
                let anchorLiteral = layout.anchorToMeasureLeft ? "true" : "false"
                let fitLiteral = layout.fitActiveMeasureWidth ? "true" : "false"
                scripts.append(
                    "window.JazzifyOSMD.setScrollMode('\(modeLiteral)', \(playheadLiteral), \(anchorLiteral), \(fitLiteral));"
                )
            }
            if lastCountInDurationSec.map({ abs($0 - countInDurationSec) > 0.000_1 }) ?? true {
                lastCountInDurationSec = countInDurationSec
                scripts.append(
                    "window.JazzifyOSMD.setCountInDurationSec(\(Self.javascriptNumber(countInDurationSec)));"
                )
            }
            if lastMaxOsmdMeasure != maxOsmdMeasure {
                lastMaxOsmdMeasure = maxOsmdMeasure
                scripts.append("window.JazzifyOSMD.setMaxMeasureNumber(\(maxOsmdMeasure));")
            }
            guard !scripts.isEmpty else { return }
            webView.evaluateJavaScript(
                Self.voidWrappedJavaScript(scripts.joined(separator: "\n")),
                completionHandler: nil
            )
        }

        func syncPlayhead(
            phraseTimelineSec: Double,
            activeMeasureNumber: Int,
            measureDurationSec: Double,
            animating: Bool
        ) {
            guard !isTornDown else { return }
            pendingMeasureNumber = activeMeasureNumber
            pendingMeasureDurationSec = measureDurationSec
            guard let webView, htmlReady else {
                pendingPhraseTimelineSec = phraseTimelineSec
                pendingPlayheadAnimating = animating
                return
            }
            var scripts: [String] = []
            if lastMeasureDurationSec.map({ abs($0 - measureDurationSec) > 0.000_1 }) ?? true {
                lastMeasureDurationSec = measureDurationSec
                let durationLiteral = Self.javascriptNumber(measureDurationSec)
                scripts.append("window.JazzifyOSMD.setMeasureDurationSec(\(durationLiteral));")
            }
            let followMode = scrollMode == .continuousFollow
            if followMode {
                if lastMeasureNumber != activeMeasureNumber {
                    lastMeasureNumber = activeMeasureNumber
                }
                lastPhraseTimelineSec = phraseTimelineSec
                lastPlayheadAnimating = animating
                queueFollowTimelineAnchor(phraseTimelineSec, playbackActive: animating)
                if !scripts.isEmpty {
                    let generation = renderGeneration
                    Self.evaluate(
                        scripts.joined(separator: "\n"),
                        on: webView,
                        generation: generation,
                        coordinator: self
                    )
                }
                return
            }
            stopFollowDisplayLink()
            if lastMeasureNumber != activeMeasureNumber {
                lastMeasureNumber = activeMeasureNumber
                scripts.append("window.JazzifyOSMD.setActiveMeasure(\(activeMeasureNumber));")
            }
            let timelineChanged = lastPhraseTimelineSec.map { abs($0 - phraseTimelineSec) > 0.000_1 } ?? true
            let animatingChanged = lastPlayheadAnimating.map { $0 != animating } ?? true
            if timelineChanged || animatingChanged {
                lastPhraseTimelineSec = phraseTimelineSec
                lastPlayheadAnimating = animating
                let timelineLiteral = Self.javascriptNumber(phraseTimelineSec)
                let animatingLiteral = animating ? "true" : "false"
                scripts.append(
                    "window.JazzifyOSMD.setPlayheadTimeline(\(timelineLiteral), \(animatingLiteral));"
                )
            }
            guard !scripts.isEmpty else { return }
            let generation = renderGeneration
            Self.evaluate(
                scripts.joined(separator: "\n"),
                on: webView,
                generation: generation,
                coordinator: self
            )
        }

        private func queueFollowTimelineAnchor(_ timelineSec: Double, playbackActive: Bool) {
            pendingFollowTimelineSec = timelineSec
            pendingFollowPlaybackActive = playbackActive
            pendingFollowQueuedAtMediaTime = CACurrentMediaTime()
            hasPendingFollowAnchor = true
            ensureFollowDisplayLink()
        }

        private func ensureFollowDisplayLink() {
            guard !isTornDown, followDisplayLink == nil else { return }
            let link = CADisplayLink(target: self, selector: #selector(flushFollowTimelineAnchor))
            link.add(to: .main, forMode: .common)
            followDisplayLink = link
        }

        private func stopFollowDisplayLink() {
            followDisplayLink?.invalidate()
            followDisplayLink = nil
            hasPendingFollowAnchor = false
            pendingFollowTimelineSec = nil
            pendingFollowQueuedAtMediaTime = nil
        }

        @objc private func flushFollowTimelineAnchor() {
            guard !isTornDown, let webView, htmlReady else {
                stopFollowDisplayLink()
                return
            }
            guard hasPendingFollowAnchor, let baseTimelineSec = pendingFollowTimelineSec else {
                stopFollowDisplayLink()
                return
            }
            hasPendingFollowAnchor = false
            let playbackActive = pendingFollowPlaybackActive
            var timelineSec = baseTimelineSec
            if playbackActive, let queuedAt = pendingFollowQueuedAtMediaTime {
                let elapsed = CACurrentMediaTime() - queuedAt
                if elapsed.isFinite, elapsed > 0 {
                    timelineSec += elapsed
                }
            }
            pendingFollowQueuedAtMediaTime = nil
            let timelineLiteral = Self.javascriptNumber(timelineSec)
            let activeLiteral = playbackActive ? "true" : "false"
            webView.evaluateJavaScript(
                Self.voidWrappedJavaScript(
                    "window.JazzifyOSMD.setFollowTimelineAnchor(\(timelineLiteral), \(activeLiteral));"
                ),
                completionHandler: nil
            )
        }

        /// 可視状態が変わったときだけ JS へ反映。非同期 render 完了後は `resyncOverlayAfterRender` から再適用する。
        private func sendOverlayVisibleIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            let show = pendingOverlayVisible
            guard lastSentOverlayVisible != show else { return }
            lastSentOverlayVisible = show
            let visible = show ? "true" : "false"
            webView.evaluateJavaScript(
                "void (window.JazzifyOSMD && window.JazzifyOSMD.setScoreOverlayVisible(\(visible)));",
                completionHandler: nil
            )
        }

        /// renderMusicXML の .then 後、開始時にキャプチャした overlay ではなく現在の pending を反映する。
        private func resyncOverlayAfterRender(webView: WKWebView) {
            guard !isTornDown, htmlReady else { return }
            lastSentOverlayVisible = nil
            sendOverlayVisibleIfNeeded()
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
            case "setupComplete":
                guard let webView else { return }
                resyncOverlayAfterRender(webView: webView)
            case "error":
                Log.osmd.error("OSMD score render error: \(detail, privacy: .public)")
            default:
                Log.osmd.debug("OSMD score message type=\(type, privacy: .public)")
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
            guard !isTornDown else { return }
            htmlReady = true
            lastScrollMode = nil
            lastCountInDurationSec = nil
            lastMaxOsmdMeasure = nil
            sendScrollConfigIfNeeded()
            lastSentManualScrollEnabled = nil
            sendManualScrollEnabledIfNeeded()
            flushPending(webView: webView)
        }

        func update(
            webView: WKWebView,
            musicXMLText: String,
            renderKey: Int,
            activeMeasureNumber: Int,
            measureDurationSec: Double,
            phraseTimelineSec: Double?,
            playheadAnimating: Bool?,
            zoom: Double
        ) {
            guard !isTornDown else { return }
            pendingMusicXMLText = musicXMLText
            pendingRenderKey = renderKey
            pendingMeasureNumber = activeMeasureNumber
            pendingMeasureDurationSec = measureDurationSec
            pendingPhraseTimelineSec = phraseTimelineSec
            pendingPlayheadAnimating = playheadAnimating
            pendingZoom = zoom
            guard htmlReady else { return }
            flushPending(webView: webView)
        }

        private func flushPending(webView: WKWebView) {
            guard !isTornDown, htmlReady else { return }
            guard let xml = pendingMusicXMLText,
                  let key = pendingRenderKey,
                  let measure = pendingMeasureNumber else { return }
            let nextZoom = pendingZoom
            let nextMeasureDurationSec = pendingMeasureDurationSec
            let needsRender = lastRenderedMusicXMLText != xml
                || lastRenderedKey != key
                || lastRenderedZoom.map { abs($0 - nextZoom) > 0.000_1 } ?? true
            if needsRender {
                renderGeneration += 1
                let generation = renderGeneration
                lastRenderedMusicXMLText = xml
                lastRenderedKey = key
                lastRenderedZoom = nextZoom
                lastMeasureNumber = measure
                lastMeasureDurationSec = nextMeasureDurationSec
                let literal = Self.javaScriptStringLiteral(xml)
                let z = Self.javascriptNumber(nextZoom)
                let durationLiteral = Self.javascriptNumber(nextMeasureDurationSec)
                let script = """
                void window.JazzifyOSMD.renderMusicXML(\(literal), \(z)).then(function() {
                  window.JazzifyOSMD.setMeasureDurationSec(\(durationLiteral));
                  window.JazzifyOSMD.setActiveMeasure(\(measure));
                  try {
                    var handler =
                      window.webkit &&
                      window.webkit.messageHandlers &&
                      window.webkit.messageHandlers.osmdRender;
                    if (handler) {
                      handler.postMessage({ type: 'setupComplete', detail: '' });
                    }
                  } catch (_e) {
                    /* no-op */
                  }
                });
                """
                Self.evaluate(
                    script,
                    on: webView,
                    generation: generation,
                    coordinator: self
                )
                return
            }
            var scripts: [String] = []
            if lastMeasureDurationSec.map({ abs($0 - nextMeasureDurationSec) > 0.000_1 }) ?? true {
                lastMeasureDurationSec = nextMeasureDurationSec
                let durationLiteral = Self.javascriptNumber(nextMeasureDurationSec)
                scripts.append("window.JazzifyOSMD.setMeasureDurationSec(\(durationLiteral));")
            }
            if lastMeasureNumber != measure {
                lastMeasureNumber = measure
                scripts.append("window.JazzifyOSMD.setActiveMeasure(\(measure));")
            }
            if let timelineSec = pendingPhraseTimelineSec,
               let animating = pendingPlayheadAnimating {
                let timelineChanged = lastPhraseTimelineSec.map { abs($0 - timelineSec) > 0.000_1 } ?? true
                let animatingChanged = lastPlayheadAnimating.map { $0 != animating } ?? true
                if timelineChanged || animatingChanged {
                    lastPhraseTimelineSec = timelineSec
                    lastPlayheadAnimating = animating
                    let timelineLiteral = Self.javascriptNumber(timelineSec)
                    let animatingLiteral = animating ? "true" : "false"
                    scripts.append(
                        "window.JazzifyOSMD.setPlayheadTimeline(\(timelineLiteral), \(animatingLiteral));"
                    )
                }
            }
            guard !scripts.isEmpty else { return }
            let generation = renderGeneration
            Self.evaluate(
                scripts.joined(separator: "\n"),
                on: webView,
                generation: generation,
                coordinator: self
            )
        }

        /// WKWebView は Promise 等を Swift に返せず Code=5 になるため、式の評価結果を void に潰す。
        private static func voidWrappedJavaScript(_ script: String) -> String {
            """
            (function() {
            \(script)
            })();
            """
        }

        private static func evaluate(
            _ script: String,
            on webView: WKWebView,
            generation: Int,
            coordinator: Coordinator,
            onSuccess: ((Coordinator) -> Void)? = nil
        ) {
            guard !coordinator.isTornDown, coordinator.renderGeneration == generation else { return }
            webView.evaluateJavaScript(voidWrappedJavaScript(script)) { _, error in
                if let error {
                    guard !coordinator.isTornDown, coordinator.renderGeneration == generation else { return }
                    Log.osmd.error("evaluateJavaScript failed: \(String(describing: error), privacy: .public)")
                    return
                }
                guard !coordinator.isTornDown, coordinator.renderGeneration == generation else { return }
                onSuccess?(coordinator)
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

    private static func html(for layout: EarTrainingOsmdScrollLayout) -> String {
        let scrollModeLiteral = layout.scrollMode == .continuousFollow ? "continuousFollow" : "measureJump"
        return htmlTemplate
            .replacingOccurrences(of: "__PLAYHEAD_PX__", with: String(format: "%.10g", Double(layout.playheadPx)))
            .replacingOccurrences(of: "__ANCHOR_TO_MEASURE_LEFT__", with: layout.anchorToMeasureLeft ? "true" : "false")
            .replacingOccurrences(of: "__FIT_ACTIVE_MEASURE_WIDTH__", with: layout.fitActiveMeasureWidth ? "true" : "false")
            .replacingOccurrences(of: "__SCROLL_MODE__", with: scrollModeLiteral)
            .replacingOccurrences(
                of: "__MIN_FIT_SCALE__",
                with: String(format: "%.10g", Double(EarTrainingOsmdScoreScroll.precisionMinFitScale))
            )
    }

    private static let htmlTemplate = """
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
        #measure-highlight {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 0;
          background: transparent;
          pointer-events: none;
          z-index: 9;
          display: none;
          overflow: hidden;
        }
        #measure-playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 2px;
          background: rgba(255, 0, 0, 0.95);
          pointer-events: none;
          z-index: 10;
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
        <div id="measure-highlight"></div>
        <div id="measure-playhead"></div>
        <div id="score"></div>
        <div id="status">Loading OSMD...</div>
      </div>
      <script>
        (function() {
          const viewport = document.getElementById('viewport');
          const score = document.getElementById('score');
          const status = document.getElementById('status');
          let PLAYHEAD_PX = __PLAYHEAD_PX__;
          let ANCHOR_TO_MEASURE_LEFT = __ANCHOR_TO_MEASURE_LEFT__;
          let FIT_ACTIVE_MEASURE_WIDTH = __FIT_ACTIVE_MEASURE_WIDTH__;
          const MIN_FIT_SCALE = __MIN_FIT_SCALE__;
          let scrollMode = '__SCROLL_MODE__';
          let osmd = null;
          let measureCentersByNumber = {};
          let measureBoundsByNumber = {};
          let scoreWidth = 0;
          let cssScale = 1;
          let effectiveScale = 1;
          let overlayVisible = false;
          let activeMeasureNumber = 1;
          let currentScrollOffset = 0;
          let measureDurationSec = 2;
          let countInDurationSec = 0;
          let maxMeasureNumber = 1;
          let manualScrollEnabled = false;
          let manualScrollOffsetPx = 0;
          let manualDragActive = false;
          let manualDragStartClientX = 0;
          let manualDragStartOffsetPx = 0;

          function isFollowMode() {
            return scrollMode === 'continuousFollow';
          }

          function finiteNum(value) {
            return typeof value === 'number' && Number.isFinite(value) ? value : null;
          }

          function resolveOsmdLayoutScaleFactor() {
            const zoomRaw = osmd && (osmd.Zoom !== undefined ? osmd.Zoom : osmd.zoom);
            const zoom = finiteNum(zoomRaw);
            const safeZoom = zoom !== null && zoom > 0 ? zoom : 1;
            return 10 * safeZoom;
          }

          const OSMD_PLACEMENT_BELOW = 1;
          const PENDING_DEFAULT_Y_KEY = '__earTrainingPendingDefaultYXml';

          function resolveDefaultYLaneY(defaultYXml, yOffset) {
            return -defaultYXml / 10 + (yOffset || 0);
          }

          function staffLineHasMultiExpression(staffLine, multiExpression) {
            const exprs = staffLine && staffLine.AbstractExpressions;
            if (!Array.isArray(exprs)) {
              return false;
            }
            for (let i = 0; i < exprs.length; i += 1) {
              if (exprs[i] && exprs[i].sourceMultiExpression === multiExpression) {
                return true;
              }
            }
            return false;
          }

          function enableEarTrainingOsmdWordsLayoutRules(osmdInst) {
            const rules = osmdInst && (osmdInst.EngravingRules || osmdInst.rules);
            if (!rules) {
              return;
            }
            rules.PlaceWordsInsideStafflineFromXml = true;
          }

          function createFixedDefaultYLabel(
            calculator,
            osmdLib,
            staffLine,
            relativePosition,
            text,
            fontStyle,
            placement,
            fontHeight,
            textAlignment,
            spacing
          ) {
            const rules = calculator.rules;
            const LabelCtor = osmdLib.Label;
            const GraphicalLabelCtor = osmdLib.GraphicalLabel;
            const PointF2DCtor = osmdLib.PointF2D;
            const TextAlignmentEnum = osmdLib.TextAlignmentEnum;
            const label = new LabelCtor(text, textAlignment);
            label.fontStyle = fontStyle;
            label.fontHeight = fontHeight;
            const graphicalLabel = new GraphicalLabelCtor(
              label,
              fontHeight,
              label.textAlignment,
              rules,
              staffLine.PositionAndShape
            );
            const marginScale = 1.1;
            if (placement === OSMD_PLACEMENT_BELOW) {
              graphicalLabel.Label.textAlignment = TextAlignmentEnum.LeftTop;
            }
            graphicalLabel.setLabelPositionAndShapeBorders();
            graphicalLabel.PositionAndShape.BorderMarginBottom *= marginScale;
            graphicalLabel.PositionAndShape.BorderMarginTop *= marginScale;
            graphicalLabel.PositionAndShape.BorderMarginLeft *= marginScale;
            graphicalLabel.PositionAndShape.BorderMarginRight *= marginScale;

            let xPos = relativePosition.x;
            let left = xPos + graphicalLabel.PositionAndShape.BorderMarginLeft;
            let right = xPos + graphicalLabel.PositionAndShape.BorderMarginRight;
            const staffWidth =
              staffLine.PositionAndShape && staffLine.PositionAndShape.Size
                ? staffLine.PositionAndShape.Size.width
                : 0;
            const measureRightMargin = rules.MeasureRightMargin || 0;
            if (right > staffWidth && staffWidth > 0) {
              right = staffWidth - measureRightMargin;
              const marginWidth = graphicalLabel.PositionAndShape.MarginSize
                ? graphicalLabel.PositionAndShape.MarginSize.width
                : 0;
              xPos =
                right -
                marginWidth -
                graphicalLabel.PositionAndShape.BorderMarginLeft;
              left = xPos + graphicalLabel.PositionAndShape.BorderMarginLeft;
              right = xPos + graphicalLabel.PositionAndShape.BorderMarginRight;
            }

            const pendingDefaultY = calculator[PENDING_DEFAULT_Y_KEY];
            const defaultYXml = finiteNum(pendingDefaultY) || 0;
            const yOffset = rules.PlaceWordsInsideStafflineYOffset || 0;
            const y = resolveDefaultYLaneY(defaultYXml, yOffset);
            graphicalLabel.PositionAndShape.RelativePosition = new PointF2DCtor(xPos, y);

            const skyCalc = staffLine.SkyBottomLineCalculator;
            if (skyCalc) {
              const bottom =
                graphicalLabel.PositionAndShape.BorderMarginBottom + y + spacing;
              if (placement === OSMD_PLACEMENT_BELOW) {
                skyCalc.updateBottomLineInRange(left, right, bottom);
              } else {
                const top =
                  graphicalLabel.PositionAndShape.BorderMarginTop + y - spacing;
                skyCalc.updateSkyLineInRange(left, right, top);
              }
            }
            return graphicalLabel;
          }

          function installEarTrainingOsmdWordsLayout(osmdInst) {
            const osmdLib = window.opensheetmusicdisplay;
            const graphicSheet = osmdInst && osmdInst.GraphicSheet;
            const calculator =
              graphicSheet &&
              (graphicSheet.calculator || graphicSheet.GetCalculator);
            if (!calculator || !osmdLib) {
              return;
            }
            if (calculator[PENDING_DEFAULT_Y_KEY] === undefined) {
              calculator[PENDING_DEFAULT_Y_KEY] = null;
            }

            const originalMoodAndUnknown =
              calculator.calculateMoodAndUnknownExpression.bind(calculator);
            const originalCalculateLabel = calculator.calculateLabel.bind(calculator);
            const TextAlignmentEnum = osmdLib.TextAlignmentEnum;

            calculator.calculateLabel = function (
              staffLine,
              relativePosition,
              text,
              fontStyle,
              placement,
              fontHeight,
              textAlignment,
              spacing
            ) {
              const pendingDefaultY = calculator[PENDING_DEFAULT_Y_KEY];
              if (pendingDefaultY === null || pendingDefaultY === undefined) {
                return originalCalculateLabel(
                  staffLine,
                  relativePosition,
                  text,
                  fontStyle,
                  placement,
                  fontHeight,
                  textAlignment,
                  spacing
                );
              }
              return createFixedDefaultYLabel(
                calculator,
                osmdLib,
                staffLine,
                relativePosition,
                text,
                fontStyle,
                placement,
                fontHeight,
                textAlignment || TextAlignmentEnum.CenterBottom,
                spacing || 0
              );
            };

            calculator.calculateMoodAndUnknownExpression = function (
              multiExpression,
              measureIndex,
              staffIndex
            ) {
              const measureRow = calculator.graphicalMusicSheet.MeasureList[measureIndex];
              const graphicMeasure = measureRow && measureRow[staffIndex];
              const staffLine = graphicMeasure && graphicMeasure.ParentStaffLine;
              if (!staffLine) {
                return;
              }
              const moodCount =
                multiExpression.MoodList && multiExpression.MoodList.length
                  ? multiExpression.MoodList.length
                  : 0;
              const unknownCount =
                multiExpression.UnknownList && multiExpression.UnknownList.length
                  ? multiExpression.UnknownList.length
                  : 0;
              if (moodCount === 0 && unknownCount === 0) {
                return;
              }
              if (staffLineHasMultiExpression(staffLine, multiExpression)) {
                return;
              }
              const unknownList = multiExpression.UnknownList || [];
              const defaultYXml =
                unknownList[0] && unknownList[0].defaultYXml !== undefined
                  ? unknownList[0].defaultYXml
                  : null;
              const useFixedDefaultY =
                typeof defaultYXml === 'number' &&
                Number.isFinite(defaultYXml) &&
                defaultYXml < 0;
              if (useFixedDefaultY) {
                calculator[PENDING_DEFAULT_Y_KEY] = defaultYXml;
              }
              try {
                originalMoodAndUnknown(multiExpression, measureIndex, staffIndex);
              } finally {
                calculator[PENDING_DEFAULT_Y_KEY] = null;
              }
            };
          }

          function readMeasureList(osmdInst) {
            const gs = osmdInst && osmdInst.GraphicSheet;
            if (!gs) return [];
            const raw = gs.MeasureList || gs.measureList;
            return Array.isArray(raw) ? raw : [];
          }

          function assignMeasureLayout(measureNumber, noteMinX, noteMaxX, measureMinX, measureMaxX, centers, bounds) {
            const left = Number.isFinite(measureMinX) ? measureMinX : noteMinX;
            const right = Number.isFinite(measureMaxX) ? measureMaxX : noteMaxX;
            if (!Number.isFinite(left) || !Number.isFinite(right)) {
              return;
            }
            centers[measureNumber] = (left + right) / 2;
            const entry = { left: left, right: right };
            if (Number.isFinite(noteMinX)) {
              entry.noteLeft = noteMinX;
            }
            if (Number.isFinite(noteMaxX)) {
              entry.noteRight = noteMaxX;
            }
            bounds[measureNumber] = entry;
          }

          function resolveGraphicMeasureNumber(measure, fallbackOrdinal) {
            const direct = finiteNum(measure.MeasureNumber);
            if (direct !== null && direct > 0) {
              return Math.floor(direct);
            }
            const src =
              measure.parentSourceMeasure &&
              finiteNum(measure.parentSourceMeasure.MeasureNumber);
            if (src !== null && src > 0) {
              return Math.floor(src);
            }
            return fallbackOrdinal;
          }

          function mergeMeasureBoundsEntry(entry, noteMinX, noteMaxX, measureMinX, measureMaxX) {
            const left = Number.isFinite(measureMinX) ? measureMinX : noteMinX;
            const right = Number.isFinite(measureMaxX) ? measureMaxX : noteMaxX;
            if (!Number.isFinite(left) || !Number.isFinite(right)) {
              return;
            }
            entry.left = Math.min(entry.left, left);
            entry.right = Math.max(entry.right, right);
            if (Number.isFinite(noteMinX)) {
              entry.noteLeft =
                entry.noteLeft === undefined ? noteMinX : Math.min(entry.noteLeft, noteMinX);
            }
            if (Number.isFinite(noteMaxX)) {
              entry.noteRight =
                entry.noteRight === undefined ? noteMaxX : Math.max(entry.noteRight, noteMaxX);
            }
          }

          function collectMeasureCentersFromMeasureList(gs, surface, viewportWidth) {
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const scaleFactor = resolveOsmdLayoutScaleFactor();
            const centers = {};
            const bounds = {};
            let maxX = 0;

            const list = readMeasureList({ GraphicSheet: gs });
            let measureOrdinal = 0;
            for (let measureIndex = 0; measureIndex < list.length; measureIndex += 1) {
              const row = list[measureIndex] || [];
              const measures = row.filter(Boolean);
              if (measures.length === 0) continue;

              measureOrdinal += 1;
              const measureNumber = resolveGraphicMeasureNumber(measures[0], measureOrdinal);

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
                const existing = bounds[measureNumber];
                if (existing) {
                  mergeMeasureBoundsEntry(existing, noteMinX, noteMaxX, measureMinX, measureMaxX);
                  centers[measureNumber] = (existing.left + existing.right) / 2;
                } else {
                  assignMeasureLayout(measureNumber, noteMinX, noteMaxX, measureMinX, measureMaxX, centers, bounds);
                }
              } else if (Number.isFinite(measureMinX) && Number.isFinite(measureMaxX)) {
                const existing = bounds[measureNumber];
                if (existing) {
                  mergeMeasureBoundsEntry(existing, noteMinX, noteMaxX, measureMinX, measureMaxX);
                  centers[measureNumber] = (existing.left + existing.right) / 2;
                } else {
                  assignMeasureLayout(measureNumber, noteMinX, noteMaxX, measureMinX, measureMaxX, centers, bounds);
                }
              }
            }

            return {
              measureCentersByNumber: centers,
              measureBoundsByNumber: bounds,
              scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
            };
          }

          function collectMeasureCentersFromStaffLines(gs, surface, viewportWidth) {
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const scaleFactor = resolveOsmdLayoutScaleFactor();
            const byNumberBounds = {};
            let maxX = 0;

            const pages = (gs && gs.MusicPages) || [];

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
                if (staffLines.length === 0) continue;
                let measureCount = 0;
                for (let li = 0; li < staffLines.length; li += 1) {
                  const len = (staffLines[li].Measures || []).length;
                  if (len > measureCount) measureCount = len;
                }
                for (let mi = 0; mi < measureCount; mi += 1) {
                  const mn = mi + 1;
                  const b = ensureBounds(mn);
                  for (let li = 0; li < staffLines.length; li += 1) {
                    const measure = (staffLines[li].Measures || [])[mi];
                    if (!measure) continue;

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

          function resolveScrollAnchorX(bounds, measureNumber) {
            if (bounds) {
              if (ANCHOR_TO_MEASURE_LEFT) {
                return bounds.left;
              }
              if (Number.isFinite(bounds.noteLeft)) {
                return bounds.noteLeft;
              }
              return bounds.left;
            }
            return measureCentersByNumber[measureNumber]
              || measureCentersByNumber[1]
              || viewport.clientWidth / 2;
          }

          function computeEffectiveScale(measureNumber) {
            if (!FIT_ACTIVE_MEASURE_WIDTH) {
              return cssScale;
            }
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            const bounds = measureBoundsByNumber[mn] || measureBoundsByNumber[1];
            if (!bounds) {
              return cssScale;
            }
            const measureWidth = bounds.right - bounds.left;
            if (!Number.isFinite(measureWidth) || measureWidth <= 0 || cssScale <= 0) {
              return cssScale;
            }
            const viewportWidth = viewport.clientWidth || 0;
            if (viewportWidth <= 0) {
              return cssScale;
            }
            const fitScale = viewportWidth / (measureWidth * cssScale);
            const clampedFit = Math.min(1, Math.max(MIN_FIT_SCALE, fitScale));
            return cssScale * clampedFit;
          }

          function refreshEffectiveScale(measureNumber) {
            effectiveScale = computeEffectiveScale(measureNumber);
          }

          function snapLayoutPx(value) {
            const dpr = window.devicePixelRatio || 1;
            return Math.round(value * dpr) / dpr;
          }

          function maxScrollOffsetPx() {
            return Math.max(0, scoreWidth * effectiveScale - (viewport.clientWidth || 0));
          }

          function applyScoreTransform(scrollOffset) {
            const totalOffset = scrollOffset + manualScrollOffsetPx;
            const snapped = snapLayoutPx(totalOffset);
            score.style.transform = 'translate3d(' + (-snapped) + 'px, -50%, 0) scale(' + effectiveScale + ')';
          }

          function computeScrollOffset(measureNumber) {
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            const bounds = measureBoundsByNumber[mn] || measureBoundsByNumber[1];
            const xPos = resolveScrollAnchorX(bounds, mn);
            const viewportWidth = viewport.clientWidth || 0;
            refreshEffectiveScale(mn);
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

          function relaxOsmdCompactTightSpacingForBattle(osmdInst, xmlText) {
            const rules = osmdInst && (osmdInst.EngravingRules || osmdInst.rules);
            if (!rules) {
              return;
            }
            rules.ClefRightMargin = 1;
            rules.RhythmRightMargin = 2.5;
            rules.VoiceSpacingMultiplierVexflow = 1;
            rules.VoiceSpacingAddendVexflow = 5;
            if (typeof rules.SoftmaxFactorVexFlow === 'number' && rules.SoftmaxFactorVexFlow < 10) {
              rules.SoftmaxFactorVexFlow = 10;
            }
            if (typeof xmlText === 'string' && xmlText.length > 0) {
              const twoStaff = xmlText.match(
                /<staff-layout\\b[^>]*\\bnumber="2"[^>]*>[\\s\\S]*?<staff-distance>(\\d+(?:\\.\\d+)?)<\\/staff-distance>/
              );
              const fallback = twoStaff || xmlText.match(
                /<staff-layout>[\\s\\S]*?<staff-distance>(\\d+(?:\\.\\d+)?)<\\/staff-distance>/
              );
              if (fallback && typeof rules.BetweenStaffDistance === 'number') {
                const tenths = Number.parseFloat(fallback[1]);
                if (Number.isFinite(tenths) && tenths > 0) {
                  const betweenStaff = tenths / 40;
                  rules.BetweenStaffDistance = betweenStaff;
                  if (typeof rules.MinSkyBottomDistBetweenStaves === 'number') {
                    rules.MinSkyBottomDistBetweenStaves = Math.min(rules.MinSkyBottomDistBetweenStaves, betweenStaff);
                  }
                }
              }
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
              drawMeasureNumbers: false,
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
            resetManualScroll();
            cancelFollowRaf();
            score.replaceChildren();
            measureCentersByNumber = {};
            measureBoundsByNumber = {};
            cssScale = 1;
            currentScrollOffset = 0;
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
              enableEarTrainingOsmdWordsLayoutRules(osmd);
              osmd.zoom = z;
              await osmd.load(displayXml);
              relaxOsmdCompactTightSpacingForBattle(osmd, displayXml);
              installEarTrainingOsmdWordsLayout(osmd);
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
              refreshEffectiveScale(activeMeasureNumber);
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

          function countInPlayheadProgress(timelineSec) {
            if (timelineSec >= 0 || countInDurationSec <= 0) {
              return 0;
            }
            return Math.max(0, Math.min(1, (timelineSec + countInDurationSec) / countInDurationSec));
          }

          function measureNumberAndProgress(timelineSec) {
            const safeDur = Math.max(1e-6, measureDurationSec);
            const clampedTime = Math.max(0, timelineSec);
            const rawMeasure = Math.floor(clampedTime / safeDur) + 1;
            const measureNumber = Math.max(1, Math.min(maxMeasureNumber, rawMeasure));
            const timeInMeasure = clampedTime - (measureNumber - 1) * safeDur;
            const progress = Math.max(0, Math.min(1, timeInMeasure / safeDur));
            return { measureNumber: measureNumber, progress: progress };
          }

          function continuousScoreX(measureNumber, progress) {
            const bounds = measureBoundsByNumber[measureNumber] || measureBoundsByNumber[1];
            if (!bounds) {
              return 0;
            }
            const measureWidth = bounds.right - bounds.left;
            if (!Number.isFinite(measureWidth) || measureWidth <= 0) {
              return bounds.left;
            }
            return bounds.left + Math.max(0, Math.min(1, progress)) * measureWidth;
          }

          function computeContinuousFollowState(timelineSec) {
            const viewportWidth = viewport.clientWidth || 0;
            refreshEffectiveScale(1);
            const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);

            if (timelineSec < 0 && countInDurationSec > 0) {
              return {
                phase: 'countIn',
                scrollOffset: 0,
                measureNumber: 1,
                progress: countInPlayheadProgress(timelineSec),
                playheadScreenX: null
              };
            }

            const mp = measureNumberAndProgress(timelineSec);
            const xPos = continuousScoreX(mp.measureNumber, mp.progress);
            const rawOffset = xPos * effectiveScale - PLAYHEAD_PX;
            const clampedOffset = Math.max(0, Math.min(maxOffset, rawOffset));

            if (clampedOffset < maxOffset - 0.001) {
              return {
                phase: 'scrolling',
                scrollOffset: clampedOffset,
                measureNumber: mp.measureNumber,
                progress: mp.progress,
                xPos: xPos,
                playheadScreenX: PLAYHEAD_PX
              };
            }

            return {
              phase: 'tail',
              scrollOffset: maxOffset,
              measureNumber: mp.measureNumber,
              progress: mp.progress,
              xPos: xPos,
              playheadScreenX: xPos * effectiveScale - maxOffset
            };
          }

          function measureHighlightGeometry(measureNumber) {
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            const bounds = measureBoundsByNumber[mn] || measureBoundsByNumber[1];
            if (!bounds || !Number.isFinite(bounds.left) || !Number.isFinite(bounds.right)) {
              return null;
            }
            const measureWidth = bounds.right - bounds.left;
            if (!Number.isFinite(measureWidth) || measureWidth <= 0) {
              return null;
            }
            const highlightWidthPx = measureWidth * effectiveScale;
            const highlightLeftPx = bounds.left * effectiveScale - currentScrollOffset - manualScrollOffsetPx;
            return {
              leftPx: highlightLeftPx,
              widthPx: highlightWidthPx
            };
          }

          function applyContinuousFollow(timelineSec) {
            const state = computeContinuousFollowState(timelineSec);
            activeMeasureNumber = state.measureNumber;
            currentScrollOffset = state.scrollOffset;
            applyScoreTransform(currentScrollOffset);
            updateMeasureHighlightForFollow(state);
          }

          function updateMeasureHighlightForFollow(state) {
            const highlight = document.getElementById('measure-highlight');
            const playhead = document.getElementById('measure-playhead');
            if (!highlight || !playhead || !overlayVisible) {
              if (highlight) {
                highlight.style.display = 'none';
              }
              return;
            }
            const geometry = measureHighlightGeometry(state.measureNumber);
            if (!geometry) {
              highlight.style.display = 'none';
              return;
            }
            highlight.style.left = snapLayoutPx(geometry.leftPx) + 'px';
            highlight.style.width = snapLayoutPx(geometry.widthPx) + 'px';
            highlight.style.display = 'block';

            playhead.style.transition = 'none';
            let playheadX = PLAYHEAD_PX;
            if (state.phase === 'countIn') {
              playheadX = geometry.leftPx + state.progress * geometry.widthPx;
            } else if (state.phase === 'tail') {
              playheadX = state.playheadScreenX;
            }
            if (state.phase === 'scrolling' || state.phase === 'tail') {
              playheadX -= manualScrollOffsetPx;
            }
            playhead.style.left = snapLayoutPx(playheadX) + 'px';
          }

          function updateMeasureHighlight() {
            const highlight = document.getElementById('measure-highlight');
            if (!highlight) {
              return;
            }
            if (!overlayVisible) {
              highlight.style.display = 'none';
              return;
            }
            if (isFollowMode() && playheadTimelineConfigured) {
              ensureFollowRaf();
              return;
            }
            const geometry = measureHighlightGeometry(activeMeasureNumber);
            if (!geometry) {
              highlight.style.display = 'none';
              return;
            }
            highlight.style.left = geometry.leftPx + 'px';
            highlight.style.width = geometry.widthPx + 'px';
            highlight.style.display = 'block';
            updatePlayheadPosition(geometry.leftPx, geometry.widthPx);
          }

          let phraseTimelineSec = 0;
          let playheadAnimating = false;
          let playheadTimelineConfigured = false;
          let followTimelineAnchorSec = 0;
          let followTimelineAnchorPerfMs = 0;
          let followRafId = 0;
          let followPlaybackActive = false;

          function resolveFollowTimelineSec() {
            if (!followPlaybackActive) {
              return followTimelineAnchorSec;
            }
            return followTimelineAnchorSec + (performance.now() - followTimelineAnchorPerfMs) / 1000;
          }

          function cancelFollowRaf() {
            if (followRafId) {
              cancelAnimationFrame(followRafId);
              followRafId = 0;
            }
          }

          function followRafTick() {
            followRafId = 0;
            if (!isFollowMode() || !overlayVisible || !playheadTimelineConfigured) {
              return;
            }
            applyContinuousFollow(resolveFollowTimelineSec());
            followRafId = requestAnimationFrame(followRafTick);
          }

          function ensureFollowRaf() {
            if (!isFollowMode() || !overlayVisible || !playheadTimelineConfigured) {
              cancelFollowRaf();
              return;
            }
            if (followRafId) {
              return;
            }
            followRafId = requestAnimationFrame(followRafTick);
          }

          function setFollowTimelineAnchor(sec, playbackActive) {
            resetManualScroll();
            const parsed = Number.isFinite(Number(sec)) ? Number(sec) : 0;
            const nextPlaybackActive = !!playbackActive;
            const wasPlaybackActive = followPlaybackActive;
            const driftThresholdSec = 0.25;
            const driftBlend = 0.2;

            if (
              nextPlaybackActive &&
              wasPlaybackActive &&
              followTimelineAnchorPerfMs > 0 &&
              playheadTimelineConfigured
            ) {
              const extrapolatedSec = resolveFollowTimelineSec();
              const drift = parsed - extrapolatedSec;
              if (Math.abs(drift) < driftThresholdSec) {
                followTimelineAnchorSec += drift * driftBlend;
              } else {
                followTimelineAnchorSec = parsed;
                followTimelineAnchorPerfMs = performance.now();
              }
            } else {
              followTimelineAnchorSec = parsed;
              followTimelineAnchorPerfMs = performance.now();
            }

            followPlaybackActive = nextPlaybackActive;
            phraseTimelineSec = followTimelineAnchorSec;
            playheadTimelineConfigured = true;
            playheadAnimating = false;
            if (!overlayVisible || !isFollowMode()) {
              return;
            }
            if (!followPlaybackActive) {
              cancelFollowRaf();
              applyContinuousFollow(followTimelineAnchorSec);
              return;
            }
            ensureFollowRaf();
          }

          function computeProgressInMeasure() {
            if (phraseTimelineSec < 0) {
              return countInPlayheadProgress(phraseTimelineSec);
            }
            const mn = Math.max(1, Math.floor(Number(activeMeasureNumber || 1)));
            const safeDur = Math.max(1e-6, measureDurationSec);
            const timeInMeasure = phraseTimelineSec - (mn - 1) * safeDur;
            return Math.max(0, Math.min(1, timeInMeasure / safeDur));
          }

          function updatePlayheadPosition(highlightLeftPx, highlightWidthPx) {
            const playhead = document.getElementById('measure-playhead');
            if (!playhead || !overlayVisible) {
              return;
            }
            const widthPx = Number.isFinite(highlightWidthPx) ? highlightWidthPx : 0;
            const baseLeftPx = Number.isFinite(highlightLeftPx) ? highlightLeftPx : 0;
            if (!playheadTimelineConfigured) {
              restartPlayheadAnimationLegacy(baseLeftPx, widthPx);
              return;
            }
            const progress = computeProgressInMeasure();
            const innerLeftPx = progress * widthPx;
            const inCountInPhase = phraseTimelineSec < 0;
            const animating = playheadAnimating && overlayVisible && !inCountInPhase;
            if (!animating) {
              playhead.style.transition = 'none';
              playhead.style.left = (baseLeftPx + innerLeftPx) + 'px';
              return;
            }
            const safeDur = Math.max(1e-6, measureDurationSec);
            const remainingMs = Math.max(100, (1 - progress) * safeDur * 1000);
            playhead.style.transition = 'none';
            playhead.style.left = (baseLeftPx + innerLeftPx) + 'px';
            void playhead.offsetWidth;
            requestAnimationFrame(function () {
              playhead.style.transition = 'left ' + remainingMs + 'ms linear';
              playhead.style.left = (baseLeftPx + widthPx) + 'px';
            });
          }

          function restartPlayheadAnimationLegacy(highlightLeftPx, highlightWidthPx) {
            const playhead = document.getElementById('measure-playhead');
            if (!playhead || !overlayVisible) {
              return;
            }
            const widthPx = Number.isFinite(highlightWidthPx) ? highlightWidthPx : 0;
            const baseLeftPx = Number.isFinite(highlightLeftPx) ? highlightLeftPx : 0;
            const durationMs = Math.max(100, measureDurationSec * 1000);
            playhead.style.transition = 'none';
            playhead.style.left = baseLeftPx + 'px';
            void playhead.offsetWidth;
            requestAnimationFrame(function () {
              playhead.style.transition = 'left ' + durationMs + 'ms linear';
              playhead.style.left = (baseLeftPx + widthPx) + 'px';
            });
          }

          function setPlayheadTimeline(sec, animating) {
            resetManualScroll();
            playheadTimelineConfigured = true;
            if (isFollowMode()) {
              setFollowTimelineAnchor(sec, animating);
              return;
            }
            phraseTimelineSec = Number.isFinite(Number(sec)) ? Number(sec) : 0;
            playheadAnimating = !!animating;
            updateMeasureHighlight();
          }

          function setScoreOverlayVisible(show) {
            resetManualScroll();
            overlayVisible = !!show;
            if (!overlayVisible) {
              cancelFollowRaf();
              currentScrollOffset = 0;
              refreshEffectiveScale(activeMeasureNumber);
              applyScoreTransform(0);
            } else if (isFollowMode() && playheadTimelineConfigured) {
              ensureFollowRaf();
            } else {
              currentScrollOffset = computeScrollOffset(activeMeasureNumber);
              applyScoreTransform(currentScrollOffset);
            }
            updateMeasureHighlight();
          }

          function setMeasureDurationSec(sec) {
            const parsed = Number(sec);
            measureDurationSec = Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
          }

          function setCountInDurationSec(sec) {
            const parsed = Number(sec);
            countInDurationSec = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
          }

          function setMaxMeasureNumber(value) {
            const parsed = Math.floor(Number(value || 1));
            maxMeasureNumber = Math.max(1, parsed);
          }

          function setScrollMode(mode, playheadPxValue, anchorToMeasureLeft, fitActiveMeasureWidth) {
            resetManualScroll();
            const nextMode = mode === 'continuousFollow' ? 'continuousFollow' : 'measureJump';
            if (nextMode !== 'continuousFollow') {
              cancelFollowRaf();
            }
            scrollMode = nextMode;
            if (typeof playheadPxValue === 'number' && Number.isFinite(playheadPxValue)) {
              PLAYHEAD_PX = playheadPxValue;
            }
            if (typeof anchorToMeasureLeft === 'boolean') {
              ANCHOR_TO_MEASURE_LEFT = anchorToMeasureLeft;
            }
            if (typeof fitActiveMeasureWidth === 'boolean') {
              FIT_ACTIVE_MEASURE_WIDTH = fitActiveMeasureWidth;
            }
            if (overlayVisible && playheadTimelineConfigured && isFollowMode()) {
              ensureFollowRaf();
            } else if (overlayVisible) {
              currentScrollOffset = computeScrollOffset(activeMeasureNumber);
              applyScoreTransform(currentScrollOffset);
              updateMeasureHighlight();
            }
          }

          function setActiveMeasure(measureNumber) {
            resetManualScroll();
            if (isFollowMode()) {
              return;
            }
            activeMeasureNumber = Math.max(1, Math.floor(Number(measureNumber || 1)));
            if (!overlayVisible) {
              currentScrollOffset = 0;
              refreshEffectiveScale(activeMeasureNumber);
              applyScoreTransform(0);
              updateMeasureHighlight();
              return;
            }
            currentScrollOffset = computeScrollOffset(activeMeasureNumber);
            applyScoreTransform(currentScrollOffset);
            updateMeasureHighlight();
          }

          function resetManualScroll() {
            manualDragActive = false;
            if (manualScrollOffsetPx === 0) return;
            manualScrollOffsetPx = 0;
            applyScoreTransform(currentScrollOffset);
          }

          function setManualScrollEnabled(enabled) {
            manualScrollEnabled = !!enabled;
            if (!manualScrollEnabled) {
              resetManualScroll();
              if (isFollowMode() && playheadTimelineConfigured && overlayVisible) {
                applyContinuousFollow(resolveFollowTimelineSec());
              } else {
                updateMeasureHighlight();
              }
            }
          }

          viewport.addEventListener('touchstart', function(event) {
            if (!manualScrollEnabled || event.touches.length !== 1) return;
            manualDragActive = true;
            manualDragStartClientX = event.touches[0].clientX;
            manualDragStartOffsetPx = manualScrollOffsetPx;
          }, { passive: true });

          viewport.addEventListener('touchmove', function(event) {
            if (!manualScrollEnabled || !manualDragActive || event.touches.length !== 1) return;
            event.preventDefault();
            const delta = manualDragStartClientX - event.touches[0].clientX;
            manualScrollOffsetPx = Math.max(
              -currentScrollOffset,
              Math.min(maxScrollOffsetPx() - currentScrollOffset, manualDragStartOffsetPx + delta)
            );
            applyScoreTransform(currentScrollOffset);
            if (isFollowMode() && playheadTimelineConfigured) {
              applyContinuousFollow(resolveFollowTimelineSec());
            } else {
              updateMeasureHighlight();
            }
          }, { passive: false });

          viewport.addEventListener('touchend', function() {
            manualDragActive = false;
          }, { passive: true });

          viewport.addEventListener('touchcancel', function() {
            manualDragActive = false;
          }, { passive: true });

          window.JazzifyOSMD = {
            renderMusicXML,
            setActiveMeasure,
            setMeasureDurationSec,
            setScoreOverlayVisible,
            setPlayheadTimeline,
            setFollowTimelineAnchor,
            setScrollMode,
            setCountInDurationSec,
            setMaxMeasureNumber,
            setManualScrollEnabled
          };
        })();
      </script>
    </body>
    </html>
    """
}

