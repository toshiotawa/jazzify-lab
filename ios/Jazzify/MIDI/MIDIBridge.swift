import Foundation

@MainActor
final class MIDIBridge {
    private let midiManager: MIDIManager
    private weak var coordinator: WebViewCoordinator?
    private var midiSubscription: MIDISubscription?

    init(midiManager: MIDIManager, coordinator: WebViewCoordinator) {
        self.midiManager = midiManager
        self.coordinator = coordinator
        setupCallbacks()
    }

    private func setupCallbacks() {
        midiSubscription?.cancel()
        midiSubscription = midiManager.subscribe { [weak self] status, note, velocity in
            DispatchQueue.main.async { [weak self] in
                self?.coordinator?.sendMIDIEvent(status: status, note: note, velocity: velocity)
            }
        }
    }

    func detach() {
        midiSubscription?.cancel()
        midiSubscription = nil
    }
}
