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
    /// 半音別譜面（練習ループ）。空のときは `musicXMLText` をスロット0として扱う。
    var scoreXmlBySemitone: [Int: String] = [:]
    var activeSemitone: Int = 0
    var loopTransposeDirection: EarTrainingLoopTransposeDirection = .none
    var loopBaseSemitone: Int = 0
    var loopCycleIndex: Int = 0
    var drawMeasureNumbers: Bool = false
    let renderKey: Int
    /// 省略時は小節頭からの従来アニメーション（prop 駆動プレイヘッド）。
    var phraseTimelineSec: Double? = nil
    /// 省略時は overlay 表示状態に追随。
    var playheadAnimating: Bool? = nil
    /// 指定時はプレイヘッドを imperative API で更新し、上記 timeline props は無視する。
    var playheadController: EarTrainingOsmdPlayheadBinding? = nil
    /// OSMD の描画倍率。コンテナ高さを変えずに譜面を縮小する（主に iPhone）。
    let zoom: Double
    /// 小節スクロールのアンカーと 1 小節フィット（精密モード向け）。省略時はリズムバトル既定。
    var scrollLayout: EarTrainingOsmdScrollLayout = .battleDefault
    var countInDurationSec: Double = 0
    var maxOsmdMeasure: Int = 1
    var manualScrollEnabled: Bool = false

    func makeCoordinator() -> Coordinator {
        Coordinator(scrollLayout: scrollLayout)
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
            scrollLayout: scrollLayout,
            countInDurationSec: countInDurationSec,
            maxOsmdMeasure: maxOsmdMeasure
        )
        context.coordinator.updateManualScroll(enabled: manualScrollEnabled)
        context.coordinator.updateDrawMeasureNumbers(drawMeasureNumbers)
        context.coordinator.update(
            webView: webView,
            musicXMLText: musicXMLText,
            scoreXmlBySemitone: scoreXmlBySemitone,
            activeSemitone: activeSemitone,
            loopTransposeDirection: loopTransposeDirection,
            loopBaseSemitone: loopBaseSemitone,
            loopCycleIndex: loopCycleIndex,
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
        private var countInDurationSec: Double = 0
        private var maxOsmdMeasure: Int = 1
        private var lastCountInDurationSec: Double?
        private var lastMaxOsmdMeasure: Int?

        init(scrollLayout: EarTrainingOsmdScrollLayout) {
            self.scrollLayout = scrollLayout
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
        private var pendingManualScrollEnabled = false
        private var lastSentManualScrollEnabled: Bool?
        private var pendingDrawMeasureNumbers = false
        private var lastSentDrawMeasureNumbers: Bool?
        private var pendingScoreXmlBySemitone: [Int: String] = [:]
        private var pendingActiveSemitone: Int = 0
        private var slotRenderQueue: [Int] = []
        private var readyScoreSlots: Set<Int> = []
        private var slotRenderInFlight = false
        private var slotRenderInFlightSemitone: Int?
        private var lastActivatedSemitone: Int?
        private var lastSlotRenderKey: Int?
        private var pendingZoomForSlots: Double = 1.0
        private var pendingTransposeDirection: EarTrainingLoopTransposeDirection = .none
        private var pendingTransposeBaseSemitone: Int = 0
        private var pendingLoopCycleIndex: Int = 0

        func prepareScoreSlots(
            xmlBySemitone: [Int: String],
            activeSemitone: Int,
            renderKey: Int,
            transposeDirection: EarTrainingLoopTransposeDirection,
            baseSemitone: Int,
            cycleIndex: Int
        ) {
            pendingScoreXmlBySemitone = xmlBySemitone
            pendingActiveSemitone = activeSemitone
            pendingRenderKey = renderKey
            pendingTransposeDirection = transposeDirection
            pendingTransposeBaseSemitone = baseSemitone
            pendingLoopCycleIndex = cycleIndex
            if lastSlotRenderKey != renderKey {
                lastSlotRenderKey = renderKey
                readyScoreSlots.removeAll()
                slotRenderQueue.removeAll()
                slotRenderInFlight = false
                slotRenderInFlightSemitone = nil
                lastActivatedSemitone = nil
                disposeScoreSlotsIfNeeded()
            }
            enqueueScoreSlotPreparation(
                prioritySemitones: prioritizedSlotSemitones(
                    cycleIndex: cycleIndex,
                    direction: transposeDirection,
                    baseSemitone: baseSemitone
                )
            )
            sendActiveScoreSlotIfNeeded()
        }

        func setActiveScoreSlot(semitone: Int) {
            pendingActiveSemitone = semitone
            sendActiveScoreSlotIfNeeded()
        }

        private func prioritizedSlotSemitones(
            cycleIndex: Int,
            direction: EarTrainingLoopTransposeDirection,
            baseSemitone: Int
        ) -> [Int] {
            if direction == .none {
                return [
                    EarTrainingPrecisionLoop.loopSemitoneForCycle(
                        0,
                        direction: direction,
                        baseSemitone: baseSemitone
                    ),
                ]
            }
            var seen = Set<Int>()
            var result: [Int] = []
            for offset in 0...2 {
                let semitone = EarTrainingPrecisionLoop.loopSemitoneForCycle(
                    cycleIndex + offset,
                    direction: direction,
                    baseSemitone: baseSemitone
                )
                if seen.insert(semitone).inserted {
                    result.append(semitone)
                }
            }
            return result
        }

        private func enqueueSlotRenderPriority(_ semitone: Int) {
            slotRenderQueue.removeAll { $0 == semitone }
            slotRenderQueue.insert(semitone, at: 0)
        }

        private func shouldPrepareScoreSlot(_ semitone: Int, available: Set<Int>) -> Bool {
            available.contains(semitone)
                && !readyScoreSlots.contains(semitone)
                && slotRenderInFlightSemitone != semitone
        }

        private func enqueueScoreSlotPreparation(prioritySemitones: [Int]) {
            let available = Set(pendingScoreXmlBySemitone.keys)
            var merged: [Int] = []
            var seen = Set<Int>()

            for semitone in prioritySemitones {
                guard shouldPrepareScoreSlot(semitone, available: available),
                      seen.insert(semitone).inserted else { continue }
                merged.append(semitone)
            }
            for semitone in slotRenderQueue {
                guard shouldPrepareScoreSlot(semitone, available: available),
                      seen.insert(semitone).inserted else { continue }
                merged.append(semitone)
            }
            for semitone in available.sorted() {
                guard shouldPrepareScoreSlot(semitone, available: available),
                      seen.insert(semitone).inserted else { continue }
                merged.append(semitone)
            }
            slotRenderQueue = merged
            processNextScoreSlotRender()
        }

        private func processNextScoreSlotRender() {
            guard !slotRenderInFlight, !slotRenderQueue.isEmpty, let webView, htmlReady, !isTornDown else { return }
            let semitone = slotRenderQueue.removeFirst()
            guard let xml = pendingScoreXmlBySemitone[semitone] else {
                processNextScoreSlotRender()
                return
            }
            slotRenderInFlight = true
            slotRenderInFlightSemitone = semitone
            let generation = renderGeneration
            let literal = Self.javaScriptStringLiteral(xml)
            let z = Self.javascriptNumber(pendingZoomForSlots)
            let semitoneLiteral = semitone
            let script = """
            void window.JazzifyOSMD.prepareScoreSlot(\(semitoneLiteral), \(literal), \(z));
            """
            Self.evaluate(
                script,
                on: webView,
                generation: generation,
                coordinator: self
            )
        }

        private func disposeScoreSlotsIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            webView.evaluateJavaScript(
                Self.voidWrappedJavaScript("window.JazzifyOSMD.disposeScoreSlots();"),
                completionHandler: nil
            )
        }

        private func sendActiveScoreSlotIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            let semitone = pendingActiveSemitone
            guard readyScoreSlots.contains(semitone) else {
                enqueueSlotRenderPriority(semitone)
                processNextScoreSlotRender()
                return
            }
            guard lastActivatedSemitone != semitone else { return }
            lastActivatedSemitone = semitone
            webView.evaluateJavaScript(
                Self.voidWrappedJavaScript("window.JazzifyOSMD.setActiveScoreSlot(\(semitone));"),
                completionHandler: nil
            )
        }

        func updateDrawMeasureNumbers(_ enabled: Bool) {
            pendingDrawMeasureNumbers = enabled
            sendDrawMeasureNumbersIfNeeded()
        }

        private func sendDrawMeasureNumbersIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            let enabled = pendingDrawMeasureNumbers
            guard lastSentDrawMeasureNumbers != enabled else { return }
            lastSentDrawMeasureNumbers = enabled
            let literal = enabled ? "true" : "false"
            webView.evaluateJavaScript(
                Self.voidWrappedJavaScript("window.JazzifyOSMD.setDrawMeasureNumbers(\(literal));"),
                completionHandler: nil
            )
        }

        func attach(webView: WKWebView) {
            self.webView = webView
        }

        func tearDown() {
            isTornDown = true
            renderGeneration += 1
            htmlReady = false
            pendingMusicXMLText = nil
            pendingRenderKey = nil
            pendingMeasureNumber = nil
            lastSentOverlayVisible = nil
            slotRenderQueue.removeAll()
            readyScoreSlots.removeAll()
            slotRenderInFlight = false
            slotRenderInFlightSemitone = nil
            lastActivatedSemitone = nil
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
            scrollLayout: EarTrainingOsmdScrollLayout,
            countInDurationSec: Double,
            maxOsmdMeasure: Int
        ) {
            self.countInDurationSec = countInDurationSec
            self.maxOsmdMeasure = max(1, maxOsmdMeasure)
            pendingScrollLayout = scrollLayout
            sendScrollConfigIfNeeded()
        }

        private var pendingScrollLayout: EarTrainingOsmdScrollLayout?

        private func sendScrollConfigIfNeeded() {
            guard let webView, htmlReady, !isTornDown else { return }
            var scripts: [String] = []
            if let layout = pendingScrollLayout {
                pendingScrollLayout = nil
                let playheadLiteral = String(format: "%.10g", Double(layout.playheadPx))
                let anchorLiteral = layout.anchorToMeasureLeft ? "true" : "false"
                let fitLiteral = layout.fitActiveMeasureWidth ? "true" : "false"
                scripts.append(
                    "window.JazzifyOSMD.setScrollLayout(\(playheadLiteral), \(anchorLiteral), \(fitLiteral));"
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
        private func resyncOverlayAfterRender() {
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
            case "slotReady":
                if let semitone = Int(detail) {
                    readyScoreSlots.insert(semitone)
                    slotRenderInFlight = false
                    slotRenderInFlightSemitone = nil
                    sendActiveScoreSlotIfNeeded()
                    processNextScoreSlotRender()
                }
            case "slotActivated":
                guard webView != nil else { return }
                resyncOverlayAfterRender()
                flushPendingMeasureUpdatesIfReady()
            case "setupComplete":
                guard webView != nil else { return }
                resyncOverlayAfterRender()
            case "error":
                Log.osmd.error("OSMD score render error: \(detail, privacy: .public)")
                slotRenderInFlight = false
                slotRenderInFlightSemitone = nil
                processNextScoreSlotRender()
            default:
                Log.osmd.debug("OSMD score message type=\(type, privacy: .public)")
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
            guard !isTornDown else { return }
            htmlReady = true
            lastCountInDurationSec = nil
            lastMaxOsmdMeasure = nil
            sendScrollConfigIfNeeded()
            lastSentManualScrollEnabled = nil
            sendManualScrollEnabledIfNeeded()
            sendDrawMeasureNumbersIfNeeded()
            if pendingScoreXmlBySemitone.count > 1 {
                prepareScoreSlots(
                    xmlBySemitone: pendingScoreXmlBySemitone,
                    activeSemitone: pendingActiveSemitone,
                    renderKey: pendingRenderKey ?? 0,
                    transposeDirection: pendingTransposeDirection,
                    baseSemitone: pendingTransposeBaseSemitone,
                    cycleIndex: pendingLoopCycleIndex
                )
            } else {
                flushPending(webView: webView)
            }
        }

        func update(
            webView: WKWebView,
            musicXMLText: String,
            scoreXmlBySemitone: [Int: String],
            activeSemitone: Int,
            loopTransposeDirection: EarTrainingLoopTransposeDirection,
            loopBaseSemitone: Int,
            loopCycleIndex: Int,
            renderKey: Int,
            activeMeasureNumber: Int,
            measureDurationSec: Double,
            phraseTimelineSec: Double?,
            playheadAnimating: Bool?,
            zoom: Double
        ) {
            guard !isTornDown else { return }
            pendingMusicXMLText = EarTrainingChordOsmdMusicXmlNormalizer.applyGuideNoteColors(musicXMLText)
            let xmlBySemitone = scoreXmlBySemitone.isEmpty ? [0: musicXMLText] : scoreXmlBySemitone
            xmlBySemitone = xmlBySemitone.mapValues {
                EarTrainingChordOsmdMusicXmlNormalizer.applyGuideNoteColors($0)
            }
            pendingScoreXmlBySemitone = xmlBySemitone
            pendingActiveSemitone = activeSemitone
            pendingTransposeDirection = loopTransposeDirection
            pendingTransposeBaseSemitone = loopBaseSemitone
            pendingLoopCycleIndex = loopCycleIndex
            pendingRenderKey = renderKey
            pendingMeasureNumber = activeMeasureNumber
            pendingMeasureDurationSec = measureDurationSec
            pendingPhraseTimelineSec = phraseTimelineSec
            pendingPlayheadAnimating = playheadAnimating
            pendingZoom = zoom
            pendingZoomForSlots = zoom
            guard htmlReady else { return }

            if pendingScoreXmlBySemitone.count > 1 || !scoreXmlBySemitone.isEmpty {
                prepareScoreSlots(
                    xmlBySemitone: pendingScoreXmlBySemitone,
                    activeSemitone: activeSemitone,
                    renderKey: renderKey,
                    transposeDirection: loopTransposeDirection,
                    baseSemitone: loopBaseSemitone,
                    cycleIndex: loopCycleIndex
                )
                flushPendingMeasureUpdatesIfReady()
                sendActiveScoreSlotIfNeeded()
                return
            }
            flushPending(webView: webView)
        }

        private func flushPendingMeasureUpdatesIfReady() {
            guard let webView, htmlReady, !isTornDown else { return }
            flushPendingMeasureUpdates(webView: webView)
        }

        private func flushPendingMeasureUpdates(webView: WKWebView) {
            guard !isTornDown, htmlReady else { return }
            guard let measure = pendingMeasureNumber else { return }
            var scripts: [String] = []
            let nextMeasureDurationSec = pendingMeasureDurationSec
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
                    if coordinator.slotRenderInFlight {
                        coordinator.slotRenderInFlight = false
                        coordinator.slotRenderInFlightSemitone = nil
                        coordinator.processNextScoreSlotRender()
                    }
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
        let fitWindowEnabled = layout.fitWindow != nil
        let fitWindowMinVisible = layout.fitWindow?.minVisibleMeasures
            ?? EarTrainingOsmdScoreScroll.windowMinVisibleMeasuresIOS
        let fitWindowStep = layout.fitWindow?.stepMeasures
            ?? EarTrainingOsmdScoreScroll.windowStepMeasures
        return htmlTemplate
            .replacingOccurrences(of: "__PLAYHEAD_PX__", with: String(format: "%.10g", Double(layout.playheadPx)))
            .replacingOccurrences(of: "__ANCHOR_TO_MEASURE_LEFT__", with: layout.anchorToMeasureLeft ? "true" : "false")
            .replacingOccurrences(of: "__FIT_ACTIVE_MEASURE_WIDTH__", with: layout.fitActiveMeasureWidth ? "true" : "false")
            .replacingOccurrences(
                of: "__MIN_FIT_SCALE__",
                with: String(format: "%.10g", Double(EarTrainingOsmdScoreScroll.precisionMinFitScale))
            )
            .replacingOccurrences(of: "__FIT_WINDOW_ENABLED__", with: fitWindowEnabled ? "true" : "false")
            .replacingOccurrences(of: "__FIT_WINDOW_MIN_VISIBLE__", with: String(fitWindowMinVisible))
            .replacingOccurrences(of: "__FIT_WINDOW_STEP__", with: String(fitWindowStep))
            .replacingOccurrences(
                of: "__WINDOW_DENSE_FALLBACK_SCALE__",
                with: String(format: "%.10g", Double(EarTrainingOsmdScoreScroll.windowDenseFallbackScale))
            )
            .replacingOccurrences(
                of: "__WINDOW_DENSE_FALLBACK_MEASURES__",
                with: String(EarTrainingOsmdScoreScroll.windowDenseFallbackMeasures)
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
        #score-content {
          position: absolute;
          left: 0;
          top: 50%;
          min-width: 100%;
          transform-origin: left center;
          will-change: transform;
        }
        #score {
          position: relative;
          min-width: 100%;
        }
        #score canvas, #score svg {
          display: block;
          background: transparent !important;
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
        <div id="score-content"></div>
        <div id="status">Loading OSMD...</div>
      </div>
      <script>
        (function() {
          const viewport = document.getElementById('viewport');
          const scoreContent = document.getElementById('score-content');
          const status = document.getElementById('status');
          let score = null;
          let drawMeasureNumbersEnabled = false;
          let slotsBySemitone = {};
          let activeSemitone = 0;
          let PLAYHEAD_PX = __PLAYHEAD_PX__;
          let ANCHOR_TO_MEASURE_LEFT = __ANCHOR_TO_MEASURE_LEFT__;
          let FIT_ACTIVE_MEASURE_WIDTH = __FIT_ACTIVE_MEASURE_WIDTH__;
          const MIN_FIT_SCALE = __MIN_FIT_SCALE__;
          const FIT_WINDOW_ENABLED = __FIT_WINDOW_ENABLED__;
          const FIT_WINDOW_MIN_VISIBLE = __FIT_WINDOW_MIN_VISIBLE__;
          const FIT_WINDOW_STEP = __FIT_WINDOW_STEP__;
          const WINDOW_DENSE_FALLBACK_SCALE = __WINDOW_DENSE_FALLBACK_SCALE__;
          const WINDOW_DENSE_FALLBACK_MEASURES = __WINDOW_DENSE_FALLBACK_MEASURES__;
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
          let precisionWindowStart = 1;

          function finiteNum(value) {
            return typeof value === 'number' && Number.isFinite(value) ? value : null;
          }

          function resolveOsmdLayoutScaleFactorFromOsmd(osmdInst) {
            const zoomRaw = osmdInst && (osmdInst.Zoom !== undefined ? osmdInst.Zoom : osmdInst.zoom);
            const zoom = finiteNum(zoomRaw);
            const safeZoom = zoom !== null && zoom > 0 ? zoom : 1;
            return 10 * safeZoom;
          }

          function resolveOsmdLayoutScaleFactor() {
            return resolveOsmdLayoutScaleFactorFromOsmd(osmd);
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

          function collectMeasureCentersFromMeasureList(gs, surface, viewportWidth, scaleFactor) {
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const layoutScale = typeof scaleFactor === 'number' && Number.isFinite(scaleFactor) && scaleFactor > 0
              ? scaleFactor
              : resolveOsmdLayoutScaleFactor();
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
                  const scaledMeasureX = measureX * layoutScale;
                  measureMinX = Math.min(measureMinX, scaledMeasureX);
                  measureMaxX = Math.max(measureMaxX, scaledMeasureX + measureWidth * layoutScale);
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
                        const sx = nx * layoutScale;
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

          function collectMeasureCentersFromStaffLines(gs, surface, viewportWidth, scaleFactor) {
            const renderedWidth =
              surface && surface.getBoundingClientRect ? surface.getBoundingClientRect().width || 0 : 0;
            const layoutScale = typeof scaleFactor === 'number' && Number.isFinite(scaleFactor) && scaleFactor > 0
              ? scaleFactor
              : resolveOsmdLayoutScaleFactor();
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
                      const smx = measureX * layoutScale;
                      b.mMin = Math.min(b.mMin, smx);
                      b.mMax = Math.max(b.mMax, smx + measureWidth * layoutScale);
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
                            const sx = nx * layoutScale;
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

          function measureLayoutFromOsmdForSlot(slot) {
            const surface = slot.root.querySelector('canvas, svg');
            const graphicSheet = slot.osmd && slot.osmd.GraphicSheet;
            const viewportWidth = viewport.clientWidth || 0;
            if (!graphicSheet) {
              slot.measureCentersByNumber = {};
              slot.measureBoundsByNumber = {};
              slot.scoreWidth = viewportWidth;
              return;
            }
            const scaleFactor = resolveOsmdLayoutScaleFactorFromOsmd(slot.osmd);
            const primary = collectMeasureCentersFromMeasureList(
              graphicSheet,
              surface,
              viewportWidth,
              scaleFactor
            );
            const mnKeys = Object.keys(primary.measureCentersByNumber);
            if (mnKeys.length > 0) {
              slot.measureCentersByNumber = primary.measureCentersByNumber;
              slot.measureBoundsByNumber = primary.measureBoundsByNumber;
              slot.scoreWidth = primary.scoreWidth;
              return;
            }
            const fallback = collectMeasureCentersFromStaffLines(
              graphicSheet,
              surface,
              viewportWidth,
              scaleFactor
            );
            slot.measureCentersByNumber = fallback.measureCentersByNumber;
            slot.measureBoundsByNumber = fallback.measureBoundsByNumber;
            slot.scoreWidth = fallback.scoreWidth;
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

          function computeWindowStartMeasureNumber(measureNumber) {
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            const safeStep = Math.max(1, Math.floor(FIT_WINDOW_STEP || 2));
            return 1 + Math.floor((mn - 1) / safeStep) * safeStep;
          }

          function computeWindowMeasureSpanWidth(windowStart, visibleMeasures) {
            const safeVisible = Math.max(1, Math.floor(visibleMeasures));
            const windowEnd = Math.min(maxMeasureNumber, windowStart + safeVisible - 1);
            const startBounds = measureBoundsByNumber[windowStart];
            const endBounds = measureBoundsByNumber[windowEnd];
            if (!startBounds || !endBounds) {
              return null;
            }
            const width = endBounds.right - startBounds.left;
            if (!Number.isFinite(width) || width <= 0) {
              return null;
            }
            return width;
          }

          function computeWindowFitMultiplier(visibleMeasures) {
            const viewportWidth = viewport.clientWidth || 0;
            if (cssScale <= 0 || viewportWidth <= 0 || maxMeasureNumber <= 0) {
              return 1;
            }
            const safeVisible = Math.max(2, Math.floor(visibleMeasures));
            const safeStep = Math.max(1, Math.floor(FIT_WINDOW_STEP || 2));
            let maxWindowWidth = 0;
            for (let windowStart = 1; windowStart <= maxMeasureNumber; windowStart += safeStep) {
              const spanWidth = computeWindowMeasureSpanWidth(windowStart, visibleMeasures);
              if (spanWidth !== null && spanWidth > maxWindowWidth) {
                maxWindowWidth = spanWidth;
              }
            }
            if (maxWindowWidth <= 0) {
              return 1;
            }
            const fitScale = viewportWidth / (maxWindowWidth * cssScale);
            return Math.min(1, Math.max(MIN_FIT_SCALE, fitScale));
          }

          function computeWindowFitScale() {
            const safeMinVisible = Math.max(2, Math.floor(FIT_WINDOW_MIN_VISIBLE || 4));
            let multiplier = computeWindowFitMultiplier(safeMinVisible);
            if (multiplier < WINDOW_DENSE_FALLBACK_SCALE && safeMinVisible > WINDOW_DENSE_FALLBACK_MEASURES) {
              multiplier = computeWindowFitMultiplier(WINDOW_DENSE_FALLBACK_MEASURES);
            }
            return cssScale * multiplier;
          }

          function computeEffectiveScale(measureNumber) {
            if (FIT_WINDOW_ENABLED) {
              return computeWindowFitScale();
            }
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
            const slot = slotsBySemitone[activeSemitone];
            const totalOffset = scrollOffset + manualScrollOffsetPx;
            const snapped = snapLayoutPx(totalOffset);
            const transform = 'translate3d(' + (-snapped) + 'px, -50%, 0) scale(' + effectiveScale + ')';
            if (slot && slot.wrapper) {
              slot.wrapper.style.transform = transform;
            } else if (scoreContent) {
              scoreContent.style.transform = transform;
            } else if (score) {
              score.style.transform = transform;
            }
          }

          function computeVisibleMeasureCountFromWindowStart(windowStartMeasure, scale) {
            const windowStart = Math.max(1, Math.floor(Number(windowStartMeasure || 1)));
            const startBounds = measureBoundsByNumber[windowStart];
            const viewportWidth = viewport.clientWidth || 0;
            if (!startBounds || viewportWidth <= 0 || scale <= 0) {
              return 1;
            }
            const originX = startBounds.left * scale;
            let count = 0;
            for (let mn = windowStart; mn <= maxMeasureNumber; mn += 1) {
              const bounds = measureBoundsByNumber[mn];
              if (!bounds) {
                break;
              }
              const rightPx = bounds.right * scale - originX;
              if (count > 0 && rightPx > viewportWidth) {
                break;
              }
              count += 1;
            }
            return Math.max(1, count);
          }

          function computeReachEndScrollOffset(measureNumber) {
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            refreshEffectiveScale(mn);
            const viewportWidth = viewport.clientWidth || 0;
            const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
            let windowStart = Math.max(1, Math.floor(precisionWindowStart));
            if (mn < windowStart) {
              windowStart = mn;
            }
            const visibleCount = computeVisibleMeasureCountFromWindowStart(windowStart, effectiveScale);
            const lastVisible = windowStart + visibleCount - 1;
            if (mn >= lastVisible && mn > windowStart) {
              windowStart = mn;
            }
            precisionWindowStart = windowStart;
            const bounds = measureBoundsByNumber[windowStart] || measureBoundsByNumber[1];
            const xPos = bounds && Number.isFinite(bounds.left)
              ? bounds.left
              : (measureCentersByNumber[windowStart]
                || measureCentersByNumber[1]
                || viewportWidth / 2);
            if (windowStart === 1) {
              return 0;
            }
            return Math.max(0, Math.min(maxOffset, xPos * effectiveScale - PLAYHEAD_PX));
          }

          function computeScrollOffset(measureNumber) {
            const mn = Math.max(1, Math.floor(Number(measureNumber || 1)));
            refreshEffectiveScale(mn);
            const viewportWidth = viewport.clientWidth || 0;
            const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
            if (FIT_WINDOW_ENABLED) {
              const windowStart = computeWindowStartMeasureNumber(mn);
              if (windowStart === 1) {
                return 0;
              }
              const bounds = measureBoundsByNumber[windowStart] || measureBoundsByNumber[1];
              const xPos = bounds && Number.isFinite(bounds.left)
                ? bounds.left
                : (measureCentersByNumber[windowStart]
                  || measureCentersByNumber[1]
                  || viewportWidth / 2);
              return Math.max(0, Math.min(maxOffset, xPos * effectiveScale));
            }
            if (FIT_ACTIVE_MEASURE_WIDTH) {
              return computeReachEndScrollOffset(mn);
            }
            const bounds = measureBoundsByNumber[mn] || measureBoundsByNumber[1];
            const xPos = resolveScrollAnchorX(bounds, mn);
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
            let xmlBetweenStaff = null;
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
                  xmlBetweenStaff = tenths / 40;
                }
              }
            }
            if (xmlBetweenStaff !== null && typeof rules.BetweenStaffDistance === 'number') {
              const nextBetweenStaff = Math.max(rules.BetweenStaffDistance, xmlBetweenStaff);
              rules.BetweenStaffDistance = nextBetweenStaff;
              if (typeof rules.MinSkyBottomDistBetweenStaves === 'number') {
                rules.MinSkyBottomDistBetweenStaves = Math.min(
                  rules.MinSkyBottomDistBetweenStaves,
                  nextBetweenStaff
                );
              }
            }
          }

          function createSlotState(semitone) {
            const wrapper = document.createElement('div');
            wrapper.className = 'score-slot-wrapper';
            wrapper.dataset.semitone = String(semitone);
            wrapper.style.position = 'absolute';
            wrapper.style.inset = '0';
            wrapper.style.opacity = '0';
            wrapper.style.pointerEvents = 'none';
            wrapper.setAttribute('aria-hidden', 'true');
            const root = document.createElement('div');
            root.className = 'score-slot-root';
            wrapper.appendChild(root);
            scoreContent.appendChild(wrapper);
            return {
              semitone: semitone,
              wrapper: wrapper,
              root: root,
              osmd: null,
              measureCentersByNumber: {},
              measureBoundsByNumber: {},
              scoreWidth: 0,
              cssScale: 1,
              effectiveScale: 1,
              currentScrollOffset: 0,
              manualScrollOffsetPx: 0,
              precisionWindowStart: 1,
              ready: false,
            };
          }

          function ensureSlot(semitone) {
            if (!slotsBySemitone[semitone]) {
              slotsBySemitone[semitone] = createSlotState(semitone);
            }
            return slotsBySemitone[semitone];
          }

          function bindSlot(slot) {
            if (!slot) return;
            score = slot.root;
            osmd = slot.osmd;
            measureCentersByNumber = slot.measureCentersByNumber;
            measureBoundsByNumber = slot.measureBoundsByNumber;
            scoreWidth = slot.scoreWidth;
            cssScale = slot.cssScale;
            effectiveScale = slot.effectiveScale;
            currentScrollOffset = slot.currentScrollOffset;
            manualScrollOffsetPx = slot.manualScrollOffsetPx;
            precisionWindowStart = slot.precisionWindowStart;
          }

          function persistGlobalsToActiveSlot() {
            const slot = slotsBySemitone[activeSemitone];
            if (!slot) return;
            slot.osmd = osmd;
            slot.measureCentersByNumber = measureCentersByNumber;
            slot.measureBoundsByNumber = measureBoundsByNumber;
            slot.scoreWidth = scoreWidth;
            slot.cssScale = cssScale;
            slot.effectiveScale = effectiveScale;
            slot.currentScrollOffset = currentScrollOffset;
            slot.manualScrollOffsetPx = manualScrollOffsetPx;
            slot.precisionWindowStart = precisionWindowStart;
          }

          function applySlotVisibility() {
            const keys = Object.keys(slotsBySemitone);
            for (let i = 0; i < keys.length; i += 1) {
              const semitone = Number(keys[i]);
              const slot = slotsBySemitone[semitone];
              const isActive = semitone === activeSemitone;
              slot.wrapper.style.opacity = isActive ? '1' : '0';
              slot.wrapper.style.pointerEvents = isActive ? 'auto' : 'none';
              slot.wrapper.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            }
          }

          function disposeScoreSlots() {
            persistGlobalsToActiveSlot();
            const keys = Object.keys(slotsBySemitone);
            for (let i = 0; i < keys.length; i += 1) {
              const slot = slotsBySemitone[keys[i]];
              if (slot && slot.wrapper && slot.wrapper.parentNode) {
                slot.wrapper.parentNode.removeChild(slot.wrapper);
              }
            }
            slotsBySemitone = {};
            score = null;
            osmd = null;
            measureCentersByNumber = {};
            measureBoundsByNumber = {};
            scoreWidth = 0;
            cssScale = 1;
            effectiveScale = 1;
            currentScrollOffset = 0;
            manualScrollOffsetPx = 0;
            precisionWindowStart = 1;
            activeSemitone = 0;
          }

          function setDrawMeasureNumbers(enabled) {
            drawMeasureNumbersEnabled = !!enabled;
          }

          function setActiveScoreSlot(semitone) {
            const slot = slotsBySemitone[semitone];
            if (!slot || !slot.ready) {
              return false;
            }
            if (slotsBySemitone[activeSemitone]) {
              persistGlobalsToActiveSlot();
            }
            activeSemitone = semitone;
            bindSlot(slot);
            applySlotVisibility();
            applyIdleScoreLayout();
            updateMeasureHighlight();
            postOsmdMessage('slotActivated', String(semitone));
            return true;
          }

          async function prepareScoreSlot(semitone, xmlText, zoomValue) {
            const slot = ensureSlot(semitone);
            await renderMusicXMLInternal(xmlText, zoomValue, slot);
            slot.ready = true;
            postOsmdMessage('slotReady', String(semitone));
          }

          function buildOsmd(targetRoot) {
            const ctor = window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay;
            if (!ctor) {
              throw new Error('OpenSheetMusicDisplay missing');
            }
            const osmdInst = new ctor(targetRoot || score, {
              backend: 'svg',
              autoResize: false,
              drawTitle: false,
              drawComposer: false,
              drawLyricist: false,
              drawPartNames: false,
              drawMeasureNumbers: drawMeasureNumbersEnabled,
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
            const rules = osmdInst.EngravingRules || osmdInst.rules;
            if (rules && drawMeasureNumbersEnabled) {
              if (typeof rules.MeasureNumberLabelOffset === 'number') {
                rules.MeasureNumberLabelOffset = 1;
              }
            }
            return osmdInst;
          }

          function measureSurfaceHeightForRoot(root) {
            const surface = root.querySelector('canvas, svg');
            if (!surface) return 0;
            const rect = surface.getBoundingClientRect();
            return rect.height || surface.height || 0;
          }

          async function renderMusicXMLInternal(xmlText, zoomValue, slot) {
            const isBackgroundSlot = slot.semitone !== activeSemitone;
            if (!isBackgroundSlot) {
              resetManualScroll();
              bindSlot(slot);
            }

            slot.root.replaceChildren();
            slot.measureCentersByNumber = {};
            slot.measureBoundsByNumber = {};
            slot.cssScale = 1;
            slot.currentScrollOffset = 0;
            slot.precisionWindowStart = 1;
            slot.effectiveScale = 1;
            slot.wrapper.style.transform = 'translate3d(0, -50%, 0) scale(1)';
            if (!isBackgroundSlot) {
              status.textContent = 'Rendering...';
              status.style.display = 'grid';
            }

            let renderSucceeded = false;
            try {
              const OpenSheetMusicDisplay =
                window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay;
              if (!OpenSheetMusicDisplay) {
                if (!isBackgroundSlot) {
                  status.textContent = 'OSMD failed to load';
                }
                postOsmdMessage('error', 'OpenSheetMusicDisplay missing');
                return;
              }

              const displayXml = xmlText;
              const z = typeof zoomValue === 'number' && Number.isFinite(zoomValue) ? zoomValue : 1;

              slot.osmd = buildOsmd(slot.root);
              enableEarTrainingOsmdWordsLayoutRules(slot.osmd);
              slot.osmd.zoom = z;
              await slot.osmd.load(displayXml);
              relaxOsmdCompactTightSpacingForBattle(slot.osmd, displayXml);
              installEarTrainingOsmdWordsLayout(slot.osmd);
              slot.osmd.render();
              await new Promise(function (resolve) {
                requestAnimationFrame(function () {
                  requestAnimationFrame(resolve);
                });
              });

              const aggressiveShrink =
                typeof zoomValue === 'number' && Number.isFinite(zoomValue) && zoomValue <= 0.5;
              const targetHeight = Math.max(48, viewport.clientHeight * (aggressiveShrink ? 0.78 : 0.98));
              const measured = measureSurfaceHeightForRoot(slot.root);
              if (measured > targetHeight && measured > 0) {
                slot.cssScale = Math.max(0.28, targetHeight / measured);
              } else {
                slot.cssScale = 1;
              }
              slot.wrapper.style.transform = 'translate3d(0, -50%, 0) scale(' + slot.cssScale + ')';
              await new Promise(function (resolve) {
                requestAnimationFrame(resolve);
              });

              measureLayoutFromOsmdForSlot(slot);
              slot.root.style.width = slot.scoreWidth + 'px';

              if (!isBackgroundSlot) {
                bindSlot(slot);
                applyIdleScoreLayout();
              }
              renderSucceeded = true;
            } catch (err) {
              const msg = err && err.message ? String(err.message) : String(err);
              if (!isBackgroundSlot) {
                status.textContent = 'Could not render MusicXML.';
              }
              postOsmdMessage('error', msg);
            } finally {
              if (renderSucceeded && !isBackgroundSlot) {
                status.style.display = 'none';
              }
            }
          }

          async function renderMusicXML(xmlText, zoomValue) {
            disposeScoreSlots();
            await prepareScoreSlot(0, xmlText, zoomValue);
            setActiveScoreSlot(0);
            postOsmdMessage('ready', '');
          }

          function countInPlayheadProgress(timelineSec) {
            if (timelineSec >= 0 || countInDurationSec <= 0) {
              return 0;
            }
            return Math.max(0, Math.min(1, (timelineSec + countInDurationSec) / countInDurationSec));
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

          function updateMeasureHighlight() {
            const highlight = document.getElementById('measure-highlight');
            if (!highlight) {
              return;
            }
            if (!overlayVisible) {
              highlight.style.display = 'none';
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
            phraseTimelineSec = Number.isFinite(Number(sec)) ? Number(sec) : 0;
            playheadAnimating = !!animating;
            updateMeasureHighlight();
          }

          function applyIdleScoreLayout() {
            currentScrollOffset = computeScrollOffset(activeMeasureNumber);
            applyScoreTransform(currentScrollOffset);
          }

          function setScoreOverlayVisible(show) {
            resetManualScroll();
            overlayVisible = !!show;
            applyIdleScoreLayout();
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

          function setScrollLayout(playheadPxValue, anchorToMeasureLeft, fitActiveMeasureWidth) {
            resetManualScroll();
            if (typeof playheadPxValue === 'number' && Number.isFinite(playheadPxValue)) {
              PLAYHEAD_PX = playheadPxValue;
            }
            if (typeof anchorToMeasureLeft === 'boolean') {
              ANCHOR_TO_MEASURE_LEFT = anchorToMeasureLeft;
            }
            if (typeof fitActiveMeasureWidth === 'boolean') {
              FIT_ACTIVE_MEASURE_WIDTH = fitActiveMeasureWidth;
            }
            if (overlayVisible) {
              currentScrollOffset = computeScrollOffset(activeMeasureNumber);
              applyScoreTransform(currentScrollOffset);
              updateMeasureHighlight();
            }
          }

          function setActiveMeasure(measureNumber) {
            resetManualScroll();
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
              updateMeasureHighlight();
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
            updateMeasureHighlight();
          }, { passive: false });

          viewport.addEventListener('touchend', function() {
            manualDragActive = false;
          }, { passive: true });

          viewport.addEventListener('touchcancel', function() {
            manualDragActive = false;
          }, { passive: true });

          window.JazzifyOSMD = {
            renderMusicXML,
            prepareScoreSlot,
            setActiveScoreSlot,
            disposeScoreSlots,
            setDrawMeasureNumbers,
            setActiveMeasure,
            setMeasureDurationSec,
            setScoreOverlayVisible,
            setPlayheadTimeline,
            setScrollLayout,
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

protocol EarTrainingOsmdPlayheadBinding: AnyObject {
    func bindOsmdCoordinator(_ coordinator: EarTrainingOSMDScoreWebView.Coordinator?)
}

