import Foundation

enum AssignmentInputSnapshot {
    struct Values: Sendable {
        let inputMethod: String
        let midiApiAvailable: Bool
        let midiDeviceCount: Int
        let midiConnected: Bool
    }

    @MainActor
    static func current() -> Values {
        let manager = MIDIManager.shared
        return Values(
            inputMethod: "midi",
            midiApiAvailable: true,
            midiDeviceCount: manager.availableDevices.count,
            midiConnected: manager.selectedDeviceID != nil
        )
    }
}
