import AVFoundation
import WebKit

/// ネイティブ録音 (PitchInputEngine) + 隠し WKWebView 上の PitchPlease カーネルで鍵盤検出する。
@MainActor
final class PitchPleaseVoiceEngine: NSObject {
    static let shared = PitchPleaseVoiceEngine()

    private(set) var isActive = false
    private(set) var lastError: String?
    private(set) var detectedNoteName: String?

    private let subscriberLock = NSLock()
    nonisolated(unsafe) private var simpleHandlers: [UUID: (UInt8, UInt8, UInt8) -> Void] = [:]
    nonisolated(unsafe) private var hostTimeHandlers: [UUID: (UInt8, UInt8, UInt8, UInt64) -> Void] = [:]
    private var webView: WKWebView?
    private var hostView: UIView?
    private var assetServer = PitchPleaseAssetServer()
    private var sampleSocket = PitchPleaseSampleSocket()
    private var sessionGeneration: UInt64 = 0
    private var mountedSessionGeneration: UInt64 = 0
    private var configuredInputChannel: Int?
    private var captureGeneration: UInt64 = 0
    /// start/stop とサーバの起動を直列化し、重なった stop が新しい待受を閉じないようにする。
    private var sessionOperation: Task<Void, Never>?
    private var webDelegate: VoiceWebDelegate?

    func subscribe(_ handler: @escaping (UInt8, UInt8, UInt8) -> Void) -> MIDISubscription {
        let id = UUID()
        subscriberLock.lock()
        simpleHandlers[id] = handler
        subscriberLock.unlock()
        return PitchPleaseVoiceSubscription(engine: self, id: id, isHostTime: false)
    }

    func subscribeWithHostTime(_ handler: @escaping (UInt8, UInt8, UInt8, UInt64) -> Void) -> MIDISubscription {
        let id = UUID()
        subscriberLock.lock()
        hostTimeHandlers[id] = handler
        subscriberLock.unlock()
        return PitchPleaseVoiceSubscription(engine: self, id: id, isHostTime: true)
    }

    func start(inputChannel: Int) {
        let channel = inputChannel == 2 ? 2 : 1
        if isActive, configuredInputChannel == channel {
            return
        }

        lastError = nil
        isActive = false
        detectedNoteName = nil

        if PitchInputEngine.microphonePermission == .denied {
            lastError = "マイクが許可されていません。設定アプリの Jazzify から許可してください。"
            return
        }

        guard PitchPleaseAssetServer.bundlePitchPleaseDirectory() != nil else {
            lastError = "PitchPlease のページがアプリに含まれていません"
            return
        }

        sessionOperation?.cancel()
        let previous = sessionOperation
        sessionOperation = Task { [weak self] in
            _ = await previous?.value
            guard let self, !Task.isCancelled else { return }
            await self.beginStartSession(channel: channel)
        }
    }

    func stop() {
        sessionOperation?.cancel()
        let previous = sessionOperation
        sessionOperation = Task { [weak self] in
            _ = await previous?.value
            guard let self, !Task.isCancelled else { return }
            await self.beginStopSession()
        }
    }

    private func beginStartSession(channel: Int) async {
        await tearDownWebSession(stopCapture: true)
        let stopGeneration = sessionGeneration &+ 1
        sessionGeneration = stopGeneration
        await stopServersIfGenerationStill(stopGeneration)

        sessionGeneration &+= 1
        let generation = sessionGeneration
        configuredInputChannel = channel
        captureGeneration = generation

        await launchSession(channel: channel, generation: generation)
    }

    private func beginStopSession() async {
        let stopGeneration = sessionGeneration &+ 1
        sessionGeneration = stopGeneration
        configuredInputChannel = nil
        await tearDownWebSession(stopCapture: true)
        await stopServersIfGenerationStill(stopGeneration)
    }

