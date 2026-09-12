import AVFoundation
import XCTest
@testable import Jazzify

final class PCMBufferConverterTests: XCTestCase {
    func testPreferredHardwareSampleRateFallsBackWhenInvalid() {
        XCTAssertEqual(PCMBufferConverter.preferredHardwareSampleRate(fromSessionSampleRate: 0), 48_000)
        XCTAssertEqual(PCMBufferConverter.preferredHardwareSampleRate(fromSessionSampleRate: -1), 48_000)
    }

    func testConvert44100StereoTo48000() {
        let sourceFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2)!
        let sourceFrames: AVAudioFrameCount = 4410
        guard let source = AVAudioPCMBuffer(pcmFormat: sourceFormat, frameCapacity: sourceFrames) else {
            XCTFail("source buffer")
            return
        }
        source.frameLength = sourceFrames

        let targetFormat = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 2)!
        guard let converted = PCMBufferConverter.convert(source, to: targetFormat) else {
            XCTFail("conversion failed")
            return
        }

        XCTAssertEqual(converted.format.sampleRate, 48_000, accuracy: 0.001)
        XCTAssertEqual(converted.format.channelCount, 2)
        let sourceDuration = Double(sourceFrames) / sourceFormat.sampleRate
        let convertedDuration = Double(converted.frameLength) / converted.format.sampleRate
        XCTAssertEqual(convertedDuration, sourceDuration, accuracy: 0.01)
        XCTAssertGreaterThan(converted.frameLength, 0)
    }

    func testConvertSkipsWhenFormatMatches() {
        let format = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 2)!
        guard let source = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 128) else {
            XCTFail("source buffer")
            return
        }
        source.frameLength = 128
        let converted = PCMBufferConverter.convert(source, to: format)
        XCTAssertTrue(converted === source)
    }
}
