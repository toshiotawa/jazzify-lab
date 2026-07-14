import AVFoundation
import XCTest
@testable import Jazzify

final class EarTrainingAudioCaptureTests: XCTestCase {
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
}
