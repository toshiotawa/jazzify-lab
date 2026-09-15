import AVFoundation
import XCTest
@testable import Jazzify

final class SurvivalRootBassRoutePolicyTests: XCTestCase {
    func testUsesBuiltInSpeakerOnlyWhenBuiltInSpeakerInRoute() {
        XCTAssertTrue(SurvivalRootBassRoutePolicy.usesBuiltInSpeaker(portTypes: [.builtInSpeaker]))
        XCTAssertFalse(SurvivalRootBassRoutePolicy.usesBuiltInSpeaker(portTypes: [.headphones]))
        XCTAssertFalse(SurvivalRootBassRoutePolicy.usesBuiltInSpeaker(portTypes: [.bluetoothA2DP]))
        XCTAssertFalse(SurvivalRootBassRoutePolicy.usesBuiltInSpeaker(portTypes: [.usbAudio]))
        XCTAssertFalse(SurvivalRootBassRoutePolicy.usesBuiltInSpeaker(portTypes: []))
    }

    func testGainBoostsSpeakerRouteOnly() {
        let normal = SurvivalRootBassRoutePolicy.gain(isBuiltInSpeaker: false)
        XCTAssertEqual(normal.mixerGain, 1.0, accuracy: 0.0001)
        XCTAssertEqual(normal.velocity, 100)

        let speaker = SurvivalRootBassRoutePolicy.gain(isBuiltInSpeaker: true)
        XCTAssertEqual(speaker.mixerGain, 1.6, accuracy: 0.0001)
        XCTAssertEqual(speaker.velocity, 127)
    }

    func testHighShelfGainOnlyOnSpeaker() {
        XCTAssertEqual(
            SurvivalRootBassRoutePolicy.highShelfGainDb(isBuiltInSpeaker: false),
            0,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            SurvivalRootBassRoutePolicy.highShelfGainDb(isBuiltInSpeaker: true),
            8,
            accuracy: 0.0001
        )
    }
}
