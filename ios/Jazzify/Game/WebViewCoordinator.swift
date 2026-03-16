import Foundation
import WebKit

final class WebViewCoordinator: NSObject, ObservableObject, WKScriptMessageHandler, WKNavigationDelegate {
    weak var webView: WKWebView?
    var midiManager: MIDIManager?
    var onGameEnd: (() -> Void)?
    var onScoreReport: ((Int) -> Void)?

    // MARK: - WKScriptMessageHandler

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
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
                self?.onGameEnd?()
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

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        guard let url = navigationAction.request.url else { return .cancel }

        if url.scheme == "https" || url.scheme == "http" || url.scheme == "about" {
            return .allow
        }
        return .cancel
    }
}
