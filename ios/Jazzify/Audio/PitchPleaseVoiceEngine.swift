import AVFoundation
import WebKit

/// 隠し WKWebView で Web と同じ PitchPlease piano を動かす。
/// PitchInputEngine（PESTO）は残すが、ライブ入力では起動しない。
@MainActor
final class PitchPleaseVoiceEngine: NSObject, WKScriptMessageHandler {
    static let shared = PitchPleaseVoiceEngine()

    private(set) var isActive = false
    private(set) var lastError: String?
    private(set) var detectedNoteName: String?

    private let subscriberLock = NSLock()
    nonisolated(unsafe) private var simpleHandlers: [UUID: (UInt8, UInt8, UInt8) -> Void] = [:]
    nonisolated(unsafe) private var hostTimeHandlers: [UUID: (UInt8, UInt8, UInt8, UInt64) -> Void] = [:]
    private var webView: WKWebView?
    private var hostView: UIView?

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
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(self, name: "pitch")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isHidden = true
        let host = UIView(frame: .zero)
        host.isHidden = true
        host.addSubview(webView)
        if let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) {
            window.addSubview(host)
        }
        self.webView = webView
        self.hostView = host
        let channel = inputChannel == 2 ? 2 : 1
        guard let page = Bundle.main.url(forResource: "pitchplease-voice", withExtension: "html", subdirectory: "pitchplease") else {
            lastError = "PitchPlease のページがアプリに含まれていません"
            return
        }
        var components = URLComponents(url: page, resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "channel", value: String(channel))]
        guard let url = components?.url else {
            lastError = "PitchPlease のページを開けません"
            return
        }
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playAndRecord, mode: .default, options: [.mixWithOthers, .defaultToSpeaker, .allowBluetooth])
        try? session.setActive(true)
        webView.loadFileURL(url, allowingReadAccessTo: page.deletingLastPathComponent())
    }

    func stop() {
        if let webView {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: "pitch")
            webView.stopLoading()
        }
        webView?.removeFromSuperview()
        hostView?.removeFromSuperview()
        webView = nil
        hostView = nil
        isActive = false
        detectedNoteName = nil
        releaseSoundingNotes()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let kind = body["kind"] as? String else { return }
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

    fileprivate func removeSubscriber(id: UUID, isHostTime: Bool) {
        subscriberLock.lock()
        if isHostTime {
            hostTimeHandlers.removeValue(forKey: id)
        } else {
            simpleHandlers.removeValue(forKey: id)
        }
        subscriberLock.unlock()
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
