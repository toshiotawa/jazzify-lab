import AVFoundation
import UIKit
import XCTest
@testable import Jazzify

final class EarTrainingAudioCaptureTests: XCTestCase {
    func testCanActivateAudioBlocksBackgroundState() {
        XCTAssertFalse(AppAudioSession.canActivateAudio(applicationState: .background, isBackgrounded: false))
        XCTAssertFalse(AppAudioSession.canActivateAudio(applicationState: .active, isBackgrounded: true))
        XCTAssertFalse(AppAudioSession.canActivateAudio(applicationState: .inactive, isBackgrounded: true))
        XCTAssertTrue(AppAudioSession.canActivateAudio(applicationState: .active, isBackgrounded: false))
        XCTAssertTrue(AppAudioSession.canActivateAudio(applicationState: .inactive, isBackgrounded: false))
    }

    func testIsCannotStartPlayingErrorMatchesCode561015905() {
        let cannotStartPlaying = NSError(
            domain: NSOSStatusErrorDomain,
            code: 561015905
        )
        let otherError = NSError(
            domain: NSOSStatusErrorDomain,
            code: -1
        )
        XCTAssertEqual(AVAudioSession.ErrorCode.cannotStartPlaying.rawValue, 561015905)
        XCTAssertTrue(AppAudioSession.isCannotStartPlayingError(cannotStartPlaying))
        XCTAssertFalse(AppAudioSession.isCannotStartPlayingError(otherError))
    }

    func testPreferredHardwareSampleRateFallsBackWhenSessionRateIsZero() {
        XCTAssertEqual(EarTrainingAudio.preferredHardwareSampleRate(fromSessionSampleRate: 0), 48_000)
        XCTAssertEqual(EarTrainingAudio.preferredHardwareSampleRate(fromSessionSampleRate: -1), 48_000)
    }

    func testPreferredHardwareSampleRateUsesSessionRate() {
        XCTAssertEqual(EarTrainingAudio.preferredHardwareSampleRate(fromSessionSampleRate: 44_100), 44_100)
        XCTAssertEqual(EarTrainingAudio.preferredHardwareSampleRate(fromSessionSampleRate: 48_000), 48_000)
    }

    func testPreferredOutputFormatMatchesSessionRate() {
        let format = EarTrainingAudio.preferredOutputFormat(sampleRate: 48_000)
        XCTAssertEqual(format.sampleRate, 48_000, accuracy: 0.001)
        XCTAssertEqual(format.channelCount, 2)
    }

    func testCachedLocalFileURLIfPresentReturnsNilWhenMissing() {
        let cache = RemoteAudioFileCache(subdirectory: "EarTrainingAudioCaptureTests-\(UUID().uuidString)")
        let remote = URL(string: "https://example.com/missing-\(UUID().uuidString).mp3")!
        XCTAssertNil(cache.cachedLocalFileURLIfPresent(for: remote))
    }

    func testCachedLocalFileURLIfPresentReturnsFileURLDirectly() throws {
        let cache = RemoteAudioFileCache(subdirectory: "EarTrainingAudioCaptureTests-\(UUID().uuidString)")
        let tempDir = FileManager.default.temporaryDirectory
        let local = tempDir.appendingPathComponent("phrase-\(UUID().uuidString).mp3")
        try Data([0x00]).write(to: local)
        defer { try? FileManager.default.removeItem(at: local) }
        XCTAssertEqual(cache.cachedLocalFileURLIfPresent(for: local), local)
    }

    func testResolveSampleRatePrefersOutputNodeRate() {
        XCTAssertEqual(
            AudioOutputFormatResolver.resolveSampleRate(outputNodeSampleRate: 48_000, sessionSampleRate: 44_100),
            48_000,
            accuracy: 0.001
        )
    }

    func testResolveSampleRateFallsBackToSession() {
        XCTAssertEqual(
            AudioOutputFormatResolver.resolveSampleRate(outputNodeSampleRate: 0, sessionSampleRate: 44_100),
            44_100,
            accuracy: 0.001
        )
        XCTAssertEqual(
            AudioOutputFormatResolver.resolveSampleRate(outputNodeSampleRate: Double.nan, sessionSampleRate: 48_000),
            48_000,
            accuracy: 0.001
        )
    }

    func testResolveSampleRateFallsBackTo48k() {
        XCTAssertEqual(
            AudioOutputFormatResolver.resolveSampleRate(outputNodeSampleRate: 0, sessionSampleRate: 0),
            48_000,
            accuracy: 0.001
        )
    }

    func testSampleRatesMatchTolerance() {
        XCTAssertFalse(AudioOutputFormatResolver.sampleRatesMatch(44_100, 48_000))
        XCTAssertTrue(AudioOutputFormatResolver.sampleRatesMatch(48_000, 48_000.5))
        XCTAssertFalse(AudioOutputFormatResolver.sampleRatesMatch(0, 48_000))
        XCTAssertFalse(AudioOutputFormatResolver.sampleRatesMatch(48_000, Double.nan))
    }

    func testRemapPhaseFrame441To48kMidpoint() {
        let mapped = AudioOutputFormatResolver.remapPhaseFrame(
            phaseFrame: 88_200,
            oldCycleFrames: 176_400,
            newCycleFrames: 192_000
        )
        XCTAssertEqual(mapped, 96_000)
    }

    func testRemapPhaseFrame48kTo441End() {
        let mapped = AudioOutputFormatResolver.remapPhaseFrame(
            phaseFrame: 191_999,
            oldCycleFrames: 192_000,
            newCycleFrames: 176_400
        )
        XCTAssertEqual(mapped, 176_399)
    }

