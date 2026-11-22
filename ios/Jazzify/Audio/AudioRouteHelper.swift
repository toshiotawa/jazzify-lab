import AVFoundation
import os

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
    static let preferredHighRate: Double = 48_000

    static func resolveSampleRate(
        outputNodeSampleRate: Double,
        sessionSampleRate: Double,
        isEngineRunning: Bool = true,
        fallbackSampleRate: Double = fallbackSampleRate
    ) -> Double {
        if isEngineRunning, outputNodeSampleRate.isFinite, outputNodeSampleRate > 0 {
            return outputNodeSampleRate
        }
        if sessionSampleRate.isFinite, sessionSampleRate > 0 {
            return sessionSampleRate
        }
        if outputNodeSampleRate.isFinite, outputNodeSampleRate > 0 {
            return outputNodeSampleRate
        }
        return fallbackSampleRate
    }

    static func resolveSampleRate(
        engine: AVAudioEngine?,
        session: AVAudioSession = .sharedInstance()
    ) -> Double {
        let isRunning = engine?.isRunning ?? false
        let outputRate = engine?.outputNode.outputFormat(forBus: 0).sampleRate ?? 0
        return resolveSampleRate(
            outputNodeSampleRate: outputRate,
            sessionSampleRate: session.sampleRate,
            isEngineRunning: isRunning
        )
    }

    static func preferredSessionSampleRate(
        recordingEnabled: Bool,
        isScreenCaptured: Bool
    ) -> Double {
        (recordingEnabled || isScreenCaptured) ? preferredHighRate : 0
    }

    static func postStartMismatchedRate(
        actualOutputSampleRate: Double,
        expectedSampleRate: Double,
        toleranceHz: Double = sampleRateToleranceHz
    ) -> Double? {
        guard actualOutputSampleRate.isFinite, actualOutputSampleRate > 0 else { return nil }
        guard !sampleRatesMatch(actualOutputSampleRate, expectedSampleRate, toleranceHz: toleranceHz) else {
            return nil
        }
        return actualOutputSampleRate
    }

    static func postStartMismatchedRate(
        engine: AVAudioEngine,
        expectedSampleRate: Double
    ) -> Double? {
        let actualRate = engine.outputNode.outputFormat(forBus: 0).sampleRate
        return postStartMismatchedRate(
            actualOutputSampleRate: actualRate,
            expectedSampleRate: expectedSampleRate
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

/// セッション設定・エンジン起動イベント時のみ出力する軽量なサンプルレート診断ログ。
enum AudioRateDiagnostics {
    private static let logger = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "jp.jazzify.app",
        category: "AudioRate"
    )

    static func logSessionConfigure(
        session: AVAudioSession = .sharedInstance(),
        isCaptured: Bool,
        recordingEnabled: Bool,
        preferredSampleRate: Double,
        targetIOBufferDuration: TimeInterval,
        didChange: Bool
    ) {
        let outputs = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        let category = session.category.rawValue
        let mode = session.mode.rawValue
        let actualRate = session.sampleRate
        let actualBuffer = session.ioBufferDuration
        logger.info(
            "sessionConfigure cat=\(category, privacy: .public) mode=\(mode, privacy: .public) captured=\(isCaptured, privacy: .public) rec=\(recordingEnabled, privacy: .public) prefRate=\(preferredSampleRate, privacy: .public) actualRate=\(actualRate, privacy: .public) targetBuf=\(targetIOBufferDuration, privacy: .public) actualBuf=\(actualBuffer, privacy: .public) outputs=\(outputs, privacy: .public) didChange=\(didChange, privacy: .public)"
        )
    }

    static func logEngineStart(
        tag: String,
        engine: AVAudioEngine,
        deckSampleRate: Double,
        bufferSampleRate: Double? = nil,
        didRetry: Bool = false,
        session: AVAudioSession = .sharedInstance()
    ) {
        let outRate = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let outInRate = engine.outputNode.inputFormat(forBus: 0).sampleRate
        let mixerRate = engine.mainMixerNode.outputFormat(forBus: 0).sampleRate
        let sessionRate = session.sampleRate
        let bufRate = bufferSampleRate ?? -1
        let outputs = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        logger.info(
            "engineStart tag=\(tag, privacy: .public) deckRate=\(deckSampleRate, privacy: .public) bufRate=\(bufRate, privacy: .public) outNodeOut=\(outRate, privacy: .public) outNodeIn=\(outInRate, privacy: .public) mainMixer=\(mixerRate, privacy: .public) sessionRate=\(sessionRate, privacy: .public) retry=\(didRetry, privacy: .public) outputs=\(outputs, privacy: .public)"
        )
    }
}
