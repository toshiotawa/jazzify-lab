import AVFoundation
import Foundation
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

    static func hasBluetoothOutput(session: AVAudioSession = .sharedInstance()) -> Bool {
        session.currentRoute.outputs.contains { output in
            output.portType == .bluetoothA2DP
                || output.portType == .bluetoothHFP
                || output.portType == .bluetoothLE
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
        isScreenCaptured: Bool,
        isBluetoothOutput: Bool = false
    ) -> Double {
        if recordingEnabled {
            return preferredHighRate
        }
        if isScreenCaptured, !isBluetoothOutput {
            return preferredHighRate
        }
        return 0
    }

    static func postStartMismatchedRate(
        actualOutputSampleRate: Double,
        expectedSampleRate: Double,
        mainMixerOutputSampleRate: Double? = nil,
        outputNodeInputSampleRate: Double? = nil,
        toleranceHz: Double = sampleRateToleranceHz
    ) -> Double? {
        guard actualOutputSampleRate.isFinite, actualOutputSampleRate > 0 else { return nil }
        if !sampleRatesMatch(actualOutputSampleRate, expectedSampleRate, toleranceHz: toleranceHz) {
            return actualOutputSampleRate
        }
        if let mixerRate = mainMixerOutputSampleRate,
           mixerRate.isFinite, mixerRate > 0,
           !sampleRatesMatch(mixerRate, actualOutputSampleRate, toleranceHz: toleranceHz) {
            return actualOutputSampleRate
        }
        if let inputRate = outputNodeInputSampleRate,
           inputRate.isFinite, inputRate > 0,
           !sampleRatesMatch(inputRate, actualOutputSampleRate, toleranceHz: toleranceHz) {
            return actualOutputSampleRate
        }
        return nil
    }

    static func postStartMismatchedRate(
        engine: AVAudioEngine,
        expectedSampleRate: Double
    ) -> Double? {
        let actualRate = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let inputRate = engine.outputNode.inputFormat(forBus: 0).sampleRate
        let mixerRate = engine.mainMixerNode.outputFormat(forBus: 0).sampleRate
        return postStartMismatchedRate(
            actualOutputSampleRate: actualRate,
            expectedSampleRate: expectedSampleRate,
            mainMixerOutputSampleRate: mixerRate,
            outputNodeInputSampleRate: inputRate
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

    private static func emit(_ message: String) {
        logger.error("[AudioRate] \(message, privacy: .public)")
        if let data = "[AudioRate] \(message)\n".data(using: .utf8) {
            try? FileHandle.standardError.write(contentsOf: data)
        }
    }

    static func logSessionConfigure(
        session: AVAudioSession = .sharedInstance(),
        isCaptured: Bool,
        recordingEnabled: Bool,
        preferredSampleRate: Double,
        targetIOBufferDuration: TimeInterval,
        didChange: Bool
    ) {
        let inputs = session.currentRoute.inputs.map { $0.portType.rawValue }.joined(separator: ",")
        let outputs = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        let category = session.category.rawValue
        let mode = session.mode.rawValue
        let actualRate = session.sampleRate
        let actualBuffer = session.ioBufferDuration
        emit(
            "sessionConfigure cat=\(category) mode=\(mode) captured=\(isCaptured) rec=\(recordingEnabled) prefRate=\(preferredSampleRate) actualRate=\(actualRate) targetBuf=\(targetIOBufferDuration) actualBuf=\(actualBuffer) inputs=[\(inputs)] outputs=[\(outputs)] didChange=\(didChange)"
        )
    }

    static func logRouteChange(
        reason: AVAudioSession.RouteChangeReason,
        isCaptured: Bool,
        recordingEnabled: Bool,
        suppressed: Bool,
        session: AVAudioSession = .sharedInstance()
    ) {
        let inputs = session.currentRoute.inputs.map { $0.portType.rawValue }.joined(separator: ",")
        let outputs = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        emit(
            "routeChange reason=\(reason.rawValue) captured=\(isCaptured) rec=\(recordingEnabled) sessionRate=\(session.sampleRate) inputs=[\(inputs)] outputs=[\(outputs)] suppressed=\(suppressed)"
        )
    }

    static func logPitchInputStart(
        inputNode: AVAudioInputNode,
        connectSampleRate: Double,
        session: AVAudioSession = .sharedInstance()
    ) {
        let hwIn = inputNode.inputFormat(forBus: 0).sampleRate
        let nodeOut = inputNode.outputFormat(forBus: 0).sampleRate
        let inputs = session.currentRoute.inputs.map { $0.portType.rawValue }.joined(separator: ",")
        let outputs = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        emit(
            "pitchInputStart hwIn=\(hwIn) nodeOut=\(nodeOut) connectRate=\(connectSampleRate) sessionRate=\(session.sampleRate) inputs=[\(inputs)] outputs=[\(outputs)]"
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
        let running = engine.isRunning
        let inputs = session.currentRoute.inputs.map { $0.portType.rawValue }.joined(separator: ",")
        let outputs = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        emit(
            "engineStart tag=\(tag) running=\(running) deckRate=\(deckSampleRate) bufRate=\(bufRate) outNodeOut=\(outRate) outNodeIn=\(outInRate) mainMixer=\(mixerRate) sessionRate=\(sessionRate) retry=\(didRetry) inputs=[\(inputs)] outputs=[\(outputs)]"
        )
    }
}