    private func tearDownWebSession(stopCapture: Bool) async {
        mountedSessionGeneration = 0

        if stopCapture {
            PitchInputEngine.shared.stop()
        }

        if let webView {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: "pitch")
            webView.navigationDelegate = nil
            webView.uiDelegate = nil
            webView.stopLoading()
        }
        webView?.removeFromSuperview()
        hostView?.removeFromSuperview()
        webView = nil
        hostView = nil
        webDelegate = nil
        isActive = false
        detectedNoteName = nil
        releaseSoundingNotes()
    }

    private func stopServersIfGenerationStill(_ generation: UInt64) async {
        guard sessionGeneration == generation else { return }
        await assetServer.stop()
        await sampleSocket.stop()
    }

    private func launchSession(channel: Int, generation: UInt64) async {
        guard generation == sessionGeneration else { return }
        guard let documentRoot = PitchPleaseAssetServer.bundlePitchPleaseDirectory() else {
            lastError = "PitchPlease のページがアプリに含まれていません"
            return
        }

        do {
            let httpPort = try await assetServer.start(documentRoot: documentRoot)
            guard generation == sessionGeneration else { return }
            let socketInfo = try await sampleSocket.start()
            guard generation == sessionGeneration else {
                await sampleSocket.stop()
                return
            }
            mountWebView(
                channel: channel,
                httpPort: httpPort,
                wsPort: socketInfo.port,
                token: socketInfo.token,
                generation: generation
            )
        } catch {
            guard generation == sessionGeneration else { return }
            lastError = "PitchPlease の配信を開始できません"
            await tearDownWebSession(stopCapture: true)
            await stopServersIfGenerationStill(generation)
        }
    }

    private func mountWebView(
        channel: Int,
        httpPort: UInt16,
        wsPort: UInt16,
        token: String,
        generation: UInt64
    ) {
        guard generation == sessionGeneration else { return }

        mountedSessionGeneration = generation
        let delegate = VoiceWebDelegate(engine: self, sessionGeneration: generation)
        webDelegate = delegate

        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(delegate, name: "pitch")

        let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 1, height: 1), configuration: configuration)
        webView.isUserInteractionEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.navigationDelegate = delegate
        webView.uiDelegate = delegate

        let host = UIView(frame: CGRect(x: 0, y: 0, width: 1, height: 1))
        host.isUserInteractionEnabled = false
        host.backgroundColor = .clear
        host.addSubview(webView)

        if let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) {
            window.addSubview(host)
        }

        self.webView = webView
        self.hostView = host

        let encodedToken = token.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? token
        guard let url = URL(
            string: "http://127.0.0.1:\(httpPort)/pitchplease-voice.html"
                + "?channel=\(channel)&wsPort=\(wsPort)&token=\(encodedToken)"
        ) else {
            lastError = "PitchPlease のページを開けません"
            return
        }
        webView.load(URLRequest(url: url))
    }

    fileprivate func handleScriptMessage(_ body: [String: Any], sessionGeneration generation: UInt64) {
        guard generation == sessionGeneration, generation == mountedSessionGeneration else { return }
        guard let kind = body["kind"] as? String else { return }
        switch kind {
        case "ready":
            Task { await self.beginCaptureAfterKernelReady(generation: generation) }
        case "error":
            isActive = false
            lastError = body["message"] as? String
        case "on":
            guard let midi = (body["midi"] as? NSNumber)?.intValue, midi >= 0, midi <= 127 else { return }
            detectedNoteName = body["name"] as? String
            notify(status: 0x90, note: UInt8(midi), velocity: 64)
        case "off":
            guard let midi = (body["midi"] as? NSNumber)?.intValue, midi >= 0, midi <= 127 else { return }
            notify(status: 0x80, note: UInt8(midi), velocity: 0)
        default:
            break
        }
    }

    private func beginCaptureAfterKernelReady(generation: UInt64) async {
        guard generation == sessionGeneration, generation == mountedSessionGeneration else { return }
        guard let channel = configuredInputChannel else { return }
        captureGeneration = generation

        let socket = sampleSocket
        let captureGen = generation

        do {
            try await PitchInputEngine.shared.startForwardingCapturedChunks(inputChannel: channel) { samples, count in
                socket.send(samples: samples, count: count)
            }
            guard captureGeneration == captureGen, generation == sessionGeneration else {
                PitchInputEngine.shared.stop()
                return
            }
            isActive = true
            lastError = nil
        } catch {
            guard generation == sessionGeneration else { return }
            isActive = false
            if let channelError = error as? PitchCaptureExternalChannelError {
                lastError = channelError.localizedDescription
            } else {
                lastError = error.localizedDescription
            }
            PitchInputEngine.shared.stop()
        }
    }

    fileprivate func handleNavigationFailure(_ message: String, sessionGeneration generation: UInt64) {
        guard generation == sessionGeneration, generation == mountedSessionGeneration else { return }
        isActive = false
        lastError = message
        PitchInputEngine.shared.stop()
    }

    private func notify(status: UInt8, note: UInt8, velocity: UInt8) {
        let hostTime = mach_absolute_time()
        subscriberLock.lock()
        let simple = Array(simpleHandlers.values)
        let timed = Array(hostTimeHandlers.values)
        subscriberLock.unlock()
        for handler in simple {
            handler(status, note, velocity)
        }
        for handler in timed {
            handler(status, note, velocity, hostTime)
        }
    }

    private func releaseSoundingNotes() {
        // WebView 側の離鍵は stop で届かないため、購読側の伸びを残さない。
    }

    nonisolated fileprivate func removeSubscriber(id: UUID, isHostTime: Bool) {
        subscriberLock.lock()
        if isHostTime {
            hostTimeHandlers.removeValue(forKey: id)
        } else {
            simpleHandlers.removeValue(forKey: id)
        }
        subscriberLock.unlock()
    }
}

@MainActor
private final class VoiceWebDelegate: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    private weak var engine: PitchPleaseVoiceEngine?
    private let sessionGeneration: UInt64

    init(engine: PitchPleaseVoiceEngine, sessionGeneration: UInt64) {
        self.engine = engine
        self.sessionGeneration = sessionGeneration
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "pitch",
              let body = message.body as? [String: Any] else { return }
        engine?.handleScriptMessage(body, sessionGeneration: sessionGeneration)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        engine?.handleNavigationFailure(error.localizedDescription, sessionGeneration: sessionGeneration)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        engine?.handleNavigationFailure(error.localizedDescription, sessionGeneration: sessionGeneration)
    }

    @available(iOS 15.0, *)
    func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        decisionHandler(.deny)
    }
}

private final class PitchPleaseVoiceSubscription: MIDISubscription {
    private let id: UUID
    private let isHostTime: Bool
    private weak var engine: PitchPleaseVoiceEngine?

    init(engine: PitchPleaseVoiceEngine, id: UUID, isHostTime: Bool) {
        self.engine = engine
        self.id = id
        self.isHostTime = isHostTime
    }

    func cancel() {
        engine?.removeSubscriber(id: id, isHostTime: isHostTime)
        engine = nil
    }
}
