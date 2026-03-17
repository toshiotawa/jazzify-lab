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
        midiManager.onMIDIEvent = { [weak self] status, note, velocity in
            self?.coordinator?.sendMIDIEvent(status: status, note: note, velocity: velocity)
        }
    }

    func detach() {
        midiManager.onMIDIEvent = nil
    }
}
