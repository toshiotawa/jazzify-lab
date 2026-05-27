import Combine
import Foundation

@MainActor
final class BalloonRushViewModel: ObservableObject {
    @Published private(set) var snapshot: BalloonRushUISnapshot
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var clearReportInFlight = false
    @Published private(set) var clearReportError: String?

    init(snapshot: BalloonRushUISnapshot) {
        self.snapshot = snapshot
    }

    func sync(from loop: BalloonRushGameLoop) {
        let next = loop.makeUISnapshot()
        if next != snapshot {
            snapshot = next
        }
    }

    func registerMidiKeyDown(_ midi: Int) {
        midiHeldKeys.insert(midi)
    }

    func registerMidiKeyUp(_ midi: Int) {
        midiHeldKeys.remove(midi)
    }

    func beginClearReport() -> Bool {
        guard !clearReportInFlight else { return false }
        clearReportInFlight = true
        return true
    }

    func endClearReport(error: String?) {
        clearReportError = error
        clearReportInFlight = false
    }
}
