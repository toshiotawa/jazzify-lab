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
    private var connectedSource: MIDIEndpointRef?

    /// UserDefaults に保存された最後に選択した MIDI デバイスの uniqueID。
    /// アプリ再起動後に同じデバイスが存在すれば自動接続する。
    private static let selectedDeviceDefaultsKey = "jazzify.midi.selectedDeviceID"

    var onMIDIEvent: ((UInt8, UInt8, UInt8) -> Void)?

    private init() {
        if let saved = UserDefaults.standard.object(forKey: Self.selectedDeviceDefaultsKey) as? NSNumber {
            self.selectedDeviceID = saved.int32Value
        }
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

        // 保存済みの選択 ID に一致するデバイスが (再) 出現したら自動接続する。
        // これにより、設定タブで選んだキーボードがアプリ再起動後やサバイバル画面でもそのまま使える。
        if let selectedID = selectedDeviceID {
            if devices.contains(where: { $0.uniqueID == selectedID }) {
                ensureConnected(to: selectedID)
            }
        }
    }

    func selectDevice(uniqueID: Int32?) {
        disconnectCurrent()

        selectedDeviceID = uniqueID
        persistSelectedDeviceID(uniqueID)

        guard let targetID = uniqueID else { return }
        ensureConnected(to: targetID)
    }

    private func ensureConnected(to targetID: Int32) {
        let sourceCount = MIDIGetNumberOfSources()
        for i in 0..<sourceCount {
            let source = MIDIGetSource(i)
            var srcID: Int32 = 0
            MIDIObjectGetIntegerProperty(source, kMIDIPropertyUniqueID, &srcID)

            if srcID == targetID {
                if connectedSource == source { return }
                disconnectCurrent()
                let status = MIDIPortConnectSource(inputPort, source, nil)
                if status == noErr {
                    connectedSource = source
                }
                return
            }
        }
    }

    private func disconnectCurrent() {
        if let source = connectedSource {
            MIDIPortDisconnectSource(inputPort, source)
            connectedSource = nil
            return
        }
        let sourceCount = MIDIGetNumberOfSources()
        for i in 0..<sourceCount {
            let source = MIDIGetSource(i)
            MIDIPortDisconnectSource(inputPort, source)
        }
    }

    private func persistSelectedDeviceID(_ uniqueID: Int32?) {
        let defaults = UserDefaults.standard
        if let uniqueID {
            defaults.set(NSNumber(value: uniqueID), forKey: Self.selectedDeviceDefaultsKey)
        } else {
            defaults.removeObject(forKey: Self.selectedDeviceDefaultsKey)
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
