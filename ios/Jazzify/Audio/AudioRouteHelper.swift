import AVFoundation

/// AVAudioSession の出力ルート判定を共通化する。
enum AudioRouteHelper {
    /// ヘッドホン / 外部出力が接続されているか。
    /// 内蔵スピーカーのみのとき false（VPIO / エコーキャンセル推奨）。
    static func hasHeadphoneOutput(session: AVAudioSession = .sharedInstance()) -> Bool {
        session.currentRoute.outputs.contains { output in
            output.portType == .headphones
                || output.portType == .bluetoothA2DP
                || output.portType == .bluetoothHFP
                || output.portType == .usbAudio
        }
    }
}

/// AVAudioEngine 出力バスと AVAudioSession から実効サンプルレートを解決する。
enum AudioOutputFormatResolver {
    static let fallbackSampleRate: Double = 48_000
    static let sampleRateToleranceHz: Double = 1.0

    static func resolveSampleRate(
        outputNodeSampleRate: Double,
        sessionSampleRate: Double,
        fallbackSampleRate: Double = fallbackSampleRate
    ) -> Double {
        if outputNodeSampleRate.isFinite, outputNodeSampleRate > 0 {
            return outputNodeSampleRate
        }
        if sessionSampleRate.isFinite, sessionSampleRate > 0 {
            return sessionSampleRate
        }
        return fallbackSampleRate
    }

    static func resolveSampleRate(
        engine: AVAudioEngine?,
        session: AVAudioSession = .sharedInstance()
    ) -> Double {
        let outputRate = engine?.outputNode.outputFormat(forBus: 0).sampleRate ?? 0
        return resolveSampleRate(
            outputNodeSampleRate: outputRate,
            sessionSampleRate: session.sampleRate
        )
    }

    static func stereoFormat(sampleRate: Double) -> AVAudioFormat {
        let resolved = resolveSampleRate(outputNodeSampleRate: sampleRate, sessionSampleRate: 0)
        return AVAudioFormat(standardFormatWithSampleRate: resolved, channels: 2)!
    }

    static func stereoFormat(
        engine: AVAudioEngine?,
        session: AVAudioSession = .sharedInstance()
    ) -> AVAudioFormat {
        let rate = resolveSampleRate(engine: engine, session: session)
        return stereoFormat(sampleRate: rate)
    }

    static func sampleRatesMatch(
        _ lhs: Double,
        _ rhs: Double,
        toleranceHz: Double = sampleRateToleranceHz
    ) -> Bool {
        guard lhs.isFinite, rhs.isFinite, lhs > 0, rhs > 0 else { return false }
        return abs(lhs - rhs) < toleranceHz
    }

    static func remapPhaseFrame(
        phaseFrame: Int,
        oldCycleFrames: Int,
        newCycleFrames: Int
    ) -> Int {
        let safeNew = max(1, newCycleFrames)
        guard oldCycleFrames > 0 else { return 0 }
        let clampedOld = max(0, min(phaseFrame, oldCycleFrames - 1))
        let fraction = Double(clampedOld) / Double(oldCycleFrames)
        let mapped = Int((fraction * Double(safeNew)).rounded())
        return max(0, min(mapped, safeNew - 1))
    }

    static func shouldSuppressRouteChange(
        reason: AVAudioSession.RouteChangeReason,
        withinSuppressionWindow: Bool,
        currentSampleRate: Double,
        lastAppliedSampleRate: Double?
    ) -> Bool {
        switch reason {
        case .categoryChange, .routeConfigurationChange, .override:
            guard withinSuppressionWindow else { return false }
            if currentSampleRate.isFinite, currentSampleRate > 0 {
                if let lastApplied = lastAppliedSampleRate,
                   sampleRatesMatch(currentSampleRate, lastApplied) {
                    return true
                }
                return false
            }
            return true
        default:
            return false
        }
    }
}
