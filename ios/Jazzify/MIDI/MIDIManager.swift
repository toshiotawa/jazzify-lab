import Foundation
import CoreMIDI
import Combine

struct MIDIDeviceInfo: Identifiable {
    let uniqueID: Int32
    let displayName: String
    let manufacturer: String
    var id: Int32 { uniqueID }
}

@MainActor
final class MIDIManager: ObservableObject {
    static let shared = MIDIManager()

    @Published var availableDevices: [MIDIDeviceInfo] = []
    @Published var selectedDeviceID: Int32?

    private var midiClient = MIDIClientRef()
    private var inputPort = MIDIPortRef()
    private var isSetup = false

    var onMIDIEvent: ((UInt8, UInt8, UInt8) -> Void)?

    private init() {
        setupMIDI()
    }

    private func setupMIDI() {
        guard !isSetup else { return }

        let clientStatus = MIDIClientCreateWithBlock("JazzifyMIDI" as CFString, &midiClient) { [weak self] notification in
            Task { @MainActor in
                self?.handleMIDINotification(notification)
            }
        }

        guard clientStatus == noErr else { return }

        let portStatus = MIDIInputPortCreateWithProtocol(
            midiClient,
            "JazzifyInput" as CFString,
            ._1_0,
            &inputPort
        ) { [weak self] eventList, _ in
            self?.handleMIDIPacketList(eventList)
        }

        guard portStatus == noErr else { return }

        isSetup = true
        refreshDevices()
    }

    private func isNetworkSessionEndpoint(_ source: MIDIEndpointRef) -> Bool {
        source == MIDINetworkSession.default().sourceEndpoint()
    }

    func refreshDevices() {
        var devices: [MIDIDeviceInfo] = []
        let sourceCount = MIDIGetNumberOfSources()

        for i in 0..<sourceCount {
            let source = MIDIGetSource(i)
            if isNetworkSessionEndpoint(source) { continue }

            var uniqueID: Int32 = 0
            MIDIObjectGetIntegerProperty(source, kMIDIPropertyUniqueID, &uniqueID)

            let displayName = getMIDIStringProperty(source, kMIDIPropertyDisplayName) ?? "Unknown"
            let manufacturer = getMIDIStringProperty(source, kMIDIPropertyManufacturer) ?? ""

            devices.append(MIDIDeviceInfo(
                uniqueID: uniqueID,
                displayName: displayName,
                manufacturer: manufacturer
            ))
        }

        self.availableDevices = devices

        if let selectedID = selectedDeviceID,
           !devices.contains(where: { $0.uniqueID == selectedID }) {
            selectedDeviceID = nil
        }
    }

    func selectDevice(uniqueID: Int32?) {
        disconnectCurrent()

        selectedDeviceID = uniqueID

        guard let targetID = uniqueID else { return }

        let sourceCount = MIDIGetNumberOfSources()
        for i in 0..<sourceCount {
            let source = MIDIGetSource(i)
            var srcID: Int32 = 0
            MIDIObjectGetIntegerProperty(source, kMIDIPropertyUniqueID, &srcID)

            if srcID == targetID {
                MIDIPortConnectSource(inputPort, source, nil)
                break
            }
        }
    }

    private func disconnectCurrent() {
        let sourceCount = MIDIGetNumberOfSources()
        for i in 0..<sourceCount {
            let source = MIDIGetSource(i)
            MIDIPortDisconnectSource(inputPort, source)
        }
    }

    private func handleMIDIPacketList(_ eventList: UnsafePointer<MIDIEventList>) {
        let list = eventList.pointee
        var packet = list.packet

        for _ in 0..<list.numPackets {
            let wordCount = Int(packet.wordCount)
            if wordCount > 0 {
                let word = packet.words.0
                let status = UInt8((word >> 16) & 0xFF)
                let data1 = UInt8((word >> 8) & 0xFF)
                let data2 = UInt8(word & 0xFF)

                let messageType = status & 0xF0
                if messageType == 0x90 || messageType == 0x80 {
                    let callback = self.onMIDIEvent
                    DispatchQueue.main.async {
                        callback?(status, data1, data2)
                    }
                }
            }
            var next = packet
            withUnsafePointer(to: &next) { ptr in
                packet = MIDIEventPacketNext(ptr).pointee
            }
        }
    }

    private func handleMIDINotification(_ notification: UnsafePointer<MIDINotification>) {
        switch notification.pointee.messageID {
        case .msgSetupChanged, .msgObjectAdded, .msgObjectRemoved:
            refreshDevices()
        default:
            break
        }
    }

    private func getMIDIStringProperty(_ obj: MIDIObjectRef, _ property: CFString) -> String? {
        var param: Unmanaged<CFString>?
        let status = MIDIObjectGetStringProperty(obj, property, &param)
        guard status == noErr, let cfString = param?.takeRetainedValue() else { return nil }
        return cfString as String
    }
}
