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

    private let subscriberLock = NSLock()
    nonisolated(unsafe) private var subscribers: [UUID: (UInt8, UInt8, UInt8) -> Void] = [:]

    private init() {
        if let saved = UserDefaults.standard.object(forKey: Self.selectedDeviceDefaultsKey) as? NSNumber {
            self.selectedDeviceID = saved.int32Value
        }
        setupMIDI()
    }

    /// 複数画面が同時に MIDI を購読できる。各購読は `cancel()` で明示的に解除する。
    func subscribe(_ handler: @escaping (UInt8, UInt8, UInt8) -> Void) -> MIDISubscription {
        subscriberLock.lock()
        let id = UUID()
        subscribers[id] = handler
        subscriberLock.unlock()
        return MIDISubscriptionToken(manager: self, id: id)
    }

    nonisolated func removeSubscriber(id: UUID) {
        subscriberLock.lock()
        subscribers.removeValue(forKey: id)
        subscriberLock.unlock()
    }

    nonisolated private func deliverChannelVoice(status: UInt8, data1: UInt8, data2: UInt8) {
        subscriberLock.lock()
        let handlers = Array(subscribers.values)
        subscriberLock.unlock()
        for handler in handlers {
            handler(status, data1, data2)
        }
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

    func refreshDevices(autoSelectSingleDevice: Bool = true) {
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

        if selectedDeviceID == nil, autoSelectSingleDevice, devices.count == 1 {
            selectDevice(uniqueID: devices[0].uniqueID)
            return
        }

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

    /// CoreMIDI から届く UMP (Universal MIDI Packet) パケットリストを直接パースする。
    /// - `MIDIEventPacket.words` は 64 × UInt32 の固定配列で、`wordCount` が有効ワード数。
    ///   旧実装は `words.0` しか読まず、同時押し等で 1 パケットに複数メッセージが詰められた際に
    ///   2 発目以降のイベントを取りこぼし "MIDI 反応が悪い" 主要因になっていた。
    /// - UMP のメッセージタイプ (上位 4bit) によりワード長が 1/2/4 と異なるため、
    ///   CVM (MIDI1.0 = MT 0x2, MIDI2.0 = MT 0x4) を識別して必要分だけ進める。
    /// - 購読ハンドラは CoreMIDI スレッドから直接呼ぶ。呼び出し側で必要に応じて main にディスパッチして、
    ///   メインスレッドを待たない低レイテンシ経路を確保する。
    nonisolated private func handleMIDIPacketList(_ eventList: UnsafePointer<MIDIEventList>) {
        let list = eventList.pointee
        var packet = list.packet

        for _ in 0..<list.numPackets {
            processPacket(packet)
            var next = packet
            withUnsafePointer(to: &next) { ptr in
                packet = MIDIEventPacketNext(ptr).pointee
            }
        }
    }

    nonisolated private func processPacket(_ packet: MIDIEventPacket) {
        let wordCount = Int(packet.wordCount)
        guard wordCount > 0 else { return }
        var mutablePacket = packet
        withUnsafeBytes(of: &mutablePacket.words) { rawBuffer in
            guard let base = rawBuffer.baseAddress?.assumingMemoryBound(to: UInt32.self) else { return }
            var index = 0
            while index < wordCount {
                let word = base[index]
                let messageType = UInt8((word >> 28) & 0x0F)
                switch messageType {
                case 0x0, 0x1: // Utility / System RealTime: 1 word、CVM ではないので無視
                    index += 1
                case 0x2: // MIDI 1.0 Channel Voice: 1 word
                    dispatchMIDI1ChannelVoice(word: word)
                    index += 1
                case 0x3: // 7bit System/Data: 2 words (CVM ではない)
                    index += 2
                case 0x4: // MIDI 2.0 Channel Voice: 2 words
                    dispatchMIDI2ChannelVoice(word0: word, word1: index + 1 < wordCount ? base[index + 1] : 0)
                    index += 2
                case 0x5: // 128bit Data / SysEx 8bit: 4 words
                    index += 4
                default:
                    index += 1
                }
            }
        }
    }

    nonisolated private func dispatchMIDI1ChannelVoice(word: UInt32) {
        let status = UInt8((word >> 16) & 0xFF)
        let data1 = UInt8((word >> 8) & 0xFF)
        let data2 = UInt8(word & 0xFF)
        let messageType = status & 0xF0
        guard messageType == 0x90 || messageType == 0x80 else { return }
        deliverChannelVoice(status: status, data1: data1, data2: data2)
    }

    /// MIDI 2.0 CVM は UMP 2 ワード。Note On/Off は第 1 ワードに status/note、
    /// 第 2 ワードに 16bit velocity (上位) + 16bit attribute が載る。
    /// MIDIInputPortCreateWithProtocol(..., ._1_0, ...) で接続済みのため通常は届かないが、
    /// キーボード側が UMP 2.0 で送ってくる環境に備えて 7bit velocity に縮めて通知する。
    nonisolated private func dispatchMIDI2ChannelVoice(word0: UInt32, word1: UInt32) {
        let status = UInt8((word0 >> 16) & 0xFF)
        let note = UInt8((word0 >> 8) & 0xFF)
        let velocity16 = UInt16((word1 >> 16) & 0xFFFF)
        let velocity7 = UInt8(min(127, Int(velocity16) >> 9))
        let messageType = status & 0xF0
        guard messageType == 0x90 || messageType == 0x80 else { return }
        deliverChannelVoice(status: status, data1: note, data2: velocity7)
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

protocol MIDISubscription: AnyObject {
    func cancel()
}

final class MIDISubscriptionToken: MIDISubscription {
    private weak var manager: MIDIManager?
    private let id: UUID

    fileprivate init(manager: MIDIManager, id: UUID) {
        self.manager = manager
        self.id = id
    }

    func cancel() {
        manager?.removeSubscriber(id: id)
    }
}

/// SwiftUI `@State` で MIDI 購読を保持するための参照ボックス。
final class MIDISubscriptionHolder {
    var subscription: MIDISubscription?

    func cancel() {
        subscription?.cancel()
        subscription = nil
    }
}
