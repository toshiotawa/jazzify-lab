import Foundation
import WebKit

final class WebViewCoordinator: NSObject, ObservableObject, WKScriptMessageHandler, WKNavigationDelegate {
    weak var webView: WKWebView?
    var midiManager: MIDIManager?
    @Published var shouldDismiss = false
    var onScoreReport: ((Int) -> Void)?

    // MARK: - WKScriptMessageHandler

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        if message.name == "fullscreenChange" {
            handleFullscreenChange(message.body)
            return
        }

        guard let body = message.body as? [String: Any] else { return }

        switch message.name {
        case "gameCallback":
            handleGameCallback(body)
        case "midiRequest":
            handleMIDIRequest(body)
        default:
            break
        }
    }

    private func handleGameCallback(_ body: [String: Any]) {
        guard let action = body["action"] as? String else { return }

        switch action {
        case "gameEnd":
            DispatchQueue.main.async { [weak self] in
                self?.shouldDismiss = true
            }
        case "scoreReport":
            if let score = body["score"] as? Int {
                DispatchQueue.main.async { [weak self] in
                    self?.onScoreReport?(score)
                }
            }
        default:
            break
        }
    }

    private func handleMIDIRequest(_ body: [String: Any]) {
        guard let action = body["action"] as? String else { return }

        switch action {
        case "listDevices":
            sendMIDIDeviceList()
        case "selectDevice":
            if let uniqueID = body["uniqueID"] as? Int32 {
                midiManager?.selectDevice(uniqueID: uniqueID)
            }
        default:
            break
        }
    }

    // MARK: - Fullscreen

    private func handleFullscreenChange(_ body: Any) {
        guard let isFullscreen = body as? Bool else { return }
        DispatchQueue.main.async {
            if isFullscreen {
                OrientationManager.shared.lock(.allButUpsideDown)
            } else {
                OrientationManager.shared.lock(.portrait)
            }
        }
    }

    // MARK: - Send to WebView

    func sendMIDIEvent(status: UInt8, note: UInt8, velocity: UInt8) {
        let js = "window.onNativeMidiMessage && window.onNativeMidiMessage(\(status), \(note), \(velocity));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js)
        }
    }

    func sendMIDIDeviceList() {
        guard let manager = midiManager else { return }
        let devices = manager.availableDevices.map { device in
            ["uniqueID": device.uniqueID, "displayName": device.displayName, "manufacturer": device.manufacturer] as [String: Any]
        }
        guard let jsonData = try? JSONSerialization.data(withJSONObject: devices),
              let jsonString = String(data: jsonData, encoding: .utf8) else { return }

        let js = "window.onNativeMidiDevices && window.onNativeMidiDevices(\(jsonString));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js)
        }
    }

    func sendSelectedDeviceID() {
        guard let manager = midiManager, let selectedID = manager.selectedDeviceID else { return }
        let js = "window.onNativeMidiSelected && window.onNativeMidiSelected(\(selectedID));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js)
        }
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        guard let url = navigationAction.request.url else { return .cancel }

        if url.scheme == "https" || url.scheme == "http" || url.scheme == "about" {
            return .allow
        }
        return .cancel
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.sendMIDIDeviceList()
            self?.sendSelectedDeviceID()
        }
    }
}
