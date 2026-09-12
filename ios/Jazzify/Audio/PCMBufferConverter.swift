import AVFoundation

/// PCM バッファをハードウェア／セッションのサンプルレートへ変換する。
enum PCMBufferConverter {
    static func preferredHardwareSampleRate(fromSessionSampleRate rate: Double) -> Double {
        rate > 0 ? rate : 48_000
    }

    static func preferredOutputFormat(session: AVAudioSession = .sharedInstance()) -> AVAudioFormat {
        let rate = preferredHardwareSampleRate(fromSessionSampleRate: session.sampleRate)
        return AVAudioFormat(standardFormatWithSampleRate: rate, channels: 2)!
    }

    static func convert(_ source: AVAudioPCMBuffer, to format: AVAudioFormat) -> AVAudioPCMBuffer? {
        if source.format.sampleRate == format.sampleRate,
           source.format.channelCount == format.channelCount {
            return source
        }
        guard let converter = AVAudioConverter(from: source.format, to: format) else {
            return nil
        }
        let ratio = format.sampleRate / source.format.sampleRate
        let outCapacity = AVAudioFrameCount(ceil(Double(source.frameLength) * ratio))
        guard let output = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: outCapacity) else {
            return nil
        }

        var error: NSError?
        var consumed = false
        let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
            if consumed {
                outStatus.pointee = .noDataNow
                return nil
            }
            consumed = true
            outStatus.pointee = .haveData
            return source
        }
        converter.convert(to: output, error: &error, withInputFrom: inputBlock)
        guard error == nil, output.frameLength > 0 else {
            return nil
        }
        return output
    }

    static func convertToPreferredOutputFormat(_ source: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
        convert(source, to: preferredOutputFormat())
    }
}
