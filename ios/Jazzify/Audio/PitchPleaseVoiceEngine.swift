import AVFoundation
import WebKit

/// 隠し WKWebView で Web と同じ PitchPlease piano を動かす。
/// PitchInputEngine（PESTO）は残すが、ライブ入力では起動しない。
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
    private var allowedMediaPort: Int?
    private var sessionGeneration: UInt64 = 0

    private lazy var webDelegate = VoiceWebDelegate(engine: self)

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
        stop()
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

        sessionGeneration &+= 1
        let generation = sessionGeneration
        let channel = inputChannel == 2 ? 2 : 1

        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playAndRecord, mode: .default, options: [.mixWithOthers, .defaultToSpeaker, .allowBluetooth])
        try? session.setActive(true)

        Task {
            await self.launchSession(channel: channel, generation: generation)
        }
    }

    func stop() {
        sessionGeneration &+= 1
        allowedMediaPort = nil

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
        isActive = false
        detectedNoteName = nil
        releaseSoundingNotes()

        Task {
            await assetServer.stop()
        }
    }

    private func launchSession(channel: Int, generation: UInt64) async {
        guard generation == sessionGeneration else { return }
        await assetServer.stop()
        guard let documentRoot = PitchPleaseAssetServer.bundlePitchPleaseDirectory() else {
            lastError = "PitchPlease のページがアプリに含まれていません"
            return
        }

        do {
            let port = try await assetServer.start(documentRoot: documentRoot)
            guard generation == sessionGeneration else {
                await assetServer.stop()
                return
            }
            allowedMediaPort = Int(port)
            mountWebView(channel: channel, port: port, generation: generation)
        } catch {
            guard generation == sessionGeneration else { return }
            lastError = "PitchPlease の配信を開始できません"
        }
    }

    private func mountWebView(channel: Int, port: UInt16, generation: UInt64) {
        guard generation == sessionGeneration else { return }

        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(webDelegate, name: "pitch")

        let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 1, height: 1), configuration: configuration)
        webView.isUserInteractionEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.navigationDelegate = webDelegate
        webView.uiDelegate = webDelegate

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

        guard let url = URL(string: "http://127.0.0.1:\(port)/pitchplease-voice.html?channel=\(channel)") else {
            lastError = "PitchPlease のページを開けません"
            return
        }
        webView.load(URLRequest(url: url))
    }

    fileprivate func handleScriptMessage(_ body: [String: Any]) {
        guard let kind = body["kind"] as? String else { return }
        switch kind {
        case "ready":
            isActive = true
            lastError = nil
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

    fileprivate func handleNavigationFailure(_ message: String) {
        isActive = false
        lastError = message
    }

    fileprivate func allowedPortForMediaCapture() -> Int? {
        allowedMediaPort
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

    init(engine: PitchPleaseVoiceEngine) {
        self.engine = engine
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "pitch",
              let body = message.body as? [String: Any] else { return }
        engine?.handleScriptMessage(body)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        engine?.handleNavigationFailure(error.localizedDescription)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        engine?.handleNavigationFailure(error.localizedDescription)
    }

    @available(iOS 15.0, *)
    func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        guard let engine else {
            decisionHandler(.deny)
            return
        }
        guard PitchInputEngine.microphonePermission == .granted else {
            decisionHandler(.deny)
            return
        }
        guard type == .microphone || type == .cameraAndMicrophone else {
            decisionHandler(.deny)
            return
        }
        guard origin.host == "127.0.0.1", let allowed = engine.allowedPortForMediaCapture(), origin.port == allowed else {
            decisionHandler(.deny)
            return
        }
        decisionHandler(.grant)
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
