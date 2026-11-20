import AVFoundation
import WebKit

/// ネイティブ録音 (PitchInputEngine) + 隠し WKWebView 上の PitchPlease カーネルで鍵盤検出する。
@MainActor
final class PitchPleaseVoiceEngine: NSObject {
    static let shared = PitchPleaseVoiceEngine()

    private(set) var isActive = false
    private(set) var lastError: String?
    private(set) var detectedNoteName: String?
    private(set) var isNativeCaptureReady = false
    private(set) var isKernelReady = false

    private var isVoicePipelineReady: Bool {
        isNativeCaptureReady && isKernelReady
    }

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
    private var keepKernelWarm = false

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
        if isVoicePipelineReady, configuredInputChannel == channel {
            return
        }

        lastError = nil
        isActive = false

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

    func stop(immediateSessionRelease: Bool = false) {
        sessionOperation?.cancel()
        let previous = sessionOperation
        sessionOperation = Task { [weak self] in
            _ = await previous?.value
            guard let self, !Task.isCancelled else { return }
            await self.beginStopSession(immediateSessionRelease: immediateSessionRelease)
        }
    }

    /// マイクと録音セッションだけ解放し、PitchPlease カーネル（WebView）を温存する。
    func stopCaptureOnly() {
        sessionOperation?.cancel()
        let previous = sessionOperation
        sessionOperation = Task { [weak self] in
            _ = await previous?.value
            guard let self, !Task.isCancelled else { return }
            self.stopNativeCaptureOnly()
            self.keepKernelWarm = true
            self.isActive = false
            self.detectedNoteName = nil
        }
    }

    /// ネイティブ録音セッションとカーネルの準備完了を待つ。タイムアウト時は false。
    func waitUntilReady(timeout: TimeInterval = 8) async -> Bool {
        if isVoicePipelineReady { return true }
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if Task.isCancelled { return false }
            if isVoicePipelineReady { return true }
            try? await Task.sleep(nanoseconds: 40_000_000)
        }
        return isVoicePipelineReady
    }

    private func beginStartSession(channel: Int) async {
        let canReuseKernel = keepKernelWarm
            && webView != nil
            && configuredInputChannel == channel
            && assetServer.currentPort() != nil

        if canReuseKernel {
            configuredInputChannel = channel
            sessionGeneration &+= 1
            let generation = sessionGeneration
            captureGeneration = generation
            isNativeCaptureReady = false
            lastError = nil
            do {
                try await startNativeCapture(channel: channel, generation: generation)
                if isKernelReady {
                    isActive = true
                }
                return
            } catch {
                lastError = error.localizedDescription
            }
        }

        await tearDownWebSession(stopCapture: true)
        keepKernelWarm = false
        let stopGeneration = sessionGeneration &+ 1
        sessionGeneration = stopGeneration
        await stopServersIfGenerationStill(stopGeneration)

        sessionGeneration &+= 1
        let generation = sessionGeneration
        configuredInputChannel = channel
        captureGeneration = generation
        isKernelReady = false
        isNativeCaptureReady = false

        await launchSession(channel: channel, generation: generation)
    }

    private func beginStopSession(immediateSessionRelease: Bool = false) async {
        keepKernelWarm = false
        let stopGeneration = sessionGeneration &+ 1
        sessionGeneration = stopGeneration
        configuredInputChannel = nil
        await tearDownWebSession(stopCapture: true, immediateSessionRelease: immediateSessionRelease)
        await stopServersIfGenerationStill(stopGeneration)
    }

    private func stopNativeCaptureOnly(immediateSessionRelease: Bool = false) {
        PitchInputEngine.shared.stop(immediateSessionRelease: immediateSessionRelease)
        isNativeCaptureReady = false
    }

    private func tearDownWebSession(stopCapture: Bool, immediateSessionRelease: Bool = false) async {
        mountedSessionGeneration = 0
        isKernelReady = false

        if stopCapture {
            stopNativeCaptureOnly(immediateSessionRelease: immediateSessionRelease)
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

            try await startNativeCapture(channel: channel, generation: generation)

            guard generation == sessionGeneration else { return }
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

    private func startNativeCapture(channel: Int, generation: UInt64) async throws {
        guard generation == sessionGeneration else { return }
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
            isNativeCaptureReady = true
            if isKernelReady {
                isActive = true
                lastError = nil
            }
        } catch {
            isNativeCaptureReady = false
            if let channelError = error as? PitchCaptureExternalChannelError {
                throw channelError
            }
            throw error
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
            onKernelReady(generation: generation)
        case "error":
            isActive = false
            lastError = body["message"] as? String
        case "on":
            guard let midi = (body["midi"] as? NSNumber)?.intValue, midi >= 0, midi <= 127 else { return }
            guard VoiceSpeakerBleedCoordinator.shared.shouldAllowNoteOn() else { return }
            detectedNoteName = body["name"] as? String
            notify(status: 0x90, note: UInt8(midi), velocity: 64)
        case "off":
            guard let midi = (body["midi"] as? NSNumber)?.intValue, midi >= 0, midi <= 127 else { return }
            notify(status: 0x80, note: UInt8(midi), velocity: 0)
        default:
            break
        }
    }

    private func onKernelReady(generation: UInt64) {
        guard generation == sessionGeneration, generation == mountedSessionGeneration else { return }
        isKernelReady = true
        if isNativeCaptureReady {
            isActive = true
            lastError = nil
        }
    }

    fileprivate func handleNavigationFailure(_ message: String, sessionGeneration generation: UInt64) {
        guard generation == sessionGeneration, generation == mountedSessionGeneration else { return }
        isActive = false
        isKernelReady = false
        lastError = message
        stopNativeCaptureOnly()
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