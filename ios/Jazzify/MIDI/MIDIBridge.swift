import Foundation

@MainActor
final class MIDIBridge {
    private let midiManager: MIDIManager
    private weak var coordinator: WebViewCoordinator?

    init(midiManager: MIDIManager, coordinator: WebViewCoordinator) {
        self.midiManager = midiManager
        self.coordinator = coordinator
        setupCallbacks()
    }

    private func setupCallbacks() {
        // `MIDIManager.onMIDIEvent` は CoreMIDI スレッド上で直接呼び出される。
        // WKWebView 操作 (`sendMIDIEvent` 内の `evaluateJavaScript`) は
        // メインスレッド必須のため、ここで明示的に main へディスパッチする。
        midiManager.onMIDIEvent = { [weak self] status, note, velocity in
            DispatchQueue.main.async { [weak self] in
                self?.coordinator?.sendMIDIEvent(status: status, note: note, velocity: velocity)
            }
        }
    }

    func detach() {
        midiManager.onMIDIEvent = nil
    }
}
