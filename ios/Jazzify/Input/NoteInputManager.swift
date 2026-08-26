import Combine
import Foundation

/// MIDI とマイク（PESTO）入力を 1 本の購読 API に統合する。
///
/// 購読を MIDIManager / PitchInputEngine に直接ぶら下げると「購読した時点の入力方式」に
/// 固定され、プレイ中に設定を切り替えたときノートが届かなくなる。
/// このクラスが両方を恒久購読してファンインし、有効な方だけを下流へ流す。
///
/// 配信は MIDIManager と同じく呼び出し元スレッド（CoreMIDI スレッド / 推論キュー）で
/// 同期的に行う。main へホップさせると既存 12 画面の MIDI レイテンシが悪化する。
@MainActor
final class NoteInputManager: ObservableObject {
    static let shared = NoteInputManager()

    @Published private(set) var voicePreparing = false

    private let midiManager = MIDIManager.shared
    private let pitchEngine = PitchInputEngine.shared

    private let subscriberLock = NSLock()
    nonisolated(unsafe) private var simpleHandlers: [UUID: (UInt8, UInt8, UInt8) -> Void] = [:]
    nonisolated(unsafe) private var hostTimeHandlers: [UUID: (UInt8, UInt8, UInt8, UInt64) -> Void] = [:]
    /// 配信スレッドから UserDefaults を読まないためのキャッシュ。
    nonisolated(unsafe) private var activeMethod: NoteInputMethod = .midi

    private var upstream: [MIDISubscription] = []

    private init() {
        activeMethod = NoteInputPreferences.inputMethod
    }

    var inputMethod: NoteInputMethod {
        get { NoteInputPreferences.inputMethod }
        set {
            guard NoteInputPreferences.inputMethod != newValue else { return }
            NoteInputPreferences.inputMethod = newValue
            activeMethod = newValue
            Task { await refreshActiveInput() }
        }
    }

    /// 購読ハンドラ（推論/MIDI スレッド）から参照。マイク入力時はピアノ発音を抑止する。
    nonisolated var isVoiceInputActive: Bool { activeMethod == .voice }

    // MARK: - 購読

    func subscribe(_ handler: @escaping (UInt8, UInt8, UInt8) -> Void) -> MIDISubscription {
        let id = UUID()
        subscriberLock.lock()
        simpleHandlers[id] = handler
        subscriberLock.unlock()
        attachUpstreamIfNeeded()
        return NoteInputSubscriptionToken(manager: self, id: id, isHostTime: false)
    }

    func subscribeWithHostTime(
        _ handler: @escaping (UInt8, UInt8, UInt8, UInt64) -> Void
    ) -> MIDISubscription {
        let id = UUID()
        subscriberLock.lock()
        hostTimeHandlers[id] = handler
        subscriberLock.unlock()
        attachUpstreamIfNeeded()
        return NoteInputSubscriptionToken(manager: self, id: id, isHostTime: true)
    }

    nonisolated fileprivate func removeSubscriber(id: UUID, isHostTime: Bool) {
        subscriberLock.lock()
        if isHostTime {
            hostTimeHandlers.removeValue(forKey: id)
        } else {
            simpleHandlers.removeValue(forKey: id)
        }
        let idle = simpleHandlers.isEmpty && hostTimeHandlers.isEmpty
        subscriberLock.unlock()

        guard idle else { return }
        Task { @MainActor [weak self] in
            self?.releaseUpstreamIfIdle()
        }
    }

    // MARK: - 入力切替

    func refreshActiveInput() async {
        activeMethod = NoteInputPreferences.inputMethod

        switch activeMethod {
        case .midi:
            voicePreparing = false
            pitchEngine.stop()
        case .voice:
            guard hasSubscribers else {
                voicePreparing = false
                pitchEngine.stop()
                return
            }
            pitchEngine.setSensitivity(NoteInputPreferences.micSensitivity)
            voicePreparing = true
            defer { voicePreparing = false }
            do {
                try await pitchEngine.start()
            } catch {
                pitchEngine.stop()
            }
        }
    }

    func stopVoiceInput() {
        pitchEngine.stop()
    }

    // MARK: - Private

    private var hasSubscribers: Bool {
        subscriberLock.lock()
        defer { subscriberLock.unlock() }
        return !simpleHandlers.isEmpty || !hostTimeHandlers.isEmpty
    }

    /// 設定画面のモニタ表示用。ゲーム購読が無いときだけプレビュー起動する。
    var hasActiveSubscribers: Bool { hasSubscribers }

    private func attachUpstreamIfNeeded() {
        guard upstream.isEmpty else {
            Task { await refreshActiveInput() }
            return
        }

        upstream = [
            midiManager.subscribe { [weak self] status, note, velocity in
                self?.forward(.midi, status: status, note: note, velocity: velocity)
            },
            midiManager.subscribeWithHostTime { [weak self] status, note, velocity, hostTime in
                self?.forward(.midi, status: status, note: note, velocity: velocity, hostTime: hostTime)
            },
            pitchEngine.subscribe { [weak self] status, note, velocity in
                self?.forward(.voice, status: status, note: note, velocity: velocity)
            },
            pitchEngine.subscribeWithHostTime { [weak self] status, note, velocity, hostTime in
                self?.forward(.voice, status: status, note: note, velocity: velocity, hostTime: hostTime)
            },
        ]

        Task { await refreshActiveInput() }
    }

    private func releaseUpstreamIfIdle() {
        guard !hasSubscribers else { return }
        upstream.forEach { $0.cancel() }
        upstream.removeAll()
        voicePreparing = false
        // 最後の購読が外れたらマイクを解放し、AVAudioSession を .playback に戻す。
        pitchEngine.stop()
    }

    nonisolated private func forward(
        _ source: NoteInputMethod,
        status: UInt8,
        note: UInt8,
        velocity: UInt8
    ) {
        guard source == activeMethod else { return }
        subscriberLock.lock()
        let handlers = Array(simpleHandlers.values)
        subscriberLock.unlock()
        for handler in handlers {
            handler(status, note, velocity)
        }
    }

    nonisolated private func forward(
        _ source: NoteInputMethod,
        status: UInt8,
        note: UInt8,
        velocity: UInt8,
        hostTime: UInt64
    ) {
        guard source == activeMethod else { return }
        subscriberLock.lock()
        let handlers = Array(hostTimeHandlers.values)
        subscriberLock.unlock()
        for handler in handlers {
            handler(status, note, velocity, hostTime)
        }
    }
}

final class NoteInputSubscriptionToken: MIDISubscription {
    private weak var manager: NoteInputManager?
    private let id: UUID
    private let isHostTime: Bool

    fileprivate init(manager: NoteInputManager, id: UUID, isHostTime: Bool) {
        self.manager = manager
        self.id = id
        self.isHostTime = isHostTime
    }

    func cancel() {
        manager?.removeSubscriber(id: id, isHostTime: isHostTime)
    }
}
