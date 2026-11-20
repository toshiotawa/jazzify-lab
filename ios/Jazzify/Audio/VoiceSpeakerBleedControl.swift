import Foundation

/// 音声入力 × 出力ルートに応じた伴奏ダッキングと分離トラックメロディ抑制（純粋計算）。
enum VoiceInputAudioPolicy {
    static let defaultSpeakerDuckFactor: Float = 0.25
    static let defaultMelodyGain: Float = 0.5
    private static let noteOnThresholdQuietDb: Double = -34
    private static let noteOnThresholdLoudDb: Double = -26

    static func duckFactor(hasHeadphones: Bool, voiceInputActive: Bool) -> Float {
        guard voiceInputActive else { return 1 }
        return hasHeadphones ? 1 : defaultSpeakerDuckFactor
    }

    static func separateTracksMelodyGain(
        hasHeadphones: Bool,
        voiceInputActive: Bool,
        defaultGain: Float = defaultMelodyGain
    ) -> Float {
        if voiceInputActive, !hasHeadphones { return 0 }
        return defaultGain
    }

    /// ヘッドホン時は常に通過するよう十分低い閾値を返す。
    static func noteOnThresholdDb(hasHeadphones: Bool, effectiveOutputLevel: Float) -> Double {
        guard !hasHeadphones else { return -120 }
        let level = Double(max(0, min(1, effectiveOutputLevel)))
        return noteOnThresholdQuietDb + (noteOnThresholdLoudDb - noteOnThresholdQuietDb) * level
    }
}

struct VoiceInputPolicySnapshot: Sendable {
    let voiceInputActive: Bool
    let hasHeadphones: Bool
    let duckFactor: Float
    let separateTracksMelodyGain: Float
    let noteOnThresholdDb: Double
}

/// 直近チャンクの RMS をピークホールドで追跡し、スピーカー時の微弱漏れ音 noteOn を抑止する。
struct VoiceSpeakerInputGate: Sendable {
    private static let silenceDb: Double = -120
    private static let peakHoldMs: Double = 80

    private(set) var peakDb: Double = silenceDb
    private var peakHoldUntilMs: Double = 0

    mutating func recordChunkRms(linearRms: Double, nowMs: Double) {
        let db = Self.rmsLinearToDb(linearRms)
        if db > peakDb || nowMs >= peakHoldUntilMs {
            peakDb = db
            peakHoldUntilMs = nowMs + Self.peakHoldMs
        }
    }

    func allowsNoteOn(hasHeadphones: Bool, thresholdDb: Double) -> Bool {
        if hasHeadphones { return true }
        return peakDb >= thresholdDb
    }

    mutating func reset() {
        peakDb = Self.silenceDb
        peakHoldUntilMs = 0
    }

    static func rmsLinearToDb(_ rms: Double) -> Double {
        guard rms.isFinite, rms > 1e-12 else { return silenceDb }
        return 20 * log10(rms)
    }

    static func rmsFromFloatSamples(_ samples: UnsafePointer<Float>, count: Int) -> Double {
        guard count > 0 else { return 0 }
        var sum: Double = 0
        for index in 0..<count {
            let sample = Double(samples[index])
            sum += sample * sample
        }
        return sqrt(sum / Double(count))
    }
}

/// 音声入力ポリシーと入力ゲートの共有状態。ルート変更は main、RMS 記録はキャプチャ／推論スレッド。
final class VoiceSpeakerBleedCoordinator: @unchecked Sendable {
    static let shared = VoiceSpeakerBleedCoordinator()

    static let policyDidChangeNotification = Notification.Name("VoiceSpeakerBleedCoordinator.policyDidChange")

    private let lock = NSLock()
    private var gate = VoiceSpeakerInputGate()
    private var hasHeadphones = true
    private var voiceInputActive = false
    private var effectiveOutputLevel: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()

    private init() {}

    func refreshRouteFromSession() {
        let headphones = AudioRouteHelper.hasHeadphoneOutput()
        lock.lock()
        let changed = hasHeadphones != headphones
        hasHeadphones = headphones
        lock.unlock()
        if changed {
            postPolicyChange()
        }
    }

    func setVoiceInputActive(_ active: Bool) {
        lock.lock()
        let changed = voiceInputActive != active
        voiceInputActive = active
        if !active {
            gate.reset()
        }
        lock.unlock()
        if changed {
            postPolicyChange()
        }
    }

    func setEffectiveOutputLevel(_ level: Float) {
        let clamped = max(0, min(1, level))
        lock.lock()
        effectiveOutputLevel = clamped
        lock.unlock()
    }

    func snapshot() -> VoiceInputPolicySnapshot {
        lock.lock()
        defer { lock.unlock() }
        return VoiceInputPolicySnapshot(
            voiceInputActive: voiceInputActive,
            hasHeadphones: hasHeadphones,
            duckFactor: VoiceInputAudioPolicy.duckFactor(
                hasHeadphones: hasHeadphones,
                voiceInputActive: voiceInputActive
            ),
            separateTracksMelodyGain: VoiceInputAudioPolicy.separateTracksMelodyGain(
                hasHeadphones: hasHeadphones,
                voiceInputActive: voiceInputActive
            ),
            noteOnThresholdDb: VoiceInputAudioPolicy.noteOnThresholdDb(
                hasHeadphones: hasHeadphones,
                effectiveOutputLevel: effectiveOutputLevel
            )
        )
    }

    nonisolated func recordForwardChunkRms(linearRms: Double) {
        let nowMs = Self.monotonicMs()
        lock.lock()
        gate.recordChunkRms(linearRms: linearRms, nowMs: nowMs)
        lock.unlock()
    }

    nonisolated func shouldAllowNoteOn() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return gate.allowsNoteOn(
            hasHeadphones: hasHeadphones,
            thresholdDb: VoiceInputAudioPolicy.noteOnThresholdDb(
                hasHeadphones: hasHeadphones,
                effectiveOutputLevel: effectiveOutputLevel
            )
        )
    }

    private func postPolicyChange() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.postPolicyChange() }
            return
        }
        NotificationCenter.default.post(name: Self.policyDidChangeNotification, object: self)
    }

    private static func monotonicMs() -> Double {
        Double(DispatchTime.now().uptimeNanoseconds) / 1_000_000
    }
}