    func testRemapPhaseFrameBoundaries() {
        XCTAssertEqual(AudioOutputFormatResolver.remapPhaseFrame(phaseFrame: -5, oldCycleFrames: 100, newCycleFrames: 200), 0)
        XCTAssertEqual(AudioOutputFormatResolver.remapPhaseFrame(phaseFrame: 99, oldCycleFrames: 100, newCycleFrames: 200), 198)
        XCTAssertEqual(AudioOutputFormatResolver.remapPhaseFrame(phaseFrame: 999, oldCycleFrames: 100, newCycleFrames: 200), 198)
        XCTAssertEqual(AudioOutputFormatResolver.remapPhaseFrame(phaseFrame: 199, oldCycleFrames: 200, newCycleFrames: 100), 99)
        XCTAssertEqual(AudioOutputFormatResolver.remapPhaseFrame(phaseFrame: 10, oldCycleFrames: 0, newCycleFrames: 200), 0)
        XCTAssertEqual(AudioOutputFormatResolver.remapPhaseFrame(phaseFrame: 10, oldCycleFrames: 100, newCycleFrames: 0), 0)
    }

    func testShouldSuppressRouteChangeWhenSampleRateChangesInWindow() {
        XCTAssertFalse(
            AudioOutputFormatResolver.shouldSuppressRouteChange(
                reason: .routeConfigurationChange,
                withinSuppressionWindow: true,
                currentSampleRate: 48_000,
                lastAppliedSampleRate: 44_100
            )
        )
    }

    func testShouldSuppressRouteChangeSameRateInWindow() {
        XCTAssertTrue(
            AudioOutputFormatResolver.shouldSuppressRouteChange(
                reason: .routeConfigurationChange,
                withinSuppressionWindow: true,
                currentSampleRate: 48_000,
                lastAppliedSampleRate: 48_000
            )
        )
    }

    func testShouldSuppressRouteChangeOutsideWindow() {
        XCTAssertFalse(
            AudioOutputFormatResolver.shouldSuppressRouteChange(
                reason: .routeConfigurationChange,
                withinSuppressionWindow: false,
                currentSampleRate: 48_000,
                lastAppliedSampleRate: 48_000
            )
        )
    }

    func testShouldSuppressRouteChangeNewDeviceIgnoredInWindow() {
        XCTAssertFalse(
            AudioOutputFormatResolver.shouldSuppressRouteChange(
                reason: .newDeviceAvailable,
                withinSuppressionWindow: true,
                currentSampleRate: 48_000,
                lastAppliedSampleRate: 44_100
            )
        )
    }

    func testDefenseTutorialAudioSynthesizeHonorsSampleRate() {
        let midis = [60, 64, 67]
        let rates: [Double] = [44_100, 48_000]
        for rate in rates {
            let buffer = DefenseTutorialAudio.synthesize(concertMidis: midis, sampleRate: rate)
            XCTAssertNotNil(buffer)
            XCTAssertEqual(buffer?.format.sampleRate ?? 0, rate, accuracy: 0.001)
            let expected = AVAudioFrameCount((DefenseTutorialConstants.loopSec * rate).rounded(.up))
            XCTAssertEqual(buffer?.frameLength, expected)
        }
    }

    func testConvertBuffer441To48kLength() throws {
        guard let sourceFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2),
              let destFormat = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 2),
              let source = AVAudioPCMBuffer(pcmFormat: sourceFormat, frameCapacity: 44_100)
        else {
            XCTFail("format allocation failed")
            return
        }
        source.frameLength = 44_100
        let converted = EarTrainingAudio.convertBuffer(source, to: destFormat)
        XCTAssertNotNil(converted)
        XCTAssertEqual(converted?.format.sampleRate ?? 0, 48_000, accuracy: 0.001)
        let frames = Int(converted?.frameLength ?? 0)
        XCTAssertGreaterThanOrEqual(frames, 47_900)
        XCTAssertLessThanOrEqual(frames, 48_100)
    }

    func testConvertBuffer48kTo441LengthAndEnergy() throws {
        guard let sourceFormat = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 2),
              let destFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2),
              let source = AVAudioPCMBuffer(pcmFormat: sourceFormat, frameCapacity: 48_000)
        else {
            XCTFail("format allocation failed")
            return
        }
        source.frameLength = 48_000
        guard let channel = source.floatChannelData?[0] else {
            XCTFail("channel data missing")
            return
        }
        var sourceEnergy: Float = 0
        for index in 0..<48_000 {
            let value = Float(sin(2 * Double.pi * 440 * Double(index) / 48_000))
            channel[index] = value
            sourceEnergy += value * value
        }
        if source.format.channelCount > 1, let right = source.floatChannelData?[1] {
            right.update(from: channel, count: 48_000)
        }

        let converted = EarTrainingAudio.convertBuffer(source, to: destFormat)
        XCTAssertNotNil(converted)
        XCTAssertEqual(converted?.format.sampleRate ?? 0, 44_100, accuracy: 0.001)
        let frames = Int(converted?.frameLength ?? 0)
        XCTAssertGreaterThanOrEqual(frames, 44_000)
        XCTAssertLessThanOrEqual(frames, 44_200)

        guard let outCh = converted?.floatChannelData?[0] else {
            XCTFail("converted channel missing")
            return
        }
        var convertedEnergy: Float = 0
        for index in 0..<frames {
            convertedEnergy += outCh[index] * outCh[index]
        }
        XCTAssertGreaterThan(convertedEnergy, sourceEnergy * 0.5)
    }
}
